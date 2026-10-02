import { useState, useEffect } from "react";
import { Banknote, CheckCircle2, AlertCircle, Calendar, Hash, FileText, ArrowRight, Printer } from "lucide-react";
import Modal from "./Modal";
import Button from "./Button";
import FormField from "./FormField";
import { recordCashPayment } from "../lib/adminApi";
import { formatKES } from "../lib/format";

export default function CashPaymentModal({
  open,
  onClose,
  loans = [],
  preselectedLoan = null,
  onSuccess,
}) {
  const [selectedLoanId, setSelectedLoanId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [receiptNo, setReceiptNo] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [completedPayment, setCompletedPayment] = useState(null);

  // Filter eligible loans (unpaid loans first, or all loans)
  const unpaidLoans = loans.filter((l) => (l._status || l.status) !== "paid");
  const availableLoans = unpaidLoans.length > 0 ? unpaidLoans : loans;

  useEffect(() => {
    if (open) {
      const active = preselectedLoan || availableLoans[0] || null;
      if (active) {
        setSelectedLoanId(active.id);
        setAmount(String(active.amount || ""));
      } else {
        setSelectedLoanId("");
        setAmount("");
      }
      setPaymentDate(new Date().toISOString().slice(0, 10));
      setReceiptNo(`CSH-${Date.now().toString().slice(-6)}`);
      setNotes("");
      setError("");
      setCompletedPayment(null);
    }
  }, [open, preselectedLoan, loans]);

  const currentLoan = loans.find((l) => l.id === selectedLoanId) || preselectedLoan;

  function handleLoanSelect(loanId) {
    setSelectedLoanId(loanId);
    const found = loans.find((l) => l.id === loanId);
    if (found) {
      setAmount(String(found.amount || ""));
    }
  }

  const numAmount = Number(amount) || 0;
  const loanBalance = currentLoan ? Number(currentLoan.amount || 0) : 0;
  const isFullSettlement = numAmount >= loanBalance;
  const remaining = Math.max(0, loanBalance - numAmount);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!currentLoan) {
      setError("Please select a borrower loan to settle.");
      return;
    }
    if (!amount || numAmount <= 0) {
      setError("Please enter a valid cash repayment amount.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await recordCashPayment({
        loanId: currentLoan.id,
        amount: numAmount,
        paymentDate,
        receiptNo: receiptNo || `CSH-${Date.now().toString().slice(-6)}`,
        notes: notes || "Cash payment entered by shopkeeper",
      });

      setCompletedPayment({
        receipt: res.receipt || receiptNo,
        amount: numAmount,
        borrowerName: currentLoan.borrower_name,
        phone: currentLoan.phone,
        date: paymentDate,
        isFullSettlement,
        remaining,
        loanId: currentLoan.id,
      });

      onSuccess?.(res.loan || { ...currentLoan, status: isFullSettlement ? "paid" : currentLoan.status });
    } catch (err) {
      setError(err.message || "Failed to record cash transaction.");
    } finally {
      setLoading(false);
    }
  }

  function handlePrintReceipt() {
    window.print();
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!loading) onClose();
      }}
      title="Record Cash Payment"
      maxWidth="max-w-[520px]"
    >
      {completedPayment ? (
        /* Payment Receipt View */
        <div className="py-2">
          <div className="text-center mb-5">
            <div className="w-14 h-14 rounded-full bg-emerald/20 text-emerald flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 size={32} />
            </div>
            <h4 className="text-lg font-extrabold text-text-primary">Cash Payment Recorded!</h4>
            <p className="text-xs text-text-muted mt-1">
              Credit settlement confirmed and transaction logged in shop records.
            </p>
          </div>

          <div className="bg-bg-raised border border-border rounded-xl p-4 font-mono text-xs mb-5">
            <div className="flex justify-between items-center pb-2 border-b border-border/60">
              <span className="text-text-muted">Receipt Number</span>
              <span className="font-bold text-emerald">{completedPayment.receipt}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/60">
              <span className="text-text-muted">Borrower</span>
              <span className="font-bold text-text-primary">{completedPayment.borrowerName}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/60">
              <span className="text-text-muted">Phone</span>
              <span className="text-text-primary">{completedPayment.phone}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/60">
              <span className="text-text-muted">Payment Method</span>
              <span className="font-bold text-emerald flex items-center gap-1">
                <Banknote size={13} /> CASH (Counter)
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/60">
              <span className="text-text-muted">Payment Date</span>
              <span className="text-text-primary">{completedPayment.date}</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-text-muted">Amount Received</span>
              <span className="font-extrabold text-sm text-emerald">
                {formatKES(completedPayment.amount)}
              </span>
            </div>
          </div>

          {completedPayment.isFullSettlement ? (
            <div className="p-3 rounded-lg bg-emerald/15 border border-emerald/30 text-emerald text-xs font-bold mb-5 flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>Full credit balance cleared. Loan marked as PAID.</span>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-amber/15 border border-amber/30 text-amber text-xs font-bold mb-5 flex items-center gap-2">
              <AlertCircle size={16} />
              <span>Partial payment recorded. Remaining balance: {formatKES(completedPayment.remaining)}.</span>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handlePrintReceipt}
              className="flex-1 py-2.5 rounded-lg border border-border bg-bg-raised text-text-primary hover:bg-bg-panel text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Printer size={15} /> Print Receipt
            </button>
            <Button variant="primary" onClick={onClose} className="flex-1">
              Done
            </Button>
          </div>
        </div>
      ) : (
        /* Payment Entry Form */
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Cash Badge */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-emerald/10 border border-emerald/25">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald/20 text-emerald flex items-center justify-center">
                <Banknote size={18} />
              </div>
              <div>
                <div className="text-xs font-bold text-emerald">Cash Transaction Entry</div>
                <div className="text-[11px] text-text-muted">
                  Record physical cash payments & credit settlements
                </div>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald/20 text-emerald uppercase tracking-wider">
              Instant Credit Update
            </span>
          </div>

          {/* Select Loan / Borrower */}
          {!preselectedLoan && availableLoans.length > 0 ? (
            <FormField label="Select Borrower Credit Record" required>
              <select
                value={selectedLoanId}
                onChange={(e) => handleLoanSelect(e.target.value)}
                className="w-full bg-bg-input border border-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary focus:outline-none focus:border-emerald transition-colors"
                required
              >
                {availableLoans.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.borrower_name} ({l.phone}) — {formatKES(l.amount)} ({l._status || l.status})
                  </option>
                ))}
              </select>
            </FormField>
          ) : null}

          {/* Selected Loan Details Box */}
          {currentLoan && (
            <div className="bg-bg-raised/70 border border-border rounded-lg p-3.5 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Borrower</div>
                <div className="text-sm font-bold text-text-primary">{currentLoan.borrower_name}</div>
                <div className="text-xs text-text-muted">{currentLoan.phone}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Outstanding Credit</div>
                <div className="text-base font-extrabold text-emerald">{formatKES(currentLoan.amount)}</div>
                <div className="text-[10px] text-text-muted capitalize">Status: {currentLoan._status || currentLoan.status}</div>
              </div>
            </div>
          )}

          {/* Cash Amount */}
          <FormField label="Cash Amount Paid (KES)" required>
            <div className="relative">
              <input
                type="number"
                min="1"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount paid in cash"
                className="w-full bg-bg-input border border-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary font-semibold focus:outline-none focus:border-emerald transition-colors"
                required
              />
              {currentLoan && (
                <button
                  type="button"
                  onClick={() => setAmount(String(currentLoan.amount || ""))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold px-2 py-1 rounded bg-bg-panel hover:bg-emerald/20 text-emerald border border-emerald/30 transition-colors"
                >
                  Full Clearance
                </button>
              )}
            </div>
          </FormField>

          {/* Settlement Preview Badge */}
          {currentLoan && numAmount > 0 && (
            <div className={`text-xs p-2.5 rounded-lg border flex items-center gap-2 font-medium ${
              isFullSettlement
                ? "bg-emerald/10 border-emerald/30 text-emerald font-bold"
                : "bg-amber/10 border-amber/30 text-amber"
            }`}>
              {isFullSettlement ? (
                <>
                  <CheckCircle2 size={14} className="shrink-0" />
                  <span>Full Balance Settled: Loan status will be updated to <b>PAID</b>.</span>
                </>
              ) : (
                <>
                  <AlertCircle size={14} className="shrink-0" />
                  <span>Partial Cash Payment: Remaining balance will be {formatKES(remaining)}.</span>
                </>
              )}
            </div>
          )}

          {/* Grid: Payment Date & Receipt # */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Payment Date" required>
              <div className="relative">
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full bg-bg-input border border-border rounded-lg px-3.5 py-2 text-sm text-text-primary focus:outline-none focus:border-emerald transition-colors"
                  required
                />
              </div>
            </FormField>

            <FormField label="Receipt / Ref #">
              <input
                type="text"
                value={receiptNo}
                onChange={(e) => setReceiptNo(e.target.value)}
                placeholder="e.g. CSH-849201"
                className="w-full bg-bg-input border border-border rounded-lg px-3.5 py-2 text-sm text-text-primary focus:outline-none focus:border-emerald transition-colors font-mono"
              />
            </FormField>
          </div>

          {/* Notes */}
          <FormField label="Payment Notes / Counter Reference">
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Paid in physical cash at main counter, settled in full"
              className="w-full bg-bg-input border border-border rounded-lg px-3.5 py-2 text-sm text-text-primary focus:outline-none focus:border-emerald transition-colors resize-none"
            />
          </FormField>

          {error && (
            <div className="flex items-center gap-2 p-3 text-xs rounded-lg bg-danger/10 border border-danger/25 text-danger">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-2">
            <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              <Banknote size={16} />
              <span>{loading ? "Recording..." : "Confirm Cash Payment"}</span>
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
