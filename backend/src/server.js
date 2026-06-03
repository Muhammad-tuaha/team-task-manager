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

/* ─────────────────────────────────────────────────────────────
   TRUST PROXY (REQUIRED FOR RENDER)
───────────────────────────────────────────────────────────── */
app.set('trust proxy', 1);

/* ─────────────────────────────────────────────────────────────
   SECURITY
───────────────────────────────────────────────────────────── */
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

/* ─────────────────────────────────────────────────────────────
   CORS (STRICT FOR VERCEL + RENDER)
───────────────────────────────────────────────────────────── */
app.use(cors({
  origin: ['https://team-task-manager-five-henna.vercel.app','https://team-task-manager-dgjoadyhi-tahasoomro10-9746s-projects.vercel.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

/* ─────────────────────────────────────────────────────────────
   BODY PARSING
───────────────────────────────────────────────────────────── */
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

/* ─────────────────────────────────────────────────────────────
   SESSION CONFIG (FIXED FOR CROSS-DOMAIN AUTH)
───────────────────────────────────────────────────────────── */
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',

  resave: false,
  saveUninitialized: false,

  cookie: {
    httpOnly: true,

    // 🔥 MUST BE TRUE for Vercel (HTTPS frontend) + Render (HTTPS backend)
    secure: true,

    // 🔥 REQUIRED for cross-site cookies (Vercel ↔ Render)
    sameSite: 'none',

    maxAge: parseInt(process.env.SESSION_MAX_AGE) || 86400000,
  },
};

// PostgreSQL session store in production
if (process.env.NODE_ENV === 'production') {
  const PgSession = require('connect-pg-simple')(session);

  sessionConfig.store = new PgSession({
    pool,
    tableName: 'session',
  });
}

app.use(session(sessionConfig));

/* ─────────────────────────────────────────────────────────────
   PASSPORT
───────────────────────────────────────────────────────────── */
app.use(passport.initialize());
app.use(passport.session());
app.use(attachUser);

/* ─────────────────────────────────────────────────────────────
   HEALTH CHECK
───────────────────────────────────────────────────────────── */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/* ─────────────────────────────────────────────────────────────
   ROUTES
───────────────────────────────────────────────────────────── */
app.use('/auth', authRoutes);
app.use('/teams', teamsRoutes);
app.use('/tasks', tasksRoutes);

/* ─────────────────────────────────────────────────────────────
   ERROR HANDLING
───────────────────────────────────────────────────────────── */
app.use(notFound);
app.use(errorHandler);

/* ─────────────────────────────────────────────────────────────
   START SERVER
───────────────────────────────────────────────────────────── */
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