// Telescope movement controls

import { type StellariumEngine } from '@/services/stellariumHelpers.ts';

// How much to move in degrees for each step
const MOVEMENT_STEP = 2; // 2 degrees per movement

// Get current telescope direction
function getCurrentDirection(stel: StellariumEngine): { azimuth: number; altitude: number } {
    const yawRad = stel.core.observer.yaw;
    const pitchRad = stel.core.observer.pitch;

    // Convert radians to degrees
    const azimuth = (yawRad * 180 / Math.PI) % 360;
    const altitude = pitchRad * 180 / Math.PI;

    return { azimuth, altitude };
}

// Set telescope direction (internal helper)
function setDirection(stel: StellariumEngine, azimuth: number, altitude: number): void {
    const azRad = azimuth * Math.PI / 180;
    const altRad = altitude * Math.PI / 180;

    stel.core.observer.yaw = azRad;
    stel.core.observer.pitch = altRad;
    stel.core.observer.roll = 0;
}

// Move telescope left
export function moveLeft(stel: StellariumEngine): void {
    const current = getCurrentDirection(stel);
    let newAzimuth = current.azimuth - MOVEMENT_STEP;

    // Keep azimuth in 0-360 range
    if (newAzimuth < 0) newAzimuth += 360;

    setDirection(stel, newAzimuth, current.altitude);
}

// Move telescope right
export function moveRight(stel: StellariumEngine): void {
    const current = getCurrentDirection(stel);
    let newAzimuth = current.azimuth + MOVEMENT_STEP;

    // Keep azimuth in 0-360 range
    if (newAzimuth >= 360) newAzimuth -= 360;

    setDirection(stel, newAzimuth, current.altitude);
}

// Move telescope up
export function moveUp(stel: StellariumEngine): void {
    const current = getCurrentDirection(stel);
    let newAltitude = current.altitude + MOVEMENT_STEP;

    // Don't go above 90 degrees (zenith)
    if (newAltitude > 90) newAltitude = 90;

    setDirection(stel, current.azimuth, newAltitude);
}

// Move telescope down
export function moveDown(stel: StellariumEngine): void {
    const current = getCurrentDirection(stel);
    let newAltitude = current.altitude - MOVEMENT_STEP;

    // Don't go below -90 degrees (nadir)
    if (newAltitude < -90) newAltitude = -90;

    setDirection(stel, current.azimuth, newAltitude);
}