import { useState, useMemo } from "react";
import { Save, ShieldCheck, AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react";
import Modal from "./Modal";
import Button from "./Button";
import { Field, Input, Select, Textarea } from "./FormField";
import { computeCustomerCredibility } from "../lib/credibility";
import { formatKES } from "../lib/format";

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function AddLoanModal({ open, onClose, onSave, existingLoans = [] }) {
  const [form, setForm] = useState({
    borrower_name: "",
    phone: "",
    amount: "",
    status: "active",
    issue_date: todayISO(),
    due_date: "",
    note: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function handle(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError("");
  }

  function reset() {
    setForm({
      borrower_name: "",
      phone: "",
      amount: "",
      status: "active",
      issue_date: todayISO(),
      due_date: "",
      note: "",
    });
    setError("");
  }

  // Live borrower credibility evaluation
  const borrowerCredibility = useMemo(() => {
    const p = (form.phone || "").replace(/\s+/g, "");
    if (!p || p.length < 8) return null;

    const matchedLoans = existingLoans.filter(
      (l) => (l.phone || "").replace(/\s+/g, "").includes(p.slice(-8))
    );

    if (matchedLoans.length === 0) return null;
    return computeCustomerCredibility(matchedLoans);
  }, [form.phone, existingLoans]);

  const requestedAmount = Number(form.amount) || 0;
  const exceedsRecommended =
    borrowerCredibility &&
    requestedAmount > 0 &&
    requestedAmount > borrowerCredibility.allowedCreditLimit;

  async function handleSave() {
    if (!form.borrower_name || !form.phone || !form.amount || !form.issue_date) {
      setError("Borrower name, phone, amount and issue date are required.");
      return;
    }
    if (isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      setError("Enter a valid loan amount.");
      return;
    }
    setSaving(true);
    try {
      await onSave({ ...form, amount: parseFloat(form.amount), due_date: form.due_date || null });
      reset();
      onClose();
    } catch (err) {
      setError(err.message || "Could not save loan record.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title="Issue New Credit / Loan">
      <div className="flex flex-col gap-4">
        <Field label="Borrower Name">
          <Input name="borrower_name" placeholder="e.g. John Doe" value={form.borrower_name} onChange={handle} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Phone Number">
            <Input name="phone" placeholder="07XXXXXXXX or +254..." value={form.phone} onChange={handle} />
          </Field>
          <Field label="Amount (KES)">
            <Input
              type="number"
              name="amount"
              placeholder="0.00"
              value={form.amount}
              onChange={handle}
            />
          </Field>
        </div>

        {/* Live Credibility Assessment Card */}
        {borrowerCredibility && (
          <div className="bg-bg-raised border border-border rounded-xl p-3.5 text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-text-primary flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-purple-light" />
                Borrower Credit Profile Found
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${borrowerCredibility.badgeColor}`}>
                Score: {borrowerCredibility.score}/100 ({borrowerCredibility.rating})
              </span>
            </div>

            <div className="flex items-center justify-between text-text-muted mb-1.5">
              <span>Authorized Credit Limit:</span>
              <span className={`font-bold ${borrowerCredibility.canBorrow ? "text-emerald" : "text-danger"}`}>
                {borrowerCredibility.allowedCreditLimit > 0 ? formatKES(borrowerCredibility.allowedCreditLimit) : "Restricted (KES 0)"}
              </span>
            </div>

            <div className="text-[11px] text-text-muted">
              {borrowerCredibility.paidCount} of {borrowerCredibility.totalLoans} loans settled
              {borrowerCredibility.overdueCount > 0 ? (
                <span className="text-danger font-semibold"> • {borrowerCredibility.overdueCount} currently overdue!</span>
              ) : (
                <span className="text-emerald font-semibold"> • Clean repayment record</span>
              )}
            </div>

            {exceedsRecommended && (
              <div className="mt-2.5 p-2 rounded bg-amber/15 border border-amber/30 text-amber text-[11px] font-medium flex items-center gap-1.5">
                <AlertTriangle size={13} className="shrink-0" />
                <span>
                  Requested KES {requestedAmount.toLocaleString()} exceeds recommended ceiling of KES {borrowerCredibility.allowedCreditLimit.toLocaleString()}.
                </span>
              </div>
            )}
          </div>
        )}

        <Field label="Status">
          <Select name="status" value={form.status} onChange={handle}>
            <option value="active">Active</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </Select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Issue Date">
            <Input type="date" name="issue_date" value={form.issue_date} onChange={handle} />
          </Field>
          <Field label="Due Date">
            <Input type="date" name="due_date" value={form.due_date} onChange={handle} />
          </Field>
        </div>

        <Field label="Note (optional)">
          <Textarea
            name="note"
            rows={2}
            placeholder="Details about items purchased on credit or terms…"
            value={form.note}
            onChange={handle}
          />
        </Field>

        {error && (
          <div className="text-danger text-sm bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div className="flex gap-3 mt-1">
          <Button variant="secondary" onClick={() => { reset(); onClose(); }} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="flex-[2]">
            <Save size={16} /> {saving ? "Saving…" : "Save Loan Record"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
