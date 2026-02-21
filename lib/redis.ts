import { Redis } from "@upstash/redis";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

// Initialize Redis only if both URL and Token are present
const redis = (redisUrl && redisToken)
    ? new Redis({
        url: redisUrl,
        token: redisToken,
    })
    : null;

/**
 * Get data from cache
 */
export async function getCache<T>(key: string): Promise<T | null> {
    if (!redis) return null;
    try {
        const data = await redis.get<T>(key);
        return data;
    } catch (error) {
        console.error("Redis Get Error:", error);
        return null;
    }
}

/**
 * Set data in cache with TTL
 * @param key Cache key
 * @param value Data to store
 * @param ttl Time to live in seconds (default 3600 / 1 hour)
 */
export async function setCache(key: string, value: any, ttl = 3600): Promise<void> {
    if (!redis) return;
    try {
        await redis.set(key, JSON.stringify(value), { ex: ttl });
    } catch (error) {
        console.error("Redis Set Error:", error);
    }
}

/**
 * Delete data from cache (invalidation)
 */
export async function deleteCache(key: string): Promise<void> {
    if (!redis) return;
    try {
        await redis.del(key);
    } catch (error) {
        console.error("Redis Delete Error:", error);
    }
}

/**
 * Delete multiple keys matching a pattern (e.g., "members_list_*")
 * Note: Upstash Redis keys() is available but should be used cautiously on large datasets.
 * For this app's scale, it's efficient enough.
 */
export async function invalidatePattern(pattern: string): Promise<void> {
    if (!redis) return;
    try {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
            await redis.del(...keys);
        }
    } catch (error) {
        console.error("Redis Pattern Invalidation Error:", error);
    }
}

export default redis;
