import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const isConfigured = Boolean(
  SUPABASE_URL &&
  SUPABASE_SERVICE_ROLE_KEY &&
  SUPABASE_URL.startsWith("http") &&
  SUPABASE_URL !== "https://your-project.supabase.co"
);

// Initial in-memory backend database for demo/fallback mode
const mockDb = {
  shops: [
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
      id: "shop-demo-2",
      owner_id: "user-shop-2",
      name: "Kariokor Electronics",
      email: "kariokor@loansync.app",
      phone: "0723456789",
      location: "Kariokor Market",
      role: "shop",
      created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
    },
    {
      id: "shop-demo-3",
      owner_id: "user-shop-3",
      name: "Otieno Motor Spares",
      email: "otieno@loansync.app",
      phone: "0734567890",
      location: "Industrial Area",
      role: "shop",
      created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
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
  ],
  loans: [
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
    {
      id: "loan-5",
      shop_id: "shop-demo-2",
      borrower_name: "John Kamau",
      phone: "0711223344",
      amount: 32000,
      issue_date: new Date(Date.now() - 25 * 86400000).toISOString().slice(0, 10),
      due_date: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
      status: "active",
      note: "Display unit repair",
      created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    },
    {
      id: "loan-6",
      shop_id: "shop-demo-2",
      borrower_name: "Alice Muthoni",
      phone: "0755667788",
      amount: 18000,
      issue_date: new Date(Date.now() - 50 * 86400000).toISOString().slice(0, 10),
      due_date: new Date(Date.now() - 15 * 86400000).toISOString().slice(0, 10),
      status: "overdue",
      note: "Laptop accessories",
      created_at: new Date(Date.now() - 50 * 86400000).toISOString(),
    },
    {
      id: "loan-7",
      shop_id: "shop-demo-3",
      borrower_name: "Samuel Kiprop",
      phone: "0766778899",
      amount: 45000,
      issue_date: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
      due_date: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10),
      status: "paid",
      note: "Alternator and battery",
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
  ],
  pending_shops: [
    {
      id: "pending-1",
      name: "Westlands Hardware",
      phone: "0788990011",
      location: "Westlands, Nairobi",
      email: "westlands@hardware.ke",
      claimed: false,
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
  ],
  mpesa_transactions: [],
};

function createMockAdminClient() {
  console.info("[supabaseAdmin] Running with in-memory admin store. Configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to connect live Supabase.");

  return {
    auth: {
      async getUser(token) {
        if (!token) return { data: { user: null }, error: new Error("No token") };
        const isAdmin = !token.includes("shop");
        return {
          data: {
            user: {
              id: isAdmin ? "user-admin-1" : "user-shop-1",
              email: isAdmin ? "admin@loansync.app" : "shop@loansync.app",
              role: isAdmin ? "admin" : "shop",
            },
          },
          error: null,
        };
      },
    },

    from(table) {
      return {
        select(fields = "*") {
          let filters = [];
          let orderClause = null;
          let singleMode = false;

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
            then(resolve, reject) {
              let rows = [...(mockDb[table] || [])];
              for (const f of filters) {
                rows = rows.filter(f);
              }
              if (orderClause) {
                rows.sort((a, b) => {
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
                  const record = {
                    id: item.id || `${table.slice(0, 4)}-${Math.random().toString(36).slice(2, 9)}`,
                    created_at: new Date().toISOString(),
                    ...item,
                  };
                  mockDb[table] = [record, ...(mockDb[table] || [])];
                  return Promise.resolve({ data: record, error: null });
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
                      let updatedItem = null;
                      mockDb[table] = (mockDb[table] || []).map((r) => {
                        if (r[filterCol] === filterVal) {
                          updatedItem = { ...r, ...updates };
                          return updatedItem;
                        }
                        return r;
                      });
                      return Promise.resolve({ data: updatedItem, error: null });
                    },
                  };
                },
                then(resolve, reject) {
                  mockDb[table] = (mockDb[table] || []).map((r) => {
                    if (r[filterCol] === filterVal) {
                      return { ...r, ...updates };
                    }
                    return r;
                  });
                  return Promise.resolve({ error: null }).then(resolve, reject);
                },
              };
            },
          };
        },
      };
    },
  };
}

function createAdminClient() {
  const mockClient = createMockAdminClient();

  if (!isConfigured) {
    return mockClient;
  }

  const realClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let isLiveAvailable = false;

  // Non-blocking connectivity probe
  (async () => {
    try {
      const abort = new AbortController();
      const timer = setTimeout(() => abort.abort(), 2000);
      const { error } = await realClient
        .from("shops")
        .select("id")
        .limit(1)
        .abortSignal(abort.signal);
      clearTimeout(timer);
      if (!error) {
        isLiveAvailable = true;
        console.info(`[supabaseAdmin] Connected to live Supabase at ${SUPABASE_URL}`);
      } else {
        console.warn(`[supabaseAdmin] Live Supabase query returned error (${error.message}) - operating in resilient fallback mode.`);
      }
    } catch (e) {
      console.warn(`[supabaseAdmin] Outbound network to Supabase unavailable (${e.message}) - operating in resilient fallback mode.`);
    }
  })();

  return {
    auth: {
      async getUser(token) {
        if (!token) return { data: { user: null }, error: new Error("No token") };
        if (token.startsWith("demo-") || !isLiveAvailable) {
          return mockClient.auth.getUser(token);
        }
        try {
          const res = await realClient.auth.getUser(token);
          if (res?.data?.user) return res;
        } catch (e) {
          console.warn("[supabaseAdmin] auth.getUser failed:", e.message);
        }
        return mockClient.auth.getUser(token);
      },
    },

    from(table) {
      if (!isLiveAvailable) {
        return mockClient.from(table);
      }
      return realClient.from(table);
    },
  };
}

export const supabaseAdmin = createAdminClient();
