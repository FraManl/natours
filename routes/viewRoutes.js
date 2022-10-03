const express = require('express');
const viewsController = require('../controllers/viewsController');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

// router.use(authController.isLoggedIn); use for everything, not that smart, duplicated execution...

// Template engine route
// we usually use get to render webpages : .get().render()
// express & pug will automatically look for the template base inside views folder
// then it will send this template as a response to the web browser
// to pass data into the template, we define an object

router.get(
  '/',
  bookingController.createBookingCheckout,
  authController.isLoggedIn,
  viewsController.getOverview
);
router.get('/tour/:slug', authController.isLoggedIn, viewsController.getTour);
router.get('/login', authController.isLoggedIn, viewsController.getLoginForm);
router.get('/me', authController.protect, viewsController.getMe);
router.get('/my-tours', authController.protect, viewsController.getMyTours);

// router.post(
//     '/submit-user-data',
//     authController.protect,
//     viewsController.updateUserData
//   );

module.exports = router;
