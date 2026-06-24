import { useEffect, useState } from "react";
import {
  Bell,
  Bot,
  Eye,
  EyeOff,
  Fingerprint,
  KeyRound,
  Lock,
  Mail,
  MapPin,
  ScanLine,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import FingerprintLogin from "../../components/auth/FingerprintLogin";
import {
  getProfileForAuthUser,
  login,
  markAdminOtpVerified,
  requestAdminEmailOtp,
  verifyAdminEmailOtp,
} from "../../services/authService";
import { supabase } from "../../lib/supabaseClient";

const PENDING_ADMIN_EMAIL_KEY = "stockflow-pending-admin-email";

const getAuthErrorMessage = (error: unknown, fallback: string) => {
  if (!error) return fallback;

  if (typeof error === "string") {
    return error === "{}" ? fallback : error;
  }

  if (typeof error === "object") {
    const maybeError = error as {
      message?: string;
      error_description?: string;
      code?: string;
      name?: string;
      status?: number;
    };

    if (maybeError.message && maybeError.message !== "{}") {
      return maybeError.message;
    }

    if (maybeError.error_description) {
      return maybeError.error_description;
    }

    if (maybeError.status === 400) {
      return "Invalid email, password, or OTP. Please check your credentials and try again.";
    }

    const details = [
      maybeError.name,
      maybeError.code,
      maybeError.status ? `status ${maybeError.status}` : "",
    ].filter(Boolean);

    if (details.length > 0) {
      return `${fallback} (${details.join(", ")})`;
    }
  }

  return fallback;
};

const AdminLogin = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<"password" | "sendOtp" | "otp">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [showFingerprintLogin, setShowFingerprintLogin] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"success" | "error">("error");
  const [modalMessage, setModalMessage] = useState("");

  const features = [
    { icon: Bot, title: "AI Inventory Assistant", desc: "Smart inventory answers instantly." },
    { icon: TrendingUp, title: "Smart Restock Predictor", desc: "Forecast demand and restock smarter." },
    { icon: MapPin, title: "Product Location Mapping", desc: "Track product locations instantly." },
    { icon: Bell, title: "Real-Time Notifications", desc: "Instant low-stock notifications." },
    { icon: ScanLine, title: "Barcode & QR Scanning", desc: "Scan barcodes and QR codes fast." },
    { icon: ShieldCheck, title: "Audit Trail Monitoring", desc: "Monitor actions with audit logs." },
  ];

  useEffect(() => {
    const pendingEmail = sessionStorage.getItem(PENDING_ADMIN_EMAIL_KEY);
    if (pendingEmail) {
      setEmail(pendingEmail);
      setStep("sendOtp");
      setNotice("Admin password confirmed. Send an email OTP to continue.");
    }
  }, []);

  const normalizedEmail = email.trim().toLowerCase();

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

  const showModal = (type: "success" | "error", message: string) => {
    setModalType(type);
    setModalMessage(message);
    setModalOpen(true);
  };

  const handlePasswordStep = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNotice("");

    const { data, error } = await login(normalizedEmail, password);
    if (error || !data.user) {
      setLoading(false);
      showModal(
        "error",
        getAuthErrorMessage(
          error,
          "Admin login failed. Please check your email and password."
        )
      );
      return;
    }

    const { data: profile, error: profileError } = await getProfileForAuthUser(
      data.user.id,
      data.user.email
    );

    if (profileError || profile?.role !== "Admin") {
      await supabase.auth.signOut();
      setLoading(false);
      showModal(
        "error",
        profileError
          ? getAuthErrorMessage(
              profileError,
              "Could not verify your admin profile. Please check your profile role."
            )
          : "This portal is only for Admin accounts."
      );
      return;
    }

    await supabase.auth.signOut();
    setLoading(false);

    sessionStorage.setItem(PENDING_ADMIN_EMAIL_KEY, normalizedEmail);
    setStep("sendOtp");
    setNotice("Admin password confirmed. Send an email OTP to continue.");
  };

  const handleSendOtpStep = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNotice("");

    const targetEmail =
      sessionStorage.getItem(PENDING_ADMIN_EMAIL_KEY) || normalizedEmail;

    const otpResponse = await requestAdminEmailOtp(targetEmail);
    setLoading(false);

    if (otpResponse.error) {
      console.error("Admin OTP send failed:", otpResponse.error);
      showModal(
        "error",
        getAuthErrorMessage(
          otpResponse.error,
          "Could not send the email OTP. Please check Supabase SMTP, Email provider, and Magic Link/OTP template settings."
        )
      );
      return;
    }

    sessionStorage.setItem(PENDING_ADMIN_EMAIL_KEY, targetEmail);
    setStep("otp");
    setNotice("OTP sent. Check your email, then enter the code here.");
  };

  const handleOtpStep = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNotice("");

    const targetEmail =
      sessionStorage.getItem(PENDING_ADMIN_EMAIL_KEY) || normalizedEmail;

    const { data, error } = await verifyAdminEmailOtp(targetEmail, otp.trim());
    if (error || !data.user) {
      setLoading(false);
      showModal(
        "error",
        getAuthErrorMessage(
          error,
          "Invalid or expired OTP. Please request a new code and try again."
        )
      );
      return;
    }

    const { data: profile } = await getProfileForAuthUser(
      data.user.id,
      data.user.email || targetEmail
    );

    if (profile?.role !== "Admin") {
      await supabase.auth.signOut();
      setLoading(false);
      showModal("error", "This account is not allowed to use the Admin portal.");
      return;
    }

    markAdminOtpVerified();
    sessionStorage.removeItem(PENDING_ADMIN_EMAIL_KEY);
    setLoading(false);
    navigate("/dashboard");
  };

  const restartLogin = async () => {
    sessionStorage.removeItem(PENDING_ADMIN_EMAIL_KEY);
    await supabase.auth.signOut();
    setStep("password");
    setPassword("");
    setOtp("");
    setNotice("");
  };

  return (
    <main className="stock-auth-page auth-final-page admin-auth-page">
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
              <video src="/logo.mp4" autoPlay loop muted playsInline aria-label="CCD Inventory System logo" />
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

          <div className="auth-trust">
            <div className="trust-avatars">
              <span>A</span><span>B</span><span>C</span><span>D</span>
            </div>
            <strong>Admin</strong>
            <p>secured with email OTP</p>
          </div>
        </div>
      </section>

      <section className="stock-auth-right">
        <video className="auth-bg-video" src="/bg.mp4" autoPlay loop muted playsInline />

        <div className="right-bg-circle circle-a" />
        <div className="right-bg-circle circle-b" />
        <div className="right-bg-diamond" />

        <div className="auth-flip-wrapper admin-login-wrapper">
          <div className="auth-flip-box">
            <form
              className="auth-modern-card auth-login-side admin-auth-card"
              onSubmit={
                step === "password"
                  ? handlePasswordStep
                  : step === "sendOtp"
                    ? handleSendOtpStep
                    : handleOtpStep
              }
            >
              <div className="auth-tabs admin-only-tabs">
                <button type="button" className="active">
                  Admin Login
                </button>
              </div>

              <div className="auth-form-body">
                <div className="admin-lock-badge">
                  <ShieldCheck size={22} />
                </div>
                <div className="auth-card-heading">
                  <h2>
                    {step === "password"
                      ? "Admin security"
                      : step === "sendOtp"
                        ? "Email verification"
                        : "Email OTP"}
                  </h2>
                  <p>
                    {step === "password"
                      ? "Sign in with your admin password first."
                      : step === "sendOtp"
                        ? "Send a one-time code to your admin email."
                        : "Enter the one-time code sent to your email."}
                  </p>
                </div>

                {notice && <p className="auth-admin-notice">{notice}</p>}

                <label htmlFor="admin-email">Admin Email</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon" aria-hidden="true">
                    <Mail size={16} strokeWidth={2} />
                  </span>
                  <input
                    id="admin-email"
                    type="email"
                    placeholder="admin@ccd.edu.ph"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={step !== "password"}
                    required
                  />
                </div>

                {step === "password" && (
                  <>
                    <label htmlFor="admin-password">Password</label>
                    <div className="auth-input-wrap">
                      <span className="auth-input-icon" aria-hidden="true">
                        <Lock size={16} strokeWidth={2} />
                      </span>
                      <input
                        id="admin-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter admin password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="password-eye"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </>
                )}

                {step === "otp" && (
                  <>
                    <label htmlFor="admin-otp">Email OTP</label>
                    <div className="auth-input-wrap admin-otp-code">
                      <span className="auth-input-icon" aria-hidden="true">
                        <KeyRound size={16} strokeWidth={2} />
                      </span>
                      <input
                        id="admin-otp"
                        type="text"
                        inputMode="numeric"
                        placeholder="000000"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                      />
                    </div>
                  </>
                )}

                <button className="auth-submit-btn" type="submit" disabled={loading}>
                  {loading
                    ? "Verifying..."
                    : step === "password"
                      ? "Login"
                      : step === "sendOtp"
                        ? "Send Email OTP"
                        : "Verify and Enter"}
                </button>

                {step === "otp" && !showFingerprintLogin && (
                  <>
                    <div className="auth-divider">
                      <span>or</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowFingerprintLogin(true)}
                      className="auth-fingerprint-btn"
                    >
                      <Fingerprint size={18} strokeWidth={2} />
                      <span>Sign in with Fingerprint</span>
                    </button>
                  </>
                )}

                {showFingerprintLogin && step === "otp" && (
                  <>
                    <div className="auth-fingerprint-section">
                      <FingerprintLogin
                        email={email}
                        onSuccess={() => {
                          navigate("/dashboard");
                        }}
                        onError={(error) => {
                          showModal("error", error);
                          setShowFingerprintLogin(false);
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowFingerprintLogin(false)}
                      className="auth-back-btn"
                    >
                      ← Back to OTP
                    </button>
                  </>
                )}

                {step !== "password" && !showFingerprintLogin && (
                  <button type="button" className="auth-secondary-btn" onClick={restartLogin}>
                    Use a different admin account
                  </button>
                )}
              </div>
            </form>

            <div className="auth-modern-card auth-register-side admin-placeholder-side" aria-hidden="true">
              <button type="button">Create Account</button>
            </div>
          </div>
        </div>

        <p className="auth-footer">© 2026 StockFlow. All rights reserved.</p>
      </section>

      {/* Alert Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`bg-white rounded-lg shadow-lg p-6 max-w-sm w-full mx-4 ${
            modalType === "error" ? "border-l-4 border-red-500" : "border-l-4 border-green-500"
          }`}>
            <div className="flex items-start gap-4">
              <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                modalType === "error" ? "bg-red-100" : "bg-green-100"
              }`}>
                <span className={`text-sm font-bold ${
                  modalType === "error" ? "text-red-600" : "text-green-600"
                }`}>
                  {modalType === "error" ? "!" : "✓"}
                </span>
              </div>
              <div className="flex-1">
                <h3 className={`font-semibold mb-1 ${
                  modalType === "error" ? "text-red-900" : "text-green-900"
                }`}>
                  {modalType === "error" ? "Error" : "Success"}
                </h3>
                <p className={`text-sm ${
                  modalType === "error" ? "text-red-700" : "text-green-700"
                }`}>
                  {modalMessage}
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setModalOpen(false)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  modalType === "error"
                    ? "bg-red-100 text-red-700 hover:bg-red-200"
                    : "bg-green-100 text-green-700 hover:bg-green-200"
                }`}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default AdminLogin;
