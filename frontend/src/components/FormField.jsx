export function Field({ label, children, className = "" }) {
  return (
    <div className={className}>
      <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

const baseInputClass =
  "w-full px-3.5 py-2.5 bg-bg-input border border-border rounded-lg text-text-primary text-sm placeholder:text-text-muted/60 outline-none focus:border-emerald transition-colors";

export function Input({ icon, className = "", ...props }) {
  if (icon) {
    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">{icon}</span>
        <input className={`${baseInputClass} pl-10 ${className}`} {...props} />
      </div>
    );
  }
  return <input className={`${baseInputClass} ${className}`} {...props} />;
}

export function Select({ className = "", children, ...props }) {
  return (
    <select className={`${baseInputClass} appearance-none cursor-pointer ${className}`} {...props}>
      {children}
    </select>
  );
}

export function Textarea({ className = "", ...props }) {
  return <textarea className={`${baseInputClass} resize-none ${className}`} {...props} />;
}