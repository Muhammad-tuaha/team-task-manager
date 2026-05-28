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

// ── Security middleware ────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true, // Required for cookies/sessions
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

// ── Body parsing ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── Session setup ──────────────────────────────────────────────────────────────
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,                                           // Prevent XSS access
    secure: process.env.NODE_ENV === 'production',           // HTTPS only in production
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: parseInt(process.env.SESSION_MAX_AGE) || 86400000, // 24 hours
  },
};

// Use PostgreSQL session store in production; memory store in dev
if (process.env.NODE_ENV === 'production') {
  const PgSession = require('connect-pg-simple')(session);
  sessionConfig.store = new PgSession({
    pool,
    tableName: 'session',
    createTableIfMissing: false, // We create it in initializeDatabase
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
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
};

start();

module.exports = app; // For testing