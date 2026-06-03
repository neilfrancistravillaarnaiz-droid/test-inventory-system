import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, register } from "../../services/authService";

type LoginProps = {
  defaultRegister?: boolean;
};

const Login = ({ defaultRegister = false }: LoginProps) => {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(defaultRegister);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");

  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  const [loading, setLoading] = useState(false);

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

    alert("Account created successfully. You can now login.");
    setIsRegister(false);
  };

  return (
    <main className="auth-layout">
      <div className={`auth-flip-card ${isRegister ? "flipped" : ""}`}>
        <div className="auth-flip-inner">
          <form className="auth-card auth-front" onSubmit={handleLogin}>
            <h1>Welcome Back</h1>
            <p>Sign in to continue managing your inventory.</p>

            <input
              type="email"
              placeholder="Email address"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              required
            />

            <div className="password-row">
              <input
                type={showLoginPassword ? "text" : "password"}
                placeholder="Password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />

              <span
                className="eye-toggle"
                onClick={() => setShowLoginPassword((prev) => !prev)}
                role="button"
                tabIndex={0}
              >
                {showLoginPassword ? "🙈" : "👁️"}
              </span>
            </div>

            <button className="auth-btn" type="submit" disabled={loading}>
              {loading ? "Please wait..." : "Login"}
            </button>

            <small>
              Forgot password? <a href="/forgot-password">Reset</a>
            </small>

            <small>
              No account?{" "}
              <button type="button" onClick={() => setIsRegister(true)}>
                Create one
              </button>
            </small>
          </form>

          <form className="auth-card auth-back" onSubmit={handleRegister}>
            <h1>Create Account</h1>
            <p>Register to start using StockFlow.</p>

            <input
              type="email"
              placeholder="Email address"
              value={registerEmail}
              onChange={(e) => setRegisterEmail(e.target.value)}
              required
            />

            <div className="password-row">
              <input
                type={showRegisterPassword ? "text" : "password"}
                placeholder="Password"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                required
              />

              <span
                className="eye-toggle"
                onClick={() => setShowRegisterPassword((prev) => !prev)}
                role="button"
                tabIndex={0}
              >
                {showRegisterPassword ? "🙈" : "👁️"}
              </span>
            </div>

            <button className="auth-btn" type="submit" disabled={loading}>
              {loading ? "Please wait..." : "Register"}
            </button>

            <small>
              Already have an account?{" "}
              <button type="button" onClick={() => setIsRegister(false)}>
                Login
              </button>
            </small>
          </form>
        </div>
      </div>
    </main>
  );
};

export default Login;