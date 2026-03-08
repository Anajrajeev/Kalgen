# AgriNiti - AI-Powered Agricultural Platform

A comprehensive web-based agricultural decision support and trusted trading platform that connects farmers with buyers, provides AI-powered crop intelligence, and offers complete logistics management solutions.

## 🌟 Features

### 🤖 AI-Powered Crop Intelligence
- **Multimodal Interaction**: Voice, text, and image inputs for comprehensive farm analysis
- **Disease Detection**: Automated identification of crop diseases through image recognition
- **Soil Analysis**: AI-driven soil health assessment and recommendations
- **Predictive Models**: Weather and yield predictions for better planning
- **Personalized Recommendations**: Tailored advice based on crop and location

### 🌾 Complete Marketplace
- **Live Market Prices**: Real-time crop prices with search and filtering
- **Produce Listing**: Easy listing of agricultural produce with quantity and pricing
- **Browse Sellers**: Connect with verified sellers across India
- **Trust-Based System**: Seller ratings, verification, and quality indicators
- **Direct Messaging**: Built-in chat system for buyer-seller communication

### 🚚 Business Assistance & Logistics
- **Shipment Tracking**: Real-time tracking of agricultural shipments
- **Transport Booking**: Book transportation with budget and route planning
- **Warehouse Management**: Find and book warehouse space for storage
- **Route Optimization**: Smart logistics planning for cost efficiency

### 🌍 Multilingual Support
- **English, Hindi, Marathi**: Complete platform localization
- **Real-time Translation**: Seamless communication across languages
- **Localized Content**: Region-specific agricultural information

### 📊 Dashboard & Analytics
- **Unified Farm Intelligence**: Comprehensive overview of farm operations
- **Weather Integration**: Real-time weather data and forecasts
- **Market Trends**: Price trends and market analysis
- **Actionable Insights**: Data-driven recommendations for farmers

## 🏗️ Architecture

### Frontend (React + TypeScript)
- **Vite** for fast development and building
- **Tailwind CSS** for responsive, modern UI
- **Lucide React** for consistent iconography
- **Zustand** for state management
- **React Router** for navigation

### Backend (FastAPI + Python)
- **FastAPI** for high-performance API development
- **Supabase** for database and authentication
- **Pydantic** for data validation
- **JWT** for secure authentication

### Key Components
- **Authentication System**: Secure login/registration with role-based access
- **Real-time Chat**: WebSocket-based messaging system
- **File Upload**: Image processing for crop analysis
- **API Integration**: RESTful APIs for all platform features

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- Python (v3.8 or higher)
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Anajrajeev/Kalgen.git
   cd Kalgen
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Backend Setup**
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

4. **Environment Configuration**
   - Copy `.env.example` to `.env` in both frontend and backend
   - Configure Supabase credentials
   - Set up API keys for external services

### 🌐 Access the Application
- **Production Frontend**: [https://agriniti.vercel.app](https://agriniti.vercel.app)
- **Production Backend API**: [http://ai-bharath.us-east-1.elasticbeanstalk.com](http://ai-bharath.us-east-1.elasticbeanstalk.com)
- **API Documentation**: [http://ai-bharath.us-east-1.elasticbeanstalk.com/docs](http://ai-bharath.us-east-1.elasticbeanstalk.com/docs)
- **Local Frontend**: http://localhost:5173
- **Local Backend**: http://localhost:8000

> **Note**: The frontend uses a secure proxy (`/api-proxy`) to communicate with the AWS backend to resolve Mixed Content and SSL constraints.

## 📱 Platform Pages

### Core Features
- **Dashboard**: Unified farm intelligence overview
- **Marketplace**: Complete trading platform
- **Crop Analysis**: AI-powered agricultural insights
- **Business Assistance**: Logistics and supply chain management

### User Management
- **Authentication**: Secure login/registration
- **Profile Management**: User settings and preferences
- **Multi-language Support**: English, Hindi, Marathi

### Trading & Commerce
- **List Produce**: Easy produce listing with details
- **Browse Produce**: Search and filter available produce
- **Direct Messaging**: Chat with buyers and sellers
- **Negotiation**: Built-in negotiation tools

## 🔧 Technology Stack

### Frontend Technologies
- **React 18** with TypeScript
- **Vite** for development tooling
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Zustand** for state management

### Backend Technologies
- **FastAPI** with Python
- **Supabase** for database and auth
- **Pydantic** for data validation
- **Uvicorn** for ASGI server

### Development Tools
- **ESLint** for code quality
- **Prettier** for code formatting
- **Git** for version control

## 🎯 Key Features Implemented

### ✅ Authentication & Authorization
- Multi-language login interface
- Secure JWT-based authentication
- Role-based access control

### ✅ AI-Powered Features
- Chat-based AI assistant
- Image upload and analysis
- Voice query support
- Contextual AI responses

### ✅ Complete Marketplace
- Live market price tracking
- Produce listing and browsing
- Seller verification system
- Direct messaging platform

### ✅ Logistics Management
- Shipment tracking interface
- Transport booking system
- Warehouse search and booking
- Route planning tools

### ✅ Responsive Design
- Mobile-first approach
- Cross-platform compatibility
- Accessibility features
- Modern UI/UX patterns

## 📸 Platform Screenshots

### Dashboard
- Unified farm intelligence overview
- Weather widget integration
- Quick action buttons
- AI chat interface

### Marketplace
- Live market prices with search
- Produce listing cards
- Seller profiles with ratings
- Business assistance integration

### Crop Analysis
- AI-powered insights
- Disease detection features
- Soil analysis tools
- Predictive models

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **AWS AI for Bharat Hackathon** - Platform developed for the hackathon
- **Supabase** - Database and authentication services
- **FastAPI** - Backend framework
- **React Community** - Frontend ecosystem

## 📞 Contact

- **Repository**: https://github.com/Anajrajeev/Kalgen
- **Hackathon**: AWS AI for Bharat

---

## 🚀 Future Enhancements

### Planned Features
- **Mobile App**: Native iOS and Android applications
- **IoT Integration**: Sensor data from smart farming devices
- **Blockchain**: Supply chain transparency and traceability
- **Advanced AI**: Machine learning models for yield prediction
- **Payment Integration**: Secure payment processing for transactions

### Scalability
- **Cloud Deployment**: AWS/Azure cloud infrastructure
- **Microservices**: Service-oriented architecture
- **Load Balancing**: High availability and performance
- **Data Analytics**: Advanced analytics and reporting

---

**AgriNiti** - Empowering farmers with AI technology and trusted marketplace connections. 🌾🤖