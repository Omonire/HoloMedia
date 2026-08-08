from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models import User, Notification, serialize_notifications

notifications_bp = Blueprint("notifications", __name__, url_prefix="/api/notifications")


@notifications_bp.get("/")
@jwt_required()
def list_notifications():
    user = db.session.get(User, int(get_jwt_identity()))
    notes = (
        Notification.query.filter_by(user_id=user.id)
        .order_by(Notification.created_at.desc())
        .limit(50)
        .all()
    )
    unread = Notification.query.filter_by(user_id=user.id, read=False).count()
    return jsonify(
        notifications=serialize_notifications(notes),
        unread_count=unread,
    )


@notifications_bp.post("/read")
@jwt_required()
def mark_read():
    user = db.session.get(User, int(get_jwt_identity()))
    Notification.query.filter_by(user_id=user.id, read=False).update({"read": True})
    db.session.commit()
    return jsonify(message="All notifications marked as read.")
