import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/auth";
import { UserButtonCompat, useUserCompat } from "../../lib/clerkCompat";
import { Link, useLocation } from "react-router-dom";
import { PlusCircle, Compass, Shield, ShieldAlert, KanbanSquare, UserCircle2, Map, Sparkles, Users, MoreHorizontal, User, Bell, Activity } from "lucide-react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
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
  const [isHidden, setIsHidden] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious();
    if (latest > previous && latest > 150) {
      setIsHidden(true);
      setIsMobileMoreOpen(false);
    } else {
      setIsHidden(false);
    }
  });
  
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
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-6 inset-x-0 mx-auto z-navbar hidden w-fit max-w-full md:block"
      >
        <nav className="glass-pill rounded-full px-4 py-2.5 transition-all duration-500 shadow-[0_15px_40px_rgba(0,0,0,0.6)] border border-white/20 bg-white/10 backdrop-blur-3xl">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex shrink-0 items-center gap-3 pl-4 pr-6 border-r border-white/10 hover:opacity-80 transition-opacity">
              <Shield className="h-6 w-6 text-primary shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
              <span className="text-white font-heading text-lg font-black tracking-tighter uppercase">ResolveIt</span>
            </Link>

            <div className="flex items-center gap-1.5 relative h-10 px-1">
              {navItems.map((item) => {
                const active = location.pathname === item.to;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "relative flex items-center gap-2.5 rounded-full px-5 py-2 text-[11px] font-black uppercase tracking-widest transition-all duration-300 group z-10",
                      active ? "text-primary" : "text-slate-500 hover:text-white"
                    )}
                  >
                    {active && (
                      <motion.div
                        layoutId="active-pill"
                        className="absolute inset-0 bg-primary/15 rounded-full border border-primary/20 shadow-[inset_0_2px_10px_rgba(16,185,129,0.1)] -z-10"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <Icon className={cn("h-4 w-4 transition-transform group-hover:scale-110 group-active:scale-95", active && "text-primary")} />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center gap-2 pl-6 pr-2 border-l border-white/10">
              {user ? (
                <div className="flex items-center gap-1.5 rounded-2xl bg-white/5 border border-white/5 p-1">
                  <Link 
                    to="/alerts" 
                    className={cn(
                      "p-2.5 rounded-xl transition-all relative group overflow-hidden",
                      location.pathname === "/alerts" ? "bg-primary/20 text-primary border border-primary/20 shadow-lg" : "text-slate-500 hover:text-white"
                    )}
                  >
                    <Bell className="h-4 w-4 relative z-10" />
                    <AlertBadge />
                  </Link>
                  <Link 
                    to="/profile" 
                    className={cn(
                      "p-2.5 rounded-xl transition-all group overflow-hidden",
                      location.pathname === "/profile" ? "bg-primary text-black shadow-[0_0_20px_rgba(16,185,129,0.4)]" : "text-slate-500 hover:text-white"
                    )}
                  >
                    <UserCircle2 className="h-4 w-4 relative z-10" />
                  </Link>
                </div>
              ) : (
                <Link to="/sign-in" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-primary px-4 py-2 transition-colors">
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </nav>
      </motion.div>


      {/* Mobile More Menu Overlay */}
      <AnimatePresence>
        {isMobileMoreOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMoreOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-1240 md:hidden"
            />
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-28 left-6 right-6 z-1245 md:hidden"
            >
              <div className="glass-panel rounded-[40px] p-8 shadow-[0_32px_100px_rgba(0,0,0,0.8)] border border-white/15 bg-black/60 flex flex-col gap-8">
                {user ? (
                   <div className="flex flex-col gap-4">
                      <Link 
                        to="/profile" 
                        onClick={() => setIsMobileMoreOpen(false)}
                        className="flex items-center gap-5 rounded-3xl p-4 bg-white/5 border border-white/5 hover:bg-primary/10 hover:border-primary/30 transition-all group"
                      >
                        <div className="p-3.5 rounded-2xl bg-black/40 group-hover:scale-110 transition-transform shadow-inner">
                          <User className="h-6 w-6 text-primary" />
                        </div>
                        <span className="text-[13px] font-black uppercase tracking-[0.2em] text-slate-300 group-hover:text-white transition-colors flex-1">Profile View</span>
                      </Link>
                      <Link 
                        to="/alerts" 
                        onClick={() => setIsMobileMoreOpen(false)}
                        className="flex items-center gap-5 rounded-3xl p-4 bg-white/5 border border-white/5 hover:bg-primary/10 hover:border-primary/30 transition-all group relative"
                      >
                        <div className="p-3.5 rounded-2xl bg-black/40 group-hover:scale-110 transition-transform shadow-inner">
                          <Bell className="h-6 w-6 text-primary" />
                        </div>
                        <span className="text-[13px] font-black uppercase tracking-[0.2em] text-slate-300 group-hover:text-white transition-colors flex-1">City Alerts</span>
                        <div className="relative z-10 flex items-center pr-2">
                           <AlertBadge mobile />
                        </div>
                      </Link>
                   </div>
                ) : (
                   <Link 
                     to="/sign-in" 
                     onClick={() => setIsMobileMoreOpen(false)}
                     className="flex items-center justify-center p-10 rounded-[32px] bg-primary group overflow-hidden relative"
                   >
                     <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                     <span className="relative z-10 text-black font-black uppercase tracking-[0.3em] text-sm">Sign In</span>
                   </Link>
                )}
                
                <div className="flex justify-center">
                   <button 
                    onClick={() => setIsMobileMoreOpen(false)} 
                    className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
                   >
                     <PlusCircle className="h-6 w-6 text-slate-500 rotate-45" />
                   </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile floating pill nav */}
      <motion.div
        variants={{
          visible: { y: 0, opacity: 1 },
          hidden: { y: 150, opacity: 0 }
        }}
        initial="visible"
        animate={isHidden ? "hidden" : "visible"}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="fixed bottom-8 left-0 right-0 z-1250 flex justify-center px-6 md:hidden pointer-events-none"
      >
        <nav className="glass-pill w-full max-w-sm rounded-full px-2 py-2 shadow-[0_15px_40px_rgba(0,0,0,0.6)] border border-white/20 bg-white/10 backdrop-blur-3xl pointer-events-auto">
          <div className="flex justify-between items-center relative h-14">
            {navItems.map((item) => {
              const active = location.pathname === item.to;
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "relative flex flex-col items-center justify-center rounded-full flex-1 h-full transition-all duration-300 z-10",
                    active ? "text-primary" : "text-slate-500"
                  )}
                >
                  {active && (
                    <motion.div
                      layoutId="mobile-active-pill"
                      className="absolute inset-1 bg-primary/20 rounded-full border border-primary/20 -z-10"
                      transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                    />
                  )}
                  <Icon className={cn("h-6 w-6 transition-all", active ? "scale-110" : "scale-90 opacity-60")} />
                </Link>
              );
            })}
            <button
              onClick={() => setIsMobileMoreOpen(!isMobileMoreOpen)}
              className={cn(
                "relative flex flex-col items-center justify-center rounded-full flex-1 h-full transition-all duration-300 z-10",
                isMobileMoreOpen ? "text-primary shadow-[inset_0_0_15px_rgba(16,185,129,0.1)]" : "text-slate-500"
              )}
            >
              {isMobileMoreOpen && (
                <div className="absolute inset-1 bg-primary/20 rounded-full border border-primary/20 -z-10" />
              )}
              <MoreHorizontal className={cn("h-6 w-6 transition-all", isMobileMoreOpen ? "scale-110" : "scale-90 opacity-60")} />
            </button>
          </div>
        </nav>
      </motion.div>
    </>
  );
}
