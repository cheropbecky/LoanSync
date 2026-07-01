export default function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}) {
  const base =
    "inline-flex items-center justify-center gap-2 font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2.5 text-sm",
    lg: "px-5 py-3 text-[15px]",
  };

  const variants = {
    primary:
      "bg-gradient-to-br from-emerald to-emerald-dark text-white shadow-glow hover:brightness-110",
    secondary: "bg-bg-raised border border-border text-text-muted hover:text-text-primary",
    danger: "bg-danger/10 border border-danger/25 text-danger hover:bg-danger/20",
    ghost: "bg-transparent text-text-muted hover:text-text-primary",
    success: "bg-emerald/10 border border-emerald/25 text-emerald hover:bg-emerald/20",
  };

  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}