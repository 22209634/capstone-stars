import './CameraPreviewControls.css';
import Panel from '@/components/Panel/Panel.tsx';
import Button from '@/components/Button/Button.tsx';
import { PlayCircle, StopCircle, RefreshCw, Camera } from 'lucide-react';
import { useState, useEffect } from 'react';

interface CameraPreviewControlsProps {
    onStartPreview: () => void;
    onStopPreview: () => void;
    onRefresh: () => void;
}

export default function CameraPreviewControls({ onStartPreview, onStopPreview, onRefresh }: CameraPreviewControlsProps) {
    const [isStreaming, setIsStreaming] = useState(false);
    const [cameraConnected, setCameraConnected] = useState(false);

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

    // Listen for streaming state from parent via storage event or custom event
    useEffect(() => {
        const handleStreamingChange = (e: CustomEvent) => {
            setIsStreaming(e.detail.isStreaming);
        };

        window.addEventListener('cameraStreamingChange' as any, handleStreamingChange as any);
        return () => window.removeEventListener('cameraStreamingChange' as any, handleStreamingChange as any);
    }, []);

    const handleStart = () => {
        setIsStreaming(true);
        onStartPreview();
    };

    const handleStop = () => {
        setIsStreaming(false);
        onStopPreview();
    };

    const handleRefreshClick = () => {
        onRefresh();
    };

    return (
        <Panel className="camera-preview-controls__panel">
            <div className="camera-preview-controls__wrapper">
                <h3 className="camera-preview-controls__title">
                    <Camera size={20} />
                    Live Preview
                </h3>

                <div className="camera-preview-controls__status">
                    <div className={`status-indicator ${cameraConnected ? 'connected' : 'disconnected'}`}>
                        <span className={`status-dot ${cameraConnected ? 'connected' : 'disconnected'}`}></span>
                        {cameraConnected ? 'Camera Connected' : 'Camera Disconnected'}
                    </div>
                    {isStreaming && (
                        <div className="streaming-badge">
                            <span className="streaming-dot"></span>
                            Streaming
                        </div>
                    )}
                </div>

                <div className="camera-preview-controls__buttons">
                    {!isStreaming ? (
                        <Button
                            className="preview-btn start-preview-btn"
                            borderRadius="5px"
                            onClick={handleStart}
                            disabled={!cameraConnected}
                        >
                            <PlayCircle size={18} />
                            Start Preview
                        </Button>
                    ) : (
                        <Button
                            className="preview-btn stop-preview-btn"
                            borderRadius="5px"
                            onClick={handleStop}
                        >
                            <StopCircle size={18} />
                            Stop Preview
                        </Button>
                    )}

                    <Button
                        className="preview-btn refresh-preview-btn"
                        borderRadius="5px"
                        onClick={handleRefreshClick}
                        disabled={!cameraConnected}
                    >
                        <RefreshCw size={16} />
                    </Button>
                </div>

                <div className="camera-preview-controls__info">
                    <p className="info-text">
                        {!cameraConnected && "Connect a camera to start live preview"}
                        {cameraConnected && !isStreaming && "Click Start Preview to begin"}
                        {cameraConnected && isStreaming && "Live preview active (~1 FPS)"}
                    </p>
                </div>
            </div>
        </Panel>
    );
}
