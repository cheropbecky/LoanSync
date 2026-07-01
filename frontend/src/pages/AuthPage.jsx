import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, User, Phone, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Field, Input } from "../components/FormField";
import Button from "../components/Button";

export default function AuthPage() {
  const [mode, setMode] = useState("signin"); // signin | signup
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", location: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);

  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  function handle(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (mode === "signup") {
      if (!form.name || !form.email || !form.phone || !form.password) {
        setError("All fields are required.");
        return;
      }
      if (form.password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
    } else if (!form.email || !form.password) {
      setError("Enter your email and password.");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "signup") {
        const result = await signUp(form);
        // If "Confirm email" is ON in Supabase, signUp() returns no session —
        // the person must click the email link before they can sign in.
        if (!result.session) {
          setConfirmSent(true);
        } else {
          navigate("/dashboard");
        }
      } else {
        await signIn({ email: form.email, password: form.password });
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.message || "Invalid credentials");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg-deep flex items-center justify-center px-5">
      <div className="w-full max-w-[420px]">
        {/* Logo */}
        <div className="text-center mb-9">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald to-emerald-dark items-center justify-center text-3xl font-black text-white mb-3">
            L
          </div>
          <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">LoanSync</h1>
          <p className="text-text-muted text-sm mt-1">Personal loan management, simplified.</p>
        </div>

        <div className="bg-bg-panel border border-border rounded-card shadow-modal p-7">
          {confirmSent ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-3">📩</div>
              <h2 className="text-lg font-extrabold text-text-primary mb-2">Check your email</h2>
              <p className="text-text-muted text-sm mb-5">
                We sent a confirmation link to <span className="text-text-primary font-semibold">{form.email}</span>.
                Click it, then come back here and sign in.
              </p>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => { setConfirmSent(false); setMode("signin"); }}
              >
                Back to Sign In
              </Button>
            </div>
          ) : (
          <>
          {/* Tabs */}
          <div className="flex bg-bg-input rounded-lg p-1 mb-6">
            <button
              onClick={() => { setMode("signin"); setError(""); }}
              className={`flex-1 py-2 rounded-md text-xs font-bold uppercase tracking-wide transition-colors ${
                mode === "signin" ? "bg-purple text-white" : "text-text-muted"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode("signup"); setError(""); }}
              className={`flex-1 py-2 rounded-md text-xs font-bold uppercase tracking-wide transition-colors ${
                mode === "signup" ? "bg-purple text-white" : "text-text-muted"
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === "signup" && (
              <Field label="Full Name">
                <Input
                  icon={<User size={16} />}
                  name="name"
                  placeholder="e.g. Jane Auma"
                  value={form.name}
                  onChange={handle}
                />
              </Field>
            )}

            <Field label="Email Address">
              <Input
                icon={<Mail size={16} />}
                type="email"
                name="email"
                placeholder="you@loansync.app"
                value={form.email}
                onChange={handle}
              />
            </Field>

            {mode === "signup" && (
              <Field label="Phone Number">
                <Input
                  icon={<Phone size={16} />}
                  name="phone"
                  placeholder="07XX XXX XXX"
                  value={form.phone}
                  onChange={handle}
                />
              </Field>
            )}

            <Field
              label={
                <div className="flex justify-between w-full">
                  <span>Password</span>
                  {mode === "signin" && (
                    <span className="text-emerald font-bold cursor-pointer normal-case">Forgot?</span>
                  )}
                </div>
              }
            >
              <div className="relative">
                <Input
                  icon={<Lock size={16} />}
                  type={showPw ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handle}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>

            {error && (
              <div className="flex items-center gap-2 bg-danger/10 border border-danger/25 rounded-lg px-3.5 py-2.5 text-danger text-sm">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <Button type="submit" size="lg" disabled={submitting} className="w-full mt-1">
              {submitting ? "Please wait…" : mode === "signin" ? "Sign In →" : "Create Account →"}
            </Button>
          </form>
          </>
          )}
        </div>

        <p className="text-center text-[11px] text-text-muted mt-6 uppercase tracking-wide">
          Secured by Supabase Auth
        </p>
      </div>
    </div>
  );
}