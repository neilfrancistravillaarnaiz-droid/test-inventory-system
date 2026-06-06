import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { forgotPassword } from "../../services/authService";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await forgotPassword(email);

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    setSent(true);
  };

  return (
    <main className="stock-auth-page">
      <section className="stock-auth-left">
        <div className="auth-stars">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>

        <div className="auth-orb orb-one"></div>
        <div className="auth-orb orb-two"></div>
        <div className="auth-orb orb-three"></div>

        <div className="brand-block">
          <div className="brand-icon">▣</div>
          <h1 className="brand-title">CCD StockFlow</h1>
          <p>
            Quickly recover access and stay connected to your inventory operations
            with the same secure, intelligent StockFlow experience.
          </p>
        </div>

        <div className="auth-feature-list">
          <div className="auth-feature">
            <div className="feature-icon">🔒</div>
            <div>
              <h3>Secure recovery</h3>
              <p>Fast password reset with secure email verification.</p>
            </div>
          </div>
          <div className="auth-feature">
            <div className="feature-icon">⚡</div>
            <div>
              <h3>Quick access</h3>
              <p>Get back into your dashboard with minimal delay.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="stock-auth-right">
        <div className="right-bg-circle circle-a"></div>
        <div className="right-bg-circle circle-b"></div>
        <div className="right-bg-diamond"></div>

        <div className="auth-flip-wrapper">
          <div className="auth-flip-box">
            <form className="auth-modern-card auth-login-side" onSubmit={handleForgotPassword}>
              <div className="auth-tabs">
                <button type="button" className="active">
                  Reset Password
                </button>
                <button type="button" onClick={() => navigate("/login")}>Sign In</button>
              </div>

              <div className="auth-form-body">
                <label>Email Address</label>
                <div className="auth-input-wrap">
                  <span>✉</span>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <button className="auth-submit-btn" type="submit" disabled={loading || sent}>
                  {loading ? "Sending..." : sent ? "Link Sent" : "Send Reset Link"}
                </button>

                <p className="register-note">
                  {sent ? (
                    <>Reset link sent! Return to <button type="button" onClick={() => navigate("/login")}>Sign in</button>.</>
                  ) : (
                    <>Enter your email and we’ll send a reset link to your inbox.</>
                  )}
                </p>
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
};

export default ForgotPassword;