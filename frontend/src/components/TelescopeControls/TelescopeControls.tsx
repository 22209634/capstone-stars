import './TelescopeControls.css'
import Button from '@/components/Button/Button.tsx'
import Panel from '@/components/Panel/Panel.tsx'
import { ArrowBigUp, ArrowBigDown, ArrowBigRight, ArrowBigLeft } from 'lucide-react'
import { useTelescopeContext } from '@/contexts/TelescopeContext'
import { useState } from 'react'
import { hmsToDegrees, dmsToDegrees } from '@/utils/coordinateUtils'

export default function TelescopeControls() {
    const { moveUp, moveDown, moveLeft, moveRight, startMoveUp, startMoveDown, startMoveLeft, startMoveRight, stopMove, toggleTracking, isTracking, gotoCoordinates, connectionMode } = useTelescopeContext();
    const [showGotoPanel, setShowGotoPanel] = useState(false);
    const [raInput, setRaInput] = useState('');
    const [decInput, setDecInput] = useState('');
    const [error, setError] = useState('');

    // Track if button is being held (for differentiating single click vs hold)
    const holdTimerRef = useState<any>(null);
    const isHoldingRef = useState(false);

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

    // Handler for when button is pressed down
    const handleMoveStart = (startMoveFn: () => void) => {
        isHoldingRef[1](false);
        // Set a timer - if button is held for more than 200ms, it's a hold
        const timer = setTimeout(() => {
            isHoldingRef[1](true);
            startMoveFn(); // Start continuous movement
        }, 200);
        holdTimerRef[1](timer);
    };

    // Handler for when button is released
    const handleMoveEnd = (singleMoveFn: () => void) => {
        // Clear the hold timer
        if (holdTimerRef[0]) {
            clearTimeout(holdTimerRef[0]);
            holdTimerRef[1](null);
        }

        // If it was a hold, stop the continuous movement
        if (isHoldingRef[0]) {
            stopMove();
        } else {
            // It was a quick click - do a single small move
            singleMoveFn();
        }

        isHoldingRef[1](false);
    };

    // In ASCOM mode, buttons are disabled when not tracking
    // In simulation mode, buttons are always enabled
    const buttonsDisabled = connectionMode === 'ascom' && !isTracking;

    return (
        <>
            <div className="telescope-controls__wrapper">
            <Button
                className={`telescope-controls__panel telescope-controls__left ${buttonsDisabled ? 'disabled' : ''}`}
                borderRadius="3px"
                onMouseDown={() => handleMoveStart(startMoveLeft)}
                onMouseUp={() => handleMoveEnd(() => moveLeft(0.25))}
                onMouseLeave={() => handleMoveEnd(() => {})}
                onTouchStart={() => handleMoveStart(startMoveLeft)}
                onTouchEnd={() => handleMoveEnd(() => moveLeft(0.25))}
                disabled={buttonsDisabled}
            >
                <ArrowBigLeft size={30} color={buttonsDisabled ? "#888888" : "#ffffff"} />
            </Button>
            <Button
                className={`telescope-controls__panel telescope-controls__up ${buttonsDisabled ? 'disabled' : ''}`}
                borderRadius="3px"
                onMouseDown={() => handleMoveStart(startMoveUp)}
                onMouseUp={() => handleMoveEnd(() => moveUp(0.25))}
                onMouseLeave={() => handleMoveEnd(() => {})}
                onTouchStart={() => handleMoveStart(startMoveUp)}
                onTouchEnd={() => handleMoveEnd(() => moveUp(0.25))}
                disabled={buttonsDisabled}
            >
                <ArrowBigUp size={30} color={buttonsDisabled ? "#888888" : "#ffffff"} />
            </Button>
            <Button
                className={`telescope-controls__panel telescope-controls__park ${isTracking ? 'tracking' : ''}`}
                borderRadius="3px"
                onClick={toggleTracking}
            >
                <span className="telescope-controls__text">{isTracking ? 'STOP TRACKING' : 'TRACK'}</span>
            </Button>
            <Button
                className={`telescope-controls__panel telescope-controls__down ${buttonsDisabled ? 'disabled' : ''}`}
                borderRadius="3px"
                onMouseDown={() => handleMoveStart(startMoveDown)}
                onMouseUp={() => handleMoveEnd(() => moveDown(0.25))}
                onMouseLeave={() => handleMoveEnd(() => {})}
                onTouchStart={() => handleMoveStart(startMoveDown)}
                onTouchEnd={() => handleMoveEnd(() => moveDown(0.25))}
                disabled={buttonsDisabled}
            >
                <ArrowBigDown size={30} color={buttonsDisabled ? "#888888" : "#ffffff"} />
            </Button>
            <Button
                className={`telescope-controls__panel telescope-controls__right ${buttonsDisabled ? 'disabled' : ''}`}
                borderRadius="3px"
                onMouseDown={() => handleMoveStart(startMoveRight)}
                onMouseUp={() => handleMoveEnd(() => moveRight(0.25))}
                onMouseLeave={() => handleMoveEnd(() => {})}
                onTouchStart={() => handleMoveStart(startMoveRight)}
                onTouchEnd={() => handleMoveEnd(() => moveRight(0.25))}
                disabled={buttonsDisabled}
            >
                <ArrowBigRight size={30} color={buttonsDisabled ? "#888888" : "#ffffff"} />
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