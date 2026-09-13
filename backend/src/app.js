const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const config = require('./config/env');
const apiRoutes = require('./routes');
const notFoundHandler = require('./middleware/notFound.middleware');
const errorHandler = require('./middleware/error.middleware');
const { apiLimiter } = require('./middleware/rateLimiter.middleware');

const app = express();

// Security Headers via Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allows uploaded evidence images to be loaded by frontend
  })
);

// Serve uploaded evidence images statically
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// Allowed origins for CORS
const allowedOrigins = [
  config.clientUrl,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
];

// CORS Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (such as mobile apps, curl, postman, server-to-server)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // In production, reject unauthorized origins; in development, be permissive
      if (config.nodeEnv === 'production') {
        return callback(new Error('Cross-Origin Request Blocked: Origin not permitted by CORS policy.'));
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-bypass-rate-limit'],
  })
);

// Body parsing middleware with size limits to prevent payload exhaustion DoS
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Root welcome route
app.get('/', (req, res) => {
  res.json({
    name: 'CivicFix Backend API',
    status: 'online',
    documentation: '/api/health',
  });
});

// General API rate limiter applied to /api routes
app.use('/api', apiLimiter);

// API Routes
app.use('/api', apiRoutes);

// 404 handler for undefined routes
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

module.exports = app;

