# AgriNiti Marketplace — API Documentation

> **Base URL:** `http://localhost:8000`  
> **Interactive Docs:** `http://localhost:8000/docs` (Swagger UI)  
> **Auth:** All protected endpoints require `Authorization: Bearer <token>` header.

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Listings](#2-listings)
3. [Buy Requests](#3-buy-requests)
4. [Ranking (AI-Powered Search)](#4-ranking-ai-powered-search)
5. [Ratings](#5-ratings)
6. [Mandi Prices (Government Data)](#6-mandi-prices-government-data)

---

## 1. Authentication

### POST `/auth/register`

**Description:** Create a new user account. Returns a JWT token immediately — no email verification required.  
**Auth Required:** ❌ No

**Request Body:**

```json
{
  "email": "farmer@example.com",
  "password": "securepass123",
  "name": "Raju Patel",
  "role": "farmer",
  "state": "Maharashtra",
  "district": "Nashik",
  "pincode": "422001",
  "primary_crops": "Onion,Garlic,Tomato",
  "phone": "9876543210"
}
```

| Field           | Type   | Required | Notes                                           |
| --------------- | ------ | -------- | ----------------------------------------------- |
| `email`         | string | ✅       | Must be valid email format                      |
| `password`      | string | ✅       | Plain text; bcrypt-hashed on server             |
| `name`          | string | ✅       | Display name                                    |
| `role`          | string | ✅       | `farmer` / `buyer` / `both` (default: `farmer`) |
| `state`         | string | ❌       | Home state                                      |
| `district`      | string | ❌       | Home district                                   |
| `pincode`       | string | ❌       | 6-digit pincode                                 |
| `primary_crops` | string | ❌       | Comma-separated crop interests                  |
| `phone`         | string | ❌       | Shown on listing cards to buyers                |

**Response — 201 Created:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "c1a2b3d4-...",
    "email": "farmer@example.com",
    "name": "Raju Patel",
    "role": "farmer",
    "state": "Maharashtra",
    "district": "Nashik",
    "pincode": "422001",
    "primary_crops": "Onion,Garlic,Tomato",
    "phone": "9876543210",
    "is_verified": false,
    "tier": "standard"
  }
}
```

**Error Responses:**
| Status | Description |
|---|---|
| `409 Conflict` | Email already registered |
| `422 Unprocessable Entity` | Invalid email format or missing required fields |

---

### POST `/auth/login`

**Description:** Log in and get a JWT access token.  
**Auth Required:** ❌ No  
**Content-Type:** `application/x-www-form-urlencoded` ⚠️ (NOT JSON — standard OAuth2 form)

**Request Body (form-encoded):**

```
username=farmer@example.com&password=securepass123
```

> **Frontend tip:** Use `new URLSearchParams(...)` or set `Content-Type: application/x-www-form-urlencoded`.

**Response — 200 OK:**

```json
{
  "access_token": "eyJhbGci...",
  "token_type": "bearer",
  "user": { ...same UserOut object as register... }
}
```

**Error Responses:**
| Status | Description |
|---|---|
| `401 Unauthorized` | Incorrect email or password |

---

### GET `/auth/me`

**Description:** Returns the currently authenticated user's profile.  
**Auth Required:** ✅ Yes

**Response — 200 OK:**

```json
{
  "id": "c1a2b3d4-...",
  "email": "farmer@example.com",
  "name": "Raju Patel",
  "role": "farmer",
  "state": "Maharashtra",
  "district": "Nashik",
  "pincode": "422001",
  "primary_crops": "Onion,Garlic,Tomato",
  "phone": "9876543210",
  "is_verified": false,
  "tier": "standard"
}
```

**Error Responses:**
| Status | Description |
|---|---|
| `401 Unauthorized` | Missing or expired token |

---

## 2. Listings

Listings are produce posts by farmers. They are indexed in the AI vector database for semantic search.

### POST `/listings`

**Description:** Create a new produce listing. The listing is automatically embedded and stored in the AI vector database.  
**Auth Required:** ✅ Yes (must have role `farmer` or `both`)

**Request Body:**

```json
{
  "commodity": "Onion",
  "variety": "Nasik Red",
  "quantity_qtl": 200.0,
  "price_per_qtl": 1800.0,
  "state": "Maharashtra",
  "district": "Nashik",
  "available_from": "2026-03-15",
  "available_until": "2026-04-15"
}
```

| Field             | Type   | Required | Notes                                      |
| ----------------- | ------ | -------- | ------------------------------------------ |
| `commodity`       | string | ✅       | Crop name, e.g. "Onion"                    |
| `variety`         | string | ❌       | Sub-variety, e.g. "Nasik Red"              |
| `quantity_qtl`    | float  | ✅       | Quantity in quintals                       |
| `price_per_qtl`   | float  | ✅       | Asking price in ₹ per quintal              |
| `state`           | string | ❌       | Falls back to farmer's registered state    |
| `district`        | string | ❌       | Falls back to farmer's registered district |
| `available_from`  | string | ❌       | ISO date, e.g. `"2026-03-15"`              |
| `available_until` | string | ❌       | ISO date                                   |

**Response — 201 Created:**

```json
{
  "id": "lst-uuid-...",
  "seller_id": "usr-uuid-...",
  "commodity": "Onion",
  "variety": "Nasik Red",
  "quantity_qtl": 200.0,
  "price_per_qtl": 1800.0,
  "state": "Maharashtra",
  "district": "Nashik",
  "available_from": "2026-03-15",
  "available_until": "2026-04-15",
  "status": "active",
  "created_at": "2026-03-07T10:30:00",
  "seller_name": "Raju Patel",
  "seller_phone": "9876543210",
  "seller_is_verified": false,
  "seller_tier": "standard",
  "seller_rating": null
}
```

**Error Responses:**
| Status | Description |
|---|---|
| `401 Unauthorized` | Missing or invalid token |
| `403 Forbidden` | User role is not `farmer` or `both` |

---

### GET `/listings`

**Description:** Browse all active listings with optional filters. Public endpoint.  
**Auth Required:** ❌ No

**Query Parameters:**
| Param | Type | Default | Description |
|---|---|---|---|
| `commodity` | string | — | Case-insensitive partial match, e.g. `onion` |
| `state` | string | — | Exact state filter |
| `status` | string | `active` | `active` / `sold` / `expired` |
| `limit` | int | `20` | Max records to return |
| `offset` | int | `0` | Pagination offset |

**Example Request:**

```
GET /listings?commodity=onion&state=Maharashtra&limit=10
```

**Response — 200 OK:** Array of listing objects (same as POST response above).

---

### GET `/listings/mine`

**Description:** Returns all listings owned by the currently logged-in farmer.  
**Auth Required:** ✅ Yes

**Response — 200 OK:** Array of listing objects.

---

### GET `/listings/{listing_id}`

**Description:** Get full details of a single listing by its ID.  
**Auth Required:** ❌ No

**Path Parameters:**
| Param | Type | Description |
|---|---|---|
| `listing_id` | string (UUID) | The listing's ID |

**Response — 200 OK:** Single listing object.

**Error Responses:**
| Status | Description |
|---|---|
| `404 Not Found` | Listing does not exist |

---

### PATCH `/listings/{listing_id}`

**Description:** Update your own listing (quantity, price, availability, status).  
**Auth Required:** ✅ Yes (must be the listing owner)

**Path Parameters:**

| Param        | Type          | Description      |
| ------------ | ------------- | ---------------- |
| `listing_id` | string (UUID) | The listing's ID |

**Request Body (all fields optional):**

```json
{
  "quantity_qtl": 150.0,
  "price_per_qtl": 1700.0,
  "available_until": "2026-05-01",
  "status": "sold"
}
```

**Response — 200 OK:** Updated listing object.

**Error Responses:**
| Status | Description |
|---|---|
| `401 Unauthorized` | Not authenticated |
| `403 Forbidden` | Not your listing |
| `404 Not Found` | Listing not found |

---

### DELETE `/listings/{listing_id}`

**Description:** Soft-deletes (expires) your listing and removes it from the AI search index.  
**Auth Required:** ✅ Yes (listing owner only)

**Path Parameters:**
| Param | Type | Description |
|---|---|---|
| `listing_id` | string (UUID) | The listing's ID |

**Response — 204 No Content** (empty body)

**Error Responses:**
| Status | Description |
|---|---|
| `403 Forbidden` | Not your listing |
| `404 Not Found` | Listing not found |

---

## 3. Buy Requests

Buyers post what produce they are looking for.

### POST `/buy-requests`

**Description:** Post a new buy request. Only buyers can use this endpoint.  
**Auth Required:** ✅ Yes (role must be `buyer` or `both`)

**Request Body:**

```json
{
  "commodity": "Wheat",
  "variety": "Sharbati",
  "quantity_needed_qtl": 500.0,
  "max_price_per_qtl": 2200.0,
  "delivery_state": "Delhi",
  "delivery_district": "New Delhi"
}
```

| Field                 | Type   | Required | Notes                                     |
| --------------------- | ------ | -------- | ----------------------------------------- |
| `commodity`           | string | ✅       |                                           |
| `variety`             | string | ❌       |                                           |
| `quantity_needed_qtl` | float  | ✅       | Required quantity in quintals             |
| `max_price_per_qtl`   | float  | ❌       | Maximum price willing to pay              |
| `delivery_state`      | string | ❌       | Falls back to buyer's registered state    |
| `delivery_district`   | string | ❌       | Falls back to buyer's registered district |

**Response — 201 Created:**

```json
{
  "id": "br-uuid-...",
  "buyer_id": "usr-uuid-...",
  "commodity": "Wheat",
  "variety": "Sharbati",
  "quantity_needed_qtl": 500.0,
  "max_price_per_qtl": 2200.0,
  "delivery_state": "Delhi",
  "delivery_district": "New Delhi",
  "status": "open",
  "created_at": "2026-03-07T10:30:00",
  "buyer_name": "Rahul Sharma"
}
```

**Error Responses:**
| Status | Description |
|---|---|
| `403 Forbidden` | User role is not `buyer` or `both` |

---

### GET `/buy-requests/mine`

**Description:** Returns all buy requests created by the logged-in buyer.  
**Auth Required:** ✅ Yes

**Response — 200 OK:** Array of buy request objects.

---

### DELETE `/buy-requests/{request_id}`

**Description:** Cancel a buy request (sets status to `cancelled`).  
**Auth Required:** ✅ Yes (must be the request owner)

**Path Parameters:**
| Param | Type | Description |
|---|---|---|
| `request_id` | string (UUID) | Buy request ID |

**Response — 204 No Content**

**Error Responses:**
| Status | Description |
|---|---|
| `403 Forbidden` | Not your request |
| `404 Not Found` | Request not found |

---

## 4. Ranking (AI-Powered Search)

> These endpoints are the core intelligence of the platform. They use Gemini AI embeddings + ChromaDB vector search. Response times may be 1–5 seconds on first request due to AI embedding generation.

### GET `/rank/sellers`

**Description:** The main buyer search. Takes a free-text query, converts it to an AI embedding, then finds the most semantically matching active listings. Each result is enriched with:

- **Mandi price benchmark** — government wholesale price comparison
- **Distance** — km between buyer's district and seller's district
- **Seller rating** — average star rating from past transactions

**Auth Required:** ❌ No

**Query Parameters:**
| Param | Type | Required | Description |
|---|---|---|---|
| `q` | string | ✅ | Free text search, e.g. `"200 quintal red onion from Maharashtra"` |
| `buyer_district` | string | ❌ | Buyer's district for distance calculation, e.g. `"Pune"` |
| `limit` | int | ❌ | 1–50, default `10` |

**Example Request:**

```
GET /rank/sellers?q=Fresh onion 200 quintal from Maharashtra&buyer_district=Pune&limit=5
```

**Response — 200 OK:**

```json
{
  "query": "Fresh onion 200 quintal from Maharashtra",
  "total": 3,
  "results": [
    {
      "score": 0.92,
      "id": "lst-uuid-...",
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
  ]
}
```

**Response Field Glossary:**
| Field | Description |
|---|---|
| `score` | AI similarity score (0–1). Higher = better match |
| `mandi_modal_price` | Government wholesale modal price in ₹/quintal. `null` if unavailable |
| `price_vs_market` | `fair_price` (within ±15%), `above_market` (>+15%), `below_market` (<-15%), `unknown` |
| `distance_km` | Distance in km from buyer's district to seller's district. `null` if `buyer_district` not set |
| `seller_rating` | Average star rating (1.0–5.0), `0.0` if no ratings yet |
| `seller_rating_count` | Total number of ratings received |

**Error Responses:**
| Status | Description |
|---|---|
| `502 Bad Gateway` | Gemini AI embedding service unavailable |

---

### GET `/rank/buyers-for-listing/{listing_id}`

**Description:** Given a farmer's listing ID, finds the best-matched buyers from the platform whose profiles indicate they want what the farmer is selling.  
**Auth Required:** ❌ No

**Path Parameters:**
| Param | Type | Description |
|---|---|---|
| `listing_id` | string (UUID) | ID of the farmer's listing |

**Query Parameters:**
| Param | Type | Default | Description |
|---|---|---|---|
| `limit` | int | `10` | 1–50 |

**Example Request:**

```
GET /rank/buyers-for-listing/lst-uuid-123?limit=5
```

**Response — 200 OK:**

```json
{
  "listing_id": "lst-uuid-123",
  "commodity": "Onion",
  "total": 2,
  "matched_buyers": [
    {
      "score": 0.88,
      "buyer_id": "usr-uuid-...",
      "name": "Rahul Sharma",
      "state": "Delhi",
      "district": "New Delhi",
      "distance_km": 1200.5,
      "primary_crops": "Onion,Potato",
      "phone": "9812345678",
      "is_verified": true
    }
  ]
}
```

**Error Responses:**
| Status | Description |
|---|---|
| `404 Not Found` | Listing does not exist |
| `502 Bad Gateway` | Gemini AI embedding service unavailable |

---

## 5. Ratings

### POST `/ratings/`

**Description:** Submit a star rating (1–5) for a farmer/user after a transaction. Each user can only rate another user once (subsequent submissions update the existing rating).  
**Auth Required:** ✅ Yes

**Request Body:**

```json
{
  "ratee_id": "usr-uuid-of-seller",
  "score": 4,
  "comment": "Good quality onions, delivered on time."
}
```

| Field      | Type          | Required | Notes                      |
| ---------- | ------------- | -------- | -------------------------- |
| `ratee_id` | string (UUID) | ✅       | ID of the user being rated |
| `score`    | integer       | ✅       | 1–5 stars                  |
| `comment`  | string        | ❌       | Optional review text       |

**Response — 201 Created:**

```json
{
  "id": "rat-uuid-...",
  "rater_id": "usr-uuid-of-me",
  "ratee_id": "usr-uuid-of-seller",
  "score": 4,
  "comment": "Good quality onions, delivered on time."
}
```

**Error Responses:**
| Status | Description |
|---|---|
| `400 Bad Request` | Cannot rate yourself |
| `404 Not Found` | User to rate not found |

---

### GET `/ratings/user/{user_id}`

**Description:** Get the aggregate star rating summary for any user.  
**Auth Required:** ❌ No

**Path Parameters:**
| Param | Type | Description |
|---|---|---|
| `user_id` | string (UUID) | The user to check ratings for |

**Response — 200 OK:**

```json
{
  "user_id": "usr-uuid-...",
  "average_score": 4.3,
  "total_ratings": 12
}
```

---

## 6. Mandi Prices (Government Data)

> All Mandi endpoints pull live data from the `data.gov.in` government API. Prices are in **₹ per quintal** (wholesale).

### GET `/api/v1/mandi/prices`

**Description:** Fetch commodity prices with optional filters.  
**Auth Required:** ❌ No

**Query Parameters:**
| Param | Type | Description |
|---|---|---|
| `state` | string | Filter by state name (title case), e.g. `Maharashtra` |
| `district` | string | Filter by district |
| `market` | string | Filter by mandi/market name |
| `commodity` | string | Filter by commodity, e.g. `Onion` |
| `variety` | string | Filter by variety |
| `limit` | int | 1–500, default `10` |
| `offset` | int | Pagination offset, default `0` |
| `sort_by` | string | One of: `state`, `district`, `market`, `commodity`, `variety`, `arrival_date`, `min_price`, `max_price`, `modal_price` |
| `sort_order` | string | `asc` or `desc` |

**Example Request:**

```
GET /api/v1/mandi/prices?commodity=Onion&state=Maharashtra&limit=5
```

**Response — 200 OK:**

```json
{
  "total": 142,
  "count": 5,
  "offset": 0,
  "limit": 5,
  "records": [
    {
      "state": "Maharashtra",
      "district": "Nashik",
      "market": "Lasalgaon",
      "commodity": "Onion",
      "variety": "Local",
      "grade": "FAQ",
      "arrival_date": "07/03/2026",
      "min_price": 1400.0,
      "max_price": 1900.0,
      "modal_price": 1650.0
    }
  ]
}
```

---

### GET `/api/v1/mandi/prices/commodity/{commodity}`

**Description:** All mandi prices for a specific commodity.  
**Auth Required:** ❌ No

**Path Parameters:**
| Param | Description |
|---|---|
| `commodity` | Commodity name, e.g. `Onion` |

**Query Parameters:** Same as `/prices` (minus `commodity`).

---

### GET `/api/v1/mandi/prices/state/{state}`

**Description:** All commodity prices within a specific state.  
**Auth Required:** ❌ No

**Path Parameters:**
| Param | Description |
|---|---|
| `state` | State name, title case, e.g. `Maharashtra` |

---

### GET `/api/v1/mandi/prices/state/{state}/district/{district}`

**Description:** Prices for a specific state+district combination.  
**Auth Required:** ❌ No

---

### GET `/api/v1/mandi/prices/market/{market}`

**Description:** All commodity prices for a specific mandi.  
**Auth Required:** ❌ No

**Path Parameters:**
| Param | Description |
|---|---|
| `market` | Market name, e.g. `Lasalgaon` |

---

### GET `/api/v1/mandi/commodities`

**Description:** Get a deduplicated list of all available commodity names. Use this to populate dropdowns.  
**Auth Required:** ❌ No

**Query Parameters:**
| Param | Description |
|---|---|
| `state` | Optionally filter commodities available in a specific state |

**Response — 200 OK:**

```json
{
  "field": "commodity",
  "count": 87,
  "values": ["Apple", "Bajra", "Banana", "Garlic", "Onion", "Potato", ...]
}
```

---

### GET `/api/v1/mandi/states`

**Description:** Get a sorted list of all state names in the dataset.  
**Auth Required:** ❌ No

**Response — 200 OK:**

```json
{
  "field": "state",
  "count": 28,
  "values": ["Andhra Pradesh", "Bihar", "Delhi", "Gujarat", "Maharashtra", ...]
}
```

---

### GET `/api/v1/mandi/markets`

**Description:** Get a sorted list of all mandi/market names. Optionally filter by state.  
**Auth Required:** ❌ No

**Query Parameters:**
| Param | Description |
|---|---|
| `state` | Optionally filter markets by state |

---

## Authentication Flow (Quick Reference)

```
1. Register   →  POST /auth/register  →  get { access_token, user }
2. Store token in localStorage / sessionStorage
3. All protected API calls:
     Authorization: Bearer <access_token>
4. Refresh profile  →  GET /auth/me
5. Login again      →  POST /auth/login (form-encoded)
```

## Common Error Response Format

All errors follow this structure:

```json
{
  "detail": "Human-readable error message"
}
```

## Status Codes Reference

| Code  | Meaning                                        |
| ----- | ---------------------------------------------- |
| `200` | OK                                             |
| `201` | Created                                        |
| `204` | No Content (DELETE success)                    |
| `400` | Bad Request                                    |
| `401` | Unauthorized — missing/invalid token           |
| `403` | Forbidden — correct token, wrong permissions   |
| `404` | Not Found                                      |
| `409` | Conflict (e.g. email already exists)           |
| `422` | Validation Error — request body is malformed   |
| `502` | Bad Gateway — external AI/Mandi API failure    |
| `503` | Service Unavailable — upstream API unreachable |
