import './CollapsiblePanel.css'
import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Button from '@/components/Button/Button.tsx'
import type { ReactNode } from 'react'

interface CollapsiblePanelProps {
    children: ReactNode;
    side: 'left' | 'right';
    className?: string;
}

export default function CollapsiblePanel({ children, side, className }: CollapsiblePanelProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className={`collapsible-panel ${isCollapsed ? 'collapsed' : ''} ${side} ${className ?? ''}`}>
            <div className="collapsible-panel__content">
                {children}
            </div>
            <Button
                className={`collapsible-panel__toggle ${side}`}
                borderRadius="3px"
                onClick={() => setIsCollapsed(!isCollapsed)}
            >
                {side === 'left' ? (
                    isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />
                ) : (
                    isCollapsed ? <ChevronLeft size={18} /> : <ChevronRight size={18} />
                )}
            </Button>
        </div>
    )
}