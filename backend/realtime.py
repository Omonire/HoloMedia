from flask import request
from flask_jwt_extended import decode_token
from flask_socketio import join_room, leave_room

from extensions import db, socketio
from models import User, Message, Notification

# sid -> user id for authenticated sockets
socket_users = {}


def _room(user_id):
    return f"user_{user_id}"


@socketio.on("connect")
def on_connect(auth):
    auth = auth or {}
    token = auth.get("token")
    if not token:
        return False
    try:
        payload = decode_token(token)
        user_id = int(payload.get("sub"))
    except Exception:
        return False
    user = db.session.get(User, user_id)
    if not user:
        return False
    socket_users[request.sid] = user_id
    join_room(_room(user_id))
    socketio.emit("presence", {"user_id": user_id}, room=_room(user_id))
    return True


@socketio.on("disconnect")
def on_disconnect():
    user_id = socket_users.pop(request.sid, None)
    if user_id is not None:
        leave_room(_room(user_id))


def _to_payload(msg):
    return {
        "id": msg.id,
        "content": msg.content,
        "read": msg.read,
        "created_at": msg.created_at.isoformat(),
        "sender_id": msg.sender_id,
        "recipient_id": msg.recipient_id,
    }


@socketio.on("send_message")
def on_send(data):
    data = data or {}
    sender_id = socket_users.get(request.sid)
    if sender_id is None:
        return
    recipient_id = data.get("recipient_id")
    content = (data.get("content") or "").strip()

    if not recipient_id or not content:
        return
    if not isinstance(recipient_id, int):
        try:
            recipient_id = int(recipient_id)
        except (TypeError, ValueError):
            return
    if sender_id == recipient_id:
        return

    recipient = db.session.get(User, recipient_id)
    sender = db.session.get(User, sender_id)
    if not recipient or not sender or len(content) > 2000:
        return

    msg = Message(sender_id=sender_id, recipient_id=recipient_id, content=content)
    db.session.add(msg)

    notif = Notification.query.filter_by(
        user_id=recipient_id, actor_id=sender_id, kind="message"
    ).first()
    if notif is None:
        db.session.add(Notification(
            user_id=recipient_id, actor_id=sender_id, kind="message"
        ))
    db.session.commit()

    payload = _to_payload(msg)
    socketio.emit("new_message", payload, room=_room(recipient_id))
    socketio.emit("new_message", payload, room=_room(sender_id))


@socketio.on("mark_read")
def on_mark_read(data):
    data = data or {}
    user_id = socket_users.get(request.sid)
    if user_id is None:
        return
    other_id = data.get("other_id")
    if not other_id:
        return
    Message.query.filter_by(sender_id=other_id, recipient_id=user_id, read=False) \
        .update({"read": True})
    db.session.commit()
