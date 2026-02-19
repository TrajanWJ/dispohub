const requests = new Map();

export function rateLimiter(maxRequests = 100, windowMs = 60000) {
  return (req, res, next) => {
    const key = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const now = Date.now();
    
    if (!requests.has(key)) {
      requests.set(key, []);
    }
    
    const timestamps = requests.get(key).filter(t => now - t < windowMs);
    timestamps.push(now);
    requests.set(key, timestamps);
    
    if (timestamps.length > maxRequests) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }
    
    next();
  };
}
