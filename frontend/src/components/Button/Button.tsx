import './Button.css'
import Panel from '@/components/Panel/Panel.tsx'
import type { ReactNode } from 'react'

type ButtonProps = {
    children: ReactNode;
    borderRadius?: string;
    className?: string;
    onClick?: () => void;
    onMouseDown?: () => void;
    onMouseUp?: () => void;
    onMouseLeave?: () => void;
    onTouchStart?: () => void;
    onTouchEnd?: () => void;
}

export default function Button({ children, borderRadius, className, onClick, onMouseDown, onMouseUp, onMouseLeave, onTouchStart, onTouchEnd }: ButtonProps) {
    return (
        <Panel className={`btn__panel ${className ?? ''}`} borderRadius={borderRadius}>
            <button
                className="btn"
                onClick={onClick}
                onMouseDown={onMouseDown}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseLeave}
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
            >
                {children}
            </button>
        </Panel>
    )
}