import { useState, useEffect, useRef } from 'react';
import { useStellarium } from '@/hooks/useStellarium';
import { getCurrentDirection, getCurrentTime } from '@/services/dataUtils';

export interface LiveTelescopeData {
    azimuth: number;
    altitude: number;
    time: Date | null;
    isConnected: boolean;
}

export function useLiveTelescopeData(updateInterval: number = 500) { // Changed to 500ms
    const stellarium = useStellarium();
    const mountedRef = useRef(true);

    const [data, setData] = useState<LiveTelescopeData>({
        azimuth: 0,
        altitude: 0,
        time: null,
        isConnected: false
    });

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        if (!stellarium) {
            if (mountedRef.current) {
                setData(prev => ({ ...prev, isConnected: false }));
            }
            return;
        }

        const updateData = () => {
            if (!mountedRef.current) return; // Don't update if unmounted

            try {
                const direction = getCurrentDirection(stellarium);
                const time = getCurrentTime(stellarium);

                setData({
                    azimuth: direction.azimuth,
                    altitude: direction.altitude,
                    time: time,
                    isConnected: true
                });
            } catch (error) {
                console.error('Error updating telescope data:', error);
                if (mountedRef.current) {
                    setData(prev => ({ ...prev, isConnected: false }));
                }
            }
        };

        updateData(); // Initial update
        const interval = setInterval(updateData, updateInterval);

        return () => clearInterval(interval);
    }, [stellarium, updateInterval]);

    return data;
}