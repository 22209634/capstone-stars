// Utility functions for converting between decimal degrees and HMS/DMS format

/**
 * Convert decimal degrees RA to HMS format
 * @param degrees RA in decimal degrees (0-360)
 * @returns HMS string in format "HH:MM:SS.ss"
 */
export function degreesToHMS(degrees: number): string {
    // Normalize to 0-360
    degrees = ((degrees % 360) + 360) % 360;

    // Convert degrees to hours (1 hour = 15 degrees)
    const totalHours = degrees / 15;

    const hours = Math.floor(totalHours);
    const minutesDecimal = (totalHours - hours) * 60;
    const minutes = Math.floor(minutesDecimal);
    const seconds = (minutesDecimal - minutes) * 60;

    // Format with leading zeros
    const hh = hours.toString().padStart(2, '0');
    const mm = minutes.toString().padStart(2, '0');
    const ss = seconds.toFixed(2).padStart(5, '0');

    return `${hh}:${mm}:${ss}`;
}

/**
 * Convert decimal degrees Dec to DMS format
 * @param degrees Dec in decimal degrees (-90 to +90)
 * @returns DMS string in format "±DD:MM:SS.s"
 */
export function degreesToDMS(degrees: number): string {
    // Clamp to valid range
    degrees = Math.max(-90, Math.min(90, degrees));

    const sign = degrees >= 0 ? '+' : '-';
    const absDegrees = Math.abs(degrees);

    const deg = Math.floor(absDegrees);
    const minutesDecimal = (absDegrees - deg) * 60;
    const minutes = Math.floor(minutesDecimal);
    const seconds = (minutesDecimal - minutes) * 60;

    // Format with leading zeros
    const dd = deg.toString().padStart(2, '0');
    const mm = minutes.toString().padStart(2, '0');
    const ss = seconds.toFixed(1).padStart(4, '0');

    return `${sign}${dd}:${mm}:${ss}`;
}

/**
 * Convert HMS format to decimal degrees
 * @param hms HMS string in format "HH:MM:SS" or "HH MM SS"
 * @returns RA in decimal degrees (0-360)
 */
export function hmsToHours(hms: string): number {
    // Remove extra spaces and split by : or space
    const parts = hms.trim().replace(/\s+/g, ':').split(':');

    if (parts.length < 2) {
        throw new Error('Invalid HMS format. Use HH:MM:SS or HH MM SS');
    }

    const hours = parseFloat(parts[0]) || 0;
    const minutes = parseFloat(parts[1]) || 0;
    const seconds = parseFloat(parts[2]) || 0;

    if (hours < 0 || hours >= 24 || minutes < 0 || minutes >= 60 || seconds < 0 || seconds >= 60) {
        throw new Error('Invalid HMS values. Hours: 0-23, Minutes/Seconds: 0-59');
    }

    return hours + (minutes / 60) + (seconds / 3600);
}

/**
 * Convert HMS format to decimal degrees (for RA)
 * @param hms HMS string in format "HH:MM:SS" or "HH MM SS"
 * @returns RA in decimal degrees (0-360)
 */
export function hmsToDegrees(hms: string): number {
    const hours = hmsToHours(hms);
    return hours * 15; // 1 hour = 15 degrees
}

/**
 * Convert DMS format to decimal degrees
 * @param dms DMS string in format "±DD:MM:SS" or "DD MM SS"
 * @returns Dec in decimal degrees (-90 to +90)
 */
export function dmsToDegrees(dms: string): number {
    // Extract sign if present
    const sign = dms.trim().startsWith('-') ? -1 : 1;

    // Remove sign and extra spaces, split by : or space
    const cleanDms = dms.trim().replace(/^[+-]/, '').replace(/\s+/g, ':');
    const parts = cleanDms.split(':');

    if (parts.length < 2) {
        throw new Error('Invalid DMS format. Use DD:MM:SS or DD MM SS');
    }

    const degrees = parseFloat(parts[0]) || 0;
    const minutes = parseFloat(parts[1]) || 0;
    const seconds = parseFloat(parts[2]) || 0;

    if (degrees < 0 || degrees > 90 || minutes < 0 || minutes >= 60 || seconds < 0 || seconds >= 60) {
        throw new Error('Invalid DMS values. Degrees: 0-90, Minutes/Seconds: 0-59');
    }

    const decimalDegrees = degrees + (minutes / 60) + (seconds / 3600);
    return sign * decimalDegrees;
}