"""Idempotent database indexes, applied on startup.

Postgres does NOT auto-index foreign-key columns, so every feed/list query
was doing full sequential scans. These run as `CREATE INDEX IF NOT EXISTS`
and are safe to re-run on every cold start.
"""

from sqlalchemy import text

from extensions import db

INDEXES = [
    'CREATE INDEX IF NOT EXISTS ix_user_created ON "user" (created_at)',
    'CREATE INDEX IF NOT EXISTS ix_post_user_created ON post (user_id, created_at DESC)',
    'CREATE INDEX IF NOT EXISTS ix_post_group_created ON post (group_id, created_at DESC)',
    'CREATE INDEX IF NOT EXISTS ix_post_sound ON post (sound)',
    'CREATE INDEX IF NOT EXISTS ix_post_video ON post (video_url)',
    'CREATE INDEX IF NOT EXISTS ix_post_repost_of ON post (repost_of_id)',
    'CREATE INDEX IF NOT EXISTS ix_like_user_post ON "like" (user_id, post_id)',
    'CREATE INDEX IF NOT EXISTS ix_like_post ON "like" (post_id)',
    'CREATE INDEX IF NOT EXISTS ix_comment_post ON comment (post_id)',
    'CREATE INDEX IF NOT EXISTS ix_comment_user ON comment (user_id)',
    'CREATE INDEX IF NOT EXISTS ix_bookmark_user_post ON bookmark (user_id, post_id)',
    'CREATE INDEX IF NOT EXISTS ix_bookmark_post ON bookmark (post_id)',
    'CREATE INDEX IF NOT EXISTS ix_notification_user_created ON notification (user_id, created_at DESC)',
    'CREATE INDEX IF NOT EXISTS ix_notification_user_read ON notification (user_id, read)',
    'CREATE INDEX IF NOT EXISTS ix_message_sender_created ON message (sender_id, created_at)',
    'CREATE INDEX IF NOT EXISTS ix_message_recipient_created ON message (recipient_id, created_at)',
    'CREATE INDEX IF NOT EXISTS ix_group_created ON "group" (created_at)',
    'CREATE INDEX IF NOT EXISTS ix_upload_user ON upload (user_id)',
    'CREATE INDEX IF NOT EXISTS ix_follows_follower ON follows (follower_id)',
    'CREATE INDEX IF NOT EXISTS ix_follows_followed ON follows (followed_id)',
    'CREATE INDEX IF NOT EXISTS ix_group_members_group ON group_members (group_id)',
    'CREATE INDEX IF NOT EXISTS ix_group_members_user ON group_members (user_id)',
]


def ensure_indexes():
    engine = db.engine
    for stmt in INDEXES:
        try:
            with engine.begin() as conn:
                conn.execute(text(stmt))
        except Exception:
            pass
