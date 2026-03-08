#!/usr/bin/env python3
"""
Debug script for rain forecast specifically
"""

import asyncio
import sys
import os

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.weather_service import weather_service

async def debug_rain_forecast():
    """Debug the rain forecast issue"""
    print("🔍 Debugging Rain Forecast Issue")
    print("=" * 50)
    
    try:
        print("1. Testing rain forecast generation...")
        forecasts = await weather_service.get_rain_forecast("Bangalore,IN", 7)
        print(f"   Number of forecasts: {len(forecasts)}")
        
        if forecasts:
            print(f"   First forecast: {forecasts[0]}")
            print(f"   Forecast type: {type(forecasts[0])}")
        else:
            print("   ❌ No forecasts generated")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(debug_rain_forecast())
