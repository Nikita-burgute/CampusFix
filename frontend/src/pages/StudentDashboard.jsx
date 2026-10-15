
import { useCallback, useEffect, useState } from "react";
import {
  getCurrentUser,
  getMyComplaints,
  createComplaint,
} from "../services/api";

const initialForm = {
  title: "",
  description: "",
  priority: "MEDIUM",
  locationId: "2",
  equipmentId: "3",
};

function formatStatus(status) {
  return (status || "UNKNOWN")
    .toLowerCase()
    .replaceAll("_", " ")
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
        getCurrentUser(),
        getMyComplaints(),
      ]);

      setProfile(userData);
      setComplaints(Array.isArray(complaintData) ? complaintData : []);
    } catch (error) {
      setPageError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const total = complaints.length;
  const inProgress = complaints.filter(
    (item) => item.status === "IN_PROGRESS"
  ).length;
  const resolved = complaints.filter(
    (item) => ["RESOLVED", "CLOSED"].includes(item.status)
  ).length;
  const pending = complaints.filter(
    (item) =>
      ["REPORTED", "ASSIGNED", "REOPENED"].includes(item.status)
  ).length;

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
      setFormError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="student-dashboard">
      <header className="student-topbar">
        <a className="student-brand" href="#dashboard">
          <span className="student-brand-icon">C</span>
          <span>CampusFix</span>
        </a>

        <div className="student-topbar-right">
          <div className="student-avatar">
            {(profile?.name || user?.name || "S").charAt(0).toUpperCase()}
          </div>
          <div className="student-topbar-user">
            <strong>{profile?.name || user?.name || "Student"}</strong>
            <span>Student</span>
          </div>
          <button className="student-logout" onClick={onLogout}>
            Sign out
          </button>
        </div>
      </header>

      <div className="student-content" id="dashboard">
        <section className="student-welcome">
          <div>
            <span className="student-eyebrow">STUDENT PORTAL</span>
            <h1>
              Welcome back, {(profile?.name || user?.name || "Student").split(" ")[0]}!
            </h1>
            <p>Track your maintenance requests and keep your campus running.</p>
          </div>

          <button
            className="student-primary-button"
            onClick={() => {
              setShowForm((current) => !current);
              setFormError("");
              setSuccessMessage("");
            }}
          >
            {showForm ? "Cancel" : "+ Raise a complaint"}
          </button>
        </section>

        {pageError && (
          <div className="student-alert student-alert-error" role="alert">
            {pageError}
            <button onClick={loadDashboard}>Retry</button>
          </div>
        )}

        {successMessage && (
          <div className="student-alert student-alert-success" role="status">
            {successMessage}
          </div>
        )}

        <section className="student-summary" aria-label="Complaint summary">
          <article className="student-stat-card">
            <span className="student-stat-label">Total complaints</span>
            <strong>{loading ? "—" : total}</strong>
            <span className="student-stat-note">All your requests</span>
          </article>

          <article className="student-stat-card">
            <span className="student-stat-label">Pending / assigned</span>
            <strong>{loading ? "—" : pending}</strong>
            <span className="student-stat-note">Awaiting completion</span>
          </article>

          <article className="student-stat-card">
            <span className="student-stat-label">In progress</span>
            <strong>{loading ? "—" : inProgress}</strong>
            <span className="student-stat-note">Currently being worked on</span>
          </article>

          <article className="student-stat-card">
            <span className="student-stat-label">Resolved / closed</span>
            <strong>{loading ? "—" : resolved}</strong>
            <span className="student-stat-note">Completed requests</span>
          </article>
        </section>

        {showForm && (
          <section className="student-panel student-form-panel">
            <div className="student-panel-heading">
              <div>
                <h2>Raise a complaint</h2>
                <p>Describe the issue so the maintenance team can help.</p>
              </div>
            </div>

            <form className="student-complaint-form" onSubmit={handleSubmit}>
              <label>
                Complaint title
                <input
                  name="title"
                  value={form.title}
                  onChange={handleFormChange}
                  placeholder="e.g. Fan not working"
                  maxLength={150}
                  required
                />
              </label>

              <label>
                Description
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  placeholder="Explain the issue and where it occurred..."
                  rows={4}
                  required
                />
              </label>

              <div className="student-form-grid">
                <label>
                  Priority
                  <select
                    name="priority"
                    value={form.priority}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="EMERGENCY">Emergency</option>
                  </select>
                </label>

                <label>
                  Location ID
                  <input
                    type="number"
                    name="locationId"
                    value={form.locationId}
                    onChange={handleFormChange}
                    min="1"
                    required
                  />
                </label>

                <label>
                  Equipment ID
                  <input
                    type="number"
                    name="equipmentId"
                    value={form.equipmentId}
                    onChange={handleFormChange}
                    min="1"
                    required
                  />
                </label>
              </div>

              <p className="student-form-hint">
                Use existing location and equipment IDs from your database.
                The default IDs are 2 and 3, which were used in your API tests.
              </p>

              {formError && (
                <div className="student-alert student-alert-error" role="alert">
                  {formError}
                </div>
              )}

              <button
                className="student-primary-button"
                type="submit"
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit complaint"}
              </button>
            </form>
          </section>
        )}

        <section className="student-panel">
          <div className="student-panel-heading">
            <div>
              <h2>My complaints</h2>
              <p>View and track the maintenance requests you submitted.</p>
            </div>
            <button
              className="student-refresh-button"
              onClick={loadDashboard}
              disabled={loading}
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {loading ? (
            <div className="student-empty-state">Loading your complaints...</div>
          ) : complaints.length === 0 ? (
            <div className="student-empty-state">
              <div className="student-empty-icon">✓</div>
              <h3>No complaints yet</h3>
              <p>When you report a campus issue, it will appear here.</p>
              <button
                className="student-primary-button"
                onClick={() => setShowForm(true)}
              >
                Raise your first complaint
              </button>
            </div>
          ) : (
            <div className="student-table-wrapper">
              <table className="student-complaint-table">
                <thead>
                  <tr>
                    <th>Complaint</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Location</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.map((complaint) => (
                    <tr key={complaint.id}>
                      <td>
                        <strong>{complaint.title}</strong>
                        <span className="student-complaint-description">
                          {complaint.description}
                        </span>
                        <span className="student-complaint-id">
                          ID: {complaint.id}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`student-priority student-priority-${(
                            complaint.priority || "medium"
                          ).toLowerCase()}`}
                        >
                          {formatStatus(complaint.priority)}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`student-status student-status-${getStatusClass(
                            complaint.status
                          )}`}
                        >
                          {formatStatus(complaint.status)}
                        </span>
                      </td>
                      <td>{complaint.locationId ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="student-profile-panel">
          <div>
            <span className="student-eyebrow">YOUR ACCOUNT</span>
            <h2>Student profile</h2>
          </div>
          <div className="student-profile-details">
            <div>
              <span>Full name</span>
              <strong>{profile?.name || "—"}</strong>
            </div>
            <div>
              <span>Email address</span>
              <strong>{profile?.email || user?.email || "—"}</strong>
            </div>
            <div>
              <span>Department</span>
              <strong>{profile?.department || "—"}</strong>
            </div>
            <div>
              <span>Role</span>
              <strong>{profile?.role || user?.role || "STUDENT"}</strong>
            </div>
          </div>
        </section>

        <footer className="student-footer">
          CampusFix · Smart College Complaint & Maintenance Management
        </footer>
      </div>
    </main>
  );
}
