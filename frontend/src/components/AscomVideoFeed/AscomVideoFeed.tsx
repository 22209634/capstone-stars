import { useEffect, useState } from 'react';
import './AscomVideoFeed.css';
import { useTelescopeContext } from '@/contexts/TelescopeContext';

export default function AscomVideoFeed() {
    const { connectedDevice } = useTelescopeContext();
    const [imageUrl] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // In a real implementation, this would connect to the ASCOM camera device
        // and display the live video feed. For now, we'll show a placeholder.

        // Example: If your ASCOM setup has a camera with streaming capability:
        // Uncomment the line below and replace with actual camera URL
        // setImageUrl('http://<telescope-ip>:<camera-port>/stream');

        setError(null);
    }, [connectedDevice]);

    return (
        <div className="ascom-video-feed">
            {error ? (
                <div className="feed-error">
                    <p>{error}</p>
                </div>
            ) : imageUrl ? (
                <img
                    src={imageUrl}
                    alt="Live telescope feed"
                    className="video-stream"
                />
            ) : (
                <div className="feed-placeholder">
                    <div className="placeholder-content">
                        <h3>ASCOM Telescope Connected</h3>
                        <p>Connected to: {connectedDevice}</p>
                        <div className="live-indicator">
                            <span className="pulse"></span>
                            <span>LIVE</span>
                        </div>
                        <p className="info-text">
                            Video feed integration requires ASCOM Camera device.
                            <br />
                            Configure camera streaming in telescope settings.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}