import { useEffect, useState } from "react";
import { Fingerprint, Trash2, Plus, Loader, AlertCircle } from "lucide-react";
import { getUserCredentials, deleteCredential } from "../../services/webauthnService";

type CredentialsManagerProps = {
  userId: string;
  onAddNew?: () => void;
};

interface Credential {
  id: string;
  credential_id: string;
  credential_name: string;
  created_at: string;
}

const CredentialsManager = ({ userId, onAddNew }: CredentialsManagerProps) => {
  // Simple Button wrapper - with proper styling
  const Button = ({ children, onClick, className = "", disabled = false, variant = "primary" }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-6 py-3 rounded-full font-semibold transition flex items-center gap-2 ${
        disabled ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"
      } ${
        variant === "danger"
          ? "bg-red-600 text-white hover:bg-red-700"
          : "bg-green-600 text-white hover:bg-green-700"
      } ${className}`}
    >
      {children}
    </button>
  );

  // Simple ConfirmDialog wrapper
  const ConfirmDialog = ({ isOpen, title, message, confirmText, cancelText, onConfirm, onCancel, isDangerous }: any) =>
    !isOpen ? null : (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg max-w-sm w-full mx-4">
          <div className="p-6">
            <h2 className="text-lg font-bold mb-2">{title}</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="flex gap-3 justify-end">
              <button onClick={onCancel} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300">
                {cancelText}
              </button>
              <button onClick={onConfirm} className={`px-4 py-2 rounded-lg text-white ${isDangerous ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}`}>
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    );

  // Simple Toast wrapper
  const Toast = ({ message, type, onClose }: any) => (
    <div className={`fixed bottom-4 right-4 p-4 rounded-lg text-white ${type === "success" ? "bg-green-600" : "bg-red-600"} z-50 flex items-center gap-2`}>
      {message}
      <button onClick={onClose} className="ml-4">✕</button>
    </div>
  );
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  useEffect(() => {
    loadCredentials();
  }, [userId]);

  const loadCredentials = async () => {
    setLoading(true);
    const result = await getUserCredentials(userId);
    if (result.success) {
      setCredentials(result.credentials);
    }
    setLoading(false);
  };

  const handleDeleteClick = (credentialId: string) => {
    setConfirmingId(credentialId);
    setShowConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!confirmingId) return;

    setDeleting(confirmingId);
    const result = await deleteCredential(confirmingId);
    setDeleting(null);

    if (result.success) {
      setCredentials(credentials.filter((c) => c.id !== confirmingId));
      setToastMessage("Credential deleted successfully");
      setToastType("success");
      setShowToast(true);
    } else {
      setToastMessage(result.error || "Failed to delete credential");
      setToastType("error");
      setShowToast(true);
    }

    setShowConfirm(false);
    setConfirmingId(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className="w-6 h-6 animate-spin text-gray-600" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Fingerprint className="w-5 h-5 text-gray-700" />
            <h3 className="text-lg font-semibold text-gray-900">
              Registered Fingerprints
            </h3>
          </div>
          {onAddNew && (
            <Button
              onClick={onAddNew}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-5 h-5" />
              Add New
            </Button>
          )}
        </div>

        {credentials.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
            <Fingerprint className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">No fingerprints registered</p>
            <p className="text-sm text-gray-500 mt-1">
              Add your first fingerprint to enable biometric login.
            </p>
            {onAddNew && (
              <Button
                onClick={onAddNew}
                className="bg-green-600 hover:bg-green-700"
              >
                Register Fingerprint
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {credentials.map((credential) => (
              <div
                key={credential.id}
                className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-2 bg-purple-100 rounded-full">
                    <Fingerprint className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {credential.credential_name || "Unnamed Device"}
                    </p>
                    <p className="text-xs text-gray-500">
                      Registered {formatDate(credential.created_at)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteClick(credential.id)}
                  disabled={deleting === credential.id}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50 cursor-pointer"
                  title="Delete credential"
                >
                  {deleting === credential.id ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <Trash2 className="w-5 h-5" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg mt-4">
          <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-700">
            You can register multiple fingerprints on different devices for convenient access.
          </p>
        </div>
      </div>

      {showConfirm && (
        <ConfirmDialog
          isOpen={showConfirm}
          title="Delete Fingerprint"
          message="Are you sure you want to delete this fingerprint? You'll need to register it again to use fingerprint login."
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setShowConfirm(false);
            setConfirmingId(null);
          }}
          isDangerous
        />
      )}

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

export default CredentialsManager;
