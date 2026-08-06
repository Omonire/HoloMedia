import uuid

from flask import Blueprint, request, jsonify, Response, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models import User, Upload

uploads_bp = Blueprint("uploads", __name__, url_prefix="/api/uploads")

_ALLOWED = {"video/mp4", "video/webm", "video/quicktime",
            "video/x-msvideo", "video/x-matroska", "video/mpeg"}
_MAX_MB = 100


@uploads_bp.post("/video")
@jwt_required()
def upload_video():
    user = db.session.get(User, int(get_jwt_identity()))
    if not user:
        return jsonify(error="User not found."), 404

    file = request.files.get("file")
    if not file or not file.filename:
        return jsonify(error="No file provided."), 400

    mime = (file.mimetype or "").split(";")[0].strip().lower()
    if mime not in _ALLOWED:
        return jsonify(error="Unsupported video type. Use MP4, WebM, MOV, or AVI."), 400

    data = file.read()
    if not data:
        return jsonify(error="Empty file."), 400
    if len(data) > _MAX_MB * 1024 * 1024:
        return jsonify(error=f"Video exceeds the {_MAX_MB} MB upload limit."), 413

    name = file.filename or "video"
    if not name.lower().endswith((".mp4", ".webm", ".mov", ".avi", ".mkv", ".mpeg")):
        name = f"{uuid.uuid4().hex}.{mime.split('/')[-1].replace('quicktime', 'mov')}"

    upload = Upload(user_id=user.id, filename=name, mime_type=mime,
                    size=len(data), data=data)
    db.session.add(upload)
    db.session.commit()

    url = f"{request.host_url.rstrip('/')}/api/uploads/video/{upload.id}"
    return jsonify(url=url, upload=upload.to_dict()), 201


@uploads_bp.get("/video/<int:upload_id>")
def get_video(upload_id):
    upload = db.session.get(Upload, upload_id)
    if not upload:
        return jsonify(error="File not found."), 404

    data = bytes(upload.data)
    total = len(data)
    range_header = request.headers.get("Range")

    if range_header and range_header.startswith("bytes="):
        try:
            start, _, end = range_header[6:].partition("-")
            start = int(start) if start else 0
            end = int(end) if end else total - 1
            if start > end or start >= total:
                return Response(status=416, headers={"Content-Range": f"bytes */{total}"})
            end = min(end, total - 1)
            chunk = data[start:end + 1]
            return Response(
                chunk, status=206,
                headers={
                    "Content-Type": upload.mime_type,
                    "Content-Length": str(len(chunk)),
                    "Content-Range": f"bytes {start}-{end}/{total}",
                    "Accept-Ranges": "bytes",
                },
            )
        except ValueError:
            pass

    return Response(
        data, status=200,
        headers={
            "Content-Type": upload.mime_type,
            "Content-Length": str(total),
            "Accept-Ranges": "bytes",
        },
    )
