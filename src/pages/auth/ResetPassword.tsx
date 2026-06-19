import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, ShieldCheck } from "lucide-react";
import { updatePassword } from "../../services/authService";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error } = await updatePassword(password);
    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Password updated successfully. Please sign in again.");
    navigate("/login");
  };

  return (
    <main className="stock-auth-page auth-final-page auth-reset-page">
      <section className="stock-auth-left">
        <video className="auth-bg-video" src="/bg.mp4" autoPlay loop muted playsInline />

        <div className="auth-stars">
          <span /><span /><span /><span /><span />
        </div>
        <div className="auth-orb orb-one" />
        <div className="auth-orb orb-two" />
        <div className="auth-orb orb-three" />

        <div className="auth-left-content">
          <div className="auth-hero-brand">
            <div className="auth-hero-icon">
              <video src="/logo.mp4" autoPlay loop muted playsInline aria-label="CCD StockFlow logo" />
            </div>
            <h1 className="auth-hero-title" aria-label="CCD Inventory System">
              <span className="auth-title-line">CCD Inventory</span>
              <span className="auth-title-line">System</span>
            </h1>
            <p className="auth-hero-copy">
              Create a new password and return to your StockFlow command center.
            </p>
          </div>
        </div>
      </section>

      <section className="stock-auth-right">
        <video className="auth-bg-video" src="/bg.mp4" autoPlay loop muted playsInline />

        <div className="right-bg-circle circle-a" />
        <div className="right-bg-circle circle-b" />
        <div className="right-bg-diamond" />

        <div className="auth-flip-wrapper">
          <div className="auth-flip-box">
            <form className="auth-modern-card auth-login-side auth-reset-card" onSubmit={handleReset}>
              <div className="auth-tabs">
                <button type="button" className="active">
                  New Password
                </button>
                <button type="button" onClick={() => navigate("/login")}>
                  Sign In
                </button>
              </div>

              <div className="auth-form-body">
                <div className="auth-card-heading">
                  <span className="auth-kicker">
                    <ShieldCheck size={16} />
                    Account security
                  </span>
                  <h2>Set new password</h2>
                  <p>Choose a strong password for your inventory account.</p>
                </div>

                <label htmlFor="new-password">New Password</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon" aria-hidden="true">
                    <Lock size={16} strokeWidth={2} />
                  </span>
                  <input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="password-eye"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <label htmlFor="confirm-password">Confirm Password</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon" aria-hidden="true">
                    <Lock size={16} strokeWidth={2} />
                  </span>
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="password-eye"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <button className="auth-submit-btn" type="submit" disabled={loading}>
                  {loading ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>

        <p className="auth-footer">&copy; 2026 StockFlow. All rights reserved.</p>
      </section>
    </main>
  );
};

export default ResetPassword;
