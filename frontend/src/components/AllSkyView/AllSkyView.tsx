import { useState, useEffect } from 'react';
import './AllSkyView.css';
import { useAllSkyCameraContext } from '@/contexts/AllSkyCameraContext';
import { useTelescopeContext } from '@/contexts/TelescopeContext';
import AllSkyCameraConnectionModal from '@/components/AllSkyCameraConnectionModal/AllSkyCameraConnectionModal';
import allSkyCameraAPI from '@/services/allSkyCameraAPI';
import Button from '@/components/Button/Button';
import { Camera, X } from 'lucide-react';

export default function AllSkyView() {
    const [modalOpen, setModalOpen] = useState(false);
    const [frameUrl, setFrameUrl] = useState<string | null>(null);

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

    const { connectionMode } = useTelescopeContext();

    // Check if telescope is connected (not in simulation mode)
    const isTelescopeConnected = connectionMode === 'ascom';

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

    // Set up camera feed URL based on camera type
    useEffect(() => {
        if (!cameraConnected || !connectedCameraType) {
            setFrameUrl(null);
            return;
        }

        if (connectedCameraType === 'ip' && streamUrl) {
            // For IP cameras, use the stream URL directly
            setFrameUrl(streamUrl);
        } else if (connectedCameraType === 'usb' || connectedCameraType === 'ascom') {
            // For USB/ASCOM cameras, use MJPEG streaming endpoint
            const url = allSkyCameraAPI.getStreamUrl(connectedCameraType);
            setFrameUrl(url);
        }
    }, [cameraConnected, connectedCameraType, streamUrl]);

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
                className={`allsky-view__wrapper ${!cameraConnected && isTelescopeConnected ? 'clickable' : ''}`}
                onClick={!cameraConnected && isTelescopeConnected ? () => setModalOpen(true) : undefined}
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
                        {isTelescopeConnected && (
                            <div className="allsky-view__overlay">
                                <Camera size={32} />
                                <p>Click to connect all-sky camera</p>
                            </div>
                        )}
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