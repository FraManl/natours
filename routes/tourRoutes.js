// sub-app for each : mounting the router
const express = require('express');

const tourController = require('../controllers/tourController');

const router = express.Router();

const authController = require('../controllers/authController');

// const reviewController = require('../controllers/reviewController');

const reviewRouter = require('./reviewRoutes');

// param middleware ( for middleware w/ parameters only )
// will only apply to this sub application (Tour) and not User ! because this middleware is part of the Tour router environment

// router.param('id', tourController.checkId);

// nested routes (when querying for reviews, we shouldn't use user/tour ids inside the body but instead dynamically inject them in an url) = nested routes
// proceeding like this is confusing because, only because the ressource starts with 'tour' we insert it inside tourRoutes, although it only concernes reviews in the end...
// proceeding like this works, but its messy, there is a better way... plus it generates duplicate code...
// router.route('/:tourId/reviews').post(
//   authController.protect,
//   authController.restrictTo('user'),
//   reviewController.createReview // for now, we call the reviewController in the tour route, although it doesn't make too much sense (because the route starts w/ tour)
// );
// the better solution for nested routes is below

router.use('/:tourId/reviews', reviewRouter); // we define a middleware that says : when encountering a route like this, for this specific route, use reviewRouter; like mounting a router
// how, its easy because in reviewRouter, we already have a .post() method to get reviews... only know we specify it for a specific route that includes tourId
// but how to make sure that reviewRouter access tourId ?

// aliasing
router // aliasing router
  .route('/top-5-cheap')
  // param middleware + chaining
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  );

// could also write tours-distance?distance=233&center=-40,45&unit=mi
// but below is cleaner and a standard
router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

module.exports = router;
