type ModalType = "success" | "warning";

type SuccessModalProps = {
  show: boolean;
  title: string;
  message: string;
  type?: ModalType;
  confirmText?: string;
  cancelText?: string;
  onClose: () => void;
  onConfirm?: () => void;
};

const SuccessModal = ({
  show,
  title,
  message,
  type = "success",
  confirmText = "Okay",
  cancelText,
  onClose,
  onConfirm,
}: SuccessModalProps) => {
  if (!show) return null;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
      return;
    }

    onClose();
  };

  return (
    <div className="success-modal-overlay">
      <div className="success-modal">
        <div className={`success-icon ${type}`}>
          {type === "warning" ? "!" : "✓"}
        </div>

        <h2>{title}</h2>
        <p>{message}</p>

        <div className="modal-actions">
          {cancelText && (
            <button className="modal-cancel-btn" onClick={onClose}>
              {cancelText}
            </button>
          )}

          <button
            className={type === "warning" ? "modal-danger-btn" : "modal-ok-btn"}
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;