import { UserButton, useUser, useClerk } from "@clerk/clerk-react";
import { Link, useLocation } from "react-router-dom";
import { PlusCircle, LayoutDashboard, Shield, ShieldAlert, Trophy, KanbanSquare, Bell } from "lucide-react";
import { NotificationsDropdown } from "./NotificationsDropdown";

export function Navbar() {
  const { user } = useUser();
  const location = useLocation();
  const role = user?.publicMetadata?.role || "CITIZEN";

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-5xl">
      <nav className="glass-panel border-primary/30 px-6 py-3 flex items-center justify-between rounded-full shadow-[0_0_15px_rgba(6,182,212,0.15)] bg-black/60 backdrop-blur-md">
        <Link to="/" className="flex items-center gap-2">
          <Shield className="w-8 h-8 text-primary" />
          <span className="font-heading font-bold text-2xl tracking-tighter text-glow truncate text-white">
            ResolveIt
          </span>
        </Link>
        
        <div className="flex items-center gap-4">
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
              <Link to="/profile" className="p-2 text-primary/60 hover:text-primary transition-colors relative">
                <Bell className="hidden w-5 h-5" />
                <UserButton afterSignOutUrl="/" />
              </Link>
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
    </div>
  );
}
