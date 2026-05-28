/**
 * Centralised error handler. Must be registered last in Express.
 */
const errorHandler = (err, req, res, next) => {
    console.error(`[${new Date().toISOString()}] ERROR:`, err.message);
  
    // Validation errors from express-validator are handled at route level.
    // This catches unexpected server errors.
    const status = err.status || err.statusCode || 500;
    const message =
      process.env.NODE_ENV === 'production' && status === 500
        ? 'An unexpected error occurred'
        : err.message;
  
    res.status(status).json({ error: message });
  };
  
  /**
   * 404 handler for unmatched routes.
   */
  const notFound = (req, res) => {
    res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
  };
  
  module.exports = { errorHandler, notFound };