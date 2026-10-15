import { useState } from "react";

export default function Login({ onLogin, error, loading }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    await onLogin(email.trim(), password);
  }

  return (
    <main className="login-page">
      <section className="login-visual">
        <div className="brand">
          <div className="brand-icon">C</div>
          <span>CampusFix</span>
        </div>

        <div className="visual-content">
          <span className="eyebrow">CAMPUS MAINTENANCE, SIMPLIFIED</span>
          <h1>A better campus starts with a simple fix.</h1>
          <p>
            Report maintenance issues, track progress, and help make your
            campus a better place to learn and work.
          </p>

          <div className="feature-list">
            <div className="feature-item">
              <span className="feature-check">✓</span>
              <span>Report and track complaints</span>
            </div>
            <div className="feature-item">
              <span className="feature-check">✓</span>
              <span>Keep maintenance organized</span>
            </div>
            <div className="feature-item">
              <span className="feature-check">✓</span>
              <span>Stay updated on resolutions</span>
            </div>
          </div>
        </div>

        <p className="visual-footer">A smarter way to care for your campus.</p>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <div className="mobile-brand">
            <div className="brand-icon">C</div>
            <span>CampusFix</span>
          </div>

          <span className="form-label">WELCOME BACK</span>
          <h2>Sign in to your account</h2>
          <p className="form-description">
            Enter your registered credentials to continue.
          </p>

          <form onSubmit={handleSubmit}>
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            <div className="password-label">
              <label htmlFor="password">Password</label>
            </div>

            <div className="password-input-wrap">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button
                type="button"
                className="show-password"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            {error && (
              <div className="error-message" role="alert">
                {error}
              </div>
            )}

            <button className="login-button" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
              {!loading && <span aria-hidden="true"> →</span>}
            </button>
          </form>

          <p className="security-note">
            <span aria-hidden="true">●</span> Secure sign-in for campus users
          </p>
        </div>

        <p className="copyright">
          © {new Date().getFullYear()} CampusFix
        </p>
      </section>
    </main>
  );
}