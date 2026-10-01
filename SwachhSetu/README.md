# ♻️ SWACHHSETU — Clean City. Smart Waste. Responsible Action.
**NeuralNest · Team 54 · Spectrum 2026 · Dr. Virendra Swarup Institute of Computer Studies**

React 19 + Vite + Tailwind 4 · Node/Express 5 · MongoDB/Mongoose 9 · optional AI vision (Anthropic API, backend only).

## Run it
```bash
# 1) Backend
cd backend && cp .env.example .env     # fill MONGO_URI + JWT_SECRET (ANTHROPIC_API_KEY optional)
npm install && npm run seed            # ⚠ wipes & re-seeds demo data
npm run dev                            # http://localhost:5000

# 2) Frontend (new terminal)
cd frontend && cp .env.example .env && npm install && npm run dev   # http://localhost:5173
```
**Demo logins** (password `Demo@123`): `citizen@swachhsetu.test` · `collector1@swachhsetu.test` · `admin@swachhsetu.test`
Other citizens: `priya@`, `rahul@`, `neha@` (has a demo penalty → shows the private awareness popup), `vikas@`, `anita@` (all `@swachhsetu.test`).

> ⚠ Rotate the MongoDB password that was in the original `backend/.env`. Never commit `.env`.

## Demo script for judges
Landing (logo intro plays once) → Register/Login → Citizen dashboard (SwachhScore, title, progress) → WasteWise (search "banana peel", upload a photo) → Report (photo + GPS → AI verdict) → Pickup (auto-assigned) → Tracking (map, timeline) → switch to collector: accept → start → share location / demo move → complete → back to citizen: score +20, notification → rate pickup → Awareness (read = +2) → Leaderboard → Admin: verify report (+15), apply penalty, hotspots.

## Architecture
```
backend/   server.js · models.js · seed.js
           routes/ auth · reports · pickups · score · content · admin
           middleware/auth.js (JWT + requireRole)   utils/score.js (ONLY place scores change)   utils/ai.js
frontend/  src/ api.js · auth.jsx · hooks.js · components/ · pages/   public/assets/ (logo, video, waste photos)
```
- **Original contract preserved:** `POST /api/auth/register|login`, `POST /api/reports` (multipart type/desc/loc/photo), `complaintId`, localStorage `token`/`user`. Additions only (role, Authorization header; `userId` now comes from the JWT, not the client).
- **Security:** bcrypt, JWT, role middleware on every protected route, helmet, upload type/size limits, no secrets in frontend, signup can never create admin/collector.
- **Privacy:** leaderboard returns only rank/alias/score/title; penalties, phones, reports are private to the owner; AI never auto-penalises.
- **Honest "live" tracking:** collector location is real GPS from their device; "Demo: simulate movement" is labelled, stored with `isDemo:true`, and shown as "demo" to the citizen.

## Score rules (utils/score.js)
Pickup completed: citizen +20, collector +30 (+5 on time) · Report verified by admin +15 · Awareness read +2 (once per item) · Collector feedback ≥4★ +5 · Admin penalty −1..−50 (floor 0). Titles: 0 Clean Starter · 100 Waste Warrior · 250 Green Guardian · 500 Clean Guardian · 750 Swachh Champion · 1000 Swachh Legend.

## Status (~90%)
Verified in the build environment: frontend builds and lints clean; backend boots, guards return 401/404/400 correctly; score titles and AI fallback tested; landing renders on desktop and mobile.
**Not yet tested against a live MongoDB or a real AI key** (neither was available) — run the demo script once after seeding and report anything odd.

## Enhancement backlog (search for `ENHANCE` in code)
1. Admin CRUD for Awareness / WasteWise content and categories; CSV export.
2. Add **verified statistics** (tonnes/day etc.) to Awareness from CPCB / MoHUA — deliberately left out rather than invented.
3. Real-time tracking (WebSocket/SSE) + route polyline; geocoding / address autocomplete.
4. Distance/polygon-based collector assignment; multi-city admin scoping.
5. Move uploads to S3/Cloudinary; serve report photos through an authenticated route.
6. Rate limiting, email/phone verification, password reset, refresh tokens.
7. Move score constants/titles to the database; quizzes, streaks, badges.
8. Hindi/English toggle (categories already store Hindi names); PWA/offline; tests (Jest/Supertest, Playwright).
9. Code-split routes (bundle ~500 kB) and skeleton loaders.
