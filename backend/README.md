# STARS Telescope Interface - Backend

FastAPI backend for telescope control, astronomical queries, and camera management.

## Tech Stack

- **FastAPI** - Modern Python web framework
- **Uvicorn** - ASGI server
- **Astropy** - Astronomy library for calculations
- **Astroquery** - Query astronomical databases (SIMBAD)
- **NumPy** - Numerical computing

## Project Structure

```
backend/
├── app/
│   ├── api/              # API routes and endpoints
│   │   ├── __init__.py
│   │   └── routes.py     # Main API routes
│   ├── services/         # Business logic
│   │   ├── __init__.py
│   │   └── simbad.py     # SIMBAD query service
│   ├── telescope/        # Telescope control modules
│   │   ├── multi_target_test.py      # Multi-target automation
│   │   ├── react_telescope_server.py # Telescope control server
│   │   └── simple_telescope_server.py # Simple control interface
│   ├── models/           # Data models
│   ├── utils/            # Utility functions
│   ├── __init__.py
│   └── main.py           # Application entry point
├── venv/                 # Virtual environment (gitignored)
├── requirements.txt      # Python dependencies
├── .env.example          # Environment variables template
└── README.md
```

## Features

### Telescope Control
- **Hardware Interface**: Connect to real telescope mounts
- **Movement Control**: Precise positioning (RA/Dec, Alt/Az)
- **Go-To Functionality**: Automated slewing to coordinates
- **Status Monitoring**: Real-time position tracking
- **Safety Limits**: Altitude and movement constraints

### Camera Integration
- **Live Streaming**: Real-time video feed from telescope camera
- **Image Capture**: Automated photography
- **Image Storage**: Save and retrieve captured images
- **Exposure Control**: Configurable capture settings

### Astronomical Queries
- **SIMBAD Integration**: Query celestial object database
- **Visibility Calculations**: Determine observable objects
- **Coordinate Conversion**: Transform between coordinate systems
- **Time-based Filtering**: Night-time object visibility

### Automation
- **Multi-target Sequencing**: Automated observation schedules
- **Time-lapse Photography**: Scheduled image capture
- **Object Tracking**: Compensate for Earth's rotation

## Getting Started

### Prerequisites

- Python 3.9+
- pip
- Telescope hardware (optional, runs in simulation mode without)

### Installation

1. Create and activate virtual environment:

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

2. Install dependencies:

```bash
# Windows
python -m pip install -r requirements.txt

# macOS/Linux
pip install -r requirements.txt
```

3. Create environment file:

```bash
cp .env.example .env
# Edit .env with your configuration
```

### Running the Server

```bash
# Development mode with auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Production mode
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API Endpoints

### Health Check
**GET `/`**
Health check endpoint

### Astronomical Objects
**GET `/api/visible`**
Get visible astronomical objects

**Query Parameters:**
- `min_alt_deg` (float, default: 30.0) - Minimum altitude in degrees
- `magnitude` (float, default: 6.5) - Maximum visual magnitude

**Response:**
```json
{
  "count": 10,
  "data": [
    {
      "name": "Sirius",
      "otype": "Star",
      "ra": 101.28,
      "dec": -16.72,
      "alt": 45.3,
      "az": 180.5,
      "magnitude": -1.46
    }
  ]
}
```

### Telescope Control (Planned/In Development)
- `POST /api/telescope/connect` - Connect to telescope
- `POST /api/telescope/goto` - Slew to coordinates
- `GET /api/telescope/status` - Get current status
- `POST /api/telescope/stop` - Emergency stop

### Camera Control (Planned/In Development)
- `GET /api/camera/stream` - Live video stream
- `POST /api/camera/capture` - Capture image
- `GET /api/camera/images` - List captured images
- `GET /api/camera/images/{id}` - Download image

## Configuration

Edit `.env` file to configure:
- Server host and port
- Observatory location (latitude/longitude)
- Telescope connection settings
- Camera settings
- Default query parameters
- Debug mode

## Observatory Location

Default location is set to Bundoora, Melbourne:
- Latitude: -37.7°
- Longitude: 145.05°

Update in `.env` file for different locations.

## Development

### Adding New Routes

1. Create route handlers in `app/api/routes.py`
2. Include router in `app/main.py`

### Adding New Services

1. Create service module in `app/services/`
2. Import and use in route handlers

### Telescope Integration

The telescope control modules in `app/telescope/` provide:
- `simple_telescope_server.py` - Basic telescope control
- `react_telescope_server.py` - Advanced reactive control
- `multi_target_test.py` - Multi-target automation testing

## Safety Features

- Altitude limits to prevent telescope damage
- Movement constraints
- Emergency stop functionality
- Connection monitoring
- Error handling and recovery

## Modes

1. **Simulation Mode** (Default): Runs without telescope hardware
2. **Connected Mode**: Full control with real telescope hardware
