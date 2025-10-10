import './CameraLiveView.css';
import { useState, useEffect } from 'react';
import { Camera, PlayCircle, StopCircle, RefreshCw } from 'lucide-react';

export default function CameraLiveView() {
    const [isStreaming, setIsStreaming] = useState(false);
    const [lastImage, setLastImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [cameraConnected, setCameraConnected] = useState(false);
    const [isCapturing, setIsCapturing] = useState(false);

    console.log('CameraLiveView render - isStreaming:', isStreaming, 'cameraConnected:', cameraConnected);

    // Check camera connection status
    useEffect(() => {
        const checkCameraStatus = async () => {
            try {
                const response = await fetch('http://localhost:8000/api/camera/status');
                const result = await response.json();
                setCameraConnected(result.success && result.data?.connected);
            } catch (err) {
                setCameraConnected(false);
            }
        };

        checkCameraStatus();
        const interval = setInterval(checkCameraStatus, 3000);
        return () => clearInterval(interval);
    }, []);

    // Expose streaming controls to parent via custom events
    useEffect(() => {
        const event = new CustomEvent('cameraStreamingChange', {
            detail: { isStreaming }
        });
        window.dispatchEvent(event);
    }, [isStreaming]);

    // Listen for external control events
    useEffect(() => {
        const handleStartPreview = () => {
            if (cameraConnected) {
                setIsStreaming(true);
                setError(null);
            }
        };

        const handleStopPreview = () => {
            setIsStreaming(false);
        };

        const handleRefreshPreview = () => {
            setLastImage(null);
            setError(null);
            if (isStreaming) {
                setIsStreaming(false);
                setTimeout(() => setIsStreaming(true), 100);
            }
        };

        window.addEventListener('startCameraPreview' as any, handleStartPreview);
        window.addEventListener('stopCameraPreview' as any, handleStopPreview);
        window.addEventListener('refreshCameraPreview' as any, handleRefreshPreview);

        return () => {
            window.removeEventListener('startCameraPreview' as any, handleStartPreview);
            window.removeEventListener('stopCameraPreview' as any, handleStopPreview);
            window.removeEventListener('refreshCameraPreview' as any, handleRefreshPreview);
        };
    }, [cameraConnected, isStreaming]);

    // Live preview loop
    useEffect(() => {
        if (!isStreaming || !cameraConnected) return;

        let isCancelled = false;

        const captureFrame = async () => {
            if (isCancelled || isCapturing) return;

            setIsCapturing(true);
            try {
                const response = await fetch('http://localhost:8000/api/camera/preview', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        exposureTime: 0.5 // Short exposure for live view
                    })
                });

                if (!response.ok) {
                    throw new Error('Failed to capture preview');
                }

                const result = await response.json();

                if (result.success && result.data?.image_base64) {
                    setLastImage(`data:image/png;base64,${result.data.image_base64}`);
                    setError(null);
                } else {
                    setError(result.message || 'Failed to get preview image');
                }
            } catch (err) {
                console.error('Preview error:', err);
                setError('Failed to capture preview frame');
            } finally {
                setIsCapturing(false);

                // Queue next frame after a short delay
                if (!isCancelled && isStreaming) {
                    setTimeout(() => {
                        if (!isCancelled) captureFrame();
                    }, 1000); // 1 second between frames
                }
            }
        };

        captureFrame();

        return () => {
            isCancelled = true;
        };
    }, [isStreaming, cameraConnected]);

    const handleStartPreview = () => {
        if (cameraConnected) {
            setIsStreaming(true);
            setError(null);
        } else {
            setError('Camera not connected');
        }
    };

    const handleStopPreview = () => {
        setIsStreaming(false);
    };

    const handleRefresh = () => {
        setLastImage(null);
        setError(null);
        if (isStreaming) {
            setIsStreaming(false);
            setTimeout(() => setIsStreaming(true), 100);
        }
    };

    return (
        <div className="camera-live-view">
            <div className="camera-live-view__content">
                {!cameraConnected && (
                    <div className="camera-live-view__message">
                        <Camera size={48} />
                        <p>Camera Not Connected</p>
                        <span>Connect a camera to start live preview</span>
                    </div>
                )}

                {cameraConnected && !isStreaming && !lastImage && (
                    <div className="camera-live-view__message">
                        <PlayCircle size={48} />
                        <p>Live Preview Stopped</p>
                        <span>Click "Start Preview" to begin</span>
                    </div>
                )}

                {error && (
                    <div className="camera-live-view__error">
                        <p>Error: {error}</p>
                    </div>
                )}

                {lastImage && (
                    <div className="camera-live-view__frame">
                        <img
                            src={lastImage}
                            alt="Camera preview"
                            className="camera-live-view__image"
                        />
                        {isStreaming && isCapturing && (
                            <div className="camera-live-view__capturing">
                                Capturing...
                            </div>
                        )}
                    </div>
                )}

                {isStreaming && !lastImage && !error && (
                    <div className="camera-live-view__message">
                        <div className="loading-spinner"></div>
                        <p>Loading preview...</p>
                    </div>
                )}
            </div>

            <div className="camera-live-view__footer">
                <div className="status-indicator">
                    <span className={`status-dot ${cameraConnected ? 'connected' : 'disconnected'}`}></span>
                    {cameraConnected ? 'Camera Connected' : 'Camera Disconnected'}
                </div>
                {isStreaming && (
                    <div className="streaming-indicator">
                        <span className="streaming-dot"></span>
                        Live Streaming
                    </div>
                )}
            </div>
        </div>
    );
}
