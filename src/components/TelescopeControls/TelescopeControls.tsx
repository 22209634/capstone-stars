import './TelescopeControls.css'
import Button from '@/components/Button/Button.tsx'
import { ArrowBigUp, ArrowBigDown, ArrowBigRight, ArrowBigLeft, Telescope, ListTree } from 'lucide-react'
import { moveLeft, moveRight, moveUp, moveDown } from '@/services/controlsUtils'
import { useStellarium } from '@/hooks/useStellarium'
import telescopeAPI from '@/services/telescopeAPI'
import { useState } from 'react'
import TelescopeChooser from '@/components/TelescopeChooser/TelescopeChooser'

export default function TelescopeControls() {
    const stellarium = useStellarium();
    const [isConnecting, setIsConnecting] = useState(false);
    const [simScopeConnected, setSimScopeConnected] = useState(false);
    const [showChooser, setShowChooser] = useState(false);
    const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);

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

        // Also move telescope if connected
        if (simScopeConnected) {
            try {
                console.log(`Moving telescope ${direction}...`);

                // Get current telescope position
                const status = await telescopeAPI.getTelescopeStatus();
                if (status.success && status.data && status.data.connected) {
                    const currentAlt = status.data.altitude;
                    const currentAz = status.data.azimuth;

                    // Calculate new Alt/Az coordinates based on direction
                    let newAlt = currentAlt;
                    let newAz = currentAz;
                    const stepSize = 2; // 2 degrees per step

                    switch (direction) {
                        case 'left':
                            // Moving left decreases azimuth (West)
                            newAz = currentAz - stepSize;
                            if (newAz < 0) newAz += 360;
                            break;
                        case 'right':
                            // Moving right increases azimuth (East)
                            newAz = currentAz + stepSize;
                            if (newAz >= 360) newAz -= 360;
                            break;
                        case 'up':
                            // Moving up increases altitude (North)
                            newAlt = Math.min(currentAlt + stepSize, 90);
                            break;
                        case 'down':
                            // Moving down decreases altitude (South)
                            newAlt = Math.max(currentAlt - stepSize, 0);
                            break;
                    }

                    console.log(`Moving from Alt:${currentAlt.toFixed(2)}°, Az:${currentAz.toFixed(2)}° to Alt:${newAlt.toFixed(2)}°, Az:${newAz.toFixed(2)}°`);

                    // Convert Alt/Az to RA/Dec for slewing
                    // We'll use the backend to handle this conversion
                    const response = await fetch('http://localhost:8000/api/telescope/slew/altaz', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            altitude: newAlt,
                            azimuth: newAz
                        })
                    });

                    const result = await response.json();
                    if (result.success) {
                        console.log(`✅ Telescope moved ${direction} - command sent successfully`);
                    } else {
                        console.error(`❌ Move failed:`, result.message);
                    }
                } else {
                    console.log(`❌ Telescope not properly connected or no position data available`);
                }
            } catch (error) {
                console.error(`❌ Error moving telescope ${direction}:`, error);
            }
        }
    };

    const handleTelescopeSelect = async (driverId: string) => {
        setSelectedDriverId(driverId);
        setIsConnecting(true);
        console.log(`Connecting to telescope: ${driverId}`);

        try {
            const response = await telescopeAPI.connectTelescope(driverId);
            console.log('Connect response:', response);

            setSimScopeConnected(response.success);
            if (response.success) {
                console.log('✅ Connected to telescope:', response.message);

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
            console.error('❌ Error connecting to telescope:', error);
            setSimScopeConnected(false);
        } finally {
            setIsConnecting(false);
        }
    };

    const connectToSimScope = async () => {
        if (simScopeConnected) {
            try {
                console.log('Disconnecting from telescope...');
                await telescopeAPI.disconnectTelescope();
                setSimScopeConnected(false);
                setSelectedDriverId(null);
                console.log('Disconnected successfully');
            } catch (error) {
                console.error('Error disconnecting from telescope:', error);
            }
            return;
        }

        // Show chooser when trying to connect
        setShowChooser(true);
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
        <>
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
                         simScopeConnected ? 'Disconnect' : 'Connect Telescope'}
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

            <TelescopeChooser
                isOpen={showChooser}
                onClose={() => setShowChooser(false)}
                onSelect={handleTelescopeSelect}
            />
        </>
    )
}