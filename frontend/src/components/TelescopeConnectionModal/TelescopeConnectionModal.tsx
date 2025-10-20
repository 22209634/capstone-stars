import { useState, useEffect } from 'react';
import './TelescopeConnectionModal.css';
import telescopeAPI, { type AscomDevice } from '@/services/telescopeAPI';
import Button from '@/components/Button/Button';
import Panel from '@/components/Panel/Panel';
import { Telescope, Loader } from 'lucide-react';

interface TelescopeConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (device: AscomDevice) => void;
}

export default function TelescopeConnectionModal({ isOpen, onClose, onConnect }: TelescopeConnectionModalProps) {
  const [devices, setDevices] = useState<AscomDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<AscomDevice | null>(null);

  useEffect(() => {
    if (isOpen) {
      discoverDevices();
    }
  }, [isOpen]);

  const discoverDevices = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await telescopeAPI.discoverAscomDevices();
      if (response.success && response.data) {
        setDevices(response.data);
        if (response.data.length === 0) {
          setError('No ASCOM Alpaca devices found on the network. Make sure your telescope is powered on and connected.');
        }
      } else {
        setError(response.message || 'Failed to discover devices');
      }
    } catch (err) {
      setError('Error discovering ASCOM devices. Check your network connection.');
      console.error('Discovery error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    if (selectedDevice) {
      onConnect(selectedDevice);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <Panel className="connection-modal" borderRadius="3px">
        <div className="modal-header">
          <div className="modal-title">
            <Telescope size={24} />
            <h2>Connect to Telescope</h2>
          </div>
        </div>

        <div className="modal-content">
          {loading ? (
            <div className="loading-state">
              <Loader className="spinner" size={32} />
              <p>Searching for ASCOM Alpaca devices...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <p className="error-message">{error}</p>
              <Button onClick={discoverDevices}>Retry Discovery</Button>
            </div>
          ) : devices.length > 0 ? (
            <div className="devices-list">
              <p className="devices-info">Found {devices.length} device(s). Select a telescope to connect:</p>
              {devices.map((device) => (
                <div
                  key={device.uniqueID}
                  className={`device-item ${selectedDevice?.uniqueID === device.uniqueID ? 'selected' : ''}`}
                  onClick={() => setSelectedDevice(device)}
                >
                  <div className="device-info">
                    <h3>{device.deviceName}</h3>
                    <p className="device-details">
                      {device.deviceType} • {device.ipAddress}:{device.port}
                    </p>
                    <p className="device-id">Device #{device.deviceNumber}</p>
                  </div>
                  {selectedDevice?.uniqueID === device.uniqueID && (
                    <div className="selected-indicator">✓</div>
                  )}
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="modal-footer">
          <Button onClick={onClose} className="cancel-btn">Cancel</Button>
          <Button
            onClick={handleConnect}
            disabled={!selectedDevice}
            className="connect-btn"
          >
            Connect to Selected Device
          </Button>
        </div>
      </Panel>
    </div>
  );
}