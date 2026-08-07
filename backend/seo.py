"""Crawler-friendly static pages for search engines.

HoloMedia is a client-side rendered Angular app, so Googlebot only receives an
empty JS shell. This module detects real crawler bots and serves them fully
written, indexable HTML (meta tags, content, structured data) instead. Human
visitors keep getting the normal Angular app.
"""

import html
import re

from extensions import db
from models import Group, Post, User

SITE_URL = "https://holomedia.vercel.app"

_CRAWLER_RE = re.compile(
    r"googlebot|bingbot|slurp|duckduckbot|baiduspider|yandex|facebookexternalhit|"
    r"twitterbot|linkedinbot|pinterest|whatsapp|telegrambot|discordbot|slackbot|"
    r"semrushbot|ahrefsbot|dotbot|rogerbot|mj12bot|archive\.org",
    re.IGNORECASE,
)


def is_bot(user_agent):
    return bool(user_agent and _CRAWLER_RE.search(user_agent))


def _head(title, description, canonical, extra_meta=""):
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>{title}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="{description}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="{canonical}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="HoloMedia">
  <meta property="og:title" content="{title}">
  <meta property="og:description" content="{description}">
  <meta property="og:url" content="{canonical}">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="{title}">
  <meta name="twitter:description" content="{description}">
{extra_meta}
  <script type="application/ld+json">
  {{
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "HoloMedia",
    "url": "{SITE_URL}/",
    "potentialAction": {{
      "@type": "SearchAction",
      "target": "{SITE_URL}/explore?q={{search_term_string}}",
      "query-input": "required name=search_term_string"
    }}
  }}
  </script>
  <style>
    body {{ font-family: Inter, Arial, sans-serif; margin: 0; background: #0a0a10; color: #e7e7ef; line-height: 1.6; }}
    a {{ color: #a78bfa; }}
    .wrap {{ max-width: 760px; margin: 0 auto; padding: 32px 20px; }}
    .nav {{ display: flex; justify-content: space-between; align-items: center; margin-bottom: 48px; }}
    .logo {{ font-weight: 800; font-size: 22px; color: #fff; text-decoration: none; }}
    .btn {{ display: inline-block; background: linear-gradient(120deg, #7c3aed, #ec4899); color: #fff; padding: 12px 22px; border-radius: 10px; text-decoration: none; font-weight: 700; }}
    h1 {{ font-size: 44px; line-height: 1.1; margin: 8px 0 16px; }}
    .grad {{ background: linear-gradient(120deg, #7c3aed, #ec4899); -webkit-background-clip: text; background-clip: text; color: transparent; }}
    .sub {{ color: #9b9bb0; font-size: 18px; max-width: 560px; }}
    .feature {{ background: #14141e; border-radius: 14px; padding: 18px 20px; margin: 12px 0; }}
    .feature h3 {{ margin: 0 0 4px; color: #fff; }}
    .feature p {{ margin: 0; color: #9b9bb0; font-size: 15px; }}
    footer {{ margin-top: 56px; color: #6b6b80; font-size: 14px; }}
  </style>
</head>
"""


def _landing(canonical):
    return _head(
        "HoloMedia — Share posts, loop reels, drop sounds",
        "HoloMedia is a social media platform to share posts, loop short-form video reels, drop sounds, and connect in interest-based groups — free forever.",
        canonical,
    ) + f"""<body>
  <div class="wrap">
    <nav class="nav">
      <a class="logo" href="{SITE_URL}/">HoloMedia</a>
      <div>
        <a href="{SITE_URL}/login" style="margin-right:16px;">Log in</a>
        <a class="btn" href="{SITE_URL}/register">Get started</a>
      </div>
    </nav>
    <h1>Where your moments <span class="grad">go live</span></h1>
    <p class="sub">Share posts, loop reels, drop sounds, and hang out in groups — all in one place built for people who move fast.</p>
    <p><a class="btn" href="{SITE_URL}/register">Create your account</a></p>
    <p style="color:#9b9bb0; font-size:14px;">Free forever. No email verification needed.</p>

    <h2 style="margin-top:56px;">Everything you love, in one feed</h2>
    <div class="feature"><h3>Short-form reels</h3><p>Loop vertical videos and find your next favorite sound.</p></div>
    <div class="feature"><h3>Posts &amp; hashtags</h3><p>Share updates, follow topics, and join the conversation.</p></div>
    <div class="feature"><h3>Sounds</h3><p>Attach original audio to your reels and browse trending sounds.</p></div>
    <div class="feature"><h3>Groups</h3><p>Build and join interest-based communities around anything.</p></div>
    <div class="feature"><h3>Messaging</h3><p>Chat in real time with friends and creators.</p></div>

    <footer>
      <p>HoloMedia — a fresh take on social. <a href="{SITE_URL}/register">Join free</a> or <a href="{SITE_URL}/login">log in</a>.</p>
    </footer>
  </div>
</body>
</html>
"""


def _simple(title, description, canonical, headline, body_html):
    return _head(title, description, canonical) + f"""<body>
  <div class="wrap">
    <nav class="nav">
      <a class="logo" href="{SITE_URL}/">HoloMedia</a>
      <div><a class="btn" href="{SITE_URL}/register">Get started</a></div>
    </nav>
    <h1>{headline}</h1>
    <p class="sub">{body_html}</p>
    <footer><p>HoloMedia — a fresh take on social. <a href="{SITE_URL}/">Home</a></p></footer>
  </div>
</body>
</html>
"""


def _escape(text):
    return html.escape(text or "", quote=True)


def _excerpt(text, limit=140):
    text = re.sub(r"\s+", " ", (text or "")).strip()
    if len(text) > limit:
        text = text[:limit].rstrip() + "…"
    return _escape(text)


def _parse_id(path):
    try:
        return int(path.rstrip("/").rsplit("/", 1)[-1])
    except (TypeError, ValueError):
        return None


def _resource_page(head, inner):
    return head + f"""<body>
  <div class="wrap">
    <nav class="nav">
      <a class="logo" href="{SITE_URL}/">HoloMedia</a>
      <div><a class="btn" href="{SITE_URL}/register">Get started</a></div>
    </nav>
    {inner}
    <footer><p>HoloMedia — a fresh take on social. <a href="{SITE_URL}/">Home</a></p></footer>
  </div>
</body>
</html>
"""


def _post_seo(post):
    author = post.author
    raw = re.sub(r"\s+", " ", post.content or "").strip() or "Shared a post"
    title_text = raw[:64].rstrip() + ("…" if len(raw) > 64 else "")
    title = f"{_escape(author.full_name)} — {_escape(title_text)} | HoloMedia"
    canonical = f"{SITE_URL}/p/{post.id}"
    description = (
        f"{_escape(author.full_name)} posted on HoloMedia: "
        f"{_excerpt(post.content, 160)} — {post.likes.count()} likes, "
        f"{post.comments.count()} comments."
    )

    extra = ""
    if post.image_url:
        extra += f'  <meta property="og:image" content="{_escape(post.image_url)}">\n'
        extra += f'  <meta name="twitter:image" content="{_escape(post.image_url)}">\n'
    if post.video_url:
        extra += (
            f'  <meta property="og:type" content="video.other">\n'
            f'  <meta property="og:video" content="{_escape(post.video_url)}">\n'
        )

    media = ""
    if post.image_url:
        media = f'  <p style="text-align:center;margin:24px 0;"><img src="{_escape(post.image_url)}" alt="{_escape(title_text)}" style="max-width:100%;border-radius:14px;"></p>\n'
    elif post.video_url:
        media = f'  <p style="text-align:center;margin:24px 0;"><video src="{_escape(post.video_url)}" controls style="max-width:100%;border-radius:14px;"></video></p>\n'

    inner = f"""    <h1>{_escape(title_text)}</h1>
    <p class="sub">by <a href="{SITE_URL}/{author.username}">@{_escape(author.username)}</a> · {post.likes.count()} likes · {post.comments.count()} comments</p>
    <p style="font-size:18px;">{_excerpt(post.content, 1000)}</p>
{media}    <p><a class="btn" href="{SITE_URL}/register">Join HoloMedia</a></p>
"""
    return _resource_page(_head(title, description, canonical, extra), inner)


def _user_seo(user):
    title = f"{_escape(user.full_name)} (@{_escape(user.username)}) on HoloMedia"
    canonical = f"{SITE_URL}/{user.username}"
    bio = user.bio or f"{user.full_name} is on HoloMedia."
    description = (
        f"{_excerpt(bio, 160)} — {user.followers.count()} followers, "
        f"{user.following.count()} following, {user.posts.count()} posts."
    )
    inner = f"""    <h1>{_escape(user.full_name)}</h1>
    <p class="sub">@{_escape(user.username)} · {user.followers.count()} followers · {user.posts.count()} posts</p>
    <p style="font-size:18px;">{_excerpt(bio, 1000)}</p>
    <p><a class="btn" href="{SITE_URL}/register">Follow @{_escape(user.username)} on HoloMedia</a></p>
"""
    return _resource_page(_head(title, description, canonical), inner)


def _group_seo(group):
    title = f"{_escape(group.name)} — Group on HoloMedia"
    canonical = f"{SITE_URL}/groups/{group.id}"
    description = (
        f"{_excerpt(group.description, 160)} — {group.members.count()} members, "
        f"{group.posts.count()} posts."
    )
    inner = f"""    <h1>{_escape(group.name)}</h1>
    <p class="sub">{group.members.count()} members · {group.posts.count()} posts</p>
    <p style="font-size:18px;">{_excerpt(group.description, 1000)}</p>
    <p><a class="btn" href="{SITE_URL}/register">Join {_escape(group.name)} on HoloMedia</a></p>
"""
    return _resource_page(_head(title, description, canonical), inner)


def seo_html(path):
    """Return static HTML for a given URL path, or None if not indexable."""
    if path in ("/", "/welcome"):
        return _landing(f"{SITE_URL}/")
    if path == "/login":
        return _simple(
            "Log in — HoloMedia",
            "Log in to HoloMedia to share posts, loop reels, and connect with your community.",
            f"{SITE_URL}/login",
            "Log in to HoloMedia",
            "Share posts, loop reels, drop sounds, and hang out in groups. <a href=\"%s/register\">Create a free account</a>." % SITE_URL,
        )
    if path == "/register":
        return _simple(
            "Create your free account — HoloMedia",
            "Join HoloMedia free — no email verification needed. Share posts, loop reels, and connect in groups.",
            f"{SITE_URL}/register",
            "Create your free account",
            "Join HoloMedia free forever. <a href=\"%s/login\">Already have an account? Log in</a>." % SITE_URL,
        )
    if path.startswith("/p/"):
        post_id = _parse_id(path)
        if post_id:
            post = db.session.get(Post, post_id)
            if post:
                return _post_seo(post)
        return None
    if path.startswith("/groups/"):
        group_id = _parse_id(path)
        if group_id:
            group = db.session.get(Group, group_id)
            if group:
                return _group_seo(group)
        return None
    username = path.strip("/")
    if username and "/" not in username and not _parse_id(username):
        user = User.query.filter_by(username=username).first()
        if user:
            return _user_seo(user)
    return None
