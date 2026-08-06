from models import Setting

SETTING_DEFAULTS = {
    "site_name": "HoloMedia",
    "tagline": "Connect, create, and share.",
    "registration_open": "true",
    "maintenance_mode": "false",
    "max_upload_mb": "100",
}


def get_setting(key, default=None):
    row = Setting.query.get(key)
    if row is not None:
        return row.value
    return SETTING_DEFAULTS.get(key, default)


def is_registration_open():
    return get_setting("registration_open", "true").lower() == "true"


def is_maintenance_mode():
    return get_setting("maintenance_mode", "false").lower() == "true"
