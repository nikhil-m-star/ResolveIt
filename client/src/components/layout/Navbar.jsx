import { UserButtonCompat, useUserCompat } from "../../lib/clerkCompat";
import { Link, useLocation } from "react-router-dom";
import { PlusCircle, LayoutDashboard, Shield, ShieldAlert, KanbanSquare, UserCircle2, Map, Sparkles } from "lucide-react";
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
    { to: "/map", label: "Map View", icon: Map },
    { to: "/ai-insights", label: "AI Insights", icon: Sparkles },
    ...(role === "OFFICER" || role === "PRESIDENT"
      ? [
          { to: "/admin", label: "Command Center", icon: ShieldAlert },
          { to: "/kanban", label: "Board", icon: KanbanSquare },
        ]
      : []),
  ];

  return (
    <>
      <Motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="fixed top-5 inset-x-0 mx-auto z-[1200] hidden w-[96%] max-w-6xl md:block"
      >
        <nav className="glass-pill relative rounded-full px-6 py-3 transition-all duration-500">
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
            <Link to="/" className="flex shrink-0 items-center gap-2.5">
              <Motion.div 
                whileHover={{ rotate: [-5, 5, -5] }} 
                transition={{ duration: 0.5, repeat: Infinity, repeatType: "mirror" }}
              >
                <Shield className="h-7 w-7 text-primary filter drop-shadow-[0_0_8px_rgba(37,99,235,0.45)]" />
              </Motion.div>
              <div className="hidden min-w-0 flex-col sm:flex">
                <span className="text-primary font-heading text-xl font-extrabold tracking-tight leading-none">ResolveIt</span>
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">Control Deck</span>
              </div>
            </Link>

            <div className="hidden items-center gap-2 md:flex">
              {navItems.map((item) => {
                const active = location.pathname === item.to;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                      active 
                        ? "text-white bg-primary shadow-[0_0_16px_rgba(37,99,235,0.35)]" 
                        : "text-slate-200 bg-white/10 hover:text-white hover:bg-blue-500/40"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${active ? "text-black" : "text-current"}`} />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center gap-2 sm:gap-4 ml-auto">
              {user ? (
                <>
                <Link
                  to="/report"
                  className="glass-button text-xs sm:text-sm shadow-[0_8px_16px_-6px_rgba(37,99,235,0.35)]"
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
                      location.pathname === "/profile" ? "bg-blue-600 text-white" : "text-slate-200 bg-white/10 hover:bg-blue-500/40 hover:text-white"
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
                  <Link to="/sign-up" className="glass-button border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 shadow-[0_8px_16px_-6px_rgba(37,99,235,0.35)]">
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </nav>
      </Motion.div>

      {/* Mobile top-left brand chip */}
      <div className="fixed top-4 left-4 z-[1200] md:hidden">
        <Link to="/" className="glass-pill inline-flex items-center gap-2 rounded-2xl px-3 py-2">
          <Shield className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold text-primary">ResolveIt</span>
        </Link>
      </div>

      {/* Mobile floating pill nav with icon + label stacks */}
      <Motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="fixed bottom-6 left-0 right-0 z-[1250] flex justify-center px-4 md:hidden"
      >
        <nav className="glass-pill w-full max-w-sm rounded-[2rem] px-2 py-2 border-white/10">
          <div className="grid grid-cols-5 gap-1">
            {[...navItems.slice(0, 3), { to: "/report", label: "Report", icon: PlusCircle }, { to: "/profile", label: "Profile", icon: UserCircle2 }].map((item) => {
              const active = location.pathname === item.to;
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex flex-col items-center justify-center rounded-[1.5rem] py-2.5 text-[10px] font-bold transition-all duration-300 ${
                    active ? "bg-primary text-white shadow-lg shadow-primary/25 scale-105" : "text-slate-300 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <Icon className="h-4.5 w-4.5 mb-1" />
                  <span className="scale-[0.9] uppercase tracking-tighter">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </Motion.div>

    </>
  );
}
