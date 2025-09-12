import { Camera } from 'lucide-react';
import Panel from '@/components/Panel/Panel.tsx'
import StatusLine from '@/components/Topbar/StatusLine/StatusLine.tsx'
import './Topbar.css';

export default function Topbar() {
    return (
        <Panel className="topbar__panel" borderRadius="3px">
            <div className="topbar__items-wrapper">
                <h1 className="logo">STARS System v0.1</h1>
                <StatusLine />
                <div className="topbar-right">
                    <input type="text" placeholder=" Search..." />
                    <button className="capture-btn"><Camera /> Capture</button>
                    {/* <button className="menu-btn"><Menu/> Menu</button> */}
                </div>
            </div>
        </Panel>
    )
}