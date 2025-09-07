import type {ReactNode} from 'react';
import './Panel.css';

interface PanelProps {
    children: ReactNode;
    className?: string;
    borderRadius?: string;
}

export default function Panel({children, className, borderRadius}: PanelProps) {
    return (
        <div
            className={`panel ${className ?? ""}`}
            style={{ "--border-radius": borderRadius } as React.CSSProperties}
        >
            {children}
            <div className="panel-bg"></div>
        </div>
    );
}