import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/auth";
import { Layout } from "../components/layout/Layout";
import { 
  Bell, 
  Check, 
  CircleAlert, 
  Info, 
  ShieldAlert, 
  Loader2, 
  Compass, 
  Activity,
  History,
  Trash2,
  Filter
} from "lucide-react";
import { cn } from "../utils/helpers";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export function Alerts() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("ALL");

  const { data: notifications, isLoading, isError } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await api.get("/notifications");
      return res.data;
    },
    refetchInterval: 15000,
  });

  const markReadMutation = useMutation({
    mutationFn: () => api.patch("/notifications/read-all"),
    onSuccess: () => {
      queryClient.invalidateQueries(["notifications"]);
    },
  });

  const filteredNotifications = notifications?.filter(n => {
    if (filter === "UNREAD") return !n.isRead;
    if (filter === "URGENT") return n.type === "URGENT";
    return true;
  });

  const unreadCount = notifications?.filter(n => !n.isRead)?.length || 0;

  const getIcon = (type) => {
    switch (type) {
      case "URGENT": return <ShieldAlert className="w-5 h-5 text-red-400" />;
      case "WARNING": return <CircleAlert className="w-5 h-5 text-amber-400" />;
      case "SUCCESS": return <Check className="w-5 h-5 text-emerald-400" />;
      default: return <Compass className="w-5 h-5 text-primary" />;
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-10 animate-in fade-in duration-700">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
               <Activity className="w-3.5 h-3.5" /> Intelligence Network
            </div>
            <h1 className="text-5xl font-heading font-black text-white tracking-tight uppercase">Alerts</h1>
          </div>

          <div className="flex items-center gap-3">
             {unreadCount > 0 && (
                <button 
                  onClick={() => markReadMutation.mutate()}
                  disabled={markReadMutation.isPending}
                  className="flex items-center gap-2 px-6 py-3 bg-primary/10 hover:bg-primary text-primary hover:text-black border border-primary/20 rounded-2xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50 shadow-xl shadow-primary/5"
                >
                  {markReadMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin"/> : <Check className="w-4 h-4" />}
                  Synchronize All
                </button>
             )}
          </div>
        </div>

        {/* Dashboard Controls */}
        <div className="flex items-center gap-2 bg-black/40 p-1.5 border border-white/5 rounded-[1.5rem] w-fit">
           {["ALL", "UNREAD", "URGENT"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  filter === f ? "bg-primary text-black shadow-lg shadow-primary/20" : "text-slate-500 hover:text-white"
                )}
              >
                {f}
              </button>
           ))}
        </div>

        {/* Main Intelligence Feed */}
        <div className="glass-card overflow-hidden border-white/5 bg-black/40 min-h-[500px] flex flex-col">
           <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                 <History className="w-3.5 h-3.5" /> Recent Incident Telemetry
              </span>
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">{unreadCount} Pending Clearance</span>
           </div>

           <div className="flex-1 divide-y divide-white/5">
              {isLoading ? (
                <div className="p-24 flex flex-col items-center gap-6">
                  <Loader2 className="w-12 h-12 text-primary animate-spin" />
                  <span className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] animate-pulse">Scanning Grid Segments...</span>
                </div>
              ) : filteredNotifications?.length === 0 ? (
                 <div className="p-24 text-center space-y-6">
                    <div className="w-20 h-20 bg-white/[0.03] border border-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl">
                       <ShieldAlert className="w-8 h-8 text-slate-700" />
                    </div>
                    <div>
                       <h3 className="text-xl font-black text-white uppercase tracking-tight">Grid Secured</h3>
                       <p className="text-sm text-slate-500 font-medium max-w-xs mx-auto mt-2">No situational alerts detected in selected priority channel.</p>
                    </div>
                 </div>
              ) : (
                <div className="flex flex-col h-full">
                  <AnimatePresence mode="popLayout">
                    {filteredNotifications?.map((notif, index) => (
                      <motion.div 
                        key={notif.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.4, delay: index * 0.03 }}
                        className={cn(
                          "p-8 transition-all relative group",
                          !notif.isRead ? "bg-primary/[0.04]" : "opacity-50"
                        )}
                      >
                        {!notif.isRead && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                        )}
                        
                        <div className="flex gap-8">
                          <div className={cn(
                            "flex-shrink-0 w-14 h-14 rounded-3xl border flex items-center justify-center transition-all shadow-2xl",
                            !notif.isRead ? "bg-black border-primary/40 text-primary scale-105" : "bg-white/5 border-white/10 text-slate-600"
                          )}>
                            {getIcon(notif.type)}
                          </div>
                          
                          <div className="flex-1 space-y-3">
                            <div className="flex items-start justify-between gap-4">
                               <p className={cn(
                                 "text-lg leading-relaxed",
                                 !notif.isRead ? "text-white font-bold" : "text-gray-400 font-medium"
                               )}>
                                 {notif.message}
                               </p>
                               {!notif.isRead && (
                                 <span className="px-3 py-1 bg-primary/20 text-primary text-[9px] font-black uppercase tracking-widest rounded-lg border border-primary/30">New Intel</span>
                               )}
                            </div>
                            
                            <div className="flex items-center gap-6 pt-2">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <div className={cn("w-1.5 h-1.5 rounded-full", !notif.isRead ? "bg-primary animate-pulse" : "bg-slate-700")} />
                                {formatDistanceToNow(new Date(notif.createdAt))} ago
                              </span>
                              {notif.issueId && (
                                <button className="text-[10px] font-black text-primary hover:text-emerald-400 uppercase tracking-widest transition-colors flex items-center gap-1.5">
                                   View Source Incident <ArrowRight className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
           </div>

           <div className="p-6 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">ResolveIt Unified Intelligence Node</span>
              <div className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                 <span className="text-[9px] font-black text-slate-500 uppercase">System Operational</span>
              </div>
           </div>
        </div>
      </div>
    </Layout>
  );
}
