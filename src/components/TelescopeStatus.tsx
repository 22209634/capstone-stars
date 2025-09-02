export default function TelescopeStatus() {
  return (
    <div className="telescope-status">
      <div className="telescope-status__main">
        <div className="telescope-status__animation">
          {/* Placeholder for telescope animation */}
          <div className="telescope-status__telescope-placeholder">🔭</div>
        </div>

        <div className="telescope-status__info">
          <div className="telescope-status__status">
            <span className="telescope-status__label">STATUS</span>
            <span className="telescope-status__value">SLEWING</span>
          </div>

          <div className="telescope-status__user">
            <span className="telescope-status__label">CURRENT USER</span>
            <span className="telescope-status__value">YOU</span>
          </div>
        </div>
      </div>

      <div className="telescope-status__coordinates">
        <div className="telescope-status__coordinate">
          <span className="telescope-status__coord-label">RA</span>
          <span className="telescope-status__coord-value">0h 42m 44s</span>
        </div>

        <div className="telescope-status__coordinate">
          <span className="telescope-status__coord-label">DEC</span>
          <span className="telescope-status__coord-value">+41° 16' 9"</span>
        </div>
      </div>

      <div className="telescope-status__position">
        <div className="telescope-status__altitude">
          <span className="telescope-status__pos-label">ALTITUDE</span>
          <span className="telescope-status__pos-value">51.5°</span>
        </div>

        <div className="telescope-status__azimuth">
          <span className="telescope-status__pos-label">AZIMUTH</span>
          <span className="telescope-status__pos-value">0°</span>
        </div>
      </div>
    </div>
  );
}
