from flask import Flask, jsonify

from config import Config
from extensions import db, jwt, cors, socketio
from models import User, Post, Like, Comment, Message, Notification, Bookmark, Group
from routes import ALL_BLUEPRINTS
import realtime  # noqa: F401  (registers socket.io handlers)


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(app, origins="*", supports_credentials=True)
    socketio.init_app(app, cors_allowed_origins="*")

    for bp in ALL_BLUEPRINTS:
        app.register_blueprint(bp)

    @app.get("/api/health")
    def health():
        return jsonify(status="ok", service="HoloMedia API")

    @app.get("/api/suggestions")
    def suggestions():
        users = User.query.order_by(User.followers.count().desc()).limit(5).all()
        return jsonify(users=[u.to_dict() for u in users])

    return app


app = create_app()


if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    socketio.run(app, debug=True, port=5000)
