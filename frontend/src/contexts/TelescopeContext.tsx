// Authored by Claude Code

import React, { createContext, useContext, useState, useRef, useEffect, type ReactNode } from 'react';
import telescopeAPI from '@/services/telescopeAPI';

type TelescopeStatus = 'Tracking' | 'Slewing' | 'Idle';
type ConnectionMode = 'simulation' | 'ascom';

interface TelescopeContextType {
    aladinInstance: any;
    setAladinInstance: (instance: any) => void;
    ra: number;
    dec: number;
    setCoordinates: (ra: number, dec: number) => void;
    status: TelescopeStatus;
    setStatus: (status: TelescopeStatus) => void;
    isParked: boolean;
    setIsParked: (parked: boolean) => void;
    moveUp: () => void;
    moveDown: () => void;
    moveLeft: () => void;
    moveRight: () => void;
    startMoveUp: () => void;
    stopMove: () => void;
    startMoveDown: () => void;
    startMoveLeft: () => void;
    startMoveRight: () => void;
    togglePark: () => void;
    gotoCoordinates: (ra: number, dec: number) => void;
    connectionMode: ConnectionMode;
    setConnectionMode: (mode: ConnectionMode) => void;
    connectedDevice: string | null;
    setConnectedDevice: (device: string | null) => void;
}

const TelescopeContext = createContext<TelescopeContextType | undefined>(undefined);

export const useTelescopeContext = () => {
    const context = useContext(TelescopeContext);
    if (!context) {
        throw new Error('useTelescopeContext must be used within TelescopeProvider');
    }
    return context;
};

interface TelescopeProviderProps {
    children: ReactNode;
}

export const TelescopeProvider: React.FC<TelescopeProviderProps> = ({ children }) => {
    const [aladinInstance, setAladinInstance] = useState<any>(null);
    const [ra, setRa] = useState<number>(0);
    const [dec, setDec] = useState<number>(0);
    const [status, setStatus] = useState<TelescopeStatus>('Idle');
    const [isParked, setIsParked] = useState<boolean>(false);
    const [connectionMode, setConnectionMode] = useState<ConnectionMode>('simulation');
    const [connectedDevice, setConnectedDevice] = useState<string | null>(null);
    const slewTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const continuousMoveInterval = useRef<any>(null);

    const setCoordinates = (newRa: number, newDec: number) => {
        console.log('[TelescopeContext] Accepting coordinate update:', newRa, newDec);
        setRa(newRa);
        setDec(newDec);
    };

    const slewTo = (newRa: number, newDec: number) => {
        if (!aladinInstance || isParked) return;

        setStatus('Slewing');

        // Use animateToRaDec for smooth animation (500ms duration)
        try {
            if (aladinInstance.animateToRaDec) {
                aladinInstance.animateToRaDec(newRa, newDec, 0.5); // 0.5 seconds
            } else {
                aladinInstance.gotoRaDec(newRa, newDec);
            }
        } catch (e) {
            aladinInstance.gotoRaDec(newRa, newDec);
        }

        // Clear any existing timeout
        if (slewTimeoutRef.current) {
            clearTimeout(slewTimeoutRef.current);
        }

        // Return to Idle status after slew completes
        slewTimeoutRef.current = setTimeout(() => {
            setStatus('Idle');
        }, 500);
    };

    const moveUp = () => {
        console.log('[moveUp] Called - isParked:', isParked, 'connectionMode:', connectionMode);
        if (isParked) {
            console.log('[moveUp] Telescope is parked, ignoring command');
            return;
        }

        if (connectionMode === 'ascom') {
            // Use current RA/Dec state and ASCOM API
            // Use larger increment for real telescope (1 degree = 60 arc-minutes)
            const newDec = Math.min(90, dec + 1.0); // Clamp to max +90°
            console.log('[moveUp] ASCOM mode - Moving from RA:', ra, 'Dec:', dec, 'to Dec:', newDec);
            telescopeAPI.slewToCoordinates(ra, newDec)
                .then((response) => {
                    console.log('[moveUp] ASCOM response:', response);
                    if (response.success) {
                        setStatus('Slewing');
                    }
                })
                .catch((error) => {
                    console.error('[moveUp] Failed to move telescope:', error);
                });
        } else if (aladinInstance) {
            // Simulation mode - smaller increment for smooth animation
            const currentRaDec = aladinInstance.getRaDec();
            const newDec = Math.min(90, currentRaDec[1] + 0.05);
            console.log('[moveUp] Simulation mode - Moving from Dec:', currentRaDec[1], 'to Dec:', newDec);
            slewTo(currentRaDec[0], newDec);
        }
    };

    const moveDown = () => {
        console.log('[moveDown] Called - isParked:', isParked, 'connectionMode:', connectionMode);
        if (isParked) {
            console.log('[moveDown] Telescope is parked, ignoring command');
            return;
        }

        if (connectionMode === 'ascom') {
            // Use larger increment for real telescope (1 degree = 60 arc-minutes)
            const newDec = Math.max(-90, dec - 1.0); // Clamp to min -90°
            console.log('[moveDown] ASCOM mode - Moving from RA:', ra, 'Dec:', dec, 'to Dec:', newDec);
            telescopeAPI.slewToCoordinates(ra, newDec)
                .then((response) => {
                    console.log('[moveDown] ASCOM response:', response);
                    if (response.success) {
                        setStatus('Slewing');
                    }
                })
                .catch((error) => {
                    console.error('[moveDown] Failed to move telescope:', error);
                });
        } else if (aladinInstance) {
            // Simulation mode - smaller increment for smooth animation
            const currentRaDec = aladinInstance.getRaDec();
            const newDec = Math.max(-90, currentRaDec[1] - 0.05);
            console.log('[moveDown] Simulation mode - Moving from Dec:', currentRaDec[1], 'to Dec:', newDec);
            slewTo(currentRaDec[0], newDec);
        }
    };

    const moveLeft = () => {
        console.log('[moveLeft] Called - isParked:', isParked, 'connectionMode:', connectionMode);
        if (isParked) {
            console.log('[moveLeft] Telescope is parked, ignoring command');
            return;
        }

        if (connectionMode === 'ascom') {
            // Use larger increment for real telescope (1 degree)
            const newRa = (ra + 1.0) % 360; // Wrap around 0-360
            console.log('[moveLeft] ASCOM mode - Moving from RA:', ra, 'Dec:', dec, 'to RA:', newRa);
            telescopeAPI.slewToCoordinates(newRa, dec)
                .then((response) => {
                    console.log('[moveLeft] ASCOM response:', response);
                    if (response.success) {
                        setStatus('Slewing');
                    }
                })
                .catch((error) => {
                    console.error('[moveLeft] Failed to move telescope:', error);
                });
        } else if (aladinInstance) {
            // Simulation mode - smaller increment for smooth animation
            const currentRaDec = aladinInstance.getRaDec();
            const newRa = (currentRaDec[0] + 0.05) % 360;
            console.log('[moveLeft] Simulation mode - Moving from RA:', currentRaDec[0], 'to RA:', newRa);
            slewTo(newRa, currentRaDec[1]);
        }
    };

    const moveRight = () => {
        console.log('[moveRight] Called - isParked:', isParked, 'connectionMode:', connectionMode);
        if (isParked) {
            console.log('[moveRight] Telescope is parked, ignoring command');
            return;
        }

        if (connectionMode === 'ascom') {
            // Use larger increment for real telescope (1 degree)
            const newRa = (ra - 1.0 + 360) % 360; // Wrap around 0-360
            console.log('[moveRight] ASCOM mode - Moving from RA:', ra, 'Dec:', dec, 'to RA:', newRa);
            telescopeAPI.slewToCoordinates(newRa, dec)
                .then((response) => {
                    console.log('[moveRight] ASCOM response:', response);
                    if (response.success) {
                        setStatus('Slewing');
                    }
                })
                .catch((error) => {
                    console.error('[moveRight] Failed to move telescope:', error);
                });
        } else if (aladinInstance) {
            // Simulation mode - smaller increment for smooth animation
            const currentRaDec = aladinInstance.getRaDec();
            const newRa = (currentRaDec[0] - 0.05 + 360) % 360;
            console.log('[moveRight] Simulation mode - Moving from RA:', currentRaDec[0], 'to RA:', newRa);
            slewTo(newRa, currentRaDec[1]);
        }
    };

    const togglePark = () => {
        const newParkedState = !isParked;
        setIsParked(newParkedState);
        setStatus(newParkedState ? 'Tracking' : 'Idle');
    };

    // Continuous movement handlers
    const stopMove = () => {
        if (continuousMoveInterval.current) {
            clearInterval(continuousMoveInterval.current);
            continuousMoveInterval.current = null;
            setStatus('Idle');
        }
    };

    const startMoveUp = () => {
        if (isParked || continuousMoveInterval.current) return;
        moveUp(); // First immediate move
        // Use slower interval for ASCOM (2 seconds), faster for simulation (100ms)
        const interval = connectionMode === 'ascom' ? 2000 : 100;
        continuousMoveInterval.current = setInterval(() => {
            moveUp();
        }, interval);
    };

    const startMoveDown = () => {
        if (isParked || continuousMoveInterval.current) return;
        moveDown();
        // Use slower interval for ASCOM (2 seconds), faster for simulation (100ms)
        const interval = connectionMode === 'ascom' ? 2000 : 100;
        continuousMoveInterval.current = setInterval(() => {
            moveDown();
        }, interval);
    };

    const startMoveLeft = () => {
        if (isParked || continuousMoveInterval.current) return;
        moveLeft();
        // Use slower interval for ASCOM (2 seconds), faster for simulation (100ms)
        const interval = connectionMode === 'ascom' ? 2000 : 100;
        continuousMoveInterval.current = setInterval(() => {
            moveLeft();
        }, interval);
    };

    const startMoveRight = () => {
        if (isParked || continuousMoveInterval.current) return;
        moveRight();
        // Use slower interval for ASCOM (2 seconds), faster for simulation (100ms)
        const interval = connectionMode === 'ascom' ? 2000 : 100;
        continuousMoveInterval.current = setInterval(() => {
            moveRight();
        }, interval);
    };

    const gotoCoordinates = (targetRa: number, targetDec: number) => {
        console.log('[gotoCoordinates] Called - targetRA:', targetRa, 'targetDec:', targetDec, 'connectionMode:', connectionMode, 'isParked:', isParked);

        // Clamp declination to valid range
        const clampedDec = Math.max(-90, Math.min(90, targetDec));
        // Normalize RA to 0-360
        const normalizedRa = ((targetRa % 360) + 360) % 360;

        console.log('[gotoCoordinates] Normalized - RA:', normalizedRa, 'Dec:', clampedDec);

        if (connectionMode === 'ascom') {
            // Use ASCOM API for real telescope
            console.log('[gotoCoordinates] ASCOM mode - Calling API');
            telescopeAPI.slewToCoordinates(normalizedRa, clampedDec)
                .then((response) => {
                    console.log('[gotoCoordinates] ASCOM response:', response);
                    if (response.success) {
                        setStatus('Slewing');
                    }
                })
                .catch((error) => {
                    console.error('[gotoCoordinates] Failed to slew telescope:', error);
                });
        } else if (aladinInstance && !isParked) {
            // Use simulation
            console.log('[gotoCoordinates] Simulation mode - Using slewTo');
            slewTo(normalizedRa, clampedDec);
        } else {
            console.log('[gotoCoordinates] Cannot execute - aladinInstance:', aladinInstance, 'isParked:', isParked);
        }
    };

    // Poll ASCOM telescope status when connected
    useEffect(() => {
        if (connectionMode !== 'ascom') return;

        // Enable tracking when connecting to ASCOM telescope
        const enableTracking = async () => {
            try {
                console.log('[ASCOM] Enabling tracking on telescope');
                const response = await telescopeAPI.setTracking(true);
                if (response.success) {
                    console.log('[ASCOM] Tracking enabled successfully');
                } else {
                    console.warn('[ASCOM] Failed to enable tracking:', response.message);
                }
            } catch (error) {
                console.error('[ASCOM] Error enabling tracking:', error);
            }
        };

        enableTracking();

        const pollInterval = setInterval(async () => {
            try {
                const response = await telescopeAPI.getTelescopeStatus();
                if (response.success && response.data) {
                    console.log('[ASCOM Poll] Setting coordinates from ASCOM:', response.data.rightAscension, response.data.declination, 'Slewing:', response.data.slewing, 'Tracking:', response.data.tracking);
                    setCoordinates(response.data.rightAscension, response.data.declination);
                    setStatus(response.data.slewing ? 'Slewing' : response.data.tracking ? 'Tracking' : 'Idle');
                }
            } catch (error) {
                console.error('Error polling telescope status:', error);
            }
        }, 1000); // Poll every second

        return () => clearInterval(pollInterval);
    }, [connectionMode]);

    const value: TelescopeContextType = {
        aladinInstance,
        setAladinInstance,
        ra,
        dec,
        setCoordinates,
        status,
        setStatus,
        isParked,
        setIsParked,
        moveUp,
        moveDown,
        moveLeft,
        moveRight,
        startMoveUp,
        stopMove,
        startMoveDown,
        startMoveLeft,
        startMoveRight,
        togglePark,
        gotoCoordinates,
        connectionMode,
        setConnectionMode,
        connectedDevice,
        setConnectedDevice,
    };

    return (
        <TelescopeContext.Provider value={value}>
            {children}
        </TelescopeContext.Provider>
    );
};