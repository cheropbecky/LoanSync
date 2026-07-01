import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronLeft, MapPin, Phone, Mail } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import StatusBadge from "../components/StatusBadge";
import { useAsync } from "../hooks/useAsync";
import { fetchShopDetail } from "../lib/adminApi";
import { formatKES, formatDate, initialsFromName, effectiveStatus } from "../lib/format";

const FILTERS = ["all", "active", "paid", "overdue"];

export default function AdminShopDetail() {
  const { shopId } = useParams();
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const { data, loading, error } = useAsync(() => fetchShopDetail(shopId), [shopId]);

  const shop = data?.shop;
  const loans = (data?.loans || []).map((l) => ({ ...l, _status: effectiveStatus(l) }));
  const filtered = filter === "all" ? loans : loans.filter((l) => l._status === filter);

  const total = loans.reduce((s, l) => s + Number(l.amount), 0);
  const outstanding = loans.filter((l) => l._status === "active").reduce((s, l) => s + Number(l.amount), 0);
  const recovered = loans.filter((l) => l._status === "paid").reduce((s, l) => s + Number(l.amount), 0);
  const overdueAmt = loans.filter((l) => l._status === "overdue").reduce((s, l) => s + Number(l.amount), 0);

  return (
    <div className="flex min-h-screen bg-bg-deep">
      <Sidebar variant="admin" open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 min-w-0">
        <Topbar search={search} onSearchChange={setSearch} placeholder="Search this shop's loans…" roleLabel="Enterprise Admin" onMenuClick={() => setSidebarOpen(true)} />

        <main className="max-w-[1180px] mx-auto px-4 sm:px-7 py-6 sm:py-8">
          <Link to="/admin/shops" className="inline-flex items-center gap-1.5 text-text-muted hover:text-text-primary text-sm font-semibold mb-5">
            <ChevronLeft size={16} /> Back to Shops
          </Link>

          {loading ? (
            <div className="py-16 text-center text-text-muted text-sm">Loading shop…</div>
          ) : error ? (
            <div className="bg-danger/10 border border-danger/25 text-danger text-sm rounded-lg px-4 py-3">{error}</div>
          ) : (
            <>
              <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
                <div>
                  <h1 className="text-2xl font-extrabold text-text-primary">{shop?.name}</h1>
                  <div className="flex items-center gap-4 text-sm text-text-muted mt-2 flex-wrap">
                    <span className="flex items-center gap-1.5"><MapPin size={14} /> {shop?.location || "—"}</span>
                    <span className="flex items-center gap-1.5"><Phone size={14} /> {shop?.phone}</span>
                    <span className="flex items-center gap-1.5"><Mail size={14} /> {shop?.email}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
                {[
                  ["Total Loaned", formatKES(total), "text-emerald"],
                  ["Outstanding", formatKES(outstanding), "text-amber"],
                  ["Recovered", formatKES(recovered), "text-sky"],
                  ["Overdue", formatKES(overdueAmt), "text-danger"],
                ].map(([label, value, color]) => (
                  <div key={label} className="bg-bg-panel border border-border rounded-card p-4">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-text-muted mb-1.5">{label}</div>
                    <div className={`text-lg font-extrabold ${color}`}>{value}</div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2.5 mb-5">
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase border transition-colors ${
                      filter === f ? "bg-emerald/15 border-emerald text-emerald" : "border-border text-text-muted"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <div className="bg-bg-panel border border-border rounded-card overflow-hidden">
                {filtered.length === 0 ? (
                  <div className="py-14 text-center text-text-muted text-sm">No records for this filter.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <div className="min-w-[620px]">
                      <div className="grid grid-cols-[1.4fr_1.1fr_1fr_1.1fr_0.7fr] gap-3 px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-text-muted border-b border-border">
                        <span>Borrower</span><span>Phone</span><span>Amount</span><span>Date</span><span>Status</span>
                      </div>
                      {filtered.map((l) => (
                        <div key={l.id} className="grid grid-cols-[1.4fr_1.1fr_1fr_1.1fr_0.7fr] gap-3 px-6 py-3.5 items-center border-b border-border last:border-0">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-bg-raised flex items-center justify-center text-[11px] font-bold text-text-primary">
                              {initialsFromName(l.borrower_name)}
                            </div>
                            <div>
                              <div className="font-semibold text-text-primary text-sm">{l.borrower_name}</div>
                              {l.note && <div className="text-[11px] text-text-muted">{l.note}</div>}
                            </div>
                          </div>
                          <div className="text-sm text-text-muted">{l.phone}</div>
                          <div className="font-bold text-emerald text-sm">{formatKES(l.amount)}</div>
                          <div className="text-xs text-text-muted">
                            <div>{formatDate(l.issue_date)}</div>
                            {l.due_date && <div className="text-amber">Due: {formatDate(l.due_date)}</div>}
                          </div>
                          <div><StatusBadge status={l._status} /></div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}