import rateLimit from 'express-rate-limit';

/**
 * User-aware rate limiter.
 * - If the request has a valid JWT, limits per user ID.
 * - Otherwise, limits per IP address (default behavior).
 */
export const createUserRateLimit = ({ windowMs = 15 * 60 * 1000, max = 100, message } = {}) => {
  const store = new Map();

  const cleanup = () => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now - entry.resetTime > windowMs) {
        store.delete(key);
      }
    }
  };

  // Cleanup every 5 minutes
  const cleanupInterval = setInterval(cleanup, 5 * 60 * 1000);
  // Allow the process to exit even if this interval is still running
  if (cleanupInterval.unref) cleanupInterval.unref();

  return (req, res, next) => {
    // Determine the key: prefer user ID from JWT, fall back to IP
    const user = req.user; // set by authenticateToken / requireAuth
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const key = user?.id ? `user:${user.id}` : `ip:${ip}`;

    const now = Date.now();
    let entry = store.get(key);

    if (!entry || now - entry.resetTime >= windowMs) {
      entry = { count: 0, resetTime: now };
      store.set(key, entry);
    }

    entry.count += 1;

    // Set rate limit headers
    const remaining = Math.max(0, max - entry.count);
    const resetAt = entry.resetTime + windowMs;

    res.set('X-RateLimit-Limit', String(max));
    res.set('X-RateLimit-Remaining', String(remaining));
    res.set('X-RateLimit-Reset', String(Math.ceil(resetAt / 1000)));

    if (entry.count > max) {
      const retryAfter = Math.ceil((resetAt - now) / 1000);
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({
        error: message || 'Too many requests, please try again later.',
        retryAfterSeconds: retryAfter,
      });
    }

    next();
  };
};
