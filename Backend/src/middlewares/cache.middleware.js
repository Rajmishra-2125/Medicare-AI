import redisClient from "../config/redis.js";

/**
 * Express middleware to cache responses in Redis.
 * Falls back to database query if Redis is unavailable or unconfigured.
 *
 * @param {string} keyPrefix - The base key name for the cache
 * @param {number} durationSeconds - Time to live in seconds (default 1 hour)
 */
export const cacheMiddleware = (keyPrefix, durationSeconds = 3600) => {
  return async (req, res, next) => {
    // Bypass caching if Redis is not connected
    if (!redisClient || !redisClient.isOpen) {
      return next();
    }

    // Construct a unique cache key based on prefix, user id, params, query, and request body
    let cacheKeyParts = [keyPrefix];

    if (req.user && req.user._id) {
      cacheKeyParts.push(req.user._id.toString());
    }
    if (req.params && Object.keys(req.params).length > 0) {
      cacheKeyParts.push(JSON.stringify(req.params));
    }
    if (req.query && Object.keys(req.query).length > 0) {
      cacheKeyParts.push(JSON.stringify(req.query));
    }
    if (req.body && Object.keys(req.body).length > 0 && req.method !== "GET") {
      cacheKeyParts.push(JSON.stringify(req.body));
    }

    const cacheKey = cacheKeyParts.join(":").replace(/\s+/g, "").toLowerCase();

    try {
      const cachedResponse = await redisClient.get(cacheKey);
      if (cachedResponse) {
        const parsed = JSON.parse(cachedResponse);
        return res.status(200).json(parsed);
      }

      // Intercept response to store it in cache before sending
      const originalJson = res.json;
      res.json = function (body) {
        res.json = originalJson;
        // Only cache successful API responses
        if (res.statusCode === 200 || res.statusCode === 201) {
          redisClient
            .setEx(cacheKey, durationSeconds, JSON.stringify(body))
            .catch((err) => console.error("Redis setEx error:", err));
        }
        return originalJson.call(this, body);
      };

      next();
    } catch (error) {
      console.warn("⚠️ Cache middleware read error:", error);
      next();
    }
  };
};

/**
 * Utility to invalidate keys matching a pattern.
 * E.g., invalidateCachePattern("doctors:*")
 *
 * @param {string} pattern - Redis glob pattern (e.g., "doctors:*")
 */
export const invalidateCachePattern = async (pattern) => {
  if (!redisClient || !redisClient.isOpen) return;

  try {
    const keys = await redisClient.keys(pattern);
    if (keys && keys.length > 0) {
      await redisClient.del(keys);
      console.log(
        `[Cache Invalidation] Successfully removed ${keys.length} keys matching: "${pattern}"`
      );
    }
  } catch (error) {
    console.error(
      `[Cache Invalidation] Failed to remove keys for pattern "${pattern}":`,
      error
    );
  }
};
