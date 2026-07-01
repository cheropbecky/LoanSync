import { useState } from "react";
import { Download } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { useAsync } from "../hooks/useAsync";
import { fetchAdminShops } from "../lib/adminApi";
import { formatKES } from "../lib/format";

function downloadCSV(shops) {
  const headers = ["Shop", "Location", "Total Loaned", "Outstanding", "Recovered", "Overdue Count", "Loan Count"];
  const rows = shops.map((s) => [
    s.name, s.location || "", s.total, s.outstanding, s.recovered, s.overdueCount, s.loanCount,
  ]);
  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `loansync-report-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminReports() {
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data, loading, error } = useAsync(fetchAdminShops);
  const shops = data || [];

  const totalPortfolio = shops.reduce((s, sh) => s + sh.total, 0);
  const totalOutstanding = shops.reduce((s, sh) => s + sh.outstanding, 0);
  const totalRecovered = shops.reduce((s, sh) => s + sh.recovered, 0);

  return (
    <div className="flex min-h-screen bg-bg-deep">
      <Sidebar variant="admin" open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 min-w-0">
        <Topbar search={search} onSearchChange={setSearch} placeholder="Search reports…" roleLabel="Enterprise Admin" onMenuClick={() => setSidebarOpen(true)} />

        <main className="max-w-[1180px] mx-auto px-5 sm:px-7 py-6 sm:py-8">
          <div className="flex items-start justify-between mb-7 flex-wrap gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-text-primary">Reports</h1>
              <p className="text-text-muted text-sm mt-1">
                Portfolio breakdown across all registered shops.
              </p>
            </div>
            <button
              onClick={() => downloadCSV(shops)}
              disabled={shops.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-br from-emerald to-emerald-dark text-white text-sm font-bold shadow-glow disabled:opacity-50"
            >
              <Download size={15} /> Export CSV
            </button>
          </div>

          {error && (
            <div className="bg-danger/10 border border-danger/25 text-danger text-sm rounded-lg px-4 py-3 mb-6">
              {error} — make sure the backend API is running.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-bg-panel border border-border rounded-card p-5">
              <div className="text-[11px] font-bold uppercase tracking-wide text-text-muted mb-2">Total Portfolio</div>
              <div className="text-2xl font-extrabold text-emerald">{formatKES(totalPortfolio)}</div>
            </div>
            <div className="bg-bg-panel border border-border rounded-card p-5">
              <div className="text-[11px] font-bold uppercase tracking-wide text-text-muted mb-2">Outstanding</div>
              <div className="text-2xl font-extrabold text-amber">{formatKES(totalOutstanding)}</div>
            </div>
            <div className="bg-bg-panel border border-border rounded-card p-5">
              <div className="text-[11px] font-bold uppercase tracking-wide text-text-muted mb-2">Recovered</div>
              <div className="text-2xl font-extrabold text-sky">{formatKES(totalRecovered)}</div>
            </div>
          </div>

          <div className="bg-bg-panel border border-border rounded-card overflow-x-auto">
            {loading ? (
              <div className="py-16 text-center text-text-muted text-sm">Loading report…</div>
            ) : shops.length === 0 ? (
              <div className="py-16 text-center text-text-muted text-sm">No shop data to report yet.</div>
            ) : (
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="text-[10px] font-bold uppercase tracking-wider text-text-muted border-b border-border">
                    <th className="text-left px-6 py-3">Shop</th>
                    <th className="text-left px-6 py-3">Location</th>
                    <th className="text-right px-6 py-3">Total Loaned</th>
                    <th className="text-right px-6 py-3">Outstanding</th>
                    <th className="text-right px-6 py-3">Recovered</th>
                    <th className="text-right px-6 py-3">Overdue</th>
                  </tr>
                </thead>
                <tbody>
                  {shops
                    .filter((s) => !search || s.name.toLowerCase().includes(search.toLowerCase()))
                    .map((s) => (
                      <tr key={s.id} className="border-b border-border last:border-0">
                        <td className="px-6 py-3.5 font-semibold text-text-primary">{s.name}</td>
                        <td className="px-6 py-3.5 text-text-muted">{s.location || "—"}</td>
                        <td className="px-6 py-3.5 text-right font-bold text-emerald">{formatKES(s.total)}</td>
                        <td className="px-6 py-3.5 text-right text-amber">{formatKES(s.outstanding)}</td>
                        <td className="px-6 py-3.5 text-right text-sky">{formatKES(s.recovered)}</td>
                        <td className="px-6 py-3.5 text-right text-danger">{s.overdueCount}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}