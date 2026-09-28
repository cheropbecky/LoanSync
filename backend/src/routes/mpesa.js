import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { initiateSTKPush, querySTKStatus, getMpesaConfig } from "../lib/mpesa.js";
import { supabaseAdmin } from "../lib/supabaseAdmin.js";

const router = Router();

// GET /api/mpesa/config
// Returns current Daraja environment details and status
router.get("/config", (req, res) => {
  try {
    const config = getMpesaConfig();
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: "Failed to read M-Pesa config." });
  }
});

// POST /api/mpesa/stk-push
// Body: { loanId, phone, amount }
// Triggers an STK push prompt on the borrower's phone for a loan repayment.
router.post("/stk-push", requireAuth, async (req, res) => {
  try {
    const { loanId, phone, amount } = req.body;
    if (!loanId || !phone || !amount) {
      return res.status(400).json({ error: "loanId, phone and amount are required." });
    }

    // Normalize phone to 2547XXXXXXXX or 2541XXXXXXXX format expected by Daraja
    let normalizedPhone = phone.replace(/\s+/g, "").replace(/-/g, "").replace(/^\+/, "");
    if (normalizedPhone.startsWith("0")) {
      normalizedPhone = "254" + normalizedPhone.slice(1);
    } else if (!normalizedPhone.startsWith("254") && normalizedPhone.length === 9) {
      normalizedPhone = "254" + normalizedPhone;
    }

    const result = await initiateSTKPush({
      phone: normalizedPhone,
      amount: Number(amount),
      accountReference: loanId.slice(0, 12),
      description: "Loan Repay",
    });

    // Store the pending checkout request so the callback can match it back to a loan.
    await supabaseAdmin.from("mpesa_transactions").insert({
      loan_id: loanId,
      checkout_request_id: result.CheckoutRequestID,
      merchant_request_id: result.MerchantRequestID,
      phone: normalizedPhone,
      amount: Number(amount),
      status: "pending",
    });

    res.json({
      ...result,
      phone: normalizedPhone,
      amount: Number(amount),
      loanId,
    });
  } catch (err) {
    console.error("[M-Pesa STK Push error]", err?.response?.data || err);
    res.status(500).json({ error: "Failed to initiate M-Pesa STK push." });
  }
});

// POST /api/mpesa/callback
// Public webhook Safaricom calls once the customer completes (or cancels) the prompt.
// No auth — Daraja calls this directly. Configure MPESA_CALLBACK_URL to point here.
router.post("/callback", async (req, res) => {
  try {
    const body = req.body?.Body?.stkCallback;
    if (!body) return res.status(400).json({ error: "Malformed callback." });

    const { CheckoutRequestID, ResultCode, CallbackMetadata } = body;
    const success = ResultCode === 0;

    let mpesaReceipt = null;
    if (success && CallbackMetadata?.Item) {
      const item = CallbackMetadata.Item.find((i) => i.Name === "MpesaReceiptNumber");
      mpesaReceipt = item?.Value || null;
    }

    const { data: txn } = await supabaseAdmin
      .from("mpesa_transactions")
      .update({
        status: success ? "completed" : "failed",
        mpesa_receipt: mpesaReceipt,
        result_code: ResultCode,
      })
      .eq("checkout_request_id", CheckoutRequestID)
      .select()
      .single();

    // If the payment succeeded, mark the linked loan as paid.
    if (success && txn?.loan_id) {
      await supabaseAdmin.from("loans").update({ status: "paid" }).eq("id", txn.loan_id);
    }

    // Safaricom expects a 200 with this exact shape to stop retrying.
    res.json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (err) {
    console.error("[M-Pesa Callback error]", err);
    res.status(500).json({ ResultCode: 1, ResultDesc: "Internal error" });
  }
});

// GET /api/mpesa/status/:checkoutRequestId — poll from the frontend after a push
router.get("/status/:checkoutRequestId", requireAuth, async (req, res) => {
  try {
    const { checkoutRequestId } = req.params;
    const result = await querySTKStatus({ checkoutRequestId });

    const success = result.ResultCode === "0" || result.ResultCode === 0 || result.ResponseCode === "0";
    if (success) {
      // Find and update matching transaction
      const { data: txns } = await supabaseAdmin
        .from("mpesa_transactions")
        .select("*")
        .eq("checkout_request_id", checkoutRequestId);

      const txn = Array.isArray(txns) ? txns[0] : txns;
      if (txn) {
        await supabaseAdmin
          .from("mpesa_transactions")
          .update({
            status: "completed",
            mpesa_receipt: txn.mpesa_receipt || `MP${Date.now().toString().slice(-7)}`,
            result_code: 0,
          })
          .eq("checkout_request_id", checkoutRequestId);

        if (txn.loan_id) {
          await supabaseAdmin.from("loans").update({ status: "paid" }).eq("id", txn.loan_id);
        }
      }
    }

    res.json(result);
  } catch (err) {
    console.error("[M-Pesa Status query error]", err?.response?.data || err);
    res.status(500).json({ error: "Failed to query STK status." });
  }
});

// POST /api/mpesa/confirm-payment
// Manually / immediately confirm a repayment in sandbox mode
router.post("/confirm-payment", requireAuth, async (req, res) => {
  try {
    const { checkoutRequestId, loanId } = req.body;
    if (!loanId) {
      return res.status(400).json({ error: "loanId is required" });
    }

    const receipt = `MP${Date.now().toString().slice(-7)}`;
    if (checkoutRequestId) {
      await supabaseAdmin
        .from("mpesa_transactions")
        .update({ status: "completed", mpesa_receipt: receipt, result_code: 0 })
        .eq("checkout_request_id", checkoutRequestId);
    }

    const { data: updatedLoan, error } = await supabaseAdmin
      .from("loans")
      .update({ status: "paid" })
      .eq("id", loanId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({
      success: true,
      message: "Loan marked as paid via M-Pesa",
      receipt,
      loan: updatedLoan,
    });
  } catch (err) {
    console.error("[M-Pesa Confirm error]", err);
    res.status(500).json({ error: "Failed to confirm payment" });
  }
});

export default router;
