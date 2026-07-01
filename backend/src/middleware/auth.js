import { supabaseAdmin } from "../lib/supabaseAdmin.js";

// Verifies the bearer token against Supabase Auth and attaches `req.user`.
export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Missing authorization token." });
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }

  req.user = data.user;
  next();
}

// Must run after requireAuth. Confirms the caller's `shops` row has role = 'admin'.
export async function requireAdmin(req, res, next) {
  const { data, error } = await supabaseAdmin
    .from("shops")
    .select("role")
    .eq("owner_id", req.user.id)
    .single();

  if (error || data?.role !== "admin") {
    return res.status(403).json({ error: "Admin access required." });
  }

  next();
}