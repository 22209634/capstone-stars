import './TelescopeControls.css'
import Button from '@/components/Button/Button.tsx'
import Panel from '@/components/Panel/Panel.tsx'
import { ArrowBigUp, ArrowBigDown, ArrowBigRight, ArrowBigLeft } from 'lucide-react'
import { useTelescopeContext } from '@/contexts/TelescopeContext'
import { useState } from 'react'
import { hmsToDegrees, dmsToDegrees } from '@/utils/coordinateUtils'

export default function TelescopeControls() {
    const { startMoveUp, startMoveDown, startMoveLeft, startMoveRight, stopMove, toggleTracking, isTracking, gotoCoordinates } = useTelescopeContext();
    const [showGotoPanel, setShowGotoPanel] = useState(false);
    const [raInput, setRaInput] = useState('');
    const [decInput, setDecInput] = useState('');
    const [error, setError] = useState('');

    const handleGotoSubmit = () => {
        try {
            setError('');
            // Convert HMS/DMS to decimal degrees
            const raDegrees = hmsToDegrees(raInput);
            const decDegrees = dmsToDegrees(decInput);

            gotoCoordinates(raDegrees, decDegrees);
            setShowGotoPanel(false);
            setRaInput('');
            setDecInput('');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Invalid coordinate format');
        }
    };

    return (
        <>
            <div className="telescope-controls__wrapper">
            <Button
                className={`telescope-controls__panel telescope-controls__left ${!isTracking ? 'disabled' : ''}`}
                borderRadius="3px"
                onMouseDown={startMoveLeft}
                onMouseUp={stopMove}
                onMouseLeave={stopMove}
                onTouchStart={startMoveLeft}
                onTouchEnd={stopMove}
            >
                <ArrowBigLeft size={30} color={!isTracking ? "#888888" : "#ffffff"} />
            </Button>
            <Button
                className={`telescope-controls__panel telescope-controls__up ${!isTracking ? 'disabled' : ''}`}
                borderRadius="3px"
                onMouseDown={startMoveUp}
                onMouseUp={stopMove}
                onMouseLeave={stopMove}
                onTouchStart={startMoveUp}
                onTouchEnd={stopMove}
            >
                <ArrowBigUp size={30} color={!isTracking ? "#888888" : "#ffffff"} />
            </Button>
            <Button
                className={`telescope-controls__panel telescope-controls__park ${isTracking ? 'tracking' : ''}`}
                borderRadius="3px"
                onClick={toggleTracking}
            >
                <span className="telescope-controls__text">{isTracking ? 'STOP TRACKING' : 'TRACK'}</span>
            </Button>
            <Button
                className={`telescope-controls__panel telescope-controls__down ${!isTracking ? 'disabled' : ''}`}
                borderRadius="3px"
                onMouseDown={startMoveDown}
                onMouseUp={stopMove}
                onMouseLeave={stopMove}
                onTouchStart={startMoveDown}
                onTouchEnd={stopMove}
            >
                <ArrowBigDown size={30} color={!isTracking ? "#888888" : "#ffffff"} />
            </Button>
            <Button
                className={`telescope-controls__panel telescope-controls__right ${!isTracking ? 'disabled' : ''}`}
                borderRadius="3px"
                onMouseDown={startMoveRight}
                onMouseUp={stopMove}
                onMouseLeave={stopMove}
                onTouchStart={startMoveRight}
                onTouchEnd={stopMove}
            >
                <ArrowBigRight size={30} color={!isTracking ? "#888888" : "#ffffff"} />
            </Button>
            <Button
                className="telescope-controls__panel telescope-controls__goto"
                borderRadius="3px"
                onClick={() => setShowGotoPanel(!showGotoPanel)}
            >
                <span className="telescope-controls__text telescope-controls__text--small">GOTO</span>
            </Button>
        </div>

        {showGotoPanel && (
            <Panel className="goto-panel" borderRadius="3px">
                <div className="goto-panel__content">
                    <h3>Go To Coordinates</h3>
                    <div className="goto-panel__inputs">
                        <div className="goto-panel__input-group">
                            <label>RA (HH:MM:SS)</label>
                            <input
                                type="text"
                                value={raInput}
                                onChange={(e) => setRaInput(e.target.value)}
                                placeholder="12:34:56.7"
                            />
                        </div>
                        <div className="goto-panel__input-group">
                            <label>Dec (±DD:MM:SS)</label>
                            <input
                                type="text"
                                value={decInput}
                                onChange={(e) => setDecInput(e.target.value)}
                                placeholder="+45:30:12.3"
                            />
                        </div>
                    </div>
                    {error && (
                        <div className="goto-panel__error">
                            {error}
                        </div>
                    )}
                    <div className="goto-panel__buttons">
                        <button onClick={handleGotoSubmit} className="goto-panel__button goto-panel__button--submit">
                            Go
                        </button>
                        <button onClick={() => { setShowGotoPanel(false); setError(''); }} className="goto-panel__button goto-panel__button--cancel">
                            Cancel
                        </button>
                    </div>
                </div>
            </Panel>
        )}
        </>
    )
}