// sub-app for each : mounting the router
const express = require('express');

const userController = require('../controllers/userController');

const authController = require('../controllers/authController');

const router = express.Router();

// here for signup the template is a bit different (we post directly)
// because we're signing up, so that route must be meaningful, also we don't need http verbs.. we can't patch or update or delete signups...
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logOut);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// router is like a mini-app, on which we can use a middleware.. allow less code, more clarity
// by putting this middleware here (remember middleware run in sequence), everything that will run AFTER (row-wise) will need .protect()
// everything below this row will run only and only if authController.protect() is successful and engage next()
router.use(authController.protect);

// everything below is protected
router.patch('/updatePassword', authController.updatePassword);
router.get('/me', userController.getMe, userController.getUser);
router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
);
router.delete('/deleteMe', userController.deleteMe);

// everything below can only be executed by admins
router.use(authController.restrictTo('admin'));
router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
