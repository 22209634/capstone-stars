"""
Enhanced Telescope Server with PyObs Camera Integration
Combines telescope control with realistic image capture
"""
import win32com.client
import pythoncom
from datetime import datetime
from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
import asyncio
import sys
import os
import threading

# Add the parent directory to path for importing the camera simulator
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from pyobs_camera_sim import PyObsCameraSimulator

class ASCOMTelescope:
    def __init__(self, driver_id="ASCOM.SimScope.Telescope"):
        self.driver_id = driver_id
        self.telescope = None
        self.connected = False

    @staticmethod
    def get_available_telescopes():
        """Get list of available ASCOM telescope drivers using Chooser"""
        try:
            pythoncom.CoInitialize()
            chooser = win32com.client.Dispatch("ASCOM.Utilities.Chooser")
            chooser.DeviceType = "Telescope"

            # Get the list of available telescopes
            telescopes = []
            try:
                # Access the registered drivers
                profile = win32com.client.Dispatch("ASCOM.Utilities.Profile")
                drivers = profile.RegisteredDevices("Telescope")

                for driver_id in drivers:
                    try:
                        name = profile.GetValue(driver_id, "", "")
                        telescopes.append({
                            'id': driver_id,
                            'name': name if name else driver_id
                        })
                    except:
                        telescopes.append({
                            'id': driver_id,
                            'name': driver_id
                        })
            except Exception as e:
                print(f"Error getting telescope list: {e}")

            pythoncom.CoUninitialize()
            return telescopes
        except Exception as e:
            print(f"Error initializing chooser: {e}")
            return []

    @staticmethod
    def show_chooser():
        """Show ASCOM Chooser dialog and return selected driver ID"""
        try:
            pythoncom.CoInitialize()
            chooser = win32com.client.Dispatch("ASCOM.Utilities.Chooser")
            chooser.DeviceType = "Telescope"
            selected_driver = chooser.Choose("")
            pythoncom.CoUninitialize()
            return selected_driver
        except Exception as e:
            print(f"Chooser error: {e}")
            pythoncom.CoUninitialize()
            return None

    def connect(self):
        try:
            pythoncom.CoInitialize()
            self.telescope = win32com.client.Dispatch(self.driver_id)
            self.telescope.Connected = True
            self.connected = True
            print(f"Connected to telescope: {self.telescope.Name}")
            return True
        except Exception as e:
            print(f"Connection failed: {e}")
            return False

    def disconnect(self):
        if self.telescope and self.connected:
            try:
                self.telescope.Connected = False
                self.connected = False
                print("Disconnected from telescope")
            except:
                pass
            finally:
                pythoncom.CoUninitialize()

    def get_status(self):
        if not self.connected:
            return None
        try:
            pythoncom.CoInitialize()

            status = {
                'connected': self.telescope.Connected,
                'tracking': self.telescope.Tracking,
                'slewing': self.telescope.Slewing,
                'rightAscension': self.telescope.RightAscension,
                'declination': self.telescope.Declination,
                'altitude': self.telescope.Altitude,
                'azimuth': self.telescope.Azimuth,
                'timestamp': datetime.now().isoformat()
            }
            return status
        except Exception as e:
            print(f"Error getting status: {e}")
            return None

    def slew_to_coordinates(self, ra_hours, dec_degrees):
        if not self.connected:
            return False
        try:
            pythoncom.CoInitialize()

            if not self.telescope.Tracking:
                self.telescope.Tracking = True
                print("Enabled tracking for slew")

            print(f"Slewing to RA: {ra_hours}h, Dec: {dec_degrees} degrees")
            self.telescope.SlewToCoordinates(ra_hours, dec_degrees)
            return True
        except Exception as e:
            print(f"Slew error: {e}")
            return False

    def set_tracking(self, enabled):
        if not self.connected:
            return False
        try:
            pythoncom.CoInitialize()
            self.telescope.Tracking = enabled
            print(f"Tracking set to: {enabled}")
            return True
        except Exception as e:
            print(f"Tracking error: {e}")
            return False

    def abort_slew(self):
        if not self.connected:
            return False
        try:
            pythoncom.CoInitialize()
            self.telescope.AbortSlew()
            print("Slew aborted")
            return True
        except Exception as e:
            print(f"Abort error: {e}")
            return False

class ASCOMCamera:
    """ASCOM Camera wrapper for real camera control"""
    def __init__(self, driver_id=None):
        self.driver_id = driver_id
        self.camera = None
        self.connected = False

    @staticmethod
    def get_available_cameras():
        """Get list of available ASCOM camera drivers"""
        try:
            pythoncom.CoInitialize()
            profile = win32com.client.Dispatch("ASCOM.Utilities.Profile")
            drivers = profile.RegisteredDevices("Camera")

            cameras = []
            for driver_id in drivers:
                try:
                    name = profile.GetValue(driver_id, "", "")
                    cameras.append({
                        'id': driver_id,
                        'name': name if name else driver_id
                    })
                except:
                    cameras.append({
                        'id': driver_id,
                        'name': driver_id
                    })

            pythoncom.CoUninitialize()
            return cameras
        except Exception as e:
            print(f"Error getting camera list: {e}")
            return []

    @staticmethod
    def show_chooser():
        """Show ASCOM Chooser dialog for cameras"""
        try:
            pythoncom.CoInitialize()
            chooser = win32com.client.Dispatch("ASCOM.Utilities.Chooser")
            chooser.DeviceType = "Camera"
            selected_driver = chooser.Choose("")
            pythoncom.CoUninitialize()
            return selected_driver
        except Exception as e:
            print(f"Camera chooser error: {e}")
            pythoncom.CoUninitialize()
            return None

    def connect(self):
        """Connect to ASCOM camera"""
        try:
            pythoncom.CoInitialize()
            self.camera = win32com.client.Dispatch(self.driver_id)
            self.camera.Connected = True
            self.connected = True
            print(f"Connected to ASCOM camera: {self.camera.Name}")
            return True
        except Exception as e:
            print(f"Camera connection failed: {e}")
            return False

    def disconnect(self):
        """Disconnect from ASCOM camera"""
        if self.camera and self.connected:
            try:
                self.camera.Connected = False
                self.connected = False
                print("Disconnected from ASCOM camera")
            except:
                pass
            finally:
                pythoncom.CoUninitialize()

    def get_status(self):
        """Get camera status"""
        if not self.connected:
            return None
        try:
            pythoncom.CoInitialize()
            status = {
                'connected': self.camera.Connected,
                'temperature': self.camera.CCDTemperature if hasattr(self.camera, 'CCDTemperature') else None,
                'cooling': self.camera.CoolerOn if hasattr(self.camera, 'CoolerOn') else False,
                'cameraState': str(self.camera.CameraState) if hasattr(self.camera, 'CameraState') else 'Unknown',
                'width': self.camera.CameraXSize if hasattr(self.camera, 'CameraXSize') else 0,
                'height': self.camera.CameraYSize if hasattr(self.camera, 'CameraYSize') else 0,
            }
            return status
        except Exception as e:
            print(f"Error getting camera status: {e}")
            return None

    def start_exposure(self, duration, light=True):
        """Start an exposure"""
        if not self.connected:
            return False
        try:
            pythoncom.CoInitialize()
            self.camera.StartExposure(duration, light)
            print(f"Started {duration}s exposure")
            return True
        except Exception as e:
            print(f"Error starting exposure: {e}")
            return False

    def image_ready(self):
        """Check if image is ready"""
        if not self.connected:
            return False
        try:
            pythoncom.CoInitialize()
            return hasattr(self.camera, 'ImageReady') and self.camera.ImageReady
        except Exception as e:
            print(f"Error checking image ready: {e}")
            return False

    def get_image_array(self):
        """Get the image array from camera"""
        if not self.connected:
            return None
        try:
            pythoncom.CoInitialize()
            if hasattr(self.camera, 'ImageArray'):
                return self.camera.ImageArray
            return None
        except Exception as e:
            print(f"Error getting image array: {e}")
            return None

# Create Flask app with CORS for React
app = Flask(__name__)
CORS(app, origins=["http://localhost:3000", "http://localhost:5173"])

# Global instances
telescope = None
camera = None
loop = None

# Object catalog
OBJECT_CATALOG = {
    "Polaris": {
        "name": "Polaris (North Star)",
        "ra": 2.530,
        "dec": 89.264,
        "type": "star",
        "constellation": "Ursa Minor",
        "magnitude": 1.86,
        "description": "The North Star - always points north"
    },
    "Vega": {
        "name": "Vega",
        "ra": 18.615,
        "dec": 38.784,
        "type": "star",
        "constellation": "Lyra",
        "magnitude": 0.03,
        "description": "Bright blue star in constellation Lyra"
    },
    "Sirius": {
        "name": "Sirius",
        "ra": 6.752,
        "dec": -16.716,
        "type": "star",
        "constellation": "Canis Major",
        "magnitude": -1.46,
        "description": "Brightest star in the night sky"
    },
    "Betelgeuse": {
        "name": "Betelgeuse",
        "ra": 5.919,
        "dec": 7.407,
        "type": "star",
        "constellation": "Orion",
        "magnitude": 0.42,
        "description": "Red giant star in Orion constellation"
    },
    "Rigel": {
        "name": "Rigel",
        "ra": 5.242,
        "dec": -8.202,
        "type": "star",
        "constellation": "Orion",
        "magnitude": 0.13,
        "description": "Blue supergiant in Orion constellation"
    },
    "M31": {
        "name": "Andromeda Galaxy",
        "ra": 0.712,
        "dec": 41.269,
        "type": "galaxy",
        "constellation": "Andromeda",
        "magnitude": 3.44,
        "description": "Nearest major galaxy to the Milky Way"
    },
    "M42": {
        "name": "Orion Nebula",
        "ra": 5.588,
        "dec": -5.390,
        "type": "nebula",
        "constellation": "Orion",
        "magnitude": 4.0,
        "description": "Stellar nursery in Orion constellation"
    }
}

def run_async_in_thread(coro):
    """Run async function in the background thread"""
    def run():
        global loop
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        return loop.run_until_complete(coro)

    thread = threading.Thread(target=run)
    thread.start()
    thread.join()
    return thread

# Initialize camera
def init_camera():
    global camera
    camera = PyObsCameraSimulator()
    print("Camera simulator initialized")

# API Routes
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'ok',
        'message': 'Telescope & Camera API is running',
        'timestamp': datetime.now().isoformat(),
        'telescope_connected': telescope and telescope.connected,
        'camera_available': camera is not None
    })

@app.route('/api/telescope/chooser/list', methods=['GET'])
def list_telescopes():
    """Get list of available ASCOM telescopes"""
    try:
        telescopes = ASCOMTelescope.get_available_telescopes()
        return jsonify({
            'success': True,
            'data': {
                'telescopes': telescopes,
                'count': len(telescopes)
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error listing telescopes: {str(e)}',
            'data': {'telescopes': [], 'count': 0}
        }), 500

@app.route('/api/telescope/chooser', methods=['POST'])
def show_telescope_chooser():
    """Show ASCOM Chooser dialog and return selected telescope"""
    try:
        selected_driver = ASCOMTelescope.show_chooser()
        if selected_driver:
            return jsonify({
                'success': True,
                'data': {
                    'driverId': selected_driver
                },
                'message': f'Selected telescope: {selected_driver}'
            })
        else:
            return jsonify({
                'success': False,
                'message': 'No telescope selected',
                'data': None
            }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Chooser error: {str(e)}',
            'data': None
        }), 500

@app.route('/api/telescope/connect', methods=['POST'])
def connect_telescope():
    """Connect to ASCOM telescope"""
    global telescope

    try:
        data = request.get_json() or {}
        driver_id = data.get('driverId', 'ASCOM.SimScope.Telescope')

        telescope = ASCOMTelescope(driver_id=driver_id)
        if telescope.connect():
            return jsonify({
                'success': True,
                'message': f'Connected to {driver_id} successfully',
                'connected': True,
                'driverId': driver_id
            })
        else:
            return jsonify({
                'success': False,
                'message': f'Failed to connect to {driver_id}',
                'connected': False
            }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Connection error: {str(e)}',
            'connected': False
        }), 500

@app.route('/api/telescope/disconnect', methods=['POST'])
def disconnect_telescope():
    global telescope

    if telescope:
        telescope.disconnect()
        telescope = None

    return jsonify({
        'success': True,
        'message': 'Disconnected from telescope',
        'connected': False
    })

@app.route('/api/telescope/status', methods=['GET'])
def get_telescope_status():
    if telescope and telescope.connected:
        status = telescope.get_status()
        if status:
            return jsonify({
                'success': True,
                'data': status
            })

    return jsonify({
        'success': False,
        'data': {
            'connected': False,
            'timestamp': datetime.now().isoformat()
        }
    })

@app.route('/api/telescope/slew', methods=['POST'])
def slew_telescope():
    if not telescope or not telescope.connected:
        return jsonify({
            'success': False,
            'message': 'Telescope not connected'
        }), 400

    try:
        data = request.get_json()
        ra = float(data.get('rightAscension', data.get('ra', 0)))
        dec = float(data.get('declination', data.get('dec', 0)))

        if not (0 <= ra <= 24):
            return jsonify({
                'success': False,
                'message': 'Right Ascension must be between 0 and 24 hours'
            }), 400

        if not (-90 <= dec <= 90):
            return jsonify({
                'success': False,
                'message': 'Declination must be between -90 and +90 degrees'
            }), 400

        success = telescope.slew_to_coordinates(ra, dec)

        if success:
            return jsonify({
                'success': True,
                'message': f'Slewing to RA: {ra}h, Dec: {dec} degrees',
                'targetCoordinates': {
                    'rightAscension': ra,
                    'declination': dec
                }
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Slew command failed'
            }), 500

    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Slew error: {str(e)}'
        }), 500

@app.route('/api/telescope/slew/altaz', methods=['POST'])
def slew_telescope_altaz():
    """Slew telescope using Alt/Az coordinates"""
    if not telescope or not telescope.connected:
        return jsonify({
            'success': False,
            'message': 'Telescope not connected'
        }), 400

    try:
        data = request.get_json()
        altitude = float(data.get('altitude', 0))
        azimuth = float(data.get('azimuth', 0))

        # Validate coordinates
        if not (0 <= altitude <= 90):
            return jsonify({
                'success': False,
                'message': 'Altitude must be between 0 and 90 degrees'
            }), 400

        if not (0 <= azimuth < 360):
            return jsonify({
                'success': False,
                'message': 'Azimuth must be between 0 and 360 degrees'
            }), 400

        # Try to slew using SlewToAltAz if available
        pythoncom.CoInitialize()
        try:
            if hasattr(telescope.telescope, 'SlewToAltAz'):
                telescope.telescope.SlewToAltAz(azimuth, altitude)
                success = True
            else:
                # Fallback: Convert Alt/Az to RA/Dec
                # Most ASCOM telescopes support coordinate conversion
                if hasattr(telescope.telescope, 'AltitudeToRA'):
                    ra = telescope.telescope.AltitudeToRA(altitude, azimuth)
                    dec = telescope.telescope.AltitudeToDec(altitude, azimuth)
                    success = telescope.slew_to_coordinates(ra, dec)
                else:
                    # Last resort: Just slew to Alt/Az using SlewToCoordinatesAsync if supported
                    return jsonify({
                        'success': False,
                        'message': 'Telescope does not support Alt/Az slewing or conversion'
                    }), 400

            if success:
                return jsonify({
                    'success': True,
                    'message': f'Slewing to Alt: {altitude}°, Az: {azimuth}°',
                    'targetCoordinates': {
                        'altitude': altitude,
                        'azimuth': azimuth
                    }
                })
            else:
                return jsonify({
                    'success': False,
                    'message': 'Slew command failed'
                }), 500

        except Exception as e:
            print(f"Alt/Az slew error: {e}")
            return jsonify({
                'success': False,
                'message': f'Alt/Az slew error: {str(e)}'
            }), 500

    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Slew error: {str(e)}'
        }), 500

@app.route('/api/telescope/abort', methods=['POST'])
def abort_slew():
    if telescope and telescope.connected:
        success = telescope.abort_slew()
        return jsonify({
            'success': success,
            'message': 'Slew aborted' if success else 'Abort failed'
        })
    else:
        return jsonify({
            'success': False,
            'message': 'Telescope not connected'
        }), 400

@app.route('/api/telescope/tracking', methods=['POST'])
def set_tracking():
    if not telescope or not telescope.connected:
        return jsonify({
            'success': False,
            'message': 'Telescope not connected'
        }), 400

    try:
        data = request.get_json()
        enabled = data.get('enabled', False)

        success = telescope.set_tracking(enabled)
        return jsonify({
            'success': success,
            'message': f'Tracking {"enabled" if enabled else "disabled"}',
            'tracking': enabled if success else None
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Tracking error: {str(e)}'
        }), 500

@app.route('/api/telescope/slew/object/<object_id>', methods=['POST'])
def slew_to_object(object_id):
    if not telescope or not telescope.connected:
        return jsonify({
            'success': False,
            'message': 'Telescope not connected'
        }), 400

    if object_id not in OBJECT_CATALOG:
        return jsonify({
            'success': False,
            'message': f'Object {object_id} not found in catalog'
        }), 404

    try:
        obj = OBJECT_CATALOG[object_id]
        success = telescope.slew_to_coordinates(obj['ra'], obj['dec'])

        if success:
            return jsonify({
                'success': True,
                'message': f'Slewing to {obj["name"]}',
                'target': {
                    'name': obj['name'],
                    'rightAscension': obj['ra'],
                    'declination': obj['dec'],
                    'type': obj['type']
                }
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Slew command failed'
            }), 500

    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error slewing to object: {str(e)}'
        }), 500

# Camera API Routes
@app.route('/api/camera/chooser/list', methods=['GET'])
def list_cameras():
    """Get list of available ASCOM cameras"""
    try:
        cameras = ASCOMCamera.get_available_cameras()
        return jsonify({
            'success': True,
            'data': {
                'cameras': cameras,
                'count': len(cameras)
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error listing cameras: {str(e)}',
            'data': {'cameras': [], 'count': 0}
        }), 500

@app.route('/api/camera/chooser', methods=['POST'])
def show_camera_chooser():
    """Show ASCOM Chooser dialog and return selected camera"""
    try:
        selected_driver = ASCOMCamera.show_chooser()
        if selected_driver:
            return jsonify({
                'success': True,
                'data': {
                    'driverId': selected_driver
                },
                'message': f'Selected camera: {selected_driver}'
            })
        else:
            return jsonify({
                'success': False,
                'message': 'No camera selected',
                'data': None
            }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Chooser error: {str(e)}',
            'data': None
        }), 500

@app.route('/api/camera/connect', methods=['POST'])
def connect_camera():
    """Connect to ASCOM camera"""
    global camera

    try:
        data = request.get_json() or {}
        driver_id = data.get('driverId')

        if not driver_id:
            return jsonify({
                'success': False,
                'message': 'No camera driver ID provided'
            }), 400

        # Disconnect existing camera if any
        if camera and isinstance(camera, ASCOMCamera):
            camera.disconnect()

        camera = ASCOMCamera(driver_id=driver_id)
        if camera.connect():
            return jsonify({
                'success': True,
                'message': f'Connected to {driver_id} successfully',
                'connected': True,
                'driverId': driver_id
            })
        else:
            camera = None
            return jsonify({
                'success': False,
                'message': f'Failed to connect to {driver_id}',
                'connected': False
            }), 400
    except Exception as e:
        camera = None
        return jsonify({
            'success': False,
            'message': f'Connection error: {str(e)}',
            'connected': False
        }), 500

@app.route('/api/camera/disconnect', methods=['POST'])
def disconnect_camera():
    """Disconnect from ASCOM camera"""
    global camera

    if camera and isinstance(camera, ASCOMCamera):
        camera.disconnect()
        camera = None

    return jsonify({
        'success': True,
        'message': 'Disconnected from camera',
        'connected': False
    })

@app.route('/api/camera/status', methods=['GET'])
def get_camera_status():
    if not camera:
        return jsonify({
            'success': False,
            'message': 'Camera not available'
        }), 400

    # Check if it's ASCOM camera
    if isinstance(camera, ASCOMCamera):
        status = camera.get_status()
        if status:
            return jsonify({
                'success': True,
                'data': status
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Failed to get camera status'
            }), 400

    # PyObs simulator camera
    return jsonify({
        'success': True,
        'data': {
            'available': True,
            'temperature': camera.get_temperature(),
            'cooling': camera.cooling,
            'exposure_status': str(camera.get_exposure_status()),
            'binning': camera.binning,
            'gain': camera.gain,
            'width': camera.width,
            'height': camera.height,
            'observatory': {
                'name': camera.site_name,
                'latitude': camera.latitude,
                'longitude': camera.longitude,
                'elevation': camera.elevation
            }
        }
    })

@app.route('/api/camera/preview', methods=['POST'])
def preview_camera():
    """Quick preview capture for live view"""
    if not camera:
        return jsonify({
            'success': False,
            'message': 'Camera not available'
        }), 400

    try:
        # Get capture parameters
        data = request.get_json() or {}
        exposure_time = float(data.get('exposureTime', 0.5))  # Default 0.5s for preview

        # Validate exposure time
        if not (0.01 <= exposure_time <= 10):
            return jsonify({
                'success': False,
                'message': 'Preview exposure time must be between 0.01 and 10 seconds'
            }), 400

        # Check if ASCOM camera
        if isinstance(camera, ASCOMCamera):
            import time
            import numpy as np
            from PIL import Image
            import base64
            from io import BytesIO

            # Start exposure
            if not camera.start_exposure(exposure_time):
                return jsonify({
                    'success': False,
                    'message': 'Failed to start exposure'
                }), 500

            # Wait for exposure to complete
            time.sleep(exposure_time + 0.2)  # Minimal buffer for preview

            # Wait for image to be ready (shorter timeout for preview)
            max_wait = 5
            wait_time = 0
            while not camera.image_ready() and wait_time < max_wait:
                time.sleep(0.1)
                wait_time += 0.1

            if not camera.image_ready():
                return jsonify({
                    'success': False,
                    'message': 'Preview timeout'
                }), 500

            # Get image array
            image_array = camera.get_image_array()
            if image_array is None:
                return jsonify({
                    'success': False,
                    'message': 'Failed to retrieve preview'
                }), 500

            # Convert to numpy array and normalize
            try:
                img_array = np.array(image_array, dtype=np.float32)

                # Normalize to 0-255 range
                img_min = img_array.min()
                img_max = img_array.max()
                if img_max > img_min:
                    img_normalized = ((img_array - img_min) / (img_max - img_min) * 255).astype(np.uint8)
                else:
                    img_normalized = np.zeros_like(img_array, dtype=np.uint8)

                # Create PIL image
                pil_image = Image.fromarray(img_normalized, mode='L')

                # Resize for web display (optional, for performance)
                max_size = (1280, 720)
                pil_image.thumbnail(max_size, Image.Resampling.LANCZOS)

                # Convert to base64 for preview
                buffered = BytesIO()
                pil_image.save(buffered, format="PNG", optimize=True)
                img_base64 = base64.b64encode(buffered.getvalue()).decode()

                return jsonify({
                    'success': True,
                    'message': 'Preview captured',
                    'data': {
                        'image_base64': img_base64,
                        'image_size': list(pil_image.size),
                        'exposure_time': exposure_time
                    }
                })

            except Exception as e:
                return jsonify({
                    'success': False,
                    'message': f'Error processing preview: {str(e)}'
                }), 500

        else:
            # PyObs simulator - not supported for preview without telescope
            return jsonify({
                'success': False,
                'message': 'Preview only supported for ASCOM cameras'
            }), 400

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Preview error: {str(e)}'
        }), 500

@app.route('/api/camera/capture', methods=['POST'])
def capture_image():
    if not camera:
        return jsonify({
            'success': False,
            'message': 'Camera not available'
        }), 400

    try:
        # Get capture parameters
        data = request.get_json() or {}
        exposure_time = float(data.get('exposureTime', 1.0))
        target_name = data.get('targetName')

        # Validate exposure time
        if not (0.1 <= exposure_time <= 300):
            return jsonify({
                'success': False,
                'message': 'Exposure time must be between 0.1 and 300 seconds'
            }), 400

        # Check if ASCOM camera
        if isinstance(camera, ASCOMCamera):
            # ASCOM camera capture
            import time
            import numpy as np
            from PIL import Image
            import base64
            from io import BytesIO

            # Start exposure
            if not camera.start_exposure(exposure_time):
                return jsonify({
                    'success': False,
                    'message': 'Failed to start exposure'
                }), 500

            # Wait for exposure to complete
            print(f"Waiting for {exposure_time}s exposure...")
            time.sleep(exposure_time + 0.5)  # Add buffer time

            # Wait for image to be ready
            max_wait = 30  # Maximum wait time in seconds
            wait_time = 0
            while not camera.image_ready() and wait_time < max_wait:
                time.sleep(0.5)
                wait_time += 0.5

            if not camera.image_ready():
                return jsonify({
                    'success': False,
                    'message': 'Timeout waiting for image'
                }), 500

            # Get image array
            image_array = camera.get_image_array()
            if image_array is None:
                return jsonify({
                    'success': False,
                    'message': 'Failed to retrieve image data'
                }), 500

            # Convert to numpy array and normalize
            try:
                # ASCOM images are typically 2D arrays
                img_array = np.array(image_array, dtype=np.float32)

                # Normalize to 0-255 range
                img_min = img_array.min()
                img_max = img_array.max()
                if img_max > img_min:
                    img_normalized = ((img_array - img_min) / (img_max - img_min) * 255).astype(np.uint8)
                else:
                    img_normalized = np.zeros_like(img_array, dtype=np.uint8)

                # Create PIL image
                pil_image = Image.fromarray(img_normalized, mode='L')

                # Save to file
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"ascom_capture_{timestamp}.png"

                # Ensure images directory exists
                images_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'captured_images')
                os.makedirs(images_dir, exist_ok=True)
                filepath = os.path.join(images_dir, filename)
                pil_image.save(filepath)

                # Convert to base64 for preview
                buffered = BytesIO()
                pil_image.save(buffered, format="PNG")
                img_base64 = base64.b64encode(buffered.getvalue()).decode()

                return jsonify({
                    'success': True,
                    'message': 'Image captured successfully',
                    'data': {
                        'filename': filename,
                        'image_base64': img_base64,
                        'image_size': list(pil_image.size),
                        'metadata': {
                            'exposure_time': exposure_time,
                            'timestamp': timestamp
                        }
                    }
                })

            except Exception as e:
                return jsonify({
                    'success': False,
                    'message': f'Error processing image: {str(e)}'
                }), 500

        else:
            # PyObs simulator camera
            if not telescope or not telescope.connected:
                return jsonify({
                    'success': False,
                    'message': 'Telescope not connected - need coordinates for capture'
                }), 400

            # Get current telescope position
            status = telescope.get_status()
            if not status:
                return jsonify({
                    'success': False,
                    'message': 'Cannot get telescope position'
                }), 400

            # Capture image asynchronously
            def capture_async():
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                return loop.run_until_complete(
                    camera.capture_and_save(
                        status['rightAscension'],
                        status['declination'],
                        exposure_time,
                        target_name
                    )
                )

            # Run in thread to avoid blocking
            result = capture_async()

            if result['success']:
                return jsonify({
                    'success': True,
                    'message': 'Image captured successfully',
                    'data': {
                        'filename': result['filename'],
                        'metadata': result['metadata'],
                        'image_base64': result['image_base64'],
                        'image_size': result['image_size']
                    }
                })
            else:
                return jsonify({
                    'success': False,
                    'message': 'Image capture failed'
                }), 500

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Capture error: {str(e)}'
        }), 500

@app.route('/api/camera/images', methods=['GET'])
def list_images():
    if not camera:
        return jsonify({
            'success': False,
            'message': 'Camera not available'
        }), 400

    try:
        images_dir = camera.images_dir
        if not os.path.exists(images_dir):
            return jsonify({
                'success': True,
                'data': {'images': [], 'count': 0}
            })

        images = []
        for filename in os.listdir(images_dir):
            if filename.lower().endswith(('.jpg', '.jpeg', '.png', '.fits')):
                filepath = os.path.join(images_dir, filename)
                stat = os.stat(filepath)
                images.append({
                    'filename': filename,
                    'size': stat.st_size,
                    'created': datetime.fromtimestamp(stat.st_ctime).isoformat(),
                    'modified': datetime.fromtimestamp(stat.st_mtime).isoformat()
                })

        # Sort by creation time, newest first
        images.sort(key=lambda x: x['created'], reverse=True)

        return jsonify({
            'success': True,
            'data': {
                'images': images,
                'count': len(images)
            }
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error listing images: {str(e)}'
        }), 500

@app.route('/api/camera/images/<filename>', methods=['GET'])
def get_image(filename):
    if not camera:
        return jsonify({
            'success': False,
            'message': 'Camera not available'
        }), 400

    try:
        filepath = os.path.join(camera.images_dir, filename)
        if not os.path.exists(filepath):
            return jsonify({
                'success': False,
                'message': 'Image not found'
            }), 404

        return send_file(filepath)

    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error retrieving image: {str(e)}'
        }), 500

@app.route('/api/camera/cooling', methods=['POST'])
def set_camera_cooling():
    """Set camera cooling and target temperature"""
    if not camera:
        return jsonify({
            'success': False,
            'message': 'Camera not available'
        }), 400

    try:
        data = request.get_json()
        enabled = data.get('enabled', False)
        temperature = float(data.get('temperature', -15.0))

        # Validate temperature range
        if not (-25 <= temperature <= 10):
            return jsonify({
                'success': False,
                'message': 'Temperature must be between -25°C and +10°C'
            }), 400

        # Set cooling asynchronously
        def set_cooling_async():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            return loop.run_until_complete(
                camera.set_cooling(enabled, temperature)
            )

        set_cooling_async()

        return jsonify({
            'success': True,
            'message': f'Cooling {"enabled" if enabled else "disabled"}',
            'data': {
                'cooling': enabled,
                'target_temperature': temperature if enabled else None,
                'current_temperature': camera.get_temperature()
            }
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Cooling control error: {str(e)}'
        }), 500

@app.route('/api/objects', methods=['GET'])
def get_objects():
    return jsonify({
        'success': True,
        'data': {
            'objects': OBJECT_CATALOG,
            'count': len(OBJECT_CATALOG)
        }
    })

@app.route('/api/objects/<object_id>', methods=['GET'])
def get_object(object_id):
    if object_id in OBJECT_CATALOG:
        return jsonify({
            'success': True,
            'data': OBJECT_CATALOG[object_id]
        })
    else:
        return jsonify({
            'success': False,
            'message': f'Object {object_id} not found'
        }), 404

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'message': 'Endpoint not found'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'message': 'Internal server error'
    }), 500

if __name__ == '__main__':
    print("Enhanced Telescope & Camera API Server")
    print("=" * 50)
    print("API URL: http://localhost:8000")
    print("React Dev Server: http://localhost:3000")
    print("Make sure ASCOM Platform is installed!")
    print("")
    print("Initializing camera simulator...")
    init_camera()
    print("")
    print("API Endpoints:")
    print("Telescope:")
    print("  GET  /api/telescope/chooser/list")
    print("  POST /api/telescope/chooser")
    print("  POST /api/telescope/connect")
    print("  POST /api/telescope/disconnect")
    print("  GET  /api/telescope/status")
    print("  POST /api/telescope/slew")
    print("  POST /api/telescope/slew/altaz")
    print("  POST /api/telescope/abort")
    print("  POST /api/telescope/tracking")
    print("  POST /api/telescope/slew/object/<id>")
    print("")
    print("Camera:")
    print("  GET  /api/camera/chooser/list")
    print("  POST /api/camera/chooser")
    print("  POST /api/camera/connect")
    print("  POST /api/camera/disconnect")
    print("  GET  /api/camera/status")
    print("  POST /api/camera/preview")
    print("  POST /api/camera/capture")
    print("  POST /api/camera/cooling")
    print("  GET  /api/camera/images")
    print("  GET  /api/camera/images/<filename>")
    print("")
    print("Objects:")
    print("  GET  /api/objects")
    print("  GET  /api/objects/<id>")
    print("")
    print("Server starting...")

    app.run(host='0.0.0.0', port=8000, debug=True)