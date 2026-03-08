/**
 * Weather Service for Frontend
 * Handles API calls to weather backend for real-time data
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api-proxy';

export interface WeatherData {
  timestamp: string;
  temperature: number;
  humidity: number;
  pressure: number;
  wind_speed: number;
  wind_direction: number;
  precipitation: number;
  weather_condition: string;
  visibility: number;
  uv_index?: number;
}

export interface RainForecast {
  date: string;
  precipitation_probability: number;
  precipitation_amount: number;
  rain_intensity: 'No Rain' | 'Low Rain' | 'Medium Rain' | 'High Rain';
  temperature_min: number;
  temperature_max: number;
  humidity: number;
}

export interface YieldPrediction {
  crop_type: string;
  region: string;
  predicted_yield: number;
  confidence_score: number;
  factors: Record<string, any>;
  season: string;
  planting_date?: string;
  harvest_date?: string;
}

export interface WeeklyForecast {
  week: number;
  month: string;
  year: number;
  weather_data: WeatherData[];
  rain_forecast: RainForecast;
  temperature_avg: number;
  total_precipitation: number;
}

export interface RainHeatmapData {
  weeks: number[];
  months: string[];
  intensities: Array<{
    week: number;
    month: string;
    intensity: string;
    precipitation: number;
    probability: number;
    temperature_avg: number;
  }>;
  stats: {
    high_rain_weeks: number;
    medium_rain_weeks: number;
    low_rain_weeks: number;
    dry_weeks: number;
    total_precipitation: number;
    peak_season: {
      start_week: number;
      end_week: number;
      description: string;
    };
  };
}

export interface TemperatureForecast {
  daily_forecast: Array<{
    date: string;
    temperature: number;
    min_temp: number;
    max_temp: number;
    week: number;
    month: string;
  }>;
  statistics: {
    avg_temperature: number;
    min_temperature: number;
    max_temperature: number;
    temperature_range: number;
    trend: 'increasing' | 'decreasing';
  };
  heatwaves: Array<{
    date: string;
    temperature: number;
    min_temp: number;
    max_temp: number;
    week: number;
    month: string;
  }>;
  comfort_days: Array<{
    date: string;
    temperature: number;
    min_temp: number;
    max_temp: number;
    week: number;
    month: string;
  }>;
}

export interface YieldAnalysis {
  region: string;
  season: string;
  crop_predictions: Array<{
    crop: string;
    yield: number;
    confidence: number;
    factors: Record<string, any>;
  }>;
  best_performing: {
    crop: string;
    yield: number;
    confidence: number;
    factors: Record<string, any>;
  } | null;
  total_estimated_yield: number;
  average_confidence: number;
  recommendations: string[];
  risk_factors: string[];
}

class WeatherService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  async getCurrentWeather(location: string = "Bangalore,IN"): Promise<{ success: boolean; data?: WeatherData; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/weather/current?location=${encodeURIComponent(location)}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error('Error fetching current weather:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch weather data'
      };
    }
  }

  async getRainForecast(location: string = "Bangalore,IN", days: number = 7): Promise<{ success: boolean; data: RainForecast[]; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/weather/rain-forecast?location=${encodeURIComponent(location)}&days=${days}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error('Error fetching rain forecast:', error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Failed to fetch rain forecast'
      };
    }
  }

  async getYieldPrediction(
    cropType: string = "rice",
    region: string = "Karnataka",
    season: string = "kharif"
  ): Promise<{ success: boolean; data?: YieldPrediction; error?: string }> {
    try {
      const params = new URLSearchParams({
        crop_type: cropType,
        region: region,
        season: season
      });

      const response = await fetch(`${this.baseUrl}/weather/yield-prediction?${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error('Error fetching yield prediction:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch yield prediction'
      };
    }
  }

  async getWeeklyForecast(location: string = "Bangalore,IN", weeks: number = 52): Promise<{ success: boolean; data: WeeklyForecast[]; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/weather/weekly-forecast?location=${encodeURIComponent(location)}&weeks=${weeks}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error('Error fetching weekly forecast:', error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Failed to fetch weekly forecast'
      };
    }
  }

  async getRainHeatmap(location: string = "Bangalore,IN", year: number = 2026): Promise<{ success: boolean; data?: RainHeatmapData; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/weather/rain-heatmap?location=${encodeURIComponent(location)}&year=${year}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error('Error fetching rain heatmap:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch rain heatmap'
      };
    }
  }

  async getTemperatureForecast(location: string = "Bangalore,IN", days: number = 30): Promise<{ success: boolean; data?: TemperatureForecast; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/weather/temperature-forecast?location=${encodeURIComponent(location)}&days=${days}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error('Error fetching temperature forecast:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch temperature forecast'
      };
    }
  }

  async getYieldAnalysis(region: string = "Karnataka", season: string = "kharif"): Promise<{ success: boolean; data?: YieldAnalysis; error?: string }> {
    try {
      const params = new URLSearchParams({
        region: region,
        season: season
      });

      const response = await fetch(`${this.baseUrl}/weather/yield-analysis?${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error('Error fetching yield analysis:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch yield analysis'
      };
    }
  }

  async getServiceStatus(): Promise<{ success: boolean; data?: Record<string, any>; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/weather/service-status`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Error fetching service status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch service status'
      };
    }
  }

  // Helper methods for formatting data
  formatRainIntensity(intensity: string): string {
    const intensityMap = {
      'No Rain': 'No Rain',
      'Low Rain': 'Low Rain',
      'Medium Rain': 'Medium Rain',
      'High Rain': 'High Rain'
    };
    return intensityMap[intensity as keyof typeof intensityMap] || intensity;
  }

  getRainColor(intensity: string): string {
    const colorMap = {
      'No Rain': 'bg-slate-100',
      'Low Rain': 'bg-blue-200',
      'Medium Rain': 'bg-blue-400',
      'High Rain': 'bg-blue-600'
    };
    return colorMap[intensity as keyof typeof colorMap] || 'bg-slate-100';
  }

  getRainIcon(intensity: string): string {
    const iconMap = {
      'No Rain': '☀️',
      'Low Rain': '⛅',
      'Medium Rain': '🌧️',
      'High Rain': '⛈️'
    };
    return iconMap[intensity as keyof typeof iconMap] || '☀️';
  }

  formatTemperature(temp: number, unit: 'C' | 'F' = 'C'): string {
    if (unit === 'F') {
      return `${Math.round(temp * 9 / 5 + 32)}°F`;
    }
    return `${Math.round(temp)}°C`;
  }

  formatWindSpeed(speed: number, unit: 'kmh' | 'mph' = 'kmh'): string {
    if (unit === 'mph') {
      return `${Math.round(speed * 0.621371)} mph`;
    }
    return `${Math.round(speed * 3.6)} km/h`;
  }

  formatHumidity(humidity: number): string {
    return `${humidity}%`;
  }

  formatPrecipitation(amount: number, unit: 'mm' | 'in' = 'mm'): string {
    if (unit === 'in') {
      return `${(amount * 0.0393701).toFixed(2)} in`;
    }
    return `${amount.toFixed(1)} mm`;
  }
}

export const weatherService = new WeatherService();
export default weatherService;
