/* What GlassPanel will return; title is optional */
type PanelProps = {
  title?: string;
  children: React.ReactNode;
};

export default function Panel({ title, children }: PanelProps) {
  return (
    <section className="panel">
      {title && <h3 className="panel__title">{title}</h3>}
      <div className="panel__body">{children}</div>
    </section>
  );
}
