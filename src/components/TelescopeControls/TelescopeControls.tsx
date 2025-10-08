import './TelescopeControls.css'
import Button from '@/components/Button/Button.tsx'
import { ArrowBigUp, ArrowBigDown, ArrowBigRight, ArrowBigLeft } from 'lucide-react'
import { useTelescopeContext } from '@/contexts/TelescopeContext'

export default function TelescopeControls() {
    const { startMoveUp, startMoveDown, startMoveLeft, startMoveRight, stopMove, togglePark, isParked } = useTelescopeContext();

    return (
        <div className="telescope-controls__wrapper">
            <Button
                className={`telescope-controls__panel telescope-controls__left ${isParked ? 'disabled' : ''}`}
                borderRadius="3px"
                onMouseDown={startMoveLeft}
                onMouseUp={stopMove}
                onMouseLeave={stopMove}
                onTouchStart={startMoveLeft}
                onTouchEnd={stopMove}
            >
                <ArrowBigLeft size={30} color={isParked ? "#888888" : "#ffffff"} />
            </Button>
            <Button
                className={`telescope-controls__panel telescope-controls__up ${isParked ? 'disabled' : ''}`}
                borderRadius="3px"
                onMouseDown={startMoveUp}
                onMouseUp={stopMove}
                onMouseLeave={stopMove}
                onTouchStart={startMoveUp}
                onTouchEnd={stopMove}
            >
                <ArrowBigUp size={30} color={isParked ? "#888888" : "#ffffff"} />
            </Button>
            <Button
                className={`telescope-controls__panel telescope-controls__park ${isParked ? 'parked' : ''}`}
                borderRadius="3px"
                onClick={togglePark}
            >
                <span style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '16px' }}>PARK</span>
            </Button>
            <Button
                className={`telescope-controls__panel telescope-controls__down ${isParked ? 'disabled' : ''}`}
                borderRadius="3px"
                onMouseDown={startMoveDown}
                onMouseUp={stopMove}
                onMouseLeave={stopMove}
                onTouchStart={startMoveDown}
                onTouchEnd={stopMove}
            >
                <ArrowBigDown size={30} color={isParked ? "#888888" : "#ffffff"} />
            </Button>
            <Button
                className={`telescope-controls__panel telescope-controls__right ${isParked ? 'disabled' : ''}`}
                borderRadius="3px"
                onMouseDown={startMoveRight}
                onMouseUp={stopMove}
                onMouseLeave={stopMove}
                onTouchStart={startMoveRight}
                onTouchEnd={stopMove}
            >
                <ArrowBigRight size={30} color={isParked ? "#888888" : "#ffffff"} />
            </Button>
        </div>
    )
}