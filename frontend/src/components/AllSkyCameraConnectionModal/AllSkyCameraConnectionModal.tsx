import { useState, useEffect } from 'react';
import './AllSkyCameraConnectionModal.css';
import allSkyCameraAPI, { type UsbCamera, type AscomCamera } from '@/services/allSkyCameraAPI';
import Button from '@/components/Button/Button';
import Panel from '@/components/Panel/Panel';
import { Camera, Loader, Wifi, Image } from 'lucide-react';
import { useAllSkyCameraContext } from '@/contexts/AllSkyCameraContext';

interface AllSkyCameraConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AllSkyCameraConnectionModal({ isOpen, onClose }: AllSkyCameraConnectionModalProps) {
  // Discovery states
  const [usbCameras, setUsbCameras] = useState<UsbCamera[]>([]);
  const [ascomCameras, setAscomCameras] = useState<AscomCamera[]>([]);
  const [loadingUsb, setLoadingUsb] = useState(false);
  const [loadingAscom, setLoadingAscom] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selection states
  const [selectedType, setSelectedType] = useState<'usb' | 'ascom' | 'ip' | 'placeholder' | null>(null);
  const [selectedUsbCamera, setSelectedUsbCamera] = useState<UsbCamera | null>(null);
  const [selectedAscomCamera, setSelectedAscomCamera] = useState<AscomCamera | null>(null);
  const [ipStreamUrl, setIpStreamUrl] = useState<string>('');

  const [connecting, setConnecting] = useState(false);

  const {
    setConnectedCameraType,
    setConnectedCameraName,
    setCameraConnected,
    setStreamUrl,
    setUsbCameraId,
  } = useAllSkyCameraContext();

  useEffect(() => {
    if (isOpen) {
      // Auto-discover on modal open
      discoverUsbCameras();
      discoverAscomCameras();
    }
  }, [isOpen]);

  const discoverUsbCameras = async () => {
    setLoadingUsb(true);
    setError(null);
    try {
      const response = await allSkyCameraAPI.discoverUsbCameras();
      if (response.success && response.data) {
        setUsbCameras(response.data);
      } else {
        console.error('Failed to discover USB cameras:', response.error);
      }
    } catch (err) {
      console.error('Error discovering USB cameras:', err);
    } finally {
      setLoadingUsb(false);
    }
  };

  const discoverAscomCameras = async () => {
    setLoadingAscom(true);
    setError(null);
    try {
      const response = await allSkyCameraAPI.discoverAscomCameras();
      if (response.success && response.data) {
        setAscomCameras(response.data);
      } else {
        console.error('Failed to discover ASCOM cameras:', response.error);
      }
    } catch (err) {
      console.error('Error discovering ASCOM cameras:', err);
    } finally {
      setLoadingAscom(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    setError(null);

    try {
      if (selectedType === 'placeholder') {
        // User selected to keep the placeholder image
        setConnectedCameraType(null);
        setConnectedCameraName(null);
        setCameraConnected(false);
        setStreamUrl(null);
        setUsbCameraId(null);
        onClose();
        return;
      }

      if (selectedType === 'usb' && selectedUsbCamera) {
        const response = await allSkyCameraAPI.connectCamera({
          cameraType: 'usb',
          usbDeviceId: selectedUsbCamera.deviceId,
        });

        if (response.success) {
          setConnectedCameraType('usb');
          setConnectedCameraName(selectedUsbCamera.deviceName);
          setCameraConnected(true);
          setUsbCameraId(selectedUsbCamera.deviceId);
          onClose();
        } else {
          setError(response.message || 'Failed to connect to USB camera');
        }
      } else if (selectedType === 'ascom' && selectedAscomCamera) {
        const response = await allSkyCameraAPI.connectCamera({
          cameraType: 'ascom',
          deviceId: selectedAscomCamera.uniqueID,
          ipAddress: selectedAscomCamera.ipAddress,
          port: selectedAscomCamera.port,
          deviceNumber: selectedAscomCamera.deviceNumber,
        });

        if (response.success) {
          setConnectedCameraType('ascom');
          setConnectedCameraName(selectedAscomCamera.deviceName);
          setCameraConnected(true);
          onClose();
        } else {
          setError(response.message || 'Failed to connect to ASCOM camera');
        }
      } else if (selectedType === 'ip' && ipStreamUrl) {
        const response = await allSkyCameraAPI.connectCamera({
          cameraType: 'ip',
          streamUrl: ipStreamUrl,
        });

        if (response.success) {
          setConnectedCameraType('ip');
          setConnectedCameraName('IP Camera');
          setCameraConnected(true);
          setStreamUrl(ipStreamUrl);
          onClose();
        } else {
          setError(response.message || 'Failed to connect to IP camera');
        }
      } else {
        setError('Please select a camera or enter an IP stream URL');
      }
    } catch (err) {
      setError('Connection failed. Please try again.');
      console.error('Connection error:', err);
    } finally {
      setConnecting(false);
    }
  };

  const handleUsbCameraSelect = (camera: UsbCamera) => {
    setSelectedType('usb');
    setSelectedUsbCamera(camera);
    setSelectedAscomCamera(null);
  };

  const handleAscomCameraSelect = (camera: AscomCamera) => {
    setSelectedType('ascom');
    setSelectedAscomCamera(camera);
    setSelectedUsbCamera(null);
  };

  const handleIpUrlChange = (url: string) => {
    setIpStreamUrl(url);
    setSelectedType(url ? 'ip' : null);
    setSelectedUsbCamera(null);
    setSelectedAscomCamera(null);
  };

  if (!isOpen) return null;

  const isConnectDisabled = !selectedType || connecting;

  return (
    <div className="modal-overlay">
      <Panel className="allsky-camera-connection-modal" borderRadius="3px">
        <div className="modal-header">
          <div className="modal-title">
            <Camera size={24} />
            <h2>Connect All-Sky Camera</h2>
          </div>
        </div>

        <div className="modal-content">
          {error && (
            <div className="error-message-box">
              <p>{error}</p>
            </div>
          )}

          {/* USB Cameras Section */}
          <div className="camera-section">
            <h3>
              <Camera size={20} />
              USB Cameras
            </h3>
            {loadingUsb ? (
              <div className="loading-inline">
                <Loader className="spinner" size={20} />
                <span>Discovering USB cameras...</span>
              </div>
            ) : usbCameras.length > 0 ? (
              <div className="cameras-list">
                {usbCameras.map((camera) => (
                  <div
                    key={camera.deviceId}
                    className={`camera-item ${
                      selectedUsbCamera?.deviceId === camera.deviceId ? 'selected' : ''
                    }`}
                    onClick={() => handleUsbCameraSelect(camera)}
                  >
                    <div className="camera-info">
                      <h4>{camera.deviceName}</h4>
                      <p className="camera-details">Device ID: {camera.deviceId}</p>
                    </div>
                    {selectedUsbCamera?.deviceId === camera.deviceId && (
                      <div className="selected-indicator">✓</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-cameras">No USB cameras found</p>
            )}
            <Button onClick={discoverUsbCameras} disabled={loadingUsb} className="refresh-btn">
              Refresh USB
            </Button>
          </div>

          {/* ASCOM Cameras Section */}
          <div className="camera-section">
            <h3>
              <Camera size={20} />
              ASCOM Cameras
            </h3>
            {loadingAscom ? (
              <div className="loading-inline">
                <Loader className="spinner" size={20} />
                <span>Discovering ASCOM cameras...</span>
              </div>
            ) : ascomCameras.length > 0 ? (
              <div className="cameras-list">
                {ascomCameras.map((camera) => (
                  <div
                    key={camera.uniqueID}
                    className={`camera-item ${
                      selectedAscomCamera?.uniqueID === camera.uniqueID ? 'selected' : ''
                    }`}
                    onClick={() => handleAscomCameraSelect(camera)}
                  >
                    <div className="camera-info">
                      <h4>{camera.deviceName}</h4>
                      <p className="camera-details">
                        {camera.ipAddress}:{camera.port} • Device #{camera.deviceNumber}
                      </p>
                    </div>
                    {selectedAscomCamera?.uniqueID === camera.uniqueID && (
                      <div className="selected-indicator">✓</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-cameras">No ASCOM cameras found</p>
            )}
            <Button onClick={discoverAscomCameras} disabled={loadingAscom} className="refresh-btn">
              Refresh ASCOM
            </Button>
          </div>

          {/* IP Camera Section */}
          <div className="camera-section">
            <h3>
              <Wifi size={20} />
              IP/RTSP Camera
            </h3>
            <p className="ip-camera-description">
              Enter the RTSP or HTTP stream URL for an IP camera:
            </p>
            <input
              type="text"
              className="ip-url-input"
              placeholder="rtsp://192.168.1.100:554/stream or http://camera-ip/mjpeg"
              value={ipStreamUrl}
              onChange={(e) => handleIpUrlChange(e.target.value)}
            />
            <p className="ip-camera-hint">
              Example: rtsp://admin:password@192.168.1.100:554/stream
            </p>
          </div>

          {/* Placeholder Section */}
          <div className="camera-section">
            <h3>
              <Image size={20} />
              Use Placeholder Image
            </h3>
            <p className="placeholder-description">
              Keep using the 2MASS all-sky survey image. You can change this later by clicking the image.
            </p>
            <div
              className={`placeholder-option ${selectedType === 'placeholder' ? 'selected' : ''}`}
              onClick={() => {
                setSelectedType('placeholder');
                setSelectedUsbCamera(null);
                setSelectedAscomCamera(null);
              }}
            >
              <div className="placeholder-info">
                <h4>2MASS All-Sky Survey</h4>
                <p className="placeholder-details">Static wide-field sky view</p>
              </div>
              {selectedType === 'placeholder' && (
                <div className="selected-indicator">✓</div>
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <Button onClick={onClose} className="cancel-btn" disabled={connecting}>
            Cancel
          </Button>
          <Button
            onClick={handleConnect}
            disabled={isConnectDisabled}
            className="connect-btn"
          >
            {connecting ? (
              <>
                <Loader className="spinner" size={16} />
                {selectedType === 'placeholder' ? 'Applying...' : 'Connecting...'}
              </>
            ) : (
              selectedType === 'placeholder' ? 'Use Placeholder' : 'Connect to Camera'
            )}
          </Button>
        </div>
      </Panel>
    </div>
  );
}
