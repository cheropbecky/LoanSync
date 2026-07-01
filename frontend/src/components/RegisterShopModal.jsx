import { useState } from "react";
import { Save } from "lucide-react";
import Modal from "./Modal";
import Button from "./Button";
import { Field, Input } from "./FormField";

export default function RegisterShopModal({ open, onClose, onSave }) {
  const [form, setForm] = useState({ name: "", phone: "", location: "", email: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function handle(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError("");
  }

  function reset() {
    setForm({ name: "", phone: "", location: "", email: "" });
    setError("");
  }

  async function handleSave() {
    if (!form.name || !form.phone) {
      setError("Shop name and phone number are required.");
      return;
    }
    setSaving(true);
    try {
      await onSave(form);
      reset();
      onClose();
    } catch (err) {
      setError(err.message || "Could not register shop.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title="Register New Shop">
      <div className="flex flex-col gap-4">
        <p className="text-text-muted text-sm -mt-1">
          Enter the shop's details now. The owner will automatically be linked to this
          record the moment they sign up using this phone number or email.
        </p>

        <Field label="Shop Name">
          <Input name="name" placeholder="e.g. Mama Njeri Shop" value={form.name} onChange={handle} />
        </Field>

        <Field label="Phone Number">
          <Input name="phone" placeholder="07XX XXX XXX" value={form.phone} onChange={handle} />
        </Field>

        <Field label="Location (optional)">
          <Input name="location" placeholder="e.g. Gikomba, Nairobi" value={form.location} onChange={handle} />
        </Field>

        <Field label="Email (optional — matches faster if known)">
          <Input type="email" name="email" placeholder="shop@example.com" value={form.email} onChange={handle} />
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
            <Save size={16} /> {saving ? "Registering…" : "Register Shop"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}