"""
React-Compatible Telescope Server for SimScope
Designed to work with the React frontend
"""
import win32com.client
import pythoncom
from datetime import datetime
from flask import Flask, jsonify, request
from flask_cors import CORS

class ASCOMTelescope:
    def __init__(self, driver_id="ASCOM.SimScope.Telescope"):
        self.driver_id = driver_id
        self.telescope = None
        self.connected = False
    
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
                'rightAscension': self.telescope.RightAscension,  # React-friendly naming
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
            
            # Enable tracking if not already on
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

# Create Flask app with CORS for React
app = Flask(__name__)
CORS(app, origins=["http://localhost:3000", "http://localhost:5173"])  # Common React dev ports

telescope = None

# Astronomical object catalog
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
    "Capella": {
        "name": "Capella",
        "ra": 5.278,
        "dec": 45.998,
        "type": "star",
        "constellation": "Auriga",
        "magnitude": 0.08,
        "description": "Bright golden star in Auriga"
    },
    "Arcturus": {
        "name": "Arcturus",
        "ra": 14.261,
        "dec": 19.182,
        "type": "star",
        "constellation": "Bootes",
        "magnitude": -0.05,
        "description": "Orange giant star in Bootes"
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
    },
    "M13": {
        "name": "Hercules Cluster",
        "ra": 16.694,
        "dec": 36.460,
        "type": "cluster",
        "constellation": "Hercules",
        "magnitude": 5.8,
        "description": "Globular cluster in Hercules"
    }
}

# API Routes for React
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'message': 'Telescope API is running',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/telescope/connect', methods=['POST'])
def connect_telescope():
    """Connect to SimScope telescope"""
    global telescope
    
    try:
        telescope = ASCOMTelescope()
        if telescope.connect():
            return jsonify({
                'success': True,
                'message': 'Connected to SimScope successfully',
                'connected': True
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Failed to connect to SimScope',
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
    """Disconnect from telescope"""
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
    """Get current telescope status"""
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
    """Slew telescope to coordinates"""
    if not telescope or not telescope.connected:
        return jsonify({
            'success': False,
            'message': 'Telescope not connected'
        }), 400
    
    try:
        data = request.get_json()
        ra = float(data.get('rightAscension', data.get('ra', 0)))
        dec = float(data.get('declination', data.get('dec', 0)))
        
        # Validate coordinates
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

@app.route('/api/telescope/abort', methods=['POST'])
def abort_slew():
    """Abort current slew"""
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
    """Enable/disable telescope tracking"""
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

@app.route('/api/objects', methods=['GET'])
def get_objects():
    """Get catalog of astronomical objects"""
    return jsonify({
        'success': True,
        'data': {
            'objects': OBJECT_CATALOG,
            'count': len(OBJECT_CATALOG)
        }
    })

@app.route('/api/objects/<object_id>', methods=['GET'])
def get_object(object_id):
    """Get specific astronomical object"""
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

@app.route('/api/telescope/slew/object/<object_id>', methods=['POST'])
def slew_to_object(object_id):
    """Slew telescope to a specific astronomical object"""
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
    print("React-Compatible Telescope API Server")
    print("=" * 50)
    print("API URL: http://localhost:8000")
    print("React Dev Server: http://localhost:3000")
    print("Make sure SimScope is running!")
    print("")
    print("API Endpoints:")
    print("  GET  /api/health")
    print("  POST /api/telescope/connect")
    print("  POST /api/telescope/disconnect") 
    print("  GET  /api/telescope/status")
    print("  POST /api/telescope/slew")
    print("  POST /api/telescope/abort")
    print("  POST /api/telescope/tracking")
    print("  GET  /api/objects")
    print("  GET  /api/objects/<id>")
    print("  POST /api/telescope/slew/object/<id>")
    print("")
    print("Server starting...")
    
    # Use port 8000 to avoid conflicts with React (usually port 3000)
    app.run(host='0.0.0.0', port=8000, debug=True)