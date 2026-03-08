# AgriNiti Backend API

FastAPI backend for AgriNiti agricultural platform with Supabase integration.

## Setup Instructions

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Environment Configuration
1. Copy `.env.example` to `.env`
2. Fill in your Supabase credentials:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_KEY`: Your Supabase anon key
   - `SUPABASE_SERVICE_KEY`: Your Supabase service key
   - `SECRET_KEY`: Generate a secure secret key for JWT

### 3. Supabase Setup
1. Create a new Supabase project
2. Run the `supabase_schema.sql` in your Supabase SQL editor
3. Enable the necessary extensions and configure RLS policies

### 4. Run the Application
```bash
# Development mode
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Production mode
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/token` - Login and get access token
- `GET /auth/me` - Get current user info (requires auth)
- `PUT /auth/me` - Update current user info (requires auth)

### General
- `GET /` - Welcome message
- `GET /health` - Health check endpoint

## API Documentation
Once running, visit `http://ai-bharath.us-east-1.elasticbeanstalk.com/docs` for interactive API documentation.

## Features
- JWT authentication
- Password hashing with bcrypt
- CORS configuration
- Supabase database integration
- User management
- Row Level Security (RLS)
