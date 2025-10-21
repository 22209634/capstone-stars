/// <reference types="vite/client" />

// Aladin Lite type definitions
interface AladinInstance {
  getRaDec(): [number, number];
  gotoRaDec(ra: number, dec: number): void;
  // Add other Aladin methods as needed
}

interface AladinConfig {
  survey?: string;
  fov?: number;
  target?: string;
  showReticle?: boolean;
  showZoomControl?: boolean;
  showFullscreenControl?: boolean;
  showLayersControl?: boolean;
  showCooLocation?: boolean;
  showFrame?: boolean;
  showProjectionControl?: boolean;
  showFov?: boolean;
}

interface AladinLite {
  init: Promise<void>;
  aladin(container: HTMLElement | null, config: AladinConfig): AladinInstance;
}

interface Window {
  A: AladinLite;
}
