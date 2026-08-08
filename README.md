# SocialApp / HoloMedia

Welcome to **SocialApp (HoloMedia)**, a comprehensive social media web and mobile application designed to connect users, facilitate content sharing, and enable real-time communication.

This repository contains both the frontend and backend components of the application.

---

## Architecture Overview

The application is split into two primary components:

1. **Frontend (`/frontend`)**: An interactive single-page application (SPA) built using **Angular**, utilizing modern components, services, and reactive state management. It also supports mobile capabilities via **Capacitor**.
2. **Backend (`/backend`)**: A lightweight and powerful REST API built with **Flask (Python)**, integrated with **Flask-SQLAlchemy** for database management, **Flask-JWT-Extended** for secure authentication, and **Flask-SocketIO** for real-time messaging.

---

## Core Features

- **User Profiles & Authentication**: Secure sign-up/login, JWT authorization, customizable biographies, custom profile colors, and follow/unfollow mechanisms.
- **Dynamic Feed**: Support for text, image, and video uploads. Includes a robust repost/share mechanism and bookmarking functionality.
- **Reactions & Comments**: Express feelings on posts using dynamic reactions (`like`, `love`, `haha`, `wow`, `sad`, `angry`) and engage in nested discussions.
- **Groups / Communities**: Create custom groups, customize group colors, join communities, and publish posts dedicated to specific groups.
- **Real-Time Direct Messaging**: Seamless, instant direct messaging between users powered by Socket.io WebSockets.
- **Smart Notifications**: Instant alerts for new followers, likes/reactions, comments, and direct messages.
- **SEO & Bots Support**: Dynamic meta-rendering for web crawlers, dynamic sitemap generators, and a robot control file (`robots.txt`).
- **Administration Panel**: High-level controls to moderate posts, suspend/unsuspend accounts, and toggle maintenance mode.

---

## Local Development Setup

To run this project on your local machine, follow the instructions below for setting up both the backend and frontend.

### Prerequisites

- **Python 3.10+**
- **Node.js 22+**
- **NPM**

---

### Backend Setup (`/backend`)

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Create a virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows, use: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Configuration**:
   Create a `.env` file in the `backend/` directory and configure the environment variables based on `.env.example`:
   ```env
   SECRET_KEY=your-development-secret-key
   DATABASE_URL=sqlite:///holomedia.db
   JWT_SECRET_KEY=your-jwt-secret-key
   CORS_ORIGINS=*
   ```

5. **Run the Development Server**:
   Start the backend application:
   ```bash
   python app.py
   ```
   The Flask server will initialize the SQLite database (if it doesn't already exist) and run locally on `http://localhost:5000` with hot-reloading and WebSockets enabled.

---

### Frontend Setup (`/frontend`)

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the Development Server**:
   ```bash
   npm start
   ```
   This starts the Angular development server. Open your browser and navigate to the application.

4. **Building for Production (Local Compilation)**:
   ```bash
   npm run build
   ```
   This compiles the Angular application and outputs static assets to the `dist/` folder, which the Flask backend can also serve.

---

## Running Tests

### Frontend Tests
Run frontend unit tests using Vitest (via Angular CLI):
```bash
cd frontend
npm run test
```
