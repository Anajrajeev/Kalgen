#!/usr/bin/env python3
"""
Test script for Weather APIs
"""

import asyncio
import httpx
import json
import sys
import os

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

async def test_weather_apis():
    """Test all weather API endpoints"""
    base_url = "http://localhost:8000"
    
    print("🌤️  Testing Weather APIs")
    print("=" * 50)
    
    async with httpx.AsyncClient() as client:
        # Test 1: Service Status
        print("\n1. Testing Weather Service Status...")
        try:
            response = await client.get(f"{base_url}/weather/service-status")
            if response.status_code == 200:
                status = response.json()
                print(f"✅ Service Status: {status.get('service', 'unknown')}")
                print(f"   APIs Configured: {status.get('apis_configured', {})}")
                print(f"   Cache Status: {status.get('cache_status', {})}")
            else:
                print(f"❌ Service Status failed: {response.status_code}")
        except Exception as e:
            print(f"❌ Service Status error: {e}")
        
        # Test 2: Current Weather
        print("\n2. Testing Current Weather...")
        try:
            response = await client.get(f"{base_url}/weather/current?location=Bangalore,IN")
            if response.status_code == 200:
                weather = response.json()
                if weather.get('success') and weather.get('data'):
                    data = weather['data']
                    print(f"✅ Current Weather: {data.get('temperature', 'N/A')}°C, {data.get('weather_condition', 'N/A')}")
                    print(f"   Humidity: {data.get('humidity', 'N/A')}%")
                    print(f"   Wind: {data.get('wind_speed', 'N/A')} m/s")
                else:
                    print(f"❌ Current Weather failed: {weather.get('error', 'Unknown error')}")
            else:
                print(f"❌ Current Weather failed: {response.status_code}")
        except Exception as e:
            print(f"❌ Current Weather error: {e}")
        
        # Test 3: Rain Forecast
        print("\n3. Testing Rain Forecast...")
        try:
            response = await client.get(f"{base_url}/weather/rain-forecast?location=Bangalore,IN&days=7")
            if response.status_code == 200:
                forecast = response.json()
                if forecast.get('success'):
                    data = forecast['data']
                    print(f"✅ Rain Forecast: {len(data)} days retrieved")
                    if data:
                        today = data[0]
                        print(f"   Today: {today.get('rain_intensity', 'N/A')} ({today.get('precipitation_probability', 0)}% chance)")
                else:
                    print(f"❌ Rain Forecast failed: {forecast.get('error', 'Unknown error')}")
            else:
                print(f"❌ Rain Forecast failed: {response.status_code}")
        except Exception as e:
            print(f"❌ Rain Forecast error: {e}")
        
        # Test 4: Weekly Forecast
        print("\n4. Testing Weekly Forecast...")
        try:
            response = await client.get(f"{base_url}/weather/weekly-forecast?location=Bangalore,IN&weeks=4")
            if response.status_code == 200:
                weekly = response.json()
                if weekly.get('success'):
                    data = weekly['data']
                    print(f"✅ Weekly Forecast: {len(data)} weeks retrieved")
                    if data:
                        print(f"   Week 1: {data[0].get('rain_forecast', {}).get('rain_intensity', 'N/A')}")
                else:
                    print(f"❌ Weekly Forecast failed: {weekly.get('error', 'Unknown error')}")
            else:
                print(f"❌ Weekly Forecast failed: {response.status_code}")
        except Exception as e:
            print(f"❌ Weekly Forecast error: {e}")
        
        # Test 5: Yield Prediction
        print("\n5. Testing Yield Prediction...")
        try:
            response = await client.get(f"{base_url}/weather/yield-prediction?crop_type=rice&region=Karnataka&season=kharif")
            if response.status_code == 200:
                yield_pred = response.json()
                if yield_pred.get('success') and yield_pred.get('data'):
                    data = yield_pred['data']
                    print(f"✅ Yield Prediction: {data.get('predicted_yield', 'N/A')} tonnes/hectare")
                    print(f"   Confidence: {data.get('confidence_score', 'N/A')}%")
                    print(f"   Crop: {data.get('crop_type', 'N/A')}")
                else:
                    print(f"❌ Yield Prediction failed: {yield_pred.get('error', 'Unknown error')}")
            else:
                print(f"❌ Yield Prediction failed: {response.status_code}")
        except Exception as e:
            print(f"❌ Yield Prediction error: {e}")
        
        # Test 6: Rain Heatmap
        print("\n6. Testing Rain Heatmap...")
        try:
            response = await client.get(f"{base_url}/weather/rain-heatmap?location=Bangalore,IN&year=2026")
            if response.status_code == 200:
                heatmap = response.json()
                if heatmap.get('success') and heatmap.get('data'):
                    data = heatmap['data']
                    stats = data.get('stats', {})
                    print(f"✅ Rain Heatmap: {len(data.get('intensities', []))} weeks generated")
                    print(f"   High Rain Weeks: {stats.get('high_rain_weeks', 0)}")
                    print(f"   Dry Weeks: {stats.get('dry_weeks', 0)}")
                else:
                    print(f"❌ Rain Heatmap failed: {heatmap.get('error', 'Unknown error')}")
            else:
                print(f"❌ Rain Heatmap failed: {response.status_code}")
        except Exception as e:
            print(f"❌ Rain Heatmap error: {e}")
        
        # Test 7: Temperature Forecast
        print("\n7. Testing Temperature Forecast...")
        try:
            response = await client.get(f"{base_url}/weather/temperature-forecast?location=Bangalore,IN&days=7")
            if response.status_code == 200:
                temp = response.json()
                if temp.get('success') and temp.get('data'):
                    data = temp['data']
                    stats = data.get('statistics', {})
                    print(f"✅ Temperature Forecast: {len(data.get('daily_forecast', []))} days retrieved")
                    print(f"   Avg Temperature: {stats.get('avg_temperature', 'N/A')}°C")
                    print(f"   Max Temperature: {stats.get('max_temperature', 'N/A')}°C")
                else:
                    print(f"❌ Temperature Forecast failed: {temp.get('error', 'Unknown error')}")
            else:
                print(f"❌ Temperature Forecast failed: {response.status_code}")
        except Exception as e:
            print(f"❌ Temperature Forecast error: {e}")
        
        # Test 8: Yield Analysis
        print("\n8. Testing Yield Analysis...")
        try:
            response = await client.get(f"{base_url}/weather/yield-analysis?region=Karnataka&season=kharif")
            if response.status_code == 200:
                analysis = response.json()
                if analysis.get('success') and analysis.get('data'):
                    data = analysis['data']
                    print(f"✅ Yield Analysis: {len(data.get('crop_predictions', []))} crops analyzed")
                    if data.get('best_performing'):
                        best = data['best_performing']
                        print(f"   Best Crop: {best.get('crop', 'N/A')} ({best.get('yield', 'N/A')} T/ha)")
                    print(f"   Total Estimated Yield: {data.get('total_estimated_yield', 'N/A')} T")
                else:
                    print(f"❌ Yield Analysis failed: {analysis.get('error', 'Unknown error')}")
            else:
                print(f"❌ Yield Analysis failed: {response.status_code}")
        except Exception as e:
            print(f"❌ Yield Analysis error: {e}")

if __name__ == "__main__":
    print("🚀 Starting Weather API Tests")
    print("Make sure the backend server is running on http://localhost:8000")
    print("Run: python -m uvicorn app.main:app --reload")
    
    try:
        asyncio.run(test_weather_apis())
        print("\n🎉 Weather API tests completed!")
    except KeyboardInterrupt:
        print("\n⚠️ Tests interrupted")
    except Exception as e:
        print(f"\n❌ Test suite failed: {e}")
        sys.exit(1)
