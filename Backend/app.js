const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
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

// HTTPS enforcement
app.use(enforceHTTPS);

// Request logging
app.use(requestLogger);

// Body parser with limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Sanitize MongoDB queries
app.use(mongoSanitize());

// Cookie parser
app.use(cookieParser());

// CORS
app.use(cors({
  origin: [process.env.FRONTEND_URL, 'http://192.168.1.4:5173'],
  credentials: true,
}));

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
