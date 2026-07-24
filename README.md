# PulseMatch — Emergency Blood Availability & Donor Matching Platform

A full-stack web application that connects blood donors, blood banks, and hospitals through real-time, location-based matching — built to reduce blood shortage response time and minimize wastage from expired stock.

---

## 1. Problem Statement

Blood shortage during emergencies is rarely a supply problem — it's a **coordination** problem:

- Hospitals often don't know which nearby blood bank has a given blood group in stock, especially for rare groups.
- There is no fast, reliable way to locate an eligible, nearby donor during a critical situation.
- Manual, register-based tracking causes blood units to expire unused (whole blood has a ~42-day shelf life).
- Donors have no system to remind them when they become eligible to donate again (a minimum 90-day gap is medically required).
- Hospital-to-blood-bank communication is often informal (phone calls, word of mouth), causing delays exactly when speed matters most.

## 2. Objective

To build a digital platform that:
1. Lets donors and hospitals register with their location and requirements.
2. Matches blood requests to the **nearest eligible donors** or **nearest blood banks with available stock**, sorted by distance.
3. Tracks blood inventory from collection to expiry, minimizing wastage.
4. Gives blood bank admins a real-time dashboard of stock levels and incoming requests.

## 3. Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | React 19 + Vite | Fast dev/build, component-based UI |
| Styling | Tailwind CSS v4 | Utility-first, consistent design system |
| Routing | React Router v6 | Client-side routing, role-based protected routes |
| Charts | Recharts | Admin dashboard visualizations |
| Real-time | Socket.io | Live dashboard updates on new/updated requests and stock, no manual refresh |
| Backend | Node.js + Express | REST API |
| Database | MongoDB (Atlas) + Mongoose | Native geospatial query support (`2dsphere` + `$near`) |
| Caching | Redis | Reduces repeated-query load on the database during search bursts |
| Auth | JWT + bcrypt | Stateless authentication, secure password hashing |
| Validation / Security | express-rate-limit | Brute-force and abuse protection |
| Testing | Jest + Supertest + mongodb-memory-server | Backend integration tests against a real (in-memory) MongoDB |

**Why MongoDB over a relational database:** the core feature — finding the nearest donor or blood bank — needs geospatial querying. MongoDB's `2dsphere` index and `$near` operator return location-sorted results natively, without writing manual Haversine distance calculations.

## 4. System Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   React Frontend │  HTTP   │   Express Backend │  Mongo  │  MongoDB Atlas  │
│   (Vite, Tailwind)│───────▶│   (REST API, JWT)  │─────────▶│  (Geo-indexed)  │
└─────────────────┘  (Axios) └──────────────────┘ Queries └─────────────────┘
                                       │
                                       │ cache reads/writes
                                       ▼
                               ┌───────────────┐
                               │     Redis      │
                               │ (30s TTL cache │
                               │ on search APIs)│
                               └───────────────┘
```

## 5. Core Features

| Feature | Details |
|---|---|
| Role-based accounts | Donor, Hospital, Admin — separate permissions and views |
| Geo-location search | Nearest eligible donors / nearest blood banks with stock, sorted by distance |
| Donor eligibility check | Enforces 90-day minimum gap since last donation and minimum weight requirement |
| Blood inventory tracking | Auto-calculated expiry (collection date + 42 days), FEFO (first-expiry-first-out) sorting |
| Expiry alerts | Admin view flags units expiring within 7 days |
| Blood request system | Hospitals submit requests with urgency levels (normal/urgent/critical) and track status |
| Profile management | View/edit account details (name, phone, address, weight) |
| Donation logging | Donors log completed donations; automatically updates `lastDonationDate`, which feeds the eligibility check used in search |
| Donation history | Donors can view a chronological log of their past donations |
| Real-time admin dashboard | Live stock-by-blood-group chart, pending requests, expiring stock — updates instantly via Socket.io when a new request or stock change happens, no manual refresh |
| Caching layer | Redis caches search results for 30 seconds to absorb repeated queries during demand spikes |
| Security | JWT auth, bcrypt password hashing, rate limiting (stricter on login/register) |
| 404 handling | Custom not-found page for unmatched routes |

## 6. Database Schema (Collections)

- **User** — donors, hospitals, admins; role field; GeoJSON `location` (2dsphere-indexed); blood group, weight, last donation date (donors only)
- **BloodBank** — bank details, license number, GeoJSON location
- **BloodStock** — units per blood group per bank; auto-calculated expiry date; status (available/reserved/expired/used)
- **BloodRequest** — hospital requests; blood group, units needed, urgency, GeoJSON location, status (pending/matched/fulfilled/cancelled)
- **Donation** — per-donor donation log (blood group, units, date); logging a donation updates the parent `User.lastDonationDate`

## 7. API Overview

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register donor/hospital/admin |
| POST | `/api/auth/login` | Public | Login, returns JWT |
| GET | `/api/search/donors` | Protected | Nearest eligible donors by blood group (cached) |
| GET | `/api/search/blood-banks` | Protected | Nearest blood banks with matching stock (cached) |
| POST | `/api/stock` | Admin | Add new blood stock batch |
| GET | `/api/stock` | Protected | List stock, sorted by soonest expiry |
| GET | `/api/stock/expiring-soon` | Admin | Units expiring within 7 days |
| PATCH | `/api/stock/:id` | Admin | Update stock units/status |
| POST | `/api/requests` | Hospital | Create a blood request |
| GET | `/api/requests` | Protected | List requests |
| PATCH | `/api/requests/:id` | Admin | Update request status |
| GET | `/api/profile` | Protected | Get current user's profile |
| PATCH | `/api/profile` | Protected | Update current user's profile |
| POST | `/api/profile/donations` | Donor | Log a completed donation (updates eligibility) |
| GET | `/api/profile/donations` | Donor | View own donation history |

**Real-time events (Socket.io):** the backend emits `request:created`, `request:updated`, and `stock:updated` to clients in the `admin-room`. The admin dashboard joins this room on connect and refreshes automatically when any of these fire — no polling, no manual refresh.

## 8. Frontend Pages (8 total)

| Page | Route | Access | Description |
|---|---|---|---|
| Home | `/` | Public | Landing page — problem framing, feature highlights |
| Login | `/login` | Public | Email/password login |
| Register | `/register` | Public | Sign up as donor or hospital; captures geolocation on registration |
| Search | `/search` | Donor, Hospital | Geo-matching — nearest donors or nearest blood banks with stock |
| Requests | `/requests` | Hospital | Create and track blood requests |
| Dashboard | `/dashboard` | Admin | Live stock chart, expiring-soon alerts, recent requests — updates in real time |
| Profile | `/profile` | Donor, Hospital, Admin | View/edit account, log donations (donors), view donation history and eligibility status |
| Not Found | `*` (any unmatched route) | Public | Custom 404 page |

## 9. Design System (Frontend)

- **Palette**: blood red `#C41E3A` (primary/urgency), near-black navy `#0B1220` (text), clinical off-white `#F7F7F5` (background), medical teal `#1B998B` (success/available states)
- **Typography**: Space Grotesk (display), IBM Plex Sans (body), IBM Plex Mono (data — units, distances, timestamps)
- **Signature element**: an animated EKG pulse-line used as a header divider, tying the visual language directly to the subject matter

## 10. Project Structure

```
pulsematch/
├── backend/
│   ├── config/          # MongoDB Atlas, Redis, and Socket.io instance management
│   ├── controllers/     # Business logic (auth, search, stock, requests, profile/donations)
│   ├── middleware/      # JWT auth, role authorization, rate limiting, caching, error handling
│   ├── models/          # Mongoose schemas (User, BloodBank, BloodStock, BloodRequest, Donation)
│   ├── routes/          # Express route definitions
│   ├── tests/           # Jest + Supertest integration tests (in-memory MongoDB)
│   ├── app.js           # Express app (routes/middleware only — no listener, no DB connect)
│   ├── server.js        # HTTP server + Socket.io + DB/Redis connections, imports app.js
│   ├── jest.config.js
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── api/          # Axios client with JWT interceptor
    │   ├── components/   # Navbar, PulseLine, ProtectedRoute
    │   ├── context/       # AuthContext (global auth state)
    │   ├── hooks/         # useAdminSocket (Socket.io client hook)
    │   ├── pages/         # Home, Login, Register, Search, Requests, Dashboard, Profile, NotFound
    │   └── index.css      # Design tokens (Tailwind v4 theme)
    └── .env.example
```

## 11. Setup Instructions

### Backend
```bash
cd backend
npm install
cp .env.example .env     # then fill in MONGO_URI (MongoDB Atlas), JWT_SECRET, REDIS_URL
npm run dev               # runs on http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
npm run dev                # runs on http://localhost:5173, proxies /api to :5000
```

> Redis is optional — if `REDIS_URL` isn't reachable, the backend runs uncached without crashing.

### Running backend tests
```bash
cd backend
npm test
```
Tests use `mongodb-memory-server`, which downloads a local MongoDB binary the **first** time you run it (needs an internet connection for that one-time download only; subsequent runs use the cached binary). This is separate from your Atlas database — tests never touch production data.

## 12. Key Design Decisions (for viva / interview discussion)

- **MongoDB over SQL** — chosen specifically for native geospatial querying (`2dsphere` + `$near`), avoiding manual distance-formula calculations.
- **JWT over server-side sessions** — stateless authentication, easier to scale horizontally, no session store required.
- **Role-based middleware** — a single reusable `authorize(...roles)` middleware instead of duplicating access checks per route.
- **FEFO stock sorting** — inventory queries sort by expiry date ascending (First-Expiry-First-Out) to actively reduce wastage.
- **Short-TTL caching** — search results are cached for only 30 seconds, balancing performance during query bursts against the fact that stock/donor availability changes frequently.
- **Graceful degradation** — the app is designed to keep running even if Redis is unavailable; caching is an enhancement, not a dependency.
- **Socket.io over polling** — the admin dashboard needs to reflect new/updated requests and stock changes immediately during an emergency; a WebSocket push model avoids the latency and wasted requests of polling the API every few seconds. Clients join an `admin-room`, so updates are broadcast only to the dashboards that need them, not every connected client.
- **`app.js` / `server.js` split** — the Express app (routes, middleware) is defined separately from the HTTP server, Socket.io, and database connections. This makes the app importable and testable in isolation (see `tests/`) without needing a real server running or a real database connection.
- **Integration tests over unit tests** — the test suite (Jest + Supertest) exercises full HTTP request/response cycles against a real (in-memory) MongoDB rather than mocking the database. This catches issues mocks would hide — e.g. the geospatial `2dsphere` index actually needs to exist and work for the `$near` queries to return correctly sorted results.

## 13. Future Scope

- SMS/email alerts to nearby matching donors when a request is created (not implemented — would need Twilio/Nodemailer integration)
- Google Maps embed on the search results page (pins instead of a list)
- Blood bank CRUD page for admins (create/edit/delete banks, not just stock)
- Mobile app (React Native) for push notifications
- ML-based blood demand forecasting by region and season
- QR-code donor verification cards for donation camps
- Scaling real-time updates across multiple server instances via Redis pub/sub (currently Socket.io runs on a single instance's in-memory room)

## 14. Testing Notes

- Backend integration tests live in `backend/tests/` and cover: registration validation (missing fields, duplicate email, donor-specific rules), login (success/failure), protected-route auth enforcement, and the core geo-matching feature (donors within radius are returned, donors outside radius are excluded, ineligible donors — donated within 90 days — are filtered out even when geographically in range).
- Run with `npm test` from `backend/`. First run needs internet access to download the `mongodb-memory-server` binary once; it's cached after that.
- No frontend test suite is included. If you want to extend this, React Testing Library + Vitest is the natural fit given the Vite setup already in place.

## 15. Author

Built as a B.Tech final year project — full-stack implementation covering system design, database modeling, authentication/authorization, geospatial querying, caching, real-time communication, and automated testing.
