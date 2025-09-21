import './TelescopeStatus.css'
import Panel from '@/components/Panel/Panel.tsx'
import { useLiveTelescopeData } from '@/hooks/useLiveTelescopeData'
import { useState, useEffect } from 'react'
import telescopeAPI from '@/services/telescopeAPI'

export default function TelescopeStatus() {
    const liveData = useLiveTelescopeData();
    const [telescopeData, setTelescopeData] = useState({
        status: "Disconnected",
        rightAscension: 0,
        declination: 0,
        altitude: 0,
        azimuth: 0,
        connected: false,
        tracking: false,
        slewing: false
    });

    // Poll telescope status every 2 seconds
    useEffect(() => {
        const pollTelescope = async () => {
            try {
                const response = await telescopeAPI.getTelescopeStatus();
                if (response.success && response.data) {
                    setTelescopeData({
                        status: response.data.slewing ? "Slewing" :
                                response.data.tracking ? "Tracking" :
                                response.data.connected ? "Connected" : "Disconnected",
                        rightAscension: response.data.rightAscension,
                        declination: response.data.declination,
                        altitude: response.data.altitude,
                        azimuth: response.data.azimuth,
                        connected: response.data.connected,
                        tracking: response.data.tracking,
                        slewing: response.data.slewing
                    });
                }
            } catch (error) {
                // Telescope not connected, keep showing last known state
                console.log('Telescope not connected');
            }
        };

        // Poll immediately and then every 2 seconds
        pollTelescope();
        const interval = setInterval(pollTelescope, 2000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="telescope-status__wrapper">
            <Panel className="telescope-status__panel" borderRadius="3px">
                <div className="telescope-status__item">
                    <p><span>Status</span> {telescopeData.status}</p>
                </div>
            </Panel>
            <Panel className="telescope-status__panel" borderRadius="3px">
                <div className="telescope-status__item">
                    <p><span>RA</span> {telescopeData.rightAscension.toFixed(3)}h</p>
                    <p><span>Dec</span> {telescopeData.declination.toFixed(3)}°</p>
                </div>
            </Panel>
            <Panel className="telescope-status__panel" borderRadius="3px">
                <div className="telescope-status__item">
                    <p><span>Altitude</span> {telescopeData.altitude.toFixed(3)}°</p>
                    <p><span>Azimuth</span> {telescopeData.azimuth.toFixed(3)}°</p>
                </div>
            </Panel>
        </div>
    )
}