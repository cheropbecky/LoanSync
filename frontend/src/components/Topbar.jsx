import { Search, Bell, Menu } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { initialsFromName } from "../lib/format";

export default function Topbar({
  search,
  onSearchChange,
  placeholder = "Search records…",
  roleLabel = "Shop Admin",
  onMenuClick,
}) {
  const { profile } = useAuth();
  const name = profile?.name || "User";

  return (
    <header className="h-[68px] border-b border-border bg-bg-deep flex items-center justify-between px-4 sm:px-7 gap-3 sm:gap-6">
      <button onClick={onMenuClick} className="lg:hidden text-text-muted hover:text-text-primary shrink-0">
        <Menu size={22} />
      </button>

      <div className="relative flex-1 max-w-md min-w-0">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          value={search}
          onChange={(e) => onSearchChange?.(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2.5 bg-bg-panel border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-emerald transition-colors"
        />
      </div>

      <div className="flex items-center gap-3 sm:gap-5 shrink-0">
        <button className="relative text-text-muted hover:text-text-primary transition-colors hidden sm:block">
          <Bell size={19} />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-danger" />
        </button>
        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <div className="text-sm font-bold text-text-primary leading-tight">{name}</div>
            <div className="text-[11px] text-text-muted leading-tight">{roleLabel}</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky to-purple flex items-center justify-center text-xs font-black text-white shrink-0">
            {initialsFromName(name)}
          </div>
        </div>
      </div>
    </header>
  );
}