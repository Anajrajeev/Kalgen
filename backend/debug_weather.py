#!/usr/bin/env python3
"""
Debug script for weather service issues
"""

import asyncio
import sys
import os

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.weather_service import weather_service

async def debug_weekly_forecast():
    """Debug the weekly forecast issue"""
    print("🔍 Debugging Weekly Forecast Issue")
    print("=" * 50)
    
    try:
        print("1. Testing weather service initialization...")
        print(f"   Service created: {weather_service is not None}")
        print(f"   Cache duration: {weather_service.cache_duration}")
        print(f"   Cache items: {len(weather_service.cache)}")
        
        print("\n2. Testing weekly forecast generation...")
        forecasts = await weather_service.get_weekly_forecasts("Bangalore,IN", 4)
        print(f"   Number of forecasts: {len(forecasts)}")
        
        if forecasts:
            print(f"   First forecast: {forecasts[0]}")
            print(f"   Rain forecast type: {type(forecasts[0].rain_forecast)}")
        else:
            print("   ❌ No forecasts generated")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(debug_weekly_forecast())
