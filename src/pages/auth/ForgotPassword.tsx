import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  Bot,
  Mail,
  MapPin,
  ScanLine,
  ShieldCheck,
  TrendingUp,
  Zap,
} from "lucide-react";
import { forgotPassword } from "../../services/authService";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const features = [
    { icon: Bot, title: "AI Inventory Assistant", desc: "Smart inventory answers instantly." },
    { icon: TrendingUp, title: "Smart Restock Predictor", desc: "Forecast demand and restock smarter." },
    { icon: MapPin, title: "Product Location Mapping", desc: "Track product locations instantly." },
    { icon: Bell, title: "Real-Time Notifications", desc: "Instant low-stock notifications." },
    { icon: ScanLine, title: "Barcode & QR Scanning", desc: "Scan barcodes and QR codes fast." },
    { icon: ShieldCheck, title: "Audit Trail Monitoring", desc: "Monitor actions with audit logs." },
  ];

  const renderTitleLine = (text: string) =>
    text.split("").map((char, index) => (
      <span
        className={char === " " ? "auth-title-space" : "auth-title-letter"}
        key={`${text}-${index}`}
        aria-hidden="true"
      >
        {char === " " ? "\u00A0" : char}
      </span>
    ));

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
    <main className="stock-auth-page auth-final-page auth-forgot-page">
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
              <span className="auth-title-line">{renderTitleLine("CCD Inventory")}</span>
              <span className="auth-title-line">{renderTitleLine("System")}</span>
            </h1>
            <p className="auth-hero-copy">
              Recover your account securely and get back to managing inventory,
              stock movement, reports, and alerts.
            </p>
          </div>

          <div className="auth-feature-list">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div className="auth-feature" key={feature.title}>
                  <div className="feature-icon">
                    <Icon size={18} strokeWidth={2.2} />
                  </div>
                  <div>
                    <h3>{feature.title}</h3>
                    <p>{feature.desc}</p>
                  </div>
                </div>
              );
            })}
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
            <form
              className="auth-modern-card auth-login-side auth-reset-card"
              onSubmit={handleForgotPassword}
            >
              <div className="auth-tabs">
                <button type="button" className="active">
                  Reset Password
                </button>
                <button type="button" onClick={() => navigate("/login")}>
                  Sign In
                </button>
              </div>

              <div className="auth-form-body">
                <div className="auth-card-heading">
                  <span className="auth-kicker">
                    <Zap size={16} />
                    Secure recovery
                  </span>
                  <h2>Forgot password?</h2>
                  <p>
                    Enter your account email and we will send a reset link to
                    your inbox.
                  </p>
                </div>

                <label htmlFor="reset-email">Email Address</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon" aria-hidden="true">
                    <Mail size={16} strokeWidth={2} />
                  </span>
                  <input
                    id="reset-email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setSent(false);
                    }}
                    required
                  />
                </div>

                {sent && (
                  <div className="auth-success-message">
                    Reset link sent. Please check your email inbox and spam
                    folder.
                  </div>
                )}

                <button className="auth-submit-btn" type="submit" disabled={loading}>
                  {loading ? "Sending..." : sent ? "Send Again" : "Send Reset Link"}
                </button>

                <button
                  className="auth-back-btn"
                  type="button"
                  onClick={() => navigate("/login")}
                >
                  <ArrowLeft size={16} />
                  Back to Sign In
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

export default ForgotPassword;
