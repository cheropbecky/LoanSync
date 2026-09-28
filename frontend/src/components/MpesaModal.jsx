import { useState, useEffect } from "react";
import { CheckCircle2, AlertCircle, Smartphone, ArrowRight, ShieldCheck, RefreshCw } from "lucide-react";
import Modal from "./Modal";
import Button from "./Button";
import FormField from "./FormField";
import { initiateMpesaSTKPush, fetchMpesaStatus, confirmMpesaPayment, fetchMpesaConfig } from "../lib/adminApi";
import { formatKES } from "../lib/format";

export default function MpesaModal({ open, onClose, loan, onPaymentSuccess }) {
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [config, setConfig] = useState(null);
  const [step, setStep] = useState("form"); // "form" | "sending" | "prompt_sent" | "success" | "error"
  const [errorMessage, setErrorMessage] = useState("");
  const [checkoutRequestId, setCheckoutRequestId] = useState("");
  const [simulatedPin, setSimulatedPin] = useState("1234");
  const [receiptNumber, setReceiptNumber] = useState("");
  const [pollingCount, setPollingCount] = useState(0);

  useEffect(() => {
    if (loan) {
      setPhone(loan.phone || "");
      setAmount(String(loan.amount || ""));
      setStep("form");
      setErrorMessage("");
      setCheckoutRequestId("");
      setReceiptNumber("");
      setPollingCount(0);
    }
  }, [loan, open]);

  useEffect(() => {
    if (open) {
      fetchMpesaConfig()
        .then((cfg) => setConfig(cfg))
        .catch(() => {});
    }
  }, [open]);

  // Polling loop when prompt is sent
  useEffect(() => {
    let timer;
    if (step === "prompt_sent" && checkoutRequestId) {
      timer = setInterval(async () => {
        setPollingCount((prev) => prev + 1);
        try {
          const res = await fetchMpesaStatus(checkoutRequestId);
          if (res.ResultCode === "0" || res.ResultCode === 0) {
            clearInterval(timer);
            setReceiptNumber(res.mpesa_receipt || `NLX${Date.now().toString().slice(-7)}`);
            setStep("success");
            onPaymentSuccess?.(loan.id);
          }
        } catch {
          // Keep polling or wait
        }
      }, 3000);
    }
    return () => clearInterval(timer);
  }, [step, checkoutRequestId, loan, onPaymentSuccess]);

  if (!loan) return null;

  async function handleSendPush(e) {
    e.preventDefault();
    if (!phone || !amount) {
      setErrorMessage("Please enter both phone number and repayment amount.");
      return;
    }

    setStep("sending");
    setErrorMessage("");

    try {
      const res = await initiateMpesaSTKPush({
        loanId: loan.id,
        phone,
        amount: Number(amount),
      });

      if (res.ResponseCode === "0" || res.CheckoutRequestID) {
        setCheckoutRequestId(res.CheckoutRequestID);
        setStep("prompt_sent");
      } else {
        throw new Error(res.ResponseDescription || "Failed to trigger STK push");
      }
    } catch (err) {
      setErrorMessage(err.message || "Unable to send STK push prompt.");
      setStep("error");
    }
  }

  async function handleSimulateApprove() {
    try {
      setStep("sending");
      const res = await confirmMpesaPayment({
        checkoutRequestId,
        loanId: loan.id,
      });
      setReceiptNumber(res.receipt || `NLX${Date.now().toString().slice(-7)}`);
      setStep("success");
      onPaymentSuccess?.(loan.id);
    } catch (err) {
      setErrorMessage(err.message || "Failed to confirm payment simulation.");
      setStep("prompt_sent");
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        if (step !== "sending") onClose();
      }}
      title="M-Pesa Daraja STK Push Repayment"
      maxWidth="max-w-[500px]"
    >
      {/* Sandbox Badge */}
      <div className="flex items-center justify-between p-3 mb-5 rounded-lg bg-emerald/10 border border-emerald/25">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald animate-pulse" />
          <div>
            <div className="text-xs font-bold text-emerald">
              Safaricom Daraja {config?.environment ? config.environment.toUpperCase() : "SANDBOX"}
            </div>
            <div className="text-[11px] text-text-muted">
              Shortcode: <span className="font-semibold text-text-primary">{config?.shortcode || "174379"}</span> • Lipa Na M-Pesa Online
            </div>
          </div>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald/20 text-emerald uppercase tracking-wider">
          Passkey Ready
        </span>
      </div>

      {/* Loan Details Banner */}
      <div className="bg-bg-raised/70 border border-border rounded-lg p-3.5 mb-5 flex items-center justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-wide font-bold text-text-muted">Borrower</div>
          <div className="text-sm font-bold text-text-primary">{loan.borrower_name}</div>
          <div className="text-xs text-text-muted">{loan.phone}</div>
        </div>
        <div className="text-right">
          <div className="text-[11px] uppercase tracking-wide font-bold text-text-muted">Balance Due</div>
          <div className="text-base font-extrabold text-emerald">{formatKES(loan.amount)}</div>
        </div>
      </div>

      {step === "form" && (
        <form onSubmit={handleSendPush} className="flex flex-col gap-4">
          <FormField label="Borrower M-Pesa Phone Number" required>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 0712345678 or 254712345678"
              className="w-full bg-bg-input border border-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary focus:outline-none focus:border-emerald transition-colors"
              required
            />
            <span className="text-[11px] text-text-muted mt-1 block">
              Format: 07XXXXXXXX or 2547XXXXXXXX
            </span>
          </FormField>

          <FormField label="Repayment Amount (KES)" required>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-bg-input border border-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary focus:outline-none focus:border-emerald transition-colors font-semibold"
              required
            />
          </FormField>

          {errorMessage && (
            <div className="flex items-center gap-2 p-3 text-xs rounded-lg bg-danger/10 border border-danger/25 text-danger">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-2">
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              <Smartphone size={16} /> Send STK Prompt
            </Button>
          </div>
        </form>
      )}

      {step === "sending" && (
        <div className="py-10 text-center flex flex-col items-center">
          <RefreshCw size={36} className="text-emerald animate-spin mb-4" />
          <h4 className="text-base font-bold text-text-primary mb-1">Connecting to Safaricom Daraja...</h4>
          <p className="text-xs text-text-muted max-w-xs">
            Initiating Lipa Na M-Pesa Online STK Push request to shortcode {config?.shortcode || "174379"}...
          </p>
        </div>
      )}

      {step === "prompt_sent" && (
        <div className="flex flex-col gap-4">
          <div className="bg-[#0c2419] border border-emerald/40 rounded-xl p-4 text-center relative overflow-hidden">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald/20 text-emerald mb-2">
              <Smartphone size={24} />
            </div>
            <h4 className="text-sm font-bold text-emerald mb-1">STK Push Prompt Dispatched!</h4>
            <p className="text-xs text-text-muted mb-3">
              Prompt sent to <span className="text-text-primary font-semibold">{phone}</span> for{" "}
              <span className="text-emerald font-bold">{formatKES(amount)}</span>.
            </p>

            {/* Simulated Phone Screen */}
            <div className="bg-bg-deep border border-emerald/30 rounded-lg p-3 text-left font-mono text-[11px] text-text-primary shadow-inner">
              <div className="text-emerald font-bold mb-1 border-b border-border/60 pb-1">
                📱 Safaricom M-PESA Prompt
              </div>
              <div className="text-text-muted mb-0.5">Do you want to pay:</div>
              <div className="font-bold text-emerald">KES {amount}</div>
              <div className="text-text-muted">To Paybill: {config?.shortcode || "174379"}</div>
              <div className="text-text-muted">Account: {loan.id.slice(0, 10)}</div>
              <div className="mt-2 text-xs flex items-center justify-between bg-bg-panel px-2 py-1 rounded border border-border">
                <span className="text-text-muted">M-Pesa PIN:</span>
                <span className="font-bold text-sky">••••</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-text-muted px-1">
            <span className="flex items-center gap-1.5">
              <RefreshCw size={12} className="animate-spin text-emerald" />
              Listening for Safaricom callback ({pollingCount}s)...
            </span>
            <span className="font-mono text-[10px] text-text-muted">ID: {checkoutRequestId.slice(-8)}</span>
          </div>

          {/* Sandbox Approval helper */}
          <div className="bg-bg-raised border border-border rounded-lg p-3.5 flex flex-col gap-2">
            <div className="text-[11px] font-bold text-text-primary flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald" /> Daraja Sandbox Action:
            </div>
            <p className="text-[11px] text-text-muted">
              Since you are in Daraja Sandbox mode, you can immediately simulate customer PIN entry and completion:
            </p>
            <button
              onClick={handleSimulateApprove}
              className="w-full py-2.5 rounded-lg bg-emerald hover:bg-emerald-dark font-bold text-xs text-white transition-all shadow-glow flex items-center justify-center gap-2"
            >
              Simulate PIN & Approve Repayment <ArrowRight size={14} />
            </button>
          </div>

          <div className="flex justify-end gap-2 mt-1">
            <Button variant="secondary" onClick={onClose}>
              Dismiss & Track in Background
            </Button>
          </div>
        </div>
      )}

      {step === "success" && (
        <div className="py-6 text-center flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-emerald/20 text-emerald flex items-center justify-center mb-3">
            <CheckCircle2 size={32} />
          </div>
          <h4 className="text-lg font-extrabold text-text-primary mb-1">Repayment Received!</h4>
          <p className="text-xs text-text-muted max-w-sm mb-4">
            M-Pesa transaction confirmed successfully. The loan status has been updated to{" "}
            <span className="text-emerald font-bold">PAID</span>.
          </p>

          <div className="bg-bg-raised border border-border rounded-lg p-3 w-full text-left text-xs mb-5 font-mono">
            <div className="flex justify-between py-1 border-b border-border/50">
              <span className="text-text-muted">Receipt Number:</span>
              <span className="font-bold text-emerald">{receiptNumber}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/50">
              <span className="text-text-muted">Amount Paid:</span>
              <span className="font-bold text-text-primary">{formatKES(amount)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-text-muted">Shortcode:</span>
              <span className="text-text-primary">{config?.shortcode || "174379"}</span>
            </div>
          </div>

          <Button variant="primary" onClick={onClose} className="w-full">
            Done
          </Button>
        </div>
      )}

      {step === "error" && (
        <div className="py-6 text-center flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-danger/20 text-danger flex items-center justify-center mb-3">
            <AlertCircle size={32} />
          </div>
          <h4 className="text-base font-bold text-text-primary mb-1">STK Push Request Failed</h4>
          <p className="text-xs text-text-muted max-w-xs mb-5">{errorMessage}</p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
            <Button variant="primary" onClick={() => setStep("form")}>
              Try Again
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
