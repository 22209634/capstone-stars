from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from pydantic import BaseModel
from app.services.simbad import visible_objects_bundoora
from app.services.weather_data import get_weather_status
from app.services.ascom_alpaca import ascom_client, ascom_camera_client
from app.services.usb_camera import usb_camera_service

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


# ASCOM Alpaca camera endpoints
@router.get("/camera/discover")
async def discover_ascom_cameras():
    """
    Discover ASCOM Alpaca cameras on the local network.
    """
    try:
        cameras = await ascom_camera_client.discover_cameras(timeout=5)
        camera_list = [camera.to_dict() for camera in cameras]
        return {"success": True, "data": camera_list}
    except Exception as e:
        return {"success": False, "error": str(e), "data": []}


@router.post("/camera/connect-ascom")
async def connect_to_ascom_camera(request: AscomConnectionRequest):
    """
    Connect to a specific ASCOM Alpaca camera.
    """
    try:
        from app.services.ascom_alpaca import AscomDevice

        camera = AscomDevice(
            device_name=request.deviceId,
            device_type="Camera",
            device_number=request.deviceNumber,
            unique_id=request.deviceId,
            ip_address=request.ipAddress,
            port=request.port
        )

        success = await ascom_camera_client.connect(camera)

        if success:
            return {"success": True, "message": "Connected to camera successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to connect to camera")

    except Exception as e:
        return {"success": False, "message": str(e)}


@router.post("/camera/disconnect-ascom")
async def disconnect_ascom_camera():
    """
    Disconnect from the current ASCOM Alpaca camera.
    """
    try:
        await ascom_camera_client.disconnect()
        return {"success": True, "message": "Disconnected from camera successfully"}
    except Exception as e:
        return {"success": False, "message": str(e)}


@router.get("/camera/status")
async def get_camera_status():
    """
    Get current camera status (ASCOM Alpaca).
    """
    try:
        status = await ascom_camera_client.get_status()
        return {"success": True, "data": status}
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.get("/camera/capture")
async def capture_camera_image(exposure: float = Query(0.1, description="Exposure time in seconds")):
    """
    Capture a single image from the camera.
    Returns the image as JPEG bytes.
    """
    try:
        from fastapi.responses import Response

        image_data = await ascom_camera_client.capture_image(exposure=exposure)

        if image_data:
            return Response(content=image_data, media_type="image/jpeg")
        else:
            raise HTTPException(status_code=500, detail="Failed to capture image")

    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error capturing image: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# All-Sky Camera endpoints (supports ASCOM, USB, and IP cameras)
class AllSkyCameraConnectionRequest(BaseModel):
    cameraType: str  # "ascom", "usb", or "ip"
    # ASCOM fields
    deviceId: Optional[str] = None
    ipAddress: Optional[str] = None
    port: Optional[int] = None
    deviceNumber: Optional[int] = None
    # USB fields
    usbDeviceId: Optional[int] = None
    # IP/RTSP fields
    streamUrl: Optional[str] = None


@router.get("/allsky-camera/discover-usb")
def discover_usb_cameras():
    """
    Discover USB cameras connected to the system.
    """
    try:
        cameras = usb_camera_service.discover_cameras()
        camera_list = [camera.to_dict() for camera in cameras]
        return {"success": True, "data": camera_list}
    except Exception as e:
        return {"success": False, "error": str(e), "data": []}


@router.get("/allsky-camera/discover-ascom")
async def discover_allsky_ascom_cameras():
    """
    Discover ASCOM Alpaca cameras for all-sky use.
    """
    try:
        from app.services.ascom_alpaca import AscomAlpacaClient
        temp_client = AscomAlpacaClient()
        cameras = await temp_client.discover_devices(timeout=5, device_type='camera')
        camera_list = [camera.to_dict() for camera in cameras]
        return {"success": True, "data": camera_list}
    except Exception as e:
        return {"success": False, "error": str(e), "data": []}


@router.post("/allsky-camera/connect")
async def connect_allsky_camera(request: AllSkyCameraConnectionRequest):
    """
    Connect to an all-sky camera (ASCOM, USB, or IP/RTSP).
    """
    try:
        if request.cameraType == "usb":
            if request.usbDeviceId is None:
                raise HTTPException(status_code=400, detail="USB device ID is required")

            success = usb_camera_service.connect(request.usbDeviceId)
            if success:
                return {"success": True, "message": f"Connected to USB camera {request.usbDeviceId}"}
            else:
                raise HTTPException(status_code=500, detail="Failed to connect to USB camera")

        elif request.cameraType == "ascom":
            if not all([request.deviceId, request.ipAddress, request.port, request.deviceNumber is not None]):
                raise HTTPException(status_code=400, detail="ASCOM connection requires deviceId, ipAddress, port, and deviceNumber")

            from app.services.ascom_alpaca import AscomDevice, AscomCameraClient

            # Create a separate ASCOM camera client for all-sky camera
            # (This is different from the telescope camera)
            device = AscomDevice(
                device_name=request.deviceId,
                device_type="Camera",
                device_number=request.deviceNumber,
                unique_id=request.deviceId,
                ip_address=request.ipAddress,
                port=request.port
            )

            # For now, we'll reuse the existing ascom_camera_client
            # In a production app, you might want separate clients for telescope and all-sky cameras
            success = await ascom_camera_client.connect(device)

            if success:
                return {"success": True, "message": "Connected to ASCOM camera"}
            else:
                raise HTTPException(status_code=500, detail="Failed to connect to ASCOM camera")

        elif request.cameraType == "ip":
            if not request.streamUrl:
                raise HTTPException(status_code=400, detail="Stream URL is required for IP cameras")

            # For IP cameras, we just validate the URL format and store it
            # The actual streaming will be handled by the frontend or a streaming proxy
            return {"success": True, "message": f"IP camera configured: {request.streamUrl}", "streamUrl": request.streamUrl}

        else:
            raise HTTPException(status_code=400, detail=f"Unknown camera type: {request.cameraType}")

    except HTTPException:
        raise
    except Exception as e:
        return {"success": False, "message": str(e)}


@router.post("/allsky-camera/disconnect")
async def disconnect_allsky_camera(camera_type: str = Query(..., description="Type of camera: ascom, usb, or ip")):
    """
    Disconnect from the all-sky camera.
    """
    try:
        if camera_type == "usb":
            usb_camera_service.disconnect()
            return {"success": True, "message": "Disconnected from USB camera"}
        elif camera_type == "ascom":
            await ascom_camera_client.disconnect()
            return {"success": True, "message": "Disconnected from ASCOM camera"}
        elif camera_type == "ip":
            # IP cameras don't need explicit disconnect
            return {"success": True, "message": "IP camera disconnected"}
        else:
            raise HTTPException(status_code=400, detail=f"Unknown camera type: {camera_type}")
    except Exception as e:
        return {"success": False, "message": str(e)}


@router.get("/allsky-camera/status")
async def get_allsky_camera_status(camera_type: str = Query(..., description="Type of camera: ascom, usb, or ip")):
    """
    Get all-sky camera status.
    """
    try:
        if camera_type == "usb":
            status = usb_camera_service.get_status()
            return {"success": True, "data": status}
        elif camera_type == "ascom":
            status = await ascom_camera_client.get_status()
            return {"success": True, "data": status}
        elif camera_type == "ip":
            # IP cameras are always "connected" if configured
            return {"success": True, "data": {"connected": True, "cameraType": "IP"}}
        else:
            raise HTTPException(status_code=400, detail=f"Unknown camera type: {camera_type}")
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.get("/allsky-camera/frame")
async def get_allsky_camera_frame(camera_type: str = Query(..., description="Type of camera: ascom, usb, or ip")):
    """
    Get a single frame from the all-sky camera.
    """
    try:
        from fastapi.responses import Response

        if camera_type == "usb":
            image_data = usb_camera_service.capture_frame()
            if image_data:
                return Response(
                    content=image_data,
                    media_type="image/jpeg",
                    headers={
                        "Cache-Control": "no-cache, no-store, must-revalidate",
                        "Pragma": "no-cache",
                        "Expires": "0"
                    }
                )
            else:
                raise HTTPException(status_code=500, detail="Failed to capture USB camera frame")

        elif camera_type == "ascom":
            image_data = await ascom_camera_client.capture_image(exposure=0.1)
            if image_data:
                return Response(
                    content=image_data,
                    media_type="image/jpeg",
                    headers={
                        "Cache-Control": "no-cache, no-store, must-revalidate",
                        "Pragma": "no-cache",
                        "Expires": "0"
                    }
                )
            else:
                raise HTTPException(status_code=500, detail="Failed to capture ASCOM camera frame")

        elif camera_type == "ip":
            raise HTTPException(status_code=400, detail="IP camera frames should be accessed directly via the stream URL")

        else:
            raise HTTPException(status_code=400, detail=f"Unknown camera type: {camera_type}")

    except HTTPException:
        raise
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error capturing all-sky frame: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/allsky-camera/stream")
async def stream_allsky_camera(camera_type: str = Query(..., description="Type of camera: usb or ascom")):
    """
    Stream MJPEG video from the all-sky camera (USB or ASCOM).
    """
    if camera_type not in ["usb", "ascom"]:
        raise HTTPException(status_code=400, detail="Only USB and ASCOM cameras support streaming")

    from fastapi.responses import StreamingResponse
    import asyncio

    async def generate_frames():
        """Generator that yields MJPEG frames."""
        while True:
            try:
                if camera_type == "usb":
                    frame_data = usb_camera_service.capture_frame()
                elif camera_type == "ascom":
                    frame_data = await ascom_camera_client.capture_image(exposure=0.1)
                else:
                    break

                if frame_data:
                    # MJPEG format: each frame is separated by a boundary
                    yield (b'--frame\r\n'
                           b'Content-Type: image/jpeg\r\n\r\n' + frame_data + b'\r\n')
                else:
                    # If frame capture fails, wait and retry
                    await asyncio.sleep(0.1)

                # Control frame rate (approx 10 FPS)
                await asyncio.sleep(0.1)

            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Error generating frame: {e}")
                await asyncio.sleep(0.5)
                # Continue trying

    return StreamingResponse(
        generate_frames(),
        media_type="multipart/x-mixed-replace; boundary=frame",
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
            "Connection": "close"
        }
    )
