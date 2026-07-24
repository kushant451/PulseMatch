const { redisClient, isRedisConnected } = require('../config/redisClient');

const DEFAULT_TTL_SECONDS = 30; 


const cacheMiddleware = (ttlSeconds = DEFAULT_TTL_SECONDS) => {
  return async (req, res, next) => {
    if (!isRedisConnected()) {
      return next(); // no Redis available — fall through to the real handler
    }

    const cacheKey = `cache:${req.originalUrl}`;

    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        res.set('X-Cache', 'HIT');
        return res.json(JSON.parse(cached));
      }
    } catch (err) {
      console.error('Redis GET failed, continuing without cache:', err.message);
      return next();
    }

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      redisClient
        .setEx(cacheKey, ttlSeconds, JSON.stringify(body))
        .catch((err) => console.error('Redis SET failed:', err.message));
      res.set('X-Cache', 'MISS');
      return originalJson(body);
    };

    next();
  };
};

module.exports = cacheMiddleware;
