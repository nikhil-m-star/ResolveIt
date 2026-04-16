import { UserButtonCompat, useUserCompat } from "../../lib/clerkCompat";
import { Link, useLocation } from "react-router-dom";
import { PlusCircle, LayoutDashboard, Shield, ShieldAlert, KanbanSquare, UserCircle2, Map, Sparkles, Users } from "lucide-react";
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
  
  let role = "CITIZEN";
  try {
    const token = localStorage.getItem("resolveit_token");
    if (token) {
      const payload = decodeJwtPayload(token);
      role = payload.role || "CITIZEN";
    }
  } catch {
    role = "CITIZEN";
  }

  const isPresident = role === "PRESIDENT";
  const isOfficial = role === "OFFICER" || isPresident;

  const navItems = [
    { to: "/", label: "Feed", icon: LayoutDashboard },
    { to: "/map", label: "Map", icon: Map },
    { to: "/ai-insights", label: "AI Insights", icon: Sparkles },
    ...(isOfficial ? [{ to: "/kanban", label: "Board", icon: KanbanSquare }] : []),
    ...(isPresident ? [{ to: "/users", label: "Manage", icon: Users }] : []),
  ];

  return (
    <>
      <Motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-4 inset-x-0 mx-auto z-[1200] hidden w-fit max-w-full md:block"
      >
        <nav className="glass-pill rounded-full px-5 py-2.5 transition-all duration-500">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex shrink-0 items-center gap-2 pr-4 border-r border-white/10">
              <Shield className="h-6 w-6 text-primary" />
              <span className="text-white font-heading text-lg font-bold tracking-tight">ResolveIt</span>
            </Link>

            <div className="flex items-center gap-1.5">
              {navItems.map((item) => {
                const active = location.pathname === item.to;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`relative flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-bold transition-all duration-300 ${
                      active 
                        ? "text-primary bg-primary/10 shadow-[inner_0_0_12px_rgba(59,130,246,0.1)]" 
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center gap-3 pl-4 border-l border-white/10">
              {user ? (
                <>
                  <Link
                    to="/report"
                    className="flex items-center gap-2 px-4 py-1.5 bg-primary text-white text-sm font-bold rounded-full hover:brightness-110 shadow-lg shadow-primary/20 transition-all active:scale-95"
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span>Report</span>
                  </Link>
                  <NotificationsDropdown />
                  <Link 
                    to="/profile" 
                    className={`p-2 rounded-full transition-colors ${
                      location.pathname === "/profile" ? "bg-primary/10 text-primary border border-primary/20" : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <UserCircle2 className="h-5 w-5" />
                  </Link>
                  <UserButtonCompat appearance={{ elements: { userButtonAvatarBox: "h-8 w-8 rounded-full border border-white/10" } }} />
                </>
              ) : (
                <Link to="/sign-in" className="text-sm font-bold text-slate-400 hover:text-white px-3 py-1.5">
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </nav>
      </Motion.div>

      {/* Mobile top-left brand chip */}
      <div className="fixed top-4 left-4 z-[1200] md:hidden">
        <Link to="/" className="glass-pill inline-flex items-center gap-2 rounded-2xl px-3 py-2">
          <Shield className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold text-white">ResolveIt</span>
        </Link>
      </div>

      {/* Mobile floating pill nav */}
      <Motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed bottom-6 left-0 right-0 z-[1250] flex justify-center px-4 md:hidden"
      >
        <nav className="glass-pill w-full max-w-sm rounded-3xl px-1.5 py-1.5">
          <div className="flex justify-around items-center">
            {navItems.slice(0, 4).map((item) => {
              const active = location.pathname === item.to;
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex flex-col items-center justify-center rounded-2xl flex-1 py-2 text-[10px] font-bold transition-all duration-300 ${
                    active ? "text-primary" : "text-slate-400"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${active ? "text-primary" : "text-slate-400"}`} />
                </Link>
              );
            })}
            <Link
              to="/report"
              className="flex items-center justify-center bg-primary text-white h-11 w-11 rounded-2xl shadow-lg shadow-primary/25"
            >
              <PlusCircle className="h-6 w-6" />
            </Link>
            <Link
              to="/profile"
              className={`flex flex-col items-center justify-center rounded-2xl flex-1 py-2 text-[10px] font-bold transition-all duration-300 ${
                location.pathname === "/profile" ? "text-primary" : "text-slate-400"
              }`}
            >
              <UserCircle2 className="h-5 w-5" />
            </Link>
          </div>
        </nav>
      </Motion.div>
    </>
  );
}

    </>
  );
}
