const redis = require('redis');

let redisClient;

async function initCache() {
  redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  });

  redisClient.on('error', (err) => console.log('Redis Client Error', err));

  await redisClient.connect();
  console.log('✅ Redis connected');
}

function getCache() {
  if (!redisClient) {
    throw new Error('Redis not initialized!');
  }
  return redisClient;
}

module.exports = {
  initCache,
  getCache,
};
