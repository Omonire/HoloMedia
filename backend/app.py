import os

from flask import Flask, jsonify, send_from_directory

from config import Config
from extensions import db, jwt, cors, socketio
from models import User, Post, Like, Comment, Message, Notification, Bookmark, Group
from routes import ALL_BLUEPRINTS
from settings import is_maintenance_mode
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
        users = User.query.order_by(User.followers.count().desc()).limit(5).all()
        return jsonify(users=[u.to_dict() for u in users])

    @app.get("/")
    def frontend_index():
        return send_from_directory(FRONTEND_DIR, "index.html")

    @app.get("/<path:filename>")
    def frontend_files(filename):
        if filename.startswith("api/"):
            return jsonify(error="Not found."), 404
        full = os.path.join(FRONTEND_DIR, filename)
        if os.path.isfile(full):
            return send_from_directory(FRONTEND_DIR, filename)
        return send_from_directory(FRONTEND_DIR, "index.html")

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
    socketio.run(app, debug=True, port=5000)
