const express = require('express');
const morgan = require('morgan');
const fs = require('fs');
const app = express();

// remember that in Express, code order matters a lot. Execution of middleware (like route) will end to Request/Response cycle
// that's how it works, the middleware it uses are made to execute once then close the cycle

// // middleware => used to modify incoming request data for POST requests; it stands between the request and the response, thats why its called middleware. Here, we "use" express.json() middleware
// app.use(express.json());

// // // opening a get method
// // app.get('/', (req, res) => {
// //   res
// //     .status(200)
// //     // res.send() also works
// //     .json({ message: 'Hello from the server side!', app: 'natours' });
// // });

// // // opening a post method
// // app.post('/', (req, res) => {
// //   res.send('You can post to this endpoint...');
// // });

// // read data outside the handler (execute it once outside event loop, not every time event is triggered); also we try avoid blocking code inside event loop as much as possible
// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`)
// );

// const getAllTours = (req, res) => {
//   res.status(200).json({
//     status: 'success',
//     results: tours.length,
//     data: {
//       tours,
//     },
//   });
// };

// const getTour = (req, res) => {
//   console.log(req.params);
//   const id = req.params.id * 1; // nice trick to exploit weak typing and convert string to number...when we expect a number...
//   // if (id > tours.length) {}
//   const tour = tours.find((el) => el.id === id);
//   if (!tour) {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'Invalid ID',
//     });
//   }
//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour,
//     },
//   });
// };

// const createTour = (req, res) => {
//   // req.body will be available because above we used the middleware express.json()
//   // if this middleware is not used here, req.body will be undefined

//   const newId = tours[tours.length - 1].id + 1;
//   const newTour = Object.assign({ id: newId }, req.body);
//   tours.push(newTour);

//   // we are in the event loop, and we should never obstruct event loop with synchronous callbacks, we need a method that runs in the background
//   fs.writeFile(
//     `${__dirname}/dev-data/data/tours-simple.json`,
//     JSON.stringify(tours),
//     (err) => {
//       res.status(201).json({
//         status: 'succes',
//         data: { tour: newTour },
//       });
//     }
//   );
// };

// const updateTour = (req, res) => {
//   if (req.params.id * 1 > tours.length) {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'Invalid ID',
//     });
//   }

//   res.status(200).json({
//     status: 'success',
//     data: { tour: '<Updated tour>' },
//   });
// };

// const deleteTour = (req, res) => {
//   if (req.params.id * 1 > tours.length) {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'Invalid ID',
//     });
//   }

//   res.status(204).json({
//     status: 'success',
//     data: null,
//   });
// };

// // get all tours
// app.get('/api/v1/tours', getAllTours);
// // app.get('/api/v2/tours') // v3, v4...

// // get one tour only, note the :id variable in the root url
// // can also set multiple variable params /:x/:y/:z, and chain them up like this
// // remember we need to feed the url all the required params
// // to make it optional (undefined by default), just add question mark after it /:x?
// app.get('/api/v1/tours/:id', getTour);
// app.post('/api/v1/tours', createTour);

// // using PATCH instead of PUT is much easier then with mongDB and mongoose...
// // PATCH only sends the property to change, and not the entire object {id:x, property:y}
// // for now, we make a very simple example (so incomplete)
// app.patch('/api/v1/tours/:id', updateTour);

// // delete using API
// app.delete('/api/v1/tours/:id', deleteTour);

// const port = 3000;
// app.listen(port, () => {
//   console.log(`App running on port ${port}...`);
// });

// No comment version of above
// + even better way to refactor
app.use(express.json());

// MiddleWares
app.use(morgan('dev'));

// this middleware function will be executed within any single request, inside the request/response cycle
// executed if stands before any other middleware that could close the cycle (like a route() or .json()...)
app.use((req, res, next) => {
  console.log('New function inserted in Middleware stack!');
  next(); // calling this is a mandatory
});

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString(); // create new property to req
  next();
});

// Route Handlers
const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`)
);

const geAllTours = (req, res) => {
  res.status(200).json({
    status: 'success',
    results: tours.length,
    requestAt: req.requestTime,
    data: {
      tours,
    },
  });
};

const getTour = (req, res) => {
  console.log(req.params);
  const id = req.params.id * 1;
  const tour = tours.find((el) => el.id === id);
  if (!tour) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });
  }
  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });
};

const createTour = (req, res) => {
  const newId = tours[tours.length - 1].id + 1;
  const newTour = Object.assign({ id: newId }, req.body);
  tours.push(newTour);

  fs.writeFile(
    `${__dirname}/dev-data/data/tours-simple.json`,
    JSON.stringify(tours),
    (err) => {
      res.status(201).json({
        status: 'succes',
        data: { tour: newTour },
      });
    }
  );
};

const updateTour = (req, res) => {
  if (req.params.id * 1 > tours.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });
  }

  res.status(200).json({
    status: 'success',
    data: { tour: '<Updated tour>' },
  });
};

const deleteTour = (req, res) => {
  if (req.params.id * 1 > tours.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
};

const getAllUsers = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined',
  });
};

const createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined',
  });
};

const getUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined',
  });
};

const updateUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined',
  });
};

const deleteUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined',
  });
};

// Routes

// app.get('/api/v1/tours', getAllTours);
// app.get('/api/v1/tours/:id', getOneTour);
// app.post('/api/v1/tours', createTour);
// app.patch('/api/v1/tours/:id', updateTour);
// app.delete('/api/v1/tours/:id', deleteTour);

// those are also middleware function, but only applying to specific urls...

// sub-app for each : mounting the router
const tourRouter = express.Router();
const userRouter = express.Router();

tourRouter.route('/').get(geAllTours).post(createTour);
tourRouter.route('/:id').get(getTour).patch(updateTour).delete(deleteTour);

userRouter.route('/').get(getAllUsers).post(createUser);
userRouter.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

// Start Server
const port = 3000;
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
