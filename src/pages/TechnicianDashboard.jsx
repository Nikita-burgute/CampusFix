import { useCallback, useEffect, useState } from "react";
import { getMyAssignments, getComplaintById, startComplaint, resolveComplaint } from "../services/api";

const pretty = (value) => (value || "—").toLowerCase().replaceAll("_", " ")
  .replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function TechnicianDashboard({ user, onLogout }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [actionId, setActionId] = useState(null);

  const loadAssignments = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const assignments = await getMyAssignments();
      const results = await Promise.all(assignments.map(async (assignment) => ({
        ...assignment,
        complaint: await getComplaintById(assignment.complaintId),
      })));
      setComplaints(results);
    } catch (err) { setError(err.message || "Unable to load assigned complaints."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAssignments(); }, [loadAssignments]);

  const count = (status) => complaints.filter((item) => item.complaint?.status === status).length;

  async function handleAction(item, action) {
    const complaintId = item.complaintId;
    setActionId(complaintId); setError(""); setMessage("");
    try {
      if (action === "start") {
        await startComplaint(complaintId);
        setMessage(`Work started for complaint #${complaintId}.`);
      } else {
        await resolveComplaint(complaintId);
        setMessage(`Complaint #${complaintId} marked resolved. It is now awaiting admin verification.`);
      }
      await loadAssignments();
    } catch (err) { setError(err.message || "Unable to update complaint."); }
    finally { setActionId(null); }
  }

  const displayName = user.name || user.email || "Technician";
  return (
    <main className="dashboard-page app-shell">
      <header className="dashboard-header app-topbar">
        <a className="brand app-brand" href="#technician-dashboard"><span className="brand-icon app-brand-icon">C</span><span>CampusFix</span></a>
        <nav className="app-nav" aria-label="Technician navigation"><a href="#tech-overview">Overview</a><a href="#my-assignments">My assignments</a></nav>
        <div className="dashboard-actions app-user-actions">
          <div className="app-avatar">{displayName.charAt(0).toUpperCase()}</div>
          <div className="app-user-meta"><strong>{displayName}</strong><span>Technician</span></div>
          <button className="logout-button app-button app-button-secondary" onClick={onLogout}>Sign out</button>
        </div>
      </header>

      <div className="app-content" id="technician-dashboard">
        <section className="welcome-card app-hero" id="tech-overview">
          <div><p className="eyebrow app-eyebrow">TECHNICIAN WORKSPACE</p><h1>Good work starts here, {displayName.split(" ")[0]}.</h1>
            <p>Manage assigned maintenance issues and keep the campus running.</p></div>
          <div className="app-hero-mark" aria-hidden="true">CF</div>
        </section>

        <section className="app-stat-grid tech-stat-grid" aria-label="Assignment summary">
          {[["My assignments", complaints.length, "stat-indigo"], ["Assigned", count("ASSIGNED"), "stat-amber"], ["In progress", count("IN_PROGRESS"), "stat-blue"], ["Awaiting admin", count("RESOLVED"), "stat-purple"]]
            .map(([label, value, tone]) => <article className={`app-stat-card ${tone}`} key={label}><p>{label}</p><strong>{loading ? "—" : value}</strong></article>)}
        </section>

        <section className="complaints-section app-panel" id="my-assignments">
          <div className="section-heading app-panel-heading"><div><h2>My assignments</h2><p>Start assigned work and mark it resolved when complete.</p></div>
            <button className="refresh-button app-button app-button-secondary" onClick={loadAssignments} disabled={loading}>{loading ? "Loading..." : "↻ Refresh"}</button>
          </div>
          {error && <div className="app-alert app-alert-error" role="alert"><span>{error}</span><button onClick={loadAssignments}>Retry</button></div>}
          {message && <div className="app-alert app-alert-success" role="status">{message}</div>}
          {loading ? <div className="app-empty">Loading your assignments...</div> :
            complaints.length === 0 ? <div className="app-empty"><span className="app-empty-symbol">✓</span><h3>No assignments yet</h3><p>New assignments from the administrator will appear here.</p></div> :
            <div className="complaints-list app-card-grid">{complaints.map((item) => {
              const complaint = item.complaint;
              const status = complaint.status;
              const busy = actionId === item.complaintId;
              return <article className="complaint-card app-complaint-card" key={item.id || item.complaintId}>
                <div className="app-card-topline"><span className="app-id-pill">Complaint #{item.complaintId}</span>
                  <span className={`app-status app-status-${String(status || "").toLowerCase().replaceAll("_", "-")}`}>{pretty(status)}</span></div>
                <h3>{complaint.title || `Complaint #${item.complaintId}`}</h3>
                <p className="app-card-description">{complaint.description}</p>
                <div className="app-card-meta"><span>Priority</span><strong className={`priority-label priority-${String(complaint.priority || "").toLowerCase()}`}>{pretty(complaint.priority)}</strong></div>
                <div className="app-card-meta"><span>Location ID</span><strong>{complaint.locationId ?? "—"}</strong></div>
                <div className="app-card-meta"><span>Equipment ID</span><strong>{complaint.equipmentId ?? "—"}</strong></div>
                {status === "ASSIGNED" && <button className="app-button app-button-primary app-action-button" disabled={busy} onClick={() => handleAction(item, "start")}>{busy ? "Updating..." : "▶ Start work"}</button>}
                {status === "IN_PROGRESS" && <button className="app-button app-button-success app-action-button" disabled={busy} onClick={() => handleAction(item, "resolve")}>{busy ? "Updating..." : "✓ Mark resolved"}</button>}
                {status === "RESOLVED" && <p className="app-workflow-note">Submitted for admin verification. Wait for approval or reassignment.</p>}
                {status === "CLOSED" && <p className="app-workflow-note app-workflow-done">This complaint has been verified and closed.</p>}
                {status === "REOPENED" && <p className="app-workflow-note">This complaint was reopened by admin and may need reassignment.</p>}
              </article>;
            })}</div>}
        </section>
        <footer className="app-footer">CampusFix · Technician workspace</footer>
      </div>
    </main>
  );
}
