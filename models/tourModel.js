const mongoose = require('mongoose');
const slugify = require('slugify');
const User = require('./userModel');
// const validator = require('validator');

// basic document schema
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must have less or equal then 40 characters'],
      minlength: [10, 'A tour name must have more or equal then 10 characters'],
      // validate: [validator.isAlpha, 'Tour name must only contain characters'],
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either easy, medium or difficult',
      },
    },
    rating: { type: Number, default: 4.5 },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: (val) => Math.round(val * 10) / 10,
    },
    slug: String,
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: { type: Number, requied: [true, 'A tour must have a price'] },
    priceDiscount: {
      type: Number,
      // validate: function (val) {
      //   return val < this.price;
      // },
      validator: {
        validate: function (val) {
          // here val points only towards current NEW document, not existing ones (updates)...
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below regular price',
      },
    },
    summary: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description'],
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secreteTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      // geojson
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    // creating an embedded document/dataset : array of object
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    // this creates relationship between objects user and tours
    guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// single field index / compound field index
// role of indexes : improve read performances
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' }); // earth like sphere

// define virtual properties ( not stored in db, but computed ) = very practical !
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// connect 2 models together virtually with child referencing, without having to populate unecessarily the requests..
// practical when we know we have to child reference to an collection that gros very large.... (makes query run too long)
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

// we can have middlewares running before or after certain events, with access to this keyword
// define mongoose document middleware : runs before .save() and .create() : triggered if using API with save behavior, such as creating a tour
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

tourSchema.pre('save', async function (next) {
  const guidesPromises = this.guides.map(async (id) => await User.findById(id));
  this.guides = await Promise.all(guidesPromises); // we use Promise.all because the result of the map() is an array full of promises...so need to await them
  next();
});
// tourSchema.pre('save', function (next) {
//   next();
// });

// // define post middleware : executed after all pre middleware functions
// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

// define mongoose query middleware : runs before or after queries
// example: pre('find') hook, with regex /^find/, to scan for any function that starts with find
tourSchema.pre(/^find/, function (next) {
  this.find({ secreteTour: { $ne: true } });
  this.start = Date.now();
  next();
});

tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took: ${Date.now() - this.start} milliseconds`);
  next();
});

tourSchema.pre(/^find/, function (next) {
  // we can use a middleware function to query for those kind of queries (this.) points to the current query object
  // automatic embedded filling when using those queries
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  next();
});

// define mongoose aggregation middleware : runs before or after aggregation function
// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secreteTour: { $ne: true } } });
//   console.log(this.pipeline());
//   next();
// });

// create a model with the schema (like a class)
// we do all this in order for the future tours to be able to interact with the database...
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
