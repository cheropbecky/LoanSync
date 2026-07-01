export function formatKES(amount) {
  const n = Number(amount || 0);
  return (
    "KES " +
    n.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  );
}

export function formatCompactKES(amount) {
  const n = Number(amount || 0);
  if (n >= 1_000_000) return "KES " + (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return "KES " + (n / 1_000).toFixed(1) + "K";
  return formatKES(n);
}

export function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "2-digit" });
}

export function initialsFromName(name = "") {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function daysBetween(dateA, dateB = new Date()) {
  const a = new Date(dateA);
  const b = new Date(dateB);
  return Math.round((b.setHours(0, 0, 0, 0) - a.setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24));
}

// Positive number = days overdue. Loans already marked "paid" are never overdue.
export function daysOverdue(dueDate, status) {
  if (!dueDate || status === "paid") return 0;
  const d = daysBetween(dueDate);
  return d > 0 ? d : 0;
}

// Derives the *effective* status: if a loan is "active" but past its due date, show it as overdue
// even before anyone manually flips the status flag.
export function effectiveStatus(loan) {
  if (loan.status === "paid") return "paid";
  if (daysOverdue(loan.due_date, loan.status) > 0) return "overdue";
  return loan.status || "active";
}