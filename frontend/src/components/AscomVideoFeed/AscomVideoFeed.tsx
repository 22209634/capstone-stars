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
    const [imageUrl, setImageUrl] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Continuous image capture when camera is connected
    useEffect(() => {
        if (!cameraConnected) {
            setImageUrl('');
            return;
        }

        // Start capturing images continuously with exponential backoff on errors
        let isMounted = true;
        let currentUrl = '';
        let consecutiveErrors = 0;
        let abortController: AbortController | null = null;
        // Retry delays in milliseconds: 10s, 15s, 30s, 1min, 5min
        const retryDelays = [10000, 15000, 30000, 60000, 300000];

        const captureLoop = async () => {
            console.log('[AscomVideoFeed] Starting continuous capture loop');
            while (isMounted) {
                try {
                    // Check if still connected before each capture attempt
                    if (!isMounted) break;

                    // Create new abort controller for this request
                    abortController = new AbortController();

                    // Fetch new image with 0.5 second exposure
                    const response = await fetch('http://localhost:8000/api/camera/capture?exposure=0.5', {
                        signal: abortController.signal
                    });

                    if (response.ok) {
                        const blob = await response.blob();
                        const url = URL.createObjectURL(blob);

                        // Revoke old URL to prevent memory leaks
                        if (currentUrl) {
                            URL.revokeObjectURL(currentUrl);
                        }

                        currentUrl = url;
                        setImageUrl(url);
                        setError(null);
                        consecutiveErrors = 0; // Reset error count on success

                        // Wait 500ms between successful captures (check if still mounted)
                        if (isMounted) {
                            await new Promise(resolve => setTimeout(resolve, 500));
                        }
                    } else {
                        throw new Error(response.statusText);
                    }
                } catch (err) {
                    // Don't retry if the request was aborted (user disconnected)
                    if (err instanceof Error && err.name === 'AbortError') {
                        console.log('[AscomVideoFeed] Capture aborted');
                        break;
                    }

                    consecutiveErrors++;
                    const delayIndex = Math.min(consecutiveErrors - 1, retryDelays.length - 1);
                    const retryDelay = retryDelays[delayIndex];
                    const retrySeconds = retryDelay / 1000;

                    console.error(`Failed to capture image (attempt ${consecutiveErrors}):`, err);
                    setError(`Failed to capture image. Retrying in ${retrySeconds}s...`);

                    // Wait before retry with exponential backoff (break early if unmounted)
                    const startTime = Date.now();
                    while (isMounted && (Date.now() - startTime) < retryDelay) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                }
            }
            console.log('[AscomVideoFeed] Stopped continuous capture loop');
        };

        captureLoop();

        // Cleanup
        return () => {
            isMounted = false;
            // Abort any ongoing fetch request
            if (abortController) {
                abortController.abort();
            }
            if (currentUrl) {
                URL.revokeObjectURL(currentUrl);
            }
        };
    }, [cameraConnected]);

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
                                    <span>CAPTURING</span>
                                </div>
                                <p className="info-text">
                                    Waiting for first image...
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