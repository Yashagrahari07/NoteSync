const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const compression = require('compression');
const connectToDb = require('./config/db');
const { enforceHTTPS } = require('./middlewares/https.middleware');
const { requestLogger } = require('./middlewares/logger.middleware');
const { errorHandler } = require('./middlewares/error.middleware');
const { apiLimiter } = require('./middlewares/rateLimit.middleware');
const userRoutes = require('./routes/user.routes');
const noteRoutes = require('./routes/note.routes');
const notificationRoutes = require('./routes/notification.routes');
const userPreferencesRoutes = require('./routes/userPreferences.routes');
const conflictResolutionRoutes = require('./routes/conflictResolution.routes');

const app = express();

// Connect to MongoDB
connectToDb();

// CORS - MUST be first to handle preflight OPTIONS requests
// Clean environment variable (remove quotes and spaces)
const cleanFrontendUrl = process.env.FRONTEND_URL?.trim().replace(/^['"]|['"]$/g, '') || '';
const allowedOrigins = [
  cleanFrontendUrl,
  'http://localhost:5173',
  'http://192.168.1.4:5173',
  'http://127.0.0.1:5173'
].filter(Boolean); // Remove empty/undefined values

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}. Allowed origins:`, allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Type'],
}));

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Compression
app.use(compression());

// HTTPS enforcement (only in production)
if (process.env.NODE_ENV === 'production' && process.env.ENFORCE_HTTPS !== 'false') {
  app.use(enforceHTTPS);
}

// Request logging
app.use(requestLogger);

// Body parser with limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser());

// Rate limiting
app.use(apiLimiter);

// Routes
app.get('/', (req, res) => {
  res.send("NoteSync API");
});

app.use('/users', userRoutes);
app.use('/notes', noteRoutes);
app.use('/notifications', notificationRoutes);
app.use('/user-preferences', userPreferencesRoutes);
app.use('/conflict-resolution', conflictResolutionRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

module.exports = app;
