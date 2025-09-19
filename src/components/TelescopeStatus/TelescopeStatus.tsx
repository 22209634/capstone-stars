import './TelescopeStatus.css'
import Panel from '@/components/Panel/Panel.tsx'
import { useLiveTelescopeData } from '@/hooks/useLiveTelescopeData'



const mockData = {
    status: "Slewing",
    rightAscension: 12.34,
    declination: 56.78,
    altitude: 123.45,
    azimuth: 98.76
}

export default function TelescopeStatus() {
    const liveData = useLiveTelescopeData();
    return (
        <div className="telescope-status__wrapper">
            <Panel className="telescope-status__panel" borderRadius="3px">
                <div className="telescope-status__item">
                    <p><span>Status</span> {mockData.status}</p>
                </div>
            </Panel>
            <Panel className="telescope-status__panel" borderRadius="3px">
                <div className="telescope-status__item">
                    <p><span>RA</span> {mockData.rightAscension}</p>
                    <p><span>Dec</span> {mockData.declination}</p>
                </div>
            </Panel>
            <Panel className="telescope-status__panel" borderRadius="3px">
                <div className="telescope-status__item">
                    <p><span>Altitude</span> {liveData.altitude}</p>
                    <p><span>Azimuth</span> {liveData.azimuth}</p>
                </div>
            </Panel>
        </div>
    )
}