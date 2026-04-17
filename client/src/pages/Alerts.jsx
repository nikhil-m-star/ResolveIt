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
  Filter,
  ArrowRight,
  Clock
} from "lucide-react";
import { cn } from "../utils/helpers";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Link } from "react-router-dom";

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
  const urgentCount = notifications?.filter(n => n.type === "URGENT" && !n.isRead)?.length || 0;

  const getIcon = (type) => {
    switch (type) {
      case "URGENT": return <ShieldAlert className="w-5 h-5" />;
      case "WARNING": return <CircleAlert className="w-5 h-5" />;
      case "SUCCESS": return <Check className="w-5 h-5" />;
      default: return <Compass className="w-5 h-5" />;
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full pt-48">
          <div className="flex flex-col items-center gap-6">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 animate-pulse">Checking records...</span>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-6 py-16 space-y-12 animate-in fade-in duration-1000">
        
        {/* Dynamic Emergency HUD Banner */}
        <AnimatePresence>
          {urgentCount > 0 && (
            <motion.div 
               initial={{ height: 0, opacity: 0 }}
               animate={{ height: "auto", opacity: 1 }}
               exit={{ height: 0, opacity: 0 }}
               className="relative overflow-hidden group"
            >
               <div className="absolute inset-0 bg-red-500/10 blur-2xl animate-pulse" />
               <div className="relative bg-red-500/10 border border-red-500/20 rounded-[32px] p-8 flex flex-col md:flex-row items-center gap-6 backdrop-blur-xl">
                  <div className="shrink-0 w-14 h-14 bg-red-500 text-black rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.4)]">
                     <ShieldAlert className="w-7 h-7" />
                  </div>
                  <div className="text-center md:text-left space-y-1">
                     <h2 className="text-2xl font-heading font-black text-red-500 uppercase tracking-tighter leading-none">Emergency Update</h2>
                     <p className="text-red-500/60 text-[10px] font-black uppercase tracking-[0.2em]">There are {urgentCount} urgent cases requiring immediate attention.</p>
                  </div>
                  <button 
                    onClick={() => setFilter("URGENT")}
                    className="md:ml-auto px-6 py-3 bg-red-500 text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white transition-all active:scale-95"
                  >
                     Review URGENT
                  </button>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header HUD */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
          <div className="space-y-3">
             <motion.div 
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               className="flex items-center gap-3 text-[10px] font-black text-primary uppercase tracking-[0.4em]"
             >
                <Activity className="h-3 w-3" /> Updates
             </motion.div>
             <h1 className="text-hero-xl font-heading font-black text-white tracking-tighter uppercase">
               Alerts
             </h1>
          </div>

          <div className="flex items-center gap-4">
             {unreadCount > 0 && (
                <button 
                   onClick={() => markReadMutation.mutate()}
                   disabled={markReadMutation.isPending}
                   className="flex items-center gap-3 px-6 py-4 bg-white/5 hover:bg-primary text-slate-400 hover:text-black border border-white/10 hover:border-primary rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 active:scale-95 group"
                >
                   {markReadMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin"/> : <Check className="w-3 h-3 group-hover:scale-125 transition-transform" />}
                   Dismiss all
                </button>
             )}
          </div>
        </div>

        {/* City Feed Filter HUD */}
        <div className="flex items-center gap-1.5 p-1.5 bg-black/40 border border-white/5 rounded-[24px] w-fit shadow-2xl backdrop-blur-3xl">
           {["ALL", "UNREAD", "URGENT"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-8 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all relative overflow-hidden",
                  filter === f ? "text-black" : "text-slate-500 hover:text-white"
                )}
              >
                {filter === f && (
                  <motion.div 
                    layoutId="filter-pill-alerts"
                    className="absolute inset-0 bg-primary shadow-[0_0_20px_rgba(16,185,129,0.4)]" 
                  />
                )}
                <span className="relative z-10">{f}</span>
              </button>
           ))}
        </div>

        {/* Intelligence Feed Environment */}
        <div className="glass-card bg-white/[0.02] border border-white/10 rounded-[48px] shadow-[0_15px_40px_rgba(0,0,0,0.6)] backdrop-blur-3xl overflow-hidden min-h-[500px] flex flex-col">
           <div className="p-8 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3">
                 <History className="w-3.5 h-3.5 text-primary" /> City Feed
              </span>
              <div className="flex items-center gap-2 px-3 py-1 bg-black/60 rounded-full border border-white/10">
                 <div className={cn("w-1.5 h-1.5 rounded-full", unreadCount > 0 ? "bg-primary animate-pulse" : "bg-slate-600")} />
                 <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{unreadCount} New</span>
              </div>
           </div>

            <div className="flex-1 divide-y divide-white/5">
                {filteredNotifications?.length === 0 ? (
                  <div className="p-32 text-center space-y-10">
                     <div className="w-24 h-24 bg-black border border-white/10 rounded-[32px] flex items-center justify-center mx-auto shadow-[0_20px_40px_rgba(0,0,0,0.4)] relative group">
                        <div className="absolute inset-0 bg-primary/20 rounded-[32px] blur-2xl opacity-10 group-hover:opacity-100 transition-opacity" />
                        <Bell className="w-10 h-10 text-slate-700 relative z-10" />
                     </div>
                     <div className="space-y-4">
                        <h3 className="text-3xl font-heading font-black text-white uppercase tracking-tighter">All clear</h3>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] max-w-xs mx-auto leading-loose">The city is synchronized. No active updates available.</p>
                     </div>
                  </div>
               ) : (
                 <div className="flex flex-col h-full">
                   <AnimatePresence mode="popLayout">
                     {filteredNotifications?.map((notif, index) => (
                       <motion.div 
                         key={notif.id}
                         layout
                         initial={{ opacity: 0, scale: 0.98, y: 20 }}
                         animate={{ opacity: 1, scale: 1, y: 0 }}
                         exit={{ opacity: 0, scale: 0.95, x: 20 }}
                         transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: index * 0.05 }}
                         className={cn(
                           "p-10 transition-all relative group",
                           !notif.isRead ? "bg-white/[0.05] hover:bg-white/[0.08]" : "opacity-40 hover:opacity-100 bg-transparent hover:bg-white/[0.02]"
                         )}
                       >
                         {!notif.isRead && (
                           <div className="absolute left-0 top-1/4 bottom-1/4 w-1.5 bg-primary shadow-[0_0_20px_#10b981] rounded-r-full" />
                         )}
                         
                         <div className="flex flex-col md:flex-row gap-10">
                           {/* Physical Icon Unit */}
                           <div className={cn(
                             "shrink-0 w-20 h-20 rounded-[28px] border-2 flex items-center justify-center transition-all shadow-2xl relative overflow-hidden group-hover:scale-110",
                             !notif.isRead 
                                ? "bg-black border-primary text-primary shadow-primary/20" 
                                : "bg-white/[0.02] border-white/10 text-white group-hover:border-white/20"
                           )}>
                              {notif.type === "URGENT" && !notif.isRead && (
                                 <div className="absolute inset-0 bg-red-500/10 animate-pulse" />
                              )}
                              <div className="relative z-10">{getIcon(notif.type)}</div>
                              
                              {/* Left Bloom Effect */}
                              {!notif.isRead && (
                                 <div className="absolute -left-10 -top-10 w-20 h-20 bg-primary/20 blur-2xl rounded-full" />
                              )}
                           </div>
                           
                           <div className="flex-1 space-y-5">
                             <div className="flex items-start justify-between gap-8">
                                <div className="space-y-2">
                                   <div className="flex items-center gap-3">
                                      <span className={cn(
                                        "text-[9px] font-black uppercase tracking-[0.3em]",
                                        notif.type === "URGENT" ? "text-red-500" : "text-slate-500"
                                      )}>{notif.type} STATUS</span>
                                      <div className="h-px w-10 bg-white/10" />
                                   </div>
                                   <p className={cn(
                                     "text-2xl font-heading font-black tracking-tight leading-none uppercase",
                                     !notif.isRead ? "text-white" : "text-slate-400"
                                   )}>
                                     {notif.message}
                                   </p>
                                </div>
                                {!notif.isRead && (
                                   <div className="flex items-center gap-2 px-4 py-2 bg-primary text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                                      <Activity className="w-3.5 h-3.5" /> High Priority
                                   </div>
                                )}
                             </div>
                             
                             <div className="flex flex-wrap items-center gap-10 pt-4">
                                <div className="flex items-center gap-3">
                                   <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                                   </div>
                                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                     {formatDistanceToNow(new Date(notif.createdAt))} ago
                                   </span>
                                </div>

                                {notif.issueId && (
                                  <Link 
                                    to={`/issues/${notif.issueId}`}
                                    className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-[9px] font-black text-white uppercase tracking-[0.2em] rounded-xl border border-white/10 transition-all flex items-center gap-3 group/link shadow-xl"
                                  >
                                     Review Details <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-1.5 transition-transform text-primary" />
                                  </Link>
                                )}

                                {!notif.isRead && (
                                  <div className="ml-auto hidden md:flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase tracking-widest bg-black/40 px-4 py-2 rounded-full border border-white/5 shadow-inner">
                                     Status: <span className="text-primary">Active Feed</span>
                                  </div>
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

           <div className="p-8 bg-white/5 border-t border-white/5 flex items-center justify-between backdrop-blur-3xl">
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Notification Center</span>
              <div className="flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_#10b981] animate-pulse" />
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-mega-wide">System Online</span>
              </div>
           </div>
        </div>
      </div>
    </Layout>
  );
}
