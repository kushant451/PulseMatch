# 🩸 PulseMatch

**Emergency Blood Availability & Donor Matching Platform**

Connecting donors, hospitals, and blood banks through real-time, location-based matching.

- 🔗 **Live App:** https://pulse-match-theta.vercel.app
- ⚙️ **API:** https://pulsematch.onrender.com

**Jump to:** [Features](#features) · [Tech Stack](#tech-stack) · [Getting Started](#getting-started)

---

## About

Blood shortages during emergencies are rarely a supply problem — they're a **coordination** problem. Hospitals often can't quickly find which nearby blood bank has a rare group in stock, donors have no easy way to be located when needed, and manual tracking causes usable blood to expire unused.

**PulseMatch** solves this with a full-stack platform that geospatially matches blood requests to the nearest eligible donors and blood banks, tracks inventory from collection to expiry, and gives admins a live operational dashboard.

> ⚠️ **Live demo note:** the backend is hosted on Render's free tier, so the first request after inactivity may take 30–60 seconds to spin up.

## Features

- 🔍 **Geospatial matching** — find the nearest eligible donors or blood banks for a given blood group, ranked by distance
- 🚨 **Blood requests** — hospitals raise requests by urgency (normal / urgent / critical); donors can respond directly
- 📦 **Inventory tracking** — blood bank stock managed by unit, with automatic expiry calculation (42-day shelf life) and low-stock/expiring-soon alerts
- 📊 **Live admin dashboard** — real-time stock and request updates via WebSockets, no manual refresh
- 🩺 **Donor eligibility** — tracks last donation date and weight to guide 90-day eligibility windows
- 🔐 **Role-based access** — separate flows for donors, hospitals, and admins, secured with JWT auth
- ⚡ **Rate limiting & caching** — Redis-backed caching on high-traffic search endpoints, with abuse protection on auth routes

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS v4, React Router |
| **Backend** | Node.js, Express |
| **Database** | MongoDB Atlas + Mongoose (`2dsphere` geospatial indexing) |
| **Real-time** | Socket.io |
| **Caching** | Redis |
| **Auth** | JWT + bcrypt |
| **Testing** | Jest, Supertest, mongodb-memory-server |
| **Deployment** | Vercel (frontend) · Render (backend) |

## Architecture

```
┌───────────────────┐   HTTP/Axios   ┌────────────────────┐   Mongoose    ┌──────────────────┐
│   React Frontend    │ ─────────────▶ │   Express REST API   │ ────────────▶ │   MongoDB Atlas    │
│  (Vercel · Tailwind) │ ◀───────────── │  (Render · JWT auth)  │ ◀──────────── │  (Geo-indexed)     │
└───────────────────┘   Socket.io    └────────────────────┘               └──────────────────┘
                                               │
                                               ▼
                                     ┌───────────────────┐
                                     │       Redis         │
                                     │ (optional — caches   │
                                     │  /search/* only,     │
                                     │  30s TTL)            │
                                     └───────────────────┘
```

## Live Demo

| | Link |
|---|---|
| 🌐 **Frontend** | [pulse-match-theta.vercel.app](https://pulse-match-theta.vercel.app) |
| ⚙️ **Backend API** | [pulsematch.onrender.com](https://pulsematch.onrender.com) |

## Getting Started

### Prerequisites

- Node.js ≥ 18
- MongoDB Atlas connection string
- Redis instance (optional locally, used for caching)

### 1. Clone the repository

```bash
git clone https://github.com/kushant451/PulseMatch.git
cd PulseMatch
```

### 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env   # fill in MONGO_URI, JWT_SECRET, etc.
npm run dev
```

### 3. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env   # set VITE_API_URL and VITE_SOCKET_URL
npm run dev
```

The frontend will be available at `http://localhost:5173` and the API at `http://localhost:5000`.

### Running tests

```bash
cd backend
npm test
```

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a donor, hospital, or admin |
| `POST` | `/api/auth/login` | Authenticate and receive a JWT |
| `GET` | `/api/search/donors` | Find nearest eligible donors by blood group |
| `GET` | `/api/search/blood-banks` | Find nearest blood banks with available stock |
| `GET`/`POST`/`PATCH` | `/api/stock` | Manage blood bank inventory (admin) |
| `GET`/`POST`/`PATCH` | `/api/requests` | Raise, browse, and respond to blood requests |
| `GET`/`PATCH` | `/api/profile` | Manage user profile and donation history |

## Project Structure

```
PulseMatch/
├── backend/
│   ├── controllers/   # Route logic
│   ├── models/         # Mongoose schemas (User, BloodRequest, BloodStock, ...)
│   ├── routes/         # Express route definitions
│   ├── middleware/     # Auth, rate limiting, caching, error handling
│   ├── config/         # DB, Redis, Socket.io setup
│   └── tests/          # Jest + Supertest integration tests
└── frontend/
    ├── src/
    │   ├── pages/       # Route-level views
    │   ├── components/  # Reusable UI components
    │   ├── context/     # Auth context
    │   ├── hooks/        # Custom hooks (e.g. admin socket)
    │   └── api/          # Axios client
    └── public/
```

## License

This project is available for educational and portfolio purposes.

---

*Built with ❤️ to make emergency blood access faster and more reliable.*