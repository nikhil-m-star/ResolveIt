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
      className="fixed top-6 left-1/2 -translate-x-1/2 z-[1200] w-[94%] max-w-5xl"
    >
      <nav className="glass-pill relative rounded-3xl border border-white/10 px-5 py-3 transition-all duration-500">
        <div
          className="absolute inset-0 pointer-events-none rounded-[inherit] opacity-40"
          style={{ background: "radial-gradient(120% 120% at 50% 0%, rgba(251,146,60,0.15) 0%, transparent 80%)" }}
        />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <Link to="/" className="flex shrink-0 items-center gap-2.5">
            <Motion.div 
              whileHover={{ rotate: [-5, 5, -5] }} 
              transition={{ duration: 0.5, repeat: Infinity, repeatType: "mirror" }}
            >
              <Shield className="h-7 w-7 text-primary filter drop-shadow-[0_0_8px_rgba(251,146,60,0.5)]" />
            </Motion.div>
            <div className="hidden min-w-0 flex-col sm:flex">
              <span className="text-gradient-primary font-heading text-xl font-extrabold tracking-tight leading-none">ResolveIt</span>
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">Control Deck</span>
            </div>
          </Link>

          {/* Desktop/Tablet Navigation Links */}
          <div className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const active = location.pathname === item.to;
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`relative flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                    active 
                      ? "text-primary bg-primary/10 shadow-[inset_0_0_12px_rgba(251,146,60,0.1)]" 
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? "text-primary" : "text-current"}`} />
                  {item.label}
                  {active && (
                    <Motion.div 
                      layoutId="nav-active"
                      className="absolute -bottom-1 left-1/2 h-1 w-4 -translate-x-1/2 rounded-full bg-primary shadow-[0_0_8px_#fb923c]"
                    />
                  )}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2 sm:gap-4 ml-auto">
            {user ? (
              <>
                <Link
                  to="/report"
                  className="glass-button text-xs font-bold sm:text-sm shadow-[0_8px_16px_-6px_rgba(251,146,60,0.3)]"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span className="hidden lg:inline">Quick Report</span>
                  <span className="lg:hidden">Report</span>
                </Link>
                <div className="h-6 w-px bg-white/10 mx-1 hidden sm:block" />
                <NotificationsDropdown />
                <Link 
                  to="/profile" 
                  className={`rounded-xl p-2.5 transition-all transition-colors ${
                    location.pathname === "/profile" ? "bg-primary/10 text-primary" : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <UserCircle2 className="h-5 w-5" />
                </Link>
                <div className="flex items-center border-l border-white/10 pl-2 lg:pl-4 transition-all">
                  <UserButtonCompat 
                    afterSignOutUrl="/" 
                    appearance={{
                      elements: {
                        userButtonAvatarBox: "h-9 w-9 rounded-xl border border-white/10 shadow-lg"
                      }
                    }}
                  />
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/sign-in" className="rounded-xl px-4 py-2 text-sm font-bold text-slate-300 transition-all hover:bg-white/5 active:scale-95">
                  Access
                </Link>
                <Link to="/sign-up" className="glass-button border-secondary/30 bg-secondary/10 text-secondary hover:bg-secondary/20 shadow-[0_8px_16px_-6px_rgba(45,212,191,0.25)]">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation List (Horizontal Scroll) */}
        <div className="relative mt-4 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide md:hidden">
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex min-w-max items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
                  active
                    ? "border-primary/40 bg-primary/15 text-primary shadow-sm"
                    : "border-white/5 bg-white/5 text-slate-400"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
  );
}
