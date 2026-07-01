import { useState } from "react";
import { Mail, AlertCircle } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { useAsync } from "../hooks/useAsync";
import { fetchAdminAlerts } from "../lib/adminApi";
import { formatKES } from "../lib/format";

export default function AdminAlerts() {
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data, loading, error } = useAsync(fetchAdminAlerts);

  const alerts = data?.alerts || [];
  const summary = data?.summary || {};

  return (
    <div className="flex min-h-screen bg-bg-deep">
      <Sidebar variant="admin" open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 min-w-0">
        <Topbar search={search} onSearchChange={setSearch} placeholder="Search overdue loans…" roleLabel="Enterprise Admin" onMenuClick={() => setSidebarOpen(true)} />

        <main className="max-w-[1180px] mx-auto px-4 sm:px-7 py-6 sm:py-8">
          <div className="flex items-center justify-between mb-7 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-danger animate-pulse" />
              <h1 className="text-xl sm:text-2xl font-extrabold text-text-primary">Overdue Loan Alerts</h1>
              <span className="px-3 py-1 rounded-full bg-danger/15 text-danger text-xs font-bold uppercase">
                {alerts.length} Critical
              </span>
            </div>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-br from-emerald to-emerald-dark text-white text-sm font-bold shadow-glow">
              <Mail size={15} /> Send Bulk Reminders
            </button>
          </div>

          {error && (
            <div className="bg-danger/10 border border-danger/25 text-danger text-sm rounded-lg px-4 py-3 mb-6">
              {error} — make sure the backend API is running.
            </div>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-bg-panel border border-border border-l-[3px] border-l-danger rounded-card p-5">
              <div className="text-[11px] font-bold uppercase tracking-wide text-text-muted mb-2">Total Overdue</div>
              <div className="text-2xl font-extrabold text-danger">{formatKES(summary.totalOverdue)}</div>
            </div>
            <div className="bg-bg-panel border border-border border-l-[3px] border-l-sky rounded-card p-5">
              <div className="text-[11px] font-bold uppercase tracking-wide text-text-muted mb-2">Average Delay</div>
              <div className="text-2xl font-extrabold text-sky">{summary.avgDelayDays ?? 0} Days</div>
            </div>
            <div className="bg-bg-panel border border-border border-l-[3px] border-l-emerald rounded-card p-5">
              <div className="text-[11px] font-bold uppercase tracking-wide text-text-muted mb-2">Recovery Rate</div>
              <div className="text-2xl font-extrabold text-emerald">{summary.recoveryRate ?? 0}%</div>
            </div>
            <div className="bg-bg-panel border border-border border-l-[3px] border-l-purple-light rounded-card p-5">
              <div className="text-[11px] font-bold uppercase tracking-wide text-text-muted mb-2">Action Items</div>
              <div className="text-2xl font-extrabold text-purple-light">{alerts.length} Pending</div>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-text-muted text-sm">Loading alerts…</div>
          ) : alerts.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-4xl mb-3">✅</div>
              <div className="font-bold text-text-primary">No overdue loans. All clear!</div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {alerts.map((a) => (
                <div key={a.id} className="bg-bg-panel border border-danger/30 border-l-4 border-l-danger rounded-card px-6 py-4 flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-bg-raised flex items-center justify-center">
                      <AlertCircle size={18} className="text-danger" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded bg-purple/15 text-purple-light text-[10px] font-bold uppercase">
                          {a.shopName}
                        </span>
                        <span className="text-[11px] text-text-muted">Due {a.dueDate} ({a.daysLate} days late)</span>
                      </div>
                      <div className="font-bold text-text-primary text-sm">{a.borrowerName}</div>
                      <div className="text-xs text-text-muted">{a.phone}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-extrabold text-danger">{formatKES(a.amount)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}