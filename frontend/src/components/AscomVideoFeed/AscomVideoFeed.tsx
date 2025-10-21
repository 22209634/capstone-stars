import { useEffect, useState } from 'react';
import './AscomVideoFeed.css';
import { useCameraContext } from '@/contexts/CameraContext';
import CameraConnectionModal from '@/components/CameraConnectionModal/CameraConnectionModal';
import type { AscomCamera } from '@/services/cameraAPI';
import cameraAPI from '@/services/cameraAPI';
import Button from '@/components/Button/Button';
import { Camera, Power } from 'lucide-react';

export default function AscomVideoFeed() {
    const { connectedCamera, setConnectedCamera, cameraConnected, setCameraConnected } = useCameraContext();
    const [imageUrl] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        // Future: Implement image capture and display here
        setError(null);
    }, [connectedCamera]);

    // Set telescope-view to z-index 0 when this component mounts (ASCOM mode)
    // and reset to -1 when it unmounts (going back to simulation mode)
    useEffect(() => {
        const telescopeView = document.querySelector('.telescope-view') as HTMLElement;
        console.log('[AscomVideoFeed] Component mounted, setting telescope-view z-index to 0');

        if (telescopeView) {
            telescopeView.style.zIndex = '0';
        }

        // Reset when component unmounts
        return () => {
            console.log('[AscomVideoFeed] Component unmounting, resetting telescope-view z-index to -1');
            if (telescopeView) {
                telescopeView.style.zIndex = '-1';
            }
        };
    }, []);

    const handleConnect = async (camera: AscomCamera) => {
        try {
            const response = await cameraAPI.connectToAscomCamera(
                camera.uniqueID,
                camera.ipAddress,
                camera.port,
                camera.deviceNumber
            );

            if (response.success) {
                setConnectedCamera(camera.deviceName);
                setCameraConnected(true);
                console.log('Connected to ASCOM camera:', camera.deviceName);
            } else {
                setError(response.message || 'Failed to connect to camera');
            }
        } catch (err) {
            console.error('Error connecting to camera:', err);
            setError('Failed to connect to camera. Please try again.');
        }
    };

    const handleDisconnect = async () => {
        try {
            const response = await cameraAPI.disconnectAscomCamera();
            if (response.success) {
                setConnectedCamera(null);
                setCameraConnected(false);
                console.log('Disconnected from ASCOM camera');
            }
        } catch (err) {
            console.error('Error disconnecting from camera:', err);
        }
    };

    return (
        <div className="ascom-video-feed">
            <CameraConnectionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConnect={handleConnect}
            />

            {error ? (
                <div className="feed-error">
                    <p>{error}</p>
                </div>
            ) : imageUrl ? (
                <img
                    src={imageUrl}
                    alt="Live camera feed"
                    className="video-stream"
                />
            ) : (
                <div className="feed-placeholder">
                    <div className="placeholder-content">
                        {cameraConnected ? (
                            <>
                                <Camera size={48} />
                                <h3>ASCOM Camera Connected</h3>
                                <p>Connected to: {connectedCamera}</p>
                                <div className="live-indicator">
                                    <span className="pulse"></span>
                                    <span>READY</span>
                                </div>
                                <p className="info-text">
                                    Camera is ready for imaging.
                                    <br />
                                    Image capture will be implemented next.
                                </p>
                                <Button onClick={handleDisconnect} className="disconnect-btn">
                                    <Power size={16} />
                                    Disconnect Camera
                                </Button>
                            </>
                        ) : (
                            <>
                                <Camera size={48} />
                                <h3>No Camera Connected</h3>
                                <p className="info-text">
                                    Connect to an ASCOM camera to view live feed.
                                </p>
                                <Button onClick={() => setIsModalOpen(true)} className="connect-btn">
                                    <Camera size={16} />
                                    Connect to Camera
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}