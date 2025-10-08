import './TelescopeView.css';
import React, { useEffect, useRef, useState } from 'react';

export default function TelescopeView() {
    const aladinDiv = useRef(null);
    const aladinInstance = useRef(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const rotationInterval = useRef(null); // Rotation
    const [isParked, setIsParked] = useState(false);  // Telescope parking

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

                    // START Rotation code

                    // Remove location box
                    const locationBox = aladinDiv.current.querySelector('.aladin-location');
                    if (locationBox) {
                        locationBox.remove();
                    }

                    startSkyRotation();

                    // END Rotation

                    setIsLoaded(true);
                });
            };

            document.body.appendChild(script);
        };

        loadAladin();

        // Cleanup
        return () => {
            // Stop rotation
            if (rotationInterval.current) {
                clearInterval(rotationInterval.current);
            }
        };
    }, []);

    const startSkyRotation = () => {
        // Earth rotates 360° in 24 hours = 15° per hour = 0.25° per minute
        // We'll simulate this with small increments
        rotationInterval.current = setInterval(() => {
            if (aladinInstance.current && !isParked) {
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

    const toggleParking = () => {
        setIsParked(!isParked);
    };

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