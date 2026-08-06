import os
import sys

# Make the backend package importable on Vercel's Python runtime.
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app import app as flask_app  # noqa: E402

app = flask_app

# Note: socket.io realtime requires a persistent process, which Vercel's
# serverless runtime cannot provide. The frontend automatically falls back to
# REST polling when the socket connection fails, so chat still works.
