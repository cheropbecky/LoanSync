import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Search,
  ArrowUpRight,
  CreditCard,
  CheckCircle,
  Filter,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { useAsync } from "../hooks/useAsync";
import { fetchAdminCustomers } from "../lib/adminApi";
import { formatKES } from "../lib/format";

const TIER_FILTERS = ["all", "excellent", "good", "moderate", "risk"];

export default function AdminCustomers() {
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: customers = [], loading, error, run: reload } = useAsync(fetchAdminCustomers);

  const filtered = (customers || []).filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      (c.shopNames || []).some((s) => s.toLowerCase().includes(q));

    let matchTier = true;
    if (tierFilter === "excellent") matchTier = c.credibility?.score >= 85;
    else if (tierFilter === "good") matchTier = c.credibility?.score >= 70 && c.credibility?.score < 85;
    else if (tierFilter === "moderate") matchTier = c.credibility?.score >= 50 && c.credibility?.score < 70;
    else if (tierFilter === "risk") matchTier = c.credibility?.score < 50;

    return matchSearch && matchTier;
  });

  // Global metrics
  const totalCustomers = customers.length;
  const highCreditCount = customers.filter((c) => c.credibility?.score >= 70).length;
  const restrictedCount = customers.filter((c) => c.credibility?.score < 50 || c.overdueCount > 0).length;
  const avgScore = totalCustomers > 0
    ? Math.round(customers.reduce((acc, c) => acc + (c.credibility?.score || 0), 0) / totalCustomers)
    : 0;

  return (
    <div className="flex min-h-screen bg-bg-deep">
      <Sidebar variant="admin" open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 min-w-0">
        <Topbar
          search={search}
          onSearchChange={setSearch}
          placeholder="Search borrowers by name, phone or shop…"
          roleLabel="Enterprise Admin"
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="max-w-[1200px] mx-auto px-4 sm:px-7 py-6 sm:py-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-6 sm:mb-7 flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl sm:text-2xl font-extrabold text-text-primary">
                  Borrower Credibility & Credit Ratings
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-purple/15 text-purple-light border border-purple/30 text-[11px] font-bold">
                  Automated Credit Scoring
                </span>
              </div>
              <p className="text-text-muted text-sm max-w-2xl">
                Track cross-shop payment history, evaluate repayment punctuality, and automate authorized credit limits.
                Borrowers with on-time settlements qualify for expanded credit ceilings.
              </p>
            </div>
            <button
              onClick={reload}
              className="px-4 py-2 rounded-lg bg-bg-raised hover:bg-bg-panel border border-border text-xs font-bold text-text-primary transition-colors"
            >
              Refresh Scores
            </button>
          </div>

          {error && (
            <div className="bg-danger/10 border border-danger/25 text-danger text-sm rounded-lg px-4 py-3 mb-6">
              {error} — ensure backend is running.
            </div>
          )}

          {/* Stats Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-7">
            <div className="bg-bg-panel border border-border border-l-4 border-l-purple-light rounded-card p-5">
              <div className="text-[11px] font-bold uppercase tracking-wide text-text-muted mb-1 flex items-center gap-1.5">
                <Users size={14} className="text-purple-light" /> Total Borrowers
              </div>
              <div className="text-2xl font-extrabold text-text-primary">{totalCustomers}</div>
              <div className="text-[11px] text-text-muted mt-1">Cross-shop client profiles</div>
            </div>

            <div className="bg-bg-panel border border-border border-l-4 border-l-emerald rounded-card p-5">
              <div className="text-[11px] font-bold uppercase tracking-wide text-text-muted mb-1 flex items-center gap-1.5">
                <TrendingUp size={14} className="text-emerald" /> High Credit Eligible
              </div>
              <div className="text-2xl font-extrabold text-emerald">{highCreditCount}</div>
              <div className="text-[11px] text-text-muted mt-1">Score ≥ 70 (Approved for growth)</div>
            </div>

            <div className="bg-bg-panel border border-border border-l-4 border-l-danger rounded-card p-5">
              <div className="text-[11px] font-bold uppercase tracking-wide text-text-muted mb-1 flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-danger" /> Credit Restricted
              </div>
              <div className="text-2xl font-extrabold text-danger">{restrictedCount}</div>
              <div className="text-[11px] text-text-muted mt-1">Overdue / High Risk (Limit: KES 0)</div>
            </div>

            <div className="bg-bg-panel border border-border border-l-4 border-l-sky rounded-card p-5">
              <div className="text-[11px] font-bold uppercase tracking-wide text-text-muted mb-1 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-sky" /> Avg Credibility Score
              </div>
              <div className="text-2xl font-extrabold text-sky">{avgScore} / 100</div>
              <div className="text-[11px] text-text-muted mt-1">Network repayment index</div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            <span className="text-xs font-bold text-text-muted mr-1 flex items-center gap-1">
              <Filter size={13} /> Filter:
            </span>
            {TIER_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setTierFilter(f)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border transition-colors ${
                  tierFilter === f
                    ? "bg-purple/20 border-purple text-purple-light"
                    : "bg-transparent border-border text-text-muted hover:text-text-primary"
                }`}
              >
                {f === "all" ? "All Borrowers" : f}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="bg-bg-panel border border-border rounded-card overflow-hidden">
            {loading ? (
              <div className="py-16 text-center text-text-muted text-sm">Evaluating borrower credit histories…</div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center px-4">
                <div className="text-4xl mb-3">🔍</div>
                <div className="font-bold text-text-primary text-base">No borrower records match this filter</div>
                <div className="text-text-muted text-xs mt-1">Try another search or change your filter selection.</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-[980px]">
                  <div className="grid grid-cols-[1.6fr_1.3fr_1.4fr_1.3fr_1.3fr_0.9fr] gap-3 px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider text-text-muted border-b border-border bg-bg-raised/30">
                    <span>Borrower Profile</span>
                    <span>Credibility Rating</span>
                    <span>Repayment Track Record</span>
                    <span>Authorized Credit Limit</span>
                    <span>Associated Shops</span>
                    <span className="text-right">Action</span>
                  </div>

                  {filtered.map((cust) => {
                    const cred = cust.credibility || {};
                    const score = cred.score ?? 50;

                    return (
                      <div
                        key={cust.phone}
                        className="grid grid-cols-[1.6fr_1.3fr_1.4fr_1.3fr_1.3fr_0.9fr] gap-3 px-6 py-4 items-center border-b border-border last:border-0 hover:bg-bg-raised/40 transition-colors"
                      >
                        {/* Profile */}
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-bg-raised border border-border flex items-center justify-center text-xs font-bold text-text-primary shrink-0">
                            {cust.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-text-primary text-sm">{cust.name}</div>
                            <div className="text-xs text-text-muted font-mono">{cust.phone}</div>
                          </div>
                        </div>

                        {/* Credibility Score & Rating */}
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-extrabold border ${cred.badgeColor}`}>
                              {cred.rating || "B"}
                            </span>
                            <span className="text-xs font-extrabold text-text-primary">{score} / 100</span>
                          </div>
                          <div className="w-28 h-1.5 rounded-full bg-bg-deep overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                score >= 75
                                  ? "bg-emerald"
                                  : score >= 50
                                  ? "bg-amber"
                                  : "bg-danger"
                              }`}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                        </div>

                        {/* Track Record */}
                        <div className="text-xs">
                          <div className="font-semibold text-text-primary flex items-center gap-1.5">
                            <CheckCircle size={12} className="text-emerald" />
                            <span>{cust.paidCount} of {cust.loansCount} loans settled</span>
                          </div>
                          <div className="text-text-muted mt-0.5 text-[11px]">
                            {cust.overdueCount > 0 ? (
                              <span className="text-danger font-bold">{cust.overdueCount} overdue active</span>
                            ) : (
                              <span className="text-emerald font-semibold">100% clean standing</span>
                            )}
                            {" • "}{formatKES(cust.totalRepaid)} repaid
                          </div>
                        </div>

                        {/* Authorized Credit Limit */}
                        <div>
                          <div className={`text-sm font-extrabold ${cred.canBorrow ? "text-emerald" : "text-danger"}`}>
                            {cred.allowedCreditLimit > 0 ? formatKES(cred.allowedCreditLimit) : "Restricted (KES 0)"}
                          </div>
                          <div className="text-[10px] text-text-muted">
                            {cred.canBorrow ? "Allowed for credit" : "Must clear existing debt"}
                          </div>
                        </div>

                        {/* Associated Shops */}
                        <div className="text-xs text-text-muted">
                          <div className="truncate font-medium text-text-primary">
                            {(cust.shopNames || []).join(", ") || "Shop"}
                          </div>
                          <div className="text-[10px]">{cust.shopsCount} shop{cust.shopsCount !== 1 ? "s" : ""} patronized</div>
                        </div>

                        {/* Link to Detail Dashboard */}
                        <div className="text-right">
                          <Link
                            to={`/admin/customers/${encodeURIComponent(cust.phone)}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-bg-raised hover:bg-emerald text-text-primary hover:text-white border border-border hover:border-emerald text-xs font-bold transition-all shadow-sm"
                          >
                            <span>Dashboard</span>
                            <ArrowUpRight size={13} />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
