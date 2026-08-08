import re

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request

from extensions import db
from models import User, Group, Post, Notification, group_members, serialize_posts, serialize_users, serialize_groups

groups_bp = Blueprint("groups", __name__, url_prefix="/api/groups")


def _viewer():
    verify_jwt_in_request(optional=True)
    identity = get_jwt_identity()
    if identity is None:
        return None
    return db.session.get(User, int(identity))


@groups_bp.get("/")
def list_groups():
    groups = (Group.query
              .outerjoin(group_members, group_members.c.group_id == Group.id)
              .group_by(Group.id)
              .order_by(db.func.count(group_members.c.user_id).desc(), Group.name.asc())
              .all())
    viewer = None
    if request.headers.get("Authorization"):
        try:
            viewer = _viewer()
        except Exception:
            viewer = None
    return jsonify(groups=serialize_groups(groups, viewer=viewer))


@groups_bp.post("/")
@jwt_required()
def create_group():
    user = _viewer()
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    description = (data.get("description") or "").strip()
    icon_color = data.get("icon_color") or "#7c3aed"

    if not name or len(name) < 2 or len(name) > 80:
        return jsonify(error="Group name must be 2-80 characters."), 400
    if Group.query.filter(db.func.lower(Group.name) == name.lower()).first():
        return jsonify(error="A group with that name already exists."), 409
    if not re.match(r"^#[0-9a-fA-F]{6}$", icon_color):
        icon_color = "#7c3aed"

    group = Group(name=name, description=description, icon_color=icon_color,
                  created_by_id=user.id)
    db.session.add(group)
    db.session.flush()
    group.members.append(user)
    db.session.commit()
    return jsonify(group=group.to_dict(viewer=user)), 201


@groups_bp.get("/<int:group_id>")
def get_group(group_id):
    group = db.session.get(Group, group_id)
    if not group:
        return jsonify(error="Group not found."), 404
    viewer = None
    if request.headers.get("Authorization"):
        try:
            viewer = _viewer()
        except Exception:
            viewer = None
    return jsonify(group=group.to_dict(viewer=viewer, detail=True))


@groups_bp.post("/<int:group_id>/join")
@jwt_required()
def join(group_id):
    user = _viewer()
    group = db.session.get(Group, group_id)
    if not group:
        return jsonify(error="Group not found."), 404
    if not group.is_member(user):
        group.members.append(user)
        if group.created_by_id != user.id and Notification.query.filter_by(
            user_id=group.created_by_id, actor_id=user.id, kind="group"
        ).first() is None:
            db.session.add(Notification(
                user_id=group.created_by_id, actor_id=user.id, kind="group"
            ))
        db.session.commit()
    return jsonify(group=group.to_dict(viewer=user, detail=True))


@groups_bp.delete("/<int:group_id>/join")
@jwt_required()
def leave(group_id):
    user = _viewer()
    group = db.session.get(Group, group_id)
    if not group:
        return jsonify(error="Group not found."), 404
    if group.is_member(user):
        group.members.remove(user)
        db.session.commit()
    return jsonify(group=group.to_dict(viewer=user, detail=True))


@groups_bp.get("/<int:group_id>/posts")
def group_posts(group_id):
    group = db.session.get(Group, group_id)
    if not group:
        return jsonify(error="Group not found."), 404
    viewer = None
    if request.headers.get("Authorization"):
        try:
            viewer = _viewer()
        except Exception:
            viewer = None
    posts = group.posts.order_by(Post.created_at.desc()).limit(60).all()
    return jsonify(posts=serialize_posts(posts, viewer=viewer))


@groups_bp.post("/<int:group_id>/posts")
@jwt_required()
def create_group_post(group_id):
    user = _viewer()
    group = db.session.get(Group, group_id)
    if not group:
        return jsonify(error="Group not found."), 404
    if not group.is_member(user):
        return jsonify(error="Join the group to post in it."), 403

    data = request.get_json(silent=True) or {}
    content = (data.get("content") or "").strip()
    image_url = (data.get("image_url") or "").strip() or None
    video_url = (data.get("video_url") or "").strip() or None

    if not content and not image_url and not video_url:
        return jsonify(error="Post needs some content, an image, or a video."), 400
    if len(content) > 2000:
        return jsonify(error="Post is too long."), 400

    post = Post(user_id=user.id, content=content, image_url=image_url,
                video_url=video_url, group_id=group.id)
    db.session.add(post)
    db.session.commit()
    return jsonify(post=post.to_dict(viewer=user)), 201


@groups_bp.get("/<int:group_id>/members")
def group_members_list(group_id):
    group = db.session.get(Group, group_id)
    if not group:
        return jsonify(error="Group not found."), 404
    viewer = None
    if request.headers.get("Authorization"):
        try:
            viewer = _viewer()
        except Exception:
            viewer = None
    members = group.members.order_by(group_members.c.created_at.desc()).all()
    return jsonify(members=serialize_users(members, viewer=viewer))
