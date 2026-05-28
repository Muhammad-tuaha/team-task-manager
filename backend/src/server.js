require('dotenv').config();

const express = require('express');
const session = require('express-session');
const cors = require('cors');
const helmet = require('helmet');
const passport = require('./config/passport');
const { pool, initializeDatabase } = require('./config/database');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { attachUser } = require('./middleware/auth');

// Routes
const authRoutes = require('./routes/auth');
const teamsRoutes = require('./routes/teams');
const tasksRoutes = require('./routes/tasks');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Trust Proxy ────────────────────────────────────────────────────────────────
// MANDATORY for hosting environments like Render to securely pass cookies.
// Tells Express it is running behind an HTTPS load balancer proxy.
app.set('trust proxy', 1);

// ── Security middleware ────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  // Point explicitly to your live production Vercel application front-end URL
  origin: process.env.FRONTEND_URL || 'https://team-task-manager-five-henna.vercel.app',
  credentials: true, // Allows cross-domain session cookies to pass through
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

// ── Body parsing ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── Session setup ──────────────────────────────────────────────────────────────
const isProduction = process.env.NODE_ENV === 'production';

const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true, // Mitigates XSS manipulation of the session token
    secure: isProduction, // Forces cookie transport exclusively over HTTPS in production
    sameSite: isProduction ? 'none' : 'lax', // 'none' is mandatory for cross-domain cookie syncing
    maxAge: parseInt(process.env.SESSION_MAX_AGE) || 86400000, // 24 hours
  },
};

// Use PostgreSQL session store in production; memory store in dev
if (isProduction) {
  const PgSession = require('connect-pg-simple')(session);
  sessionConfig.store = new PgSession({
    pool,
    tableName: 'session',
    createTableIfMissing: false, // Created inside initializeDatabase
  });
}

app.use(session(sessionConfig));

// ── Passport ───────────────────────────────────────────────────────────────────
app.use(passport.initialize());
app.use(passport.session());
app.use(attachUser);

// ── Health check ───────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── API Routes ─────────────────────────────────────────────────────────────────
app.use('/auth', authRoutes);
app.use('/teams', teamsRoutes);
app.use('/tasks', tasksRoutes);

// ── Error handling ─────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start server ───────────────────────────────────────────────────────────────
const start = async () => {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
};

start();

module.exports = app;