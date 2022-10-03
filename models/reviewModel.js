const mongoose = require('mongoose');

const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'A review must have a name'],
    },
    createdAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must be sent by at least 1 user'],
    },
  },
  {
    // make sure that if we have a virtual property, it appears in the output
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// build an index of unique combinations of tourId and userId (1 user can only write 1 review per tour)
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  // we can use a middleware function to query for those kind of queries (this.) points to the current query object
  // automatic embedded filling when using those queries
  // but becareful this creates nested data inside objects which we don't need, that can overburden the output (review that calls tour, that calls user, that call tour....)
  //   this.populate({
  //     path: 'tour',
  //     select: 'name',
  //   }).populate({
  //     path: 'user',
  //     select: 'name photo',
  //   });
  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

// static method on the schema : calculate average ratings
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    // this points to model, and it returns a promise
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  // persist calculations (promise)
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

// post because we calculate only after doc is saved and data accessible in db
// calculate average only once saved
reviewSchema.post('save', function () {
  // this points to current document (review)
  // why constructor, because Review is not defined at this point, but we still can access this (document) constructor which is the reviewSchema itself
  this.constructor.calcAverageRatings(this.tour);
});

// hooks on findByIdAndUpdate-Delete
// calculate average on reviews updates & deletes (refresh, not only savings)
reviewSchema.pre(/^findOneAnd/, async function (next) {
  // this points to current query
  // we create a property on 'this' variable, to propagate tourId into next middleware
  this.r = await this.findOne();
  next();
});

// trick to propagate
reviewSchema.post(/^findOneAnd/, async function () {
  // we cannot do this here, because query is already executed at this point
  // await this.findOne()

  // this function is called on the model itself
  // its the equivalent of this.r.constructor.calcAverageRatings()
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
