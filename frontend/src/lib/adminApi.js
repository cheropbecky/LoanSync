import { supabase } from "./supabaseClient";

const API_BASE = import.meta.env.VITE_API_URL || "";

async function authHeader() {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchAdminOverview() {
  const headers = await authHeader();
  const res = await fetch(`${API_BASE}/api/admin/overview`, { headers });
  if (!res.ok) throw new Error("Failed to load admin overview");
  return res.json();
}

export async function fetchAdminShops() {
  const headers = await authHeader();
  const res = await fetch(`${API_BASE}/api/admin/shops`, { headers });
  if (!res.ok) throw new Error("Failed to load shops");
  return res.json();
}

export async function fetchShopDetail(shopId) {
  const headers = await authHeader();
  const res = await fetch(`${API_BASE}/api/admin/shops/${shopId}`, { headers });
  if (!res.ok) throw new Error("Failed to load shop detail");
  return res.json();
}

export async function fetchPendingShops() {
  const headers = await authHeader();
  const res = await fetch(`${API_BASE}/api/admin/pending-shops`, { headers });
  if (!res.ok) throw new Error("Failed to load pending shops");
  return res.json();
}

export async function registerShop({ name, phone, location, email }) {
  const headers = await authHeader();
  const res = await fetch(`${API_BASE}/api/admin/pending-shops`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ name, phone, location, email }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Failed to register shop");
  }
  return res.json();
}

export async function fetchAdminAlerts() {
  const headers = await authHeader();
  const res = await fetch(`${API_BASE}/api/admin/alerts`, { headers });
  if (!res.ok) throw new Error("Failed to load alerts");
  return res.json();
}

// Safaricom Daraja M-Pesa APIs
export async function fetchMpesaConfig() {
  const res = await fetch(`${API_BASE}/api/mpesa/config`);
  if (!res.ok) throw new Error("Failed to load M-Pesa config");
  return res.json();
}

export async function initiateMpesaSTKPush({ loanId, phone, amount }) {
  const headers = await authHeader();
  const res = await fetch(`${API_BASE}/api/mpesa/stk-push`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ loanId, phone, amount }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Failed to initiate M-Pesa payment");
  }
  return res.json();
}

export async function fetchMpesaStatus(checkoutRequestId) {
  const headers = await authHeader();
  const res = await fetch(`${API_BASE}/api/mpesa/status/${checkoutRequestId}`, { headers });
  if (!res.ok) throw new Error("Failed to poll M-Pesa payment status");
  return res.json();
}

export async function confirmMpesaPayment({ checkoutRequestId, loanId }) {
  const headers = await authHeader();
  const res = await fetch(`${API_BASE}/api/mpesa/confirm-payment`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ checkoutRequestId, loanId }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Failed to confirm payment");
  }
  return res.json();
}
