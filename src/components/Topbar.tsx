export default function Topbar() {
  return (
    <header>
      <div className="logo">
        <strong>STARS System v0.1</strong>
      </div>
      <ul className="playback-controls">
        <li>
          <button className="live">• LIVE</button>
        </li>
        <li>
          <button className="rewind">◀◀</button>
        </li>
        <li>
          <button className="pause-play">||</button>
        </li>
        <li>
          <button className="fast-forward">▶▶</button>
        </li>
      </ul>
      <div className="topbar-status">
        <p>Now tracking: M31 (Andromeda Galaxy)</p>
      </div>
      <ul>
        <li className="search">🔍</li>
        <li className="capture">📷 Capture</li>
        <li className="menu-hamburger">☰ Menu</li>
      </ul>
    </header>
  );
}
