/**
 * Redis Configuration
 * 
 * Provides Redis client for BullMQ (submission queue) and 
 * Leaderboard (sorted sets).
 * 
 * Uses ioredis which is required by BullMQ.
 */

import Redis from 'ioredis';

let redisClient = null;
let subscriberClient = null;

const getRedisOptions = () => ({
  maxRetriesPerRequest: null,  // Required by BullMQ
  enableReadyCheck: false,
  retryStrategy: (times) => {
    if (times > 10) {
      console.error('❌ Redis: max retries reached, giving up');
      return null;
    }
    const delay = Math.min(times * 200, 5000);
    console.log(`🔄 Redis: retrying connection in ${delay}ms (attempt ${times})`);
    return delay;
  },
});

const createRedisInstance = () => {
  const options = getRedisOptions();
  if (process.env.REDIS_URL) {
    return new Redis(process.env.REDIS_URL, options);
  }
  return new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6380'),
    password: process.env.REDIS_PASSWORD || undefined,
    ...options
  });
};

/**
 * Get or create the main Redis client (for BullMQ queue + general use)
 */
export const getRedisClient = () => {
  if (!redisClient) {
    redisClient = createRedisInstance();

    redisClient.on('connect', () => {
      console.log(`✅ Redis client connected successfully`);
    });

    redisClient.on('error', (err) => {
      console.error('❌ Redis error:', err.message);
    });
  }
  return redisClient;
};

/**
 * Get a subscriber client (BullMQ needs separate connection for pub/sub)
 */
export const getRedisSubscriber = () => {
  if (!subscriberClient) {
    subscriberClient = createRedisInstance();

    subscriberClient.on('error', (err) => {
      console.error('❌ Redis subscriber error:', err.message);
    });
  }
  return subscriberClient;
};

/**
 * Create a new Redis connection (for BullMQ workers — each needs its own)
 */
export const createRedisConnection = () => {
  return createRedisInstance();
};

/**
 * Gracefully close all Redis connections
 */
export const closeRedis = async () => {
  const promises = [];
  if (redisClient) {
    promises.push(redisClient.quit());
    redisClient = null;
  }
  if (subscriberClient) {
    promises.push(subscriberClient.quit());
    subscriberClient = null;
  }
  await Promise.all(promises);
  console.log('🔌 Redis connections closed');
};

export default {
  getRedisClient,
  getRedisSubscriber,
  createRedisConnection,
  closeRedis,
};
