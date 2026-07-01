import { useState } from "react";
import { Save } from "lucide-react";
import Modal from "./Modal";
import Button from "./Button";
import { Field, Input, Select, Textarea } from "./FormField";

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function AddLoanModal({ open, onClose, onSave }) {
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
    <Modal open={open} onClose={() => { reset(); onClose(); }} title="Record New Loan">
      <div className="flex flex-col gap-4">
        <Field label="Borrower Name">
          <Input name="borrower_name" placeholder="e.g. John Doe" value={form.borrower_name} onChange={handle} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Phone Number">
            <Input name="phone" placeholder="+254..." value={form.phone} onChange={handle} />
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
            rows={3}
            placeholder="Additional details about collateral or terms…"
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