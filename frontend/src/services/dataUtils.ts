// Data utilities

import { type StellariumEngine } from '@/services/stellariumHelpers';

// Convert radians to degrees
function radiansToDegrees(radians: number): number {
    return radians * 180 / Math.PI;
}

// Get current telescope direction
export function getCurrentDirection(stel: StellariumEngine): { azimuth: number; altitude: number } {
    if (!stel?.core?.observer) {
        return { azimuth: 0, altitude: 0 };
    }

    const yawRad = stel.core.observer.yaw;
    const pitchRad = stel.core.observer.pitch;

    // Convert radians to degrees
    let azimuth = radiansToDegrees(yawRad) % 360;
    const altitude = radiansToDegrees(pitchRad);

    // Ensure azimuth is positive
    if (azimuth < 0) azimuth += 360;

    return {
        azimuth: Math.round(azimuth * 10) / 10,  // Round to 1 decimal
        altitude: Math.round(altitude * 10) / 10
    };
}

// Get current telescope time (UTC)
export function getCurrentTime(stel: StellariumEngine): Date | null {
    if (!stel?.core?.observer) {
        return null;
    }

    const julianDay = stel.core.observer.utc;
    // Convert Julian Day back to regular date
    const milliseconds = (julianDay - 2440587.5) * 86400000;
    return new Date(milliseconds);
}

// Get all telescope data at once
export function getTelescopeData(stel: StellariumEngine) {
    const direction = getCurrentDirection(stel);
    const time = getCurrentTime(stel);

    return {
        azimuth: direction.azimuth,
        altitude: direction.altitude,
        time
    };
}