import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { initiateSTKPush, querySTKStatus } from "../lib/mpesa.js";
import { supabaseAdmin } from "../lib/supabaseAdmin.js";

const router = Router();

// POST /api/mpesa/stk-push
// Body: { loanId, phone, amount }
// Triggers an STK push prompt on the borrower's phone for a loan repayment.
router.post("/stk-push", requireAuth, async (req, res) => {
  try {
    const { loanId, phone, amount } = req.body;
    if (!loanId || !phone || !amount) {
      return res.status(400).json({ error: "loanId, phone and amount are required." });
    }

    // Normalize phone to 2547XXXXXXXX format expected by Daraja.
    const normalizedPhone = phone.replace(/^0/, "254").replace(/^\+/, "").replace(/\s+/g, "");

    const result = await initiateSTKPush({
      phone: normalizedPhone,
      amount,
      accountReference: loanId,
      description: "Loan Repay",
    });

    // Store the pending checkout request so the callback can match it back to a loan.
    await supabaseAdmin.from("mpesa_transactions").insert({
      loan_id: loanId,
      checkout_request_id: result.CheckoutRequestID,
      merchant_request_id: result.MerchantRequestID,
      phone: normalizedPhone,
      amount,
      status: "pending",
    });

    res.json(result);
  } catch (err) {
    console.error(err?.response?.data || err);
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
    console.error(err);
    res.status(500).json({ ResultCode: 1, ResultDesc: "Internal error" });
  }
});

// GET /api/mpesa/status/:checkoutRequestId — poll from the frontend after a push
router.get("/status/:checkoutRequestId", requireAuth, async (req, res) => {
  try {
    const result = await querySTKStatus({ checkoutRequestId: req.params.checkoutRequestId });
    res.json(result);
  } catch (err) {
    console.error(err?.response?.data || err);
    res.status(500).json({ error: "Failed to query STK status." });
  }
});

export default router;