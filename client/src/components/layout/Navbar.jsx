import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/auth";
import { UserButtonCompat, useUserCompat } from "../../lib/clerkCompat";
import { Link, useLocation } from "react-router-dom";
import { PlusCircle, Compass, Shield, ShieldAlert, KanbanSquare, UserCircle2, Map, Sparkles, Users, MoreHorizontal, User, Bell, Activity } from "lucide-react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { cn } from "../../utils/helpers";

const decodeJwtPayload = (token) => {
  const base64Url = token.split(".")[1];
  if (!base64Url) return null;
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const normalized = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  return JSON.parse(atob(normalized));
};

function AlertBadge({ mobile = false }) {
  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await api.get("/notifications");
      return res.data;
    },
    refetchInterval: 30000,
  });

  const unreadCount = notifications?.filter(n => !n.isRead)?.length || 0;
  if (unreadCount === 0) return null;

  return (
    <span className={cn(
      "absolute flex items-center justify-center bg-primary text-[8px] font-black text-black border border-black rounded-full",
      mobile ? "-top-1 -right-1 h-5 min-w-[1.25rem] px-1" : "top-1 right-1 h-3.5 min-w-[0.875rem] px-0.5"
    )}>
      {unreadCount > 9 ? '9+' : unreadCount}
    </span>
  );
}

export function Navbar() {
  const { user } = useUserCompat();
  const location = useLocation();
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);
  
  let role = "CITIZEN";
  try {
    const storedRole = localStorage.getItem("resolveit_user_role");
    if (storedRole) {
      role = storedRole;
    } else {
      const token = localStorage.getItem("resolveit_token");
      if (token) {
        const payload = decodeJwtPayload(token);
        role = payload?.role || "CITIZEN";
      }
    }
  } catch {
    role = "CITIZEN";
  }

  const isPresident = role === "PRESIDENT";
  const isOfficial = role === "OFFICER" || isPresident;

  const navItems = [
    { to: "/", label: "Feed", icon: Compass },
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
        className="fixed top-4 inset-x-0 mx-auto z-1200 hidden w-fit max-w-full md:block"
      >
        <nav className="glass-pill rounded-full px-6 py-3 transition-all duration-500 shadow-[0_8px_32px_rgba(0,0,0,0.5)] border-white/20">
          <div className="flex items-center gap-10">
            <Link to="/" className="flex shrink-0 items-center gap-3 pr-6 border-r border-white/15">
              <Shield className="h-7 w-7 text-primary" />
              <span className="text-white font-heading text-xl font-extrabold tracking-tight">ResolveIt</span>
            </Link>

            <div className="flex items-center gap-4">
              {navItems.map((item) => {
                const active = location.pathname === item.to;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "relative flex items-center gap-2.5 rounded-full px-4 py-2 text-sm font-bold transition-all duration-300",
                      active 
                        ? "text-primary bg-primary/15 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]" 
                        : "text-slate-400 hover:text-white hover:bg-white/10"
                    )}
                  >
                    <Icon className="h-4.5 w-4.5" />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center gap-3 pl-6 border-l border-white/15">
              {user ? (
                <div className="flex items-center gap-2 rounded-full bg-white/5 border border-white/10 p-1">
                  <Link 
                    to="/alerts" 
                    className={cn(
                      "p-2 rounded-xl transition-all relative group",
                      location.pathname === "/alerts" ? "bg-primary/20 text-primary border border-primary/20" : "text-slate-400 hover:text-white"
                    )}
                  >
                    <Bell className="h-4 w-4" />
                    <AlertBadge />
                  </Link>
                  <Link 
                    to="/profile" 
                    className={cn(
                      "p-2 rounded-xl transition-all",
                      location.pathname === "/profile" ? "bg-primary text-white" : "text-slate-400 hover:text-white"
                    )}
                  >
                    <UserCircle2 className="h-4 w-4" />
                  </Link>
                </div>
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
      <div className="fixed top-4 left-4 z-1200 md:hidden">
        <Link to="/" className="glass-pill inline-flex items-center gap-2 rounded-2xl px-3 py-2">
          <Shield className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold text-white">ResolveIt</span>
        </Link>
      </div>

      {/* Mobile More Menu Overlay */}
      <AnimatePresence>
        {isMobileMoreOpen && (
          <>
            <Motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMoreOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-1240 md:hidden"
            />
            <Motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-24 left-4 right-4 z-1245 md:hidden"
            >
              <div className="glass-panel rounded-4xl p-6 shadow-2xl border border-white/10 flex flex-col gap-6">
                {user ? (
                   <div className="grid grid-cols-2 gap-4">
                      <Link 
                        to="/profile" 
                        onClick={() => setIsMobileMoreOpen(false)}
                        className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white/5 border border-white/5 hover:bg-primary/10 transition-all text-white"
                      >
                        <User className="h-6 w-6 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Profile</span>
                      </Link>
                      <Link 
                        to="/alerts" 
                        onClick={() => setIsMobileMoreOpen(false)}
                        className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white/5 border border-white/5 hover:bg-primary/10 transition-all text-white relative"
                      >
                        <Bell className="h-6 w-6 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Alerts</span>
                        <AlertBadge mobile />
                      </Link>
                   </div>
                ) : (
                   <Link 
                     to="/sign-in" 
                     onClick={() => setIsMobileMoreOpen(false)}
                     className="flex items-center justify-center p-8 rounded-2xl bg-primary/10 border border-primary/20 text-primary font-black uppercase tracking-widest"
                   >
                     Sign In
                   </Link>
                )}
                
                <div className="flex justify-center">
                   <button onClick={() => setIsMobileMoreOpen(false)} className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">Close</button>
                </div>
              </div>
            </Motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile floating pill nav */}
      <Motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed bottom-6 left-0 right-0 z-1250 flex justify-center px-4 md:hidden"
      >
        <nav className="glass-pill w-full max-w-sm rounded-4xl px-3 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.8)] border-white/20">
          <div className="flex justify-around items-center gap-2">
            {navItems.map((item) => {
              const active = location.pathname === item.to;
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-2xl flex-1 py-3 transition-all duration-300",
                    active ? "text-primary bg-primary/15" : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  <Icon className="h-6 w-6" />
                </Link>
              );
            })}
            <button
              onClick={() => setIsMobileMoreOpen(!isMobileMoreOpen)}
              className={cn(
                "flex flex-col items-center justify-center rounded-2xl flex-1 py-3 transition-all duration-300",
                isMobileMoreOpen ? "text-primary bg-primary/15" : "text-slate-500 hover:text-slate-300"
              )}
            >
              <MoreHorizontal className="h-6 w-6" />
            </button>
          </div>
        </nav>
      </Motion.div>
    </>
  );
}
