import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../../services/authService";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

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
    <main className="auth-layout">
      <form className="auth-card forgot-card" onSubmit={handleForgotPassword}>
        <h1>Reset Password</h1>

        {sent ? (
          <>
            <p>Reset link sent. Please check your email.</p>
            <Link className="auth-link" to="/login">
              Back to Login
            </Link>
          </>
        ) : (
          <>
            <p>Enter your email to receive a password reset link.</p>

            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <button className="auth-btn" type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </button>

            <small>
              <Link to="/login">Back to Login</Link>
            </small>
          </>
        )}
      </form>
    </main>
  );
};

export default ForgotPassword;