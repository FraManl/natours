// sub-app for each : mounting the router
const express = require('express');

const tourController = require('../controllers/tourController');

const router = express.Router();

// param middleware ( for middleware w/ parameters only )
// will only apply to this sub application (Tour) and not User ! because this middleware is part of the Tour router environment

// router.param('id', tourController.checkId);

router
  .route('/')
  .get(tourController.getAllTours)
  // param middleware + chaining
  .post(tourController.checkBody, tourController.createTour);

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(tourController.deleteTour);

module.exports = router;
