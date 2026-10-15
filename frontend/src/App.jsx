
import { useState } from "react";
import Login from "./pages/Login";
import StudentDashboard from "./pages/StudentDashboard";
import { loginUser } from "./services/api";
import "./App.css";
import AdminDashboard from "./pages/AdminDashboard";

function getSavedSession() {
  try {
    const token = sessionStorage.getItem("campusfix_token");
    const savedUser = sessionStorage.getItem("campusfix_user");

    if (!token || !savedUser) return null;

    return { token, user: JSON.parse(savedUser) };
  } catch {
    sessionStorage.removeItem("campusfix_token");
    sessionStorage.removeItem("campusfix_user");
    return null;
  }
}

export default function App() {
  const [session, setSession] = useState(getSavedSession);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(email, password) {
    setError("");
    setLoading(true);

    try {
      const data = await loginUser(email, password);

      const user = {
        email: data.email,
        name: data.name,
        role: data.role,
      };

      sessionStorage.setItem("campusfix_token", data.token);
      sessionStorage.setItem("campusfix_user", JSON.stringify(user));

      setSession({ token: data.token, user });
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to the backend. Check that Spring Boot is running on port 8086."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    sessionStorage.removeItem("campusfix_token");
    sessionStorage.removeItem("campusfix_user");
    setSession(null);
    setError("");
  }

  if (!session) {
    return <Login onLogin={handleLogin} error={error} loading={loading} />;
  }

 if (session.user.role === "ADMIN") {
  return (
    <AdminDashboard
      user={session.user}
      onLogout={handleLogout}
    />
  );
}

if (session.user.role === "TECHNICIAN") {
  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <div className="brand">
          <div className="brand-icon">C</div>
          <span>CampusFix</span>
        </div>
        <button className="logout-button" onClick={handleLogout}>
          Sign out
        </button>
      </header>
      <section className="welcome-card">
        <h1>Welcome, {session.user.name || session.user.email}!</h1>
        <p>The technician dashboard will be implemented next.</p>
      </section>
    </main>
  );
}

  return (
    <StudentDashboard user={session.user} onLogout={handleLogout} />
  );
}
