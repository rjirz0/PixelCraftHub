/**
 * Centralized error handler middleware.
 * Formats errors nicely into JSON and hides sensitive stack traces in production.
 */
export function errorHandler(err, req, res, next) {
  console.error('[SERVER ERROR]', err);
  
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  res.status(statusCode).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
}
