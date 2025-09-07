// src/components/TelescopeStatus/TelescopeStatus.tsx
import React, { useState, useEffect } from 'react';
import telescopeAPI, { TelescopeStatus as ITelescopeStatus } from '../../services/telescopeAPI';
import './TelescopeStatus.css';

const TelescopeStatus: React.FC = () => {
  const [status, setStatus] = useState<ITelescopeStatus>({
    connected: false,
    tracking: false,
    slewing: false,
    rightAscension: 0,
    declination: 0,
    altitude: 0,
    azimuth: 0,
    timestamp: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatRA = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    const s = Math.floor(((hours - h) * 60 - m) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatDec = (degrees: number) => {
    const d = Math.floor(Math.abs(degrees));
    const m = Math.floor((Math.abs(degrees) - d) * 60);
    const s = Math.floor(((Math.abs(degrees) - d) * 60 - m) * 60);
    const sign = degrees >= 0 ? '+' : '-';
    return `${sign}${d.toString().padStart(2, '0')}°${m.toString().padStart(2, '0')}'${s.toString().padStart(2, '0')}"`;
  };

  const updateStatus = async () => {
    try {
      const response = await telescopeAPI.getTelescopeStatus();
      if (response.success && response.data) {
        setStatus(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Status update failed');
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    try {
      await telescopeAPI.connectTelescope();
      await updateStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await telescopeAPI.disconnectTelescope();
      setStatus(prev => ({ ...prev, connected: false }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Disconnect failed');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTracking = async () => {
    setLoading(true);
    try {
      await telescopeAPI.setTracking(!status.tracking);
      setTimeout(updateStatus, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tracking failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSlewToVega = async () => {
    setLoading(true);
    try {
      await telescopeAPI.slewToObject('Vega');
      setTimeout(updateStatus, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Slew failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    updateStatus();
    const interval = setInterval(() => {
      if (status.connected) updateStatus();
    }, 2000);
    return () => clearInterval(interval);
  }, [status.connected]);

  return (
    <div className="telescope-status">
      <div className="telescope-header">
        <h3>Telescope Control</h3>
        <div className={`status-dot ${status.connected ? 'connected' : 'disconnected'}`}>
          {status.connected ? 'Connected' : 'Disconnected'}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="telescope-controls">
        {!status.connected ? (
          <button onClick={handleConnect} disabled={loading} className="btn-connect">
            {loading ? 'Connecting...' : 'Connect SimScope'}
          </button>
        ) : (
          <>
            <button onClick={handleDisconnect} disabled={loading} className="btn-disconnect">
              Disconnect
            </button>
            <button onClick={handleToggleTracking} disabled={loading} className="btn-tracking">
              Tracking: {status.tracking ? 'ON' : 'OFF'}
            </button>
            <button onClick={handleSlewToVega} disabled={loading} className="btn-slew">
              Go to Vega
            </button>
          </>
        )}
      </div>

      {status.connected && (
        <div className="telescope-data">
          <div className="coordinate">RA: {formatRA(status.rightAscension)}</div>
          <div className="coordinate">Dec: {formatDec(status.declination)}</div>
          <div className="coordinate">Alt: {status.altitude.toFixed(1)}°</div>
          <div className="coordinate">Az: {status.azimuth.toFixed(1)}°</div>
          <div className="status-text">
            {status.slewing ? 'SLEWING' : 'STATIONARY'}
          </div>
        </div>
      )}
    </div>
  );
};

export default TelescopeStatus;