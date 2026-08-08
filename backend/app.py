import gzip
import mimetypes
import os
import re
from datetime import datetime, timezone

from flask import Flask, Response, jsonify, request
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from sqlalchemy import func

from config import Config
from extensions import db, jwt, cors, socketio
from models import (User, Post, Like, Comment, Message, Notification,
                    Bookmark, Group, serialize_users)
from routes import ALL_BLUEPRINTS
from settings import is_maintenance_mode
from seo import SITE_URL, is_bot, seo_html
from cache import ttl_cache
from indexes import ensure_indexes
import realtime  # noqa: F401  (registers socket.io handlers)

FRONTEND_DIR = os.path.normpath(
    os.path.join(os.path.dirname(__file__), "..", "frontend",
                 "dist", "social-app", "browser")
)

HASHED_ASSET_RE = re.compile(r"-(?:[A-Za-z0-9_]){8,}\.(?:js|css)$")

MIN_COMPRESS_BYTES = 512
COMPRESSIBLE_TYPES = {
    "text/html", "text/plain", "text/css", "text/xml",
    "text/javascript", "application/json", "application/javascript",
    "application/xml", "image/svg+xml",
}

_initialized = False


def _ensure_schema():
    """Create missing tables/indexes once per process. Never crashes the app.

    On Postgres (Vercel) the schema already exists, so skip the per-instance
    DDL by default -- run it only for local SQLite or when ENSURE_SCHEMA=1.
    """
    global _initialized
    if _initialized:
        return
    is_sqlite = Config.SQLALCHEMY_DATABASE_URI.startswith("sqlite")
    if not is_sqlite and not os.environ.get("ENSURE_SCHEMA"):
        _initialized = True
        return
    try:
        db.create_all()
    except Exception:
        pass
    try:
        ensure_indexes()
    except Exception:
        pass
    _initialized = True


def _serve_file(full, max_age=86400):
    with open(full, "rb") as f:
        data = f.read()
    mime = mimetypes.guess_type(full)[0] or "application/octet-stream"
    resp = Response(data, mimetype=mime)
    if max_age >= 31536000:
        resp.headers["Cache-Control"] = "public, max-age=31536000, s-maxage=31536000, immutable"
    else:
        resp.headers["Cache-Control"] = f"public, max-age={max_age}, s-maxage={max_age}"
    resp.headers["Content-Length"] = str(len(data))
    return resp


def _viewer():
    if not request.headers.get("Authorization"):
        return None
    verify_jwt_in_request(optional=True)
    identity = get_jwt_identity()
    if identity is None:
        return None
    return db.session.get(User, int(identity))


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    jwt.init_app(app)

    origins = Config.CORS_ORIGINS
    if origins and origins.strip() != "*":
        cors.init_app(app, resources={r"/api/*": {"origins": [o.strip() for o in origins.split(",")]}},
                      supports_credentials=True)
    else:
        cors.init_app(app, origins="*", supports_credentials=True)
    socketio.init_app(app, cors_allowed_origins="*")

    for bp in ALL_BLUEPRINTS:
        app.register_blueprint(bp)

    @app.after_request
    def compress(resp):
        """Gzip compress JSON/text/JS responses when the client accepts it."""
        if resp.status_code in (204, 304):
            return resp
        if resp.direct_passthrough:
            return resp
        if resp.content_encoding:
            return resp
        ct = (resp.mimetype or "").lower()
        if ct not in COMPRESSIBLE_TYPES:
            return resp
        if "gzip" not in request.headers.get("Accept-Encoding", ""):
            return resp
        body = resp.get_data()
        if body is None or len(body) < MIN_COMPRESS_BYTES:
            return resp
        gz = gzip.compress(body, compresslevel=5)
        if len(gz) >= len(body):
            return resp
        resp.set_data(gz)
        resp.headers["Content-Encoding"] = "gzip"
        resp.headers["Content-Length"] = str(len(gz))
        vary = resp.headers.get("Vary")
        resp.headers["Vary"] = (vary + ", Accept-Encoding") if vary else "Accept-Encoding"
        return resp

    @app.get("/api/health")
    def health():
        return jsonify(status="ok", service="HoloMedia API",
                       maintenance=is_maintenance_mode())

    @ttl_cache(ttl=60)
    def _top_user_ids():
        from models import follows
        rows = (
            db.session.query(follows.c.followed_id, func.count().label("n"))
            .group_by(follows.c.followed_id)
            .order_by(func.count().desc())
            .limit(5)
            .all()
        )
        ids = [r[0] for r in rows]
        if len(ids) < 5:
            seen = set(ids)
            for u in User.query.order_by(User.created_at.desc()).limit(10):
                if u.id not in seen:
                    ids.append(u.id)
                    seen.add(u.id)
                if len(ids) >= 5:
                    break
        return ids

    @app.get("/api/suggestions")
    def suggestions():
        # One GROUP BY query (cached) instead of User.query.all() + a count
        # per user on every single page load.
        ids = _top_user_ids()
        if not ids:
            return jsonify(users=[])
        users = User.query.filter(User.id.in_(ids)).all()
        by_id = {u.id: u for u in users}
        ordered = [by_id[i] for i in ids if i in by_id]
        viewer = _viewer()
        return jsonify(users=serialize_users(ordered, viewer=viewer))

    def _index_response():
        if is_bot(request.headers.get("User-Agent", "")):
            html = seo_html(request.path)
            if html:
                return Response(html, mimetype="text/html")
        index = os.path.join(FRONTEND_DIR, "index.html")
        return _serve_file(index, max_age=0)

    @app.get("/")
    def frontend_index():
        return _index_response()

    @app.get("/robots.txt")
    def robots():
        body = (
            "User-agent: *\n"
            "Allow: /\n"
            "\n"
            f"Sitemap: {SITE_URL}/sitemap.xml\n"
        )
        resp = Response(body, mimetype="text/plain")
        resp.headers["Cache-Control"] = "public, max-age=86400, s-maxage=86400"
        return resp

    @ttl_cache(ttl=6 * 3600)
    def _sitemap_xml():
        today = datetime.now(timezone.utc).date().isoformat()
        entries = []
        for path, priority in (("/", "1.0"), ("/welcome", "0.6"),
                               ("/login", "0.6"), ("/register", "0.6")):
            entries.append((path, today, priority))
        for p in Post.query.all():
            entries.append((f"/p/{p.id}", p.created_at.date().isoformat(), "0.5"))
        for g in Group.query.all():
            entries.append((f"/groups/{g.id}", g.created_at.date().isoformat(), "0.5"))
        for u in User.query.all():
            entries.append((f"/{u.username}", u.created_at.date().isoformat(), "0.4"))
        urls = "".join(
            f"  <url><loc>{SITE_URL}{path}</loc><lastmod>{lastmod}</lastmod>"
            f"<changefreq>weekly</changefreq><priority>{priority}</priority></url>\n"
            for path, lastmod, priority in entries
        )
        return (
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
            f"{urls}</urlset>\n"
        )

    @app.get("/sitemap.xml")
    def sitemap():
        resp = Response(_sitemap_xml(), mimetype="application/xml")
        resp.headers["Cache-Control"] = "public, max-age=3600, s-maxage=3600"
        return resp

    @app.get("/<path:filename>")
    def frontend_files(filename):
        if filename.startswith("api/"):
            return jsonify(error="Not found."), 404
        if filename.startswith("robots.txt") or filename.startswith("sitemap.xml"):
            return jsonify(error="Not found."), 404
        full = os.path.join(FRONTEND_DIR, filename)
        if os.path.isfile(full):
            if HASHED_ASSET_RE.search(filename):
                return _serve_file(full, max_age=31536000)
            if filename == "index.html":
                return _serve_file(full, max_age=0)
            return _serve_file(full, max_age=86400)
        return _index_response()

    @app.errorhandler(404)
    def not_found(_):
        return jsonify(error="Not found."), 404

    @app.errorhandler(413)
    def too_large(_):
        return jsonify(error="Upload is too large."), 413

    @app.errorhandler(500)
    def server_error(_):
        return jsonify(error="Internal server error."), 500

    _ensure_schema()

    return app


app = create_app()


if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    socketio.run(app, debug=True, port=5000, allow_unsafe_werkzeug=True)
