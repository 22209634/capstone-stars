export default function WeatherSection() {
  return (
    <div className="weather-section">
      {/* Location */}
      <div className="weather-section__location">Melbourne, Australia</div>

      {/* Main weather info */}
      <div className="weather-section__main">
        <div className="weather-section__temperature">
          <span className="weather-section__temp-value">6°C</span>
          <span className="weather-section__condition">Mostly Clear</span>
        </div>

        <div className="weather-section__secondary">
          <div className="weather-section__humidity">
            <span className="weather-section__value">87%</span>
            <span className="weather-section__label">HUMIDITY</span>
          </div>
          <div className="weather-section__dewpoint">
            <span className="weather-section__value">9°C</span>
            <span className="weather-section__label">DEW PT.</span>
          </div>
        </div>
      </div>

      {/* Wind and Pressure */}
      <div className="weather-section__details">
        <div className="weather-section__wind">
          <span className="weather-section__value">11 km/h W</span>
          <span className="weather-section__label">Wind Speed</span>
        </div>

        <div className="weather-section__pressure">
          <span className="weather-section__label">Pressure</span>
          <span className="weather-section__value">997 hPa</span>
        </div>
      </div>
    </div>
  );
}
