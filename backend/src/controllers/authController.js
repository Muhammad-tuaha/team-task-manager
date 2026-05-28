const bcrypt = require('bcrypt');
const passport = require('../config/passport');
const { pool } = require('../config/database');

const BCRYPT_ROUNDS = 12;

/**
 * POST /auth/register
 * Creates a new user account.
 */
const register = async (req, res, next) => {
  const { name, email, password } = req.body;

  try {
    // Check for duplicate email
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [name, email, password_hash]
    );

    const user = result.rows[0];

    // Auto-login after registration
    req.logIn(user, (err) => {
      if (err) return next(err);
      return res.status(201).json({ message: 'Account created successfully', user });
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /auth/login
 * Authenticates user via Passport local strategy.
 */
const login = (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ error: info?.message || 'Authentication failed' });

    req.logIn(user, (err) => {
      if (err) return next(err);
      return res.json({ message: 'Logged in successfully', user });
    });
  })(req, res, next);
};

/**
 * POST /auth/logout
 * Destroys the session.
 */
const logout = (req, res, next) => {
  req.logOut((err) => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.json({ message: 'Logged out successfully' });
    });
  });
};

/**
 * GET /auth/me
 * Returns the currently authenticated user.
 */
const me = (req, res) => {
  res.json({ user: req.user });
};

module.exports = { register, login, logout, me };