import { useState, useEffect } from 'react';
import './AllSkyView.css';
import { useAllSkyCameraContext } from '@/contexts/AllSkyCameraContext';
import AllSkyCameraConnectionModal from '@/components/AllSkyCameraConnectionModal/AllSkyCameraConnectionModal';
import allSkyCameraAPI from '@/services/allSkyCameraAPI';
import Button from '@/components/Button/Button';
import { Camera, X } from 'lucide-react';

export default function AllSkyView() {
    const [modalOpen, setModalOpen] = useState(false);
    const [frameUrl, setFrameUrl] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const {
        cameraConnected,
        connectedCameraType,
        connectedCameraName,
        streamUrl,
        setCameraConnected,
        setConnectedCameraType,
        setConnectedCameraName,
        setStreamUrl,
        setUsbCameraId,
    } = useAllSkyCameraContext();

    // Using CDS HiPS2FITS service to generate a wide-field sky image (fallback)
    const allSkyImageUrl = 'https://alasky.cds.unistra.fr/hips-image-services/hips2fits?' +
    'hips=CDS/P/2MASS/color&' +
    'width=600&' +
    'height=400&' +
    'projection=TAN&' +
    'coordsys=icrs&' +
    'ra=0&' +
    'dec=0&' +
    'fov=60&' +
    'format=png';

    // Auto-refresh camera feed for USB and ASCOM cameras
    useEffect(() => {
        if (!cameraConnected || !connectedCameraType) return;

        if (connectedCameraType === 'ip' && streamUrl) {
            // For IP cameras, use the stream URL directly
            setFrameUrl(streamUrl);
            return;
        }

        if (connectedCameraType === 'usb' || connectedCameraType === 'ascom') {
            // Poll for frames from USB/ASCOM cameras
            const interval = setInterval(() => {
                setRefreshKey(prev => prev + 1);
            }, 1000); // Refresh every 1 second

            return () => clearInterval(interval);
        }
    }, [cameraConnected, connectedCameraType, streamUrl]);

    useEffect(() => {
        if (cameraConnected && (connectedCameraType === 'usb' || connectedCameraType === 'ascom')) {
            const url = allSkyCameraAPI.getFrameUrl(connectedCameraType);
            setFrameUrl(`${url}&t=${Date.now()}`);
        }
    }, [refreshKey, cameraConnected, connectedCameraType]);

    const handleDisconnect = async () => {
        if (!connectedCameraType) return;

        try {
            await allSkyCameraAPI.disconnectCamera(connectedCameraType);
            setCameraConnected(false);
            setConnectedCameraType(null);
            setConnectedCameraName(null);
            setStreamUrl(null);
            setUsbCameraId(null);
            setFrameUrl(null);
        } catch (error) {
            console.error('Failed to disconnect camera:', error);
        }
    };

    return (
        <>
            <div
                className={`allsky-view__wrapper ${!cameraConnected ? 'clickable' : ''}`}
                onClick={!cameraConnected ? () => setModalOpen(true) : undefined}
            >
                {cameraConnected && frameUrl ? (
                    <div className="allsky-view__camera-feed">
                        <img
                            alt="All-Sky Camera Feed"
                            src={frameUrl}
                            className="camera-frame"
                        />
                        <div className="camera-overlay">
                            <div className="camera-info">
                                <Camera size={16} />
                                <span>{connectedCameraName}</span>
                            </div>
                            <Button onClick={handleDisconnect} className="disconnect-btn">
                                <X size={16} />
                                Disconnect
                            </Button>
                        </div>
                    </div>
                ) : cameraConnected ? (
                    <div className="allsky-view__connecting">
                        <p>Connecting to camera...</p>
                    </div>
                ) : (
                    <div className="allsky-view__placeholder">
                        <img
                            alt="Wide-Field Sky View from 2MASS Survey"
                            src={allSkyImageUrl}
                        />
                        <div className="allsky-view__overlay">
                            <Camera size={32} />
                            <p>Click to connect all-sky camera</p>
                        </div>
                    </div>
                )}
            </div>
            <AllSkyCameraConnectionModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
            />
        </>
    );
}