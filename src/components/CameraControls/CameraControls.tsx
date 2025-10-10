import './CameraControls.css'
import Panel from '@/components/Panel/Panel.tsx'
import Button from '@/components/Button/Button.tsx'
import { Camera, Thermometer, Clock, ListTree } from 'lucide-react'
import { useState, useEffect } from 'react'
import CameraChooser from '@/components/CameraChooser/CameraChooser'
import telescopeAPI from '@/services/telescopeAPI'

interface CameraStatus {
    available: boolean
    temperature: number
    cooling: boolean
    exposure_status: string
    binning: number
    gain: number
    width: number
    height: number
}

export default function CameraControls() {
    const [exposureTime, setExposureTime] = useState(1.0)
    const [targetTemperature, setTargetTemperature] = useState(-15.0)
    const [cooling, setCooling] = useState(true)
    const [capturing, setCapturing] = useState(false)
    const [cameraStatus, setCameraStatus] = useState<CameraStatus | null>(null)
    const [lastImage, setLastImage] = useState<string | null>(null)
    const [showChooser, setShowChooser] = useState(false)
    const [cameraConnected, setCameraConnected] = useState(false)
    const [isConnecting, setIsConnecting] = useState(false)

    const handleCameraSelect = async (driverId: string) => {
        setIsConnecting(true)
        console.log(`Connecting to camera: ${driverId}`)

        try {
            const response = await telescopeAPI.connectCamera(driverId)
            console.log('Connect response:', response)

            setCameraConnected(response.success)
            if (response.success) {
                console.log('✅ Connected to camera:', response.message)
                fetchCameraStatus()
            } else {
                console.error('❌ Connection failed:', response.message)
            }
        } catch (error) {
            console.error('❌ Error connecting to camera:', error)
            setCameraConnected(false)
        } finally {
            setIsConnecting(false)
        }
    }

    const handleCameraConnection = () => {
        if (cameraConnected) {
            // Disconnect
            telescopeAPI.disconnectCamera()
                .then(() => {
                    setCameraConnected(false)
                    setCameraStatus(null)
                    console.log('Disconnected from camera')
                })
                .catch(error => console.error('Error disconnecting:', error))
        } else {
            // Show chooser
            setShowChooser(true)
        }
    }

    // Fetch camera status
    const fetchCameraStatus = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/camera/status')
            if (response.ok) {
                const result = await response.json()
                if (result.success) {
                    setCameraStatus(result.data)
                    setCameraConnected(true)
                } else {
                    setCameraConnected(false)
                }
            }
        } catch (error) {
            console.error('Failed to fetch camera status:', error)
        }
    }

    // Update camera temperature
    const updateTemperature = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/camera/cooling', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    enabled: cooling,
                    temperature: targetTemperature
                })
            })

            if (response.ok) {
                const result = await response.json()
                if (result.success) {
                    console.log('Temperature updated')
                    fetchCameraStatus()
                } else {
                    alert(`Temperature update failed: ${result.message}`)
                }
            }
        } catch (error) {
            console.error('Temperature update error:', error)
            alert('Temperature update error: Check if server is running')
        }
    }

    // Capture image with current settings
    const handleCapture = async () => {
        if (capturing) return

        setCapturing(true)
        try {
            const response = await fetch('http://localhost:8000/api/camera/capture', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    exposureTime: exposureTime,
                    targetName: null
                })
            })

            const result = await response.json()

            if (result.success) {
                console.log('Image captured:', result.data.filename)
                setLastImage(result.data.filename)
                alert(`Image captured: ${result.data.filename}`)
            } else {
                console.error('Capture failed:', result.message)
                alert(`Capture failed: ${result.message}`)
            }
        } catch (error) {
            console.error('Capture error:', error)
            alert('Capture error: Check if telescope server is running')
        } finally {
            setCapturing(false)
        }
    }

    // Fetch status on component mount
    useEffect(() => {
        fetchCameraStatus()
        const interval = setInterval(fetchCameraStatus, 5000) // Update every 5 seconds
        return () => clearInterval(interval)
    }, [])

    return (
        <>
            <Panel className="camera-controls__panel">
                <div className="camera-controls__wrapper">
                    <h3 className="camera-controls__title">
                        <Camera size={20} />
                        Camera Controls
                    </h3>

                    {/* Camera Connection Button */}
                    <div className="camera-connection">
                        <Button
                            className="camera-connect-btn"
                            onClick={handleCameraConnection}
                            disabled={isConnecting}
                        >
                            <Camera size={18} />
                            {isConnecting ? 'Connecting...' : cameraConnected ? 'Disconnect Camera' : 'Connect Camera'}
                        </Button>
                    </div>

                    {/* Camera Status */}
                    <div className="camera-status">
                        <div className={`status-indicator ${cameraStatus?.available || cameraConnected ? 'connected' : 'disconnected'}`}>
                            {cameraStatus?.available || cameraConnected ? '● Connected' : '● Disconnected'}
                        </div>
                    {cameraStatus && (
                        <div className="status-details">
                            <span>Temp: {cameraStatus.temperature.toFixed(1)}°C</span>
                            <span>Status: {cameraStatus.exposure_status}</span>
                            <span>{cameraStatus.width}×{cameraStatus.height}</span>
                            {cameraStatus.observatory && (
                                <span>Site: {cameraStatus.observatory.name}</span>
                            )}
                        </div>
                    )}
                </div>

                {/* Exposure Controls */}
                <div className="control-group">
                    <label className="control-label">
                        <Clock size={16} />
                        Exposure Time
                    </label>
                    <div className="exposure-controls">
                        <input
                            type="range"
                            min="0.1"
                            max="60"
                            step="0.1"
                            value={exposureTime}
                            onChange={(e) => setExposureTime(parseFloat(e.target.value))}
                            className="exposure-slider"
                        />
                        <input
                            type="number"
                            min="0.1"
                            max="300"
                            step="0.1"
                            value={exposureTime}
                            onChange={(e) => setExposureTime(parseFloat(e.target.value))}
                            className="exposure-input"
                        />
                        <span className="exposure-unit">seconds</span>
                    </div>
                    <div className="exposure-presets">
                        {[0.5, 1.0, 2.0, 5.0, 10.0, 30.0].map((time) => (
                            <Button
                                key={time}
                                className="preset-btn"
                                onClick={() => setExposureTime(time)}
                                disabled={capturing}
                            >
                                {time}s
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Temperature Controls */}
                <div className="control-group">
                    <label className="control-label">
                        <Thermometer size={16} />
                        Camera Cooling
                    </label>
                    <div className="temperature-controls">
                        <div className="cooling-toggle">
                            <input
                                type="checkbox"
                                id="cooling-enabled"
                                checked={cooling}
                                onChange={(e) => setCooling(e.target.checked)}
                            />
                            <label htmlFor="cooling-enabled">Enable Cooling</label>
                        </div>
                        {cooling && (
                            <div className="temperature-setting">
                                <input
                                    type="range"
                                    min="-25"
                                    max="10"
                                    step="1"
                                    value={targetTemperature}
                                    onChange={(e) => setTargetTemperature(parseFloat(e.target.value))}
                                    className="temperature-slider"
                                />
                                <input
                                    type="number"
                                    min="-25"
                                    max="10"
                                    step="1"
                                    value={targetTemperature}
                                    onChange={(e) => setTargetTemperature(parseFloat(e.target.value))}
                                    className="temperature-input"
                                />
                                <span className="temperature-unit">°C</span>
                            </div>
                        )}
                        <Button
                            className="apply-temp-btn"
                            onClick={updateTemperature}
                            disabled={capturing}
                        >
                            Apply
                        </Button>
                    </div>
                    <div className="temperature-presets">
                        {[-20, -15, -10, -5, 0].map((temp) => (
                            <Button
                                key={temp}
                                className="preset-btn"
                                onClick={() => {
                                    setTargetTemperature(temp)
                                    setCooling(true)
                                }}
                                disabled={capturing || !cooling}
                            >
                                {temp}°C
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Capture Button */}
                <div className="capture-section">
                    <Button
                        className="capture-main-btn"
                        onClick={handleCapture}
                        disabled={capturing || !cameraStatus?.available}
                    >
                        <Camera size={18} />
                        {capturing ? 'Capturing...' : 'Capture Image'}
                    </Button>
                    {lastImage && (
                        <div className="last-capture">
                            Last: {lastImage}
                        </div>
                    )}
                </div>

                {/* Current Settings Summary */}
                <div className="settings-summary">
                    <div className="summary-item">
                        <strong>Exposure:</strong> {exposureTime}s
                    </div>
                    <div className="summary-item">
                        <strong>Cooling:</strong> {cooling ? `${targetTemperature}°C` : 'Off'}
                    </div>
                </div>
            </div>
        </Panel>

        <CameraChooser
            isOpen={showChooser}
            onClose={() => setShowChooser(false)}
            onSelect={handleCameraSelect}
        />
        </>
    )
}