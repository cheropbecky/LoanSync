// Renders one of the 4 metric cards at the top of a dashboard
// (Total Loaned, Outstanding, Recovered, Overdue) matching the Stitch design.
import { ArrowUpRight, Clock, ShieldCheck, AlertTriangle } from "lucide-react";

const ICONS = {
  total: ArrowUpRight,
  outstanding: Clock,
  recovered: ShieldCheck,
  overdue: AlertTriangle,
};

const ACCENTS = {
  emerald: { text: "text-emerald", border: "border-l-emerald" },
  amber: { text: "text-amber", border: "border-l-amber" },
  sky: { text: "text-sky", border: "border-l-sky" },
  danger: { text: "text-danger", border: "border-l-danger" },
};

export default function StatCard({ icon = "total", label, value, sub, accent = "emerald" }) {
  const Icon = ICONS[icon] || ArrowUpRight;
  const a = ACCENTS[accent] || ACCENTS.emerald;

  return (
    <div className={`bg-bg-panel border border-border ${a.border} border-l-[3px] rounded-card p-5`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={16} className={a.text} />
        <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
          {label}
        </span>
      </div>
      <div className={`text-2xl font-extrabold ${a.text} leading-none`}>{value}</div>
      {sub && <div className="text-xs text-text-muted mt-2">{sub}</div>}
    </div>
  );
}