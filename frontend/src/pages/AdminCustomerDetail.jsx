import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  ShieldCheck,
  CreditCard,
  Banknote,
  Smartphone,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Info,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import StatusBadge from "../components/StatusBadge";
import CashPaymentModal from "../components/CashPaymentModal";
import MpesaModal from "../components/MpesaModal";
import { useAsync } from "../hooks/useAsync";
import { fetchCustomerDetail } from "../lib/adminApi";
import { formatKES, formatDate } from "../lib/format";

export default function AdminCustomerDetail() {
  const { phone } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("loans"); // "loans" | "payments"
  const [selectedCashLoan, setSelectedCashLoan] = useState(null);
  const [selectedMpesaLoan, setSelectedMpesaLoan] = useState(null);

  const { data, loading, error, run: reload } = useAsync(() => fetchCustomerDetail(phone), [phone]);

  const customer = data?.customer;
  const credibility = customer?.credibility || {};
  const loans = customer?.loans || [];
  const cashPayments = customer?.cashPayments || [];
  const mpesaPayments = customer?.mpesaPayments || [];

  // Combine payments chronologically
  const allPayments = [
    ...cashPayments.map((c) => ({
      id: c.id,
      method: "cash",
      amount: c.amount,
      date: c.payment_date || c.created_at,
      receipt: c.receipt_no || "CASH",
      notes: c.notes,
      shop_id: c.shop_id,
    })),
    ...mpesaPayments.map((m) => ({
      id: m.id,
      method: "mpesa",
      amount: m.amount,
      date: m.created_at,
      receipt: m.mpesa_receipt || m.checkout_request_id?.slice(-8) || "MPESA",
      notes: "Safaricom Daraja STK Repayment",
      shop_id: null,
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="flex min-h-screen bg-bg-deep">
      <Sidebar variant="admin" open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 min-w-0">
        <Topbar
          placeholder="Search customer records…"
          roleLabel="Enterprise Admin"
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="max-w-[1200px] mx-auto px-4 sm:px-7 py-6 sm:py-8">
          {/* Back link */}
          <Link
            to="/admin/customers"
            className="inline-flex items-center gap-2 text-xs font-bold text-text-muted hover:text-emerald transition-colors mb-4"
          >
            <ArrowLeft size={14} /> Back to Borrower Directory
          </Link>

          {loading ? (
            <div className="py-20 text-center text-text-muted text-sm">Loading borrower payment dashboard…</div>
          ) : error || !customer ? (
            <div className="bg-danger/10 border border-danger/25 text-danger text-sm rounded-lg p-6 text-center">
              {error || "Customer record not found"}
            </div>
          ) : (
            <>
              {/* Profile Header */}
              <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple to-purple-light flex items-center justify-center text-white text-xl font-black shadow-glow">
                    {customer.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h1 className="text-xl sm:text-2xl font-black text-text-primary">{customer.name}</h1>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${credibility.badgeColor}`}>
                        {credibility.rating} • {credibility.tier}
                      </span>
                    </div>
                    <div className="text-text-muted text-xs font-mono mt-0.5">
                      Phone: <span className="text-text-primary">{customer.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-muted mr-1">Evaluated Status:</span>
                  {credibility.canBorrow ? (
                    <span className="px-3 py-1 rounded-lg bg-emerald/15 border border-emerald/30 text-emerald text-xs font-bold flex items-center gap-1.5">
                      <CheckCircle2 size={13} /> High Credit Authorized
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-lg bg-danger/15 border border-danger/30 text-danger text-xs font-bold flex items-center gap-1.5">
                      <AlertCircle size={13} /> Credit Blocked (Overdue)
                    </span>
                  )}
                </div>
              </div>

              {/* Big Credibility & Authorized Credit Card */}
              <div className="bg-gradient-to-br from-bg-panel via-bg-panel to-bg-raised border border-border rounded-card p-6 mb-7 relative overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  {/* Score circle / gauge */}
                  <div className="border-b md:border-b-0 md:border-r border-border pb-5 md:pb-0 md:pr-6">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-2 flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-purple-light" /> Credibility Score
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-4xl font-black text-text-primary">{credibility.score}</span>
                      <span className="text-lg text-text-muted font-bold">/ 100</span>
                    </div>
                    <div className="w-full bg-bg-deep h-2 rounded-full overflow-hidden mb-2">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          credibility.score >= 75
                            ? "bg-emerald"
                            : credibility.score >= 50
                            ? "bg-amber"
                            : "bg-danger"
                        }`}
                        style={{ width: `${credibility.score}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-text-muted leading-relaxed">
                      {credibility.summary}
                    </p>
                  </div>

                  {/* Authorized Credit Limit */}
                  <div className="border-b md:border-b-0 md:border-r border-border pb-5 md:pb-0 md:pr-6">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-2 flex items-center gap-1.5">
                      <TrendingUp size={14} className="text-emerald" /> Authorized Credit Limit
                    </div>
                    <div className="text-3xl font-black text-emerald mb-1">
                      {credibility.allowedCreditLimit > 0
                        ? formatKES(credibility.allowedCreditLimit)
                        : "KES 0 (Blocked)"}
                    </div>
                    <div className="text-xs font-semibold text-text-primary mb-2">
                      {credibility.allowedCreditLabel}
                    </div>
                    <div className="p-2.5 rounded-lg bg-bg-deep border border-border/80 text-[11px] text-text-muted flex items-start gap-1.5">
                      <Info size={13} className="shrink-0 mt-0.5 text-sky" />
                      <span>
                        Borrowers who consistently pay loans on time are awarded higher credit capacity. Delinquent borrowers are restricted until debts clear.
                      </span>
                    </div>
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-bg-deep p-3 rounded-lg border border-border">
                      <div className="text-[10px] uppercase font-bold text-text-muted">Total Borrowed</div>
                      <div className="text-sm font-extrabold text-text-primary mt-0.5">
                        {formatKES(credibility.totalBorrowed)}
                      </div>
                      <div className="text-[10px] text-text-muted">{credibility.totalLoans} loan(s)</div>
                    </div>
                    <div className="bg-bg-deep p-3 rounded-lg border border-border">
                      <div className="text-[10px] uppercase font-bold text-text-muted">Total Repaid</div>
                      <div className="text-sm font-extrabold text-emerald mt-0.5">
                        {formatKES(credibility.totalRepaid)}
                      </div>
                      <div className="text-[10px] text-emerald">{credibility.paidCount} settled</div>
                    </div>
                    <div className="bg-bg-deep p-3 rounded-lg border border-border">
                      <div className="text-[10px] uppercase font-bold text-text-muted">Outstanding</div>
                      <div className="text-sm font-extrabold text-amber mt-0.5">
                        {formatKES(credibility.totalOutstanding)}
                      </div>
                      <div className="text-[10px] text-amber">{credibility.activeCount} active</div>
                    </div>
                    <div className="bg-bg-deep p-3 rounded-lg border border-border">
                      <div className="text-[10px] uppercase font-bold text-text-muted">Overdue Balance</div>
                      <div className={`text-sm font-extrabold mt-0.5 ${credibility.overdueCount > 0 ? "text-danger" : "text-text-muted"}`}>
                        {formatKES(credibility.totalOverdue)}
                      </div>
                      <div className="text-[10px] text-text-muted">{credibility.overdueCount} overdue</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-2 mb-4 border-b border-border pb-3">
                <button
                  onClick={() => setActiveTab("loans")}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 ${
                    activeTab === "loans"
                      ? "bg-purple text-white shadow-glow"
                      : "text-text-muted hover:text-text-primary hover:bg-bg-panel"
                  }`}
                >
                  <CreditCard size={14} /> Loans History ({loans.length})
                </button>
                <button
                  onClick={() => setActiveTab("payments")}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 ${
                    activeTab === "payments"
                      ? "bg-purple text-white shadow-glow"
                      : "text-text-muted hover:text-text-primary hover:bg-bg-panel"
                  }`}
                >
                  <Banknote size={14} /> Payment Transactions ({allPayments.length})
                </button>
              </div>

              {/* Tab 1: Loans History */}
              {activeTab === "loans" && (
                <div className="bg-bg-panel border border-border rounded-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <div className="min-w-[860px]">
                      <div className="grid grid-cols-[1.5fr_1fr_1.1fr_1.1fr_0.9fr_1.4fr] gap-3 px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider text-text-muted border-b border-border bg-bg-raised/30">
                        <span>Shop / Origin</span>
                        <span>Amount</span>
                        <span>Issued</span>
                        <span>Due Date</span>
                        <span>Status</span>
                        <span className="text-right">Repayment Action</span>
                      </div>

                      {loans.map((loan) => (
                        <div
                          key={loan.id}
                          className="grid grid-cols-[1.5fr_1fr_1.1fr_1.1fr_0.9fr_1.4fr] gap-3 px-6 py-4 items-center border-b border-border last:border-0 hover:bg-bg-raised/40 transition-colors"
                        >
                          <div>
                            <div className="font-bold text-text-primary text-sm">{loan.shop_name || "Retail Shop"}</div>
                            {loan.note && <div className="text-xs text-text-muted truncate max-w-xs">{loan.note}</div>}
                          </div>

                          <div className="font-extrabold text-sm text-text-primary">{formatKES(loan.amount)}</div>

                          <div className="text-xs text-text-muted">{formatDate(loan.issue_date)}</div>

                          <div className="text-xs">
                            {loan.due_date ? (
                              <span className={loan._status === "overdue" ? "text-danger font-bold" : "text-text-muted"}>
                                {formatDate(loan.due_date)}
                              </span>
                            ) : (
                              <span className="text-text-muted">—</span>
                            )}
                          </div>

                          <div>
                            <StatusBadge status={loan._status || loan.status} />
                          </div>

                          <div className="flex items-center justify-end gap-2">
                            {loan._status !== "paid" ? (
                              <>
                                <button
                                  onClick={() => setSelectedCashLoan(loan)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald/15 hover:bg-emerald text-emerald hover:text-white border border-emerald/30 text-xs font-bold transition-all"
                                  title="Record Cash Payment"
                                >
                                  <Banknote size={13} />
                                  <span>Cash</span>
                                </button>
                                <button
                                  onClick={() => setSelectedMpesaLoan(loan)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky/15 hover:bg-sky text-sky hover:text-white border border-sky/30 text-xs font-bold transition-all"
                                  title="Send M-Pesa STK Push"
                                >
                                  <Smartphone size={13} />
                                  <span>M-Pesa</span>
                                </button>
                              </>
                            ) : (
                              <span className="text-xs font-semibold text-emerald flex items-center gap-1">
                                <CheckCircle2 size={13} /> Paid in Full
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Payments Timeline */}
              {activeTab === "payments" && (
                <div className="bg-bg-panel border border-border rounded-card overflow-hidden">
                  {allPayments.length === 0 ? (
                    <div className="py-16 text-center text-text-muted text-sm">
                      No payment transactions recorded for this customer yet.
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {allPayments.map((p) => (
                        <div key={p.id} className="p-5 flex items-center justify-between flex-wrap gap-4 hover:bg-bg-raised/40 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              p.method === "cash" ? "bg-emerald/20 text-emerald" : "bg-sky/20 text-sky"
                            }`}>
                              {p.method === "cash" ? <Banknote size={20} /> : <Smartphone size={20} />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                  p.method === "cash" ? "bg-emerald/20 text-emerald" : "bg-sky/20 text-sky"
                                }`}>
                                  {p.method === "cash" ? "Cash Transaction" : "M-Pesa STK Push"}
                                </span>
                                <span className="font-mono text-xs text-text-muted">Ref: {p.receipt}</span>
                              </div>
                              <div className="text-xs text-text-muted">{p.notes || "Repayment recorded"}</div>
                              <div className="text-[11px] text-text-muted flex items-center gap-1 mt-0.5">
                                <Calendar size={11} /> {formatDate(p.date)}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-base font-extrabold text-emerald">+{formatKES(p.amount)}</div>
                            <span className="text-[10px] text-emerald font-bold uppercase">Confirmed Settlement</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Cash Payment Modal */}
      <CashPaymentModal
        open={Boolean(selectedCashLoan)}
        onClose={() => setSelectedCashLoan(null)}
        loans={loans}
        preselectedLoan={selectedCashLoan}
        onSuccess={() => {
          setSelectedCashLoan(null);
          reload();
        }}
      />

      {/* M-Pesa STK Push Modal */}
      <MpesaModal
        open={Boolean(selectedMpesaLoan)}
        onClose={() => setSelectedMpesaLoan(null)}
        loan={selectedMpesaLoan}
        onPaymentSuccess={() => {
          setSelectedMpesaLoan(null);
          reload();
        }}
      />
    </div>
  );
}
