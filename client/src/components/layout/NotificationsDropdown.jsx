import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/auth";
import { Bell, Check, CircleAlert, Info, ShieldAlert, Loader2, Compass, X, Activity } from "lucide-react";
import { cn } from "../../utils/helpers";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

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
    refetchInterval: 30000,
  });

  const markReadMutation = useMutation({
    mutationFn: () => api.patch("/notifications/read-all"),
    onSuccess: () => {
      queryClient.invalidateQueries(["notifications"]);
    },
  });

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
      default: return <Compass className="w-4 h-4 text-primary" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "p-2.5 rounded-xl transition-all relative group",
          isOpen ? "bg-primary/20 text-primary shadow-lg shadow-primary/10" : "text-slate-400 hover:text-white hover:bg-white/5"
        )}
      >
        <Bell className={cn("w-5 h-5 transition-transform duration-300", isOpen && "rotate-12")} />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute top-1.5 right-1.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-primary px-1 text-[8px] font-black text-black border border-black"
            >
               {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="fixed md:absolute right-4 md:right-0 top-20 md:mt-4 w-[calc(100vw-2rem)] md:w-96 glass-panel border border-white/10 rounded-[1.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] overflow-hidden z-[1300]"
          >
            {/* Header */}
            <div className="p-5 border-b border-white/10 bg-gradient-to-r from-primary/10 via-transparent to-transparent backdrop-blur-3xl flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                   <Activity className="w-4 h-4 text-primary" /> Intelligence Feed
                </h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Tactical Deployment Updates</p>
              </div>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); markReadMutation.mutate(); }}
                    disabled={markReadMutation.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-black rounded-lg text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                  >
                    {markReadMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin"/> : <Check className="w-3 h-3" />}
                    Sync All
                  </button>
                )}
                <button onClick={() => setIsOpen(false)} className="md:hidden p-1 hover:bg-white/10 rounded-lg text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-[70vh] md:max-h-[450px] overflow-y-auto custom-scrollbar">
              {isLoading ? (
                <div className="p-12 flex flex-col items-center gap-4">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Accessing Grid...</span>
                </div>
              ) : notifications?.length === 0 ? (
                <div className="p-12 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-white/5 border border-white/5 flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6 text-emerald-400 opacity-20" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Grid Secured</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">No active alerts detected</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-white/5">
                  {notifications?.map((notif, index) => (
                    <motion.div 
                      key={notif.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        "p-5 transition-all relative group cursor-default",
                        !notif.isRead ? "bg-primary/[0.03]" : "opacity-60 bg-transparent"
                      )}
                    >
                      {!notif.isRead && (
                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                      )}
                      
                      <div className="flex gap-4">
                        <div className={cn(
                          "flex-shrink-0 w-10 h-10 rounded-2xl border flex items-center justify-center transition-all shadow-lg",
                          !notif.isRead ? "bg-black border-primary/30 text-primary" : "bg-white/5 border-white/5 text-slate-500"
                        )}>
                          {getIcon(notif.type)}
                        </div>
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <p className={cn(
                            "text-sm leading-relaxed",
                            !notif.isRead ? "text-white font-black" : "text-slate-400 font-medium"
                          )}>
                            {notif.message}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                              <div className={cn("w-1 h-1 rounded-full", !notif.isRead ? "bg-primary animate-pulse" : "bg-slate-700")} />
                              {formatDistanceToNow(new Date(notif.createdAt))} ago
                            </span>
                            {!notif.isRead && (
                              <span className="text-[8px] font-black text-primary uppercase bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">New</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="p-3 bg-white/[0.02] border-t border-white/5 text-center">
               <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.3em]">ResolveIt Intelligence Network v6.2</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}