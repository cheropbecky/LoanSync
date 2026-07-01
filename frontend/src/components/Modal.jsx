import { X } from "lucide-react";

export default function Modal({ open, onClose, title, children, maxWidth = "max-w-[480px]" }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-5 bg-black/70 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className={`w-full ${maxWidth} bg-bg-panel border border-border rounded-card shadow-modal max-h-[90vh] overflow-y-auto`}
      >
        <div className="flex items-center justify-between px-7 py-5 border-b border-border">
          <h3 className="text-[17px] font-extrabold text-text-primary m-0">{title}</h3>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-7">{children}</div>
      </div>
    </div>
  );
}