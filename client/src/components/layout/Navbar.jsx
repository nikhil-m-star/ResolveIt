import { UserButton, useUser } from "@clerk/clerk-react";
import { Link, useLocation } from "react-router-dom";
import { PlusCircle, LayoutDashboard, Shield, ShieldAlert, Trophy, KanbanSquare, UserCircle2 } from "lucide-react";
import { NotificationsDropdown } from "./NotificationsDropdown";
import { motion as Motion } from "framer-motion";

export function Navbar() {
  const { user } = useUser();
  const location = useLocation();
  
  // Read role from internal JWT rather than Clerk metadata to reflect immediate upgrades
  let role = "CITIZEN";
  try {
    const token = localStorage.getItem("resolveit_token");
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
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

  return (
    <Motion.div 
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-5xl"
    >
      <nav className="relative overflow-hidden px-6 py-3 flex items-center justify-between rounded-full shadow-[0_8px_32px_rgba(6,182,212,0.15)] bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08]">
        {/* Dynamic gradient line overlay */}
        <div className="absolute inset-0 rounded-full border border-transparent [background:linear-gradient(to_right,rgba(6,182,212,0.1),transparent)_border-box] pointer-events-none" style={{ WebkitMask: "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)", WebkitMaskComposite: "destination-out", maskComposite: "exclude" }} />
        
        <Link to="/" className="flex items-center gap-2 group relative z-10">
          <Motion.div whileHover={{ rotate: 15 }} transition={{ type: "spring", stiffness: 300 }}>
            <Shield className="w-8 h-8 text-primary shadow-primary/20 drop-shadow-md" />
          </Motion.div>
          <span className="font-heading font-extrabold text-2xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70 truncate drop-shadow-sm">
            ResolveIt
          </span>
        </Link>
        
        <div className="flex items-center gap-2 sm:gap-4">
          {user ? (
            <>
              {(role === "OFFICER" || role === "PRESIDENT") && (
                <>
                  <Link to="/admin" className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-colors ${location.pathname === '/admin' ? 'bg-primary/20 text-primary border-primary/30' : 'bg-primary/5 text-primary/80 border-primary/20 hover:bg-primary/20'}`}>
                    <ShieldAlert className="w-4 h-4" />
                    Command Center
                  </Link>
                  <Link to="/kanban" className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm border transition-colors ${location.pathname === '/kanban' ? 'bg-primary/20 text-primary border-primary/30' : 'bg-primary/5 text-primary/80 border-primary/20 hover:bg-primary/20'}`}>
                    <KanbanSquare className="w-4 h-4" />
                    Board
                  </Link>
                </>
              )}
              <Link to="/report" className="hidden sm:flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 transition-colors px-4 py-2 rounded-full font-medium text-sm shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                <PlusCircle className="w-4 h-4" />
                Report Issue
              </Link>
              <Link to="/dashboard" className="p-2 text-primary/60 hover:text-primary transition-colors">
                <LayoutDashboard className="w-5 h-5" />
              </Link>
              <Link to="/leaderboard" className="p-2 text-primary/60 hover:text-primary transition-colors">
                <Trophy className="w-5 h-5" />
              </Link>
              <NotificationsDropdown />
              <Link to="/profile" className="p-2 text-primary/60 hover:text-primary transition-colors relative" title="Profile">
                <UserCircle2 className="w-5 h-5" />
              </Link>
              <UserButton afterSignOutUrl="/" />
            </>
          ) : (
            <>
              <Link to="/sign-in" className="px-4 py-2 rounded-full font-medium text-sm text-primary/80 hover:text-primary transition-colors">
                Sign In
              </Link>
              <Link to="/sign-up" className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 transition-colors px-4 py-2 rounded-full font-medium text-sm shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>
    </Motion.div>
  );
}
