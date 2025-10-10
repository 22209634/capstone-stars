import './TelescopeChooser.css';
import { useState, useEffect } from 'react';
import Button from '@/components/Button/Button.tsx';
import { X } from 'lucide-react';

interface Telescope {
    id: string;
    name: string;
}

interface TelescopeChooserProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (driverId: string) => void;
}

export default function TelescopeChooser({ isOpen, onClose, onSelect }: TelescopeChooserProps) {
    const [telescopes, setTelescopes] = useState<Telescope[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadTelescopes();
        }
    }, [isOpen]);

    const loadTelescopes = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:8000/api/telescope/chooser/list');
            const data = await response.json();

            if (data.success) {
                setTelescopes(data.data.telescopes);
                if (data.data.telescopes.length === 0) {
                    setError('No ASCOM telescopes found. Please install ASCOM drivers.');
                }
            } else {
                setError(data.message || 'Failed to load telescopes');
            }
        } catch (err) {
            console.error('Error loading telescopes:', err);
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
            const response = await fetch('http://localhost:8000/api/telescope/chooser', {
                method: 'POST'
            });
            const data = await response.json();

            if (data.success && data.data) {
                onSelect(data.data.driverId);
                onClose();
            } else {
                setError(data.message || 'No telescope selected');
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
        <div className="telescope-chooser-overlay" onClick={onClose}>
            <div className="telescope-chooser-modal" onClick={(e) => e.stopPropagation()}>
                <div className="telescope-chooser-header">
                    <h2>Select ASCOM Telescope</h2>
                    <button className="telescope-chooser-close" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="telescope-chooser-content">
                    {loading && (
                        <div className="telescope-chooser-loading">
                            Loading telescopes...
                        </div>
                    )}

                    {error && (
                        <div className="telescope-chooser-error">
                            {error}
                        </div>
                    )}

                    {!loading && !error && telescopes.length > 0 && (
                        <div className="telescope-chooser-list">
                            <p className="telescope-chooser-instruction">
                                Select a telescope from the list below:
                            </p>
                            {telescopes.map((telescope) => (
                                <div
                                    key={telescope.id}
                                    className={`telescope-chooser-item ${selectedId === telescope.id ? 'selected' : ''}`}
                                    onClick={() => setSelectedId(telescope.id)}
                                >
                                    <div className="telescope-chooser-item-name">
                                        {telescope.name}
                                    </div>
                                    <div className="telescope-chooser-item-id">
                                        {telescope.id}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="telescope-chooser-buttons">
                        <Button
                            borderRadius="5px"
                            onClick={handleShowChooser}
                            disabled={loading}
                        >
                            Use ASCOM Chooser Dialog
                        </Button>

                        {telescopes.length > 0 && (
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
