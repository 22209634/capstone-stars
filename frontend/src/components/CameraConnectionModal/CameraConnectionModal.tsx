import { useState, useEffect } from 'react';
import './CameraConnectionModal.css';
import cameraAPI, { type AscomCamera } from '@/services/cameraAPI';
import Button from '@/components/Button/Button';
import Panel from '@/components/Panel/Panel';
import { Camera, Loader } from 'lucide-react';

interface CameraConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (camera: AscomCamera) => void;
}

export default function CameraConnectionModal({ isOpen, onClose, onConnect }: CameraConnectionModalProps) {
  const [cameras, setCameras] = useState<AscomCamera[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCamera, setSelectedCamera] = useState<AscomCamera | null>(null);

  useEffect(() => {
    if (isOpen) {
      discoverCameras();
    }
  }, [isOpen]);

  const discoverCameras = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await cameraAPI.discoverAscomCameras();
      if (response.success && response.data) {
        setCameras(response.data);
        if (response.data.length === 0) {
          setError('No ASCOM Alpaca cameras found on the network. Make sure your camera is powered on and connected.');
        }
      } else {
        setError(response.message || 'Failed to discover cameras');
      }
    } catch (err) {
      setError('Error discovering ASCOM cameras. Check your network connection.');
      console.error('Discovery error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    if (selectedCamera) {
      onConnect(selectedCamera);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <Panel className="camera-connection-modal" borderRadius="3px">
        <div className="modal-header">
          <div className="modal-title">
            <Camera size={24} />
            <h2>Connect to Camera</h2>
          </div>
        </div>

        <div className="modal-content">
          {loading ? (
            <div className="loading-state">
              <Loader className="spinner" size={32} />
              <p>Searching for ASCOM Alpaca cameras...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <p className="error-message">{error}</p>
              <Button onClick={discoverCameras}>Retry Discovery</Button>
            </div>
          ) : cameras.length > 0 ? (
            <div className="cameras-list">
              <p className="cameras-info">Found {cameras.length} camera(s). Select a camera to connect:</p>
              {cameras.map((camera) => (
                <div
                  key={camera.uniqueID}
                  className={`camera-item ${selectedCamera?.uniqueID === camera.uniqueID ? 'selected' : ''}`}
                  onClick={() => setSelectedCamera(camera)}
                >
                  <div className="camera-info">
                    <h3>{camera.deviceName}</h3>
                    <p className="camera-details">
                      {camera.deviceType} • {camera.ipAddress}:{camera.port}
                    </p>
                    <p className="camera-id">Device #{camera.deviceNumber}</p>
                  </div>
                  {selectedCamera?.uniqueID === camera.uniqueID && (
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
            disabled={!selectedCamera}
            className="connect-btn"
          >
            Connect to Selected Camera
          </Button>
        </div>
      </Panel>
    </div>
  );
}
