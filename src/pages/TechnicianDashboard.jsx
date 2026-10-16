
import { useCallback, useEffect, useState } from "react";
import {
  getMyAssignments,
  getComplaintById,
  startComplaint,
  resolveComplaint,
} from "../services/api";

export default function TechnicianDashboard({ user, onLogout }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState(null);

  const loadAssignments = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const assignments = await getMyAssignments();

      const results = await Promise.all(
        assignments.map(async (assignment) => {
          const complaint = await getComplaintById(
            assignment.complaintId
          );

          return {
            ...assignment,
            complaint,
          };
        })
      );

      setComplaints(results);
    } catch (err) {
      setError(err.message || "Unable to load assigned complaints.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  async function handleAction(complaint, action) {
    const complaintId = complaint.complaintId;

    setActionId(complaintId);
    setError("");

    try {
      if (action === "start") {
        await startComplaint(complaintId);
      } else {
        await resolveComplaint(complaintId);
      }

      await loadAssignments();
    } catch (err) {
      setError(err.message || "Unable to update complaint.");
    } finally {
      setActionId(null);
    }
  }

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <div className="brand">
          <div className="brand-icon">C</div>
          <span>CampusFix</span>
        </div>

        <button className="logout-button" onClick={onLogout}>
          Sign out
        </button>
      </header>

      <section className="welcome-card">
        <h1>Technician Dashboard</h1>
        <p>Welcome, {user.name || user.email}!</p>
        <p>View and manage your assigned maintenance complaints.</p>
      </section>

      <section className="complaints-section">
        <div className="section-heading">
          <h2>My Assignments</h2>
          <button
            className="logout-button"
            onClick={loadAssignments}
            disabled={loading}
          >
            Refresh
          </button>
        </div>

        {error && <p role="alert">{error}</p>}

        {loading ? (
          <p>Loading assignments...</p>
        ) : complaints.length === 0 ? (
          <p>No assigned complaints found.</p>
        ) : (
          <div className="complaints-list">
            {complaints.map((item) => {
              const complaint = item.complaint;
              const status = complaint.status;
              const busy = actionId === item.complaintId;

              return (
                <article className="complaint-card" key={item.id}>
                  <h3>
                    {complaint.title || `Complaint #${item.complaintId}`}
                  </h3>

                  <p>Complaint ID: {item.complaintId}</p>
                  <p>{complaint.description}</p>
                  <p>
                    Priority: <strong>{complaint.priority || "N/A"}</strong>
                  </p>
                  <p>
                    Status: <strong>{status}</strong>
                  </p>

                  {status === "ASSIGNED" && (
                    <button
                      className="logout-button"
                      disabled={busy}
                      onClick={() => handleAction(item, "start")}
                    >
                      {busy ? "Updating..." : "Start Work"}
                    </button>
                  )}

                  {status === "IN_PROGRESS" && (
                    <button
                      className="logout-button"
                      disabled={busy}
                      onClick={() => handleAction(item, "resolve")}
                    >
                      {busy ? "Updating..." : "Mark Resolved"}
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
