import { Router } from "express";
import { supabaseAdmin } from "../lib/supabaseAdmin.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth, requireAdmin);

// Computes effective status the same way the frontend does:
// a loan past its due date and not paid is treated as overdue even if
// nobody has flipped the status flag yet.
function effectiveStatus(loan) {
  if (loan.status === "paid") return "paid";
  if (loan.due_date) {
    const due = new Date(loan.due_date);
    const today = new Date();
    due.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    if (today > due) return "overdue";
  }
  return loan.status || "active";
}

async function getAllShopsWithLoans() {
  const { data: shops, error: shopsErr } = await supabaseAdmin
    .from("shops")
    .select("id, name, phone, email, location, role, created_at")
    .neq("role", "admin")
    .order("created_at", { ascending: false });
  if (shopsErr) throw shopsErr;

  const { data: loans, error: loansErr } = await supabaseAdmin
    .from("loans")
    .select("*");
  if (loansErr) throw loansErr;

  const decorated = loans.map((l) => ({ ...l, _status: effectiveStatus(l) }));

  return shops.map((shop) => {
    const shopLoans = decorated.filter((l) => l.shop_id === shop.id);
    const total = shopLoans.reduce((s, l) => s + Number(l.amount), 0);
    const outstanding = shopLoans.filter((l) => l._status === "active").reduce((s, l) => s + Number(l.amount), 0);
    const recovered = shopLoans.filter((l) => l._status === "paid").reduce((s, l) => s + Number(l.amount), 0);
    const overdueLoans = shopLoans.filter((l) => l._status === "overdue");
    const overdueAmount = overdueLoans.reduce((s, l) => s + Number(l.amount), 0);

    return {
      id: shop.id,
      name: shop.name,
      phone: shop.phone,
      email: shop.email,
      location: shop.location,
      total,
      outstanding,
      recovered,
      overdueAmount,
      overdueCount: overdueLoans.length,
      loanCount: shopLoans.length,
      loans: shopLoans,
    };
  });
}

// GET /api/admin/overview — global totals + top-ranked shops
router.get("/overview", async (req, res) => {
  try {
    const shops = await getAllShopsWithLoans();

    const totalPortfolio = shops.reduce((s, sh) => s + sh.total, 0);
    const outstanding = shops.reduce((s, sh) => s + sh.outstanding, 0);
    const recovered = shops.reduce((s, sh) => s + sh.recovered, 0);
    const overdueAmount = shops.reduce((s, sh) => s + sh.overdueAmount, 0);
    const overdueCount = shops.reduce((s, sh) => s + sh.overdueCount, 0);
    const loanCount = shops.reduce((s, sh) => s + sh.loanCount, 0);
    const recoveryRate = totalPortfolio > 0 ? Math.round((recovered / totalPortfolio) * 100) : 0;

    const ranking = [...shops]
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
      .map(({ loans, ...rest }) => rest);

    res.json({
      totals: {
        totalPortfolio,
        outstanding,
        recovered,
        overdueAmount,
        overdueCount,
        activeShops: shops.length,
        loanCount,
        recoveryRate,
      },
      ranking,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to compute admin overview." });
  }
});

// GET /api/admin/shops — full shop directory with computed metrics
router.get("/shops", async (req, res) => {
  try {
    const shops = await getAllShopsWithLoans();
    res.json(shops.map(({ loans, ...rest }) => rest));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load shops." });
  }
});

// GET /api/admin/shops/:shopId — single shop + its loans
router.get("/shops/:shopId", async (req, res) => {
  try {
    const { shopId } = req.params;
    const { data: shop, error: shopErr } = await supabaseAdmin
      .from("shops")
      .select("id, name, phone, email, location, created_at")
      .eq("id", shopId)
      .single();
    if (shopErr) throw shopErr;

    const { data: loans, error: loansErr } = await supabaseAdmin
      .from("loans")
      .select("*")
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false });
    if (loansErr) throw loansErr;

    res.json({ shop, loans });
  } catch (err) {
    console.error(err);
    res.status(404).json({ error: "Shop not found." });
  }
});

// GET /api/admin/alerts — every overdue loan, network-wide, with shop attribution
router.get("/alerts", async (req, res) => {
  try {
    const shops = await getAllShopsWithLoans();
    const allOverdue = shops.flatMap((shop) =>
      shop.loans
        .filter((l) => l._status === "overdue")
        .map((l) => {
          const daysLate = Math.round(
            (new Date().setHours(0, 0, 0, 0) - new Date(l.due_date).setHours(0, 0, 0, 0)) /
              (1000 * 60 * 60 * 24)
          );
          return {
            id: l.id,
            shopName: shop.name,
            borrowerName: l.borrower_name,
            phone: l.phone,
            amount: Number(l.amount),
            dueDate: l.due_date,
            daysLate,
          };
        })
    );

    allOverdue.sort((a, b) => b.daysLate - a.daysLate);

    const totalOverdue = allOverdue.reduce((s, a) => s + a.amount, 0);
    const avgDelayDays = allOverdue.length
      ? Math.round(allOverdue.reduce((s, a) => s + a.daysLate, 0) / allOverdue.length)
      : 0;

    const totalPortfolio = shops.reduce((s, sh) => s + sh.total, 0);
    const totalRecovered = shops.reduce((s, sh) => s + sh.recovered, 0);
    const recoveryRate = totalPortfolio > 0 ? Math.round((totalRecovered / totalPortfolio) * 100) : 0;

    res.json({
      alerts: allOverdue,
      summary: { totalOverdue, avgDelayDays, recoveryRate },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load alerts." });
  }
});

// GET /api/admin/pending-shops — list shops registered by admin, not yet claimed
router.get("/pending-shops", async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("pending_shops")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load pending shops." });
  }
});

// POST /api/admin/pending-shops — admin pre-registers a shop's details.
// Body: { name, phone, location, email }
// The shop owner claims it automatically the moment they sign up with a
// matching email or phone (see handle_new_user() trigger in Supabase).
router.post("/pending-shops", async (req, res) => {
  try {
    const { name, phone, location, email } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ error: "Shop name and phone are required." });
    }

    const { data, error } = await supabaseAdmin
      .from("pending_shops")
      .insert({ name, phone, location: location || null, email: email || null, created_by: req.user.id })
      .select()
      .single();
    if (error) throw error;

    res.status(201).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to register shop." });
  }
});

export default router;