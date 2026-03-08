# 🌤️ Real-Time Weather API Integration

## Overview

This document explains the real-time weather, rain forecast, and yield prediction API integration for the AgriNiti agricultural platform. The system provides live weather data from multiple sources and AI-powered agricultural insights.

## 🚀 Features Implemented

### **Core Capabilities**
- **Real-time Weather Data** - Current temperature, humidity, pressure, wind, precipitation
- **Rain Forecasting** - 7-14 day precipitation predictions with intensity levels
- **Temperature Forecasting** - 30-day temperature trends and heatwave alerts
- **Yield Prediction** - AI-powered crop yield estimates based on weather patterns
- **Weekly Forecasts** - 52-week agricultural planning data
- **Heatmap Visualization** - Rain intensity patterns for the entire year

### **Data Sources**
- **OpenWeatherMap API** - Primary weather data source
- **WeatherAPI** - Detailed forecast data
- **Agricultural Models** - Crop yield prediction algorithms
- **Indian Monsoon Patterns** - Regional weather pattern modeling

---

## 📁 Files Created/Modified

### **Backend Files**
```
backend/
├── app/services/weather_service.py          # Core weather data service
├── app/routers/weather.py                   # FastAPI weather endpoints
├── app/main.py                             # Added weather router
└── test_weather_apis.py                    # API testing script
```

### **Frontend Files**
```
frontend/
├── src/services/weatherService.ts           # Frontend weather API client
└── src/pages/RainForecastPage.tsx          # Updated with real-time data
```

---

## 🔧 Technical Architecture

### **Weather Data Pipeline**
1. **API Integration** → OpenWeatherMap, WeatherAPI
2. **Data Processing** → Format and validate weather data
3. **Agricultural Modeling** → Crop yield predictions
4. **Caching Layer** → 5-minute cache for performance
5. **Real-time Updates** → Live weather data streaming

### **API Endpoints**

#### **Weather Data**
```
GET /weather/current?location=Bangalore,IN
GET /weather/rain-forecast?location=Bangalore,IN&days=7
GET /weather/temperature-forecast?location=Bangalore,IN&days=30
```

#### **Agricultural Analysis**
```
GET /weather/yield-prediction?crop_type=rice&region=Karnataka&season=kharif
GET /weather/yield-analysis?region=Karnataka&season=kharif
```

#### **Planning Tools**
```
GET /weather/weekly-forecast?location=Bangalore,IN&weeks=52
GET /weather/rain-heatmap?location=Bangalore,IN&year=2026
GET /weather/service-status
```

---

## 🌍 Supported Locations

### **Primary Regions**
- **Bangalore, IN** - Default location (Karnataka)
- **Delhi, IN** - North India
- **Mumbai, IN** - West India
- **Kolkata, IN** - East India
- **Chennai, IN** - South India

### **Agricultural Regions**
- **Karnataka** - Rice, sugarcane, pulses
- **Punjab** - Wheat, rice, cotton
- **Uttar Pradesh** - Wheat, sugarcane, pulses
- **Maharashtra** - Cotton, sugarcane, pulses
- **West Bengal** - Rice, jute, tea

---

## 🌾 Crop Support

### **Supported Crops**
- **Rice** - Kharif season, 4.5 T/ha baseline
- **Wheat** - Rabi season, 3.2 T/ha baseline
- **Maize** - Kharif season, 5.8 T/ha baseline
- **Cotton** - Kharif season, 2.1 T/ha baseline
- **Sugarcane** - Year-round, 75 T/ha baseline
- **Pulses** - Multiple seasons, 1.8 T/ha baseline

### **Yield Prediction Factors**
- **Temperature Impact** - Optimal ranges for each crop
- **Rainfall Analysis** - Water availability and timing
- **Humidity Effects** - Disease risk and growth conditions
- **Regional Factors** - Soil quality and climate zones
- **Seasonal Patterns** - Monsoon and harvest timing

---

## 🧪 Testing

### **API Testing Script**
```bash
cd backend
python test_weather_apis.py
```

### **Test Coverage**
1. **Service Status** - API configuration and cache status
2. **Current Weather** - Real-time weather data retrieval
3. **Rain Forecast** - 7-day precipitation predictions
4. **Weekly Forecast** - 52-week agricultural planning
5. **Yield Prediction** - Crop-specific yield estimates
6. **Rain Heatmap** - Visual rain intensity data
7. **Temperature Forecast** - 30-day temperature trends
8. **Yield Analysis** - Multi-crop comparative analysis

---

## 🔧 Configuration

### **Environment Variables**
```bash
# Weather API Keys (Optional - will use mock data if not provided)
OPENWEATHER_API_KEY=your_openweather_key
WEATHERAPI_KEY=your_weatherapi_key

# Frontend Configuration
VITE_API_BASE_URL=http://localhost:8000
```

### **API Key Setup**
1. **OpenWeatherMap** - Register at https://openweathermap.org/api
2. **WeatherAPI** - Register at https://www.weatherapi.com/
3. **Add keys** to environment or backend settings

### **Fallback Behavior**
- **No API Keys** → Uses realistic mock data
- **API Failures** → Graceful degradation to mock data
- **Network Issues** → Cached data with error indicators

---

## 📊 Data Models

### **Weather Data**
```typescript
interface WeatherData {
  timestamp: string;
  temperature: number;        // Celsius
  humidity: number;           // Percentage
  pressure: number;           // hPa
  wind_speed: number;         // m/s
  wind_direction: number;     // Degrees
  precipitation: number;      // mm
  weather_condition: string;  // Description
  visibility: number;        // km
  uv_index?: number;         // UV index
}
```

### **Rain Forecast**
```typescript
interface RainForecast {
  date: string;
  precipitation_probability: number;  // 0-100%
  precipitation_amount: number;        // mm
  rain_intensity: 'No Rain' | 'Low Rain' | 'Medium Rain' | 'High Rain';
  temperature_min: number;            // Celsius
  temperature_max: number;            // Celsius
  humidity: number;                    // Percentage
}
```

### **Yield Prediction**
```typescript
interface YieldPrediction {
  crop_type: string;
  region: string;
  predicted_yield: number;    // tonnes/hectare
  confidence_score: number;   // 0-100%
  factors: Record<string, any>;
  season: string;
}
```

---

## 🚀 Getting Started

### **1. Start Backend**
```bash
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### **2. Start Frontend**
```bash
cd frontend
npm run dev
```

### **3. Test APIs**
```bash
cd backend
python test_weather_apis.py
```

### **4. Access Application**
- **Rain Forecast**: http://localhost:3000/rain-forecast
- **Weather APIs**: http://localhost:8000/docs

---

## 📈 Performance Features

### **Caching Strategy**
- **5-minute cache** for current weather data
- **1-hour cache** for yield predictions
- **52-week cache** for annual forecasts
- **Automatic cache invalidation** on data updates

### **Data Optimization**
- **Batch API calls** for multiple data points
- **Compressed responses** for faster loading
- **Lazy loading** for detailed forecasts
- **Error handling** with graceful fallbacks

### **Real-time Updates**
- **Live weather data** refreshed every 5 minutes
- **Dynamic forecasts** based on current conditions
- **Alert system** for weather changes
- **Mobile-responsive** design for field access

---

## 🎯 Agricultural Benefits

### **For Farmers**
- **Accurate Planning** - 52-week weather outlook for crop planning
- **Risk Management** - Early warnings for extreme weather
- **Yield Optimization** - AI-powered crop recommendations
- **Resource Planning** - Irrigation and fertilizer timing

### **For Agricultural Advisors**
- **Data-Driven Insights** - Real-time weather patterns
- **Regional Analysis** - Location-specific recommendations
- **Crop Comparisons** - Multi-crop yield predictions
- **Seasonal Planning** - Kharif, Rabi, Zaid season guidance

---

## 🔮 Future Enhancements

### **Planned Features**
- **Soil Moisture Integration** - Real-time soil data
- **Pest Disease Alerts** - Weather-based disease predictions
- **Market Integration** - Weather-price correlations
- **Mobile App** - Field-accessible weather alerts
- **Satellite Data** - Enhanced weather accuracy

### **Data Sources**
- **Indian Meteorological Department** - Official weather data
- **Satellite Imagery** - Cloud cover and precipitation
- **Soil Sensors** - Ground-level weather data
- **IoT Integration** - Farm-level weather stations

---

## 🐛 Troubleshooting

### **Common Issues**
1. **API Key Errors** - Check environment variables
2. **Network Issues** - Verify internet connectivity
3. **Location Errors** - Use correct location format (City,Country)
4. **Cache Issues** - Restart backend to clear cache

### **Debug Tools**
- **Service Status**: `/weather/service-status`
- **API Documentation**: http://localhost:8000/docs
- **Test Script**: `python test_weather_apis.py`
- **Browser Console**: Check for frontend errors

---

## 📞 Support

For technical support:
1. Check API service status first
2. Review test script output
3. Verify API key configuration
4. Check network connectivity

---

**This real-time weather integration provides farmers with accurate, actionable weather insights for better agricultural decision-making! 🌾🌤️**
