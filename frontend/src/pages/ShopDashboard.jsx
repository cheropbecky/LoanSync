import { useState, useMemo } from "react";
import { Plus, MoreVertical, Download, Filter } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import AddLoanModal from "../components/AddLoanModal";
import Button from "../components/Button";
import { useLoans } from "../hooks/useLoans";
import { formatKES, formatDate, initialsFromName, effectiveStatus } from "../lib/format";

const FILTERS = ["all", "active", "paid", "overdue"];

export default function ShopDashboard() {
  const { loans, loading, addLoan, updateLoanStatus, deleteLoan } = useLoans();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState(null);

  const decorated = useMemo(
    () => loans.map((l) => ({ ...l, _status: effectiveStatus(l) })),
    [loans]
  );

  const filtered = decorated.filter((l) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q || l.borrower_name.toLowerCase().includes(q) || l.phone.includes(q);
    const matchFilter = filter === "all" || l._status === filter;
    return matchSearch && matchFilter;
  });

  const totalLoaned = decorated.reduce((s, l) => s + Number(l.amount), 0);
  const outstanding = decorated.filter((l) => l._status === "active").reduce((s, l) => s + Number(l.amount), 0);
  const recovered = decorated.filter((l) => l._status === "paid").reduce((s, l) => s + Number(l.amount), 0);
  const overdueCount = decorated.filter((l) => l._status === "overdue").length;
  const recoveryRate = totalLoaned > 0 ? Math.round((recovered / totalLoaned) * 100) : 0;

  return (
    <div className="flex min-h-screen bg-bg-deep">
      <Sidebar variant="shop" open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 min-w-0">
        <Topbar search={search} onSearchChange={setSearch} onMenuClick={() => setSidebarOpen(true)} />

        <main className="max-w-[1180px] mx-auto px-4 sm:px-7 py-6 sm:py-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-6 sm:mb-7 flex-wrap gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-text-primary">My Loan Records</h1>
              <p className="text-text-muted text-sm mt-1">
                Manage and track borrower balances in real-time.
              </p>
            </div>
            <Button onClick={() => setModalOpen(true)}>
              <Plus size={16} /> Add Loan Record
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-7">
            <StatCard icon="total" label="Total Loaned" value={formatKES(totalLoaned)} sub={`${decorated.length} records`} accent="emerald" />
            <StatCard icon="outstanding" label="Outstanding" value={formatKES(outstanding)} sub="Awaiting repayment" accent="amber" />
            <StatCard icon="recovered" label="Recovered" value={formatKES(recovered)} sub={`${recoveryRate}% recovery rate`} accent="sky" />
            <StatCard icon="overdue" label="Overdue" value={`${overdueCount} Loan${overdueCount !== 1 ? "s" : ""}`} sub="Requires immediate action" accent="danger" />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2.5 mb-5 flex-wrap">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide border transition-colors ${
                  filter === f
                    ? "bg-emerald/15 border-emerald text-emerald"
                    : "bg-transparent border-border text-text-muted hover:text-text-primary"
                }`}
              >
                {f === "all" ? "All Records" : f}
              </button>
            ))}
            <div className="flex-1" />
            <button className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-text-muted hover:text-text-primary transition-colors">
              <Filter size={15} />
            </button>
            <button className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-text-muted hover:text-text-primary transition-colors">
              <Download size={15} />
            </button>
          </div>

          {/* Table */}
          <div className="bg-bg-panel border border-border rounded-card overflow-hidden">
            {loading ? (
              <div className="py-16 text-center text-text-muted text-sm">Loading records…</div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center px-4">
                <div className="text-4xl mb-3">📋</div>
                <div className="font-bold text-text-primary text-[15px]">
                  {decorated.length === 0 ? "No loan records yet" : "No records match your search"}
                </div>
                <div className="text-text-muted text-sm mt-1">
                  {decorated.length === 0
                    ? 'Click "Add Loan Record" to get started.'
                    : "Try a different search or filter."}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-[760px]">
                  <div className="grid grid-cols-[1.6fr_1.2fr_1fr_1.2fr_0.8fr_0.5fr] gap-3 px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-text-muted border-b border-border">
                    <span>Borrower</span>
                    <span>Phone Number</span>
                    <span>Amount</span>
                    <span>Issue / Due Date</span>
                    <span>Status</span>
                    <span></span>
                  </div>
                  {filtered.map((loan) => (
                    <div
                      key={loan.id}
                      className="grid grid-cols-[1.6fr_1.2fr_1fr_1.2fr_0.8fr_0.5fr] gap-3 px-6 py-4 items-center border-b border-border last:border-0 hover:bg-bg-raised/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-bg-raised flex items-center justify-center text-xs font-bold text-text-primary shrink-0">
                          {initialsFromName(loan.borrower_name)}
                        </div>
                        <div>
                          <div className="font-bold text-text-primary text-sm">{loan.borrower_name}</div>
                          {loan.note && <div className="text-xs text-text-muted">{loan.note}</div>}
                        </div>
                      </div>
                      <div className="text-sm text-text-muted">{loan.phone}</div>
                      <div className="font-extrabold text-emerald text-sm">{formatKES(loan.amount)}</div>
                      <div className="text-xs text-text-muted">
                        <div>{formatDate(loan.issue_date)}</div>
                        {loan.due_date && (
                          <div className={loan._status === "overdue" ? "text-danger font-semibold" : "text-amber font-semibold"}>
                            {loan._status === "paid" ? "Paid " : "Due: "}
                            {formatDate(loan.due_date)}
                          </div>
                        )}
                      </div>
                      <div><StatusBadge status={loan._status} /></div>
                      <div className="relative flex justify-end">
                        <button
                          onClick={() => setMenuOpenId(menuOpenId === loan.id ? null : loan.id)}
                          className="text-text-muted hover:text-text-primary p-1"
                        >
                          <MoreVertical size={16} />
                        </button>
                        {menuOpenId === loan.id && (
                          <div className="absolute right-0 top-8 z-10 bg-bg-raised border border-border rounded-lg shadow-modal py-1 w-36">
                            {loan._status !== "paid" && (
                              <button
                                onClick={() => { updateLoanStatus(loan.id, "paid"); setMenuOpenId(null); }}
                                className="w-full text-left px-3 py-2 text-xs font-semibold text-emerald hover:bg-emerald/10"
                              >
                                ✓ Mark Paid
                              </button>
                            )}
                            {loan._status === "active" && (
                              <button
                                onClick={() => { updateLoanStatus(loan.id, "overdue"); setMenuOpenId(null); }}
                                className="w-full text-left px-3 py-2 text-xs font-semibold text-danger hover:bg-danger/10"
                              >
                                Mark Overdue
                              </button>
                            )}
                            <button
                              onClick={() => { deleteLoan(loan.id); setMenuOpenId(null); }}
                              className="w-full text-left px-3 py-2 text-xs font-semibold text-text-muted hover:bg-bg-panel"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <AddLoanModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={addLoan} />
    </div>
  );
}