import { Router } from "express";
import { supabaseAdmin } from "../lib/supabaseAdmin.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// POST /api/payments/cash
// Shop owner records a cash repayment for a loan/credit
router.post("/cash", requireAuth, async (req, res) => {
  try {
    const { loanId, amount, paymentDate, receiptNo, notes } = req.body;
    if (!loanId || !amount) {
      return res.status(400).json({ error: "loanId and amount are required." });
    }

    const payAmount = Number(amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      return res.status(400).json({ error: "Amount must be a positive number." });
    }

    // 1. Fetch the loan
    const { data: loan, error: loanErr } = await supabaseAdmin
      .from("loans")
      .select("*")
      .eq("id", loanId)
      .single();

    if (loanErr || !loan) {
      return res.status(404).json({ error: "Loan record not found." });
    }

    const currentAmount = Number(loan.amount || 0);
    const effectivePaymentDate = paymentDate || new Date().toISOString().slice(0, 10);
    const generatedReceipt = receiptNo || `CSH-${Date.now().toString().slice(-6)}`;

    // If payment covers the full loan amount or marks it cleared
    const isFullSettlement = payAmount >= currentAmount;
    const newStatus = isFullSettlement ? "paid" : (loan.status || "active");
    const updatedNote = notes
      ? `${loan.note ? loan.note + " | " : ""}Cash Paid: KES ${payAmount} on ${effectivePaymentDate} (${generatedReceipt})`
      : loan.note;

    // 2. Update loan record in Supabase / mock store
    const { data: updatedLoan, error: updateErr } = await supabaseAdmin
      .from("loans")
      .update({
        status: newStatus,
        note: updatedNote,
      })
      .eq("id", loanId)
      .select()
      .single();

    if (updateErr) {
      console.warn("[Cash Payment] Error updating loan:", updateErr.message);
    }

    // 3. Record transaction in cash_transactions
    const cashRecord = {
      id: `cash-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      loan_id: loanId,
      shop_id: loan.shop_id,
      borrower_name: loan.borrower_name,
      phone: loan.phone,
      amount: payAmount,
      payment_date: effectivePaymentDate,
      receipt_no: generatedReceipt,
      notes: notes || "Cash payment received in shop counter",
      payment_method: "cash",
      created_at: new Date().toISOString(),
    };

    try {
      await supabaseAdmin.from("cash_transactions").insert(cashRecord);
    } catch (insertErr) {
      console.warn("[Cash Payment] Note on cash_transactions insert:", insertErr.message);
    }

    res.json({
      success: true,
      message: `Cash repayment of KES ${payAmount.toLocaleString()} recorded successfully.`,
      receipt: generatedReceipt,
      payment: cashRecord,
      loan: updatedLoan || { ...loan, status: newStatus, note: updatedNote },
      isFullSettlement,
    });
  } catch (err) {
    console.error("[Cash Payment Error]", err);
    res.status(500).json({ error: "Failed to record cash transaction." });
  }
});

// GET /api/payments/shop/:shopId
// Get all cash and mpesa payments for a shop
router.get("/shop/:shopId", requireAuth, async (req, res) => {
  try {
    const { shopId } = req.params;

    // Fetch cash transactions
    let cashTxns = [];
    try {
      const { data } = await supabaseAdmin
        .from("cash_transactions")
        .select("*")
        .eq("shop_id", shopId)
        .order("created_at", { ascending: false });
      if (data) cashTxns = data;
    } catch {
      cashTxns = [];
    }

    // Also fetch completed M-Pesa transactions linked to this shop's loans
    let mpesaTxns = [];
    try {
      const { data: mpesaData } = await supabaseAdmin
        .from("mpesa_transactions")
        .select("*")
        .order("created_at", { ascending: false });
      if (mpesaData) {
        mpesaTxns = mpesaData.filter((m) => m.status === "completed");
      }
    } catch {
      mpesaTxns = [];
    }

    res.json({
      cash: cashTxns,
      mpesa: mpesaTxns,
    });
  } catch (err) {
    console.error("[Get Shop Payments Error]", err);
    res.status(500).json({ error: "Failed to load payments history." });
  }
});

export default router;
