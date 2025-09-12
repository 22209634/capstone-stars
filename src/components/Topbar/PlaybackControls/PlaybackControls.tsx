import { Target, Rewind, Pause, FastForward } from 'lucide-react';
import './PlaybackControls.css'

export default function PlaybackControls() {
    return (
        <section className="playback-controls">
            <button className="playback-controls__live"><Target size={16} color="#669c35" /> LIVE</button>
            <button className="playback-controls__rewind"><Rewind /></button>
            <button className="playback-controls__pause-play"><Pause /></button>
            <button className="playback-controls__fast-forward"><FastForward /></button>
        </section>
    )
}