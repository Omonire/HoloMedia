from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request

from extensions import db
from models import User, Post, Notification, follows

users_bp = Blueprint("users", __name__, url_prefix="/api/users")


def _get_viewer():
    if not request.headers.get("Authorization"):
        return None
    verify_jwt_in_request(optional=True)
    return db.session.get(User, int(get_jwt_identity()))


@users_bp.get("/search")
def search():
    q = (request.args.get("q") or "").strip().lower()
    if not q:
        return jsonify(users=[])
    users = (
        User.query.filter(
            User.username.contains(q) | User.full_name.ilike(f"%{q}%")
        )
        .order_by(User.created_at.desc())
        .limit(20)
        .all()
    )
    viewer = _get_viewer()
    return jsonify(users=[u.to_dict(viewer=viewer) for u in users])


@users_bp.get("/<username>")
def get_user(username):
    user = User.query.filter_by(username=username.lower()).first()
    if not user:
        return jsonify(error="User not found."), 404
    viewer = _get_viewer()
    return jsonify(user=user.to_dict(viewer=viewer, detail=True))


@users_bp.get("/<username>/posts")
def user_posts(username):
    user = User.query.filter_by(username=username.lower()).first()
    if not user:
        return jsonify(error="User not found."), 404
    viewer = _get_viewer()
    posts = user.posts.order_by(Post.created_at.desc()).all()
    return jsonify(posts=[p.to_dict(viewer=viewer) for p in posts])


@users_bp.get("/<username>/followers")
def followers(username):
    user = User.query.filter_by(username=username.lower()).first()
    if not user:
        return jsonify(error="User not found."), 404
    viewer = _get_viewer()
    return jsonify(users=[u.to_dict(viewer=viewer) for u in user.followers.order_by(follows.c.created_at.desc())])


@users_bp.get("/<username>/following")
def following(username):
    user = User.query.filter_by(username=username.lower()).first()
    if not user:
        return jsonify(error="User not found."), 404
    viewer = _get_viewer()
    return jsonify(users=[u.to_dict(viewer=viewer) for u in user.following.order_by(follows.c.created_at.desc())])


@users_bp.post("/<username>/follow")
@jwt_required()
def follow(username):
    viewer = db.session.get(User, int(get_jwt_identity()))
    target = User.query.filter_by(username=username.lower()).first()
    if not target:
        return jsonify(error="User not found."), 404
    if target.id == viewer.id:
        return jsonify(error="You cannot follow yourself."), 400

    if not viewer.is_following(target):
        viewer.following.append(target)
        if Notification.query.filter_by(
            user_id=target.id, actor_id=viewer.id, kind="follow"
        ).first() is None:
            db.session.add(Notification(
                user_id=target.id, actor_id=viewer.id, kind="follow"
            ))
        db.session.commit()

    return jsonify(user=target.to_dict(viewer=viewer, detail=True))


@users_bp.delete("/<username>/follow")
@jwt_required()
def unfollow(username):
    viewer = db.session.get(User, int(get_jwt_identity()))
    target = User.query.filter_by(username=username.lower()).first()
    if not target:
        return jsonify(error="User not found."), 404

    if viewer.is_following(target):
        viewer.following.remove(target)
        Notification.query.filter_by(
            user_id=target.id, actor_id=viewer.id, kind="follow"
        ).delete()
        db.session.commit()

    return jsonify(user=target.to_dict(viewer=viewer, detail=True))
