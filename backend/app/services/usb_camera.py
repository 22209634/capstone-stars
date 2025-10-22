"""
USB Camera discovery and management service.
This module handles discovery and enumeration of USB cameras on Windows.
"""

import logging
from typing import List, Dict, Optional
import platform

logger = logging.getLogger(__name__)


class UsbCamera:
    """Represents a USB camera device."""

    def __init__(self, device_id: int, device_name: str):
        self.device_id = device_id
        self.device_name = device_name

    def to_dict(self) -> Dict:
        return {
            "deviceId": self.device_id,
            "deviceName": self.device_name,
            "deviceType": "USB"
        }


class UsbCameraService:
    """Service for discovering and managing USB cameras."""

    def __init__(self):
        self.connected_camera_id: Optional[int] = None

    def discover_cameras(self) -> List[UsbCamera]:
        """
        Discover USB cameras connected to the system.

        Returns:
            List of UsbCamera objects
        """
        cameras = []
        system = platform.system()

        if system == "Windows":
            cameras = self._discover_windows_cameras()
        elif system == "Linux":
            cameras = self._discover_linux_cameras()
        elif system == "Darwin":  # macOS
            cameras = self._discover_macos_cameras()
        else:
            logger.warning(f"USB camera discovery not supported on {system}")

        logger.info(f"Discovered {len(cameras)} USB camera(s)")
        return cameras

    def _discover_windows_cameras(self) -> List[UsbCamera]:
        """Discover USB cameras on Windows using DirectShow/Media Foundation."""
        cameras = []

        try:
            # Try using opencv-python for camera enumeration
            import cv2

            # Try camera indices 0-9 (most systems won't have more than 10 cameras)
            for camera_id in range(10):
                cap = cv2.VideoCapture(camera_id, cv2.CAP_DSHOW)
                if cap.isOpened():
                    # Get camera name if available
                    backend_name = cap.getBackendName()
                    camera_name = f"USB Camera {camera_id} ({backend_name})"

                    # Try to get more info
                    try:
                        # Some cameras expose their name via properties
                        # This is platform/driver dependent
                        camera_name = f"USB Camera {camera_id}"
                    except:
                        pass

                    cameras.append(UsbCamera(camera_id, camera_name))
                    logger.info(f"Found USB camera: {camera_name} (ID: {camera_id})")
                    cap.release()
                else:
                    # No more cameras found
                    cap.release()

        except ImportError:
            logger.error("OpenCV (cv2) is required for USB camera discovery. Install with: pip install opencv-python")
        except Exception as e:
            logger.error(f"Error discovering Windows USB cameras: {e}")

        return cameras

    def _discover_linux_cameras(self) -> List[UsbCamera]:
        """Discover USB cameras on Linux using V4L2."""
        cameras = []

        try:
            import cv2

            # On Linux, enumerate /dev/video* devices
            for camera_id in range(10):
                cap = cv2.VideoCapture(camera_id, cv2.CAP_V4L2)
                if cap.isOpened():
                    camera_name = f"USB Camera {camera_id} (V4L2)"
                    cameras.append(UsbCamera(camera_id, camera_name))
                    logger.info(f"Found USB camera: {camera_name}")
                    cap.release()
                else:
                    cap.release()

        except ImportError:
            logger.error("OpenCV (cv2) is required for USB camera discovery")
        except Exception as e:
            logger.error(f"Error discovering Linux USB cameras: {e}")

        return cameras

    def _discover_macos_cameras(self) -> List[UsbCamera]:
        """Discover USB cameras on macOS using AVFoundation."""
        cameras = []

        try:
            import cv2

            # On macOS, use AVFoundation backend
            for camera_id in range(10):
                cap = cv2.VideoCapture(camera_id, cv2.CAP_AVFOUNDATION)
                if cap.isOpened():
                    camera_name = f"USB Camera {camera_id} (AVFoundation)"
                    cameras.append(UsbCamera(camera_id, camera_name))
                    logger.info(f"Found USB camera: {camera_name}")
                    cap.release()
                else:
                    cap.release()

        except ImportError:
            logger.error("OpenCV (cv2) is required for USB camera discovery")
        except Exception as e:
            logger.error(f"Error discovering macOS USB cameras: {e}")

        return cameras

    def connect(self, camera_id: int) -> bool:
        """
        Connect to a USB camera.

        Args:
            camera_id: The camera device ID

        Returns:
            True if connection successful
        """
        try:
            import cv2

            # Test that camera can be opened with DirectShow on Windows
            system = platform.system()
            if system == "Windows":
                cap = cv2.VideoCapture(camera_id, cv2.CAP_DSHOW)
            elif system == "Linux":
                cap = cv2.VideoCapture(camera_id, cv2.CAP_V4L2)
            elif system == "Darwin":
                cap = cv2.VideoCapture(camera_id, cv2.CAP_AVFOUNDATION)
            else:
                cap = cv2.VideoCapture(camera_id)

            if cap.isOpened():
                cap.release()
                self.connected_camera_id = camera_id
                logger.info(f"Connected to USB camera {camera_id}")
                return True
            else:
                logger.error(f"Failed to open USB camera {camera_id}")
                return False

        except Exception as e:
            logger.error(f"Error connecting to USB camera: {e}")
            return False

    def disconnect(self) -> bool:
        """Disconnect from the current USB camera."""
        if self.connected_camera_id is not None:
            logger.info(f"Disconnected from USB camera {self.connected_camera_id}")
            self.connected_camera_id = None
        return True

    def get_status(self) -> Dict:
        """Get current USB camera status."""
        return {
            "connected": self.connected_camera_id is not None,
            "cameraId": self.connected_camera_id,
            "cameraType": "USB"
        }

    def capture_frame(self, camera_id: Optional[int] = None) -> Optional[bytes]:
        """
        Capture a single frame from the USB camera.

        Args:
            camera_id: Camera ID to capture from, or use connected camera if None

        Returns:
            JPEG image as bytes, or None if failed
        """
        target_id = camera_id if camera_id is not None else self.connected_camera_id

        if target_id is None:
            logger.error("No camera ID specified and no camera connected")
            return None

        try:
            import cv2
            import numpy as np

            # Use the appropriate backend for the platform
            system = platform.system()
            if system == "Windows":
                cap = cv2.VideoCapture(target_id, cv2.CAP_DSHOW)
            elif system == "Linux":
                cap = cv2.VideoCapture(target_id, cv2.CAP_V4L2)
            elif system == "Darwin":
                cap = cv2.VideoCapture(target_id, cv2.CAP_AVFOUNDATION)
            else:
                cap = cv2.VideoCapture(target_id)

            if not cap.isOpened():
                logger.error(f"Failed to open camera {target_id}")
                return None

            # Read a frame
            ret, frame = cap.read()
            cap.release()

            if not ret or frame is None:
                logger.error(f"Failed to capture frame from camera {target_id}")
                return None

            # Encode frame as JPEG
            ret, jpeg = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
            if not ret:
                logger.error("Failed to encode frame as JPEG")
                return None

            return jpeg.tobytes()

        except Exception as e:
            logger.error(f"Error capturing frame: {e}")
            return None


# Global USB camera service instance
usb_camera_service = UsbCameraService()
