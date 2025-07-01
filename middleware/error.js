const handleError = (error, req, res, next) => {
  console.error('Error occurred:', error);

  // Database errors
  if (error.code === '23505') { // PostgreSQL unique violation
    return res.status(409).json({
      responseCode: 'E',
      responseMessage: 'Record already exists'
    });
  }

  if (error.code === '23503') { // PostgreSQL foreign key violation
    return res.status(400).json({
      responseCode: 'E',
      responseMessage: 'Invalid reference data'
    });
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      responseCode: 'E',
      responseMessage: 'Invalid token'
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      responseCode: 'E',
      responseMessage: 'Token expired'
    });
  }

  // File upload errors
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      responseCode: 'E',
      responseMessage: 'File too large'
    });
  }

  // Default error response
  res.status(500).json({
    responseCode: 'E',
    responseMessage: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
};

const notFound = (req, res) => {
  res.status(404).json({
    responseCode: 'E',
    responseMessage: 'Route not found'
  });
};


module.exports = {
  handleError,
  notFound,
};