const { createClient } = require('redis');


const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    
    reconnectStrategy: (retries) => (retries > 3 ? false : Math.min(retries * 200, 1000)),
  },
});

let isConnected = false;

redisClient.on('error', (err) => {
  if (isConnected) {
    console.error('Redis error:', err.message);
    isConnected = false;
  }
});

const connectRedis = async () => {
  try {
    await redisClient.connect();
    isConnected = true;
    console.log('Redis connected — search results will be cached');
  } catch (err) {
    console.warn('Redis not available — running without cache:', err.message);
    isConnected = false;
  }
};

const isRedisConnected = () => isConnected;

module.exports = { redisClient, connectRedis, isRedisConnected };
