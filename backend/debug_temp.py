#!/usr/bin/env python3
"""
Debug script for temperature forecast specifically
"""

import asyncio
import sys
import os

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.weather_service import weather_service

async def debug_temperature_forecast():
    """Debug the temperature forecast issue"""
    print("🔍 Debugging Temperature Forecast Issue")
    print("=" * 50)
    
    try:
        print("1. Testing weekly forecast (dependency)...")
        weekly_data = await weather_service.get_weekly_forecasts("Bangalore,IN", 4)
        print(f"   Weekly data length: {len(weekly_data)}")
        
        if weekly_data:
            print(f"   First week temp: {weekly_data[0].temperature_avg}")
            print(f"   First week data: {weekly_data[0]}")
        else:
            print("   ❌ No weekly data available")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(debug_temperature_forecast())
