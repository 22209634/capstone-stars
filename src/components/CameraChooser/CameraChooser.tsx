import './CameraChooser.css';
import { useState, useEffect } from 'react';
import Button from '@/components/Button/Button.tsx';
import { X } from 'lucide-react';

interface Camera {
    id: string;
    name: string;
}

interface CameraChooserProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (driverId: string) => void;
}

export default function CameraChooser({ isOpen, onClose, onSelect }: CameraChooserProps) {
    const [cameras, setCameras] = useState<Camera[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadCameras();
        }
    }, [isOpen]);

    const loadCameras = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:8000/api/camera/chooser/list');
            const data = await response.json();

            if (data.success) {
                setCameras(data.data.cameras);
                if (data.data.cameras.length === 0) {
                    setError('No ASCOM cameras found. Please install ASCOM camera drivers.');
                }
            } else {
                setError(data.message || 'Failed to load cameras');
            }
        } catch (err) {
            console.error('Error loading cameras:', err);
            setError('Failed to connect to server. Make sure the telescope server is running.');
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = () => {
        if (selectedId) {
            onSelect(selectedId);
            onClose();
        }
    };

    const handleShowChooser = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:8000/api/camera/chooser', {
                method: 'POST'
            });
            const data = await response.json();

            if (data.success && data.data) {
                onSelect(data.data.driverId);
                onClose();
            } else {
                setError(data.message || 'No camera selected');
            }
        } catch (err) {
            console.error('Error showing chooser:', err);
            setError('Failed to show ASCOM chooser dialog');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="camera-chooser-overlay" onClick={onClose}>
            <div className="camera-chooser-modal" onClick={(e) => e.stopPropagation()}>
                <div className="camera-chooser-header">
                    <h2>Select ASCOM Camera</h2>
                    <button className="camera-chooser-close" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="camera-chooser-content">
                    {loading && (
                        <div className="camera-chooser-loading">
                            Loading cameras...
                        </div>
                    )}

                    {error && (
                        <div className="camera-chooser-error">
                            {error}
                        </div>
                    )}

                    {!loading && !error && cameras.length > 0 && (
                        <div className="camera-chooser-list">
                            <p className="camera-chooser-instruction">
                                Select a camera from the list below:
                            </p>
                            {cameras.map((camera) => (
                                <div
                                    key={camera.id}
                                    className={`camera-chooser-item ${selectedId === camera.id ? 'selected' : ''}`}
                                    onClick={() => setSelectedId(camera.id)}
                                >
                                    <div className="camera-chooser-item-name">
                                        {camera.name}
                                    </div>
                                    <div className="camera-chooser-item-id">
                                        {camera.id}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="camera-chooser-buttons">
                        <Button
                            borderRadius="5px"
                            onClick={handleShowChooser}
                            disabled={loading}
                        >
                            Use ASCOM Chooser Dialog
                        </Button>

                        {cameras.length > 0 && (
                            <Button
                                borderRadius="5px"
                                onClick={handleSelect}
                                disabled={!selectedId || loading}
                            >
                                Connect to Selected
                            </Button>
                        )}

                        <Button
                            borderRadius="5px"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
