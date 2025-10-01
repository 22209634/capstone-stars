"""
PyObs Camera Simulator for Telescope Web App
Provides realistic star field image generation based on telescope coordinates
"""

import asyncio
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import random
import math
from datetime import datetime
import os
import base64
import io
from typing import Dict, Any, Optional, Tuple

try:
    from pyobs.modules import Module
    from pyobs.interfaces import ICamera, IExposure
    from pyobs.utils.enums import ExposureStatus
    import logging
except ImportError:
    print("PyObs not available, running in standalone mode")
    # Create dummy classes for standalone operation
    class Module:
        def __init__(self, *args, **kwargs):
            pass

    class ICamera:
        pass

    class IExposure:
        pass

    class ExposureStatus:
        IDLE = "idle"
        EXPOSING = "exposing"
        READOUT = "readout"
        DONE = "done"
        ERROR = "error"

class PyObsCameraSimulator:
    """Simulated camera that generates realistic star fields based on telescope coordinates"""

    def __init__(self, *args, **kwargs):

        # Camera properties
        self.width = 1920
        self.height = 1080
        self.binning = 1
        self.cooling = True
        self.temperature = -15.0  # degrees C
        self.gain = 1.0

        # Observatory location - Bundoora, Melbourne, Australia
        self.latitude = -37.7  # degrees (South)
        self.longitude = 145.05  # degrees (East)
        self.elevation = 100  # meters above sea level (approximate)
        self.site_name = "Bundoora, Melbourne, Australia"

        # Exposure state
        self.exposure_status = ExposureStatus.IDLE
        self.exposure_time = 1.0
        self.current_exposure_start = None

        # Star catalog for realistic positioning
        self.star_catalog = self._generate_star_catalog()

        # Image storage - use absolute path
        project_root = os.path.dirname(os.path.abspath(__file__))
        self.images_dir = os.path.join(project_root, "captured_images")
        os.makedirs(self.images_dir, exist_ok=True)

    def _generate_star_catalog(self) -> Dict[str, Dict]:
        """Generate a realistic star catalog with RA/Dec coordinates"""
        return {
            "Polaris": {"ra": 2.530, "dec": 89.264, "magnitude": 1.86},
            "Vega": {"ra": 18.615, "dec": 38.784, "magnitude": 0.03},
            "Sirius": {"ra": 6.752, "dec": -16.716, "magnitude": -1.46},
            "Betelgeuse": {"ra": 5.919, "dec": 7.407, "magnitude": 0.42},
            "Rigel": {"ra": 5.242, "dec": -8.202, "magnitude": 0.13},
            "Capella": {"ra": 5.278, "dec": 45.998, "magnitude": 0.08},
            "Arcturus": {"ra": 14.261, "dec": 19.182, "magnitude": -0.05},
            "Aldebaran": {"ra": 4.598, "dec": 16.509, "magnitude": 0.85},
            "Spica": {"ra": 13.420, "dec": -11.161, "magnitude": 0.97},
            "Antares": {"ra": 16.490, "dec": -26.432, "magnitude": 0.6},
            "Altair": {"ra": 19.846, "dec": 8.868, "magnitude": 0.77},
            "Deneb": {"ra": 20.690, "dec": 45.280, "magnitude": 1.25},
            "Regulus": {"ra": 10.139, "dec": 11.967, "magnitude": 1.35},
            "Procyon": {"ra": 7.655, "dec": 5.225, "magnitude": 0.34},
            "Achernar": {"ra": 1.629, "dec": -57.237, "magnitude": 0.46},
            # Add many fainter stars for realism
            **{f"Star_{i}": {
                "ra": random.uniform(0, 24),
                "dec": random.uniform(-90, 90),
                "magnitude": random.uniform(2.0, 6.0)
            } for i in range(200)}
        }

    def _ra_dec_to_pixel(self, ra: float, dec: float, center_ra: float, center_dec: float,
                        fov_degrees: float = 2.0) -> Tuple[Optional[int], Optional[int]]:
        """Convert RA/Dec coordinates to pixel coordinates in the image"""

        # Convert hours to degrees for RA
        ra_deg = ra * 15.0
        center_ra_deg = center_ra * 15.0

        # Calculate angular separation
        delta_ra = ra_deg - center_ra_deg
        delta_dec = dec - center_dec

        # Handle RA wraparound
        if delta_ra > 180:
            delta_ra -= 360
        elif delta_ra < -180:
            delta_ra += 360

        # Check if star is within field of view
        if abs(delta_ra) > fov_degrees/2 or abs(delta_dec) > fov_degrees/2:
            return None, None

        # Convert to pixel coordinates (simple linear projection)
        pixels_per_degree = min(self.width, self.height) / fov_degrees

        x = int(self.width/2 + delta_ra * pixels_per_degree * math.cos(math.radians(center_dec)))
        y = int(self.height/2 - delta_dec * pixels_per_degree)  # Flip Y axis

        # Check bounds
        if 0 <= x < self.width and 0 <= y < self.height:
            return x, y

        return None, None

    def _magnitude_to_brightness(self, magnitude: float) -> int:
        """Convert stellar magnitude to pixel brightness (0-255)"""
        # Brighter stars have lower magnitude values
        # Typical range: -1.5 (Sirius) to 6.0 (faintest visible)
        brightness = max(0, min(255, int(255 * (6.5 - magnitude) / 8.0)))
        return brightness

    def _add_star_to_image(self, draw: ImageDraw.Draw, x: int, y: int, brightness: int):
        """Add a star to the image with realistic appearance"""
        # Create a realistic star with some spreading
        size = max(1, min(8, brightness // 30))

        # Main star
        draw.ellipse([x-size//2, y-size//2, x+size//2, y+size//2],
                    fill=(brightness, brightness, brightness))

        # Add diffraction spikes for brighter stars
        if brightness > 150:
            spike_length = size * 3
            # Horizontal spike
            draw.line([x-spike_length, y, x+spike_length, y],
                     fill=(brightness//3, brightness//3, brightness//3), width=1)
            # Vertical spike
            draw.line([x, y-spike_length, x, y+spike_length],
                     fill=(brightness//3, brightness//3, brightness//3), width=1)

    def generate_star_field(self, ra_center: float, dec_center: float,
                           exposure_time: float = 1.0) -> Image.Image:
        """Generate a realistic star field image based on telescope pointing"""

        # Create black background
        image = Image.new('RGB', (self.width, self.height), color=(0, 0, 0))
        draw = ImageDraw.Draw(image)

        # Add stars from catalog
        stars_in_field = 0
        for star_name, star_data in self.star_catalog.items():
            x, y = self._ra_dec_to_pixel(
                star_data["ra"], star_data["dec"],
                ra_center, dec_center
            )

            if x is not None and y is not None:
                brightness = self._magnitude_to_brightness(star_data["magnitude"])
                # Scale brightness by exposure time
                brightness = min(255, int(brightness * math.sqrt(exposure_time)))

                if brightness > 10:  # Only show visible stars
                    self._add_star_to_image(draw, x, y, brightness)
                    stars_in_field += 1

        # Add some noise and background gradient for realism
        self._add_noise_and_background(image, exposure_time)

        print(f"Generated star field with {stars_in_field} stars at RA={ra_center:.3f}h, Dec={dec_center:.1f}°")

        return image

    def _add_noise_and_background(self, image: Image.Image, exposure_time: float):
        """Add realistic noise and background to the image"""
        # Convert to numpy for easier manipulation
        img_array = np.array(image)

        # Add subtle background gradient (light pollution)
        y_coords, x_coords = np.ogrid[:self.height, :self.width]
        background = 5 + 3 * np.sin(x_coords / self.width * np.pi) * np.sin(y_coords / self.height * np.pi)

        # Add shot noise
        noise_level = min(20, exposure_time * 2)
        noise = np.random.normal(0, noise_level, img_array.shape)

        # Combine
        img_array = img_array.astype(np.float32)
        img_array += background[:, :, np.newaxis]
        img_array += noise

        # Clip values
        img_array = np.clip(img_array, 0, 255).astype(np.uint8)

        # Update the original image
        modified_image = Image.fromarray(img_array)
        image.paste(modified_image)

    async def expose(self, exposure_time: float, open_shutter: bool = True,
                    abort_event: Optional[asyncio.Event] = None) -> str:
        """Start an exposure"""
        self.exposure_time = exposure_time
        self.exposure_status = ExposureStatus.EXPOSING
        self.current_exposure_start = datetime.now()

        print(f"Starting {exposure_time}s exposure...")

        # Simulate exposure time
        await asyncio.sleep(min(exposure_time, 0.1))  # Cap simulation time

        # Check for abort
        if abort_event and abort_event.is_set():
            self.exposure_status = ExposureStatus.ERROR
            raise RuntimeError("Exposure aborted")

        self.exposure_status = ExposureStatus.READOUT
        await asyncio.sleep(0.1)  # Simulate readout

        self.exposure_status = ExposureStatus.DONE

        # Generate filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"exposure_{timestamp}.fits"

        print(f"Exposure complete: {filename}")
        return filename

    async def abort_exposure(self):
        """Abort current exposure"""
        if self.exposure_status in [ExposureStatus.EXPOSING, ExposureStatus.READOUT]:
            self.exposure_status = ExposureStatus.ERROR
            print("Exposure aborted")

    def get_exposure_status(self) -> str:
        """Get current exposure status"""
        return self.exposure_status

    def get_exposure_progress(self) -> float:
        """Get exposure progress (0.0 to 1.0)"""
        if self.exposure_status != ExposureStatus.EXPOSING or not self.current_exposure_start:
            return 0.0

        elapsed = (datetime.now() - self.current_exposure_start).total_seconds()
        return min(1.0, elapsed / self.exposure_time)

    async def set_cooling(self, enabled: bool, temperature: float = -15.0):
        """Enable/disable camera cooling"""
        self.cooling = enabled
        if enabled:
            self.temperature = temperature
        print(f"Cooling {'enabled' if enabled else 'disabled'}, target: {temperature}°C")

    def get_temperature(self) -> float:
        """Get current camera temperature"""
        return self.temperature

    async def capture_and_save(self, ra_center: float, dec_center: float,
                             exposure_time: float = 1.0, target_name: str = None) -> Dict[str, Any]:
        """Capture an image and save it with metadata"""

        # Generate the star field
        image = self.generate_star_field(ra_center, dec_center, exposure_time)

        # Create metadata
        timestamp = datetime.now()
        metadata = {
            "timestamp": timestamp.isoformat(),
            "ra_center": ra_center,
            "dec_center": dec_center,
            "exposure_time": exposure_time,
            "target_name": target_name or f"RA{ra_center:.2f}_Dec{dec_center:.1f}",
            "camera": "PyObs Simulator",
            "temperature": self.temperature,
            "binning": self.binning,
            "gain": self.gain,
            "image_width": self.width,
            "image_height": self.height,
            "fov_degrees": 2.0,
            "observatory": {
                "name": self.site_name,
                "latitude": self.latitude,
                "longitude": self.longitude,
                "elevation": self.elevation
            }
        }

        # Save image
        filename = f"capture_{timestamp.strftime('%Y%m%d_%H%M%S')}.jpg"
        filepath = os.path.join(self.images_dir, filename)

        # Add metadata overlay
        self._add_metadata_overlay(image, metadata)

        # Save image
        image.save(filepath, quality=95)

        # Convert to base64 for web transmission
        buffered = io.BytesIO()
        image.save(buffered, format="JPEG", quality=85)
        img_base64 = base64.b64encode(buffered.getvalue()).decode()

        result = {
            "success": True,
            "filename": filename,
            "filepath": filepath,
            "metadata": metadata,
            "image_base64": img_base64,
            "image_size": len(buffered.getvalue())
        }

        print(f"Image captured and saved: {filename}")
        return result

    def _add_metadata_overlay(self, image: Image.Image, metadata: Dict[str, Any]):
        """Add metadata overlay to the image"""
        draw = ImageDraw.Draw(image)

        try:
            # Use default font if custom font not available
            font = ImageFont.load_default()
        except:
            font = None

        # Add metadata text
        text_lines = [
            f"Target: {metadata['target_name']}",
            f"RA: {metadata['ra_center']:.3f}h  Dec: {metadata['dec_center']:.1f}°",
            f"Exposure: {metadata['exposure_time']}s  Temp: {metadata['temperature']}°C",
            f"Site: {metadata['observatory']['name']}",
            f"Lat: {metadata['observatory']['latitude']:.1f}°  Lon: {metadata['observatory']['longitude']:.1f}°",
            f"{metadata['timestamp'][:19]}"
        ]

        y_offset = 10
        for line in text_lines:
            draw.text((10, y_offset), line, fill=(255, 255, 255), font=font)
            y_offset += 20

# Standalone functions for use without pyobs
def create_camera_simulator() -> PyObsCameraSimulator:
    """Create a camera simulator instance"""
    return PyObsCameraSimulator()

async def test_camera():
    """Test the camera simulator"""
    camera = create_camera_simulator()

    # Test capture at different coordinates
    test_coordinates = [
        (2.530, 89.264, "Polaris"),  # North Star
        (18.615, 38.784, "Vega"),   # Vega
        (6.752, -16.716, "Sirius"), # Sirius
    ]

    for ra, dec, name in test_coordinates:
        print(f"\nCapturing {name}...")
        result = await camera.capture_and_save(ra, dec, exposure_time=2.0, target_name=name)

        if result["success"]:
            print(f"[OK] Captured {name}: {result['filename']}")
            print(f"  Image size: {result['image_size']} bytes")
        else:
            print(f"[ERROR] Failed to capture {name}")

if __name__ == "__main__":
    print("PyObs Camera Simulator")
    print("======================")

    # Run test
    asyncio.run(test_camera())