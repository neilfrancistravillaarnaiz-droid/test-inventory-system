import { useState } from "react";
import { Fingerprint, AlertCircle, CheckCircle, Loader } from "lucide-react";
import { registerFingerprint, isWebauthnSupported } from "../../services/webauthnService";

type FingerprintRegistrationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  email: string;
  onSuccess?: () => void;
};

const FingerprintRegistrationModal = ({
  isOpen,
  onClose,
  userId,
  email,
  onSuccess,
}: FingerprintRegistrationModalProps) => {
  // Simple Modal wrapper
  const Modal = ({ isOpen, onClose, title, children }: any) =>
    !isOpen ? null : (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-xl font-bold">{title}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
          </div>
          <div className="p-6">{children}</div>
        </div>
      </div>
    );

  // Simple Button wrapper
  const Button = ({ children, onClick, type = "button", disabled = false, variant = "primary", className = "" }: any) => (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-lg font-medium transition ${variant === "secondary" ? "bg-gray-200 text-gray-800" : "bg-blue-600 text-white"} ${className} ${disabled ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"}`}
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
  const [success, setSuccess] = useState(false);
  const [credentialName, setCredentialName] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const supported = isWebauthnSupported();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!credentialName.trim()) {
      setError("Please enter a device name");
      return;
    }

    setLoading(true);
    setError(null);

    const result = await registerFingerprint(userId, email, credentialName.trim());

    setLoading(false);

    if (result.success) {
      setSuccess(true);
      setToastMessage(result.message || "Fingerprint registered successfully!");
      setToastType("success");
      setShowToast(true);

      setTimeout(() => {
        onSuccess?.();
        setSuccess(false);
        setCredentialName("");
        onClose();
      }, 2000);
    } else {
      setError(result.error || "Failed to register fingerprint");
      setToastMessage(result.error || "Registration failed");
      setToastType("error");
      setShowToast(true);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Register Fingerprint">
        <div className="space-y-4">
          {!supported ? (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="font-medium text-red-900">Not Supported</p>
                <p className="text-sm text-red-700">
                  WebAuthn is not supported on this browser. Please use a modern browser with biometric support.
                </p>
              </div>
            </div>
          ) : success ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <CheckCircle className="w-12 h-12 text-green-600" />
              <p className="text-lg font-medium text-green-600">
                Fingerprint Registered Successfully!
              </p>
              <p className="text-sm text-gray-600">
                You can now sign in with your fingerprint.
              </p>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <Fingerprint className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium">Place your finger on the scanner</p>
                  <p className="text-xs mt-1">
                    You'll be prompted to scan your fingerprint to verify your identity.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Device Name (optional)
                </label>
                <input
                  type="text"
                  value={credentialName}
                  onChange={(e) => setCredentialName(e.target.value)}
                  placeholder="e.g., My Laptop, Office Desktop"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  This helps you identify which device this fingerprint is registered on.
                </p>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button
                  variant="secondary"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !supported}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    <>
                      <Fingerprint className="w-4 h-4" />
                      Register Fingerprint
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </Modal>

      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}
    </>
  );
};

export default FingerprintRegistrationModal;
