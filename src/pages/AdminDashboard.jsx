import { useCallback, useEffect, useState } from "react";
import {
  getAllComplaints,
  getAllUsers,
  assignTechnician,
  verifyResolution,
} from "../services/api";

const STATUS_LABELS = {
  REPORTED: "Reported", ASSIGNED: "Assigned", IN_PROGRESS: "In progress",
  RESOLVED: "Awaiting verification", CLOSED: "Closed", REOPENED: "Reopened",
};
const ASSIGNABLE_STATUSES = ["REPORTED", "REOPENED", "ASSIGNED"];

function pretty(value) {
  return (value || "—").toLowerCase().replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function AdminDashboard({ user, onLogout }) {
  const [complaints, setComplaints] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [selectedTechnicians, setSelectedTechnicians] = useState({});
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState(null);
  const [verifyingId, setVerifyingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [complaintData, userData] = await Promise.all([getAllComplaints(), getAllUsers()]);
      setComplaints(Array.isArray(complaintData) ? complaintData : []);
      setTechnicians(Array.isArray(userData) ? userData.filter((item) => item.role === "TECHNICIAN") : []);
    } catch (err) {
      setError(err.message || "Unable to load dashboard data.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const countStatus = (...statuses) => complaints.filter((c) => statuses.includes(c.status)).length;
  const stats = [
    ["Total complaints", complaints.length, "stat-indigo"],
    ["Reported", countStatus("REPORTED"), "stat-amber"],
    ["Assigned", countStatus("ASSIGNED"), "stat-amber"],
    ["In progress", countStatus("IN_PROGRESS"), "stat-blue"],
    ["Awaiting review", countStatus("RESOLVED"), "stat-purple"],
    ["Reopened", countStatus("REOPENED"), "stat-red"],
    ["Closed", countStatus("CLOSED"), "stat-green"],
  ];

  function handleTechnicianChange(complaintId, technicianId) {
    setSelectedTechnicians((previous) => ({ ...previous, [complaintId]: technicianId }));
  }

  async function handleAssign(complaint) {
    const technicianId = selectedTechnicians[complaint.id];
    if (!technicianId) { setError("Please select a technician first."); setMessage(""); return; }
    setAssigningId(complaint.id); setError(""); setMessage("");
    try {
      await assignTechnician(complaint.id, technicianId);
      setMessage(`Technician assigned to complaint #${complaint.id}.`);
      await loadDashboard();
    } catch (err) { setError(err.message || "Unable to assign technician."); }
    finally { setAssigningId(null); }
  }

  async function handleVerification(complaint, approved) {
    setVerifyingId(complaint.id); setError(""); setMessage("");
    try {
      await verifyResolution(complaint.id, approved);
      setMessage(approved
        ? `Complaint #${complaint.id} has been closed after verification.`
        : `Complaint #${complaint.id} has been reopened for technician follow-up.`);
      await loadDashboard();
    } catch (err) { setError(err.message || "Unable to verify resolution."); }
    finally { setVerifyingId(null); }
  }

  return (
    <main className="dashboard-page app-shell">
      <header className="dashboard-header app-topbar">
        <a className="brand app-brand" href="#admin-dashboard"><span className="brand-icon app-brand-icon">C</span><span>CampusFix</span></a>
        <nav className="app-nav" aria-label="Admin navigation">
          <a href="#admin-overview">Overview</a><a href="#all-complaints">Complaints</a>
        </nav>
        <div className="dashboard-actions app-user-actions">
          <div className="app-avatar">{(user.name || user.email || "A").charAt(0).toUpperCase()}</div>
          <div className="app-user-meta"><strong>{user.name || user.email}</strong><span>Administrator</span></div>
          <button className="logout-button app-button app-button-secondary" onClick={onLogout}>Sign out</button>
        </div>
      </header>

      <div className="app-content" id="admin-dashboard">
        <section className="welcome-card app-hero" id="admin-overview">
          <div><p className="eyebrow app-eyebrow">ADMINISTRATION</p>
            <h1>Welcome, {user.name || "Administrator"}!</h1>
            <p>Monitor complaints, assign technicians, and verify completed maintenance work.</p></div>
          <div className="app-hero-mark" aria-hidden="true">CF</div>
        </section>

        <section className="admin-stats app-stat-grid" aria-label="Complaint statistics">
          {stats.map(([label, value, tone]) => <article className={`admin-stat-card app-stat-card ${tone}`} key={label}>
            <p>{label}</p><strong>{loading ? "—" : value}</strong>
          </article>)}
        </section>

        <section className="complaints-panel app-panel" id="all-complaints">
          <div className="panel-heading app-panel-heading">
            <div><h2>All complaints</h2><p>Assign work and review technician resolutions.</p></div>
            <button className="refresh-button app-button app-button-primary" onClick={loadDashboard} disabled={loading}>
              {loading ? "Loading..." : "↻ Refresh"}
            </button>
          </div>
          {error && <div className="dashboard-error app-alert app-alert-error" role="alert"><span>{error}</span><button onClick={loadDashboard}>Try again</button></div>}
          {message && <div className="dashboard-success app-alert app-alert-success" role="status">{message}</div>}
          {loading && complaints.length === 0 ? <div className="app-empty">Loading complaints...</div> :
            !loading && complaints.length === 0 ? <div className="empty-state app-empty">No complaints found.</div> :
            <div className="table-wrapper app-table-wrapper">
              <table className="complaints-table app-table">
                <thead><tr><th>ID</th><th>Complaint</th><th>Priority</th><th>Status</th><th>Location</th><th>Equipment</th><th>Reported by</th><th>Technician assignment</th><th>Resolution review</th></tr></thead>
                <tbody>{complaints.map((complaint) => {
                  const canAssign = ASSIGNABLE_STATUSES.includes(complaint.status);
                  const isVerifying = verifyingId === complaint.id;
                  return <tr key={complaint.id}>
                    <td><span className="app-id-pill">#{complaint.id}</span></td>
                    <td><strong>{complaint.title}</strong><p className="complaint-description">{complaint.description}</p></td>
                    <td><span className={`priority-label priority-${String(complaint.priority || "").toLowerCase()}`}>{pretty(complaint.priority)}</span></td>
                    <td><span className={`app-status app-status-${String(complaint.status || "").toLowerCase().replaceAll("_", "-")}`}>{STATUS_LABELS[complaint.status] || pretty(complaint.status)}</span></td>
                    <td>{complaint.locationId ?? "—"}</td><td>{complaint.equipmentId ?? "—"}</td><td>{complaint.reportedById ?? "—"}</td>
                    <td>{canAssign ? <div className="assignment-controls">
                      <select aria-label={`Technician for complaint ${complaint.id}`} value={selectedTechnicians[complaint.id] || ""}
                        onChange={(event) => handleTechnicianChange(complaint.id, event.target.value)} disabled={assigningId === complaint.id}>
                        <option value="">Select technician</option>
                        {technicians.map((technician) => <option key={technician.id} value={technician.id}>{technician.name} (#{technician.id})</option>)}
                      </select>
                      <button className="assign-button app-button app-button-primary" onClick={() => handleAssign(complaint)}
                        disabled={loading || assigningId === complaint.id || !selectedTechnicians[complaint.id] || technicians.length === 0}>
                        {assigningId === complaint.id ? "Saving..." : complaint.status === "ASSIGNED" ? "Reassign technician" : "Assign technician"}
                      </button>
                    </div> : <span className="assignment-unavailable">{complaint.status === "IN_PROGRESS" ? "Work in progress" : complaint.status === "RESOLVED" ? "Technician completed" : complaint.status === "CLOSED" ? "Completed" : "Not available"}</span>}</td>
                    <td>{complaint.status === "RESOLVED" ? <div className="verification-controls">
                      <button className="verify-close-button" disabled={isVerifying} onClick={() => handleVerification(complaint, true)}>
                        {isVerifying ? "Saving..." : "✓ Close complaint"}
                      </button>
                      <button className="verify-reopen-button" disabled={isVerifying} onClick={() => handleVerification(complaint, false)}>
                        {isVerifying ? "Saving..." : "↻ Reopen for technician"}
                      </button>
                    </div> : <span className="assignment-unavailable">{complaint.status === "CLOSED" ? "Verified and closed" : complaint.status === "REOPENED" ? "Needs reassignment" : "—"}</span>}</td>
                  </tr>;
                })}</tbody>
              </table>
            </div>}
        </section>
        <footer className="app-footer">CampusFix · Administration workspace</footer>
      </div>
    </main>
  );
}
