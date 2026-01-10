module.exports.errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // JSON syntax error (from express.json() middleware)
  // Express 5's express.json() throws SyntaxError with status 400 when JSON is invalid
  if (err instanceof SyntaxError && (err.status === 400 || err.message.includes('JSON'))) {
    return res.status(400).json({
      message: 'Invalid JSON in request body',
      error: err.message,
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation error',
      errors: Object.values(err.errors).map((e) => e.message),
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    return res.status(409).json({
      message: 'Duplicate entry',
      field: Object.keys(err.keyPattern)[0],
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Invalid token' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Token expired' });
  }

  // Default error
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

