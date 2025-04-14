import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisHost = process.env.REDIS_HOST || 'redis';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);

const redisClient = new Redis({
  host: redisHost,
  port: redisPort,
  lazyConnect: true,
});

// Connect to Redis and handle errors
redisClient.on('error', (err) => {
  console.error('Redis connection error:', err);
});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

// Function to get data from cache
export const getCache = async (key: string): Promise<any | null> => {
  try {
    const cachedData = await redisClient.get(key);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
    return null;
  } catch (error) {
    console.error('Error getting data from cache:', error);
    return null;
  }
};

// Function to save data in the cache
export const setCache = async (key: string, data: any, ttl = 3600): Promise<void> => {
  try {
    await redisClient.set(key, JSON.stringify(data), 'EX', ttl);
  } catch (error) {
    console.error('Error setting data to cache:', error);
  }
};

// Function to delete data from the cache
export const deleteCache = async (key: string): Promise<void> => {
  try {
    await redisClient.del(key);
  } catch (error) {
    console.error('Error deleting data from cache:', error);
  }
};

// Function to clear the cache (useful for tests)
export const flushCache = async (): Promise<void> => {
  try {
    await redisClient.flushall();
  } catch (error) {
    console.error('Error flushing cache:', error);
  }
};

export default redisClient;