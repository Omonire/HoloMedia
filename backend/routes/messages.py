from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models import User, Message, Notification, serialize_users

messages_bp = Blueprint("messages", __name__, url_prefix="/api/messages")


@messages_bp.get("/conversations")
@jwt_required()
def conversations():
    user = db.session.get(User, int(get_jwt_identity()))
    rows = (
        db.session.query(Message)
        .filter((Message.sender_id == user.id) | (Message.recipient_id == user.id))
        .order_by(Message.created_at.desc())
        .limit(300)
        .all()
    )

    convos = {}
    order = []
    for m in rows:
        other_id = m.recipient_id if m.sender_id == user.id else m.sender_id
        key = other_id
        if key not in convos:
            convos[key] = {
                "other_id": other_id,
                "last_message": m.to_dict(viewer_id=user.id),
                "unread": 0,
            }
            order.append(key)
        if m.sender_id == other_id and not m.read:
            convos[key]["unread"] += 1

    if not convos:
        return jsonify(conversations=[])

    others = [db.session.get(User, oid) for oid in order]
    serialized = serialize_users([u for u in others if u], viewer=user)
    by_id = {s["id"]: s for s in serialized}

    result = []
    for key in order:
        entry = convos[key]
        other = by_id.get(key)
        if other is None:
            continue
        result.append({
            "user": other,
            "last_message": entry["last_message"],
            "unread": entry["unread"],
        })
    return jsonify(conversations=result)


@messages_bp.get("/<username>")
@jwt_required()
def thread(username):
    user = db.session.get(User, int(get_jwt_identity()))
    other = User.query.filter_by(username=username.lower()).first()
    if not other:
        return jsonify(error="User not found."), 404

    messages = (
        Message.query.filter(
            ((Message.sender_id == user.id) & (Message.recipient_id == other.id))
            | ((Message.sender_id == other.id) & (Message.recipient_id == user.id))
        )
        .order_by(Message.created_at.asc())
        .limit(500)
        .all()
    )

    for m in messages:
        if m.sender_id == other.id and not m.read:
            m.read = True
    db.session.commit()

    return jsonify(
        user=other.to_dict(viewer=user),
        messages=[m.to_dict(viewer_id=user.id) for m in messages],
    )


@messages_bp.post("/<username>")
@jwt_required()
def send(username):
    user = db.session.get(User, int(get_jwt_identity()))
    other = User.query.filter_by(username=username.lower()).first()
    if not other:
        return jsonify(error="User not found."), 404
    if other.id == user.id:
        return jsonify(error="You cannot message yourself."), 400

    content = (request.get_json(silent=True) or {}).get("content", "").strip()
    if not content:
        return jsonify(error="Message cannot be empty."), 400
    if len(content) > 2000:
        return jsonify(error="Message is too long."), 400

    msg = Message(sender_id=user.id, recipient_id=other.id, content=content)
    db.session.add(msg)

    notif = Notification.query.filter_by(
        user_id=other.id, actor_id=user.id, kind="message"
    ).first()
    if notif is None:
        db.session.add(Notification(
            user_id=other.id, actor_id=user.id, kind="message"
        ))
    db.session.commit()

    return jsonify(message=msg.to_dict(viewer_id=user.id)), 201
