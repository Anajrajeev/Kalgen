"""
Weather API Router
Provides real-time weather, rain forecast, and yield prediction endpoints
"""

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from pydantic import BaseModel
import math

from app.services.weather_service import weather_service, WeatherData, RainForecast, YieldPrediction, WeeklyForecast

router = APIRouter(prefix="/weather", tags=["weather"])

# Response Models
class CurrentWeatherResponse(BaseModel):
    success: bool
    data: Optional[WeatherData] = None
    error: Optional[str] = None
    timestamp: datetime

class RainForecastResponse(BaseModel):
    success: bool
    data: List[RainForecast]
    location: str
    days: int
    timestamp: datetime

class YieldPredictionResponse(BaseModel):
    success: bool
    data: Optional[YieldPrediction] = None
    error: Optional[str] = None
    timestamp: datetime

class WeeklyForecastResponse(BaseModel):
    success: bool
    data: List[WeeklyForecast]
    location: str
    total_weeks: int
    timestamp: datetime

class WeatherStatsResponse(BaseModel):
    success: bool
    data: Dict[str, Any]
    timestamp: datetime

@router.get("/current", response_model=CurrentWeatherResponse)
async def get_current_weather(
    location: str = Query(default="Bangalore,IN", description="Location for weather data")
):
    """
    Get current weather conditions for a specified location
    
    - **location**: City name with country code (e.g., "Bangalore,IN")
    - Returns: Temperature, humidity, pressure, wind, precipitation, etc.
    """
    try:
        weather_data = await weather_service.get_current_weather(location)
        
        return CurrentWeatherResponse(
            success=True,
            data=weather_data,
            timestamp=datetime.now()
        )
    except Exception as e:
        return CurrentWeatherResponse(
            success=False,
            error=str(e),
            timestamp=datetime.now()
        )

@router.get("/rain-forecast", response_model=RainForecastResponse)
async def get_rain_forecast(
    location: str = Query(default="Bangalore,IN", description="Location for rain forecast"),
    days: int = Query(default=7, ge=1, le=14, description="Number of forecast days")
):
    """
    Get rain forecast for the next N days
    
    - **location**: City name with country code
    - **days**: Number of days to forecast (1-14)
    - Returns: Daily precipitation probability, amount, and intensity
    """
    try:
        forecast_data = await weather_service.get_rain_forecast(location, days)
        
        return RainForecastResponse(
            success=True,
            data=forecast_data,
            location=location,
            days=days,
            timestamp=datetime.now()
        )
    except Exception as e:
        return RainForecastResponse(
            success=False,
            data=[],
            location=location,
            days=days,
            error=str(e),
            timestamp=datetime.now()
        )

@router.get("/yield-prediction", response_model=YieldPredictionResponse)
async def get_yield_prediction(
    crop_type: str = Query(default="rice", description="Crop type for yield prediction"),
    region: str = Query(default="Karnataka", description="Region for yield prediction"),
    season: str = Query(default="kharif", description="Growing season")
):
    """
    Get yield prediction based on current weather conditions
    
    - **crop_type**: Type of crop (rice, wheat, maize, cotton, sugarcane, pulses)
    - **region**: Agricultural region
    - **season**: Growing season (kharif, rabi, zaid)
    - Returns: Predicted yield in tonnes/hectare with confidence score
    """
    try:
        yield_data = await weather_service.get_yield_prediction(crop_type, region, season)
        
        return YieldPredictionResponse(
            success=True,
            data=yield_data,
            timestamp=datetime.now()
        )
    except Exception as e:
        return YieldPredictionResponse(
            success=False,
            error=str(e),
            timestamp=datetime.now()
        )

@router.get("/weekly-forecast", response_model=WeeklyForecastResponse)
async def get_weekly_forecast(
    location: str = Query(default="Bangalore,IN", description="Location for weekly forecast"),
    weeks: int = Query(default=52, ge=1, le=52, description="Number of weeks to forecast")
):
    """
    Get comprehensive weekly forecast for the entire year
    
    - **location**: City name with country code
    - **weeks**: Number of weeks to forecast (1-52)
    - Returns: Weekly weather patterns, rain forecasts, and temperature trends
    """
    try:
        weekly_data = await weather_service.get_weekly_forecasts(location, weeks)
        
        return WeeklyForecastResponse(
            success=True,
            data=weekly_data,
            location=location,
            total_weeks=weeks,
            timestamp=datetime.now()
        )
    except Exception as e:
        return WeeklyForecastResponse(
            success=False,
            data=[],
            location=location,
            total_weeks=weeks,
            error=str(e),
            timestamp=datetime.now()
        )

@router.get("/rain-heatmap", response_model=WeatherStatsResponse)
async def get_rain_heatmap(
    location: str = Query(default="Bangalore,IN", description="Location for heatmap data"),
    year: int = Query(default=2026, description="Year for heatmap")
):
    """
    Get rain intensity heatmap data for visualization
    
    - **location**: City name with country code
    - **year**: Year for the heatmap data
    - Returns: Weekly rain intensity data for heatmap visualization
    """
    try:
        # Get 52 weeks of data for the year
        weekly_data = await weather_service.get_weekly_forecasts(location, 52)
        
        # Format for heatmap visualization
        heatmap_data = {
            'weeks': [week.week for week in weekly_data],
            'months': [week.month for week in weekly_data],
            'intensities': [
                {
                    'week': week.week,
                    'month': week.month,
                    'intensity': week.rain_forecast.rain_intensity,
                    'precipitation': week.rain_forecast.precipitation_amount,
                    'probability': week.rain_forecast.precipitation_probability,
                    'temperature_avg': week.temperature_avg
                }
                for week in weekly_data
            ],
            'stats': {
                'high_rain_weeks': len([w for w in weekly_data if w.rain_forecast.rain_intensity == 'High Rain']),
                'medium_rain_weeks': len([w for w in weekly_data if w.rain_forecast.rain_intensity == 'Medium Rain']),
                'low_rain_weeks': len([w for w in weekly_data if w.rain_forecast.rain_intensity == 'Low Rain']),
                'dry_weeks': len([w for w in weekly_data if w.rain_forecast.rain_intensity == 'No Rain']),
                'total_precipitation': sum(w.rain_forecast.precipitation_amount for w in weekly_data),
                'peak_season': {
                    'start_week': 21,  # June
                    'end_week': 33,     # August
                    'description': 'Monsoon Season'
                }
            }
        }
        
        return WeatherStatsResponse(
            success=True,
            data=heatmap_data,
            timestamp=datetime.now()
        )
    except Exception as e:
        return WeatherStatsResponse(
            success=False,
            data={},
            error=str(e),
            timestamp=datetime.now()
        )

@router.get("/temperature-forecast", response_model=WeatherStatsResponse)
async def get_temperature_forecast(
    location: str = Query(default="Bangalore,IN", description="Location for temperature forecast"),
    days: int = Query(default=30, ge=1, le=30, description="Number of days to forecast")
):
    """
    Get temperature forecast with trends
    
    - **location**: City name with country code
    - **days**: Number of days to forecast (1-30)
    - Returns: Daily temperature forecasts with trend analysis
    """
    try:
        # Get weekly forecast and interpolate to daily
        weekly_data = await weather_service.get_weekly_forecasts(location, min(52, days // 7 + 1))
        
        # Ensure we have weekly data, if not generate fallback data
        if not weekly_data:
            weekly_data = await weather_service.get_weekly_forecasts(location, 4)
        
        # Generate daily temperature data
        daily_temps = []
        base_date = datetime.now()
        
        for i in range(days):
            date = base_date + timedelta(days=i)
            
            # Find corresponding week
            week_num = date.isocalendar()[1]
            # Use modulo to wrap around weeks and always find a match
            week_index = (week_num - 1) % len(weekly_data)
            week_data = weekly_data[week_index]
            
            # Add daily variation
            base_temp = week_data.temperature_avg
            daily_variation = 5 * math.sin(i * 0.3)  # Daily temperature fluctuation
            
            daily_temps.append({
                'date': date.strftime('%Y-%m-%d'),
                'temperature': base_temp + daily_variation,
                'min_temp': base_temp - 3 + daily_variation * 0.5,
                'max_temp': base_temp + 3 + daily_variation * 0.5,
                'week': week_num,
                'month': date.strftime('%b')
            })
        
        # Calculate statistics
        temps = [d['temperature'] for d in daily_temps]
        stats = {
            'daily_forecast': daily_temps,
            'statistics': {
                'avg_temperature': sum(temps) / len(temps),
                'min_temperature': min(temps),
                'max_temperature': max(temps),
                'temperature_range': max(temps) - min(temps),
                'trend': 'increasing' if temps[-1] > temps[0] else 'decreasing'
            },
            'heatwaves': [
                d for d in daily_temps 
                if d['max_temp'] > 40  # Heatwave threshold
            ],
            'comfort_days': [
                d for d in daily_temps 
                if 20 <= d['temperature'] <= 30  # Comfortable temperature range
            ]
        }
        
        return WeatherStatsResponse(
            success=True,
            data=stats,
            timestamp=datetime.now()
        )
    except Exception as e:
        return WeatherStatsResponse(
            success=False,
            data={},
            error=str(e),
            timestamp=datetime.now()
        )

@router.get("/yield-analysis", response_model=WeatherStatsResponse)
async def get_yield_analysis(
    region: str = Query(default="Karnataka", description="Region for analysis"),
    season: str = Query(default="kharif", description="Growing season")
):
    """
    Get comprehensive yield analysis for multiple crops
    
    - **region**: Agricultural region
    - **season**: Growing season
    - Returns: Yield predictions for multiple crops with comparative analysis
    """
    try:
        crops = ['rice', 'wheat', 'maize', 'cotton', 'sugarcane', 'pulses']
        crop_predictions = []
        
        for crop in crops:
            prediction = await weather_service.get_yield_prediction(crop, region, season)
            crop_predictions.append({
                'crop': crop,
                'yield': prediction.predicted_yield,
                'confidence': prediction.confidence_score,
                'factors': prediction.factors
            })
        
        # Sort by yield
        crop_predictions.sort(key=lambda x: x['yield'], reverse=True)
        
        analysis = {
            'region': region,
            'season': season,
            'crop_predictions': crop_predictions,
            'best_performing': crop_predictions[0] if crop_predictions else None,
            'total_estimated_yield': sum(p['yield'] for p in crop_predictions),
            'average_confidence': sum(p['confidence'] for p in crop_predictions) / len(crop_predictions) if crop_predictions else 0,
            'recommendations': [
                f"Focus on {crop_predictions[0]['crop']} for highest yield potential" if crop_predictions else "No data available",
                f"Consider intercropping with {crop_predictions[-1]['crop']} for risk mitigation" if len(crop_predictions) > 1 else "",
                f"Current weather conditions favor {season} season crops"
            ],
            'risk_factors': [
                "Monsoon variability",
                "Temperature fluctuations", 
                "Pest and disease pressure",
                "Water availability"
            ]
        }
        
        return WeatherStatsResponse(
            success=True,
            data=analysis,
            timestamp=datetime.now()
        )
    except Exception as e:
        return WeatherStatsResponse(
            success=False,
            data={},
            error=str(e),
            timestamp=datetime.now()
        )

@router.get("/service-status", response_model=Dict[str, Any])
async def get_weather_service_status():
    """
    Get weather service status and configuration
    """
    return {
        "service": "weather",
        "status": "operational",
        "apis_configured": {
            "openweathermap": bool(weather_service.openweather_api_key),
            "weatherapi": bool(weather_service.weatherapi_key),
            "agrimonitor": False  # Not implemented yet
        },
        "cache_status": {
            "cached_items": len(weather_service.cache),
            "cache_duration": weather_service.cache_duration
        },
        "supported_locations": [
            "Bangalore,IN",
            "Delhi,IN", 
            "Mumbai,IN",
            "Kolkata,IN",
            "Chennai,IN",
            "Pune,IN",
            "Hyderabad,IN"
        ],
        "supported_crops": [
            "rice", "wheat", "maize", "cotton", "sugarcane", "pulses"
        ],
        "supported_regions": [
            "Karnataka", "Punjab", "Uttar Pradesh", 
            "Maharashtra", "West Bengal"
        ],
        "timestamp": datetime.now().isoformat()
    }
