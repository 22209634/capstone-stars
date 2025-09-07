import type { ReactNode } from 'react';
import './Panel.css';

interface PanelProps {
    children: ReactNode;
    className?: string;
}

export default function Panel({ children, className }: PanelProps) {
    return (
        <div className={`panel ${className ?? ""}`}>
            {children}
        </div>
    );
}