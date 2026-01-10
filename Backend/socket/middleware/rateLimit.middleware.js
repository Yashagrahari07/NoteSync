const rateLimitMap = new Map();

// User-friendly rate limits
const RATE_LIMITS = {
  'editNote': { maxRequests: 30, windowMs: 10000 },
  'typingStart': { maxRequests: 10, windowMs: 5000 },
  'typingStop': { maxRequests: 10, windowMs: 5000 },
  'joinNote': { maxRequests: 20, windowMs: 60000 },
  'applyOperation': { maxRequests: 50, windowMs: 10000 },
};

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

module.exports.socketRateLimit = (socket, event, customLimit = null) => {
  const limit = customLimit || RATE_LIMITS[event] || { maxRequests: 20, windowMs: 60000 };
  const key = `${socket.userId}-${event}`;
  const now = Date.now();
  
  if (!rateLimitMap.has(key)) {
    rateLimitMap.set(key, { count: 1, resetTime: now + limit.windowMs });
    return { allowed: true };
  }

  const rateLimit = rateLimitMap.get(key);
  
  if (now > rateLimit.resetTime) {
    rateLimit.count = 1;
    rateLimit.resetTime = now + limit.windowMs;
    return { allowed: true };
  }

  if (rateLimit.count >= limit.maxRequests) {
    return { 
      allowed: false, 
      retryAfter: Math.ceil((rateLimit.resetTime - now) / 1000)
    };
  }

  rateLimit.count++;
  return { allowed: true };
};

