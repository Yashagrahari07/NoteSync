const rateLimit = require('express-rate-limit');

module.exports.apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    message: 'Too many requests. Please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      message: 'Too many requests. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: 15 * 60
    });
  }
});

module.exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    message: 'Too many login attempts. Please try again later.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
    retryAfter: 15 * 60
  },
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    res.status(429).json({
      message: 'Too many login attempts. Please try again later.',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      retryAfter: 15 * 60
    });
  }
});

module.exports.noteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: {
    message: 'Too many note operations. Please slow down.',
    code: 'NOTE_RATE_LIMIT_EXCEEDED',
    retryAfter: 60
  },
  handler: (req, res) => {
    res.status(429).json({
      message: 'Too many note operations. Please slow down.',
      code: 'NOTE_RATE_LIMIT_EXCEEDED',
      retryAfter: 60
    });
  }
});

