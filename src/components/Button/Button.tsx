import './Button.css'
import Panel from '@/components/Panel/Panel.tsx'
import type { ReactNode } from 'react'

type ButtonProps = {
    children: ReactNode;
    borderRadius?: string;
    className?: string;
    onClick?: () => void;
}

export default function Button({ children, borderRadius, className, onClick }: ButtonProps) {
    return (
        <Panel className={`btn__panel ${className ?? ''}`} borderRadius={borderRadius}>
            <button className="btn" onClick={onClick} >
                {children}
            </button>
        </Panel>
    )
}