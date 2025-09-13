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
    speedUnit?: string;
    pressureUnit?: string;
}

const mockData: weatherDataType = {
    location: 'Melbourne, Australia',
    temperature: 6,
    visibility: 'Mostly clear',
    humidity: 87,
    dewPoint: 9,
    windSpeed: 11,
    windDirection: 'W',
    pressure: 997,
    temperatureUnit: 'C',
    speedUnit: 'km/h',
    pressureUnit: 'hPa'
}

export default function WeatherData() {
    return (
        <>
            <Panel className="weather-data__panel" borderRadius="3px">
                <div className="weather-data__location">
                    <p>{mockData.location}</p>
                </div>
            </Panel>
            <Panel className="weather-data__panel" borderRadius="3px">
                <div className="weather-data__temperature">
                    <p>{mockData.temperature}°{mockData.temperatureUnit}</p>
                    <p>{mockData.visibility}</p>
                </div>
            </Panel>
            <Panel className="weather-data__panel" borderRadius="3px">
                <div className="weather-data__humidity">
                    <p><span>Humidity</span> {mockData.humidity}</p>
                    <p><span>Dew Pt.</span> {mockData.dewPoint}</p>
                </div>
            </Panel>
            <Panel className="weather-data__panel" borderRadius="3px">
                <div className="weather-data__windspeed">
                    <p><span>Wind Speed</span>{mockData.windSpeed} {mockData.speedUnit} {mockData.windDirection}</p>
                </div>
            </Panel>
            <Panel className="weather-data__panel" borderRadius="3px">
                <div className="weather-data__pressure">
                    <p><span>Pressure</span>{mockData.pressure} {mockData.pressureUnit}</p>
                </div>
            </Panel>
        </>
    )
}