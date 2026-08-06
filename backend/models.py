from datetime import datetime, timezone

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
