import { NavLink } from "react-router-dom";
import {
  LayoutGrid, CreditCard, Store, BarChart2, ShieldCheck, HelpCircle, LogOut, X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const SHOP_LINKS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { to: "/dashboard/loans", label: "My Loans", icon: CreditCard },
];

const ADMIN_LINKS = [
  { to: "/admin", label: "Dashboard", icon: LayoutGrid },
  { to: "/admin/shops", label: "Shops", icon: Store },
  { to: "/admin/alerts", label: "Alerts", icon: ShieldCheck },
  { to: "/admin/reports", label: "Reports", icon: BarChart2 },
];

export default function Sidebar({ variant = "shop", open = false, onClose }) {
  const { signOut, isAdmin } = useAuth();
  const links = variant === "admin" ? ADMIN_LINKS : SHOP_LINKS;

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
        />
      )}

      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-50
          w-[260px] shrink-0 h-screen
          bg-bg-panel border-r border-border
          flex flex-col
          transition-transform duration-200
          ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
        `}
      >
        <div className="px-6 py-5 border-b border-border flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald to-emerald-dark flex items-center justify-center text-sm font-black text-white shrink-0">
                L
              </div>
              <span className="font-extrabold text-text-primary text-base tracking-tight">
                LoanSync{variant === "admin" ? " Pro" : ""}
              </span>
            </div>
            {variant === "admin" && (
              <div className="text-[10px] font-bold text-emerald uppercase tracking-widest mt-1">
                Enterprise Admin
              </div>
            )}
          </div>
          <button onClick={onClose} className="lg:hidden text-text-muted hover:text-text-primary">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/dashboard" || to === "/admin"}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-purple text-white"
                    : "text-text-muted hover:text-text-primary hover:bg-bg-raised"
                }`
              }
            >
              <Icon size={17} />
              {label.toUpperCase()}
            </NavLink>
          ))}
          {isAdmin && variant === "shop" && (
            <NavLink
              to="/admin"
              onClick={onClose}
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold text-purple-light hover:bg-bg-raised mt-2"
            >
              <ShieldCheck size={17} />
              ADMIN CONSOLE
            </NavLink>
          )}
        </nav>

        <div className="px-3 py-4 border-t border-border flex flex-col gap-1">
          <button className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold text-text-muted hover:text-text-primary hover:bg-bg-raised transition-colors">
            <HelpCircle size={17} /> SUPPORT
          </button>
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold text-danger hover:bg-danger/10 transition-colors"
          >
            <LogOut size={17} /> LOGOUT
          </button>
        </div>
      </aside>
    </>
  );
}