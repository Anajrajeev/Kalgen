"""
Weather Service for Real-time Weather, Rain, and Yield Data
Integrates with OpenWeatherMap, WeatherAPI, and agricultural data sources
"""

import httpx
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from pydantic import BaseModel
from app.config import settings
import json
import math

# Models for weather data
class WeatherData(BaseModel):
    timestamp: datetime
    temperature: float
    humidity: int
    pressure: float
    wind_speed: float
    wind_direction: int
    precipitation: float
    weather_condition: str
    visibility: float
    uv_index: Optional[float] = None

class RainForecast(BaseModel):
    date: str
    precipitation_probability: int
    precipitation_amount: float
    rain_intensity: str  # 'No Rain', 'Low Rain', 'Medium Rain', 'High Rain'
    temperature_min: float
    temperature_max: float
    humidity: int

class YieldPrediction(BaseModel):
    crop_type: str
    region: str
    predicted_yield: float  # tonnes per hectare
    confidence_score: float
    factors: Dict[str, Any]
    season: str
    planting_date: Optional[str] = None
    harvest_date: Optional[str] = None

class WeeklyForecast(BaseModel):
    week: int
    month: str
    year: int
    weather_data: List[WeatherData]
    rain_forecast: RainForecast
    temperature_avg: float
    total_precipitation: float

class WeatherService:
    def __init__(self):
        self.openweather_api_key = getattr(settings, 'OPENWEATHER_API_KEY', None)
        self.weatherapi_key = getattr(settings, 'WEATHERAPI_KEY', None)
        self.base_urls = {
            'openweather': 'https://api.openweathermap.org/data/2.5',
            'weatherapi': 'https://api.weatherapi.com/v1',
            'agrimonitor': 'https://api.agrimonitor.com/v1'
        }
        self.cache = {}
        self.cache_duration = 300  # 5 minutes

    async def get_current_weather(self, location: str = "Bangalore,IN") -> WeatherData:
        """Get current weather data for a location"""
        cache_key = f"current_{location}"
        
        if cache_key in self.cache:
            cached_data, timestamp = self.cache[cache_key]
            if (datetime.now() - timestamp).seconds < self.cache_duration:
                return cached_data

        # Try OpenWeatherMap first
        weather_data = await self._get_openweather_current(location)
        
        # Cache the result
        self.cache[cache_key] = (weather_data, datetime.now())
        return weather_data

    async def _get_openweather_current(self, location: str) -> WeatherData:
        """Get current weather from OpenWeatherMap"""
        if not self.openweather_api_key:
            # Fallback to mock data for development
            return self._get_mock_current_weather()

        url = f"{self.base_urls['openweather']}/weather"
        params = {
            'q': location,
            'appid': self.openweather_api_key,
            'units': 'metric'
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()

                return WeatherData(
                    timestamp=datetime.now(),
                    temperature=data['main']['temp'],
                    humidity=data['main']['humidity'],
                    pressure=data['main']['pressure'],
                    wind_speed=data['wind']['speed'],
                    wind_direction=data['wind'].get('deg', 0),
                    precipitation=data.get('rain', {}).get('1h', 0),
                    weather_condition=data['weather'][0]['description'],
                    visibility=data.get('visibility', 10000) / 1000,  # Convert to km
                    uv_index=None
                )
            except Exception as e:
                print(f"Error fetching OpenWeatherMap data: {e}")
                return self._get_mock_current_weather()

    async def get_rain_forecast(self, location: str = "Bangalore,IN", days: int = 7) -> List[RainForecast]:
        """Get rain forecast for the next N days"""
        cache_key = f"rain_forecast_{location}_{days}"
        
        if cache_key in self.cache:
            cached_data, timestamp = self.cache[cache_key]
            if (datetime.now() - timestamp).seconds < self.cache_duration:
                return cached_data

        # Try WeatherAPI for detailed forecast
        forecast_data = await self._get_weatherapi_forecast(location, days)
        
        # Cache the result
        self.cache[cache_key] = (forecast_data, datetime.now())
        return forecast_data

    async def _get_weatherapi_forecast(self, location: str, days: int) -> List[RainForecast]:
        """Get forecast from WeatherAPI"""
        if not self.weatherapi_key:
            return self._get_mock_rain_forecast(days)

        url = f"{self.base_urls['weatherapi']}/forecast.json"
        params = {
            'key': self.weatherapi_key,
            'q': location,
            'days': min(days, 10),  # WeatherAPI limit
            'aqi': 'no',
            'alerts': 'no'
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()

                forecasts = []
                for day in data['forecast']['forecastday'][:days]:
                    day_data = day['day']
                    
                    # Determine rain intensity
                    precip_chance = day_data['daily_chance_of_rain']
                    precip_amount = day_data['totalprecip_mm']
                    
                    if precip_chance < 20:
                        intensity = 'No Rain'
                    elif precip_chance < 50:
                        intensity = 'Low Rain'
                    elif precip_chance < 80:
                        intensity = 'Medium Rain'
                    else:
                        intensity = 'High Rain'

                    forecasts.append(RainForecast(
                        date=day['date'],
                        precipitation_probability=precip_chance,
                        precipitation_amount=precip_amount,
                        rain_intensity=intensity,
                        temperature_min=day_data['mintemp_c'],
                        temperature_max=day_data['maxtemp_c'],
                        humidity=day_data['avghumidity']
                    ))
                
                return forecasts
            except Exception as e:
                print(f"Error fetching WeatherAPI forecast: {e}")
                return self._get_mock_rain_forecast(days)

    async def get_yield_prediction(self, 
                                  crop_type: str = "rice", 
                                  region: str = "Karnataka",
                                  season: str = "kharif") -> YieldPrediction:
        """Get yield prediction based on weather patterns and historical data"""
        cache_key = f"yield_{crop_type}_{region}_{season}"
        
        if cache_key in self.cache:
            cached_data, timestamp = self.cache[cache_key]
            if (datetime.now() - timestamp).seconds < 3600:  # 1 hour cache for yield
                return cached_data

        # Get current weather conditions
        current_weather = await self.get_current_weather(region)
        
        # Calculate yield prediction based on weather and crop models
        prediction = self._calculate_yield_prediction(crop_type, region, season, current_weather)
        
        # Cache the result
        self.cache[cache_key] = (prediction, datetime.now())
        return prediction

    def _calculate_yield_prediction(self, crop_type: str, region: str, season: str, weather: WeatherData) -> YieldPrediction:
        """Calculate yield prediction using agricultural models"""
        
        # Base yield values for different crops (tonnes per hectare)
        base_yields = {
            'rice': 4.5,
            'wheat': 3.2,
            'maize': 5.8,
            'cotton': 2.1,
            'sugarcane': 75.0,
            'pulses': 1.8
        }
        
        # Regional adjustment factors
        regional_factors = {
            'Karnataka': 1.1,
            'Punjab': 1.3,
            'Uttar Pradesh': 1.2,
            'Maharashtra': 0.9,
            'West Bengal': 1.15
        }
        
        # Seasonal factors
        seasonal_factors = {
            'kharif': 1.0,
            'rabi': 0.85,
            'zaid': 0.75
        }
        
        base_yield = base_yields.get(crop_type.lower(), 3.0)
        region_factor = regional_factors.get(region, 1.0)
        season_factor = seasonal_factors.get(season.lower(), 1.0)
        
        # Weather-based adjustments
        weather_factor = 1.0
        
        # Temperature impact
        if crop_type.lower() == 'rice':
            if 22 <= weather.temperature <= 32:
                weather_factor *= 1.1  # Optimal temperature
            elif weather.temperature < 18 or weather.temperature > 35:
                weather_factor *= 0.8  # Stress conditions
        
        # Rainfall impact (simplified)
        if weather.precipitation < 50:  # Low rainfall
            weather_factor *= 0.85
        elif weather.precipitation > 300:  # Excessive rainfall
            weather_factor *= 0.9
        
        # Humidity impact
        if weather.humidity < 40:  # Low humidity
            weather_factor *= 0.95
        elif weather.humidity > 80:  # High humidity (disease risk)
            weather_factor *= 0.92
        
        predicted_yield = base_yield * region_factor * season_factor * weather_factor
        
        # Calculate confidence based on weather stability
        confidence = min(95, 70 + (100 - abs(weather.temperature - 27)) * 0.5)
        
        # Determine key factors
        factors = {
            'base_yield': base_yield,
            'regional_factor': region_factor,
            'seasonal_factor': season_factor,
            'weather_factor': weather_factor,
            'temperature': weather.temperature,
            'humidity': weather.humidity,
            'precipitation': weather.precipitation
        }
        
        return YieldPrediction(
            crop_type=crop_type,
            region=region,
            predicted_yield=round(predicted_yield, 2),
            confidence_score=round(confidence, 1),
            factors=factors,
            season=season
        )

    async def get_weekly_forecasts(self, location: str = "Bangalore,IN", weeks: int = 52) -> List[WeeklyForecast]:
        """Get comprehensive weekly forecasts for the entire year"""
        cache_key = f"weekly_{location}_{weeks}"
        
        if cache_key in self.cache:
            cached_data, timestamp = self.cache[cache_key]
            if (datetime.now() - timestamp).seconds < 3600:  # 1 hour cache
                return cached_data

        forecasts = []
        start_date = datetime.now()
        
        for week in range(1, weeks + 1):
            week_start = start_date + timedelta(weeks=week-1)
            month_name = week_start.strftime('%b')
            
            # Generate realistic weather patterns based on Indian monsoon patterns
            rain_data = self._generate_indian_rain_pattern(week, month_name)
            
            # Create weekly forecast
            weekly_forecast = WeeklyForecast(
                week=week,
                month=month_name,
                year=week_start.year,
                weather_data=[],  # Can be populated with daily data
                rain_forecast=rain_data,
                temperature_avg=rain_data.temperature_min + (rain_data.temperature_max - rain_data.temperature_min) / 2,
                total_precipitation=rain_data.precipitation_amount
            )
            
            forecasts.append(weekly_forecast)
        
        # Cache the result
        self.cache[cache_key] = (forecasts, datetime.now())
        return forecasts

    def _generate_indian_rain_pattern(self, week: int, month: str) -> RainForecast:
        """Generate realistic Indian monsoon rain patterns"""
        
        # Indian monsoon patterns by month
        monsoon_patterns = {
            'Jan': {'base_chance': 5, 'base_amount': 2, 'temp_min': 15, 'temp_max': 28},
            'Feb': {'base_chance': 8, 'base_amount': 5, 'temp_min': 18, 'temp_max': 30},
            'Mar': {'base_chance': 12, 'base_amount': 8, 'temp_min': 21, 'temp_max': 33},
            'Apr': {'base_chance': 20, 'base_amount': 15, 'temp_min': 24, 'temp_max': 36},
            'May': {'base_chance': 35, 'base_amount': 25, 'temp_min': 26, 'temp_max': 38},
            'Jun': {'base_chance': 75, 'base_amount': 120, 'temp_min': 24, 'temp_max': 32},
            'Jul': {'base_chance': 85, 'base_amount': 180, 'temp_min': 22, 'temp_max': 30},
            'Aug': {'base_chance': 80, 'base_amount': 160, 'temp_min': 22, 'temp_max': 30},
            'Sep': {'base_chance': 60, 'base_amount': 100, 'temp_min': 22, 'temp_max': 31},
            'Oct': {'base_chance': 30, 'base_amount': 40, 'temp_min': 21, 'temp_max': 32},
            'Nov': {'base_chance': 15, 'base_amount': 12, 'temp_min': 18, 'temp_max': 29},
            'Dec': {'base_chance': 8, 'base_amount': 5, 'temp_min': 16, 'temp_max': 27}
        }
        
        pattern = monsoon_patterns.get(month, monsoon_patterns['Jan'])
        
        # Add some variation
        variation = math.sin(week * 0.2) * 20
        precip_chance = max(0, min(100, pattern['base_chance'] + variation))
        precip_amount = max(0, pattern['base_amount'] + variation * 0.5)
        
        # Determine intensity
        if precip_chance < 20:
            intensity = 'No Rain'
        elif precip_chance < 50:
            intensity = 'Low Rain'
        elif precip_chance < 75:
            intensity = 'Medium Rain'
        else:
            intensity = 'High Rain'
        
        return RainForecast(
            date=f"2026-W{week:02d}",
            precipitation_probability=int(precip_chance),
            precipitation_amount=precip_amount,
            rain_intensity=intensity,
            temperature_min=pattern['temp_min'] + variation * 0.3,
            temperature_max=pattern['temp_max'] + variation * 0.3,
            humidity=int(60 + precip_chance * 0.3)  # Humidity correlates with rain chance
        )

    # Mock data methods for development/fallback
    def _get_mock_current_weather(self) -> WeatherData:
        """Generate mock current weather data"""
        import random
        
        return WeatherData(
            timestamp=datetime.now(),
            temperature=28.5 + random.uniform(-5, 5),
            humidity=65 + random.randint(-15, 15),
            pressure=1013.25 + random.uniform(-10, 10),
            wind_speed=12.5 + random.uniform(-8, 8),
            wind_direction=random.randint(0, 360),
            precipitation=random.uniform(0, 5),
            weather_condition=random.choice(['partly cloudy', 'clear sky', 'light rain']),
            visibility=8.5 + random.uniform(-2, 3),
            uv_index=6 + random.uniform(-2, 3)
        )

    def _get_mock_rain_forecast(self, days: int) -> List[RainForecast]:
        """Generate mock rain forecast data"""
        forecasts = []
        base_date = datetime.now()
        
        for i in range(days):
            date = (base_date + timedelta(days=i)).strftime('%Y-%m-%d')
            
            # Simulate realistic rain patterns
            precip_chance = min(95, max(5, 30 + 50 * math.sin(i * 0.3)))
            precip_amount = precip_chance * 0.8
            
            if precip_chance < 20:
                intensity = 'No Rain'
            elif precip_chance < 50:
                intensity = 'Low Rain'
            elif precip_chance < 75:
                intensity = 'Medium Rain'
            else:
                intensity = 'High Rain'
            
            forecasts.append(RainForecast(
                date=date,
                precipitation_probability=int(precip_chance),
                precipitation_amount=precip_amount,
                rain_intensity=intensity,
                temperature_min=22 + math.sin(i * 0.2) * 5,
                temperature_max=32 + math.sin(i * 0.2) * 3,
                humidity=int(60 + precip_chance * 0.3)
            ))
        
        return forecasts

# Global weather service instance
weather_service = WeatherService()
