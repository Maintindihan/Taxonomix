import redis
import os

# redis_client = redis.Redis(host="localhost", port=6379, decode_responses=True)

try:
    redis_client = redis.Redis.from_url(os.getenv("REDIS_URL")
                                        , decode_responses=True)
    redis_client.ping()
    print("✅ Redis connection successful.")

except Exception as e:
    print("Redis error:", e)