import './Topbar.css'
import Panel from '@/components/Panel/Panel.tsx'
import Button from '@/components/Button/Button.tsx'
import StatusLine from '@/components/Topbar/StatusLine/StatusLine.tsx'
import TelescopeConnectionModal from '@/components/TelescopeConnectionModal/TelescopeConnectionModal'
import ImageGalleryModal, { type CapturedImage } from '@/components/ImageGalleryModal/ImageGalleryModal'
import { Camera, Telescope, Wifi, Images } from 'lucide-react'
import { useState } from 'react'
import { useTelescopeContext } from '@/contexts/TelescopeContext'
import { useCameraContext } from '@/contexts/CameraContext'
import telescopeAPI, { type AscomDevice } from '@/services/telescopeAPI'
import cameraAPI from '@/services/cameraAPI'

export default function Topbar() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [capturedImages, setCapturedImages] = useState<CapturedImage[]>([]);
    const [isCapturing, setIsCapturing] = useState(false);
    const { connectionMode, setConnectionMode, connectedDevice, setConnectedDevice, ra, dec, aladinInstance } = useTelescopeContext();
    const { setCameraConnected, setConnectedCamera, cameraConnected } = useCameraContext();

    const handleConnect = async (device: AscomDevice) => {
        setIsConnecting(true);
        try {
            const response = await telescopeAPI.connectToAscomDevice(
                device.uniqueID,
                device.ipAddress,
                device.port,
                device.deviceNumber
            );

            if (response.success) {
                setConnectionMode('ascom');
                setConnectedDevice(device.deviceName);
            } else {
                alert(`Failed to connect: ${response.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Connection error:', error);
            alert('Failed to connect to telescope. Please try again.');
        } finally {
            setIsConnecting(false);
        }
    };

    const handleDisconnect = async () => {
        try {
            // Disconnect from telescope
            await telescopeAPI.disconnectAscom();
            setConnectionMode('simulation');
            setConnectedDevice(null);

            // Also disconnect from camera if connected
            try {
                await cameraAPI.disconnectAscomCamera();
                setCameraConnected(false);
                setConnectedCamera(null);
                console.log('Disconnected from camera');
            } catch (cameraError) {
                console.error('Error disconnecting camera:', cameraError);
            }
        } catch (error) {
            console.error('Disconnect error:', error);
        }
    };

    const handleCapture = async () => {
        setIsCapturing(true);
        try {
            let imageBlob: Blob;

            if (connectionMode === 'simulation') {
                // Simulation mode: Download image from Aladin HiPS at current coordinates
                // Get the current FOV from the Aladin instance
                const currentFov = aladinInstance ? aladinInstance.getFov()[0] : 2;

                const hipsUrl = `https://alasky.cds.unistra.fr/hips-image-services/hips2fits?hips=CDS/P/DSS2/color&width=800&height=800&ra=${ra}&dec=${dec}&fov=${currentFov}&projection=TAN&format=jpg`;

                const response = await fetch(hipsUrl);
                if (!response.ok) {
                    throw new Error('Failed to capture image from Aladin HiPS');
                }
                imageBlob = await response.blob();
            } else {
                // ASCOM mode: Capture from connected camera
                if (!cameraConnected) {
                    alert('Please connect to a camera first');
                    return;
                }
                imageBlob = await cameraAPI.captureImage(0.5);
            }

            // Create a URL for the blob
            const imageUrl = URL.createObjectURL(imageBlob);

            // Create captured image object
            const capturedImage: CapturedImage = {
                id: `img-${Date.now()}`,
                url: imageUrl,
                timestamp: new Date(),
                ra,
                dec,
                mode: connectionMode
            };

            // Add to gallery
            setCapturedImages(prev => [capturedImage, ...prev]);

            console.log('Image captured successfully');
        } catch (error) {
            console.error('Error capturing image:', error);
            alert('Failed to capture image. Please try again.');
        } finally {
            setIsCapturing(false);
        }
    };

    return (
        <>
            <Panel className="topbar__panel" borderRadius="3px">
                <div className="topbar__items-wrapper">
                    <h1 className="logo">STARS System v0.1</h1>
                    <StatusLine />
                    <div className="topbar-right">
                        <input type="text" placeholder=" Search..." />

                        {connectionMode === 'simulation' ? (
                            <Button
                                className="telescope-connect-btn"
                                onClick={() => setIsModalOpen(true)}
                                disabled={isConnecting}
                            >
                                <Telescope size={18} />
                                Connect to Telescope
                            </Button>
                        ) : (
                            <div className="connection-status">
                                <Button
                                    className="telescope-connected-btn"
                                    onClick={handleDisconnect}
                                >
                                    <Wifi size={18} />
                                    {connectedDevice || 'Connected'}
                                </Button>
                            </div>
                        )}

                        <Button
                            className="capture-btn"
                            onClick={handleCapture}
                            disabled={isCapturing}
                        >
                            <Camera /> {isCapturing ? 'Capturing...' : 'Capture'}
                        </Button>

                        {capturedImages.length > 0 && (
                            <Button
                                className="gallery-btn"
                                onClick={() => setIsGalleryOpen(true)}
                            >
                                <Images size={18} />
                            </Button>
                        )}
                    </div>
                </div>
            </Panel>

            <TelescopeConnectionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConnect={handleConnect}
            />

            <ImageGalleryModal
                isOpen={isGalleryOpen}
                onClose={() => setIsGalleryOpen(false)}
                images={capturedImages}
            />
        </>
    )
}