from functools import wraps

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models import (User, Post, Comment, Group, Message, Like, Bookmark,
                    Notification, Upload, Setting)
from settings import SETTING_DEFAULTS

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")


def admin_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        user = db.session.get(User, int(get_jwt_identity()))
        if not user or not user.is_admin:
            return jsonify(error="Admin access required."), 403
        if user.is_suspended:
            return jsonify(error="This account has been suspended."), 403
        return fn(*args, **kwargs)
    return wrapper


def _admin_user(u):
    return {
        "id": u.id,
        "username": u.username,
        "email": u.email,
        "full_name": u.full_name,
        "bio": u.bio or "",
        "avatar_color": u.avatar_color,
        "is_admin": u.is_admin,
        "is_suspended": u.is_suspended,
        "created_at": u.created_at.isoformat(),
        "post_count": u.posts.count(),
        "followers_count": u.followers.count(),
    }


def _admin_post(p):
    return {
        "id": p.id,
        "content": p.content,
        "image_url": p.image_url,
        "video_url": p.video_url,
        "sound": p.sound,
        "group_id": p.group_id,
        "repost_of_id": p.repost_of_id,
        "created_at": p.created_at.isoformat(),
        "author": _admin_user(p.author),
        "likes_count": p.likes.count(),
        "comments_count": p.comments.count(),
    }


def _admin_comment(c):
    return {
        "id": c.id,
        "content": c.content,
        "created_at": c.created_at.isoformat(),
        "post_id": c.post_id,
        "author": _admin_user(c.author),
    }


def _admin_group(g):
    return {
        "id": g.id,
        "name": g.name,
        "description": g.description or "",
        "icon_color": g.icon_color,
        "created_at": g.created_at.isoformat(),
        "members_count": g.members.count(),
        "posts_count": g.posts.count(),
        "creator": _admin_user(g.creator),
    }


@admin_bp.get("/stats")
@admin_required
def stats():
    return jsonify(stats={
        "users": User.query.count(),
        "posts": Post.query.count(),
        "reels": Post.query.filter(Post.video_url.isnot(None)).count(),
        "groups": Group.query.count(),
        "comments": Comment.query.count(),
        "messages": Message.query.count(),
        "likes": Like.query.count(),
        "bookmarks": Bookmark.query.count(),
        "uploads": Upload.query.count(),
        "suspended_users": User.query.filter_by(is_suspended=True).count(),
        "admins": User.query.filter_by(is_admin=True).count(),
    })


@admin_bp.get("/users")
@admin_required
def list_users():
    q = (request.args.get("q") or "").strip().lower()
    sort = request.args.get("sort") or "recent"
    query = User.query
    if q:
        query = query.filter(
            User.username.contains(q) | User.email.contains(q) | User.full_name.ilike(f"%{q}%")
        )
    if sort == "admins":
        query = query.filter_by(is_admin=True)
    elif sort == "suspended":
        query = query.filter_by(is_suspended=True)
    users = query.order_by(User.created_at.desc()).limit(200).all()
    return jsonify(users=[_admin_user(u) for u in users])


@admin_bp.patch("/users/<int:user_id>")
@admin_required
def update_user(user_id):
    user = db.session.get(User, user_id)
    if not user:
        return jsonify(error="User not found."), 404

    data = request.get_json(silent=True) or {}
    me = db.session.get(User, int(get_jwt_identity()))

    if "is_admin" in data and isinstance(data["is_admin"], bool):
        if user.id == me.id and not data["is_admin"]:
            return jsonify(error="You cannot remove your own admin access."), 400
        user.is_admin = data["is_admin"]
    if "is_suspended" in data and isinstance(data["is_suspended"], bool):
        if user.id == me.id and data["is_suspended"]:
            return jsonify(error="You cannot suspend your own account."), 400
        user.is_suspended = data["is_suspended"]

    db.session.commit()
    return jsonify(user=_admin_user(user))


@admin_bp.delete("/users/<int:user_id>")
@admin_required
def delete_user(user_id):
    user = db.session.get(User, user_id)
    if not user:
        return jsonify(error="User not found."), 404
    me = db.session.get(User, int(get_jwt_identity()))
    if user.id == me.id:
        return jsonify(error="You cannot delete your own account."), 400

    for upload in Upload.query.filter_by(user_id=user.id).all():
        db.session.delete(upload)
    db.session.delete(user)
    db.session.commit()
    return jsonify(message="User deleted.")


@admin_bp.get("/posts")
@admin_required
def list_posts():
    q = (request.args.get("q") or "").strip().lower()
    query = Post.query
    if q:
        query = query.filter(Post.content.ilike(f"%{q}%"))
    posts = query.order_by(Post.created_at.desc()).limit(200).all()
    return jsonify(posts=[_admin_post(p) for p in posts])


@admin_bp.delete("/posts/<int:post_id>")
@admin_required
def delete_post(post_id):
    post = db.session.get(Post, post_id)
    if not post:
        return jsonify(error="Post not found."), 404
    db.session.delete(post)
    db.session.commit()
    return jsonify(message="Post deleted.")


@admin_bp.get("/comments")
@admin_required
def list_comments():
    q = (request.args.get("q") or "").strip().lower()
    query = Comment.query
    if q:
        query = query.filter(Comment.content.ilike(f"%{q}%"))
    comments = query.order_by(Comment.created_at.desc()).limit(200).all()
    return jsonify(comments=[_admin_comment(c) for c in comments])


@admin_bp.delete("/comments/<int:comment_id>")
@admin_required
def delete_comment(comment_id):
    comment = db.session.get(Comment, comment_id)
    if not comment:
        return jsonify(error="Comment not found."), 404
    db.session.delete(comment)
    db.session.commit()
    return jsonify(message="Comment deleted.")


@admin_bp.get("/groups")
@admin_required
def list_groups():
    groups = Group.query.order_by(Group.created_at.desc()).limit(200).all()
    return jsonify(groups=[_admin_group(g) for g in groups])


@admin_bp.delete("/groups/<int:group_id>")
@admin_required
def delete_group(group_id):
    group = db.session.get(Group, group_id)
    if not group:
        return jsonify(error="Group not found."), 404
    db.session.delete(group)
    db.session.commit()
    return jsonify(message="Group deleted.")


def _settings_map():
    rows = {s.key: s.value for s in Setting.query.all()}
    merged = dict(SETTING_DEFAULTS)
    merged.update(rows)
    return merged


@admin_bp.get("/settings")
@admin_required
def get_settings():
    return jsonify(settings=_settings_map())


@admin_bp.patch("/settings")
@admin_required
def update_settings():
    data = (request.get_json(silent=True) or {}).get("settings") or {}
    for key, value in data.items():
        if key not in SETTING_DEFAULTS:
            continue
        text = str(value).lower()
        if text not in ("true", "false") and key in ("registration_open", "maintenance_mode"):
            continue
        row = Setting.query.get(key)
        if row is None:
            db.session.add(Setting(key=key, value=str(value)))
        else:
            row.value = str(value)
    db.session.commit()
    return jsonify(settings=_settings_map())
