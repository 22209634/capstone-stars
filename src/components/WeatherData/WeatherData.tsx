import './WeatherData.css'
import Panel from '@/components/Panel/Panel.tsx'

type weatherDataType = {
    // Location, Temperature and visibility, humidity and dew point, wind speed and direction, pressure
    location: string;
    temperature: number;
    visibility: string; // e.g., clear, mostly clear, cloudy, etc.
    humidity: number;
    dewPoint: number;
    windSpeed: number;
    windDirection: string;
    pressure: number;
    temperatureUnit?: string;
    humidityUnit?: string;
    speedUnit?: string;
    pressureUnit?: string;
}

const mockData: weatherDataType = {
    location: 'Melbourne, Australia',
    temperature: 6,
    visibility: 'Clear Sky',
    humidity: 87,
    dewPoint: 9,
    windSpeed: 11,
    windDirection: 'W',
    pressure: 997,
    temperatureUnit: 'C',
    humidityUnit: '%',
    speedUnit: 'km/h',
    pressureUnit: 'hPa'
}

export default function WeatherData() {
    return (
        <div className="weather-data__wrapper">
            <Panel className="weather-data__panel" borderRadius="3px">
                <div className="weather-data__item weather-data__location">
                    <p><span>Weather Data for</span> {mockData.location}</p>
                </div>
            </Panel>
            <Panel className="weather-data__panel" borderRadius="3px">
                <div className="weather-data__item weather-data__temperatureVisibility">
                    <p><span>Temperature</span>{mockData.temperature}°{mockData.temperatureUnit}</p>
                    <p><span>Visibility</span>{mockData.visibility}</p>
                </div>
            </Panel>
            <Panel className="weather-data__panel" borderRadius="3px">
                <div className="weather-data__item weather-data__humidity">
                    <p><span>Humidity</span> {mockData.humidity}{mockData.humidityUnit}</p>
                    <p><span>Dew Pt.</span> {mockData.dewPoint}°{mockData.temperatureUnit}</p>
                </div>
            </Panel>
            <Panel className="weather-data__panel" borderRadius="3px">
                <div className="weather-data__item weather-data__windspeedPressure">
                    <p><span>Wind Speed</span> {mockData.windSpeed} {mockData.speedUnit} {mockData.windDirection}</p>
                    <p><span>Pressure</span> {mockData.pressure} {mockData.pressureUnit}</p>
                </div>
            </Panel>
        </div>
    )
}