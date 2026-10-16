import { useCallback, useEffect, useState } from "react";
import { getCurrentUser, getMyComplaints, createComplaint } from "../services/api";

const initialForm = {
  title: "",
  description: "",
  priority: "MEDIUM",
  locationId: "2",
  equipmentId: "3",
};

function formatStatus(status) {
  return (status || "UNKNOWN").toLowerCase().replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
function getStatusClass(status) {
  return (status || "unknown").toLowerCase().replaceAll("_", "-");
}

export default function StudentDashboard({ user, onLogout }) {
  const [profile, setProfile] = useState(user);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setPageError("");
    try {
      const [userData, complaintData] = await Promise.all([
        getCurrentUser(), getMyComplaints(),
      ]);
      setProfile(userData);
      setComplaints(Array.isArray(complaintData) ? complaintData : []);
    } catch (error) {
      setPageError(error.message || "Unable to load your dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const total = complaints.length;
  const inProgress = complaints.filter((item) => item.status === "IN_PROGRESS").length;
  const resolved = complaints.filter((item) => ["RESOLVED", "CLOSED"].includes(item.status)).length;
  const pending = complaints.filter((item) => ["REPORTED", "ASSIGNED", "REOPENED"].includes(item.status)).length;

  function handleFormChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");
    setSuccessMessage("");
    setSubmitting(true);
    try {
      const newComplaint = await createComplaint({
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority,
        locationId: Number(form.locationId),
        equipmentId: Number(form.equipmentId),
      });
      setComplaints((current) => [newComplaint, ...current]);
      setForm(initialForm);
      setShowForm(false);
      setSuccessMessage("Your complaint has been submitted successfully.");
    } catch (error) {
      setFormError(error.message || "Unable to submit complaint.");
    } finally {
      setSubmitting(false);
    }
  }

  const displayName = profile?.name || user?.name || "Student";

  return (
    <main className="student-dashboard app-shell">
      <header className="student-topbar app-topbar">
        <a className="student-brand app-brand" href="#dashboard">
          <span className="student-brand-icon app-brand-icon">C</span>
          <span>CampusFix</span>
        </a>
        <nav className="app-nav" aria-label="Student navigation">
          <a href="#my-complaints">My complaints</a>
          <a href="#student-profile">My profile</a>
        </nav>
        <div className="student-topbar-right app-user-actions">
          <div className="student-avatar app-avatar">{displayName.charAt(0).toUpperCase()}</div>
          <div className="student-topbar-user app-user-meta">
            <strong>{displayName}</strong><span>Student</span>
          </div>
          <button className="student-logout app-button app-button-secondary" onClick={onLogout}>Sign out</button>
        </div>
      </header>

      <div className="student-content app-content" id="dashboard">
        <section className="student-welcome app-hero">
          <div>
            <span className="student-eyebrow app-eyebrow">STUDENT PORTAL</span>
            <h1>Welcome back, {displayName.split(" ")[0]}!</h1>
            <p>Report campus issues, follow progress, and help keep your campus running smoothly.</p>
          </div>
          <button className="student-primary-button app-button app-button-primary"
            onClick={() => { setShowForm((current) => !current); setFormError(""); setSuccessMessage(""); }}>
            {showForm ? "Cancel" : "+ Raise a complaint"}
          </button>
        </section>

        {pageError && <div className="student-alert student-alert-error app-alert" role="alert">
          <span>{pageError}</span><button onClick={loadDashboard}>Retry</button>
        </div>}
        {successMessage && <div className="student-alert student-alert-success app-alert" role="status">{successMessage}</div>}

        <section className="student-summary app-stat-grid" aria-label="Complaint summary">
          {[
            ["Total complaints", total, "All your requests", "stat-indigo"],
            ["Pending / assigned", pending, "Awaiting completion", "stat-amber"],
            ["In progress", inProgress, "Currently being worked on", "stat-blue"],
            ["Resolved / closed", resolved, "Completed requests", "stat-green"],
          ].map(([label, value, note, tone]) => (
            <article className={`student-stat-card app-stat-card ${tone}`} key={label}>
              <span className="student-stat-label">{label}</span>
              <strong>{loading ? "—" : value}</strong>
              <span className="student-stat-note">{note}</span>
            </article>
          ))}
        </section>

        {showForm && <section className="student-panel student-form-panel app-panel">
          <div className="student-panel-heading app-panel-heading">
            <div><h2>Raise a complaint</h2><p>Share the details so the maintenance team can help.</p></div>
          </div>
          <form className="student-complaint-form app-form" onSubmit={handleSubmit}>
            <label>Complaint title
              <input name="title" value={form.title} onChange={handleFormChange}
                placeholder="e.g. Classroom fan not working" maxLength={150} required />
            </label>
            <label>Description
              <textarea name="description" value={form.description} onChange={handleFormChange}
                placeholder="Explain the issue and where it occurred..." rows={4} required />
            </label>
            <div className="student-form-grid app-form-grid">
              <label>Priority
                <select name="priority" value={form.priority} onChange={handleFormChange} required>
                  <option value="LOW">Low</option><option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option><option value="EMERGENCY">Emergency</option>
                </select>
              </label>
              <label>Location ID
                <input type="number" name="locationId" value={form.locationId} onChange={handleFormChange} min="1" required />
              </label>
              <label>Equipment ID
                <input type="number" name="equipmentId" value={form.equipmentId} onChange={handleFormChange} min="1" required />
              </label>
            </div>
            <p className="student-form-hint">Enter existing location and equipment IDs from your database. Current defaults are 2 and 3.</p>
            {formError && <div className="student-alert student-alert-error app-alert" role="alert">{formError}</div>}
            <div className="app-form-actions">
              <button className="student-primary-button app-button app-button-primary" type="submit" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit complaint"}
              </button>
              <button className="app-button app-button-secondary" type="button" onClick={() => setShowForm(false)} disabled={submitting}>Cancel</button>
            </div>
          </form>
        </section>}

        <section className="student-panel app-panel" id="my-complaints">
          <div className="student-panel-heading app-panel-heading">
            <div><h2>My complaints</h2><p>Track every maintenance request you have submitted.</p></div>
            <button className="student-refresh-button app-button app-button-secondary" onClick={loadDashboard} disabled={loading}>
              {loading ? "Loading..." : "↻ Refresh"}
            </button>
          </div>
          {loading ? <div className="student-empty-state">Loading your complaints...</div> :
            complaints.length === 0 ? <div className="student-empty-state">
              <div className="student-empty-icon">✓</div><h3>No complaints yet</h3>
              <p>Your submitted campus issues will appear here.</p>
              <button className="student-primary-button app-button app-button-primary" onClick={() => setShowForm(true)}>Raise your first complaint</button>
            </div> : <div className="student-table-wrapper app-table-wrapper">
              <table className="student-complaint-table app-table">
                <thead><tr><th>Complaint</th><th>Priority</th><th>Status</th><th>Location</th></tr></thead>
                <tbody>{complaints.map((complaint) => <tr key={complaint.id}>
                  <td><strong>{complaint.title}</strong>
                    <span className="student-complaint-description">{complaint.description}</span>
                    <span className="student-complaint-id">Complaint ID: #{complaint.id}</span></td>
                  <td><span className={`student-priority student-priority-${(complaint.priority || "medium").toLowerCase()}`}>{formatStatus(complaint.priority)}</span></td>
                  <td><span className={`student-status student-status-${getStatusClass(complaint.status)}`}>{formatStatus(complaint.status)}</span></td>
                  <td>{complaint.locationId ?? "—"}</td>
                </tr>)}</tbody>
              </table>
            </div>}
        </section>

        <section className="student-profile-panel app-panel" id="student-profile">
          <div><span className="student-eyebrow app-eyebrow">YOUR ACCOUNT</span><h2>Student profile</h2>
            <p className="app-muted">Your account details used by CampusFix.</p></div>
          <div className="student-profile-details app-profile-grid">
            <div><span>Full name</span><strong>{profile?.name || "—"}</strong></div>
            <div><span>Email address</span><strong>{profile?.email || user?.email || "—"}</strong></div>
            <div><span>Department</span><strong>{profile?.department || "—"}</strong></div>
            <div><span>Role</span><strong>{profile?.role || user?.role || "STUDENT"}</strong></div>
          </div>
        </section>
        <footer className="student-footer app-footer">CampusFix · Smart College Complaint &amp; Maintenance Management</footer>
      </div>
    </main>
  );
}
