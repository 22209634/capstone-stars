import './WeatherAlerts.css';
import { AlertTriangle, AlertCircle, CheckCircle, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import weatherAPI from '@/services/weatherAPI';

interface WeatherAlert {
  type: string;
  severity: 'warning' | 'critical' | 'error';
  message: string;
  recommendation: string;
  value?: number;
  difference?: number;
}

interface WeatherData {
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

export default function WeatherAlerts() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [isExpanded, setIsExpanded] = useState(true);
  const [isClosed, setIsClosed] = useState(false);
  const [lastStatus, setLastStatus] = useState<string | null>(null);

  useEffect(() => {
    // Fetch weather data immediately
    fetchWeatherData();

    // Poll every 2 minutes
    const interval = setInterval(fetchWeatherData, 120000);

    return () => clearInterval(interval);
  }, []);

  const fetchWeatherData = async () => {
    try {
      const data = await weatherAPI.getWeatherStatus();
      setWeatherData(data);

      // If status has changed, reopen the alert panel
      if (lastStatus !== null && lastStatus !== data.status) {
        setIsClosed(false);
        setDismissed(new Set());
      }

      setLastStatus(data.status);

      // Reset dismissed alerts when new critical alerts appear
      if (data.alerts.some((alert: WeatherAlert) => alert.severity === 'critical')) {
        setDismissed(new Set());
      }
    } catch (error) {
      console.error('Failed to fetch weather data:', error);
    }
  };

  const dismissAlert = (alert: WeatherAlert) => {
    const alertKey = `${alert.type}-${alert.severity}`;
    setDismissed(prev => new Set(prev).add(alertKey));
  };

  const handleClose = () => {
    setIsClosed(true);
  };

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle size={20} />;
      case 'warning':
        return <AlertTriangle size={20} />;
      case 'error':
        return <AlertCircle size={20} />;
      default:
        return <CheckCircle size={20} />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'GREEN':
        return <CheckCircle size={16} className="status-icon-green" />;
      case 'YELLOW':
        return <AlertTriangle size={16} className="status-icon-yellow" />;
      case 'RED':
        return <AlertCircle size={16} className="status-icon-red" />;
      default:
        return <AlertCircle size={16} className="status-icon-gray" />;
    }
  };

  if (!weatherData) {
    return null;
  }

  // Filter out dismissed alerts
  const activeAlerts = weatherData.alerts.filter(alert => {
    const alertKey = `${alert.type}-${alert.severity}`;
    return !dismissed.has(alertKey);
  });

  // Don't show component if closed or if no active alerts and status is GREEN
  if (isClosed || (activeAlerts.length === 0 && weatherData.status === 'GREEN')) {
    return null;
  }

  return (
    <div className={`weather-alerts weather-alerts-${weatherData.status.toLowerCase()}`}>
      <div className="weather-alerts-header">
        <div className="weather-alerts-status" onClick={() => setIsExpanded(!isExpanded)}>
          {getStatusIcon(weatherData.status)}
          <span className="weather-alerts-title">
            {weatherData.status === 'GREEN' && 'Weather Conditions Normal'}
            {weatherData.status === 'YELLOW' && 'Weather Warning'}
            {weatherData.status === 'RED' && 'Weather Alert - Unsafe Conditions'}
            {weatherData.status === 'UNKNOWN' && 'Weather Data Unavailable'}
          </span>
          <span className="weather-alerts-toggle">{isExpanded ? '▼' : '▶'}</span>
        </div>
        <button
          className="weather-alerts-close"
          onClick={handleClose}
          aria-label="Close until status changes"
        >
          <X size={18} />
        </button>
      </div>

      {isExpanded && (
        <div className="weather-alerts-content">
          {/* Current readings */}
          <div className="weather-readings">
            <div className="weather-reading">
              <span className="reading-label">Temperature:</span>
              <span className="reading-value">
                {weatherData.temperature !== null ? `${weatherData.temperature.toFixed(1)}°C` : 'N/A'}
              </span>
            </div>
            <div className="weather-reading">
              <span className="reading-label">Humidity:</span>
              <span className="reading-value">
                {weatherData.humidity !== null ? `${weatherData.humidity.toFixed(1)}%` : 'N/A'}
              </span>
            </div>
            <div className="weather-reading">
              <span className="reading-label">Dew Point:</span>
              <span className="reading-value">
                {weatherData.dew_point !== null ? `${weatherData.dew_point.toFixed(1)}°C` : 'N/A'}
              </span>
            </div>
            <div className="weather-reading">
              <span className="reading-label">Dew Difference:</span>
              <span className="reading-value">
                {weatherData.dew_difference !== null ? `${weatherData.dew_difference.toFixed(1)}°C` : 'N/A'}
              </span>
            </div>
          </div>

          {/* Active alerts */}
          {activeAlerts.length > 0 && (
            <div className="weather-alerts-list">
              {activeAlerts.map((alert, index) => (
                <div
                  key={`${alert.type}-${index}`}
                  className={`weather-alert weather-alert-${alert.severity}`}
                >
                  <div className="weather-alert-header">
                    {getAlertIcon(alert.severity)}
                    <span className="weather-alert-message">{alert.message}</span>
                    <button
                      className="weather-alert-dismiss"
                      onClick={(e) => {
                        e.stopPropagation();
                        dismissAlert(alert);
                      }}
                      aria-label="Dismiss alert"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  {alert.recommendation && (
                    <div className="weather-alert-recommendation">
                      {alert.recommendation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
