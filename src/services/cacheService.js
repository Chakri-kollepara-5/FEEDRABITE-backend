const { createClient } = require('redis');

let redisClient = null;
let isConnected = false;

// Simple in-memory fallback cache
const memCache = new Map();

// Helper to cleanup expired memory cache items periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, item] of memCache.entries()) {
        if (item.expiry <= now) {
            memCache.delete(key);
        }
    }
}, 60000); // Run cleanup every minute

const initRedis = async () => {
    if (!process.env.REDIS_URL) {
        console.info('ℹ️ Redis URL not set. Cache service will run in in-memory mode.');
        return;
    }

    try {
        redisClient = createClient({
            url: process.env.REDIS_URL,
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > 10) {
                        console.error('🔥 Redis reconnection failed after 10 attempts. Disabling Redis caching.');
                        isConnected = false;
                        return new Error('Redis connection lost');
                    }
                    console.warn(`⚠️ Redis reconnecting... attempt ${retries}`);
                    return Math.min(retries * 500, 5000); // Try reconnecting with backoff
                }
            }
        });

        redisClient.on('error', (err) => {
            console.warn('⚠️ Redis Client Error:', err.message);
            isConnected = false;
        });

        redisClient.on('connect', () => {
            console.log('🚀 Connected to Redis successfully.');
            isConnected = true;
        });

        await redisClient.connect();
    } catch (err) {
        console.warn('⚠️ Failed to connect to Redis. Falling back to in-memory caching.', err.message);
        redisClient = null;
        isConnected = false;
    }
};

const get = async (key) => {
    if (isConnected && redisClient) {
        try {
            const val = await redisClient.get(key);
            return val ? JSON.parse(val) : null;
        } catch (e) {
            console.warn(`Redis GET failed for key [${key}]:`, e.message);
        }
    }
    
    // In-memory fallback
    const memVal = memCache.get(key);
    if (memVal) {
        if (memVal.expiry > Date.now()) {
            return memVal.value;
        }
        memCache.delete(key); // clear expired
    }
    return null;
};

const set = async (key, value, ttlSeconds = 300) => {
    if (isConnected && redisClient) {
        try {
            await redisClient.set(key, JSON.stringify(value), {
                EX: ttlSeconds
            });
            return;
        } catch (e) {
            console.warn(`Redis SET failed for key [${key}]:`, e.message);
        }
    }
    
    // In-memory fallback
    memCache.set(key, {
        value,
        expiry: Date.now() + (ttlSeconds * 1000)
    });
};

const del = async (key) => {
    if (isConnected && redisClient) {
        try {
            await redisClient.del(key);
            return;
        } catch (e) {
            console.warn(`Redis DEL failed for key [${key}]:`, e.message);
        }
    }
    
    // In-memory fallback
    memCache.delete(key);
};

const delPattern = async (pattern) => {
    if (isConnected && redisClient) {
        try {
            const keys = await redisClient.keys(pattern);
            if (keys.length > 0) {
                await redisClient.del(keys);
            }
            return;
        } catch (e) {
            console.warn(`Redis DEL Pattern [${pattern}] failed:`, e.message);
        }
    }
    
    // In-memory fallback: clear matching keys
    // Convert wildcard * to regex .*
    const matchRegex = new RegExp('^' + pattern.replace(/\*/g, '.*'));
    for (const key of memCache.keys()) {
        if (matchRegex.test(key)) {
            memCache.delete(key);
        }
    }
};

const getStatus = () => {
    return isConnected ? 'Connected (Redis)' : 'Active (In-Memory Fallback)';
};

module.exports = {
    initRedis,
    get,
    set,
    del,
    delPattern,
    getStatus
};
