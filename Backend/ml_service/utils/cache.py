import redis
import json
import os
import logging
from typing import Optional, Any

logger = logging.getLogger(__name__)

class RedisCache:
    def __init__(self):
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        try:
            self.redis_client = redis.from_url(redis_url, decode_responses=True)
            self.redis_client.ping()
            logger.info("ML Service connected to Redis cache")
        except Exception as e:
            logger.warning(f"Redis connection failed: {e}. Cache will be disabled.")
            self.redis_client = None

    def _is_connected(self) -> bool:
        return self.redis_client is not None

    def set_cache(self, key: str, value: Any, ttl: int = 900) -> bool:
        if not self._is_connected():
            return False
        try:
            json_value = json.dumps(value, default=str)
            self.redis_client.setex(key, ttl, json_value)
            return True
        except Exception as e:
            logger.error(f"Cache set error for key {key}: {e}")
            return False

    def get_cache(self, key: str) -> Optional[Any]:
        if not self._is_connected():
            return None
        try:
            cached_value = self.redis_client.get(key)
            if cached_value:
                return json.loads(cached_value)
            return None
        except Exception as e:
            logger.error(f"Cache get error for key {key}: {e}")
            return None

cache = RedisCache()
