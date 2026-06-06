import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { login, register } from "../../services/authService";

type LoginProps = {
  defaultRegister?: boolean;
};

const Login = ({ defaultRegister = false }: LoginProps) => {
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(defaultRegister);
  const [loading, setLoading] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");

  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  const titleText = "CCD StockFlow Inventory System";

  const renderTitleLetters = () =>
    titleText.split("").map((char, index) => (
      <span
        key={`${char}-${index}`}
        className={char === " " ? "brand-title-space" : "brand-title-letter"}
      >
        {char}
      </span>
    ));

  const features = [
    {
      icon: "🤖",
      title: "AI Inventory Assistant",
      desc: "Smart inventory answers instantly.",
    },
    {
      icon: "📊",
      title: "Smart Restock Predictor",
      desc: "Forecast demand and restock smarter.",
    },
    {
      icon: "📍",
      title: "Product Location Mapping",
      desc: "Track product locations instantly.",
    },
    {
      icon: "🔔",
      title: "Real-Time Notifications",
      desc: "Instant low-stock notifications.",
    },
    {
      icon: "📱",
      title: "Barcode & QR Scanning",
      desc: "Scan barcodes and QR codes fast.",
    },
    {
      icon: "🛡️",
      title: "Audit Trail Monitoring",
      desc: "Monitor actions with audit logs.",
    },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await login(loginEmail, loginPassword);

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    navigate("/dashboard");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await register(registerEmail, registerPassword);

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert(`Account created successfully${registerName ? `, ${registerName}` : ""}. You can now login.`);
    setIsRegister(false);
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

          <h1 className="brand-title">{renderTitleLetters()}</h1>

          <p>
            The intelligent inventory platform that helps you track, analyze,
            and optimize your stock across every warehouse and storefront.
          </p>
        </div>

        <div className="auth-feature-list">
          {features.map((feature) => (
            <div className="auth-feature" key={feature.title}>
              <div className="feature-icon">{feature.icon}</div>

              <div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="auth-trust">
          <div className="trust-avatars">
            <span>A</span>
            <span>B</span>
            <span>C</span>
            <span>D</span>
          </div>

          <strong>2,400+</strong>
          <p>businesses trust StockFlow</p>
        </div>
      </section>

      <section className="stock-auth-right">
        <div className="right-bg-circle circle-a"></div>
        <div className="right-bg-circle circle-b"></div>
        <div className="right-bg-diamond"></div>

        <div className={`auth-flip-wrapper ${isRegister ? "is-flipped" : ""}`}>
          <div className="auth-flip-box">
            <form className="auth-modern-card auth-login-side" onSubmit={handleLogin}>
              <div className="auth-tabs">
                <button
                  type="button"
                  className={!isRegister ? "active" : ""}
                  onClick={() => setIsRegister(false)}
                >
                  Sign In
                </button>

                <button
                  type="button"
                  className={isRegister ? "active" : ""}
                  onClick={() => setIsRegister(true)}
                >
                  Create Account
                </button>
              </div>

              <div className="auth-form-body">
                <label>Email Address</label>
                <div className="auth-input-wrap">
                  <span>✉</span>
                  <input
                    type="email"
                    placeholder="you@company.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>

                <label>Password</label>
                <div className="auth-input-wrap">
                  <span>🔒</span>
                  <input
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
                    {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <div className="auth-options">
                  <label>
                    <input type="checkbox" />
                    Remember me
                  </label>

                  <a href="/forgot-password">Forgot password?</a>
                </div>

                <button className="auth-submit-btn" type="submit" disabled={loading}>
                  {loading ? "Please wait..." : "Sign In"}
                </button>
              </div>
            </form>

            <form className="auth-modern-card auth-register-side" onSubmit={handleRegister}>
              <div className="auth-tabs">
                <button
                  type="button"
                  className={!isRegister ? "active" : ""}
                  onClick={() => setIsRegister(false)}
                >
                  Sign In
                </button>

                <button
                  type="button"
                  className={isRegister ? "active" : ""}
                  onClick={() => setIsRegister(true)}
                >
                  Create Account
                </button>
              </div>

              <div className="auth-form-body">
                <label>Full Name</label>
                <div className="auth-input-wrap">
                  <span>👤</span>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                  />
                </div>

                <label>Email Address</label>
                <div className="auth-input-wrap">
                  <span>✉</span>
                  <input
                    type="email"
                    placeholder="you@company.com"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    required
                  />
                </div>

                <label>Password</label>
                <div className="auth-input-wrap">
                  <span>🔒</span>
                  <input
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
                    {showRegisterPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <button className="auth-submit-btn" type="submit" disabled={loading}>
                  {loading ? "Please wait..." : "Create Account"}
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