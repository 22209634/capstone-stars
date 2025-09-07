import {Dot, Rewind, Pause, Play, FastForward, Camera, Menu} from 'lucide-react';
import './Topbar.css';

export default function Topbar() {
    return (
        <section className="topbar">
            <h1>STARS System v0.1</h1>
            <section className="playback-controls">
                <button className="playback-controls__live"><Dot /> LIVE</button>
                <button className="playback-controls__rewind"><Rewind /></button>
                <button className="playback-controls__pause-play"><Pause /><Play /></button>
                <button className="playback-controls__fast-forward"><FastForward /></button>
            </section>
            <section className="topbar-status">
                <p>Now Tracking: M31 (Andromeda Galaxy)</p>
            </section>
            <section className="topbar-right">
                <input type="text" placeholder=" Search..." />
                <button><Camera /> Capture</button>
                <button><Menu/> Menu</button>
            </section>
        </section>
    )
}