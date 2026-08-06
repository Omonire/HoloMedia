import re

from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

from extensions import db
from models import User

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def _valid_username(name):
    return bool(re.match(r"^[a-zA-Z0-9_.]{3,30}$", name))


def _valid_email(email):
    return bool(re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email))


@auth_bp.post("/register")
def register():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip().lower()
    email = (data.get("email") or "").strip().lower()
    full_name = (data.get("full_name") or "").strip()
    password = data.get("password") or ""

    if not _valid_username(username):
        return jsonify(error="Username must be 3-30 chars (letters, numbers, _ or .)."), 400
    if not _valid_email(email):
        return jsonify(error="A valid email is required."), 400
    if not full_name:
        return jsonify(error="Full name is required."), 400
    if len(password) < 6:
        return jsonify(error="Password must be at least 6 characters."), 400
    if User.query.filter_by(username=username).first():
        return jsonify(error="Username already taken."), 409
    if User.query.filter_by(email=email).first():
        return jsonify(error="Email already registered."), 409

    user = User(username=username, email=email, full_name=full_name)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=str(user.id))
    return jsonify(token=token, user=user.to_dict()), 201


@auth_bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip().lower()
    password = data.get("password") or ""

    user = User.query.filter(
        (User.username == username) | (User.email == username)
    ).first()

    if not user or not user.check_password(password):
        return jsonify(error="Invalid username or password."), 401

    token = create_access_token(identity=str(user.id))
    return jsonify(token=token, user=user.to_dict())


@auth_bp.get("/me")
@jwt_required()
def me():
    user = db.session.get(User, int(get_jwt_identity()))
    if not user:
        return jsonify(error="User not found."), 404
    return jsonify(user=user.to_dict(viewer=user))


@auth_bp.put("/me")
@jwt_required()
def update_me():
    user = db.session.get(User, int(get_jwt_identity()))
    data = request.get_json(silent=True) or {}

    if "full_name" in data:
        user.full_name = (data["full_name"] or "").strip() or user.full_name
    if "bio" in data:
        user.bio = (data.get("bio") or "")[:240]
    if "avatar_color" in data:
        if re.match(r"^#[0-9a-fA-F]{6}$", data["avatar_color"]):
            user.avatar_color = data["avatar_color"]
    if "password" in data and data["password"]:
        if len(data["password"]) < 6:
            return jsonify(error="Password must be at least 6 characters."), 400
        user.set_password(data["password"])

    db.session.commit()
    return jsonify(user=user.to_dict(viewer=user))
