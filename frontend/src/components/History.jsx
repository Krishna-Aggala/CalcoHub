import { useState } from "react";
import api from "../api";

function History({
  history,
  onDelete,
  onClear,
  loading,
  onSelect,
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function deleteOne(id) {
    try {
      setError("");

      await api.delete(`/calculations/${id}`);

      onDelete(id);
    } catch {
      setError("Could not delete this calculation.");
    }
  }

  async function clearAll() {
    if (history.length === 0 || deleting) {
      return;
    }

    const confirmed = window.confirm(
      "Delete all saved calculation history?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);
      setError("");

      await api.delete("/calculations");

      onClear();
    } catch {
      setError("Could not clear calculation history.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <aside className="history-card">
      <div className="history-heading">
        <div>
          <p className="eyebrow">YOUR ACTIVITY</p>
          <h2>History</h2>
        </div>

        <span className="history-count">
          {history.length}
        </span>
      </div>

      <div className="history-toolbar">
        <span>Recent calculations</span>

        <button
          className="text-button"
          onClick={clearAll}
          disabled={history.length === 0 || deleting}
        >
          Clear all
        </button>
      </div>

      {error && (
        <p className="message error-message">{error}</p>
      )}

      <div className="history-list">
        {loading ? (
          <p className="empty-state">Loading history...</p>
        ) : history.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">↻</div>
            <h3>No calculations yet</h3>
            <p>
              Your saved calculations will appear here.
            </p>
          </div>
        ) : (
          history.map((item) => (
            <div className="history-item" key={item._id}>
              <button
                className="history-details"
                onClick={() => onSelect(item)}
                title="Use this calculation again"
              >
                <span className="history-expression">
                  {item.expression}
                </span>

                <span className="history-result">
                  = {item.result}
                </span>

                <span className="history-date">
                  {new Date(item.createdAt).toLocaleString()}
                </span>
              </button>

              <button
                className="delete-button"
                onClick={() => deleteOne(item._id)}
                aria-label="Delete calculation"
                title="Delete calculation"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>

      <div className="history-footer">
        <span className="status-dot"></span>
        Stored in MongoDB Atlas
      </div>
    </aside>
  );
}

export default History;