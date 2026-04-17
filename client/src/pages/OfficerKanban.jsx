import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/auth";
import { Layout } from "../components/layout/Layout";
import { Loader2, KanbanSquare, Target, Activity, CheckCircle2, GripVertical, MapPin, AlertTriangle, AlertCircle } from "lucide-react";
import { cn } from "../utils/helpers";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const COLUMNS = [
  { id: "REPORTED", title: "Reported", icon: Target, color: "text-primary/70" },
  { id: "IN_PROGRESS", title: "In Progress", icon: Activity, color: "text-amber-400" },
  { id: "RESOLVED", title: "Resolved", icon: CheckCircle2, color: "text-primary" },
];

export function OfficerKanban() {
  const queryClient = useQueryClient();
  const [movingId, setMovingId] = useState(null);
  const [draggedOver, setDraggedOver] = useState(null);

  const { data: issues, isLoading, isError } = useQuery({
    queryKey: ["kanbanIssues"],
    queryFn: async () => {
      const assignedRes = await api.get("/issues?assignedToMe=true");
      if (assignedRes.data?.length > 0) {
        return assignedRes.data;
      }
      return (await api.get("/issues")).data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ issueId, newStatus }) => api.patch(`/issues/${issueId}/status`, { newStatus, note: "Updated via Board." }),
    onMutate: () => setMovingId(true),
    onSuccess: () => {
      queryClient.invalidateQueries(["kanbanIssues"]);
      toast.success("Board synchronized");
    },
    onError: () => toast.error("Update failed. Clearance required."),
    onSettled: () => setMovingId(false),
  });

  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    setDraggedOver(null);
    const issueId = e.dataTransfer.getData("issueId");
    const currentStatus = e.dataTransfer.getData("currentStatus");
    
    if (currentStatus !== newStatus) {
      updateStatusMutation.mutate({ issueId, newStatus });
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full pt-48">
          <div className="flex flex-col items-center gap-6">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 animate-pulse">Syncing cases...</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (isError) {
    return (
      <Layout>
         <div className="max-w-4xl mx-auto px-4 py-32 text-center">
          <AlertCircle className="w-16 h-16 text-red-500/40 mx-auto mb-6" />
          <h2 className="text-3xl font-heading font-black text-white mb-4 uppercase tracking-tighter">Board Error</h2>
          <p className="text-slate-500 text-sm uppercase tracking-widest leading-loose">Unable to retrieve case data. Check connectivity.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-6 py-16 min-h-screen flex flex-col space-y-12 animate-in fade-in duration-1000">
        
        {/* Kanban Header & Metrics HUD */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
          <div className="space-y-3">
             <h1 className="text-hero-xl font-heading font-black text-white tracking-tighter uppercase">Board</h1>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row items-center gap-8 bg-black/40 border border-white/10 rounded-[40px] px-10 py-6 backdrop-blur-3xl shadow-2xl w-full md:w-auto relative group overflow-hidden"
          >
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="flex flex-col gap-2 w-full md:w-64">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                City Wide Health <Activity className="w-3 h-3 text-primary" />
              </span>
              <div className="flex items-center gap-4">
                <div className="h-2 flex-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round((issues?.filter(i => i.status === "RESOLVED").length / (issues?.length || 1)) * 100)}%` }}
                    className="h-full bg-primary shadow-[0_0_10px_#10b981]" 
                  />
                </div>
                <span className="text-sm font-black text-white min-w-[3ch]">
                  {Math.round((issues?.filter(i => i.status === "RESOLVED").length / (issues?.length || 1)) * 100)}%
                </span>
              </div>
            </div>
            
            <div className="hidden md:block w-px h-10 bg-white/10" />
            
            <div className="flex items-center gap-6 w-full md:w-auto">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Active Cases</span>
                <span className="text-2xl font-black text-white tracking-tighter">{issues?.filter(i => i.status !== "RESOLVED").length || 0}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Board Environment - Snap X implementation */}
        <div className="flex-1 overflow-x-auto pb-10 -mx-6 px-6 scrollbar-hide snap-x snap-mandatory">
          <div className="flex flex-row gap-8 h-full min-h-[600px] w-fit">
            {COLUMNS.map((column) => {
              const columnIssues = issues?.filter((issue) => issue.status === column.id) || [];
              const Icon = column.icon;
              const isOver = draggedOver === column.id;

              return (
                <div 
                  key={column.id}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDraggedOver(column.id);
                  }}
                  onDragLeave={() => setDraggedOver(null)}
                  onDrop={(e) => handleDrop(e, column.id)}
                  className={cn(
                    "relative flex flex-col rounded-[48px] bg-black/40 border transition-all duration-500 w-[85vw] md:w-[380px] shrink-0 h-fit min-h-[300px] snap-center",
                    isOver ? "border-primary bg-primary/5 scale-[1.02] shadow-[0_0_40px_rgba(16,185,129,0.1)]" : "border-white/5 shadow-2xl"
                  )}
                >
                  {/* Status Gradient Pulse */}
                  <div className={cn(
                    "absolute -top-20 left-1/2 -translate-x-1/2 w-48 h-48 blur-[80px] opacity-20 pointer-events-none transition-all duration-700",
                    column.id === "REPORTED" ? "bg-blue-500" : 
                    column.id === "IN_PROGRESS" ? "bg-amber-500" : "bg-emerald-500"
                  )} />

                  <div className="p-8 border-b border-white/5 bg-white/5 backdrop-blur-xl flex justify-between items-center relative z-10 rounded-t-[48px]">
                    <h3 className="text-[11px] font-black text-white flex items-center gap-4 uppercase tracking-[0.2em]">
                       <div className={cn("p-2.5 rounded-2xl bg-black/60 border border-white/10 shadow-2xl", column.color)}>
                          <Icon className="w-4 h-4" />
                       </div>
                       {column.title}
                    </h3>
                    <span className="px-3 py-1 bg-black/40 border border-white/10 rounded-full text-[10px] font-black text-slate-400 shadow-inner">
                      {columnIssues.length}
                    </span>
                  </div>

                  <div className="p-8 flex flex-col gap-6 relative z-10">
                     {columnIssues.map((issue) => (
                       <motion.div 
                          key={issue.id}
                          layoutId={issue.id}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("issueId", issue.id);
                            e.dataTransfer.setData("currentStatus", issue.status);
                          }}
                          className="p-7 bg-black/60 border border-white/5 hover:border-primary/40 transition-all cursor-grab active:cursor-grabbing rounded-[32px] relative group shadow-2xl hover:shadow-primary/10 overflow-hidden"
                       >
                          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          
                          {movingId && <div className="absolute inset-0 bg-black/80 z-10 rounded-[32px] flex items-center justify-center backdrop-blur-sm">
                             <Loader2 className="w-5 h-5 animate-spin text-primary" />
                          </div>}

                          <div className="flex justify-between items-start mb-5">
                             <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                               {issue.category}
                             </span>
                             <GripVertical className="w-4 h-4 text-slate-700 opacity-20 group-hover:opacity-100 transition-opacity" />
                          </div>
                          
                          <h4 className="text-lg font-heading font-black text-white mb-4 leading-[1.3] group-hover:text-primary/90 transition-colors">
                            {issue.title}
                          </h4>
                          
                          <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/5">
                             <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                <MapPin className="w-3.5 h-3.5 text-primary/60" /> {issue.area || "City Wide"}
                             </div>
                             {issue.slaBreached && (
                               <div className="flex items-center gap-1.5 text-[9px] font-black text-red-400 bg-red-400/5 px-3 py-1.5 rounded-full border border-red-400/10 uppercase tracking-tighter">
                                 <AlertTriangle className="w-3.5 h-3.5" /> Overdue
                               </div>
                             )}
                          </div>
                       </motion.div>
                     ))}
                     
                     {columnIssues.length === 0 && (
                        <div className="py-20 flex flex-col items-center justify-center text-center opacity-20 group">
                           <div className="w-16 h-16 border-2 border-dashed border-white/20 rounded-full flex items-center justify-center mb-4">
                              <Icon className="w-6 h-6 text-slate-500" />
                           </div>
                           <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">No active cases</p>
                        </div>
                     )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
}
