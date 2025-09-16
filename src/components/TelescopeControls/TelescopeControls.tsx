import './TelescopeControls.css'
import Button from '@/components/Button/Button.tsx'
import { ArrowBigUp, ArrowBigDown, ArrowBigRight,ArrowBigLeft } from 'lucide-react'

export default function TelescopeControls() {
    return (
        <div className="telescope-controls__wrapper">
            <Button className="telescope-controls__panel telescope-controls__left" borderRadius="3px">
                    <ArrowBigLeft size={30} color="#ffffff" />
            </Button>
            <Button className="telescope-controls__panel telescope-controls__up" borderRadius="3px">
                    <ArrowBigUp size={30} color="#ffffff" />
            </Button>
            <Button className="telescope-controls__panel telescope-controls__down" borderRadius="3px">
                    <ArrowBigDown size={30} color="#ffffff" />
            </Button>
            <Button className="telescope-controls__panel telescope-controls__right" borderRadius="3px">
                    <ArrowBigRight size={30} color="#ffffff" />
            </Button>
        </div>
    )
}