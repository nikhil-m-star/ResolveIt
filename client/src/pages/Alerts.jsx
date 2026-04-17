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
  ArrowRight
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
      case "URGENT": return <ShieldAlert className="w-5 h-5 text-red-500" />;
      case "WARNING": return <CircleAlert className="w-5 h-5 text-amber-500" />;
      case "SUCCESS": return <Check className="w-5 h-5 text-emerald-500" />;
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
               <Activity className="w-3.5 h-3.5" /> Notifications
            </div>
            <h1 className="text-5xl font-heading font-black text-white tracking-tight uppercase">Alerts</h1>
          </div>

          <div className="flex items-center gap-3">
             {unreadCount > 0 && (
                <button 
                   onClick={() => markReadMutation.mutate()}
                   disabled={markReadMutation.isPending}
                   className="flex items-center gap-2 px-6 py-3 bg-primary/10 hover:bg-primary text-primary hover:text-black border border-primary/20 rounded-2xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50 shadow-lg"
                >
                   {markReadMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin"/> : <Check className="w-4 h-4" />}
                   Mark all as read
                </button>
             )}
          </div>
        </div>

        {/* Dashboard Controls */}
        <div className="flex items-center gap-2 bg-black p-1.5 border border-white/5 rounded-3xl w-fit">
           {["ALL", "UNREAD", "URGENT"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  filter === f ? "bg-primary text-black shadow-lg" : "text-slate-500 hover:text-white"
                )}
              >
                {f}
              </button>
           ))}
        </div>

        {/* Main Intelligence Feed */}
        <div className="glass-card overflow-hidden border-white/5 bg-black min-h-500 flex flex-col">
           <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                 <History className="w-3.5 h-3.5" /> Recent Activity
              </span>
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">{unreadCount} Unread</span>
           </div>

            <div className="flex-1 divide-y divide-white/5 bg-black/20">
               {isLoading ? (
                 <div className="p-32 flex flex-col items-center gap-8 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent h-1/2 w-full animate-scan" style={{ animationDuration: '3s' }} />
                    <div className="relative">
                       <div className="w-16 h-16 border-4 border-primary/20 rounded-full animate-ping absolute inset-0" />
                       <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin relative z-10" />
                    </div>
                    <div className="flex flex-col items-center gap-2">
                       <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] animate-pulse">Loading Notifications</span>
                       <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Checking for updates...</span>
                    </div>
                 </div>
               ) : filteredNotifications?.length === 0 ? (
                  <div className="p-32 text-center space-y-8">
                     <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-[3rem] flex items-center justify-center mx-auto shadow-2xl relative group">
                        <div className="absolute inset-0 bg-primary/20 rounded-[3rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <ShieldAlert className="w-10 h-10 text-slate-700 relative z-10" />
                     </div>
                     <div className="space-y-3">
                        <h3 className="text-2xl font-black text-white uppercase tracking-tight">All clear</h3>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest max-w-xs mx-auto">You have no new notifications at this time.</p>
                     </div>
                  </div>
               ) : (
                 <div className="flex flex-col h-full">
                   <AnimatePresence mode="popLayout">
                     {filteredNotifications?.map((notif, index) => (
                       <motion.div 
                         key={notif.id}
                         initial={{ opacity: 0, scale: 0.98, y: 10 }}
                         animate={{ opacity: 1, scale: 1, y: 0 }}
                         exit={{ opacity: 0, scale: 0.95, x: 20 }}
                         transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: index * 0.05 }}
                         className={cn(
                           "p-10 transition-all relative group border-b border-white/5",
                           !notif.isRead ? "bg-primary/[0.02] hover:bg-primary/[0.04]" : "opacity-40 hover:opacity-70"
                         )}
                       >
                         {!notif.isRead && (
                           <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary shadow-[0_0_20px_rgba(16,185,129,0.5)]" />
                         )}
                         
                         <div className="flex flex-col md:flex-row gap-10">
                           <div className={cn(
                             "shrink-0 w-16 h-16 rounded-2xl border-2 flex items-center justify-center transition-all shadow-2xl relative overflow-hidden",
                             !notif.isRead ? "bg-black border-primary/40 text-primary" : "bg-white/5 border-white/10 text-slate-600"
                           )}>
                             {!notif.isRead && <div className="absolute inset-0 bg-primary/5 animate-pulse" />}
                             <div className="relative z-10">{getIcon(notif.type)}</div>
                           </div>
                           
                           <div className="flex-1 space-y-4">
                             <div className="flex items-start justify-between gap-6">
                                <div className="space-y-1">
                                   <div className="flex items-center gap-3">
                                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Type: {notif.type}</span>
                                      <div className="h-px w-8 bg-white/10" />
                                   </div>
                                   <p className={cn(
                                     "text-xl leading-snug tracking-tight",
                                     !notif.isRead ? "text-white font-black uppercase" : "text-slate-400 font-bold uppercase"
                                   )}>
                                     {notif.message}
                                   </p>
                                </div>
                                {!notif.isRead && (
                                  <div className="flex items-center gap-1.5 px-3 py-1 bg-primary text-black text-[9px] font-black uppercase tracking-widest rounded shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                                     <Activity className="w-3 h-3" /> Priority
                                  </div>
                                )}
                             </div>
                             
                             <div className="flex flex-wrap items-center gap-8 pt-2">
                               <div className="flex items-center gap-2">
                                  <Clock className="w-3.5 h-3.5 text-slate-600" />
                                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    {formatDistanceToNow(new Date(notif.createdAt))} ago
                                  </span>
                               </div>

                               {notif.issueId && (
                                 <Link 
                                   to={`/issues/${notif.issueId}`}
                                   className="text-[10px] font-black text-primary hover:text-emerald-400 uppercase tracking-widest transition-all flex items-center gap-2 group/link border-b border-primary/0 hover:border-primary/40 pb-0.5"
                                 >
                                    View Details <ArrowRight className="w-3 h-3 group-hover/link:translate-x-1 transition-transform" />
                                 </Link>
                               )}

                               {!notif.isRead && (
                                 <div className="ml-auto hidden md:flex items-center gap-2 px-3 py-1 bg-white/5 rounded border border-white/10 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                    Status: UNVERIFIED
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

           <div className="p-6 bg-white/5 border-t border-white/5 flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-mega-wide">ResolveIt Notification Center</span>
              <div className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                 <span className="text-[9px] font-black text-slate-500 uppercase">System Ready</span>
              </div>
           </div>
        </div>
      </div>
    </Layout>
  );
}
