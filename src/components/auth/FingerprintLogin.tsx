import { useState } from "react";
import { Fingerprint, AlertCircle, Loader } from "lucide-react";
import { authenticateWithFingerprint, isWebauthnSupported } from "../../services/webauthnService";

type FingerprintLoginProps = {
  email: string;
  password?: string;
  onSuccess: (user: any) => void;
  onError?: (error: string) => void;
};

const FingerprintLogin = ({
  email,
  password,
  onSuccess,
  onError,
}: FingerprintLoginProps) => {
  // Simple Button wrapper
  const Button = ({ children, onClick, disabled = false, className = "" }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full px-4 py-2 rounded-lg font-medium transition ${className} ${disabled ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"}`}
    >
      {children}
    </button>
  );

  // Simple Toast wrapper
  const Toast = ({ message, type, onClose }: any) => (
    <div className={`fixed bottom-4 right-4 p-4 rounded-lg text-white ${type === "success" ? "bg-green-600" : "bg-red-600"} z-50 flex items-center gap-2`}>
      {message}
      <button onClick={onClose} className="ml-4">✕</button>
    </div>
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const supported = isWebauthnSupported();

  const handleFingerprintLogin = async () => {
    if (!email) {
      setError("Please enter your email first");
      return;
    }

    setLoading(true);
    setError(null);

    // Step 1: Verify fingerprint
    const result = await authenticateWithFingerprint(email);

    setLoading(false);

    if (result.success) {
      // Step 2: If password provided, use it to sign in. Otherwise, fingerprint auth is enough
      if (password) {
        // Pass both fingerprint verification and password to parent
        onSuccess({ 
          user: result.user, 
          method: "fingerprint_with_password",
          email,
          password
        });
      } else {
        // Fingerprint only authentication
        onSuccess(result.user);
      }
    } else {
      const errorMessage = result.error || "Authentication failed";
      setError(errorMessage);
      onError?.(errorMessage);
    }
  };

  if (!supported) {
    return (
      <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <AlertCircle className="w-5 h-5 text-yellow-600" />
        <div className="text-sm text-yellow-700">
          <p className="font-medium">Fingerprint not supported</p>
          <p className="text-xs">Your browser doesn't support biometric authentication.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <Button
          onClick={handleFingerprintLogin}
          disabled={loading || !email}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          {loading ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Verifying Fingerprint...
            </>
          ) : (
            <>
              <Fingerprint className="w-4 h-4" />
              Sign in with Fingerprint
            </>
          )}
        </Button>

        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
      </div>
    </>
  );
};

export default FingerprintLogin;
