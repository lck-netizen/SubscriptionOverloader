class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true, error = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = isOperational;
    this.error = error; // Additional error details

    Error.captureStackTrace(this, this.constructor);
  }
}

function errorHandler(err, req, res, next) {
  console.error('[error]', {
    message: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
  });

  if (err instanceof AppError) {
    const response = {
      success: false,
      message: err.message,
      detail: err.message, // backward compatibility with existing frontend
    };
    if (err.error) {
      response.error = err.error;
    }
    if (process.env.NODE_ENV === 'development') {
      response.stack = err.stack;
    }
    return res.status(err.statusCode).json(response);
  }

  if (err.name === 'ValidationError') {
    const response = {
      success: false,
      message: err.message,
      detail: err.message,
    };
    return res.status(400).json(response);
  }

  if (err.name === 'CastError') {
    const response = {
      success: false,
      message: 'Invalid ID format',
      detail: 'Invalid ID format',
    };
    return res.status(400).json(response);
  }

  const response = {
    success: false,
    message: 'Internal server error',
    detail: 'Internal server error',
  };
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }
  res.status(500).json(response);
}

module.exports = { AppError, errorHandler };
