import { useState } from "react";
import {
  AlertCircle,
  Bell,
  Bot,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  MapPin,
  ScanLine,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";

import {
  getProfileForAuthUser,
  login,
  markAdminOtpVerified,
  requestAdminEmailOtp,
  verifyAdminEmailOtp,
  getAdminTotpSetup,
  verifyAdminTotp,
} from "../../services/authService";
import { supabase } from "../../lib/supabaseClient";

const PENDING_ADMIN_EMAIL_KEY = "stockflow-pending-admin-email";
const PENDING_ADMIN_OTP_METHOD_KEY = "stockflow-pending-admin-otp-method";

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
  const pendingEmail = sessionStorage.getItem(PENDING_ADMIN_EMAIL_KEY) || "";
  const pendingOtpMethod = sessionStorage.getItem(PENDING_ADMIN_OTP_METHOD_KEY) as "email" | "totp" | null;
  const initialStep = pendingOtpMethod ? "otp" : pendingEmail ? "chooseOtp" : "password";

  const [step, setStep] = useState<"password" | "chooseOtp" | "setupTotp" | "otp">(
    initialStep as "password" | "chooseOtp" | "setupTotp" | "otp"
  );
  const [email, setEmail] = useState(pendingEmail);
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpMethod, setOtpMethod] = useState<"email" | "totp">("email");
  const [totpSetupUrl, setTotpSetupUrl] = useState("");
  const [totpSecret, setTotpSecret] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isMfaFlow, setIsMfaFlow] = useState(false);
  const [notice, setNotice] = useState(
    pendingOtpMethod === "email"
      ? "Admin password confirmed. Verify with email OTP."
      : pendingOtpMethod === "totp"
      ? "Admin password confirmed. Verify with your authenticator app."
      : ""
  );
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

  const showModal = (type: "success" | "error", message: string) => {
    setModalType(type);
    setModalMessage(message);
    setModalOpen(true);
  };

  const handlePasswordStep = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNotice("");

    const normalizedEmail = email.trim().toLowerCase();
    const { data, error } = await login(normalizedEmail, password);
    const authData = data as any;
    const mfaChallenge = authData?.mfa;

    if (error || (!data.user && !mfaChallenge)) {
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

    const profileResult = await getProfileForAuthUser(
      data.user?.id || "",
      data.user?.email || normalizedEmail
    );

    if (profileResult.error || profileResult.data?.role !== "Admin") {
      await supabase.auth.signOut();
      setLoading(false);
      showModal(
        "error",
        profileResult.error
          ? getAuthErrorMessage(
              profileResult.error,
              "Could not verify your admin profile. Please check your profile role."
            )
          : "This portal is only for Admin accounts."
      );
      return;
    }

    if (mfaChallenge) {
      setIsMfaFlow(true);
      setOtpMethod("totp");
      sessionStorage.setItem(PENDING_ADMIN_OTP_METHOD_KEY, "totp");
      setNotice("Admin password confirmed. Enter your authenticator code.");
      setStep("otp");
    } else {
      setIsMfaFlow(false);
      setNotice("Admin password confirmed. Choose how to verify.");
      setStep("chooseOtp");
    }

    setLoading(false);
    sessionStorage.setItem(PENDING_ADMIN_EMAIL_KEY, normalizedEmail);
  };

  const handleChooseOtpStep = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNotice("");

    const targetEmail =
      sessionStorage.getItem(PENDING_ADMIN_EMAIL_KEY) || email.trim().toLowerCase();

    if (otpMethod === "email") {
      const otpResponse = await requestAdminEmailOtp(targetEmail);
      setLoading(false);

      if (otpResponse.error) {
        console.error("Admin email OTP send failed:", otpResponse.error);
        showModal(
          "error",
          getAuthErrorMessage(
            otpResponse.error,
            "Could not send the email OTP. Please check Supabase If you want, I can also help make the QR-code setup screen more explicit for Google Authenticator., Email provider, and Magic Link/OTP template settings."
          )
        );
        return;
      }

      sessionStorage.setItem(PENDING_ADMIN_EMAIL_KEY, targetEmail);
      sessionStorage.setItem(PENDING_ADMIN_OTP_METHOD_KEY, "email");
      setStep("otp");
      setNotice("Email OTP sent. Check your email and enter the code here.");
    } else {
      const totpResponse = await getAdminTotpSetup(targetEmail);
      setLoading(false);

      if (!totpResponse?.success) {
        console.error("Admin TOTP setup failed:", totpResponse);
        showModal(
          "error",
          totpResponse?.message ||
            "Could not initialize authenticator setup. Please contact support."
        );
        return;
      }

      sessionStorage.setItem(PENDING_ADMIN_EMAIL_KEY, targetEmail);
      sessionStorage.setItem(PENDING_ADMIN_OTP_METHOD_KEY, "totp");
      setTotpSetupUrl(totpResponse.otpauthUrl || "");
      setTotpSecret(totpResponse.secret || "");
      const hasQr = Boolean(totpResponse.otpauthUrl);

      if (!hasQr) {
        setLoading(false);
        showModal(
          "error",
          totpResponse.message ||
            "Unable to generate the authenticator QR code. Please check your backend or contact support."
        );
        return;
      }

      setStep("setupTotp");
      setNotice("Scan the QR code with your authenticator app, then enter the code below.");
    }
  };

  const handleOtpStep = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNotice("");

    const otpMethodFromStorage = sessionStorage.getItem(PENDING_ADMIN_OTP_METHOD_KEY) as "email" | "totp" | null;
    const method = otpMethodFromStorage || otpMethod;

    try {
      const targetEmail =
        sessionStorage.getItem(PENDING_ADMIN_EMAIL_KEY) || email;

      let verifyResponse: any;

      if (method === "totp") {
        verifyResponse = await verifyAdminTotp(targetEmail, otp.trim());
      } else {
        verifyResponse = await verifyAdminEmailOtp(targetEmail, otp.trim());
      }

      if (verifyResponse?.error || verifyResponse?.success === false) {
        setLoading(false);
        showModal(
          "error",
          getAuthErrorMessage(
            verifyResponse.error || { message: verifyResponse?.message },
            verifyResponse?.message || "Invalid or expired code. Please try again."
          )
        );
        return;
      }

      if (method === "email") {
        const { data, error } = verifyResponse;

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
      } else {
        if (!verifyResponse?.success || !verifyResponse?.verified) {
          setLoading(false);
          showModal(
            "error",
            verifyResponse?.message || "Invalid authenticator code. Please try again."
          );
          return;
        }
      }

      markAdminOtpVerified();
      sessionStorage.removeItem(PENDING_ADMIN_EMAIL_KEY);
      sessionStorage.removeItem(PENDING_ADMIN_OTP_METHOD_KEY);
      setTotpSetupUrl("");
      setTotpSecret("");
      setLoading(false);
      navigate("/dashboard");
    } catch (err) {
      setLoading(false);
      showModal("error", "An error occurred during verification. Please try again.");
    }
  };

  const restartLogin = async () => {
    sessionStorage.removeItem(PENDING_ADMIN_EMAIL_KEY);
    sessionStorage.removeItem(PENDING_ADMIN_OTP_METHOD_KEY);
    await supabase.auth.signOut();
    setStep("password");
    setEmail("");
    setPassword("");
    setOtp("");
    setOtpMethod("email");
    setTotpSetupUrl("");
    setTotpSecret("");
    setIsMfaFlow(false);
    setNotice("");
  };

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

  return (
    <main className="stock-auth-page auth-final-page admin-auth-page">
      <section className="stock-auth-left">
        <video className="auth-bg-video" src="/bg.mp4" autoPlay loop muted playsInline />

        <div className="auth-stars">
          <span />
          <span />
          <span />
          <span />
          <span />
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
              <span>A</span>
              <span>B</span>
              <span>C</span>
              <span>D</span>
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

        <div className="admin-login-wrapper">
          <form
            className="auth-modern-card auth-login-side admin-auth-card"
            onSubmit={(e) => {
              e.preventDefault();
              if (step === "password") {
                handlePasswordStep(e);
              } else if (step === "chooseOtp") {
                handleChooseOtpStep(e);
              } else if (step === "otp" || step === "setupTotp") {
                handleOtpStep(e);
              }
            }}
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
                    : step === "chooseOtp"
                    ? "Choose verification method"
                    : step === "setupTotp"
                    ? "Setup Authenticator"
                    : otpMethod === "email"
                    ? "Email OTP"
                    : "Authenticator Code"}
                </h2>
                <p>
                  {step === "password"
                    ? "Sign in with your admin password first."
                    : step === "chooseOtp"
                    ? "Choose to verify with email OTP or TOTP authenticator."
                    : step === "setupTotp"
                    ? "Scan the QR code using your authenticator app, then enter the code."
                    : otpMethod === "email"
                    ? "Enter the one-time code sent to your email."
                    : "Enter the code from your authenticator app."}
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

              {step === "chooseOtp" && !isMfaFlow && (
                <>
                  <div className="auth-otp-method-selector">
                    <label className="auth-method-option">
                      <input
                        type="radio"
                        name="otpMethod"
                        value="email"
                        checked={otpMethod === "email"}
                        onChange={(e) => setOtpMethod(e.target.value as "email")}
                      />
                      <span className="auth-method-label">
                        <Mail size={16} strokeWidth={2} />
                        Email OTP
                      </span>
                    </label>
                    <label className="auth-method-option">
                      <input
                        type="radio"
                        name="otpMethod"
                        value="totp"
                        checked={otpMethod === "totp"}
                        onChange={(e) => setOtpMethod(e.target.value as "totp")}
                      />
                      <span className="auth-method-label">
                        <KeyRound size={16} strokeWidth={2} />
                        Authenticator
                      </span>
                    </label>
                  </div>
                </>
              )}

              {step === "setupTotp" && totpSetupUrl && (
                <div className="auth-totp-setup">
                  <label>Scan this QR code</label>
                  <div className="auth-qr-code">
                    <QRCodeCanvas value={totpSetupUrl} size={180} level="H" includeMargin={true} />
                  </div>
                  <p className="auth-totp-instructions">
                    Open Google Authenticator on your phone and tap the plus (+) button.
                    Select “Scan a QR code” and point your camera at the image above.
                    If scanning fails, choose “Enter a setup key” and type this secret manually:
                    <strong>{totpSecret}</strong>
                  </p>
                </div>
              )}

              {(step === "otp" || step === "setupTotp") && (
                <>
                  <label htmlFor="admin-otp">
                    {otpMethod === "email" ? "Email OTP" : "Authenticator Code"}
                  </label>
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
                  : step === "chooseOtp"
                  ? otpMethod === "email"
                    ? "Send Email OTP"
                    : "Set Up Authenticator"
                  : "Verify and Enter"}
              </button>

              <button type="button" className="auth-secondary-btn" onClick={restartLogin}>
                ← Back to start
              </button>
            </div>
          </form>
        </div>

        <p className="auth-footer">© 2026 StockFlow. All rights reserved.</p>
      </section>

      {modalOpen && (
        <div
          className="auth-status-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-auth-modal-title"
          onClick={() => setModalOpen(false)}
        >
          <div
            className={`auth-status-modal ${modalType}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="auth-status-modal-icon" aria-hidden="true">
              {modalType === "error" ? (
                <AlertCircle size={30} strokeWidth={2.4} />
              ) : (
                <CheckCircle2 size={30} strokeWidth={2.4} />
              )}
            </div>

            <div className="auth-status-modal-copy">
              <p className="auth-status-modal-kicker">
                {modalType === "error" ? "Admin Login" : "Admin Verified"}
              </p>
              <h2 id="admin-auth-modal-title">
                {modalType === "error" ? "Something needs attention" : "Success"}
              </h2>
              <p>{modalMessage}</p>
            </div>

            <div className="auth-status-modal-actions">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="auth-submit-btn"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default AdminLogin;
