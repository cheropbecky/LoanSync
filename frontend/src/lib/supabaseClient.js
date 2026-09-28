import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith("http") &&
  supabaseUrl !== "https://your-project.supabase.co"
);

// In-memory mock store for demo / offline mode
const STORAGE_PREFIX = "loansync_demo_";
function getStored(key, fallback) {
  try {
    const val = localStorage.getItem(STORAGE_PREFIX + key);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
}
function setStored(key, val) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(val));
  } catch {
    // Ignore storage quota errors
  }
}

const INITIAL_SHOPS = [
  {
    id: "shop-demo-1",
    owner_id: "user-shop-1",
    name: "Auma Retail & Groceries",
    email: "shop@loansync.app",
    phone: "0712345678",
    location: "Nairobi Central",
    role: "shop",
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: "shop-admin-1",
    owner_id: "user-admin-1",
    name: "LoanSync HQ Admin",
    email: "admin@loansync.app",
    phone: "0700000000",
    location: "Nairobi HQ",
    role: "admin",
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
];

const INITIAL_LOANS = [
  {
    id: "loan-1",
    shop_id: "shop-demo-1",
    borrower_name: "Peter Mwangi",
    phone: "0722112233",
    amount: 15000,
    issue_date: new Date(Date.now() - 15 * 86400000).toISOString().slice(0, 10),
    due_date: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
    status: "active",
    note: "Shop inventory purchase",
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: "loan-2",
    shop_id: "shop-demo-1",
    borrower_name: "Grace Wanjiku",
    phone: "0733445566",
    amount: 25000,
    issue_date: new Date(Date.now() - 40 * 86400000).toISOString().slice(0, 10),
    due_date: new Date(Date.now() - 10 * 86400000).toISOString().slice(0, 10),
    status: "paid",
    note: "Farm input supplies",
    created_at: new Date(Date.now() - 40 * 86400000).toISOString(),
  },
  {
    id: "loan-3",
    shop_id: "shop-demo-1",
    borrower_name: "David Ochieng",
    phone: "0799887766",
    amount: 8500,
    issue_date: new Date(Date.now() - 35 * 86400000).toISOString().slice(0, 10),
    due_date: new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10),
    status: "overdue",
    note: "Quick cash advance",
    created_at: new Date(Date.now() - 35 * 86400000).toISOString(),
  },
  {
    id: "loan-4",
    shop_id: "shop-demo-1",
    borrower_name: "Faith Chebet",
    phone: "0744556677",
    amount: 12000,
    issue_date: new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10),
    due_date: new Date(Date.now() + 25 * 86400000).toISOString().slice(0, 10),
    status: "active",
    note: "Boutique restock",
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];

function createMockSupabaseClient() {
  console.info("[LoanSync] Running in demo mode with in-memory persistence. To use real Supabase, set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");

  let currentUser = getStored("current_user", null);
  const listeners = new Set();

  function notifyAuth(event, session) {
    listeners.forEach((fn) => fn(event, session));
  }

  function getSession() {
    if (!currentUser) return { session: null };
    return {
      session: {
        access_token: currentUser.role === "admin" ? "demo-admin-token" : "demo-shop-token",
        user: currentUser,
      },
    };
  }

  return {
    auth: {
      async getSession() {
        return { data: getSession() };
      },
      onAuthStateChange(callback) {
        listeners.add(callback);
        return {
          data: {
            subscription: {
              unsubscribe: () => listeners.delete(callback),
            },
          },
        };
      },
      async signUp({ email, password, options }) {
        const id = "user-" + Math.random().toString(36).slice(2, 9);
        const name = options?.data?.full_name || email.split("@")[0];
        const phone = options?.data?.phone || "0700000000";
        const role = email.toLowerCase().includes("admin") ? "admin" : "shop";

        currentUser = { id, email, role, user_metadata: { full_name: name, phone } };
        setStored("current_user", currentUser);

        // Auto-create matching shop
        const shops = getStored("shops", INITIAL_SHOPS);
        const newShop = {
          id: "shop-" + Math.random().toString(36).slice(2, 9),
          owner_id: id,
          name,
          email,
          phone,
          location: "Nairobi",
          role,
          created_at: new Date().toISOString(),
        };
        shops.push(newShop);
        setStored("shops", shops);

        const session = {
          access_token: role === "admin" ? "demo-admin-token" : "demo-shop-token",
          user: currentUser,
        };
        notifyAuth("SIGNED_IN", session);
        return { data: { user: currentUser, session } };
      },
      async signInWithPassword({ email }) {
        const isAdmin = email.toLowerCase().includes("admin");
        const id = isAdmin ? "user-admin-1" : "user-shop-1";
        const role = isAdmin ? "admin" : "shop";

        currentUser = {
          id,
          email,
          role,
          user_metadata: {
            full_name: isAdmin ? "LoanSync Administrator" : "Jane Auma",
            phone: isAdmin ? "0700000000" : "0712345678",
          },
        };
        setStored("current_user", currentUser);

        const session = {
          access_token: isAdmin ? "demo-admin-token" : "demo-shop-token",
          user: currentUser,
        };
        notifyAuth("SIGNED_IN", session);
        return { data: { user: currentUser, session } };
      },
      async signOut() {
        currentUser = null;
        setStored("current_user", null);
        notifyAuth("SIGNED_OUT", null);
        return { error: null };
      },
    },

    from(table) {
      return {
        select(fields = "*") {
          let filters = [];
          let orderClause = null;
          let singleMode = false;
          let maybeSingleMode = false;

          const query = {
            eq(col, val) {
              filters.push((row) => row[col] === val);
              return query;
            },
            neq(col, val) {
              filters.push((row) => row[col] !== val);
              return query;
            },
            order(col, { ascending = true } = {}) {
              orderClause = { col, ascending };
              return query;
            },
            single() {
              singleMode = true;
              return query;
            },
            maybeSingle() {
              maybeSingleMode = true;
              return query;
            },
            then(resolve, reject) {
              let rows = table === "shops"
                ? getStored("shops", INITIAL_SHOPS)
                : getStored("loans", INITIAL_LOANS);

              for (const f of filters) {
                rows = rows.filter(f);
              }
              if (orderClause) {
                rows = [...rows].sort((a, b) => {
                  const valA = a[orderClause.col];
                  const valB = b[orderClause.col];
                  return orderClause.ascending
                    ? String(valA).localeCompare(String(valB))
                    : String(valB).localeCompare(String(valA));
                });
              }

              if (singleMode) {
                if (rows.length === 0) {
                  return Promise.resolve({ data: null, error: new Error("Row not found") }).then(resolve, reject);
                }
                return Promise.resolve({ data: rows[0], error: null }).then(resolve, reject);
              }

              if (maybeSingleMode) {
                return Promise.resolve({ data: rows[0] || null, error: null }).then(resolve, reject);
              }

              return Promise.resolve({ data: rows, error: null }).then(resolve, reject);
            },
          };
          return query;
        },

        insert(item) {
          return {
            select() {
              return {
                single() {
                  const isArray = Array.isArray(item);
                  const newRecords = (isArray ? item : [item]).map((r) => ({
                    id: r.id || `${table.slice(0, 4)}-${Math.random().toString(36).slice(2, 9)}`,
                    created_at: new Date().toISOString(),
                    ...r,
                  }));

                  const existing = table === "shops"
                    ? getStored("shops", INITIAL_SHOPS)
                    : getStored("loans", INITIAL_LOANS);
                  const updated = [...newRecords, ...existing];
                  setStored(table, updated);

                  return Promise.resolve({ data: newRecords[0], error: null });
                },
              };
            },
          };
        },

        update(updates) {
          let filterCol = null;
          let filterVal = null;
          return {
            eq(col, val) {
              filterCol = col;
              filterVal = val;
              return {
                select() {
                  return {
                    single() {
                      const existing = table === "shops"
                        ? getStored("shops", INITIAL_SHOPS)
                        : getStored("loans", INITIAL_LOANS);
                      let updatedItem = null;
                      const updated = existing.map((r) => {
                        if (r[filterCol] === filterVal) {
                          updatedItem = { ...r, ...updates };
                          return updatedItem;
                        }
                        return r;
                      });
                      setStored(table, updated);
                      return Promise.resolve({ data: updatedItem, error: null });
                    },
                  };
                },
              };
            },
          };
        },

        delete() {
          return {
            eq(col, val) {
              const existing = table === "shops"
                ? getStored("shops", INITIAL_SHOPS)
                : getStored("loans", INITIAL_LOANS);
              const filtered = existing.filter((r) => r[col] !== val);
              setStored(table, filtered);
              return Promise.resolve({ error: null });
            },
          };
        },
      };
    },
  };
}

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : createMockSupabaseClient();
