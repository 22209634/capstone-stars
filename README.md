# STARS Telescope Interface

## About
STARS is a web-based telescope control interface that enables remote operation of telescopes. The application provides live camera feeds, astrophotography, and celestial object tracking. When no telescope is connected, it operates in planetarium/simulation mode for planning and demonstration purposes.

## Demo

https://github.com/user-attachments/assets/0be40faf-f0af-4fa7-9cbd-0ac34874912c

## Project Structure

This project follows a monorepo structure with separated frontend and backend:

```
capstone-stars/
├── frontend/           # React + TypeScript frontend
│   ├── src/           # Source code
│   │   ├── components/    # UI components
│   │   ├── services/      # API integration
│   │   ├── contexts/      # State management
│   │   └── pages/         # Page components
│   ├── index.html     # Entry point
│   ├── package.json   # Frontend dependencies
│   └── README.md      # Frontend documentation
│
├── backend/           # Python FastAPI backend
│   ├── app/          # Application code
│   │   ├── api/          # API routes
│   │   ├── services/     # Astronomical queries
│   │   ├── telescope/    # Telescope control & camera
│   │   └── models/       # Data models
│   ├── requirements.txt
│   └── README.md     # Backend documentation
│
├── docs/             # Documentation
└── README.md         # This file
```

## Quick Start

### Prerequisites
- Node.js 24 and npm
- Python 3.13 and pip

### First Steps

Clone and cd into the repository

```bash
git clone https://github.com/22209634/capstone-stars
cd capstone-stars
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

### Backend Setup

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend API runs on `http://localhost:8000`

### API Documentation
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Tech Stack

### Frontend
- React 19 + TypeScript
- Vite (build tool)
- Lucide React (icons)

### Backend
- FastAPI (Python web framework)
- Astropy (astronomical calculations)
- Astroquery (SIMBAD database queries)
- Uvicorn (ASGI server)

## Development

See individual README files for detailed instructions:
- [Frontend README](./frontend/README.md)
- [Backend README](./backend/README.md)

## Features

### Real Telescope Control
- **Live Camera Feed**: Stream real-time video from telescope camera
- **Remote Operation**: Control telescope movement and positioning
- **Automated Photography**: Schedule and capture astronomical images
- **Image Gallery**: View and download captured photos

### Planetarium Mode (Default)
- Simulated sky view when no telescope is connected
- Celestial object database queries via SIMBAD
- Planning and demonstration capabilities
- Altitude and magnitude filtering
- Location-based calculations (Bundoora, Melbourne)

### Smart Features
- Automatic target tracking
- Object identification
- Coordinate system conversion
- Real-time position calculations

## Running Both Frontend and Backend

From the root directory:

```bash
# Install frontend dependencies
npm run install:frontend

# Install backend dependencies (with venv activated)
npm run install:backend

# Run frontend
npm run dev

# Run backend (in a separate terminal)
npm run backend
```

**Tip**: Open two terminals to run frontend and backend simultaneously.

## Modes of Operation

1. **Planetarium Mode** (Default): Simulated sky visualization for planning
2. **Telescope Mode**: Live control when telescope hardware is connected
