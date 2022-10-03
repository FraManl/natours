const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Booking = require('../models/bookingModel');

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1 : get tour data from collection
  const tours = await Tour.find();
  // 2 : build the template
  // 3 : render the template using tour data from 1.
  res.status(200).render('overview', { title: 'All Tours', tours: tours });
});

exports.getTour = catchAsync(async (req, res, next) => {
  // get tour (guides + reviews)
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user',
  });
  // build template
  // render template

  if (!tour) {
    return next(new AppError('There is no tour with that name', 404));
  }

  res.status(200).render('tour', { title: `${tour.name} Tour`, tour: tour });
});

exports.getLoginForm = (req, res, next) => {
  res.status(200).render('login', { title: 'Login into your account' });
};

exports.getMe = (req, res, next) => {
  res.status(200).render('account', { title: 'Your account' });
};

exports.getMyTours = catchAsync(async (req, res, next) => {
  // find all bookings
  const bookings = await Booking.find({ user: req.user.id });

  // find tours with the returned Ids
  const tourIDs = bookings.map((el) => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIDs } });

  res.status(200).render('overview', { title: 'My Tours', tours });
});

// exports.updateUserData = catchAsync(async (req, res, next) => {
//   const updatedUser = await User.findByIdAndUpdate(
//     req.user.id,
//     {
//       name: req.body.name,
//       email: req.body.email,
//     },
//     {
//       new: true,
//       runValidators: true,
//     }
//   );

//   res
//     .status(200)
//     .render('account', { title: 'Your Account', user: updatedUser });
// });
