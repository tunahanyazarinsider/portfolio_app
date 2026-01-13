import redis
import json
import os
from typing import Optional, Any

class RedisCache:
    """
    Redis cache manager for caching stock data with 10-minute TTL.
    """

    def __init__(self):
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        try:
            self.redis_client = redis.from_url(redis_url, decode_responses=True)
            # Test connection
            self.redis_client.ping()
            print("✓ Connected to Redis cache")
        except Exception as e:
            print(f"⚠ Redis connection failed: {e}. Cache will be disabled.")
            self.redis_client = None

    def _is_connected(self) -> bool:
        """Check if Redis is connected."""
        return self.redis_client is not None

    def set_cache(self, key: str, value: Any, ttl: int = 600) -> bool:
        """
        Set a value in Redis cache with TTL.

        Args:
            key: Cache key
            value: Value to cache (will be JSON serialized)
            ttl: Time to live in seconds (default: 600 = 10 minutes)

        Returns:
            True if successful, False otherwise
        """
        if not self._is_connected():
            return False

        try:
            json_value = json.dumps(value, default=str)
            self.redis_client.setex(key, ttl, json_value)
            return True
        except Exception as e:
            print(f"Cache set error for key {key}: {e}")
            return False

    def get_cache(self, key: str) -> Optional[Any]:
        """
        Get a value from Redis cache.

        Args:
            key: Cache key

        Returns:
            Cached value if exists, None otherwise
        """
        if not self._is_connected():
            return None

        try:
            cached_value = self.redis_client.get(key)
            if cached_value:
                return json.loads(cached_value)
            return None
        except Exception as e:
            print(f"Cache get error for key {key}: {e}")
            return None

    def delete_cache(self, key: str) -> bool:
        """
        Delete a value from Redis cache.

        Args:
            key: Cache key

        Returns:
            True if successful, False otherwise
        """
        if not self._is_connected():
            return False

        try:
            self.redis_client.delete(key)
            return True
        except Exception as e:
            print(f"Cache delete error for key {key}: {e}")
            return False

    def flush_all(self) -> bool:
        """
        Clear all cache (use with caution).

        Returns:
            True if successful, False otherwise
        """
        if not self._is_connected():
            return False

        try:
            self.redis_client.flushdb()
            return True
        except Exception as e:
            print(f"Cache flush error: {e}")
            return False


# Global cache instance
cache = RedisCache()
