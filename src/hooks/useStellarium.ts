import { useState, useEffect } from 'react';
import { type StellariumEngine } from '@/services/stellariumHelpers';

let globalStellarium: StellariumEngine | null = null;
const listeners: Array<() => void> = [];

export function setGlobalStellarium(stel: StellariumEngine) {
    globalStellarium = stel;
    // Notify all components using the hook
    listeners.forEach(listener => listener());
}

export function useStellarium() {
    const [, forceUpdate] = useState({});

    useEffect(() => {
        const listener = () => forceUpdate({});
        listeners.push(listener);

        return () => {
            const index = listeners.indexOf(listener);
            if (index > -1) listeners.splice(index, 1);
        };
    }, []);

    return globalStellarium;
}