import './TelescopeControls.css'
import Button from '@/components/Button/Button.tsx'
import { ArrowBigUp, ArrowBigDown, ArrowBigRight, ArrowBigLeft, Telescope } from 'lucide-react'
import { moveLeft, moveRight, moveUp, moveDown } from '@/services/controlsUtils'
import { useStellarium } from '@/hooks/useStellarium'
import telescopeAPI from '@/services/telescopeAPI'
import { useState } from 'react'

export default function TelescopeControls() {
    const stellarium = useStellarium();
    const [isConnecting, setIsConnecting] = useState(false);
    const [simScopeConnected, setSimScopeConnected] = useState(false);

    console.log('TelescopeControls render - stellarium:', stellarium);

    const handleMove = async (moveFunction: (stel: any) => void, direction: string) => {
        console.log('handleMove called with stellarium:', stellarium);

        // Move Stellarium view
        if (stellarium) {
            moveFunction(stellarium);
            console.log('Moving Stellarium view...');
        } else {
            console.log('Stellarium not ready yet');
        }

        // Also move SimScope if connected
        if (simScopeConnected) {
            try {
                console.log(`Moving SimScope ${direction}...`);

                // Get current telescope position from SimScope
                const status = await telescopeAPI.getTelescopeStatus();
                if (status.success && status.data && status.data.connected) {
                    const currentRA = status.data.rightAscension;
                    const currentDec = status.data.declination;

                    // Calculate new coordinates based on direction
                    let newRA = currentRA;
                    let newDec = currentDec;
                    const stepSize = 0.05; // Smaller step for finer control

                    switch (direction) {
                        case 'left':
                            newRA = currentRA - stepSize;
                            break;
                        case 'right':
                            newRA = currentRA + stepSize;
                            break;
                        case 'up':
                            newDec = Math.min(currentDec + stepSize, 90);
                            break;
                        case 'down':
                            newDec = Math.max(currentDec - stepSize, -90);
                            break;
                    }

                    // Keep RA in 0-24 range
                    if (newRA < 0) newRA += 24;
                    if (newRA >= 24) newRA -= 24;

                    console.log(`Moving from RA:${currentRA.toFixed(4)}, Dec:${currentDec.toFixed(4)} to RA:${newRA.toFixed(4)}, Dec:${newDec.toFixed(4)}`);

                    await telescopeAPI.slewToCoordinates(newRA, newDec);
                    console.log(`✅ SimScope moved ${direction} - command sent successfully`);
                } else {
                    console.log(`❌ SimScope not properly connected or no position data available`);
                }
            } catch (error) {
                console.error(`❌ Error moving SimScope ${direction}:`, error);
            }
        }
    };

    const connectToSimScope = async () => {
        if (simScopeConnected) {
            try {
                console.log('Disconnecting from telescope...');
                await telescopeAPI.disconnectTelescope();
                setSimScopeConnected(false);
                console.log('Disconnected successfully');
            } catch (error) {
                console.error('Error disconnecting from SimScope:', error);
            }
            return;
        }

        setIsConnecting(true);
        console.log('Attempting to connect to telescope...');

        try {
            // First test if server is reachable
            const healthResponse = await fetch('http://localhost:8000/api/health');
            console.log('Health check response:', healthResponse.status);

            if (!healthResponse.ok) {
                throw new Error(`Server not reachable: ${healthResponse.status}`);
            }

            const healthData = await healthResponse.json();
            console.log('Health data:', healthData);

            // Now try to connect
            const response = await telescopeAPI.connectTelescope();
            console.log('Connect response:', response);

            setSimScopeConnected(response.success);
            if (response.success) {
                console.log('✅ Connected to SimScope:', response.message);

                // Test getting status after connection
                try {
                    const status = await telescopeAPI.getTelescopeStatus();
                    console.log('Telescope status after connection:', status);
                } catch (statusError) {
                    console.error('Error getting status:', statusError);
                }
            } else {
                console.error('❌ Connection failed:', response.message);
            }
        } catch (error) {
            console.error('❌ Error connecting to SimScope:', error);
            setSimScopeConnected(false);
        } finally {
            setIsConnecting(false);
        }
    };

    const testMovement = async () => {
        if (!simScopeConnected) {
            console.log('Not connected to telescope');
            return;
        }

        try {
            console.log('Testing telescope movement...');
            await telescopeAPI.slewToCoordinates(12.0, 45.0);
            console.log('✅ Movement command sent successfully');

            // Check status after movement
            setTimeout(async () => {
                try {
                    const status = await telescopeAPI.getTelescopeStatus();
                    console.log('Status after movement:', status);
                } catch (error) {
                    console.error('Error getting status after movement:', error);
                }
            }, 1000);
        } catch (error) {
            console.error('❌ Error sending movement command:', error);
        }
    };
    
    return (
        <div className="telescope-controls__wrapper">
            <Button
                className="telescope-controls__panel telescope-controls__left"
                borderRadius="3px"
                onClick={() => handleMove(moveLeft, 'left')}
            >
                <ArrowBigLeft size={30} color="#ffffff" />
            </Button>
            <Button
                className="telescope-controls__panel telescope-controls__up"
                borderRadius="3px"
                onClick={() => handleMove(moveUp, 'up')}
            >
                <ArrowBigUp size={30} color="#ffffff" />
            </Button>
            <Button
                className="telescope-controls__panel telescope-controls__down"
                borderRadius="3px"
                onClick={() => handleMove(moveDown, 'down')}
            >
                <ArrowBigDown size={30} color="#ffffff" />
            </Button>
            <Button
                className="telescope-controls__panel telescope-controls__right"
                borderRadius="3px"
                onClick={() => handleMove(moveRight, 'right')}
            >
                <ArrowBigRight size={30} color="#ffffff" />
            </Button>
            <Button
                className="telescope-controls__panel telescope-controls__simscope"
                borderRadius="3px"
                onClick={connectToSimScope}
            >
                <Telescope size={30} color={simScopeConnected ? "#00ff00" : "#ffffff"} />
                <span style={{ marginLeft: '8px', fontSize: '14px' }}>
                    {isConnecting ? 'Connecting...' :
                     simScopeConnected ? 'Disconnect SimScope' : 'Connect to SimScope'}
                </span>
            </Button>
            {simScopeConnected && (
                <Button
                    className="telescope-controls__panel telescope-controls__test"
                    borderRadius="3px"
                    onClick={testMovement}
                >
                    <span style={{ fontSize: '14px' }}>Test Movement</span>
                </Button>
            )}
        </div>
    )
}