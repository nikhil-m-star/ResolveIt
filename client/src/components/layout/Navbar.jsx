import { UserButton, useUser, useClerk } from "@clerk/clerk-react";
import { Link, useLocation } from "react-router-dom";
import { Bell, PlusCircle, LayoutDashboard, Shield, ShieldAlert, Trophy, KanbanSquare } from "lucide-react";

export function Navbar() {
  const { user } = useUser();
  const location = useLocation();
  const role = user?.publicMetadata?.role || "CITIZEN";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-panel border-b px-6 py-3 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2">
        <Shield className="w-8 h-8 text-primary" />
        <span className="font-heading font-bold text-2xl tracking-tighter text-glow truncate">
          ResolveIt
        </span>
      </Link>
      
      <div className="flex items-center gap-4">
        {(role === "OFFICER" || role === "PRESIDENT") && (
          <>
            <Link to="/admin" className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-colors ${location.pathname === '/admin' ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'}`}>
              <ShieldAlert className="w-4 h-4" />
              Command Center
            </Link>
            <Link to="/kanban" className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm border transition-colors ${location.pathname === '/kanban' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'}`}>
              <KanbanSquare className="w-4 h-4" />
              Board
            </Link>
          </>
        )}
        <Link to="/report" className="hidden sm:flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-colors px-4 py-2 rounded-full font-medium text-sm">
          <PlusCircle className="w-4 h-4" />
          Report Issue
        </Link>
        <Link to="/" className="p-2 text-gray-400 hover:text-white transition-colors">
          <LayoutDashboard className="w-5 h-5" />
        </Link>
        <Link to="/leaderboard" className="p-2 text-gray-400 hover:text-yellow-400 transition-colors">
          <Trophy className="w-5 h-5" />
        </Link>
        <Link to="/profile" className="p-2 text-gray-400 hover:text-white transition-colors relative">
          <Bell className="hidden w-5 h-5" />
          <UserButton afterSignOutUrl="/sign-in" />
        </Link>
      </div>
    </nav>
  );
}
