import './SkyObjectList.css';
import Panel from '@/components/Panel/Panel.tsx'

type SkyObject = {
    id: string;
    name: string;
    ra: number;
    dec: number;
};

// mock data
const skyObjects: SkyObject[] = [
    { id: "sirius", name: "Sirius", ra: 6.752, dec: -16.716 },
    { id: "betelgeuse", name: "Betelgeuse", ra: 5.919, dec: 7.407 },
    { id: "vega", name: "Andromeda Galaxy", ra: 18.615, dec: 38.783 },
    { id: "polaris", name: "Polaris", ra: 2.53, dec: 89.264 },
    { id: "polaris", name: "F51", ra: 2.53, dec: 89.264 }
];

// mock data 2
const skyObjects2: SkyObject[] = [
    { id: "sirius", name: "Mars", ra: 6.752, dec: -16.716 },
    { id: "vega", name: "Vega", ra: 18.615, dec: 38.783 },
    { id: "vega", name: "N93", ra: 18.615, dec: 38.783 },
    { id: "polaris", name: "G62", ra: 2.53, dec: 89.264 }
];

export default function SkyObjectList() {
    return (
        <>
            <Panel className="sky-object-list__panel" borderRadius="3px">
                <h2 className="sky-object-list__title">Currently Visible</h2>
                <Panel className="sky-object-list__items-panel" borderRadius="3px">
                    <ul className="sky-object-list__list">
                        {skyObjects.map(obj => (
                            <li key={obj.id} className="sky-object-list__item">
                                {obj.name}
                            </li>
                        ))}
                    </ul>
                </Panel>
            </Panel>
            <Panel className="sky-object-list__panel" borderRadius="3px">
                <h2 className="sky-object-list__title">Visible Soon</h2>
                <Panel className="sky-object-list__items-panel" borderRadius="3px">
                    <ul className="sky-object-list__list">
                        {skyObjects2.map(obj => (
                            <li key={obj.id} className="sky-object-list__item">
                                {obj.name}
                            </li>
                        ))}
                    </ul>
                </Panel>
            </Panel>
        </>
    );
}