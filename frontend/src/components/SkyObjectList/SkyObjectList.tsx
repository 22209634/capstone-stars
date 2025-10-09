import './SkyObjectList.css';
import React from 'react';
import Panel from '@/components/Panel/Panel.tsx'
import { useVisibleObjects } from '../../hooks/useVisibleObjects';

export default function SkyObjectList() {
    const { objects, loading, error } = useVisibleObjects();
    
    // Get only first 20 objects
    const displayObjects = objects.slice(0, 10);

    if (loading) {
        return (
            <Panel className="sky-object-list__panel" borderRadius="3px">
                <h2 className="sky-object-list__title">Loading visible objects...</h2>
            </Panel>
        );
    }

    if (error) {
        return (
            <Panel className="sky-object-list__panel" borderRadius="3px">
                <h2 className="sky-object-list__title">Error: {error}</h2>
            </Panel>
        );
    }

    if (displayObjects.length === 0) {
        return (
            <Panel className="sky-object-list__panel" borderRadius="3px">
                <h2 className="sky-object-list__title">No objects found.</h2>
            </Panel>
        );
    }

    return (
        <>
            <Panel className="sky-object-list__panel" borderRadius="3px">
                <h2 className="sky-object-list__title">Currently Visible</h2>
                <Panel className="sky-object-list__items-panel" borderRadius="3px">
                    <ul className="sky-object-list__list">
                        {displayObjects.map((obj, index) => (
                            <li key={`${obj.name}-${index}`} className="sky-object-list__item">
                                {obj.name}
                            </li>
                        ))}
                    </ul>
                </Panel>
            </Panel>
        </>
    );
}