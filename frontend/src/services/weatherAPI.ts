const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface WeatherAlert {
  type: string;
  severity: 'warning' | 'critical' | 'error';
  message: string;
  recommendation: string;
  value?: number;
  difference?: number;
}

export interface WeatherData {
  timestamp: string;
  temperature: number | null;
  humidity: number | null;
  pressure: number | null;
  dew_point: number | null;
  dew_difference: number | null;
  status: 'GREEN' | 'YELLOW' | 'RED' | 'UNKNOWN';
  humidity_status: string;
  dew_status: string;
  alerts: WeatherAlert[];
  safe_to_observe: boolean;
  error?: string;
}

class WeatherAPI {
  private baseURL: string;

  constructor() {
    this.baseURL = `${API_BASE_URL}/api`;
  }

  async getWeatherStatus(): Promise<WeatherData> {
    const url = `${this.baseURL}/weather`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch weather data: ${response.statusText}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch weather data');
    }

    return result.data;
  }
}

const weatherAPI = new WeatherAPI();
export default weatherAPI;
