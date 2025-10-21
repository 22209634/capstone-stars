import './TelescopeView.css';
import { useEffect, useRef, useState } from 'react';
import { useTelescopeContext } from '@/contexts/TelescopeContext';

export default function TelescopeView() {
    const aladinDiv = useRef<HTMLDivElement>(null);
    const aladinInstance = useRef<AladinInstance | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const rotationInterval = useRef<NodeJS.Timeout | null>(null); // Rotation
    const coordinateUpdateInterval = useRef<NodeJS.Timeout | null>(null); // Coordinate updates
    const telescopeContext = useTelescopeContext();
    const { setAladinInstance, setCoordinates, connectionMode } = telescopeContext;

    // Store context in ref so interval can access latest values
    const contextRef = useRef(telescopeContext);
    contextRef.current = telescopeContext;

    useEffect(() => {
        // Load Aladin Lite library
        const loadAladin = async () => {
            // Load CSS
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://aladin.cds.unistra.fr/AladinLite/api/v3/latest/aladin.css';
            document.head.appendChild(link);

            //Load JS
            const script = document.createElement('script');
            script.src = 'https://aladin.cds.unistra.fr/AladinLite/api/v3/latest/aladin.js'
            script.async = true;

            script.onload = () => {
                // Wait for A.init to be ready
                window.A.init.then(() => {
                    // Initialise Aladin
                    aladinInstance.current = window.A.aladin(aladinDiv.current, {
                        survey: 'P/DSS2/color',
                        fov: 2,
                        target: '0 +0',
                        showReticle: false,           // Remove crosshair
                        showZoomControl: false,        // Remove zoom buttons
                        showFullscreenControl: false,  // Remove fullscreen button
                        showLayersControl: false,      // Remove layers panel
                        showCooLocation: false,        // Remove goto/search box
                        showFrame: false, // Remove viewport frame
                        showProjectionControl: false, // Remove projection control
                        showFov: false, // Remove fov
                    });

                    // Share Aladin instance with context
                    setAladinInstance(aladinInstance.current);

                    // START Rotation code

                    // Remove location box
                    const locationBox = aladinDiv.current?.querySelector('.aladin-location');
                    if (locationBox) {
                        locationBox.remove();
                    }

                    startSkyRotation();
                    startCoordinateUpdates();

                    // END Rotation

                    setIsLoaded(true);
                });
            };

            document.body.appendChild(script);
        };

        loadAladin();

        // Cleanup
        return () => {
            console.log('[TelescopeView] Component unmounting - clearing all intervals');
            // Stop rotation
            if (rotationInterval.current) {
                clearInterval(rotationInterval.current);
                rotationInterval.current = null;
            }
            // Stop coordinate updates
            if (coordinateUpdateInterval.current) {
                clearInterval(coordinateUpdateInterval.current);
                coordinateUpdateInterval.current = null;
            }
        };
    }, []);

    const startSkyRotation = () => {
        // Clear any existing interval first
        if (rotationInterval.current) {
            clearInterval(rotationInterval.current);
            rotationInterval.current = null;
        }

        // Earth rotates 360° in 24 hours = 15° per hour = 0.25° per minute
        // We'll simulate this with small increments
        rotationInterval.current = setInterval(() => {
            // Access latest context values from ref
            const { isTracking: currentIsTracking, status: currentStatus, connectionMode: currentMode } = contextRef.current;

            // CRITICAL: Exit immediately if not in simulation mode
            if (currentMode !== 'simulation') {
                console.log('[TelescopeView] Rotation interval detected non-simulation mode - skipping');
                return;
            }

            // Only rotate when NOT tracking (simulating Earth's rotation)
            // When tracking is ON, the telescope follows the stars, so no rotation
            if (aladinInstance.current && !currentIsTracking && currentStatus !== 'Slewing') {
                const currentRaDec = aladinInstance.current.getRaDec();

                // Move Right Ascension (RA) to simulate Earth's rotation
                // Increment by 0.004° every second ≈ 15° per hour (realistic speed)
                // Changed to:
                // Smaller increment, more frequent updates
                // 0.004° per second / 24 frames = 0.000167° per frame
                const newRa = (currentRaDec[0] + 0.000167) % 360;

                aladinInstance.current.gotoRaDec(newRa, currentRaDec[1]);
            }
        }, 42);  // Update every 42/1000 seconds
    };

    const startCoordinateUpdates = () => {
        // Clear any existing interval first
        if (coordinateUpdateInterval.current) {
            clearInterval(coordinateUpdateInterval.current);
            coordinateUpdateInterval.current = null;
        }

        // Update context with current coordinates periodically
        coordinateUpdateInterval.current = setInterval(() => {
            const { connectionMode: currentMode } = contextRef.current;

            // CRITICAL: Exit immediately if not in simulation mode - DO NOT update coordinates
            if (currentMode !== 'simulation') {
                console.log('[TelescopeView] Coordinate update interval detected non-simulation mode - should not be running!');
                return;
            }

            // Only update coordinates from simulation in simulation mode
            if (aladinInstance.current) {
                const currentRaDec = aladinInstance.current.getRaDec();
                console.log('[TelescopeView] Setting coordinates from simulation:', currentRaDec[0], currentRaDec[1]);
                setCoordinates(currentRaDec[0], currentRaDec[1]);
            }
        }, 100);  // Update every 100ms
    };

    // Stop intervals IMMEDIATELY when switching to ASCOM mode
    useEffect(() => {
        if (connectionMode === 'ascom') {
            console.log('[TelescopeView] Connection mode changed to ASCOM - stopping all intervals immediately');
            // Clear intervals when switching to ASCOM
            if (rotationInterval.current) {
                clearInterval(rotationInterval.current);
                rotationInterval.current = null;
            }
            if (coordinateUpdateInterval.current) {
                clearInterval(coordinateUpdateInterval.current);
                coordinateUpdateInterval.current = null;
            }
        } else if (connectionMode === 'simulation' && !rotationInterval.current && aladinInstance.current) {
            // Restart intervals if switching back to simulation
            console.log('[TelescopeView] Connection mode changed to simulation - restarting intervals');
            startSkyRotation();
            startCoordinateUpdates();
        }
    }, [connectionMode]);

    return (
        <div className="telescope-view__wrapper">
            <div ref={aladinDiv}
                 className="aladin-div"
             />

            {!isLoaded && (
                <p className="loading-message">
                    Loading Aladin Lite...
                </p>
            )}
        </div>
    )
}