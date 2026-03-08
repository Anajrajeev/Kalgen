#!/usr/bin/env python3
"""
Direct test of temperature forecast API endpoint logic
"""

import asyncio
import sys
import os
import math
from datetime import datetime, timedelta

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.weather_service import weather_service

async def test_temp_forecast_logic():
    """Test the temperature forecast logic directly"""
    print("🔍 Testing Temperature Forecast Logic")
    print("=" * 50)
    
    try:
        location = "Bangalore,IN"
        days = 7
        
        print("1. Getting weekly forecast...")
        weekly_data = await weather_service.get_weekly_forecasts(location, min(52, days // 7 + 1))
        print(f"   Weekly data: {len(weekly_data)} weeks")
        
        if not weekly_data:
            print("   Getting fallback weekly data...")
            weekly_data = await weather_service.get_weekly_forecasts(location, 4)
            print(f"   Fallback weekly data: {len(weekly_data)} weeks")
        
        print("2. Generating daily temperature data...")
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
        
        print(f"   Generated {len(daily_temps)} daily forecasts")
        print(f"   First day: {daily_temps[0]}")
        print(f"   Available keys: {list(daily_temps[0].keys())}")
        
        # Calculate statistics
        temps = [d['temperature'] for d in daily_temps]
        stats = {
            'avg_temperature': sum(temps) / len(temps),
            'min_temperature': min(temps),
            'max_temperature': max(temps),
            'temperature_range': max(temps) - min(temps),
            'trend': 'increasing' if temps[-1] > temps[0] else 'decreasing'
        }
        
        print(f"   Statistics: {stats}")
        
        # Create full response
        temp_data = {
            'daily_forecast': daily_temps,
            'statistics': stats,
            'heatwaves': [
                d for d in daily_temps 
                if d['max_temp'] > 40  # Heatwave threshold
            ],
            'comfort_days': [
                d for d in daily_temps 
                if 20 <= d['temperature'] <= 30  # Comfortable temperature range
            ]
        }
        
        print(f"   Heatwave days: {len(temp_data['heatwaves'])}")
        print(f"   Comfort days: {len(temp_data['comfort_days'])}")
        print("   ✅ Temperature forecast logic working!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_temp_forecast_logic())
