import {Target, Rewind, Pause, FastForward, Camera, Menu} from 'lucide-react';
import Panel from '@/components/Panel/Panel.tsx'
import './Topbar.css';

export default function Topbar() {
    return (
        <Panel className="topbar__panel" borderRadius="3px">
            <div className="topbar__items-wrapper">
                <h1 className="logo">STARS System v0.1</h1>
                <section className="playback-controls">
                    <button className="playback-controls__live"><Target size={16} color="#669c35" /> LIVE</button>
                    <button className="playback-controls__rewind"><Rewind /></button>
                    <button className="playback-controls__pause-play"><Pause /></button>
                    <button className="playback-controls__fast-forward"><FastForward /></button>
                </section>
                <section className="status-line">
                    <p>Now Tracking: M31 (Andromeda Galaxy)</p>
                </section>
                <div className="topbar-right">
                    <input type="text" placeholder=" Search..." />
                    <button className="capture-btn"><Camera /> Capture</button>
                    <button className="menu-btn"><Menu/> Menu</button>
                </div>
            </div>
        </Panel>
    )
}