"""
Fixed Telescope Web Server for SimScope with proper COM threading
"""
import win32com.client
import pythoncom
from datetime import datetime
from flask import Flask, jsonify, request

class ASCOMTelescope:
    def __init__(self, driver_id="ASCOM.SimScope.Telescope"):
        self.driver_id = driver_id
        self.telescope = None
        self.connected = False
    
    def connect(self):
        try:
            # Initialize COM for this thread
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
            # Ensure COM is initialized for this thread
            pythoncom.CoInitialize()
            
            status = {
                'connected': self.telescope.Connected,
                'tracking': self.telescope.Tracking,
                'slewing': self.telescope.Slewing,
                'ra': self.telescope.RightAscension,
                'dec': self.telescope.Declination,
                'altitude': self.telescope.Altitude,
                'azimuth': self.telescope.Azimuth,
            }
            return status
        except Exception as e:
            print(f"Error getting status: {e}")
            return None
        finally:
            # Don't uninitialize here as other calls might need it
            pass
    
    def slew_to_coordinates(self, ra_hours, dec_degrees):
        if not self.connected:
            return False
        try:
            # Ensure COM is initialized for this thread
            pythoncom.CoInitialize()
            
            # First enable tracking if not already on
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
            # Ensure COM is initialized for this thread
            pythoncom.CoInitialize()
            
            self.telescope.Tracking = enabled
            print(f"Tracking set to: {enabled}")
            return True
        except Exception as e:
            print(f"Tracking error: {e}")
            return False

app = Flask(__name__)
telescope = None

STAR_CATALOG = {
    "Vega": {"ra": 18.615, "dec": 38.784},
    "Sirius": {"ra": 6.752, "dec": -16.716},
    "Polaris": {"ra": 2.530, "dec": 89.264}
}

@app.route('/')
def home():
    return '''
<!DOCTYPE html>
<html>
<head>
    <title>Telescope Control</title>
    <style>
        body { font-family: Arial; margin: 20px; background: #1a1a2e; color: white; }
        .box { background: #16213e; padding: 20px; margin: 10px 0; border-radius: 10px; }
        button { background: #0f4c75; color: white; padding: 10px 20px; border: none; border-radius: 5px; margin: 5px; cursor: pointer; }
        button:hover { background: #3282b8; }
        .connected { color: #4caf50; font-weight: bold; }
        .disconnected { color: #f44336; }
        input { padding: 8px; margin: 5px; border: none; border-radius: 4px; color: black; }
        #log { height: 150px; overflow-y: scroll; background: #0e1b2e; padding: 10px; border-radius: 5px; font-family: monospace; font-size: 12px; }
        .status-value { color: #3282b8; font-weight: bold; }
    </style>
</head>
<body>
    <h1>🔭 Telescope Control System</h1>
    
    <div class="box">
        <h2>Connection Status</h2>
        <div id="status" class="disconnected">❌ Disconnected</div>
        <button onclick="connectTelescope()">🔗 Connect to SimScope</button>
        <button onclick="disconnectTelescope()">❌ Disconnect</button>
        <button onclick="updateStatus()">🔄 Refresh Status</button>
    </div>

    <div class="box">
        <h2>📍 Current Position</h2>
        <div>Right Ascension: <span id="ra" class="status-value">--</span> hours</div>
        <div>Declination: <span id="dec" class="status-value">--</span> degrees</div>
        <div>Altitude: <span id="alt" class="status-value">--</span> degrees</div>
        <div>Azimuth: <span id="az" class="status-value">--</span> degrees</div>
        <div>Tracking: <span id="tracking" class="status-value">--</span></div>
        <div>Slewing: <span id="slewing" class="status-value">--</span></div>
    </div>

    <div class="box">
        <h2>🎛️ Controls</h2>
        <button onclick="toggleTracking()">🎯 Toggle Tracking</button>
        <br><br>
        <strong>Manual Coordinates:</strong><br>
        RA (hours): <input type="number" id="ra-input" placeholder="0-24" step="0.001" style="width: 80px;">
        Dec (degrees): <input type="number" id="dec-input" placeholder="-90 to 90" step="0.001" style="width: 80px;">
        <button onclick="slewToCoords()">🎯 Go To Coordinates</button>
    </div>

    <div class="box">
        <h2>⭐ Quick Targets</h2>
        <button onclick="slewToStar('Vega')">🌟 Vega (Summer Triangle)</button>
        <button onclick="slewToStar('Sirius')">💫 Sirius (Brightest Star)</button>
        <button onclick="slewToStar('Polaris')">🧭 Polaris (North Star)</button>
    </div>

    <div class="box">
        <h2>📋 Activity Log</h2>
        <div id="log"></div>
        <button onclick="clearLog()" style="background: #666;">🗑️ Clear Log</button>
    </div>

    <script>
        var isConnected = false;
        var statusUpdateInterval;

        function log(message) {
            var logDiv = document.getElementById('log');
            var time = new Date().toLocaleTimeString();
            logDiv.innerHTML += '<div>[' + time + '] ' + message + '</div>';
            logDiv.scrollTop = logDiv.scrollHeight;
        }

        function clearLog() {
            document.getElementById('log').innerHTML = '';
        }

        function connectTelescope() {
            log('🔗 Connecting to SimScope...');
            var xhr = new XMLHttpRequest();
            xhr.open('POST', '/api/connect', true);
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        var result = JSON.parse(xhr.responseText);
                        if (result.success) {
                            isConnected = true;
                            document.getElementById('status').innerHTML = '✅ Connected to SimScope';
                            document.getElementById('status').className = 'connected';
                            log('✅ Connected successfully!');
                            startStatusUpdates();
                        } else {
                            log('❌ Connection failed: ' + result.message);
                        }
                    } else {
                        log('❌ Connection error - Check if SimScope is running');
                    }
                }
            };
            xhr.send();
        }

        function disconnectTelescope() {
            var xhr = new XMLHttpRequest();
            xhr.open('POST', '/api/disconnect', true);
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    isConnected = false;
                    document.getElementById('status').innerHTML = '❌ Disconnected';
                    document.getElementById('status').className = 'disconnected';
                    clearStatus();
                    stopStatusUpdates();
                    log('📴 Disconnected from telescope');
                }
            };
            xhr.send();
        }

        function clearStatus() {
            document.getElementById('ra').textContent = '--';
            document.getElementById('dec').textContent = '--';
            document.getElementById('alt').textContent = '--';
            document.getElementById('az').textContent = '--';
            document.getElementById('tracking').textContent = '--';
            document.getElementById('slewing').textContent = '--';
        }

        function updateStatus() {
            if (!isConnected) return;
            
            var xhr = new XMLHttpRequest();
            xhr.open('GET', '/api/status', true);
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        var status = JSON.parse(xhr.responseText);
                        if (status && status.connected) {
                            document.getElementById('ra').textContent = status.ra.toFixed(4);
                            document.getElementById('dec').textContent = status.dec.toFixed(3);
                            document.getElementById('alt').textContent = status.altitude.toFixed(2);
                            document.getElementById('az').textContent = status.azimuth.toFixed(2);
                            document.getElementById('tracking').textContent = status.tracking ? '✅ ON' : '❌ OFF';
                            document.getElementById('slewing').textContent = status.slewing ? '🔄 MOVING' : '✅ STATIONARY';
                        } else {
                            log('⚠️ Lost connection to telescope');
                            disconnectTelescope();
                        }
                    } else {
                        log('⚠️ Status update failed');
                    }
                }
            };
            xhr.send();
        }

        function toggleTracking() {
            if (!isConnected) { 
                log('❌ Not connected to telescope'); 
                return; 
            }
            
            var currentTracking = document.getElementById('tracking').textContent.includes('ON');
            var newTracking = !currentTracking;
            
            log('🎯 ' + (newTracking ? 'Enabling' : 'Disabling') + ' tracking...');
            
            var xhr = new XMLHttpRequest();
            xhr.open('POST', '/api/tracking', true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        log('✅ Tracking ' + (newTracking ? 'enabled' : 'disabled'));
                        setTimeout(updateStatus, 500);
                    } else {
                        log('❌ Failed to toggle tracking');
                    }
                }
            };
            xhr.send(JSON.stringify({enabled: newTracking}));
        }

        function slewToCoords() {
            if (!isConnected) { 
                log('❌ Not connected to telescope'); 
                return; 
            }
            
            var ra = parseFloat(document.getElementById('ra-input').value);
            var dec = parseFloat(document.getElementById('dec-input').value);
            
            if (isNaN(ra) || isNaN(dec) || ra < 0 || ra > 24 || dec < -90 || dec > 90) {
                log('❌ Invalid coordinates. RA: 0-24 hours, Dec: -90 to +90 degrees');
                return;
            }

            log('🎯 Slewing to RA: ' + ra + 'h, Dec: ' + dec + '°...');
            
            var xhr = new XMLHttpRequest();
            xhr.open('POST', '/api/slew', true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        log('✅ Slew command sent successfully');
                    } else {
                        log('❌ Slew failed - check tracking is enabled');
                    }
                }
            };
            xhr.send(JSON.stringify({ra: ra, dec: dec}));
        }

        function slewToStar(starName) {
            if (!isConnected) { 
                log('❌ Not connected to telescope'); 
                return; 
            }
            
            log('🌟 Slewing to ' + starName + '...');
            
            var xhr = new XMLHttpRequest();
            xhr.open('POST', '/api/slew/star/' + starName, true);
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        log('✅ Slewing to ' + starName);
                    } else {
                        log('❌ Failed to slew to ' + starName);
                    }
                }
            };
            xhr.send();
        }

        function startStatusUpdates() {
            if (statusUpdateInterval) {
                clearInterval(statusUpdateInterval);
            }
            statusUpdateInterval = setInterval(updateStatus, 2000);
            updateStatus(); // Update immediately
        }

        function stopStatusUpdates() {
            if (statusUpdateInterval) {
                clearInterval(statusUpdateInterval);
                statusUpdateInterval = null;
            }
        }

        // Initialize page
        window.onload = function() {
            log('🚀 Telescope control system ready');
            log('📝 Make sure SimScope is running before connecting');
        };
    </script>
</body>
</html>
'''

@app.route('/api/connect', methods=['POST'])
def connect():
    global telescope
    try:
        telescope = ASCOMTelescope()
        if telescope.connect():
            return jsonify({'success': True, 'message': 'Connected to SimScope'})
        else:
            return jsonify({'success': False, 'message': 'Failed to connect to SimScope'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@app.route('/api/disconnect', methods=['POST'])
def disconnect():
    global telescope
    if telescope:
        telescope.disconnect()
        telescope = None
    return jsonify({'success': True})

@app.route('/api/status', methods=['GET'])
def status():
    if telescope and telescope.connected:
        status_data = telescope.get_status()
        if status_data:
            return jsonify(status_data)
    return jsonify({'connected': False})

@app.route('/api/tracking', methods=['POST'])
def tracking():
    if telescope and telescope.connected:
        data = request.get_json()
        success = telescope.set_tracking(data.get('enabled', False))
        return jsonify({'success': success})
    return jsonify({'success': False, 'message': 'Not connected'})

@app.route('/api/slew', methods=['POST'])
def slew():
    if telescope and telescope.connected:
        data = request.get_json()
        success = telescope.slew_to_coordinates(data['ra'], data['dec'])
        return jsonify({'success': success})
    return jsonify({'success': False, 'message': 'Not connected'})

@app.route('/api/slew/star/<star_name>', methods=['POST'])
def slew_star(star_name):
    if telescope and telescope.connected and star_name in STAR_CATALOG:
        star = STAR_CATALOG[star_name]
        success = telescope.slew_to_coordinates(star['ra'], star['dec'])
        return jsonify({'success': success})
    return jsonify({'success': False, 'message': 'Star not found or not connected'})

if __name__ == '__main__':
    print("🔭 SimScope Telescope Server Starting...")
    print("📡 Server URL: http://localhost:5000")
    print("📝 Make sure SimScope is running first!")
    print("")
    app.run(host='0.0.0.0', port=5000, debug=True)