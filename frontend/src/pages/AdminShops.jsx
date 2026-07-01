import { useState } from "react";
import { Link } from "react-router-dom";
import { Store, AlertCircle, Plus } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import RegisterShopModal from "../components/RegisterShopModal";
import { useAsync } from "../hooks/useAsync";
import { fetchAdminShops, registerShop } from "../lib/adminApi";
import { formatKES } from "../lib/format";

export default function AdminShops() {
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sortBy, setSortBy] = useState("total");
  const [modalOpen, setModalOpen] = useState(false);
  const { data, loading, error, refetch } = useAsync(fetchAdminShops);

  async function handleRegister(form) {
    await registerShop(form);
    // The new shop won't show up in the live directory until its owner
    // actually signs up and gets linked — but we refetch in case an admin
    // is re-registering someone who already has an account under that email/phone.
    refetch();
  }

  const shops = (data || [])
    .filter((s) =>
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.location || "").toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "total") return b.total - a.total;
      if (sortBy === "overdue") return b.overdueCount - a.overdueCount;
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="flex min-h-screen bg-bg-deep">
      <Sidebar variant="admin" open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 min-w-0">
        <Topbar search={search} onSearchChange={setSearch} placeholder="Search shops, owners, or IDs…" roleLabel="Enterprise Admin" onMenuClick={() => setSidebarOpen(true)} />

        <main className="max-w-[1180px] mx-auto px-4 sm:px-7 py-6 sm:py-8">
          <div className="flex items-start justify-between mb-7 flex-wrap gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-text-primary">Registered Shops</h1>
              <p className="text-text-muted text-sm mt-1">
                Manage and monitor portfolios across {shops.length} active commercial locations.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted font-bold uppercase">Sort by:</span>
              {[["total", "Portfolio"], ["overdue", "Overdue"], ["name", "Name"]].map(([k, l]) => (
                <button
                  key={k}
                  onClick={() => setSortBy(k)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                    sortBy === k ? "border-purple bg-purple/15 text-purple-light" : "border-border text-text-muted"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-danger/10 border border-danger/25 text-danger text-sm rounded-lg px-4 py-3 mb-6">
              {error} — make sure the backend API is running.
            </div>
          )}

          {loading ? (
            <div className="py-16 text-center text-text-muted text-sm">Loading shops…</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {shops.map((shop) => (
                <Link
                  to={`/admin/shops/${shop.id}`}
                  key={shop.id}
                  className="bg-bg-panel border border-border hover:border-emerald rounded-card p-5 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald to-emerald-dark flex items-center justify-center">
                      <Store size={18} className="text-white" />
                    </div>
                    {shop.overdueCount > 0 && (
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-danger/15 text-danger text-[11px] font-bold">
                        <AlertCircle size={11} /> {shop.overdueCount} overdue
                      </span>
                    )}
                  </div>
                  <div className="font-bold text-text-primary text-[15px]">{shop.name}</div>
                  <div className="text-xs text-text-muted mb-3.5">📍 {shop.location || "No location set"}</div>

                  <div className="bg-bg-input rounded-lg p-3 mb-3">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-text-muted">Total Portfolio</div>
                    <div className="text-lg font-extrabold text-emerald mt-0.5">{formatKES(shop.total)}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-bg-input rounded-lg px-3 py-2">
                      <div className="text-[10px] font-bold text-text-muted uppercase">Outstanding</div>
                      <div className="text-sm font-bold text-amber mt-0.5">{formatKES(shop.outstanding)}</div>
                    </div>
                    <div className="bg-bg-input rounded-lg px-3 py-2">
                      <div className="text-[10px] font-bold text-text-muted uppercase">Records</div>
                      <div className="text-sm font-bold text-sky mt-0.5">{shop.loanCount} loans</div>
                    </div>
                  </div>
                </Link>
              ))}

              <button
                onClick={() => setModalOpen(true)}
                className="border-2 border-dashed border-border hover:border-emerald rounded-card flex flex-col items-center justify-center gap-3 py-10 text-text-muted hover:text-emerald transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-bg-raised flex items-center justify-center">
                  <Plus size={22} />
                </div>
                <span className="text-xs font-bold uppercase tracking-wide">Register New Shop</span>
              </button>
            </div>
          )}
        </main>
      </div>

      <RegisterShopModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={handleRegister} />
    </div>
  );
}