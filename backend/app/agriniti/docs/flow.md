# AgriNiti Marketplace — Application Flow & Architecture Guide

> **For Frontend Developers:** This document explains what the app does, how its modules fit together, and the complete user journeys your UI needs to support.

---

## What Is AgriNiti?

AgriNiti is an **AI-powered agricultural marketplace** that connects Indian farmers (sellers) with commodity buyers. It goes beyond a simple listing board — it uses Google's Gemini AI embeddings to perform **semantic matching** between buyer needs and farmer stock, enriched with:

- 📊 **Real-time government mandi price benchmarks** (data.gov.in)
- 📍 **Geographic proximity** (Haversine distance calculation)
- ⭐ **Farmer reputation ratings** (aggregated star scores)

---

## Tech Stack (Backend)

| Component        | Technology                            |
| ---------------- | ------------------------------------- |
| Web framework    | FastAPI (Python)                      |
| Database         | SQLite via SQLAlchemy ORM             |
| Vector/AI search | ChromaDB + Google Gemini Embeddings   |
| Auth             | JWT (Bearer tokens, bcrypt passwords) |
| Market data      | `data.gov.in` Mandi Price API         |
| HTTP client      | HTTPX (async)                         |

---

## Module Overview

```
AgriNiti Backend
├── Auth Module          → User registration, login, token management
├── Listings Module      → Farmer produce listings (CRUD + AI indexing)
├── Buy Requests Module  → Buyer demand declarations
├── Ranking Module 🧠    → AI-powered semantic search engine
├── Ratings Module       → Star ratings and farmer reputation
└── Mandi Module         → Live government wholesale price data
```

---

## User Roles

| Role     | Can Do                                                |
| -------- | ----------------------------------------------------- |
| `farmer` | Create listings, view matched buyers, receive ratings |
| `buyer`  | Search listings, post buy requests, rate farmers      |
| `both`   | All of the above (e.g. a trader)                      |

> Role is set at registration time and cannot be changed. Design your signup form with a role selector.

---

## Complete User Journeys

### 🌾 Journey 1 — Farmer Posts Produce

```
1. REGISTER
   POST /auth/register  {role: "farmer", ...}
   → Receives JWT token + user profile

2. (Optional) VIEW MANDI PRICES to set competitive price
   GET /api/v1/mandi/prices?commodity=Onion&state=Maharashtra

3. POST LISTING
   POST /listings  {commodity, quantity_qtl, price_per_qtl, ...}
   → Listing saved to DB
   → Background: listing text embedded by Gemini AI → stored in ChromaDB

4. VIEW MATCHED BUYERS (optional, dashboard feature)
   GET /rank/buyers-for-listing/{listing_id}
   → Returns buyers whose profiles semantically match this listing
   → Shows name, phone, district, distance_km, matched crops

5. MANAGE LISTING
   PATCH /listings/{id}    (update price/qty)
   DELETE /listings/{id}   (deactivate / mark sold)

6. VIEW MY LISTINGS
   GET /listings/mine
```

---

### 🛒 Journey 2 — Buyer Searches for Produce

```
1. REGISTER
   POST /auth/register  {role: "buyer", primary_crops: "Onion,Potato"}
   → Profile embedded into AI vector DB for reverse matching

2. SEARCH (this is the main experience)
   GET /rank/sellers?q=<natural language query>&buyer_district=Pune
   → Returns ranked listing cards enriched with:
      - AI similarity score (how well listing matches query)
      - Live government mandi modal price
      - Price vs. market label (fair_price / above_market / below_market)
      - Distance in km from buyer to seller

3. VIEW LISTING DETAIL
   GET /listings/{id}

4. (Optional) POST BUY REQUEST (what buyer is looking for)
   POST /buy-requests  {commodity, quantity_needed_qtl, max_price_per_qtl}

5. RATE A SELLER after transaction
   POST /ratings/  {ratee_id: seller_id, score: 5, comment: "..."}
```

---

### 🔁 Journey 3 — Reverse Matching (Farmer Finds Buyers)

This is a unique feature: farmers don't need to find buyers manually.

```
1. Farmer creates a listing (see Journey 1, step 3)
2. GET /rank/buyers-for-listing/{listing_id}
   → Backend re-embeds listing text → queries ChromaDB buyer profiles collection
   → Returns buyers who semantically want what this farmer is selling
   → Sorted by AI similarity score
   → Includes distance, phone, and crop interest of each buyer
```

---

## Key Data Objects (Reference)

### User Object

```json
{
  "id": "uuid",
  "email": "string",
  "name": "string",
  "role": "farmer | buyer | both",
  "state": "string | null",
  "district": "string | null",
  "pincode": "string | null",
  "primary_crops": "comma-separated string | null",
  "phone": "string | null",
  "is_verified": false,
  "tier": "standard | premium"
}
```

### Listing Card Object (from `/rank/sellers`)

```json
{
  "score": 0.92,
  "id": "uuid",
  "commodity": "Onion",
  "variety": "Nasik Red",
  "quantity_qtl": 200.0,
  "price_per_qtl": 1800.0,
  "state": "Maharashtra",
  "district": "Nashik",
  "available_from": "2026-03-15",
  "available_until": "2026-04-15",
  "status": "active",
  "seller_name": "Raju Patel",
  "seller_phone": "9876543210",
  "seller_is_verified": false,
  "seller_tier": "standard",
  "seller_rating": 4.2,
  "seller_rating_count": 15,
  "mandi_modal_price": 1650.0,
  "price_vs_market": "above_market",
  "distance_km": 52.3
}
```

### Mandi Price Record

```json
{
  "state": "Maharashtra",
  "district": "Nashik",
  "market": "Lasalgaon",
  "commodity": "Onion",
  "variety": "Local",
  "arrival_date": "07/03/2026",
  "min_price": 1400.0,
  "max_price": 1900.0,
  "modal_price": 1650.0
}
```

---

## AI Ranking — How It Works (Non-Technical)

When a buyer types `"200 quintal fresh red onion from Maharashtra"`:

1. The backend converts this text into a 768-dimension numeric vector using Google Gemini
2. ChromaDB finds the most similar listing vectors (cosine similarity)
3. Results are fetched from SQLite to get full listing details
4. Each result is enriched with:
   - Government mandi price (distance to fair market value)
   - Haversine distance from buyer's district to seller's district
   - Seller's aggregated star rating from past buyers
5. Results are returned ranked by AI similarity score (highest first)

> **Frontend tip:** The `score` field (0–1) is the AI relevance. Show it as a match percentage (`score × 100`).

---

## Price vs Market Badge Logic

Display a colored badge based on the `price_vs_market` field:

| Value          | Badge           | Meaning                                            |
| -------------- | --------------- | -------------------------------------------------- |
| `fair_price`   | 🟢 Fair Price   | Farmer's price within ±15% of government benchmark |
| `above_market` | 🔴 Above Market | Farmer's price > 15% above mandi benchmark         |
| `below_market` | 🟡 Below Market | Farmer's price > 15% below mandi benchmark         |
| `unknown`      | ⚪ No Data      | Mandi data unavailable for this commodity/state    |

---

## Authentication Implementation Guide

### Token Storage

Store the JWT token in `localStorage` or `sessionStorage`:

```javascript
// After login/register
localStorage.setItem("agriniti_token", response.access_token);
localStorage.setItem("agriniti_user", JSON.stringify(response.user));
```

### Authenticated Requests

```javascript
const token = localStorage.getItem("agriniti_token");
fetch("/listings", {
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
});
```

### Login Form

> ⚠️ The `/auth/login` endpoint uses **OAuth2 form encoding**, NOT JSON.

```javascript
const formData = new URLSearchParams();
formData.append("username", email); // field must be named 'username'
formData.append("password", password);

fetch("/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: formData,
});
```

### Token Expiry

Tokens expire after **24 hours** (1440 minutes). On `401` responses, redirect the user to the login page:

```javascript
if (response.status === 401) {
  localStorage.removeItem("agriniti_token");
  window.location.href = "/login";
}
```

---

## Suggested Frontend Pages

| Page                 | API Calls                                                                               |
| -------------------- | --------------------------------------------------------------------------------------- |
| **Home / Search**    | `GET /rank/sellers?q=...&buyer_district=...`                                            |
| **Listing Detail**   | `GET /listings/{id}`, `GET /ratings/user/{seller_id}`                                   |
| **Farmer Dashboard** | `GET /listings/mine`, `GET /rank/buyers-for-listing/{id}`                               |
| **Post Listing**     | `GET /api/v1/mandi/commodities`, `GET /api/v1/mandi/states`, `POST /listings`           |
| **Mandi Prices**     | `GET /api/v1/mandi/prices`, `GET /api/v1/mandi/commodities`, `GET /api/v1/mandi/states` |
| **My Buy Requests**  | `GET /buy-requests/mine`, `POST /buy-requests`, `DELETE /buy-requests/{id}`             |
| **Login**            | `POST /auth/login`                                                                      |
| **Register**         | `POST /auth/register`                                                                   |
| **Profile**          | `GET /auth/me`, `GET /ratings/user/{me.id}`                                             |

---

## Important Notes for Frontend Developers

1. **AI search can be slow** (1–5s). Show a loading skeleton/spinner during `GET /rank/sellers` calls.
2. **`/listings/mine` appears before `/{listing_id}`** in route registration — so it works correctly. Do not reorder them.
3. **Mandi data availability varies** — always handle `mandi_modal_price: null` and `price_vs_market: "unknown"` gracefully in the UI.
4. **Distance requires `buyer_district`** to be passed in the query param — if the user is logged in, pre-populate this from `user.district`.
5. **Role enforcement is server-side** — even if you hide form buttons, the API will reject invalid-role actions with `403`.
6. **Ratings are idempotent** — submitting a second rating for the same user overwrites the first (no duplicate ratings).
7. **All IDs are UUIDs** (plain string format). No integer IDs anywhere.
8. **`created_at` is ISO string** from the server. Use `new Date(listing.created_at)` to parse on the frontend.
