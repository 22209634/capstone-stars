import Panel from "./Panel";

/* For ObjectItem, time is the time until the object appears in the sky */
type ObjectItem = { name: string; time?: string };

type ObjectListProps = {
  title: string;
  items: ObjectItem[];
};

export default function ObjectList({ title, items }: ObjectListProps) {
  return (
    <Panel title={title}>
      <ul className="object-list">
        {items.map((obj, i) => (
          <li key={i} className="object-list__item">
            <span className="object-list__name">{obj.name}</span>
            {obj.time && <span className="object-list__time">{obj.time}</span>}
          </li>
        ))}
      </ul>
    </Panel>
  );
}
