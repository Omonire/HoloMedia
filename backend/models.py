from datetime import datetime, timezone

from sqlalchemy import func
from werkzeug.security import generate_password_hash, check_password_hash

from extensions import db

follows = db.Table(
    "follows",
    db.Column("follower_id", db.Integer, db.ForeignKey("user.id"), primary_key=True),
    db.Column("followed_id", db.Integer, db.ForeignKey("user.id"), primary_key=True),
    db.Column("created_at", db.DateTime, default=lambda: datetime.now(timezone.utc)),
)

group_members = db.Table(
    "group_members",
    db.Column("group_id", db.Integer, db.ForeignKey("group.id"), primary_key=True),
    db.Column("user_id", db.Integer, db.ForeignKey("user.id"), primary_key=True),
    db.Column("created_at", db.DateTime, default=lambda: datetime.now(timezone.utc)),
)


def utcnow():
    return datetime.now(timezone.utc)


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(40), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    full_name = db.Column(db.String(80), nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    bio = db.Column(db.String(240), default="")
    avatar_color = db.Column(db.String(9), default="#7c3aed")
    is_admin = db.Column(db.Boolean, default=False, nullable=False)
    is_suspended = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=utcnow)

    posts = db.relationship("Post", backref="author", lazy="dynamic",
                            cascade="all, delete-orphan")
    following = db.relationship(
        "User",
        secondary=follows,
        primaryjoin=(follows.c.follower_id == id),
        secondaryjoin=(follows.c.followed_id == id),
        backref=db.backref("followers", lazy="dynamic"),
        lazy="dynamic",
    )

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def is_following(self, user):
        return self.following.filter(follows.c.followed_id == user.id).count() > 0

    def to_dict(self, viewer=None, detail=False):
        data = {
            "id": self.id,
            "username": self.username,
            "full_name": self.full_name,
            "bio": self.bio or "",
            "avatar_color": self.avatar_color,
            "is_admin": self.is_admin,
            "is_suspended": self.is_suspended,
            "created_at": self.created_at.isoformat(),
            "post_count": self.posts.count(),
            "followers_count": self.followers.count(),
            "following_count": self.following.count(),
        }
        if viewer is not None:
            data["is_following"] = viewer.is_following(self)
            data["is_self"] = viewer.id == self.id
        return data


class Upload(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    filename = db.Column(db.String(255), nullable=False)
    mime_type = db.Column(db.String(100), nullable=False)
    size = db.Column(db.Integer, nullable=False)
    data = db.Column(db.LargeBinary, nullable=False)
    created_at = db.Column(db.DateTime, default=utcnow)

    author = db.relationship("User", backref=db.backref("uploads", lazy="dynamic"))

    def to_dict(self):
        return {
            "id": self.id,
            "filename": self.filename,
            "mime_type": self.mime_type,
            "size": self.size,
            "url": f"/api/uploads/video/{self.id}",
            "created_at": self.created_at.isoformat(),
            "author": self.author.to_dict(),
        }


class Setting(db.Model):
    key = db.Column(db.String(64), primary_key=True)
    value = db.Column(db.Text, default="")


class Group(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    description = db.Column(db.Text, default="")
    icon_color = db.Column(db.String(9), default="#7c3aed")
    created_by_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=utcnow)

    creator = db.relationship("User", foreign_keys=[created_by_id])
    members = db.relationship(
        "User",
        secondary=group_members,
        lazy="dynamic",
        backref=db.backref("joined_groups", lazy="dynamic"),
    )
    posts = db.relationship("Post", backref="group", lazy="dynamic",
                            cascade="all, delete-orphan",
                            foreign_keys="Post.group_id")

    def is_member(self, user):
        return self.members.filter(group_members.c.user_id == user.id).count() > 0

    def to_dict(self, viewer=None, detail=False):
        data = {
            "id": self.id,
            "name": self.name,
            "description": self.description or "",
            "icon_color": self.icon_color,
            "created_at": self.created_at.isoformat(),
            "members_count": self.members.count(),
            "posts_count": self.posts.count(),
            "created_by": self.creator.to_dict(),
        }
        if viewer is not None:
            data["is_member"] = self.is_member(viewer)
            data["is_creator"] = self.created_by_id == viewer.id
        return data


class Post(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    content = db.Column(db.Text, nullable=False)
    image_url = db.Column(db.String(500), default=None)
    video_url = db.Column(db.String(500), default=None)
    sound = db.Column(db.String(120), default=None)
    sound_track_id = db.Column(db.String(64), default=None)
    sound_artist = db.Column(db.String(160), default=None)
    sound_artwork = db.Column(db.String(500), default=None)
    sound_preview = db.Column(db.String(500), default=None)
    sound_url = db.Column(db.String(500), default=None)
    group_id = db.Column(db.Integer, db.ForeignKey("group.id"), nullable=True)
    repost_of_id = db.Column(db.Integer, db.ForeignKey("post.id"), nullable=True)
    created_at = db.Column(db.DateTime, default=utcnow)

    repost_of = db.relationship("Post", remote_side=[id], foreign_keys=[repost_of_id])
    reposts = db.relationship("Post", foreign_keys=[repost_of_id], lazy="dynamic",
                              cascade="all, delete-orphan", overlaps="repost_of")

    comments = db.relationship("Comment", backref="post", lazy="dynamic",
                               cascade="all, delete-orphan")
    likes = db.relationship("Like", backref="post", lazy="dynamic",
                            cascade="all, delete-orphan")
    bookmarks = db.relationship("Bookmark", backref="post", lazy="dynamic",
                                cascade="all, delete-orphan")

    REACTIONS = ("like", "love", "haha", "wow", "sad", "angry")

    def to_dict(self, viewer=None):
        liked = False
        my_reaction = None
        reposted = False
        bookmarked = False
        if viewer is not None:
            like = self.likes.filter(Like.user_id == viewer.id).first()
            liked = like is not None
            my_reaction = like.kind if like else None
            reposted = self.reposts.filter(Post.user_id == viewer.id).count() > 0
            bookmarked = self.bookmarks.filter(Bookmark.user_id == viewer.id).count() > 0

        reactions = {k: 0 for k in self.REACTIONS}
        for like in self.likes:
            reactions[like.kind] = reactions.get(like.kind, 0) + 1

        data = {
            "id": self.id,
            "content": self.content,
            "image_url": self.image_url,
            "video_url": self.video_url,
            "sound": self.sound,
            "sound_track_id": self.sound_track_id,
            "sound_artist": self.sound_artist,
            "sound_artwork": self.sound_artwork,
            "sound_preview": self.sound_preview,
            "sound_url": self.sound_url,
            "group_id": self.group_id,
            "created_at": self.created_at.isoformat(),
            "author": self.author.to_dict(viewer=viewer),
            "likes_count": self.likes.count(),
            "comments_count": self.comments.count(),
            "liked": liked,
            "my_reaction": my_reaction,
            "reactions": reactions,
            "reposts_count": self.reposts.count(),
            "reposted": reposted,
            "bookmarks_count": self.bookmarks.count(),
            "bookmarked": bookmarked,
            "is_repost": self.repost_of_id is not None,
            "repost_of": self.repost_of.to_dict(viewer=viewer) if self.repost_of_id else None,
        }
        return data


def serialize_posts(posts, viewer=None):
    """Serialize a list of posts with batched queries.

    Post.to_dict() runs one query per like/comment/bookmark/repost stat, which
    is an N+1 explosion on large feeds and blows past serverless timeouts
    (e.g. Vercel) on remote Postgres. This helper resolves all counts and the
    viewer's state for every post with a handful of grouped queries instead.
    """
    if not posts:
        return []
    ids = [p.id for p in posts]
    repost_ids = [p.repost_of_id for p in posts if p.repost_of_id]

    repost_map = {}
    if repost_ids:
        repost_map = {
            rp.id: rp for rp in Post.query.filter(Post.id.in_(repost_ids)).all()
        }

    # Include reposted posts' authors so recursive serialization never misses
    # a user in the batched map.
    author_ids = list(
        {p.user_id for p in posts}
        | {rp.user_id for rp in repost_map.values()}
    )

    like_rows = (
        db.session.query(Like.post_id, Like.kind, func.count().label("n"))
        .filter(Like.post_id.in_(ids))
        .group_by(Like.post_id, Like.kind)
        .all()
    )
    comment_counts = dict(
        db.session.query(Comment.post_id, func.count())
        .filter(Comment.post_id.in_(ids))
        .group_by(Comment.post_id)
        .all()
    )
    bookmark_counts = dict(
        db.session.query(Bookmark.post_id, func.count())
        .filter(Bookmark.post_id.in_(ids))
        .group_by(Bookmark.post_id)
        .all()
    )
    repost_counts = dict(
        db.session.query(Post.repost_of_id, func.count())
        .filter(Post.repost_of_id.in_(ids))
        .group_by(Post.repost_of_id)
        .all()
    )

    like_counts = {}
    reactions = {}
    for pid, kind, n in like_rows:
        like_counts[pid] = like_counts.get(pid, 0) + n
        reactions.setdefault(pid, {})[kind] = n

    my_reaction = {}
    my_reposts = set()
    my_bookmarks = set()
    if viewer is not None:
        my_reaction = dict(
            db.session.query(Like.post_id, Like.kind)
            .filter(Like.post_id.in_(ids), Like.user_id == viewer.id)
            .all()
        )
        my_reposts = {
            pid
            for (pid,) in db.session.query(Post.repost_of_id)
            .filter(Post.repost_of_id.in_(ids), Post.user_id == viewer.id)
            .all()
        }
        my_bookmarks = {
            pid
            for (pid,) in db.session.query(Bookmark.post_id)
            .filter(Bookmark.post_id.in_(ids), Bookmark.user_id == viewer.id)
            .all()
        }

    users = {u.id: u for u in User.query.filter(User.id.in_(author_ids)).all()}
    user_posts = dict(
        db.session.query(Post.user_id, func.count())
        .filter(Post.user_id.in_(author_ids))
        .group_by(Post.user_id)
        .all()
    )
    user_followers = dict(
        db.session.query(follows.c.followed_id, func.count())
        .filter(follows.c.followed_id.in_(author_ids))
        .group_by(follows.c.followed_id)
        .all()
    )
    user_following = dict(
        db.session.query(follows.c.follower_id, func.count())
        .filter(follows.c.follower_id.in_(author_ids))
        .group_by(follows.c.follower_id)
        .all()
    )
    viewer_follows = set()
    if viewer is not None:
        viewer_follows = {
            uid
            for (uid,) in db.session.query(follows.c.followed_id)
            .filter(follows.c.follower_id == viewer.id)
            .all()
        }

    def author_dict(u):
        data = {
            "id": u.id,
            "username": u.username,
            "full_name": u.full_name,
            "bio": u.bio or "",
            "avatar_color": u.avatar_color,
            "is_admin": u.is_admin,
            "is_suspended": u.is_suspended,
            "created_at": u.created_at.isoformat(),
            "post_count": user_posts.get(u.id, 0),
            "followers_count": user_followers.get(u.id, 0),
            "following_count": user_following.get(u.id, 0),
        }
        if viewer is not None:
            data["is_following"] = u.id in viewer_follows
            data["is_self"] = viewer.id == u.id
        return data

    def one(p):
        pid = p.id
        rev = reactions.get(pid) or {}
        data = {
            "id": pid,
            "content": p.content,
            "image_url": p.image_url,
            "video_url": p.video_url,
            "sound": p.sound,
            "sound_track_id": p.sound_track_id,
            "sound_artist": p.sound_artist,
            "sound_artwork": p.sound_artwork,
            "sound_preview": p.sound_preview,
            "sound_url": p.sound_url,
            "group_id": p.group_id,
            "created_at": p.created_at.isoformat(),
            "author": author_dict(users[p.user_id]),
            "likes_count": like_counts.get(pid, 0),
            "comments_count": comment_counts.get(pid, 0),
            "liked": my_reaction.get(pid) is not None,
            "my_reaction": my_reaction.get(pid),
            "reactions": {k: rev.get(k, 0) for k in Post.REACTIONS},
            "reposts_count": repost_counts.get(pid, 0),
            "reposted": pid in my_reposts,
            "bookmarks_count": bookmark_counts.get(pid, 0),
            "bookmarked": pid in my_bookmarks,
            "is_repost": p.repost_of_id is not None,
            "repost_of": (
                one(repost_map[p.repost_of_id])
                if p.repost_of_id and p.repost_of_id in repost_map
                else None
            ),
        }
        return data

    return [one(p) for p in posts]


def _user_stats(ids):
    """Batched follower/following/post counts for a list of user ids."""
    if not ids:
        return {}, {}, {}, {}
    users = {
        u.id: u for u in User.query.filter(User.id.in_(ids)).all()
    }
    user_posts = dict(
        db.session.query(Post.user_id, func.count())
        .filter(Post.user_id.in_(ids))
        .group_by(Post.user_id)
        .all()
    )
    user_followers = dict(
        db.session.query(follows.c.followed_id, func.count())
        .filter(follows.c.followed_id.in_(ids))
        .group_by(follows.c.followed_id)
        .all()
    )
    user_following = dict(
        db.session.query(follows.c.follower_id, func.count())
        .filter(follows.c.follower_id.in_(ids))
        .group_by(follows.c.follower_id)
        .all()
    )
    return users, user_posts, user_followers, user_following


def _user_dict(u, user_posts, user_followers, user_following,
               viewer=None, viewer_follows=None):
    data = {
        "id": u.id,
        "username": u.username,
        "full_name": u.full_name,
        "bio": u.bio or "",
        "avatar_color": u.avatar_color,
        "is_admin": u.is_admin,
        "is_suspended": u.is_suspended,
        "created_at": u.created_at.isoformat(),
        "post_count": user_posts.get(u.id, 0),
        "followers_count": user_followers.get(u.id, 0),
        "following_count": user_following.get(u.id, 0),
    }
    if viewer is not None:
        data["is_following"] = viewer_follows is not None and u.id in viewer_follows
        data["is_self"] = viewer.id == u.id
    return data


def serialize_users(users, viewer=None):
    """Serialize a list of users with batched count queries (no N+1)."""
    if not users:
        return []
    ids = list({u.id for u in users})
    users_map, user_posts, user_followers, user_following = _user_stats(ids)
    viewer_follows = None
    if viewer is not None:
        viewer_follows = {
            uid
            for (uid,) in db.session.query(follows.c.followed_id)
            .filter(follows.c.follower_id == viewer.id)
            .all()
        }
    return [
        _user_dict(users_map[u.id], user_posts, user_followers,
                   user_following, viewer, viewer_follows)
        for u in users if u.id in users_map
    ]


def serialize_notifications(notes):
    """Serialize notifications with batched actor serialization."""
    if not notes:
        return []
    actor_ids = list({n.actor_id for n in notes})
    users_map, user_posts, user_followers, user_following = _user_stats(actor_ids)
    return [{
        "id": n.id,
        "kind": n.kind,
        "read": n.read,
        "post_id": n.post_id,
        "created_at": n.created_at.isoformat(),
        "actor": _user_dict(users_map[n.actor_id], user_posts,
                            user_followers, user_following),
    } for n in notes if n.actor_id in users_map]


def serialize_groups(groups, viewer=None):
    """Serialize a list of groups with batched counts (no N+1)."""
    if not groups:
        return []
    ids = list({g.id for g in groups})
    creator_ids = list({g.created_by_id for g in groups})
    users_map, user_posts, user_followers, user_following = _user_stats(creator_ids)
    member_counts = dict(
        db.session.query(group_members.c.group_id, func.count())
        .filter(group_members.c.group_id.in_(ids))
        .group_by(group_members.c.group_id)
        .all()
    )
    post_counts = dict(
        db.session.query(Post.group_id, func.count())
        .filter(Post.group_id.in_(ids))
        .group_by(Post.group_id)
        .all()
    )
    viewer_memberships = set()
    if viewer is not None:
        viewer_memberships = {
            gid
            for (gid,) in db.session.query(group_members.c.group_id)
            .filter(group_members.c.user_id == viewer.id)
            .all()
        }

    def one(g):
        data = {
            "id": g.id,
            "name": g.name,
            "description": g.description or "",
            "icon_color": g.icon_color,
            "created_at": g.created_at.isoformat(),
            "members_count": member_counts.get(g.id, 0),
            "posts_count": post_counts.get(g.id, 0),
            "created_by": _user_dict(users_map[g.created_by_id], user_posts,
                                     user_followers, user_following),
        }
        if viewer is not None:
            data["is_member"] = g.id in viewer_memberships
            data["is_creator"] = g.created_by_id == viewer.id
        return data

    return [one(g) for g in groups if g.id in member_counts or True]


class Like(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey("post.id"), nullable=False)
    kind = db.Column(db.String(16), default="like", nullable=False)
    created_at = db.Column(db.DateTime, default=utcnow)
    __table_args__ = (db.UniqueConstraint("user_id", "post_id"),)


class Bookmark(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey("post.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=utcnow)
    __table_args__ = (db.UniqueConstraint("user_id", "post_id"),)


class Comment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey("post.id"), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=utcnow)

    author = db.relationship("User", backref=db.backref("comments", lazy="dynamic"))

    def to_dict(self):
        return {
            "id": self.id,
            "content": self.content,
            "created_at": self.created_at.isoformat(),
            "author": self.author.to_dict(),
        }


class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    recipient_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    content = db.Column(db.Text, nullable=False)
    read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=utcnow)

    sender = db.relationship("User", foreign_keys=[sender_id])
    recipient = db.relationship("User", foreign_keys=[recipient_id])

    def to_dict(self, viewer_id=None):
        return {
            "id": self.id,
            "content": self.content,
            "read": self.read,
            "created_at": self.created_at.isoformat(),
            "sender_id": self.sender_id,
            "recipient_id": self.recipient_id,
            "mine": viewer_id == self.sender_id,
        }


class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    actor_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey("post.id"), nullable=True)
    kind = db.Column(db.String(20), nullable=False)  # follow | like | comment | message
    read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=utcnow)

    actor = db.relationship("User", foreign_keys=[actor_id])

    def to_dict(self):
        return {
            "id": self.id,
            "kind": self.kind,
            "read": self.read,
            "post_id": self.post_id,
            "created_at": self.created_at.isoformat(),
            "actor": self.actor.to_dict(),
        }
