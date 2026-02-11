"""Metadata fetching service - provides real-time metadata resolution with TTL cache"""

import asyncio
import base64
import json
import time
from collections import OrderedDict
from urllib.parse import unquote

import httpx
import structlog

from src.core.blockchain_config import IPFS_GATEWAY

logger = structlog.get_logger()

# Default fallback metadata when fetch fails
DEFAULT_METADATA = {
    "name": "Unknown Agent",
    "description": "Metadata fetch failed",
}


class TTLCache:
    """LRU cache with TTL expiration, based on OrderedDict"""

    def __init__(self, max_size: int = 500, ttl_seconds: int = 300):
        self._cache: OrderedDict[str, tuple[float, dict]] = OrderedDict()
        self._max_size = max_size
        self._ttl_seconds = ttl_seconds

    def get(self, key: str) -> dict | None:
        """Get value if exists and not expired, returns None otherwise"""
        if key not in self._cache:
            return None

        timestamp, value = self._cache[key]
        if time.time() - timestamp > self._ttl_seconds:
            del self._cache[key]
            return None

        # Move to end (most recently used)
        self._cache.move_to_end(key)
        return value

    def set(self, key: str, value: dict) -> None:
        """Set value with current timestamp, evict LRU if at capacity"""
        if key in self._cache:
            self._cache.move_to_end(key)
        elif len(self._cache) >= self._max_size:
            self._cache.popitem(last=False)  # Evict oldest (LRU)

        self._cache[key] = (time.time(), value)

    @property
    def size(self) -> int:
        return len(self._cache)


class MetadataService:
    """Service for fetching and parsing agent metadata from various URI formats"""

    def __init__(self):
        self._cache = TTLCache(max_size=500, ttl_seconds=300)

    def _detect_uri_type(self, uri: str) -> str:
        """Detect the type of metadata URI"""
        if not uri or not uri.strip():
            return "empty"
        if uri.startswith("ipfs://"):
            return "ipfs"
        if uri.startswith("data:"):
            return "data"
        if uri.startswith("{") or uri.startswith("["):
            return "json"
        return "http"

    def _resolve_url(self, uri: str, uri_type: str) -> str:
        """Resolve URI to a browser-accessible URL"""
        if uri_type == "ipfs":
            return f"{IPFS_GATEWAY}{uri[7:]}"
        if uri_type == "http":
            return uri
        return ""

    async def fetch_and_parse(
        self, uri: str, timeout: float = 10.0, retries: int = 1,
        use_cache: bool = True,
    ) -> dict:
        """
        Fetch and parse metadata from URI (with optional caching).

        Returns:
            dict with keys:
                - raw_uri: Original URI string
                - resolved_url: Browser-accessible URL (for IPFS/HTTP)
                - uri_type: 'ipfs' | 'data' | 'http' | 'json' | 'empty'
                - metadata: Parsed JSON object or None
                - success: Boolean
                - error: Error message if failed
                - fetch_time_ms: Time taken to fetch
        """
        start_time = time.time()
        uri_type = self._detect_uri_type(uri)
        resolved_url = self._resolve_url(uri, uri_type)

        result = {
            "raw_uri": uri or "",
            "resolved_url": resolved_url,
            "uri_type": uri_type,
            "metadata": None,
            "success": False,
            "error": None,
            "fetch_time_ms": 0,
        }

        # Check cache first
        if use_cache:
            cached = self._cache.get(uri or "")
            if cached is not None:
                result["metadata"] = cached
                result["success"] = True
                result["fetch_time_ms"] = 0
                return result

        try:
            metadata = await self._fetch_metadata(uri, timeout, retries)
            result["metadata"] = metadata
            result["success"] = True
            # Store in cache
            if use_cache and uri:
                self._cache.set(uri, metadata)
        except Exception as e:
            result["error"] = str(e)
            logger.warning("metadata_service_error", uri=uri[:100] if uri else "", error=str(e))
        finally:
            result["fetch_time_ms"] = int((time.time() - start_time) * 1000)

        return result

    async def fetch_metadata_safe(
        self, uri: str, timeout: float = 10.0, retries: int = 1,
    ) -> dict:
        """
        Fetch metadata with graceful degradation — never raises exceptions.
        Returns parsed metadata dict on success, or DEFAULT_METADATA on failure.
        Used by blockchain_sync to match its original error-tolerant behavior.
        """
        result = await self.fetch_and_parse(uri, timeout, retries)
        if result["success"] and result["metadata"]:
            return result["metadata"]
        return {**DEFAULT_METADATA}

    async def _fetch_metadata(
        self, uri: str, timeout: float = 10.0, retries: int = 1
    ) -> dict:
        """
        Core metadata fetching logic.
        Supports: IPFS, Data URI, Direct JSON, HTTP/HTTPS
        """
        # Handle empty URI
        if not uri or not uri.strip():
            raise ValueError("No metadata URI provided")

        # Handle direct JSON string (object or array)
        if uri.startswith("{") or uri.startswith("["):
            return self._parse_json_string(uri)

        # Handle data URI
        if uri.startswith("data:"):
            return self._parse_data_uri(uri)

        # Handle IPFS URI - convert to HTTP
        if uri.startswith("ipfs://"):
            url = f"{IPFS_GATEWAY}{uri[7:]}"
        else:
            url = uri

        # Fetch from HTTP/HTTPS URL
        return await self._fetch_http(url, timeout, retries)

    def _parse_json_string(self, uri: str) -> dict:
        """Parse direct JSON string"""
        try:
            metadata = json.loads(uri)

            # Handle list case - take first element
            if isinstance(metadata, list):
                if len(metadata) > 0 and isinstance(metadata[0], dict):
                    metadata = metadata[0]
                else:
                    raise ValueError("JSON is a list without valid objects")

            if not isinstance(metadata, dict):
                raise ValueError(f"JSON has unexpected type: {type(metadata).__name__}")

            # Ensure required fields
            if "name" not in metadata and "agent_id" in metadata:
                metadata["name"] = metadata["agent_id"]

            return metadata
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON: {e}")

    def _parse_data_uri(self, uri: str) -> dict:
        """Parse data URI (base64 or plain encoded)"""
        try:
            if "base64," in uri:
                base64_data = uri.split("base64,")[1]
                json_data = base64.b64decode(base64_data).decode("utf-8")
            elif "," in uri:
                json_data = uri.split(",", 1)[1]
                json_data = unquote(json_data)
            else:
                raise ValueError("Unsupported data URI format")

            metadata = json.loads(json_data)

            # Handle list case
            if isinstance(metadata, list):
                if len(metadata) > 0 and isinstance(metadata[0], dict):
                    metadata = metadata[0]
                else:
                    raise ValueError("Data URI contains list without valid objects")

            if not isinstance(metadata, dict):
                raise ValueError(f"Data URI has unexpected type: {type(metadata).__name__}")

            return metadata
        except (json.JSONDecodeError, UnicodeDecodeError) as e:
            raise ValueError(f"Data URI parse failed: {e}")

    async def _fetch_http(self, url: str, timeout: float, retries: int) -> dict:
        """Fetch metadata from HTTP/HTTPS URL with retry logic"""
        last_error = None

        for attempt in range(retries):
            try:
                async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
                    response = await client.get(url)
                    response.raise_for_status()
                    data = response.json()

                    # Handle list response
                    if isinstance(data, list):
                        if len(data) > 0 and isinstance(data[0], dict):
                            return data[0]
                        raise ValueError("Response is a list without valid objects")

                    if not isinstance(data, dict):
                        raise ValueError(f"Response has unexpected type: {type(data).__name__}")

                    return data

            except httpx.TimeoutException:
                last_error = "Request timeout"
            except httpx.HTTPStatusError as e:
                last_error = f"HTTP {e.response.status_code}: {e.response.reason_phrase}"
            except json.JSONDecodeError:
                last_error = "Invalid JSON response"
            except Exception as e:
                last_error = str(e)

            if attempt < retries - 1:
                await asyncio.sleep(1)

        raise ValueError(f"Fetch failed after {retries} attempts: {last_error}")


# Singleton instance
metadata_service = MetadataService()
