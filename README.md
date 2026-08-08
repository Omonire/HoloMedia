# SocialApp (HoloMedia) — Product Requirements Document (PRD) & Business Infrastructure

Welcome to the central repository for **SocialApp (HoloMedia)**. This document serves as the combined **Product Requirements Document (PRD)** and **Business Infrastructure Specification** for our multi-platform social ecosystem.

---

## Part 1: Product Requirements Document (PRD)

### 1.1 Product Overview & Vision
SocialApp (HoloMedia) is a modern social media platform designed for interactive content creation, real-time messaging, and collaborative community building. The platform empowers users to share rich media, express sentiment with nuanced reactions, form community groups, and communicate instantly through highly interactive direct messaging.

The mission of HoloMedia is to bridge the gap between web and mobile user experiences, offering a fast, responsive, and engaging social graph.

---

### 1.2 User Personas
1. **The Content Creator**: Publishes text, video, and audio; tracks engagement (reposts, likes, bookmarks); values seamless media uploading.
2. **The Community Builder**: Creates and moderates niche Groups; seeks high-engagement feeds; organizes group-specific dialogue.
3. **The Active Engager**: Consistently interacts via reactions, comment threads, direct messaging, and sharing/reposting content.
4. **The System Administrator**: Oversees platform health, manages community moderation, suspends bad actors, and controls operational modes (e.g., Maintenance Mode).

---

### 1.3 Functional Requirements (FRs)

#### FR-1: Authentication & Social Graph
- **Registration & Login**: Secure sign-up/login mechanisms utilizing secure password hashing on the server and issuing JWT tokens.
- **User Profiles**: Custom bio, dynamic user colors, avatar selection, and public statistics (post count, followers, following counts).
- **Following System**: Ability to follow/unfollow other users, dynamically updating the feed and social graph.

#### FR-2: Dynamic Content Creation & Feeds
- **Post Composition**: Support for text content, custom images, video attachments, and integrated Spotify soundtracks.
- **Interactive Feed**: A unified timeline featuring posts, comments, and native share/reposts.
- **Bookmarking**: Save posts to a private bookmark list for future reference.
- **Batch Query Serialization**: Feeds must leverage optimized batch database queries to prevent N+1 performance bottlenecks and API request timeouts on heavy traffic feeds.

#### FR-3: The Engagement Engine
- **Nuanced Reactions**: Move beyond the simple "like" button. Support for six distinct reactions: `like`, `love`, `haha`, `wow`, `sad`, and `angry`.
- **Comment Threads**: Enable users to participate in conversational threads under posts.

#### FR-4: Collaborative Groups (Communities)
- **Group Creation**: Users can create dedicated Groups with custom descriptions and vibrant theme colors.
- **Group Publishing**: Group members can target posts directly inside the community wall, visible to all group members.

#### FR-5: Real-Time Communication & Messaging
- **Instant Direct Messaging**: Fast, bilateral direct messaging leveraging Socket.io WebSockets.
- **Read Receipts & Unread Counts**: Track whether messages have been viewed by the recipient.

#### FR-6: Notification System
- **Real-Time Alerts**: Trigger instant socket notifications for critical engagement events: follows, likes/reactions, comments, and direct messages.

#### FR-7: Crawler & Search Engine Optimization (SEO)
- **SEO Optimization**: Detect search engine crawlers (e.g., Googlebot, Bingbot) and serve optimized static pre-rendered HTML to maximize indexability.
- **Sitemap & Robots Control**: Generate dynamic sitemaps (`sitemap.xml`) to list all posts, users, and groups alongside a custom `robots.txt` configuration.

---

### 1.4 Non-Functional Requirements (NFRs)
- **Security**:
  - All passwords stored using secure one-way hashing algorithms (e.g., Werkzeug hashing).
  - JWT tokens used for API access control with configurable expiration parameters.
  - Route guards on the frontend to protect authenticated user space.
- **Performance**: High database read optimization; batched requests for bulk serialization.
- **Usability**: Fully responsive styling, smooth mobile sidebar-to-bottom-navigation transition (for screens under 640px), hidden scrollbars, and customized bottom padding to ensure zero layout overlaps on mobile devices.

---

## Part 2: Business Infrastructure & Operations

### 2.1 Operational Infrastructure Roles
To maintain business continuity and operational excellence, the application's roles are structured as follows:

```
┌────────────────────────────────────────────────────────┐
│                   System Administrator                 │
│   (Moderation, Maintenance Toggle, Accounts Suspension)│
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│                     Support Team                       │
│    (User Verification, Post Moderation, Reports)       │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│                   Standard End-User                    │
│   (Profiles, Feed Posting, Group Creation, Messaging)  │
└────────────────────────────────────────────────────────┘
```

- **System Administrator**: Full platform permissions. Can suspend or unsuspend users instantly. Toggles the platform's global **Maintenance Mode** in emergencies or upgrade windows, returning structured HTTP status responses.
- **Support Team**: Reviews flag notifications and handles platform policy violations.
- **End-User / Creator**: Engages with standard platform features.

---

### 2.2 Business Environment Workflow
All business feature validations and engineering improvements are verified locally using a dedicated local sandbox process.

#### Local Development Architecture
- **Local Application Database**: Utilizes an embedded SQLite database engine (`holomedia.db`) for rapid environment setup, seeding, and verification.
- **Development Service Ports**:
  - Frontend: Served on local Web/Preview Server.
  - Backend API: Flask Development Server served on port `5000` with WebSocket capabilities.

---

### 2.3 Running & Verifying the Product Locally

#### Prerequisites
- **Python 3.10+** (with virtual environment capability)
- **Node.js 22+**
- **NPM Package Manager**

#### Backend Setup (`/backend`)
1. Enter directory: `cd backend`
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate
   ```
3. Install required packages:
   ```bash
   pip install -r requirements.txt
   ```
4. Define environment variables in `.env`:
   ```env
   SECRET_KEY=holomedia-dev-secret-change-me
   JWT_SECRET_KEY=holomedia-jwt-secret
   DATABASE_URL=sqlite:///holomedia.db
   CORS_ORIGINS=*
   ```
5. Run application server:
   ```bash
   python app.py
   ```

#### Frontend Setup (`/frontend`)
1. Enter directory: `cd frontend`
2. Install packages:
   ```bash
   npm install
   ```
3. Start local development server:
   ```bash
   npm start
   ```
4. Compile local build:
   ```bash
   npm run build
   ```

---

### 2.4 Product Verification & Tests
Ensure all product capabilities remain resilient during iteration.

#### Frontend Validation
Verify client performance and unit coverage:
```bash
cd frontend
npm run test
```
