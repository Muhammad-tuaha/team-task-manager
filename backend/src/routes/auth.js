const express = require('express');
const router = express.Router();
const { register, login, logout, me } = require('../controllers/authController');
const { validate, registerSchema, loginSchema } = require('../validators');
const { requireAuth } = require('../middleware/auth');

// POST /auth/register — create account
router.post('/register', validate(registerSchema), register);

// POST /auth/login — start session
router.post('/login', validate(loginSchema), login);

// POST /auth/logout — destroy session
router.post('/logout', requireAuth, logout);

// GET /auth/me — get current user info
router.get('/me', requireAuth, me);

module.exports = router;