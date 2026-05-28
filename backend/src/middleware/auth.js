/**
 * Middleware: Require authenticated session.
 * Protects all non-auth routes.
 */
const requireAuth = (req, res, next) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
      return next();
    }
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  };
  
  /**
   * Middleware: Attach current user to req.currentUser for convenience.
   * Must be used after session & passport middleware.
   */
  const attachUser = (req, res, next) => {
    req.currentUser = req.user || null;
    next();
  };
  
  module.exports = { requireAuth, attachUser };