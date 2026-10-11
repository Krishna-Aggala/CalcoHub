function Header() {
  return (
    <header className="app-header">
      <div className="brand">
        <div className="brand-icon">∑</div>

        <div>
          <h1>Calco</h1>
          <p>Precision in every calculation</p>
        </div>
      </div>

      <div className="connection-status">
        <span className="status-dot"></span>
        <span>Cloud History</span>
      </div>
    </header>
  );
}

export default Header;