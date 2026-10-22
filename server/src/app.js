require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const corsOptions = require('./config/cors');
const { errorHandler, notFoundHandler } = require('./middlewares/error.middleware');

// Route imports
const authRoutes = require('./modules/auth/auth.route');
const userRoutes = require('./modules/users/user.route');
const projectRoutes = require('./modules/projects/project.route');
const taskRoutes = require('./modules/tasks/task.route');
const commentRoutes = require('./modules/comments/comment.route');
const notificationRoutes = require('./modules/notifications/notification.route');
const logRoutes = require('./modules/logs/log.route');
const workloadRoutes = require('./modules/workload/workload.route');
const teamRoutes = require('./modules/teams/team.route');
const searchRoutes = require('./modules/search/search.route');
const aiRoutes = require('./modules/ai/ai.route');

const app = express();

// Behind a reverse proxy (Render, nginx) so rate limiting sees the real client IP
app.set('trust proxy', 1);

// ─── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors(corsOptions));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 1000,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// ─── Auth rate limiter (stricter) ────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { success: false, message: 'Too many login attempts, please try again later.' },
});

// ─── Body Parser ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Logger ───────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ─── Static Files (Uploads) ───────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─── IO Injector (makes socket.io available in req) ──────────────────────────
app.use((req, res, next) => {
  req.io = app.get('io');
  next();
});

// ─── Root & Health Check ─────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Task Management System API is running',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api/v1',
    },
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Task Management API is running',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
const API_PREFIX = '/api/v1';

app.use(`${API_PREFIX}/auth`, authLimiter, authRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/projects`, projectRoutes);
app.use(`${API_PREFIX}/tasks`, taskRoutes);
app.use(`${API_PREFIX}/tasks/:taskId/comments`, commentRoutes);
app.use(`${API_PREFIX}/notifications`, notificationRoutes);
app.use(`${API_PREFIX}/logs`, logRoutes);
app.use(`${API_PREFIX}/stats`, workloadRoutes);
app.use(`${API_PREFIX}/teams`, teamRoutes);
app.use(`${API_PREFIX}/search`, searchRoutes);
app.use(`${API_PREFIX}/ai`, aiRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use(notFoundHandler);

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
