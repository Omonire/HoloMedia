import re

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request

from extensions import db
from models import User, Post, Like, Comment, Bookmark, Notification
from spotify import (
    SpotifyPremiumRequired,
    available,
    is_configured,
    search_tracks,
)

posts_bp = Blueprint("posts", __name__, url_prefix="/api/posts")

HASHTAG_RE = re.compile(r"#([\w]+)")


def _viewer():
    if not request.headers.get("Authorization"):
        return None
    verify_jwt_in_request(optional=True)
    return db.session.get(User, int(get_jwt_identity()))


def extract_hashtags(content):
    return {t.lower() for t in HASHTAG_RE.findall(content or "")}


@posts_bp.get("/spotify/config")
def spotify_config():
    return jsonify(configured=available())


@posts_bp.get("/spotify/search")
def spotify_search():
    query = (request.args.get("q") or "").strip()
    if not is_configured():
        return jsonify(error="Spotify is not configured. Add credentials to backend/spotify_creds.json."), 503
    if not query:
        return jsonify(tracks=[])
    try:
        return jsonify(tracks=search_tracks(query))
    except SpotifyPremiumRequired:
        return jsonify(error="Spotify requires an active Premium subscription for the app owner. Pick or type a free sound instead."), 503
    except Exception:
        return jsonify(error="Spotify search failed. Please try again."), 502


@posts_bp.get("/sounds")
def sounds():
    posts = Post.query.filter(Post.sound.isnot(None)).order_by(Post.created_at.desc()).all()
    counts = {}
    for p in posts:
        key = p.sound_track_id or p.sound
        counts[key] = counts.get(key, 0) + 1
    top = sorted(counts.items(), key=lambda kv: kv[1], reverse=True)[:20]
    viewer = _viewer()
    result = []
    for key, count in top:
        sound_posts = [p for p in posts if (p.sound_track_id or p.sound) == key][:20]
        latest = sound_posts[0]
        result.append({
            "name": latest.sound,
            "track_id": latest.sound_track_id,
            "artist": latest.sound_artist,
            "artwork_url": latest.sound_artwork,
            "preview_url": latest.sound_preview,
            "spotify_url": latest.sound_url,
            "count": count,
            "creator": latest.author.full_name,
            "creator_username": latest.author.username,
            "avatar_color": latest.author.avatar_color,
            "posts": [p.to_dict(viewer=viewer) for p in sound_posts],
        })
    return jsonify(sounds=result)


@posts_bp.get("/trending")
def trending():
    posts = Post.query.filter(Post.content.isnot(None)).all()
    counts = {}
    for p in posts:
        for tag in extract_hashtags(p.content):
            counts[tag] = counts.get(tag, 0) + 1
    top = sorted(counts.items(), key=lambda kv: kv[1], reverse=True)[:10]
    return jsonify(trending=[{"tag": t, "count": c} for t, c in top])


@posts_bp.get("/reels")
def reels():
    viewer = _viewer()
    sound = (request.args.get("sound") or "").strip()
    query = Post.query.filter(
        Post.video_url.isnot(None),
        Post.repost_of_id.is_(None),
        Post.group_id.is_(None),
    )
    if sound:
        query = query.filter(Post.sound == sound)
    posts = query.order_by(Post.created_at.desc()).all()
    return jsonify(posts=[p.to_dict(viewer=viewer) for p in posts])


@posts_bp.get("/feed")
@jwt_required()
def feed():
    user = _viewer()
    following_ids = [u.id for u in user.following.all()] + [user.id]
    posts = (
        Post.query.filter(Post.user_id.in_(following_ids), Post.group_id.is_(None))
        .order_by(Post.created_at.desc())
        .limit(60)
        .all()
    )
    return jsonify(posts=[p.to_dict(viewer=user) for p in posts])


@posts_bp.get("/bookmarks")
@jwt_required()
def my_bookmarks():
    user = _viewer()
    rows = (
        Bookmark.query.filter_by(user_id=user.id)
        .order_by(Bookmark.created_at.desc())
        .all()
    )
    return jsonify(posts=[b.post.to_dict(viewer=user) for b in rows])


@posts_bp.get("/")
def list_posts():
    tag = (request.args.get("tag") or "").strip().lower()
    viewer = _viewer()
    query = Post.query.filter(Post.group_id.is_(None))
    if tag:
        query = query.filter(Post.content.ilike(f"%#{tag}%"))
    posts = query.order_by(Post.created_at.desc()).limit(60).all()
    return jsonify(posts=[p.to_dict(viewer=viewer) for p in posts])


@posts_bp.post("/")
@jwt_required()
def create_post():
    user = _viewer()
    data = request.get_json(silent=True) or {}
    content = (data.get("content") or "").strip()
    image_url = (data.get("image_url") or "").strip() or None
    video_url = (data.get("video_url") or "").strip() or None
    sound = (data.get("sound") or "").strip() or None
    sound_track_id = (data.get("sound_track_id") or "").strip() or None
    sound_artist = (data.get("sound_artist") or "").strip() or None
    sound_artwork = (data.get("sound_artwork") or "").strip() or None
    sound_preview = (data.get("sound_preview") or "").strip() or None
    sound_url = (data.get("sound_url") or "").strip() or None
    group_id = data.get("group_id")

    if group_id is not None:
        from models import Group
        group = db.session.get(Group, group_id)
        if not group:
            return jsonify(error="Group not found."), 404
        if not group.is_member(user):
            return jsonify(error="Join the group to post in it."), 403

    if not content and not image_url and not video_url:
        return jsonify(error="Post needs some content, an image, or a video."), 400
    if len(content) > 2000:
        return jsonify(error="Post is too long (max 2000 chars)."), 400

    post = Post(user_id=user.id, content=content,
                image_url=image_url, video_url=video_url,
                sound=sound, sound_track_id=sound_track_id,
                sound_artist=sound_artist, sound_artwork=sound_artwork,
                sound_preview=sound_preview, sound_url=sound_url,
                group_id=group_id)
    db.session.add(post)
    db.session.commit()
    return jsonify(post=post.to_dict(viewer=user)), 201


@posts_bp.get("/<int:post_id>")
def get_post(post_id):
    post = db.session.get(Post, post_id)
    if not post:
        return jsonify(error="Post not found."), 404
    viewer = _viewer()
    return jsonify(post=post.to_dict(viewer=viewer))


@posts_bp.put("/<int:post_id>")
@jwt_required()
def update_post(post_id):
    user = _viewer()
    post = db.session.get(Post, post_id)
    if not post:
        return jsonify(error="Post not found."), 404
    if post.user_id != user.id:
        return jsonify(error="You can only edit your own posts."), 403

    data = request.get_json(silent=True) or {}
    if "content" in data:
        post.content = (data["content"] or "").strip()
    if "image_url" in data:
        post.image_url = (data["image_url"] or "").strip() or None
    if "video_url" in data:
        post.video_url = (data["video_url"] or "").strip() or None
    if "sound" in data:
        post.sound = (data["sound"] or "").strip() or None
    if "sound_track_id" in data:
        post.sound_track_id = (data["sound_track_id"] or "").strip() or None
    if "sound_artist" in data:
        post.sound_artist = (data["sound_artist"] or "").strip() or None
    if "sound_artwork" in data:
        post.sound_artwork = (data["sound_artwork"] or "").strip() or None
    if "sound_preview" in data:
        post.sound_preview = (data["sound_preview"] or "").strip() or None
    if "sound_url" in data:
        post.sound_url = (data["sound_url"] or "").strip() or None
    if not post.content and not post.image_url and not post.video_url:
        return jsonify(error="Post needs some content, an image, or a video."), 400

    db.session.commit()
    return jsonify(post=post.to_dict(viewer=user))


@posts_bp.delete("/<int:post_id>")
@jwt_required()
def delete_post(post_id):
    user = _viewer()
    post = db.session.get(Post, post_id)
    if not post:
        return jsonify(error="Post not found."), 404
    if post.user_id != user.id:
        return jsonify(error="You can only delete your own posts."), 403
    db.session.delete(post)
    db.session.commit()
    return jsonify(message="Post deleted.")


@posts_bp.post("/<int:post_id>/repost")
@jwt_required()
def repost(post_id):
    user = _viewer()
    post = db.session.get(Post, post_id)
    if not post:
        return jsonify(error="Post not found."), 404

    original = post.repost_of if post.repost_of_id else post
    existing = (
        Post.query.filter_by(user_id=user.id, repost_of_id=original.id).first()
    )
    if existing:
        return jsonify(post=original.to_dict(viewer=user))

    db.session.add(Post(user_id=user.id, content="", repost_of_id=original.id))
    if original.user_id != user.id and Notification.query.filter_by(
        user_id=original.user_id, actor_id=user.id, kind="repost", post_id=original.id
    ).first() is None:
        db.session.add(Notification(
            user_id=original.user_id, actor_id=user.id, kind="repost", post_id=original.id
        ))
    db.session.commit()
    return jsonify(post=original.to_dict(viewer=user)), 201


@posts_bp.delete("/<int:post_id>/repost")
@jwt_required()
def unrepost(post_id):
    user = _viewer()
    post = db.session.get(Post, post_id)
    if not post:
        return jsonify(error="Post not found."), 404

    original_id = post.repost_of_id or post.id
    Post.query.filter_by(user_id=user.id, repost_of_id=original_id).delete()
    Notification.query.filter_by(
        user_id=post.user_id, actor_id=user.id, kind="repost", post_id=post.id
    ).delete()
    db.session.commit()
    return jsonify(post=post.to_dict(viewer=user))


@posts_bp.post("/<int:post_id>/like")
@jwt_required()
def like_post(post_id):
    user = _viewer()
    post = db.session.get(Post, post_id)
    if not post:
        return jsonify(error="Post not found."), 404

    kind = (request.get_json(silent=True) or {}).get("kind") or "like"
    if kind not in Post.REACTIONS:
        return jsonify(error="Unknown reaction."), 400

    like = Like.query.filter_by(user_id=user.id, post_id=post.id).first()
    if like is None:
        db.session.add(Like(user_id=user.id, post_id=post.id, kind=kind))
        if post.user_id != user.id and Notification.query.filter_by(
            user_id=post.user_id, actor_id=user.id, kind="like", post_id=post.id
        ).first() is None:
            db.session.add(Notification(
                user_id=post.user_id, actor_id=user.id, kind="like", post_id=post.id
            ))
    else:
        if like.kind == kind:
            db.session.delete(like)
        else:
            like.kind = kind
    db.session.commit()
    return jsonify(post=post.to_dict(viewer=user))


@posts_bp.delete("/<int:post_id>/like")
@jwt_required()
def unlike_post(post_id):
    user = _viewer()
    post = db.session.get(Post, post_id)
    if not post:
        return jsonify(error="Post not found."), 404

    Like.query.filter_by(user_id=user.id, post_id=post.id).delete()
    Notification.query.filter_by(
        user_id=post.user_id, actor_id=user.id, kind="like", post_id=post.id
    ).delete()
    db.session.commit()

    return jsonify(post=post.to_dict(viewer=user))


@posts_bp.post("/<int:post_id>/bookmark")
@jwt_required()
def bookmark(post_id):
    user = _viewer()
    post = db.session.get(Post, post_id)
    if not post:
        return jsonify(error="Post not found."), 404

    if Bookmark.query.filter_by(user_id=user.id, post_id=post.id).first() is None:
        db.session.add(Bookmark(user_id=user.id, post_id=post.id))
        db.session.commit()
    return jsonify(post=post.to_dict(viewer=user))


@posts_bp.delete("/<int:post_id>/bookmark")
@jwt_required()
def unbookmark(post_id):
    user = _viewer()
    post = db.session.get(Post, post_id)
    if not post:
        return jsonify(error="Post not found."), 404

    Bookmark.query.filter_by(user_id=user.id, post_id=post.id).delete()
    db.session.commit()
    return jsonify(post=post.to_dict(viewer=user))


@posts_bp.get("/<int:post_id>/comments")
def list_comments(post_id):
    post = db.session.get(Post, post_id)
    if not post:
        return jsonify(error="Post not found."), 404
    comments = post.comments.order_by(Comment.created_at.asc()).all()
    return jsonify(comments=[c.to_dict() for c in comments])


@posts_bp.post("/<int:post_id>/comments")
@jwt_required()
def add_comment(post_id):
    user = _viewer()
    post = db.session.get(Post, post_id)
    if not post:
        return jsonify(error="Post not found."), 404
    content = (request.get_json(silent=True) or {}).get("content", "").strip()
    if not content:
        return jsonify(error="Comment cannot be empty."), 400
    if len(content) > 1000:
        return jsonify(error="Comment is too long (max 1000 chars)."), 400

    comment = Comment(user_id=user.id, post_id=post.id, content=content)
    db.session.add(comment)
    if post.user_id != user.id and Notification.query.filter_by(
        user_id=post.user_id, actor_id=user.id, kind="comment", post_id=post.id
    ).first() is None:
        db.session.add(Notification(
            user_id=post.user_id, actor_id=user.id, kind="comment", post_id=post.id
        ))
    db.session.commit()

    return jsonify(comment=comment.to_dict(), post=post.to_dict(viewer=user)), 201
