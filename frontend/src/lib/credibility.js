// Credibility & Credit Limit Engine
// Rates the creditworthiness of borrowers based on their repayment history

export function computeCustomerCredibility(loans = []) {
  if (!loans || loans.length === 0) {
    return {
      score: 55,
      tier: "New / Unrated",
      rating: "B-",
      badgeColor: "text-text-muted bg-bg-raised border-border",
      allowedCreditLimit: 5000,
      allowedCreditLabel: "KES 5,000 (Starter Limit)",
      canBorrow: true,
      onTimeRate: 100,
      totalLoans: 0,
      totalBorrowed: 0,
      totalRepaid: 0,
      totalOutstanding: 0,
      totalOverdue: 0,
      overdueCount: 0,
      paidCount: 0,
      activeCount: 0,
      summary: "First-time borrower with default starter credit limit.",
    };
  }

  const totalLoans = loans.length;
  const totalBorrowed = loans.reduce((sum, l) => sum + Number(l.amount || 0), 0);
  const paidLoans = loans.filter((l) => (l._status || l.status) === "paid");
  const overdueLoans = loans.filter((l) => (l._status || l.status) === "overdue");
  const activeLoans = loans.filter((l) => (l._status || l.status) === "active");

  const paidCount = paidLoans.length;
  const overdueCount = overdueLoans.length;
  const activeCount = activeLoans.length;

  const totalRepaid = paidLoans.reduce((sum, l) => sum + Number(l.amount || 0), 0);
  const totalOutstanding = activeLoans.reduce((sum, l) => sum + Number(l.amount || 0), 0);
  const totalOverdue = overdueLoans.reduce((sum, l) => sum + Number(l.amount || 0), 0);

  // Check punctuality: paid on or before due date
  const onTimePaidCount = paidLoans.filter((l) => {
    if (!l.due_date) return true;
    if (l.paid_at) {
      return new Date(l.paid_at) <= new Date(l.due_date);
    }
    return true;
  }).length;

  const onTimeRate = paidCount > 0 ? Math.round((onTimePaidCount / paidCount) * 100) : 100;

  // Base score 60
  let score = 60;

  // Positive score increments for settled loans
  score += Math.min(paidCount * 10, 30);

  // Punctuality adjustments
  if (paidCount >= 1 && onTimeRate >= 80) {
    score += 10;
  }

  // Heavy penalties for active overdue loans
  score -= overdueCount * 30;

  // Additional penalty for high overdue ratio
  if (overdueCount > 0) {
    score = Math.min(score, 45);
  }

  // Bounds
  score = Math.max(10, Math.min(100, Math.round(score)));

  let tier = "";
  let rating = "";
  let badgeColor = "";
  let allowedCreditLimit = 0;
  let allowedCreditLabel = "";
  let canBorrow = true;
  let summary = "";

  if (score >= 85) {
    tier = "Tier 1: Excellent Credibility";
    rating = "AAA";
    badgeColor = "text-emerald bg-emerald/15 border-emerald/30";
    allowedCreditLimit = Math.max(50000, Math.round(totalRepaid * 1.5));
    allowedCreditLabel = `KES ${allowedCreditLimit.toLocaleString()} (High Credit Authorized)`;
    canBorrow = true;
    summary = "Flawless payment track record. Highly recommended for maximum credit expansion.";
  } else if (score >= 70) {
    tier = "Tier 2: Good Credibility";
    rating = "AA";
    badgeColor = "text-sky bg-sky/15 border-sky/30";
    allowedCreditLimit = Math.max(25000, Math.round(totalRepaid * 1.2));
    allowedCreditLabel = `KES ${allowedCreditLimit.toLocaleString()} (Expanded Credit)`;
    canBorrow = true;
    summary = "Reliable borrower with proven repayment history. Authorized for standard & expanded credits.";
  } else if (score >= 50) {
    tier = "Tier 3: Moderate Credibility";
    rating = "B";
    badgeColor = "text-amber bg-amber/15 border-amber/30";
    allowedCreditLimit = 10000;
    allowedCreditLabel = "KES 10,000 (Standard Limit)";
    canBorrow = true;
    summary = "Moderate repayment history. Standard borrowing limits recommended.";
  } else if (score >= 35) {
    tier = "Tier 4: Cautionary Credibility";
    rating = "C";
    badgeColor = "text-orange-400 bg-orange-400/15 border-orange-400/30";
    allowedCreditLimit = 3000;
    allowedCreditLabel = "KES 3,000 (Strict Micro-Limit)";
    canBorrow = overdueCount === 0;
    summary = "Repayment delays detected. Require shorter terms and low credit ceiling.";
  } else {
    tier = "Tier 5: High Risk / Delinquent";
    rating = "D - High Risk";
    badgeColor = "text-danger bg-danger/15 border-danger/30";
    allowedCreditLimit = 0;
    allowedCreditLabel = "KES 0 (Credit Restricted)";
    canBorrow = false;
    summary = "Delinquent / Overdue history detected. No new credits should be issued until existing balances are fully cleared.";
  }

  return {
    score,
    tier,
    rating,
    badgeColor,
    allowedCreditLimit,
    allowedCreditLabel,
    canBorrow,
    onTimeRate,
    totalLoans,
    totalBorrowed,
    totalRepaid,
    totalOutstanding,
    totalOverdue,
    overdueCount,
    paidCount,
    activeCount,
    summary,
  };
}
