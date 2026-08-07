import os
import re

from flask import Flask, Response, jsonify, request, send_from_directory

from config import Config
from extensions import db, jwt, cors, socketio
from models import User, Post, Like, Comment, Message, Notification, Bookmark, Group
from routes import ALL_BLUEPRINTS
from settings import is_maintenance_mode
from seo import SITE_URL, is_bot, seo_html
import realtime  # noqa: F401  (registers socket.io handlers)

FRONTEND_DIR = os.path.normpath(
    os.path.join(os.path.dirname(__file__), "..", "frontend",
                 "dist", "social-app", "browser")
)


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

    @app.get("/api/health")
    def health():
        return jsonify(status="ok", service="HoloMedia API",
                       maintenance=is_maintenance_mode())

    @app.get("/api/suggestions")
    def suggestions():
        # Retrieve all users, compute count of followers, and sort them descending
        users = User.query.all()
        # Sort users by follower count descending
        sorted_users = sorted(users, key=lambda u: u.followers.count(), reverse=True)[:5]
        return jsonify(users=[u.to_dict() for u in sorted_users])

    def _index_response():
        if is_bot(request.headers.get("User-Agent", "")):
            html = seo_html(request.path)
            if html:
                return Response(html, mimetype="text/html")
        return send_from_directory(FRONTEND_DIR, "index.html")

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
        return Response(body, mimetype="text/plain")

    @app.get("/sitemap.xml")
    def sitemap():
        today = "2026-08-07"
        urls = ["/", "/welcome", "/login", "/register"]
        entries = "".join(
            f"  <url><loc>{SITE_URL}{path}</loc><changefreq>weekly</changefreq>"
            f"<lastmod>{today}</lastmod><priority>{'1.0' if path == '/' else '0.6'}</priority></url>\n"
            for path in urls
        )
        body = (
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
            f"{entries}</urlset>\n"
        )
        return Response(body, mimetype="application/xml")

    @app.get("/<path:filename>")
    def frontend_files(filename):
        if filename.startswith("api/"):
            return jsonify(error="Not found."), 404
        if filename.startswith("robots.txt") or filename.startswith("sitemap.xml"):
            return jsonify(error="Not found."), 404
        full = os.path.join(FRONTEND_DIR, filename)
        if os.path.isfile(full):
            return send_from_directory(FRONTEND_DIR, filename)
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

    return app


app = create_app()


if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    socketio.run(app, debug=True, port=5000, allow_unsafe_werkzeug=True)
