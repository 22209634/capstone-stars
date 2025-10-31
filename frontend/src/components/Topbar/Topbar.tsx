import './Topbar.css'
import Panel from '@/components/Panel/Panel.tsx'
import Button from '@/components/Button/Button.tsx'
import StatusLine from '@/components/Topbar/StatusLine/StatusLine.tsx'
import TelescopeConnectionModal from '@/components/TelescopeConnectionModal/TelescopeConnectionModal'
import ImageGalleryModal, { type CapturedImage } from '@/components/ImageGalleryModal/ImageGalleryModal'
import CelestialObjectModal from '@/components/CelestialObjectModal/CelestialObjectModal'
import { Camera, Telescope, Wifi, Images, Search } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useTelescopeContext } from '@/contexts/TelescopeContext'
import { useCameraContext } from '@/contexts/CameraContext'
import telescopeAPI, { type AscomDevice } from '@/services/telescopeAPI'
import cameraAPI from '@/services/cameraAPI'
import searchAPI from '@/services/searchAPI'
import type { AstronomicalObject } from '@/types/objectList.types'

export default function Topbar() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [capturedImages, setCapturedImages] = useState<CapturedImage[]>([]);
    const [isCapturing, setIsCapturing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<AstronomicalObject[]>([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedObject, setSelectedObject] = useState<AstronomicalObject | null>(null);
    const [isObjectModalOpen, setIsObjectModalOpen] = useState(false);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const searchContainerRef = useRef<HTMLDivElement>(null);

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

    // Search handlers
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);

        // Clear previous timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        // Don't search if query is empty
        if (!query.trim()) {
            setSearchResults([]);
            setShowSearchResults(false);
            return;
        }

        // Debounce search - wait 500ms after user stops typing
        setIsSearching(true);
        searchTimeoutRef.current = setTimeout(async () => {
            try {
                const response = await searchAPI.searchObjects(query, 5);
                if (response.success) {
                    setSearchResults(response.data);
                    setShowSearchResults(true);
                }
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setIsSearching(false);
            }
        }, 500);
    };

    const handleSearchResultClick = (obj: AstronomicalObject) => {
        setSelectedObject(obj);
        setIsObjectModalOpen(true);
        setShowSearchResults(false);
        setSearchQuery('');
    };

    const handleObjectModalClose = () => {
        setIsObjectModalOpen(false);
        setSelectedObject(null);
    };

    // Close search results when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setShowSearchResults(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
                        <div className="search-container" ref={searchContainerRef}>
                            <div className="search-input-wrapper">
                                <Search size={16} className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search by name (e.g., Andromeda, M31) or coordinates (e.g., 10.68 +41.27)..."
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                    className="search-input"
                                />
                                {isSearching && <span className="search-loading">...</span>}
                            </div>
                            {isSearching && (
                                <div className="search-results-dropdown">
                                    <div className="search-loading-message">Searching SIMBAD database...</div>
                                </div>
                            )}
                            {!isSearching && showSearchResults && searchResults.length > 0 && (
                                <div className="search-results-dropdown">
                                    {searchResults.map((obj, index) => (
                                        <div
                                            key={`${obj.name}-${index}`}
                                            className="search-result-item"
                                            onClick={() => handleSearchResultClick(obj)}
                                        >
                                            <div className="search-result-name">{obj.name}</div>
                                            <div className="search-result-type">{obj.object_type || 'Unknown'}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {!isSearching && showSearchResults && searchResults.length === 0 && (
                                <div className="search-results-dropdown">
                                    <div className="search-no-results">No results found</div>
                                </div>
                            )}
                        </div>

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

            <CelestialObjectModal
                isOpen={isObjectModalOpen}
                onClose={handleObjectModalClose}
                object={selectedObject}
            />
        </>
    )
}