# AgriNiti - Complete Setup Guide

This guide will help you set up the complete AgriNiti application with FastAPI backend, Supabase database, and React frontend.

## 🏗️ Architecture Overview

- **Backend**: FastAPI with Supabase PostgreSQL
- **Frontend**: React with TypeScript, TailwindCSS, Zustand
- **Authentication**: JWT tokens with bcrypt password hashing
- **Database**: Supabase with Row Level Security (RLS)

## 📋 Prerequisites

- Node.js 18+ and npm
- Python 3.8+
- Supabase account
- Git

## 🗄️ Project Structure

```
Ai for Bharat/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py          # FastAPI app entry point
│   │   ├── config.py        # Configuration settings
│   │   ├── database.py      # Supabase client setup
│   │   ├── models.py        # Pydantic models
│   │   ├── auth.py          # Authentication utilities
│   │   ├── services.py      # Business logic
│   │   └── routers/
│   │       ├── __init__.py
│   │       └── auth.py      # Auth endpoints
│   ├── requirements.txt
│   ├── .env.example
│   ├── supabase_schema.sql
│   ├── start.sh            # Linux/Mac startup script
│   └── start.bat           # Windows startup script
└── frontend/               # React frontend
    ├── src/
    │   ├── services/
    │   │   └── api.ts       # API client
    │   ├── store/
    │   │   ├── authStore.ts # Authentication state
    │   │   └── languageStore.ts
    │   ├── components/
    │   │   └── ProtectedRoute.tsx
    │   └── ...
    ├── package.json
    └── .env.example
```

## 🚀 Setup Instructions

### 1. Supabase Setup

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note your project URL and API keys

2. **Set up Database Schema**
   - Open the Supabase SQL Editor
   - Copy and run the SQL from `backend/supabase_schema.sql`
   - This creates users table with RLS policies

3. **Get Your Credentials**
   - Project URL: `https://your-project-id.supabase.co`
   - Anon Key: `eyJ...` (public key)
   - Service Key: `eyJ...` (secret key)

### 2. Backend Setup

1. **Navigate to Backend Directory**
   ```bash
   cd "d:\downloads\HACKATHONS\Ai for Bharat\backend"
   ```

2. **Create Environment File**
   ```bash
   copy .env.example .env
   ```

3. **Configure Environment Variables**
   Edit `.env` and add your Supabase credentials:
   ```env
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_KEY=your_anon_key
   SUPABASE_SERVICE_KEY=your_service_key
   SECRET_KEY=your_super_secret_key_here
   ```

4. **Start the Backend**
   - **Windows**: Run `start.bat`
   - **Linux/Mac**: Run `chmod +x start.sh && ./start.sh`

5. **Verify Backend is Running**
   - Visit `http://ai-bharath.us-east-1.elasticbeanstalk.com`
   - Check `http://ai-bharath.us-east-1.elasticbeanstalk.com/docs` for API documentation
   - Test `http://ai-bharath.us-east-1.elasticbeanstalk.com/health`

### 3. Frontend Setup

1. **Navigate to Frontend Directory**
   ```bash
   cd "d:\downloads\HACKATHONS\Ai for Bharat\frontend"
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Create Environment File**
   ```bash
   copy .env.example .env
   ```

4. **Configure Frontend**
   Edit `.env`:
   ```env
   VITE_API_BASE_URL=http://ai-bharath.us-east-1.elasticbeanstalk.com
   ```

5. **Start the Frontend**
   ```bash
   npm run dev
   ```

6. **Access the Application**
   - Frontend: `http://localhost:5173`
   - Backend API: `http://ai-bharath.us-east-1.elasticbeanstalk.com`

## 🔐 Authentication Flow

1. **Registration**: Users can register with email and password
2. **Login**: JWT tokens are issued upon successful authentication
3. **Protected Routes**: All dashboard routes require authentication
4. **Token Management**: Tokens are stored in localStorage and auto-refreshed

## 📊 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/token` - Login and get access token
- `GET /auth/me` - Get current user info
- `PUT /auth/me` - Update user profile

### General
- `GET /` - Welcome message
- `GET /health` - Health check

## 🛠️ Development

### Backend Development
```bash
# Install new dependencies
pip install package_name

# Run with auto-reload
uvicorn app.main:app --reload

# View logs
tail -f logs/app.log
```

### Frontend Development
```bash
# Install new dependencies
npm install package_name

# Run development server
npm run dev

# Build for production
npm run build

# Lint code
npm run lint
```

## 🔒 Security Features

- **Password Hashing**: bcrypt for secure password storage
- **JWT Authentication**: Stateless token-based auth
- **CORS Protection**: Configured for frontend origin
- **Row Level Security**: Database-level access control
- **Input Validation**: Pydantic models for request validation

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure backend CORS origins include your frontend URL
   - Check that API_BASE_URL is correct in frontend .env

2. **Database Connection**
   - Verify Supabase credentials are correct
   - Check that database schema is applied

3. **Authentication Issues**
   - Clear browser localStorage if tokens are corrupted
   - Check backend logs for authentication errors

4. **Port Conflicts**
   - Change ports if 8000 or 5173 are in use
   - Update environment variables accordingly

## 📚 Next Steps

1. **Add More Features**
   - User profiles with farm information
   - Market data integration
   - Weather API integration
   - Government schemes API

2. **Enhance Security**
   - Rate limiting
   - Input sanitization
   - Audit logging

3. **Improve UX**
   - Loading states
   - Error boundaries
   - Offline support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
