import './WeatherData.css'
import Panel from '@/components/Panel/Panel.tsx'
import { useEffect, useState } from 'react'
import telescopeAPI from '@/services/telescopeAPI'

type weatherDataType = {
    location: string;
    temperature: number;
    visibility: string;
    humidity: number;
    dewPoint: number;
    pressure: number;
    temperatureUnit: string;
    humidityUnit: string;
    pressureUnit: string;
}

export default function WeatherData() {
    const [weatherData, setWeatherData] = useState<weatherDataType | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchWeatherData = async () => {
            try {
                const response = await telescopeAPI.getWeatherData();

                if (response.success && response.data) {
                    // Map API data to our component's format
                    setWeatherData({
                        location: 'Bundoora, Melbourne',
                        temperature: Math.round(response.data.temperature * 10) / 10,
                        visibility: response.data.status === 'GREEN' ? 'Clear' :
                                   response.data.status === 'YELLOW' ? 'Caution' : 'Poor',
                        humidity: Math.round(response.data.humidity * 10) / 10,
                        dewPoint: Math.round(response.data.dew_point * 10) / 10,
                        pressure: Math.round(response.data.pressure * 10) / 10,
                        temperatureUnit: 'C',
                        humidityUnit: '%',
                        pressureUnit: 'hPa'
                    });
                    setError(null);
                }
            } catch (err) {
                console.error('Failed to fetch weather data:', err);
                setError('Failed to load weather data');
            }
        };

        fetchWeatherData();

        // Refresh weather data every 5 minutes
        const interval = setInterval(fetchWeatherData, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, []);

    if (!weatherData) {
        return (
            <div className="weather-data__wrapper">
                <Panel className="weather-data__panel" borderRadius="3px">
                    <div className="weather-data__item weather-data__location">
                        <p>Loading weather data...</p>
                        {error && <p style={{color: 'orange', fontSize: '0.8em'}}>({error})</p>}
                    </div>
                </Panel>
            </div>
        );
    }

    return (
        <div className="weather-data__wrapper">
            <Panel className="weather-data__panel" borderRadius="3px">
                <div className="weather-data__item weather-data__location">
                    <p><span>Weather Data for</span> {weatherData.location}</p>
                    {error && <p style={{color: 'orange', fontSize: '0.8em'}}>({error})</p>}
                </div>
            </Panel>
            <Panel className="weather-data__panel" borderRadius="3px">
                <div className="weather-data__item weather-data__temperatureVisibility">
                    <p><span>Temperature</span>{weatherData.temperature}°{weatherData.temperatureUnit}</p>
                    <p><span>Visibility</span>{weatherData.visibility}</p>
                </div>
            </Panel>
            <Panel className="weather-data__panel" borderRadius="3px">
                <div className="weather-data__item weather-data__humidity">
                    <p><span>Humidity</span> {weatherData.humidity}{weatherData.humidityUnit}</p>
                    <p><span>Dew Pt.</span> {weatherData.dewPoint}°{weatherData.temperatureUnit}</p>
                </div>
            </Panel>
            <Panel className="weather-data__panel" borderRadius="3px">
                <div className="weather-data__item weather-data__pressure">
                    <p><span>Pressure</span> {weatherData.pressure} {weatherData.pressureUnit}</p>
                </div>
            </Panel>
        </div>
    )
}