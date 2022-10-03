const mongoose = require('mongoose');
const dotenv = require('dotenv');

// globally handle rejected promises (the last type of error we need to catch on this app)
// like a safety net, to catch any last errors that are not Promise related...
// when an application crashes, we should have a tool, aside of it, to automatically restart the application...
// we put this one at the very top to catch exceptions
process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  console.log('UNCAUGHT EXCEPTION');
  process.exit(1); // when uncaught exception happens, we need to close the app; because the entire app is in an "unclean state", dangerous to continue then...
});

dotenv.config({ path: './config.env' });
const app = require('./app');
// environment variables : allow to setup meta variables per environment (dev, prod) such as database access, folders, credentials, passwords, usernames, configs...
// but usually we use a config.env file; important in order to configure the behavior of our environment(s)

// development variable (express)
// console.log(app.get('env'));

// development variable (node)
// console.log(process.env.NODE_ENV);

// Launch server as development : $ NODE_ENV=development nodemon server.js
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  // .connect(process.env.DATABASE_LOCAL, { // local DB connector
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: true,
  })
  .then(() => console.log('DB Connection successful'));

// create a new test tour object using this model (class)
// it works the same as an instance of the Tour model (like a class would do)
// const testTour = new Tour({
//   name: 'The park camper',
//   rating: 4.2,
//   price: 988,
// });

// // save the document to the DB
// // consume promise
// testTour
//   .save()
//   .then((doc) => {
//     console.log(doc);
//   })
//   .catch((err) => {
//     console.log(`Error : ${err}`);
//   });

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

// globally handle rejected promises (the last type of error we need to catch on this app)
// like a safety net, to catch any errors...
// we need to catch errors, in order to prevent the app from shutting down all the time...
// when an application crashes, we should have a tool, aside of it, to automatically restart the application...
process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('UNCAUGHT PROMISE REJECTION');
  // process.exit(1); // 1 = uncaught exception; 0 = success /!\ this is a brutal way of crashing the app
  // need to close the app gracefully; in the case of uncaught rejection, it is optional to close the app...
  server.close(() => {
    process.exit(1);
  });
});
