import { useState } from "react";
import {
  Eye,
  EyeOff,
  Bot,
  TrendingUp,
  MapPin,
  Bell,
  ScanLine,
  ShieldCheck,
  Mail,
  Lock,
  User,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  getProfileForAuthUser,
  login,
  logout,
  register,
} from "../../services/authService";

type LoginProps = {
  defaultRegister?: boolean;
};

const Login = ({ defaultRegister = false }: LoginProps) => {
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(defaultRegister);
  const [loading, setLoading] = useState(false);

  const [loginEmail, setLoginEmail]       = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [registerName, setRegisterName]         = useState("");
  const [registerEmail, setRegisterEmail]       = useState("");
  const [registerPassword, setRegisterPassword] = useState("");

  const [showLoginPassword,    setShowLoginPassword]    = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  const features = [
    { icon: Bot,         title: "AI Inventory Assistant",   desc: "Smart inventory answers instantly."    },
    { icon: TrendingUp,  title: "Smart Restock Predictor",  desc: "Forecast demand and restock smarter." },
    { icon: MapPin,      title: "Product Location Mapping", desc: "Track product locations instantly."   },
    { icon: Bell,        title: "Real-Time Notifications",  desc: "Instant low-stock notifications."     },
    { icon: ScanLine,    title: "Barcode & QR Scanning",    desc: "Scan barcodes and QR codes fast."     },
    { icon: ShieldCheck, title: "Audit Trail Monitoring",   desc: "Monitor actions with audit logs."     },
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await login(loginEmail.trim().toLowerCase(), loginPassword);
    setLoading(false);
    if (error) { alert(error.message); return; }

    if (data.user) {
      const { data: profile } = await getProfileForAuthUser(
        data.user.id,
        data.user.email
      );

      if (profile?.role === "Admin") {
        await logout();
        alert("Admin accounts must use the secure Admin Login with email OTP.");
        navigate("/admin-login");
        return;
      }
    }

    navigate("/dashboard");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await register(
      registerEmail,
      registerPassword,
      registerName
    );
    setLoading(false);
    if (error) { alert(error.message); return; }
    alert(`Account created successfully${registerName ? `, ${registerName}` : ""}. You can now login.`);
    setIsRegister(false);
  };

  return (
    <main className="stock-auth-page auth-final-page">

      {/* ══════════════════════════════════
          LEFT PANEL
      ══════════════════════════════════ */}
      <section className="stock-auth-left">
        <video className="auth-bg-video" src="/bg.mp4" autoPlay loop muted playsInline />

        <div className="auth-stars">
          <span /><span /><span /><span /><span />
        </div>
        <div className="auth-orb orb-one" />
        <div className="auth-orb orb-two" />
        <div className="auth-orb orb-three" />

        <div className="auth-left-content">
          {/* Brand */}
          <div className="auth-hero-brand">
            <div className="auth-hero-icon">
              <video src="/logo.mp4" autoPlay loop muted playsInline aria-label="CCD StockFlow logo" />
            </div>
            <h1 className="auth-hero-title" aria-label="CCD Inventory System">
              <span className="auth-title-line">{renderTitleLine("CCD Inventory")}</span>
              <span className="auth-title-line">{renderTitleLine("System")}</span>
            </h1>
            <p className="auth-hero-copy">
              The intelligent inventory platform that helps you track, analyze,
              and optimize your stock across every warehouse and storefront.
            </p>
          </div>

          {/* Features */}
          <div className="auth-feature-list">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div className="auth-feature" key={f.title}>
                  <div className="feature-icon">
                    <Icon size={18} strokeWidth={2.2} />
                  </div>
                  <div>
                    <h3>{f.title}</h3>
                    <p>{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Trust */}
          <div className="auth-trust">
            <div className="trust-avatars">
              <span>A</span><span>B</span><span>C</span><span>D</span>
            </div>
            <strong>2,400+</strong>
            <p>businesses trust StockFlow</p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          RIGHT PANEL
      ══════════════════════════════════ */}
      <section className="stock-auth-right">
        <video className="auth-bg-video" src="/bg.mp4" autoPlay loop muted playsInline />

        <div className="right-bg-circle circle-a" />
        <div className="right-bg-circle circle-b" />
        <div className="right-bg-diamond" />

        {/* Flip wrapper — restores 3D card flip */}
        <div className={`auth-flip-wrapper${isRegister ? " is-flipped" : ""}`}>
          <div className="auth-flip-box">

            {/* ── SIGN IN side ── */}
            <form className="auth-modern-card auth-login-side" onSubmit={handleLogin}>
              <div className="auth-tabs">
                <button type="button" className={!isRegister ? "active" : ""} onClick={() => setIsRegister(false)}>
                  Sign In
                </button>
                <button type="button" className={isRegister ? "active" : ""} onClick={() => setIsRegister(true)}>
                  Create Account
                </button>
              </div>

              <div className="auth-form-body">
                <div className="auth-card-heading">
                  <h2>Welcome back</h2>
                  <p>Sign in to manage your inventory</p>
                </div>

                <label htmlFor="si-email">Email Address</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon" aria-hidden="true">
                    <Mail size={16} strokeWidth={2} />
                  </span>
                  <input
                    id="si-email"
                    type="email"
                    placeholder="you@company.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>

                <label htmlFor="si-password">Password</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon" aria-hidden="true">
                    <Lock size={16} strokeWidth={2} />
                  </span>
                  <input
                    id="si-password"
                    type={showLoginPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="password-eye"
                    aria-label={showLoginPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                  >
                    {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <div className="auth-options">
                  <label>
                    <input type="checkbox" />
                    Remember me
                  </label>
                  <a href="/forgot-password">Forgot password?</a>
                </div>

                <Link className="auth-admin-link" to="/admin-login">
                  Admin login with email OTP
                </Link>

                <button className="auth-submit-btn" type="submit" disabled={loading}>
                  {loading ? "Please wait…" : "Sign In"}
                </button>
              </div>
            </form>

            {/* ── CREATE ACCOUNT side ── */}
            <form className="auth-modern-card auth-register-side" onSubmit={handleRegister}>
              <div className="auth-tabs">
                <button type="button" className={!isRegister ? "active" : ""} onClick={() => setIsRegister(false)}>
                  Sign In
                </button>
                <button type="button" className={isRegister ? "active" : ""} onClick={() => setIsRegister(true)}>
                  Create Account
                </button>
              </div>

              <div className="auth-form-body">
                <div className="auth-card-heading">
                  <h2>Create account</h2>
                  <p>Register to start managing your inventory</p>
                </div>

                <label htmlFor="reg-name">Full Name</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon" aria-hidden="true">
                    <User size={16} strokeWidth={2} />
                  </span>
                  <input
                    id="reg-name"
                    type="text"
                    placeholder="Enter your full name"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                  />
                </div>

                <label htmlFor="reg-email">Email Address</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon" aria-hidden="true">
                    <Mail size={16} strokeWidth={2} />
                  </span>
                  <input
                    id="reg-email"
                    type="email"
                    placeholder="you@company.com"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    required
                  />
                </div>

                <label htmlFor="reg-password">Password</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon" aria-hidden="true">
                    <Lock size={16} strokeWidth={2} />
                  </span>
                  <input
                    id="reg-password"
                    type={showRegisterPassword ? "text" : "password"}
                    placeholder="Create your password"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="password-eye"
                    aria-label={showRegisterPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                  >
                    {showRegisterPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <button className="auth-submit-btn" type="submit" disabled={loading}>
                  {loading ? "Please wait…" : "Create Account"}
                </button>

                <p className="register-note">
                  Already have an account?{" "}
                  <button type="button" onClick={() => setIsRegister(false)}>
                    Sign in here
                  </button>
                </p>
              </div>
            </form>

          </div>
        </div>

        <p className="auth-footer">© 2026 StockFlow. All rights reserved.</p>
      </section>

    </main>
  );
};

export default Login;
