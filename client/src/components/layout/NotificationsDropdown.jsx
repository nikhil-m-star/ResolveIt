import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/auth";
import { Bell, Check, CircleAlert, Info, ShieldAlert, Loader2 } from "lucide-react";
import { cn } from "../../utils/helpers";
import { formatDistanceToNow } from "date-fns";

export function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await api.get("/notifications");
      return res.data;
    },
    refetchInterval: 30000, // Poll every 30 seconds
  });

  const markReadMutation = useMutation({
    mutationFn: () => api.patch("/notifications/read-all"),
    onSuccess: () => {
      queryClient.invalidateQueries(["notifications"]);
    },
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications?.filter(n => !n.isRead)?.length || 0;

  const getIcon = (type) => {
    switch (type) {
      case "URGENT": return <ShieldAlert className="w-4 h-4 text-red-400" />;
      case "WARNING": return <CircleAlert className="w-4 h-4 text-amber-400" />;
      case "SUCCESS": return <Check className="w-4 h-4 text-emerald-400" />;
      default: return <Info className="w-4 h-4 text-primary" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-400 hover:text-white transition-colors relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 flex h-2 items-center justify-center">
             <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
             <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-4 w-[calc(100vw-2rem)] sm:w-85 glass-panel border border-white/10 rounded-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] overflow-hidden z-[1300] animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="p-4 border-b border-white/10 bg-white/5 backdrop-blur-3xl flex items-center justify-between">
            <h3 className="font-heading font-semibold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={(e) => { e.stopPropagation(); markReadMutation.mutate(); }}
                disabled={markReadMutation.isPending}
                className="text-xs text-primary hover:text-primary flex items-center gap-1 font-medium transition-colors"
              >
                {markReadMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin"/> : <Check className="w-3 h-3" />}
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
            ) : notifications?.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">
                 You're all caught up!
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-white/5">
                {notifications?.map((notif) => (
                  <div 
                    key={notif.id} 
                    className={cn(
                      "p-4 transition-colors hover:bg-white/5",
                      !notif.isRead ? "bg-primary/5" : "opacity-75"
                    )}
                  >
                    <div className="flex gap-3">
                      <div className="mt-0.5">{getIcon(notif.type)}</div>
                      <div className="flex-1 space-y-1">
                        <p className={cn("text-sm leading-tight", !notif.isRead ? "text-white font-medium" : "text-gray-300")}>
                          {notif.message}
                        </p>
                        <p className="text-xs text-gray-500 flex justify-between">
                          <span>{formatDistanceToNow(new Date(notif.createdAt))} ago</span>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}