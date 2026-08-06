from app import app
from extensions import db
from models import (User, Post, Like, Comment, Message, Notification,
                    Bookmark, Group)

VIDEOS = [
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
]

IMAGES = [
    "https://picsum.photos/seed/holo1/800/1000",
    "https://picsum.photos/seed/holo2/800/1000",
    "https://picsum.photos/seed/holo3/800/600",
    "https://picsum.photos/seed/holo4/800/1000",
]

SOUNDS = [
    "Ocean Waves - Sarah", "Studio Nights - Omar", "Product Launch - Alex",
    "Rainy Data - Lena", "Friday Deploy - Mike", "City Lights - Sarah",
]


def seed():
    with app.app_context():
        db.drop_all()
        db.create_all()

        colors = ["#7c3aed", "#0ea5e9", "#f43f5e", "#f59e0b", "#10b981", "#6366f1"]

        users_data = [
            ("alex", "alex@holomedia.io", "Alex Rivera",
             "Building the future of connection. Design x Code. #tech #design"),
            ("sarah", "sarah@holomedia.io", "Sarah Chen",
             "Photographer. Traveler. Coffee enthusiast. #travel #photography"),
            ("devmike", "mike@holomedia.io", "Mike Johnson",
             "Full-stack developer. I break things, then fix them. #coding #ai"),
            ("lena", "lena@holomedia.io", "Lena Novak",
             "Data scientist by day, painter by night. #data #art"),
            ("omar", "omar@holomedia.io", "Omar Haddad",
             "Music producer and lifelong learner. #music #producer"),
        ]

        users = {}
        for i, (uname, email, name, bio) in enumerate(users_data):
            u = User(username=uname, email=email, full_name=name, bio=bio,
                     avatar_color=colors[i % len(colors)])
            u.set_password("password123")
            db.session.add(u)
            users[uname] = u

        demo = User(username="you", email="you@holomedia.io",
                    full_name="You", bio="This is your demo account. Go wild.",
                    avatar_color="#8b5cf6")
        demo.set_password("demo1234")
        db.session.add(demo)
        users["you"] = demo
        db.session.flush()

        follows = [
            ("you", "alex"), ("you", "sarah"), ("you", "devmike"),
            ("alex", "sarah"), ("sarah", "alex"), ("devmike", "alex"),
            ("alex", "lena"), ("lena", "sarah"), ("omar", "alex"),
            ("sarah", "devmike"), ("devmike", "lena"), ("you", "lena"),
        ]
        for f, t in follows:
            follower, target = users[f], users[t]
            if not follower.is_following(target):
                follower.following.append(target)
        db.session.flush()

        posts_data = [
            ("alex", "Just shipped the new design system for our app. Clean, accessible, and fast. #design #tech", None, None, None),
            ("sarah", "Golden hour at the coast. Nature never misses. #travel #photography", IMAGES[0], None, None),
            ("devmike", "Hot take: your CI pipeline should be a few minutes, not a few hours. #coding", None, None, None),
            ("lena", "Finished a 12-hour data viz session. Plotly is underrated. #data", IMAGES[2], None, None),
            ("omar", "New track dropping Friday. It's got more bass than your neighbor's subwoofer. #music", None, None, None),
            ("alex", "Favorite quote this week: 'Simplicity is the ultimate sophistication.'", None, None, None),
            ("sarah", "Morning light appreciation post. Who else is obsessed? #photography", IMAGES[3], None, None),
            ("devmike", "Wrote my first Rust program today. Ownership makes sense now! #coding #ai", None, None, None),
            ("lena", "Visualizing 10 years of weather data. The patterns are stunning. #data", None, None, None),
            ("you", "Welcome to HoloMedia! This is your first post. Like, comment, and follow people to fill your feed. #holomedia", None, None, None),
            # TikTok-style reels with sounds
            ("sarah", "POV: you finally caught the perfect wave #travel #ocean", None, VIDEOS[0], SOUNDS[0]),
            ("omar", "Behind the scenes of the new single. The studio never sleeps. #music", None, VIDEOS[1], SOUNDS[1]),
            ("alex", "Product demo time. This is what we've been building. #tech #design", None, VIDEOS[2], SOUNDS[2]),
            ("lena", "Rainy day + data = my happy place #data", None, VIDEOS[3], SOUNDS[3]),
            ("devmike", "Fastest way to break prod: deploy on a Friday. #coding #ai", None, VIDEOS[4], SOUNDS[4]),
            ("sarah", "City lights, big dreams. #travel #photography", None, VIDEOS[5], SOUNDS[5]),
        ]

        posts = []
        for uname, content, img, vid, sound in posts_data:
            p = Post(user_id=users[uname].id, content=content, image_url=img,
                     video_url=vid, sound=sound)
            db.session.add(p)
            posts.append(p)
        db.session.flush()

        # X-style reposts
        repost_specs = [
            ("you", posts[2]), ("alex", posts[7]), ("sarah", posts[4]), ("devmike", posts[5]),
        ]
        for uname, original in repost_specs:
            db.session.add(Post(user_id=users[uname].id, content="", repost_of_id=original.id))
        db.session.flush()

        # Facebook-style groups
        groups_data = [
            ("Design Community", "For designers and creators to share work and feedback. #design", "#0ea5e9", "alex"),
            ("Dev Lounge", "Programming talk, job hunting, and the occasional meme. #coding", "#10b981", "devmike"),
            ("Wanderlust", "Travel stories, photos, and trip planning. #travel", "#f59e0b", "sarah"),
            ("Music Makers", "Producers and musicians swapping tracks and tips. #music", "#ec4899", "omar"),
            ("Data Geeks", "Data science, viz, and nerdy charts. #data", "#7c3aed", "lena"),
        ]
        groups = []
        for name, desc, color, creator in groups_data:
            g = Group(name=name, description=desc, icon_color=color,
                      created_by_id=users[creator].id)
            db.session.add(g)
            groups.append(g)
        db.session.flush()

        group_member_specs = [
            (groups[0], ["you", "alex", "sarah", "lena"]),
            (groups[1], ["you", "devmike", "alex", "omar"]),
            (groups[2], ["you", "sarah", "lena"]),
            (groups[3], ["omar", "alex", "you"]),
            (groups[4], ["lena", "devmike", "you"]),
        ]
        for g, names in group_member_specs:
            for n in names:
                g.members.append(users[n])
        db.session.flush()

        group_posts = [
            (groups[0], "alex", "Dropped a new dribbble shot, would love feedback! #design"),
            (groups[0], "sarah", "Dark UI or light UI? I'm building a portfolio site."),
            (groups[1], "devmike", "Anyone else migrating to Python 3.14? Smooth so far."),
            (groups[1], "you", "Just wrote my first unit test with pytest. Feels good!"),
            (groups[2], "sarah", "Planning a Japan trip for spring. Any must-visit spots?"),
            (groups[3], "omar", "Sharing an exclusive preview of the new single 🎧"),
            (groups[4], "lena", "Chart of the week: global temperatures, 10-year rolling average."),
        ]
        for g, uname, content in group_posts:
            db.session.add(Post(user_id=users[uname].id, content=content, group_id=g.id))
        db.session.flush()

        comments = [
            (posts[1], "sarah", "Stunning shot!!"),
            (posts[1], "alex", "Absolutely beautiful."),
            (posts[2], "lena", "CI/CD wisdom right here."),
            (posts[0], "you", "Can't wait to use it!"),
            (posts[4], "sarah", "Can't wait for the drop!"),
            (posts[3], "devmike", "Love the color palette."),
            (posts[7], "omar", "Rust is the way."),
            (posts[10], "you", "That wave is unreal 😍"),
            (posts[12], "you", "This is so cool!"),
            (posts[14], "alex", "Painfully accurate 😂"),
        ]
        for p, uname, content in comments:
            db.session.add(Comment(user_id=users[uname].id, post_id=p.id, content=content))

        # Facebook-style reactions
        reaction_specs = [
            (posts[0], "you", "love"), (posts[0], "sarah", "like"),
            (posts[1], "you", "love"), (posts[1], "alex", "wow"), (posts[1], "devmike", "like"),
            (posts[2], "you", "like"), (posts[2], "alex", "haha"),
            (posts[4], "alex", "like"), (posts[4], "sarah", "love"),
            (posts[9], "alex", "like"), (posts[9], "sarah", "love"), (posts[9], "devmike", "like"),
            (posts[9], "lena", "wow"), (posts[9], "omar", "haha"),
            (posts[10], "you", "love"), (posts[10], "alex", "wow"),
            (posts[12], "you", "love"), (posts[12], "sarah", "like"),
            (posts[14], "alex", "haha"), (posts[14], "you", "haha"),
            (posts[11], "you", "like"), (posts[15], "you", "love"),
        ]
        for p, uname, kind in reaction_specs:
            db.session.add(Like(user_id=users[uname].id, post_id=p.id, kind=kind))

        bookmarks = [(posts[12], "you"), (posts[1], "you"), (posts[8], "you")]
        for p, uname in bookmarks:
            db.session.add(Bookmark(user_id=users[uname].id, post_id=p.id))

        messages = [
            ("alex", "you", "Hey! Welcome to HoloMedia. 👋"),
            ("you", "alex", "Thanks, excited to be here!"),
            ("sarah", "you", "Love your profile picture."),
            ("devmike", "you", "That first post was great. Nice to have you!"),
        ]
        for s, r, content in messages:
            db.session.add(Message(sender_id=users[s].id, recipient_id=users[r].id, content=content))

        notifications = [
            ("you", "alex", "follow", None),
            ("you", "sarah", "follow", None),
            ("you", "devmike", "follow", None),
            ("you", "alex", "like", posts[9].id),
            ("you", "sarah", "love", posts[9].id),
            ("you", "alex", "comment", posts[9].id),
            ("you", "devmike", "message", None),
            ("you", "alex", "repost", posts[2].id),
            ("you", "sarah", "like", posts[10].id),
            ("you", "devmike", "group", None),
        ]
        for uid, actor, kind, pid in notifications:
            db.session.add(Notification(
                user_id=users[uid].id, actor_id=users[actor].id, kind=kind, post_id=pid
            ))

        db.session.commit()
        print("Seed complete!")
        print(f"  Users: {User.query.count()}, Posts: {Post.query.count()}, "
              f"Groups: {Group.query.count()}, Reels: {Post.query.filter(Post.video_url.isnot(None)).count()}, "
              f"Group posts: {Post.query.filter(Post.group_id.isnot(None)).count()}, "
              f"Reposts: {Post.query.filter(Post.repost_of_id.isnot(None)).count()}")
        print("  Demo login: you / demo1234")


if __name__ == "__main__":
    seed()
