import json
import os
import time
import urllib.parse
import urllib.request

from config import BASE_DIR

TOKEN_URL = "https://accounts.spotify.com/api/token"
SEARCH_URL = "https://api.spotify.com/v1/search"

_CREDS_FILE = os.path.join(BASE_DIR, "spotify_creds.json")

_token = None
_token_expires_at = 0


def _load_creds():
    client_id = os.environ.get("SPOTIFY_CLIENT_ID") or ""
    client_secret = os.environ.get("SPOTIFY_CLIENT_SECRET") or ""
    if not client_id and os.path.exists(_CREDS_FILE):
        try:
            with open(_CREDS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
            client_id = client_id or data.get("client_id") or ""
            client_secret = client_secret or data.get("client_secret") or ""
        except (OSError, ValueError):
            pass
    return client_id.strip(), client_secret.strip()


def is_configured():
    client_id, client_secret = _load_creds()
    return bool(client_id and client_secret)


def _get_token():
    global _token, _token_expires_at
    if _token and time.time() < _token_expires_at - 60:
        return _token

    client_id, client_secret = _load_creds()
    if not client_id or not client_secret:
        raise RuntimeError("Spotify credentials are not configured.")

    body = urllib.parse.urlencode({
        "grant_type": "client_credentials",
        "client_id": client_id,
        "client_secret": client_secret,
    }).encode("utf-8")

    req = urllib.request.Request(
        TOKEN_URL,
        data=body,
        method="POST",
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.loads(resp.read().decode("utf-8"))

    _token = data["access_token"]
    _token_expires_at = time.time() + int(data.get("expires_in", 3600))
    return _token


def _api_get(url):
    req = urllib.request.Request(
        url,
        headers={"Authorization": f"Bearer {_get_token()}"},
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode("utf-8"))


def search_tracks(query, limit=8):
    query = (query or "").strip()
    if not query:
        return []
    params = urllib.parse.urlencode({
        "q": query,
        "type": "track",
        "limit": min(int(limit or 8), 20),
    })
    data = _api_get(f"{SEARCH_URL}?{params}")
    tracks = []
    for t in data.get("tracks", {}).get("items", []):
        tracks.append(_track_payload(t))
    return tracks


def _track_payload(t):
    images = t.get("album", {}).get("images", []) or []
    artwork = images[0].get("url") if images else None
    artists = ", ".join(a.get("name", "") for a in t.get("artists", []) if a.get("name"))
    return {
        "id": t.get("id"),
        "name": t.get("name", ""),
        "artist": artists,
        "artwork_url": artwork,
        "preview_url": t.get("preview_url"),
        "duration_ms": t.get("duration_ms"),
        "explicit": bool(t.get("explicit")),
        "spotify_url": (t.get("external_urls") or {}).get("spotify"),
    }
