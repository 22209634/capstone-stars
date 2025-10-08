// Authored by Claude Code

import React, { createContext, useContext, useState, useRef, type ReactNode } from 'react';

type TelescopeStatus = 'Tracking' | 'Slewing' | 'Idle';

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
    const slewTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const continuousMoveInterval = useRef<any>(null);

    const setCoordinates = (newRa: number, newDec: number) => {
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
        if (!aladinInstance || isParked) return;
        const currentRaDec = aladinInstance.getRaDec();
        const newDec = Math.min(90, currentRaDec[1] + 0.05); // Clamp to max +90°
        slewTo(currentRaDec[0], newDec);
    };

    const moveDown = () => {
        if (!aladinInstance || isParked) return;
        const currentRaDec = aladinInstance.getRaDec();
        const newDec = Math.max(-90, currentRaDec[1] - 0.05); // Clamp to min -90°
        slewTo(currentRaDec[0], newDec);
    };

    const moveLeft = () => {
        if (!aladinInstance || isParked) return;
        const currentRaDec = aladinInstance.getRaDec();
        const newRa = (currentRaDec[0] + 0.05) % 360; // Wrap around 0-360
        slewTo(newRa, currentRaDec[1]);
    };

    const moveRight = () => {
        if (!aladinInstance || isParked) return;
        const currentRaDec = aladinInstance.getRaDec();
        const newRa = (currentRaDec[0] - 0.05 + 360) % 360; // Wrap around 0-360
        slewTo(newRa, currentRaDec[1]);
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
        continuousMoveInterval.current = setInterval(() => {
            moveUp();
        }, 100); // Move every 100ms
    };

    const startMoveDown = () => {
        if (isParked || continuousMoveInterval.current) return;
        moveDown();
        continuousMoveInterval.current = setInterval(() => {
            moveDown();
        }, 100);
    };

    const startMoveLeft = () => {
        if (isParked || continuousMoveInterval.current) return;
        moveLeft();
        continuousMoveInterval.current = setInterval(() => {
            moveLeft();
        }, 100);
    };

    const startMoveRight = () => {
        if (isParked || continuousMoveInterval.current) return;
        moveRight();
        continuousMoveInterval.current = setInterval(() => {
            moveRight();
        }, 100);
    };

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
    };

    return (
        <TelescopeContext.Provider value={value}>
            {children}
        </TelescopeContext.Provider>
    );
};