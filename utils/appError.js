// use this class to templatify all possible errors in the application
// this is a class expression, to shelter an error object inside, then with propagate this template to errorController.js to exploit it the way we need
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
