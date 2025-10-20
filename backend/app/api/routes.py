from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from pydantic import BaseModel
from app.services.simbad import visible_objects_bundoora
from app.services.weather_data import get_weather_status
from app.services.ascom_alpaca import ascom_client

router = APIRouter(prefix="/api", tags=["telescope"])


# Request models
class AscomConnectionRequest(BaseModel):
    deviceId: str
    ipAddress: str
    port: int
    deviceNumber: int


class SlewRequest(BaseModel):
    rightAscension: float
    declination: float


class TrackingRequest(BaseModel):
    enabled: bool

@router.get("/visible")
def get_visible_objects(
    min_alt_deg: float = Query(30.0, description="Minimum altitude in degrees"),
    magnitude: float = Query(6.5, description="Maximum visual magnitude")
):
    """
    Get visible astronomical objects based on altitude and magnitude filters.
    """
    try:
        objects = visible_objects_bundoora(min_alt_deg, magnitude)
        if not objects:
            return {
                "message": "No objects found. Check if it is night time or adjust filters.",
                "data": []
            }
        return {"count": len(objects), "data": objects}
    except Exception as e:
        return {"error": str(e)}

@router.get("/weather")
def get_weather():
    """
    Get current weather data from ThingSpeak including temperature, humidity, pressure, dew point,
    and telescope safety status.
    """
    try:
        weather_data = get_weather_status()
        return {"success": True, "data": weather_data}
    except Exception as e:
        return {"success": False, "error": str(e)}


# ASCOM Alpaca telescope endpoints
@router.get("/telescope/discover")
async def discover_ascom_devices():
    """
    Discover ASCOM Alpaca telescopes on the local network.
    """
    try:
        devices = await ascom_client.discover_devices(timeout=5)
        device_list = [device.to_dict() for device in devices]
        return {"success": True, "data": device_list}
    except Exception as e:
        return {"success": False, "error": str(e), "data": []}


@router.post("/telescope/connect-ascom")
async def connect_to_ascom(request: AscomConnectionRequest):
    """
    Connect to a specific ASCOM Alpaca telescope.
    """
    try:
        from app.services.ascom_alpaca import AscomDevice

        device = AscomDevice(
            device_name=request.deviceId,
            device_type="Telescope",
            device_number=request.deviceNumber,
            unique_id=request.deviceId,
            ip_address=request.ipAddress,
            port=request.port
        )

        success = await ascom_client.connect(device)

        if success:
            return {"success": True, "message": "Connected successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to connect to telescope")

    except Exception as e:
        return {"success": False, "message": str(e)}


@router.post("/telescope/disconnect-ascom")
async def disconnect_ascom():
    """
    Disconnect from the current ASCOM Alpaca telescope.
    """
    try:
        await ascom_client.disconnect()
        return {"success": True, "message": "Disconnected successfully"}
    except Exception as e:
        return {"success": False, "message": str(e)}


@router.get("/telescope/status")
async def get_telescope_status():
    """
    Get current telescope status (ASCOM Alpaca).
    """
    try:
        status = await ascom_client.get_status()
        return {"success": True, "data": status}
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.post("/telescope/slew")
async def slew_to_coordinates(request: SlewRequest):
    """
    Slew telescope to specified coordinates (ASCOM Alpaca).
    """
    try:
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Slew request received: RA={request.rightAscension}, Dec={request.declination}")

        success = await ascom_client.slew_to_coordinates(
            request.rightAscension,
            request.declination
        )
        if success:
            logger.info("Slew command sent successfully")
            return {"success": True, "message": "Slewing to coordinates"}
        else:
            logger.error("Slew command failed")
            raise HTTPException(status_code=500, detail="Failed to slew telescope")
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Slew exception: {str(e)}")
        return {"success": False, "message": str(e)}


@router.post("/telescope/tracking")
async def set_tracking(request: TrackingRequest):
    """
    Enable or disable telescope tracking (ASCOM Alpaca).
    """
    try:
        success = await ascom_client.set_tracking(request.enabled)
        if success:
            return {"success": True, "message": f"Tracking {'enabled' if request.enabled else 'disabled'}"}
        else:
            raise HTTPException(status_code=500, detail="Failed to set tracking")
    except Exception as e:
        return {"success": False, "message": str(e)}


@router.post("/telescope/abort")
async def abort_slew():
    """
    Abort current slew operation (ASCOM Alpaca).
    """
    try:
        success = await ascom_client.abort_slew()
        if success:
            return {"success": True, "message": "Slew aborted"}
        else:
            raise HTTPException(status_code=500, detail="Failed to abort slew")
    except Exception as e:
        return {"success": False, "message": str(e)}
