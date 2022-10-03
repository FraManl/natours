const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const app = express();

// define the web template engine for our application : pug (works great with express and nodejs)
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// serving static files
// app.use(express.static(`${__dirname}/public`)); // service static files
app.use(express.static(path.join(__dirname, 'public'))); // serve all static files from this folder

// API & view Routes
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const bookingRouter = require('./routes/bookingsRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');

// global middlewares
// set security HTTP headers
// app.use(
//   helmet({
//     contentSecurityPolicy: {
//       useDefaults: true,
//       directives: {
//         'script-src': ["'self'", 'https://cdnjs.cloudflare.com'],
//         'default-src': ["'self'", 'data:', 'blob:'],
//         'connect-src': ["'self'", 'blob:', 'https://cdnjs.cloudflare.com'],
//       },
//     },
//   })
// );

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
  })
);

// Further HELMET configuration for Security Policy (CSP)
const scriptSrcUrls = [
  'https://api.tiles.mapbox.com/',
  'https://api.mapbox.com/',
  'https://*.cloudflare.com',
  'https://js.stripe.com/v3/',
  'https://checkout.stripe.com',
];
const styleSrcUrls = [
  'https://api.mapbox.com/',
  'https://api.tiles.mapbox.com/',
  'https://fonts.googleapis.com/',
  'https://www.myfonts.com/fonts/radomir-tinkov/gilroy/*',
  ' checkout.stripe.com',
];
const connectSrcUrls = [
  'https://*.mapbox.com/',
  'https://*.cloudflare.com',
  'http://127.0.0.1:3000',
  '*.stripe.com',
];

const fontSrcUrls = ['fonts.googleapis.com', 'fonts.gstatic.com'];

// git comment test
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: [],
      connectSrc: ["'self'", ...connectSrcUrls],
      scriptSrc: ["'self'", ...scriptSrcUrls],
      styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
      workerSrc: ["'self'", 'blob:'],
      objectSrc: [],
      imgSrc: ["'self'", 'blob:', 'data:'],
      fontSrc: ["'self'", ...fontSrcUrls],
      frameSrc: ['*.stripe.com', '*.stripe.network'],
    },
  })
);

// development log-in
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// set security limiter
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000, // 1 hour in milliseconds
  message: 'Too many requests from this up, please try again',
});
app.use('/api', limiter); // apply limiter middleware to all routes

// body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));

app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// cookie parser
app.use(cookieParser());

// sanitize data sent through body against malicious nosql query injection and against XSS
// it checks and verifies req.body, req.params...
app.use(mongoSanitize());

// avoid cross site scripting
app.use(xss());

// prevent parameter pollution (allow some multiples with whitelist)
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

// testing middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString(); // create new property to req
  console.log(req.cookies);
  next();
});

// Mounting template engine routes
app.use('/', viewRouter);

// Mounting middleware routers (functions) on url paths
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

// global error handling middleware
// we create the error to capture
app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Can't find ${req.originalUrl} on this server!`,
  // });

  // generate a more "generalized" error object; the best practice is to create a streamlined error Class on its own... to handle all kind of errors and then use it as a template to be fed to
  // a global error handler middleware
  // in tourController.js (business side) we want to avoid repeating res.status() all the time, and we don't want to handle error handling inside each of the route handlers

  // const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  // err.status = 'fail';
  // err.statusCode = 404;

  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// with those arguments express automatically recognize an error handling middleware
// 1. we create the middleware that will get execute in the callstack of the app
app.use(globalErrorHandler);

module.exports = app;
