export default function Loading() {
  return <section className="loading-state" role="status" aria-label="טוען את מרחב העבודה"><div className="skeleton skeleton-title" /><div className="summary-grid">{[1, 2, 3, 4].map(id => <div className="skeleton skeleton-card" key={id} />)}</div><span className="muted">טוען את מרחב העבודה…</span></section>;
}
