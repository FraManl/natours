const Tour = require('../models/tourModel');

exports.aliasTopTours = async (req, res, next) => {
  // pre-filling default queries params, so user does not have to do it...
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name, price, ratingsAverage, summary, difficulty';
  next();
};

class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {}
}

exports.getAllTours = async (req, res) => {
  try {
    //1 - Build the query : with mongoose we can chain queries : query.sort.skip.limit...
    // a. basic filtering
    // const tours = await Tour.find(); // returns an array (w/o query)
    const queryObj = { ...req.query }; // we need real copy of req.query
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);
    // const tours = await Tour;find().where('duration').equals(5).where('difficulty').equals('easy') // mongoose way

    // b. advanced filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    let query = Tour.find(JSON.parse(queryStr));

    // c. sorting : tours?sort=price // tours?sort=-price
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
      // multiple sort
      // sort('price ratings') : tours?sort=price,-ratings
    } else {
      query = query.sort('-createdAt'); // default sorting
    }

    // d. field limiting : tours?fields=name,price,rating,duration
    if (req.query.fields) {
      const fields = req.query.fields.split(',').join(' ');
      query = query.select(fields);
    } else {
      query = query.select('-__v'); // excluding by default this field
    }

    // e. pagination : page=2&limit=10, 1-10 is page 1, 11-20 is page 2, 21-30 is page 3...

    const page = req.query.page * 1 || 1; // defaulting value w/ shortcutting
    const limit = req.query.limit * 1 || 100;
    const skip = (page - 1) * limit;

    query = query.skip(skip).limit(limit);

    if (req.query.page) {
      const numTours = await Tour.countDocuments();
      if (skip >= numTours) throw new Error('This page does not exist'); // throw Error here makes the error get caught and move to next catch block below (404)
    }

    // 2 - Execute the query
    const tours = await query;

    // 3 - Send response
    res.status(200).json({
      status: 'success',
      results: tours.length,
      data: {
        tours,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: 'Invalid',
    });
  }
};

exports.getTour = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id); // shorthand for Tour.findOne(({_id: req.params.id}))
    res.status(200).json({
      status: 'success',
      data: {
        tour,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.createTour = async (req, res) => {
  try {
    const newTour = await Tour.create(req.body);
    res.status(201).json({
      status: 'success',
      data: { tour: newTour },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: 'Invalid data sent!',
    });
  }
};

exports.updateTour = async (req, res) => {
  try {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({
      status: 'success',
      data: tour,
    });
  } catch (err) {
    res.status(404).json({ status: 'fail', message: err });
  }
};

exports.deleteTour = async (req, res) => {
  try {
    await Tour.findByIdAndDelete(req.params.id);
    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};
