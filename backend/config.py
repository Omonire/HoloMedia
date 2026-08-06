import os

from dotenv import load_dotenv

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

load_dotenv(os.path.join(BASE_DIR, ".env"))

MAX_UPLOAD_MB = int(os.environ.get("MAX_UPLOAD_MB", "100"))


def _database_uri():
    url = os.environ.get("DATABASE_URL")
    if url:
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+psycopg2://", 1)
        elif url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+psycopg2://", 1)
        return url
    return "sqlite:///" + os.path.join(BASE_DIR, "holomedia.db")


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "holomedia-dev-secret-change-me")
    SQLALCHEMY_DATABASE_URI = _database_uri()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "holomedia-jwt-secret")
    JWT_ACCESS_TOKEN_EXPIRES = os.environ.get("JWT_TOKEN_EXPIRES_MINUTES")
    if JWT_ACCESS_TOKEN_EXPIRES:
        JWT_ACCESS_TOKEN_EXPIRES = int(JWT_ACCESS_TOKEN_EXPIRES) * 60
    else:
        JWT_ACCESS_TOKEN_EXPIRES = False
    MAX_CONTENT_LENGTH = MAX_UPLOAD_MB * 1024 * 1024
    CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "*")
    UPLOAD_ALLOWED_MIME = {
        "video/mp4",
        "video/webm",
        "video/quicktime",
        "video/x-msvideo",
        "video/x-matroska",
        "video/mpeg",
    }
