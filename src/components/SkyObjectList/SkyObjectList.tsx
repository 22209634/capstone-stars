import React from 'react'

export type SkyObject = {
    id: string;
    name: string;
    // RA in hours (0-24) or in degrees; toggle with raIsHours
    ra: number;
    // Dec in degrees (-90 - +90)
    dec: number;
};

export type SkyObjectListProps = {
    objects: SkyObject[];
    selectedId?: string | null;
    onSelect?: (obj: SkyObject) => void;
    emptyState?: React.ReactNode;
    raIsHours?: boolean; // default is true
    className?: string;
};