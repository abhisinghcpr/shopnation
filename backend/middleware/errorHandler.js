const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'आंतरिक सर्वर त्रुटि (Internal Server Error)';

  // Mongoose Bad ObjectId error
  if (err.name === 'CastError') {
    message = `संसाधन नहीं मिला (Resource not found for ID: ${err.value})`;
    statusCode = 404;
  }

  // Mongoose Duplicate Key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    message = `डुप्लिकेट प्रविष्टि: '${field}' का मान पहले से मौजूद है (${field} already exists)`;
    statusCode = 400;
  }

  // Mongoose Validation error
  if (err.name === 'ValidationError') {
    message = Object.values(err.errors).map((val) => val.message).join(', ');
    statusCode = 400;
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = errorHandler;
