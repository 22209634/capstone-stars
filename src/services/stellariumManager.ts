// Load Stellarium and add sky data

import { type StellariumEngine, setNightTime, pointTelescope } from './stellariumHelpers.ts';

declare global {
    interface Window {
        StelWebEngine: (config: any) => void;
    }
}

// Load and setup Stellarium
export function initStellarium(canvas: HTMLCanvasElement, onReady: (stel: StellariumEngine) => void): void {
    const script = document.createElement('script');
    script.src = '/stellarium/build/stellarium-web-engine.js';
    script.async = true;

    script.onload = () => {
        window.StelWebEngine({
            wasmFile: '/stellarium/build/stellarium-web-engine.wasm',
            canvas: canvas,
            onReady: (stel: StellariumEngine) => {
                // Set to nighttime
                setNightTime(stel);

                // Point south, looking up a bit
                pointTelescope(stel, 180, 30);

                // Add all the sky data
                addSkyData(stel);

                // Tell the main component we're ready
                onReady(stel);
            }
        });
    };

    document.body.appendChild(script);
}

// Add stars, planets, etc.
function addSkyData(stel: StellariumEngine): void {
    const dataUrl = '/stellarium/test-skydata/';
    const core = stel.core;

    core.stars.addDataSource({ url: dataUrl + 'stars' });
    core.skycultures.addDataSource({ url: dataUrl + 'skycultures/western', key: 'western' });
    core.dsos.addDataSource({ url: dataUrl + 'dso' });
    core.landscapes.addDataSource({ url: dataUrl + 'landscapes/guereins', key: 'guereins' });
    core.milkyway.addDataSource({ url: dataUrl + 'surveys/milkyway' });
    core.planets.addDataSource({ url: dataUrl + 'surveys/sso/moon', key: 'moon' });
    core.planets.addDataSource({ url: dataUrl + 'surveys/sso/sun', key: 'sun' });
}