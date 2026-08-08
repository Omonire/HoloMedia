"""Tiny in-process TTL cache for expensive, slow-changing computations.

Vercel's Python runtime reuses warm instances between requests, so a
per-instance cache still removes repeated full scans / N+1 queries on the
common hot paths (suggestions, trending, sounds, sitemap).
"""

import threading
import time

_CACHE = {}
_LOCK = threading.Lock()


def ttl_cache(ttl=60):
    """Decorator caching a function's return value for `ttl` seconds.

    Only plain data (dicts/lists/primitives) should be cached -- never ORM
    objects, which can go stale.
    """

    def deco(fn):
        def wrapper(*args, **kwargs):
            key = (
                fn.__module__,
                fn.__qualname__,
                args,
                tuple(sorted(kwargs.items())),
            )
            now = time.monotonic()
            with _LOCK:
                hit = _CACHE.get(key)
                if hit is not None and now - hit[0] < ttl:
                    return hit[1]
            value = fn(*args, **kwargs)
            with _LOCK:
                _CACHE[key] = (now, value)
            return value

        return wrapper

    return deco


def invalidate_cache():
    """Drop all cached entries (call after writes when freshness matters)."""
    with _LOCK:
        _CACHE.clear()
