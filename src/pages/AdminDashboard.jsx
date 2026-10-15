
import { useCallback, useEffect, useState } from "react";
import {
  getAllComplaints,
  getAllUsers,
  assignTechnician,
} from "../services/api";

const STATUS_LABELS = {
  REPORTED: "Reported",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
  REOPENED: "Reopened",
};

const ASSIGNABLE_STATUSES = ["REPORTED", "REOPENED", "ASSIGNED"];

export default function AdminDashboard({ user, onLogout }) {
  const [complaints, setComplaints] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [selectedTechnicians, setSelectedTechnicians] = useState({});
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [complaintData, userData] = await Promise.all([
        getAllComplaints(),
        getAllUsers(),
      ]);

      setComplaints(Array.isArray(complaintData) ? complaintData : []);

      const technicianUsers = Array.isArray(userData)
        ? userData.filter((item) => item.role === "TECHNICIAN")
        : [];

      setTechnicians(technicianUsers);
    } catch (err) {
      setError(err.message || "Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const countStatus = (...statuses) =>
    complaints.filter((complaint) =>
      statuses.includes(complaint.status)
    ).length;

  const stats = [
    { label: "Total Complaints", value: complaints.length },
    { label: "Reported", value: countStatus("REPORTED") },
    { label: "Assigned", value: countStatus("ASSIGNED") },
    { label: "In Progress", value: countStatus("IN_PROGRESS") },
    { label: "Resolved", value: countStatus("RESOLVED") },
    { label: "Reopened", value: countStatus("REOPENED") },
    { label: "Closed", value: countStatus("CLOSED") },
  ];

  function handleTechnicianChange(complaintId, technicianId) {
    setSelectedTechnicians((previous) => ({
      ...previous,
      [complaintId]: technicianId,
    }));
  }

  async function handleAssign(complaint) {
    const technicianId = selectedTechnicians[complaint.id];

    if (!technicianId) {
      setError("Please select a technician first.");
      setMessage("");
      return;
    }

    setAssigningId(complaint.id);
    setError("");
    setMessage("");

    try {
      await assignTechnician(complaint.id, technicianId);
      setMessage(`Technician assigned to complaint #${complaint.id}.`);
      await loadDashboard();
    } catch (err) {
      setError(err.message || "Unable to assign technician.");
    } finally {
      setAssigningId(null);
    }
  }

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <div className="brand">
          <div className="brand-icon">C</div>
          <span>CampusFix</span>
        </div>

        <div className="dashboard-actions">
          <span className="role-label">Administrator</span>
          <button className="logout-button" onClick={onLogout}>
            Sign out
          </button>
        </div>
      </header>

      <section className="welcome-card">
        <p className="eyebrow">ADMINISTRATION</p>
        <h1>Welcome, {user.name || user.email}!</h1>
        <p>Monitor complaints and track maintenance progress across campus.</p>
      </section>

      <section className="admin-stats" aria-label="Complaint statistics">
        {stats.map((stat) => (
          <article className="admin-stat-card" key={stat.label}>
            <p>{stat.label}</p>
            <strong>{loading ? "—" : stat.value}</strong>
          </article>
        ))}
      </section>

      <section className="complaints-panel">
        <div className="panel-heading">
          <div>
            <h2>All Complaints</h2>
            <p>Review complaints and assign eligible technicians.</p>
          </div>

          <button
            className="refresh-button"
            onClick={loadDashboard}
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {error && (
          <div className="dashboard-error" role="alert">
            {error}
            <button onClick={loadDashboard}>Try again</button>
          </div>
        )}

        {message && (
          <div className="dashboard-success" role="status">
            {message}
          </div>
        )}

        {!loading && !error && complaints.length === 0 && (
          <p className="empty-state">No complaints found.</p>
        )}

        {complaints.length > 0 && (
          <div className="table-wrapper">
            <table className="complaints-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Complaint</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Location ID</th>
                  <th>Equipment ID</th>
                  <th>Reported By</th>
                  <th>Technician Assignment</th>
                </tr>
              </thead>

              <tbody>
                {complaints.map((complaint) => {
                  const canAssign = ASSIGNABLE_STATUSES.includes(
                    complaint.status
                  );

                  return (
                    <tr key={complaint.id}>
                      <td>#{complaint.id}</td>
                      <td>
                        <strong>{complaint.title}</strong>
                        <p className="complaint-description">
                          {complaint.description}
                        </p>
                      </td>
                      <td>
                        <span
                          className={`priority-label priority-${String(
                            complaint.priority || ""
                          ).toLowerCase()}`}
                        >
                          {complaint.priority || "—"}
                        </span>
                      </td>
                      <td>
                        {STATUS_LABELS[complaint.status] ||
                          complaint.status ||
                          "—"}
                      </td>
                      <td>{complaint.locationId ?? "—"}</td>
                      <td>{complaint.equipmentId ?? "—"}</td>
                      <td>{complaint.reportedById ?? "—"}</td>
                      <td>
                        {canAssign ? (
                          <div className="assignment-controls">
                            <select
                              aria-label={`Technician for complaint ${complaint.id}`}
                              value={selectedTechnicians[complaint.id] || ""}
                              onChange={(event) =>
                                handleTechnicianChange(
                                  complaint.id,
                                  event.target.value
                                )
                              }
                              disabled={assigningId === complaint.id}
                            >
                              <option value="">Select technician</option>
                              {technicians.map((technician) => (
                                <option
                                  key={technician.id}
                                  value={technician.id}
                                >
                                  {technician.name} (#{technician.id})
                                </option>
                              ))}
                            </select>

                            <button
                              className="assign-button"
                              onClick={() => handleAssign(complaint)}
                              disabled={
                                loading ||
                                assigningId === complaint.id ||
                                !selectedTechnicians[complaint.id] ||
                                technicians.length === 0
                              }
                            >
                              {assigningId === complaint.id
                                ? "Saving..."
                                : complaint.status === "ASSIGNED"
                                  ? "Reassign"
                                  : "Assign"}
                            </button>
                          </div>
                        ) : (
                          <span className="assignment-unavailable">
                            {complaint.status === "IN_PROGRESS"
                              ? "In progress"
                              : "Not available"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
