// Utilities for Stellarium

export interface StellariumEngine {
    core: {
        observer: {
            utc: number;
            yaw: number;
            pitch: number;
            roll: number;
        };
        atmosphere: {
            visible: boolean;
        };
        stars: { addDataSource: (config: { url: string }) => void };
        skycultures: { addDataSource: (config: { url: string; key: string }) => void };
        dsos: { addDataSource: (config: { url: string }) => void };
        landscapes: { addDataSource: (config: { url: string; key: string }) => void };
        milkyway: { addDataSource: (config: { url: string }) => void };
        planets: { addDataSource: (config: { url: string; key: string }) => void };
    };
}

// Convert date string to Julian Day (because Stellarium uses Julian Day time)
export function toJulianDate(dateStr: string): number {
    const date = new Date(dateStr);
    return date.getTime() / 86400000 + 2440587.5;
}

// Set time to nighttime
export function setNightTime(stel: StellariumEngine): void {
    const nightTime = toJulianDate("2023-06-01T00:00:00Z");
    stel.core.observer.utc = nightTime;
}

// Point telescope in a direction
export function pointTelescope(stel: StellariumEngine, azimuth: number, altitude: number): void {
    const azRad = azimuth * Math.PI / 180;
    const altRad = altitude * Math.PI / 180;

    stel.core.observer.yaw = azRad;
    stel.core.observer.pitch = altRad;
    stel.core.observer.roll = 0;
}