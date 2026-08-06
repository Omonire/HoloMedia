from routes.auth import auth_bp
from routes.users import users_bp
from routes.posts import posts_bp
from routes.messages import messages_bp
from routes.notifications import notifications_bp
from routes.groups import groups_bp
from routes.uploads import uploads_bp
from routes.admin import admin_bp

ALL_BLUEPRINTS = [
    auth_bp,
    users_bp,
    posts_bp,
    messages_bp,
    notifications_bp,
    groups_bp,
    uploads_bp,
    admin_bp,
]
