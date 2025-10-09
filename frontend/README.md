# STARS Telescope Interface - Frontend

React + TypeScript frontend for the STARS telescope control system.

## Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Lucide React** - Icon library

## Project Structure

```
frontend/
├── src/
│   ├── components/     # Reusable UI components
│   │   ├── TelescopeView/      # Live camera feed & simulation
│   │   ├── TelescopeControls/  # Movement controls
│   │   ├── TelescopeStatus/    # Status indicators
│   │   ├── SkyObjectList/      # Celestial object browser
│   │   └── AllSkyView/         # All-sky visualization
│   ├── contexts/       # React context providers
│   ├── hooks/          # Custom React hooks
│   ├── pages/          # Page components
│   ├── services/       # API and external services
│   ├── styles/         # Global styles and themes
│   ├── types/          # TypeScript type definitions
│   └── utils/          # Utility functions
├── index.html          # HTML entry point
├── vite.config.ts      # Vite configuration
├── tsconfig.json       # TypeScript configuration
└── package.json        # Dependencies and scripts
```

## Features

### Telescope Control
- **Real-time Camera Feed**: Stream live video from connected telescope
- **Movement Controls**: Manual telescope positioning (RA/Dec, Alt/Az)
- **Go-To Function**: Automatically slew to celestial coordinates
- **Status Monitoring**: Real-time position and connection status

### Planetarium Mode (Default)
- **Sky Simulation**: Interactive sky view when no telescope connected
- **Object Browser**: Search and filter celestial objects
- **Coordinate Display**: HMS (Hours, Minutes, Seconds) system
- **All-Sky View**: Wide-field sky visualization

### Photography
- **Image Capture**: Take photos through telescope camera
- **Gallery View**: Browse captured images
- **Download**: Export images for analysis

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
npm run dev
```

The app will run on `http://localhost:5173`

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
```

## API Integration

The frontend connects to the backend API running on `http://localhost:8000`. The Vite dev server is configured with a proxy to forward `/api/*` requests to the backend.

### Main API Endpoints Used

- `GET /api/visible` - Get visible astronomical objects
- `POST /api/telescope/connect` - Connect to telescope hardware
- `POST /api/telescope/goto` - Slew to coordinates
- `GET /api/telescope/status` - Get telescope status
- `POST /api/camera/capture` - Capture image
- `GET /api/camera/stream` - Live video stream

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Mode Switching

The application automatically switches between:
1. **Planetarium Mode**: Default state, simulation-based
2. **Telescope Mode**: Activated when telescope connection is established

## Configuration

The app uses environment variables for API endpoints. Create a `.env.local` file:

```
VITE_API_URL=http://localhost:8000
```
