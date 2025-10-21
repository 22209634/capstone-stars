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
    moveUp: (stepSize?: number) => void;
    moveDown: (stepSize?: number) => void;
    moveLeft: (stepSize?: number) => void;
    moveRight: (stepSize?: number) => void;
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
    // Movement speed configuration - adjust these to control all movement speeds
    const MOVEMENT_CONFIG = {
        // Simulation mode settings
        simulation: {
            // Single-click movement step sizes (when you tap the button once)
            decSingleClickStep: 0.25,        // Declination (up/down) single-click step in degrees
            raSingleClickStep: 0.2,          // Right Ascension (left/right) single-click step in degrees

            // Hold/continuous movement base step sizes (initial speed when starting to hold)
            decHoldBaseStep: 0.05,           // Declination (up/down) hold base step in degrees
            raHoldBaseStep: 0.05,            // Right Ascension (left/right) hold base step in degrees

            // Acceleration settings for holding buttons
            accelerationRate: 1.3,           // How fast acceleration increases (1.0 = no acceleration, 1.1 = 10% per interval, 1.3 = 30% per interval)
            maxAccelerationMultiplier: 50,   // Maximum acceleration cap (50x the base step)

            // Timing settings
            holdInterval: 200,               // Interval between movements in simulation mode (ms)
        },

        // ASCOM mode settings
        ascom: {
            // Single-click movement step sizes (when you tap the button once)
            decSingleClickStep: 0.25,        // Declination (up/down) single-click step in degrees
            raSingleClickStep: 0.2,          // Right Ascension (left/right) single-click step in degrees

            // Hold/continuous movement base step sizes (initial speed when starting to hold)
            decHoldBaseStep: 0.25,           // Declination (up/down) hold base step in degrees
            raHoldBaseStep: 0.2,            // Right Ascension (left/right) hold base step in degrees

            // Acceleration settings for holding buttons
            accelerationRate: 1.3,           // How fast acceleration increases (1.0 = no acceleration, 1.1 = 10% per interval, 1.3 = 30% per interval)
            maxAccelerationMultiplier: 50,   // Maximum acceleration cap (50x the base step)

            // Timing settings
            holdInterval: 2000,              // Interval between movements in ASCOM mode (ms)
        },

        // Global settings (apply to both modes)
        globalMultiplier: 1.0,               // Global speed multiplier (adjust this to speed up/slow down everything)
    };

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
    // Track acceleration for continuous movement
    const accelerationMultiplierRef = useRef<number>(1);
    const accelerationIntervalCountRef = useRef<number>(0);

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

    const moveUp = (stepSize: number = MOVEMENT_CONFIG[connectionMode].decSingleClickStep * MOVEMENT_CONFIG.globalMultiplier) => {
        console.log('[moveUp] Called - isTracking:', isTracking, 'connectionMode:', connectionMode, 'stepSize:', stepSize);

        if (connectionMode === 'ascom') {
            // Use target coordinates from ref (updates immediately, not waiting for poll)
            const currentRa = targetCoordinatesRef.current.ra;
            const currentDec = targetCoordinatesRef.current.dec;
            const newDec = Math.min(90, currentDec + stepSize);
            console.log('[moveUp] ASCOM mode - Moving from RA:', currentRa, 'Dec:', currentDec, 'to Dec:', newDec, 'stepSize:', stepSize);

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
            // Simulation mode - use provided step size
            const currentRaDec = aladinInstance.getRaDec();
            const newDec = Math.min(90, currentRaDec[1] + stepSize);
            console.log('[moveUp] Simulation mode - Moving from Dec:', currentRaDec[1], 'to Dec:', newDec, 'stepSize:', stepSize);
            slewTo(currentRaDec[0], newDec);
        }
    };

    const moveDown = (stepSize: number = MOVEMENT_CONFIG[connectionMode].decSingleClickStep * MOVEMENT_CONFIG.globalMultiplier) => {
        console.log('[moveDown] Called - isTracking:', isTracking, 'connectionMode:', connectionMode, 'stepSize:', stepSize);

        if (connectionMode === 'ascom') {
            // Use target coordinates from ref (updates immediately, not waiting for poll)
            const currentRa = targetCoordinatesRef.current.ra;
            const currentDec = targetCoordinatesRef.current.dec;
            const newDec = Math.max(-90, currentDec - stepSize);
            console.log('[moveDown] ASCOM mode - Moving from RA:', currentRa, 'Dec:', currentDec, 'to Dec:', newDec, 'stepSize:', stepSize);

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
            // Simulation mode - use provided step size
            const currentRaDec = aladinInstance.getRaDec();
            const newDec = Math.max(-90, currentRaDec[1] - stepSize);
            console.log('[moveDown] Simulation mode - Moving from Dec:', currentRaDec[1], 'to Dec:', newDec, 'stepSize:', stepSize);
            slewTo(currentRaDec[0], newDec);
        }
    };

    const moveLeft = (stepSize: number = MOVEMENT_CONFIG[connectionMode].raSingleClickStep * MOVEMENT_CONFIG.globalMultiplier) => {
        console.log('[moveLeft] Called - isTracking:', isTracking, 'connectionMode:', connectionMode, 'stepSize:', stepSize);

        if (connectionMode === 'ascom') {
            // Use target coordinates from ref (updates immediately, not waiting for poll)
            const currentRa = targetCoordinatesRef.current.ra;
            const currentDec = targetCoordinatesRef.current.dec;
            const newRa = (currentRa + stepSize) % 360; // Wrap around 0-360
            console.log('[moveLeft] ASCOM mode - Moving from RA:', currentRa, 'Dec:', currentDec, 'to RA:', newRa, 'stepSize:', stepSize);

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
            // Simulation mode - use provided step size
            const currentRaDec = aladinInstance.getRaDec();
            const newRa = (currentRaDec[0] + stepSize) % 360;
            console.log('[moveLeft] Simulation mode - Moving from RA:', currentRaDec[0], 'to RA:', newRa, 'stepSize:', stepSize);
            slewTo(newRa, currentRaDec[1]);
        }
    };

    const moveRight = (stepSize: number = MOVEMENT_CONFIG[connectionMode].raSingleClickStep * MOVEMENT_CONFIG.globalMultiplier) => {
        console.log('[moveRight] Called - isTracking:', isTracking, 'connectionMode:', connectionMode, 'stepSize:', stepSize);

        if (connectionMode === 'ascom') {
            // Use target coordinates from ref (updates immediately, not waiting for poll)
            const currentRa = targetCoordinatesRef.current.ra;
            const currentDec = targetCoordinatesRef.current.dec;
            const newRa = (currentRa - stepSize + 360) % 360; // Wrap around 0-360
            console.log('[moveRight] ASCOM mode - Moving from RA:', currentRa, 'Dec:', currentDec, 'to RA:', newRa, 'stepSize:', stepSize);

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
            // Simulation mode - use provided step size
            const currentRaDec = aladinInstance.getRaDec();
            const newRa = (currentRaDec[0] - stepSize + 360) % 360;
            console.log('[moveRight] Simulation mode - Moving from RA:', currentRaDec[0], 'to RA:', newRa, 'stepSize:', stepSize);
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
            // Reset acceleration
            accelerationMultiplierRef.current = 1;
            accelerationIntervalCountRef.current = 0;
            console.log('[stopMove] Interval cleared, acceleration reset, setting status to Idle');
            setStatus('Idle');
        }
    };

    const startMoveUp = () => {
        console.log('[startMoveUp] Called - isTracking:', isTracking, 'existing interval:', !!continuousMoveInterval.current);
        if (continuousMoveInterval.current) {
            console.log('[startMoveUp] Blocked - interval exists');
            return;
        }

        // Reset acceleration on start
        accelerationMultiplierRef.current = 1;
        accelerationIntervalCountRef.current = 0;

        // First immediate move with base step size
        const modeConfig = MOVEMENT_CONFIG[connectionMode];
        const baseStep = modeConfig.decHoldBaseStep * MOVEMENT_CONFIG.globalMultiplier;
        moveUp(baseStep);

        // Use mode-specific interval
        const interval = modeConfig.holdInterval;
        console.log('[startMoveUp] Starting interval with', interval, 'ms delay');

        continuousMoveInterval.current = setInterval(() => {
            // Increment counter
            accelerationIntervalCountRef.current++;

            // Calculate acceleration using configured rate
            accelerationMultiplierRef.current = Math.pow(modeConfig.accelerationRate, accelerationIntervalCountRef.current);

            // Cap the maximum multiplier to prevent extreme speeds
            const cappedMultiplier = Math.min(accelerationMultiplierRef.current, modeConfig.maxAccelerationMultiplier);

            const stepSize = baseStep * cappedMultiplier;
            console.log('[startMoveUp] Interval #', accelerationIntervalCountRef.current, 'multiplier:', cappedMultiplier.toFixed(2), 'stepSize:', stepSize.toFixed(3));

            moveUp(stepSize);
        }, interval);
    };

    const startMoveDown = () => {
        if (continuousMoveInterval.current) return;

        // Reset acceleration on start
        accelerationMultiplierRef.current = 1;
        accelerationIntervalCountRef.current = 0;

        // First immediate move with base step size
        const modeConfig = MOVEMENT_CONFIG[connectionMode];
        const baseStep = modeConfig.decHoldBaseStep * MOVEMENT_CONFIG.globalMultiplier;
        moveDown(baseStep);

        // Use mode-specific interval
        const interval = modeConfig.holdInterval;

        continuousMoveInterval.current = setInterval(() => {
            // Increment counter
            accelerationIntervalCountRef.current++;

            // Calculate acceleration using configured rate
            accelerationMultiplierRef.current = Math.pow(modeConfig.accelerationRate, accelerationIntervalCountRef.current);

            // Cap the maximum multiplier to prevent extreme speeds
            const cappedMultiplier = Math.min(accelerationMultiplierRef.current, modeConfig.maxAccelerationMultiplier);

            const stepSize = baseStep * cappedMultiplier;
            console.log('[startMoveDown] Interval #', accelerationIntervalCountRef.current, 'multiplier:', cappedMultiplier.toFixed(2), 'stepSize:', stepSize.toFixed(3));

            moveDown(stepSize);
        }, interval);
    };

    const startMoveLeft = () => {
        if (continuousMoveInterval.current) return;

        // Reset acceleration on start
        accelerationMultiplierRef.current = 1;
        accelerationIntervalCountRef.current = 0;

        // First immediate move with base step size for RA
        const modeConfig = MOVEMENT_CONFIG[connectionMode];
        const baseStep = modeConfig.raHoldBaseStep * MOVEMENT_CONFIG.globalMultiplier;
        moveLeft(baseStep);

        // Use mode-specific interval
        const interval = modeConfig.holdInterval;

        continuousMoveInterval.current = setInterval(() => {
            // Increment counter
            accelerationIntervalCountRef.current++;

            // Calculate acceleration using configured rate
            accelerationMultiplierRef.current = Math.pow(modeConfig.accelerationRate, accelerationIntervalCountRef.current);

            // Cap the maximum multiplier to prevent extreme speeds
            const cappedMultiplier = Math.min(accelerationMultiplierRef.current, modeConfig.maxAccelerationMultiplier);

            const stepSize = baseStep * cappedMultiplier;
            console.log('[startMoveLeft] Interval #', accelerationIntervalCountRef.current, 'multiplier:', cappedMultiplier.toFixed(2), 'stepSize:', stepSize.toFixed(3));

            moveLeft(stepSize);
        }, interval);
    };

    const startMoveRight = () => {
        if (continuousMoveInterval.current) return;

        // Reset acceleration on start
        accelerationMultiplierRef.current = 1;
        accelerationIntervalCountRef.current = 0;

        // First immediate move with base step size for RA
        const modeConfig = MOVEMENT_CONFIG[connectionMode];
        const baseStep = modeConfig.raHoldBaseStep * MOVEMENT_CONFIG.globalMultiplier;
        moveRight(baseStep);

        // Use mode-specific interval
        const interval = modeConfig.holdInterval;

        continuousMoveInterval.current = setInterval(() => {
            // Increment counter
            accelerationIntervalCountRef.current++;

            // Calculate acceleration using configured rate
            accelerationMultiplierRef.current = Math.pow(modeConfig.accelerationRate, accelerationIntervalCountRef.current);

            // Cap the maximum multiplier to prevent extreme speeds
            const cappedMultiplier = Math.min(accelerationMultiplierRef.current, modeConfig.maxAccelerationMultiplier);

            const stepSize = baseStep * cappedMultiplier;
            console.log('[startMoveRight] Interval #', accelerationIntervalCountRef.current, 'multiplier:', cappedMultiplier.toFixed(2), 'stepSize:', stepSize.toFixed(3));

            moveRight(stepSize);
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

        // Read initial tracking state from telescope
        const readInitialState = async () => {
            try {
                console.log('[ASCOM] Reading initial telescope state');
                const response = await telescopeAPI.getTelescopeStatus();
                if (response.success && response.data) {
                    console.log('[ASCOM] Initial tracking state:', response.data.tracking);
                    setIsTracking(response.data.tracking);
                    setCoordinates(response.data.rightAscension, response.data.declination);
                    setStatus(response.data.slewing ? 'Slewing' : response.data.tracking ? 'Tracking' : 'Idle');
                }
            } catch (error) {
                console.error('[ASCOM] Error reading initial state:', error);
            }
        };

        readInitialState();

        const pollInterval = setInterval(async () => {
            try {
                const response = await telescopeAPI.getTelescopeStatus();
                if (response.success && response.data) {
                    //console.log('[ASCOM Poll] Setting coordinates from ASCOM:', response.data.rightAscension, response.data.declination, 'Slewing:', response.data.slewing, 'Tracking:', response.data.tracking);
                    setCoordinates(response.data.rightAscension, response.data.declination);
                    setIsTracking(response.data.tracking);
                    setStatus(response.data.slewing ? 'Slewing' : response.data.tracking ? 'Tracking' : 'Idle');
                }
            } catch (error) {
                console.error('Error polling telescope status:', error);
            }
        }, 1000); // Poll every second

        return () => clearInterval(pollInterval);
    }, [connectionMode]);

    // Keyboard controls for telescope movement (Arrow keys and WASD)
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Ignore if user is typing in an input field
            const target = event.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                return;
            }

            const key = event.key.toLowerCase();

            // Prevent default browser behavior for arrow keys
            if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
                event.preventDefault();
            }

            // Map keys to movement functions
            switch (key) {
                case 'w':
                case 'arrowup':
                    startMoveUp();
                    break;
                case 's':
                case 'arrowdown':
                    startMoveDown();
                    break;
                case 'a':
                case 'arrowleft':
                    startMoveLeft();
                    break;
                case 'd':
                case 'arrowright':
                    startMoveRight();
                    break;
            }
        };

        const handleKeyUp = (event: KeyboardEvent) => {
            const key = event.key.toLowerCase();

            // Only handle movement keys
            if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(key)) {
                stopMove();
            }
        };

        // Add event listeners
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        // Cleanup
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [startMoveUp, startMoveDown, startMoveLeft, startMoveRight, stopMove]);

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