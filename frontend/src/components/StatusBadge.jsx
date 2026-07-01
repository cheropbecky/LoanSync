const STATUS_META = {
  active: { label: "Active", text: "text-amber", bg: "bg-amber/15" },
  paid: { label: "Paid", text: "text-sky", bg: "bg-sky/15" },
  overdue: { label: "Overdue", text: "text-danger", bg: "bg-danger/15" },
};

export default function StatusBadge({ status = "active" }) {
  const meta = STATUS_META[status] || STATUS_META.active;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide ${meta.bg} ${meta.text}`}
    >
      {meta.label}
    </span>
  );
}