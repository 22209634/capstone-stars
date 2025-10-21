// Partially Authored by Claude Code

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
    isTracking: boolean;
    setIsTracking: (tracking: boolean) => void;
    moveUp: () => void;
    moveDown: () => void;
    moveLeft: () => void;
    moveRight: () => void;
    startMoveUp: () => void;
    stopMove: () => void;
    startMoveDown: () => void;
    startMoveLeft: () => void;
    startMoveRight: () => void;
    toggleTracking: () => void;
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
    const [isTracking, setIsTracking] = useState<boolean>(false);
    const [connectionMode, setConnectionMode] = useState<ConnectionMode>('simulation');
    const [connectedDevice, setConnectedDevice] = useState<string | null>(null);
    const slewTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const continuousMoveInterval = useRef<any>(null);
    // Track the target coordinates for ASCOM continuous movement
    const targetCoordinatesRef = useRef<{ra: number, dec: number}>({ra: 0, dec: 0});

    const setCoordinates = (newRa: number, newDec: number) => {
        //console.log('[TelescopeContext] Accepting coordinate update:', newRa, newDec);
        setRa(newRa);
        setDec(newDec);
        // Update target coordinates ref when actual coordinates update
        targetCoordinatesRef.current = {ra: newRa, dec: newDec};
    };

    const slewTo = (newRa: number, newDec: number) => {
        if (!aladinInstance) return;

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
        console.log('[moveUp] Called - isTracking:', isTracking, 'connectionMode:', connectionMode);
        // In ASCOM mode, require tracking. In simulation mode, allow movement anytime.
        if (connectionMode === 'ascom' && !isTracking) {
            console.log('[moveUp] ASCOM mode - Telescope is not tracking, ignoring command');
            return;
        }

        if (connectionMode === 'ascom') {
            // Use target coordinates from ref (updates immediately, not waiting for poll)
            const currentRa = targetCoordinatesRef.current.ra;
            const currentDec = targetCoordinatesRef.current.dec;
            const newDec = Math.min(90, currentDec + 1); // Clamp to max +90° (0.25° = 15 arc-minutes)
            console.log('[moveUp] ASCOM mode - Moving from RA:', currentRa, 'Dec:', currentDec, 'to Dec:', newDec);

            // Update target coordinates immediately
            targetCoordinatesRef.current = {ra: currentRa, dec: newDec};

            telescopeAPI.slewToCoordinates(currentRa, newDec)
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
        console.log('[moveDown] Called - isTracking:', isTracking, 'connectionMode:', connectionMode);
        // In ASCOM mode, require tracking. In simulation mode, allow movement anytime.
        if (connectionMode === 'ascom' && !isTracking) {
            console.log('[moveDown] ASCOM mode - Telescope is not tracking, ignoring command');
            return;
        }

        if (connectionMode === 'ascom') {
            // Use target coordinates from ref (updates immediately, not waiting for poll)
            const currentRa = targetCoordinatesRef.current.ra;
            const currentDec = targetCoordinatesRef.current.dec;
            const newDec = Math.max(-90, currentDec - 1); // Clamp to min -90° (0.25° = 15 arc-minutes)
            console.log('[moveDown] ASCOM mode - Moving from RA:', currentRa, 'Dec:', currentDec, 'to Dec:', newDec);

            // Update target coordinates immediately
            targetCoordinatesRef.current = {ra: currentRa, dec: newDec};

            telescopeAPI.slewToCoordinates(currentRa, newDec)
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
        console.log('[moveLeft] Called - isTracking:', isTracking, 'connectionMode:', connectionMode);
        // In ASCOM mode, require tracking. In simulation mode, allow movement anytime.
        if (connectionMode === 'ascom' && !isTracking) {
            console.log('[moveLeft] ASCOM mode - Telescope is not tracking, ignoring command');
            return;
        }

        if (connectionMode === 'ascom') {
            // Use target coordinates from ref (updates immediately, not waiting for poll)
            const currentRa = targetCoordinatesRef.current.ra;
            const currentDec = targetCoordinatesRef.current.dec;
            const newRa = (currentRa + 1.0) % 360; // Wrap around 0-360
            console.log('[moveLeft] ASCOM mode - Moving from RA:', currentRa, 'Dec:', currentDec, 'to RA:', newRa);

            // Update target coordinates immediately
            targetCoordinatesRef.current = {ra: newRa, dec: currentDec};

            telescopeAPI.slewToCoordinates(newRa, currentDec)
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
        console.log('[moveRight] Called - isTracking:', isTracking, 'connectionMode:', connectionMode);
        // In ASCOM mode, require tracking. In simulation mode, allow movement anytime.
        if (connectionMode === 'ascom' && !isTracking) {
            console.log('[moveRight] ASCOM mode - Telescope is not tracking, ignoring command');
            return;
        }

        if (connectionMode === 'ascom') {
            // Use target coordinates from ref (updates immediately, not waiting for poll)
            const currentRa = targetCoordinatesRef.current.ra;
            const currentDec = targetCoordinatesRef.current.dec;
            const newRa = (currentRa - 1.0 + 360) % 360; // Wrap around 0-360
            console.log('[moveRight] ASCOM mode - Moving from RA:', currentRa, 'Dec:', currentDec, 'to RA:', newRa);

            // Update target coordinates immediately
            targetCoordinatesRef.current = {ra: newRa, dec: currentDec};

            telescopeAPI.slewToCoordinates(newRa, currentDec)
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

    const toggleTracking = () => {
        const newTrackingState = !isTracking;
        setIsTracking(newTrackingState);

        // If toggling in ASCOM mode, send tracking command to telescope
        if (connectionMode === 'ascom') {
            telescopeAPI.setTracking(newTrackingState)
                .then((response) => {
                    if (response.success) {
                        console.log('[toggleTracking] Tracking', newTrackingState ? 'enabled' : 'disabled');
                        setStatus(newTrackingState ? 'Tracking' : 'Idle');
                    }
                })
                .catch((error) => {
                    console.error('[toggleTracking] Failed to set tracking:', error);
                });
        } else {
            // Simulation mode - just update status
            setStatus(newTrackingState ? 'Tracking' : 'Idle');
        }
    };

    // Continuous movement handlers
    const stopMove = () => {
        console.log('[stopMove] Called - interval exists:', !!continuousMoveInterval.current);
        if (continuousMoveInterval.current) {
            clearInterval(continuousMoveInterval.current);
            continuousMoveInterval.current = null;
            console.log('[stopMove] Interval cleared, setting status to Idle');
            setStatus('Idle');
        }
    };

    const startMoveUp = () => {
        console.log('[startMoveUp] Called - isTracking:', isTracking, 'existing interval:', !!continuousMoveInterval.current);
        // In ASCOM mode, require tracking. In simulation mode, allow movement anytime.
        if (continuousMoveInterval.current || (connectionMode === 'ascom' && !isTracking)) {
            console.log('[startMoveUp] Blocked - interval exists:', !!continuousMoveInterval.current, 'ASCOM without tracking:', connectionMode === 'ascom' && !isTracking);
            return;
        }
        moveUp(); // First immediate move
        // Use slower interval for ASCOM (2 seconds), faster for simulation (100ms)
        const interval = connectionMode === 'ascom' ? 2000 : 100;
        console.log('[startMoveUp] Starting interval with', interval, 'ms delay');
        continuousMoveInterval.current = setInterval(() => {
            console.log('[startMoveUp] Interval firing - calling moveUp');
            moveUp();
        }, interval);
    };

    const startMoveDown = () => {
        // In ASCOM mode, require tracking. In simulation mode, allow movement anytime.
        if (continuousMoveInterval.current || (connectionMode === 'ascom' && !isTracking)) return;
        moveDown();
        // Use slower interval for ASCOM (2 seconds), faster for simulation (100ms)
        const interval = connectionMode === 'ascom' ? 2000 : 100;
        continuousMoveInterval.current = setInterval(() => {
            moveDown();
        }, interval);
    };

    const startMoveLeft = () => {
        // In ASCOM mode, require tracking. In simulation mode, allow movement anytime.
        if (continuousMoveInterval.current || (connectionMode === 'ascom' && !isTracking)) return;
        moveLeft();
        // Use slower interval for ASCOM (2 seconds), faster for simulation (100ms)
        const interval = connectionMode === 'ascom' ? 2000 : 100;
        continuousMoveInterval.current = setInterval(() => {
            moveLeft();
        }, interval);
    };

    const startMoveRight = () => {
        // In ASCOM mode, require tracking. In simulation mode, allow movement anytime.
        if (continuousMoveInterval.current || (connectionMode === 'ascom' && !isTracking)) return;
        moveRight();
        // Use slower interval for ASCOM (2 seconds), faster for simulation (100ms)
        const interval = connectionMode === 'ascom' ? 2000 : 100;
        continuousMoveInterval.current = setInterval(() => {
            moveRight();
        }, interval);
    };

    const gotoCoordinates = (targetRa: number, targetDec: number) => {
        console.log('[gotoCoordinates] Called - targetRA:', targetRa, 'targetDec:', targetDec, 'connectionMode:', connectionMode, 'isTracking:', isTracking);

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
        } else if (aladinInstance) {
            // Use simulation
            console.log('[gotoCoordinates] Simulation mode - Using slewTo');
            slewTo(normalizedRa, clampedDec);
        } else {
            console.log('[gotoCoordinates] Cannot execute - aladinInstance:', aladinInstance);
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
                    //console.log('[ASCOM Poll] Setting coordinates from ASCOM:', response.data.rightAscension, response.data.declination, 'Slewing:', response.data.slewing, 'Tracking:', response.data.tracking);
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
        isTracking,
        setIsTracking,
        moveUp,
        moveDown,
        moveLeft,
        moveRight,
        startMoveUp,
        stopMove,
        startMoveDown,
        startMoveLeft,
        startMoveRight,
        toggleTracking,
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