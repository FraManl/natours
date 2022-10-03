const Review = require('../models/reviewModel');
const factory = require('./handlerFactory');

// exports.getAllReviews = catchAsync(async (req, res, next) => {
//   let filter;
//   if (req.params.tourId) filter = { tour: req.params.tourId };

//   const reviews = await Review.find(filter);
//   res.status(200).json({
//     status: 'success',
//     results: reviews.length,
//     data: {
//       reviews,
//     },
//   });
// });
exports.getAllReviews = factory.getAll(Review);

// exports.getReview = catchAsync(async (req, res, next) => {
//   const review = await Review.findById(req.params.id);
//   if (!review) {
//     return next(new AppError('No review found with that ID', 404)); // need return and end function here, cannot send 2 responses in the same function
//   }

//   res.status(200).json({
//     status: 'success',
//     data: {
//       review,
//     },
//   });
// });
exports.getReview = factory.getOne(Review);

// decouple function own specific syntax inside a dedicated middleware, that will work with the handlerFactory generalization
exports.setTourUserIds = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id; // req.user comes from protect middleware};
  next();
};

// exports.createReview = catchAsync(async (req, res, next) => {
//   // allow nested routes
//   if (!req.body.tour) req.body.tour = req.params.tourId;
//   if (!req.body.user) req.body.user = req.user.id; // req.user comes from protect middleware

//   const newReview = await Review.create(req.body);
//   res.status(201).json({
//     status: 'success',
//     message: 'Review created with success!',
//     data: {
//       review: newReview,
//     },
//   });
// });
exports.createReview = factory.createOne(Review);

exports.updateReview = factory.updateOne(Review);

exports.deleteReview = factory.deleteOne(Review);
