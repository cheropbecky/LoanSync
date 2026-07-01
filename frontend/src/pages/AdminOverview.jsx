import { useState } from "react";
import { Link } from "react-router-dom";
import { Download, Plus, ChevronRight, AlertTriangle } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import StatCard from "../components/StatCard";
import RegisterShopModal from "../components/RegisterShopModal";
import { useAsync } from "../hooks/useAsync";
import { fetchAdminOverview, registerShop } from "../lib/adminApi";
import { formatCompactKES } from "../lib/format";

export default function AdminOverview() {
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const { data, loading, error, refetch } = useAsync(fetchAdminOverview);

  async function handleRegister(form) {
    await registerShop(form);
    refetch();
  }

  const overview = data?.totals || {};
  const shops = data?.ranking || [];

  return (
    <div className="flex min-h-screen bg-bg-deep">
      <Sidebar variant="admin" open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 min-w-0">
        <Topbar search={search} onSearchChange={setSearch} placeholder="Search accounts…" roleLabel="Enterprise Admin" onMenuClick={() => setSidebarOpen(true)} />

        <main className="max-w-[1180px] mx-auto px-4 sm:px-7 py-6 sm:py-8">
          <div className="flex items-start justify-between mb-7 flex-wrap gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-text-primary">Admin Overview</h1>
              <p className="text-text-muted text-sm mt-1">
                Monitoring <span className="text-emerald font-bold">{overview.activeShops ?? "–"} active shops</span> and{" "}
                <span className="text-emerald font-bold">{overview.loanCount ?? "–"} loan records</span>
              </p>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-text-muted text-sm font-bold hover:text-text-primary transition-colors">
                <Download size={15} /> Export Report
              </button>
              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-br from-emerald to-emerald-dark text-white text-sm font-bold shadow-glow"
              >
                <Plus size={15} /> New Shop
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-danger/10 border border-danger/25 text-danger text-sm rounded-lg px-4 py-3 mb-6">
              {error} — make sure the backend API is running.
            </div>
          )}

          {/* Global stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            <StatCard icon="total" label="Total Portfolio" value={formatCompactKES(overview.totalPortfolio)} sub="+12.4% this month" accent="emerald" />
            <StatCard icon="outstanding" label="Outstanding" value={formatCompactKES(overview.outstanding)} sub="Pending collection" accent="amber" />
            <StatCard icon="recovered" label="Total Recovered" value={formatCompactKES(overview.recovered)} sub={`${overview.recoveryRate ?? 0}% recovery rate`} accent="sky" />
            <StatCard icon="overdue" label="Overdue Loans" value={formatCompactKES(overview.overdueAmount)} sub="Critical attention" accent="danger" />
            <StatCard icon="total" label="Active Shops" value={overview.activeShops ?? "–"} sub="Network-wide" accent="emerald" />
          </div>

          {/* Tabs */}
          <div className="flex gap-6 border-b border-border mb-6">
            <Link to="/admin" className="pb-3 text-sm font-bold text-emerald border-b-2 border-emerald uppercase tracking-wide">Overview</Link>
            <Link to="/admin/shops" className="pb-3 text-sm font-bold text-text-muted uppercase tracking-wide hover:text-text-primary">Shops</Link>
            <Link to="/admin/alerts" className="pb-3 text-sm font-bold text-text-muted uppercase tracking-wide hover:text-text-primary flex items-center gap-1.5">
              Alerts
              {overview.overdueCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-danger" />}
            </Link>
          </div>

          <h2 className="text-sm font-bold uppercase tracking-wide text-text-primary mb-4">Shop Performance Ranking</h2>

          {loading ? (
            <div className="py-16 text-center text-text-muted text-sm">Loading shop rankings…</div>
          ) : shops.length === 0 ? (
            <div className="py-16 text-center text-text-muted text-sm">No shops registered yet.</div>
          ) : (
            <div className="flex flex-col gap-3">
              {shops.map((shop, i) => {
                const pct = overview.totalPortfolio > 0 ? (shop.total / overview.totalPortfolio) * 100 : 0;
                const rankBg =
                  i === 0 ? "bg-gradient-to-br from-amber to-amber/70 text-bg-deep"
                  : i === 1 ? "bg-bg-raised text-text-primary"
                  : "bg-bg-raised text-text-muted";
                return (
                  <Link
                    to={`/admin/shops/${shop.id}`}
                    key={shop.id}
                    className="bg-bg-panel border border-border hover:border-emerald rounded-card px-4 sm:px-6 py-4 sm:py-5 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-5 transition-colors group"
                  >
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${rankBg}`}>
                        #{i + 1}
                      </div>
                      <div className="min-w-0 sm:min-w-[180px]">
                        <div className="font-bold text-text-primary text-sm">{shop.name}</div>
                        <div className="text-xs text-text-muted">{shop.location || "—"}</div>
                      </div>
                    </div>
                    <div className="flex-1 w-full">
                      <div className="flex justify-between text-[11px] font-bold uppercase tracking-wide text-text-muted mb-1.5">
                        <span>Portfolio Share</span>
                        <span className="text-emerald">{formatCompactKES(shop.total)} ({pct.toFixed(1)}%)</span>
                      </div>
                      <div className="h-1.5 bg-bg-raised rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-emerald to-emerald-dark rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex flex-wrap gap-3 sm:gap-5 mt-2.5 text-[11px]">
                        <span className="text-text-muted">Outstanding: <b className="text-amber">{formatCompactKES(shop.outstanding)}</b></span>
                        <span className="text-text-muted">Recovered: <b className="text-sky">{formatCompactKES(shop.recovered)}</b></span>
                        <span className="text-text-muted">Overdue: <b className="text-danger">{shop.overdueCount}</b></span>
                      </div>
                    </div>
                    <ChevronRight size={18} className="hidden sm:block text-text-muted group-hover:text-emerald shrink-0" />
                  </Link>
                );
              })}
            </div>
          )}
        </main>
      </div>

      <RegisterShopModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={handleRegister} />
    </div>
  );
}