export default function TelescopeControls() {
  return (
    <div className="telescope-controls">
      <div className="telescope-controls__directional">
        <button className="telescope-controls__btn telescope-controls__btn--up">
          ▲
        </button>
        <div className="telescope-controls__middle">
          <button className="telescope-controls__btn telescope-controls__btn--left">
            ◀
          </button>
          <button className="telescope-controls__btn telescope-controls__btn--right">
            ▶
          </button>
        </div>
        <button className="telescope-controls__btn telescope-controls__btn--down">
          ▼
        </button>
      </div>
      <button className="telescope-controls__end-tracking">End Tracking</button>
    </div>
  );
}
