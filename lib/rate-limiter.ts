import redis from "./redis";

interface RateLimitResponse {
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
}

/**
 * Sliding Window Rate Limiter (Redis-backed)
 *
 * Enforces rate limiting on a specific identifier (IP address, user ID, or API Key ID).
 * Uses a Redis sorted set to track requests within a sliding window.
 *
 * @param key    Unique key for the rate limit bucket (e.g. "signup:192.168.1.1")
 * @param limit  Max allowed requests within the window
 * @param windowSeconds  Window length in seconds
 */
export async function rateLimit(
    key: string,
    limit: number,
    windowSeconds: number
): Promise<RateLimitResponse> {
    if (!redis) {
        // Fail-open: allow requests when Redis is unavailable (local dev)
        return { success: true, limit, remaining: limit, reset: 0 };
    }

    const now = Date.now();
    const clearBefore = now - windowSeconds * 1000;
    const redisKey = `ratelimit:${key}`;

    try {
        const pipeline = redis.pipeline();

        // 1. Remove entries outside the current window
        pipeline.zremrangebyscore(redisKey, 0, clearBefore);
        // 2. Add current request timestamp
        pipeline.zadd(redisKey, { score: now, member: `${now}:${Math.random()}` });
        // 3. Count active requests in window
        pipeline.zcard(redisKey);
        // 4. Set key expiry to auto-cleanup
        pipeline.expire(redisKey, windowSeconds);

        const results = await pipeline.exec();
        const currentRequests = results[2] as number;
        const remaining = Math.max(0, limit - currentRequests);
        const success = currentRequests <= limit;

        return {
            success,
            limit,
            remaining,
            reset: Math.ceil((now + windowSeconds * 1000) / 1000),
        };
    } catch (error) {
        console.error("[RateLimiter] Execution failure:", error);
        // Fail-open: don't block legitimate users if Redis has issues
        return { success: true, limit, remaining: 1, reset: 0 };
    }
}

/**
 * Extract client IP from request headers (works behind reverse proxies)
 */
export function getClientIp(req: Request): string {
    return (
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("x-real-ip") ||
        "unknown"
    );
}
