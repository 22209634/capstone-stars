import './TelescopeControls.css'
import Button from '@/components/Button/Button.tsx'
import { ArrowBigUp, ArrowBigDown, ArrowBigRight, ArrowBigLeft } from 'lucide-react'
import { moveLeft, moveRight, moveUp, moveDown } from '@/services/controlsUtils'
import { useStellarium } from '@/hooks/useStellarium'

export default function TelescopeControls() {
    const stellarium = useStellarium();

    console.log('TelescopeControls render - stellarium:', stellarium);

    const handleMove = (moveFunction: (stel: any) => void) => {
        console.log('handleMove called with stellarium:', stellarium);
        if (stellarium) {
            moveFunction(stellarium);
            console.log('Moving telescope...');
        } else {
            console.log('Telescope not ready yet');
        }
    };
    
    return (
        <div className="telescope-controls__wrapper">
            <Button
                className="telescope-controls__panel telescope-controls__left"
                borderRadius="3px"
                onClick={() => handleMove(moveLeft)}
            >
                <ArrowBigLeft size={30} color="#ffffff" />
            </Button>
            <Button
                className="telescope-controls__panel telescope-controls__up"
                borderRadius="3px"
                onClick={() => handleMove(moveUp)}
            >
                <ArrowBigUp size={30} color="#ffffff" />
            </Button>
            <Button
                className="telescope-controls__panel telescope-controls__down"
                borderRadius="3px"
                onClick={() => handleMove(moveDown)}
            >
                <ArrowBigDown size={30} color="#ffffff" />
            </Button>
            <Button
                className="telescope-controls__panel telescope-controls__right"
                borderRadius="3px"
                onClick={() => handleMove(moveRight)}
            >
                <ArrowBigRight size={30} color="#ffffff" />
            </Button>
        </div>
    )
}