"""Crawler-friendly static pages for search engines.

HoloMedia is a client-side rendered Angular app, so Googlebot only receives an
empty JS shell. This module detects real crawler bots and serves them fully
written, indexable HTML (meta tags, content, structured data) instead. Human
visitors keep getting the normal Angular app.
"""

import re

SITE_URL = "https://holomedia.vercel.app"

_CRAWLER_RE = re.compile(
    r"googlebot|bingbot|slurp|duckduckbot|baiduspider|yandex|facebookexternalhit|"
    r"twitterbot|linkedinbot|pinterest|whatsapp|telegrambot|discordbot|slackbot|"
    r"semrushbot|ahrefsbot|dotbot|rogerbot|mj12bot|archive\.org",
    re.IGNORECASE,
)


def is_bot(user_agent):
    return bool(user_agent and _CRAWLER_RE.search(user_agent))


def _head(title, description, canonical):
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
    return None
