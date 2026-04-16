import { UserButtonCompat, useUserCompat } from "../../lib/clerkCompat";
import { Link, useLocation } from "react-router-dom";
import { PlusCircle, LayoutDashboard, Shield, ShieldAlert, Trophy, KanbanSquare, UserCircle2 } from "lucide-react";
import { NotificationsDropdown } from "./NotificationsDropdown";
import { motion as Motion } from "framer-motion";

const decodeJwtPayload = (token) => {
  const base64Url = token.split(".")[1];
  if (!base64Url) return null;
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const normalized = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  return JSON.parse(atob(normalized));
};

export function Navbar() {
  const { user } = useUserCompat();
  const location = useLocation();
  
  // Read role from internal JWT rather than Clerk metadata to reflect immediate upgrades
  let role = "CITIZEN";
  try {
    const token = localStorage.getItem("resolveit_token");
    if (token) {
      const payload = decodeJwtPayload(token);
      role = payload.role || "CITIZEN";
    }
    const cachedRole = localStorage.getItem("resolveit_user_role");
    if (!token && cachedRole) {
      role = cachedRole;
    }
  } catch {
    const cachedRole = localStorage.getItem("resolveit_user_role");
    role = cachedRole || user?.publicMetadata?.role || "CITIZEN";
  }

  const navItems = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
    ...(role === "OFFICER" || role === "PRESIDENT"
      ? [
          { to: "/admin", label: "Command Center", icon: ShieldAlert },
          { to: "/kanban", label: "Board", icon: KanbanSquare },
        ]
      : []),
  ];

  return (
    <Motion.div 
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[1200] w-[96%] max-w-6xl"
    >
      <nav className="relative overflow-hidden rounded-2xl border border-white/15 bg-slate-950/70 px-4 py-3 backdrop-blur-2xl shadow-[0_24px_60px_rgba(2,6,23,0.45)]">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(110deg, rgba(251,146,60,0.08), rgba(45,212,191,0.08), transparent 72%)" }}
        />

        <div className="relative z-10 flex items-center justify-between gap-4">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <Motion.div whileHover={{ rotate: 10 }} transition={{ type: "spring", stiffness: 280 }}>
              <Shield className="h-7 w-7 text-primary drop-shadow-[0_0_10px_rgba(251,146,60,0.5)]" />
            </Motion.div>
            <div className="min-w-0">
              <p className="truncate font-heading text-lg font-bold tracking-tight text-white">ResolveIt</p>
              <p className="hidden text-[11px] text-slate-300 sm:block">Civic response command deck</p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link
                  to="/report"
                  className="inline-flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/20 px-3 py-2 text-xs font-semibold text-primary transition hover:bg-primary/30 sm:px-4 sm:text-sm"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Report Issue</span>
                </Link>
                <NotificationsDropdown />
                <Link to="/profile" className="rounded-lg p-2 text-slate-300 transition hover:bg-white/10 hover:text-white" title="Profile">
                  <UserCircle2 className="h-5 w-5" />
                </Link>
                <UserButtonCompat afterSignOutUrl="/" />
              </>
            ) : (
              <>
                <Link to="/sign-in" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10">
                  Sign In
                </Link>
                <Link to="/sign-up" className="rounded-lg border border-secondary/35 bg-secondary/15 px-3 py-2 text-sm font-semibold text-secondary transition hover:bg-secondary/25">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="relative z-10 mt-3 flex items-center gap-2 overflow-x-auto pb-1">
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            const IconComponent = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`inline-flex min-w-max items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition sm:text-sm ${
                  active
                    ? "border-primary/40 bg-primary/20 text-primary"
                    : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <IconComponent className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </Motion.div>
  );
}
