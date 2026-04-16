import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/auth";
import { Layout } from "../components/layout/Layout";
import { Loader2, KanbanSquare, Target, Activity, CheckCircle2, GripVertical } from "lucide-react";
import { cn } from "../utils/helpers";
import toast from "react-hot-toast";

const COLUMNS = [
  { id: "REPORTED", title: "Reported", icon: Target, color: "text-blue-400" },
  { id: "IN_PROGRESS", title: "In Progress", icon: Activity, color: "text-amber-400" },
  { id: "RESOLVED", title: "Resolved", icon: CheckCircle2, color: "text-emerald-400" },
];

export function OfficerKanban() {
  const queryClient = useQueryClient();
  const [movingId, setMovingId] = useState(null);

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
    mutationFn: ({ issueId, newStatus }) => api.patch(`/issues/${issueId}/status`, { newStatus, note: "Updated via Tactical Kanban." }),
    onMutate: () => setMovingId(true),
    onSuccess: () => {
      queryClient.invalidateQueries(["kanbanIssues"]);
      toast.success("Case status synchronized");
    },
    onError: () => toast.error("Deployment failed. Official clearance required."),
    onSettled: () => setMovingId(false),
  });

  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    const issueId = e.dataTransfer.getData("issueId");
    const currentStatus = e.dataTransfer.getData("currentStatus");
    
    if (currentStatus !== newStatus) {
      updateStatusMutation.mutate({ issueId, newStatus });
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full pt-32 text-primary">
          <Loader2 className="w-10 h-10 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (isError) {
    return (
      <Layout>
         <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Tactical Grid Failure</h2>
          <p className="text-slate-400">Unable to retrieve case data. Check connectivity or clearance.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-12 h-[calc(100vh-120px)] flex flex-col space-y-8 animate-in fade-in duration-700">
        
        {/* Kanban Header */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
               <KanbanSquare className="w-3.5 h-3.5" /> Operations Board
            </div>
            <h1 className="text-4xl font-heading font-extrabold text-white tracking-tight">Deployment Strategy</h1>
            <p className="text-slate-400 font-medium">Coordinate and track field operations through real-time case orchestration.</p>
          </div>
        </div>

        {/* Board */}
        <div className="flex-1 overflow-x-auto pb-6 -mx-4 px-4 scrollbar-hide">
          <div className="grid grid-flow-col auto-cols-[minmax(320px,1fr)] gap-8 h-full">
            {COLUMNS.map((column) => {
              const columnIssues = issues?.filter((issue) => issue.status === column.id) || [];
              const Icon = column.icon;

              return (
                <div 
                  key={column.id}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, column.id)}
                  className="flex flex-col rounded-[2rem] bg-slate-950/40 border border-white/5 overflow-hidden backdrop-blur-3xl shadow-2xl"
                >
                  <div className="p-6 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                    <h3 className="text-sm font-black text-white flex items-center gap-3 uppercase tracking-widest">
                       <div className={cn("p-2 rounded-xl bg-slate-900 border border-white/5 shadow-inner", column.color)}>
                          <Icon className="w-4 h-4" />
                       </div>
                       {column.title}
                    </h3>
                    <span className="w-7 h-7 flex items-center justify-center bg-slate-900 border border-white/5 rounded-full text-[10px] font-black text-slate-400 shadow-inner">
                      {columnIssues.length}
                    </span>
                  </div>

                  <div className="p-6 flex-1 overflow-y-auto space-y-4 scrollbar-hide">
                     {columnIssues.map((issue) => (
                       <div 
                          key={issue.id}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("issueId", issue.id);
                            e.dataTransfer.setData("currentStatus", issue.status);
                          }}
                          className="p-5 bg-slate-900/60 border border-white/5 hover:border-primary/50 hover:bg-slate-800 transition-all cursor-grab active:cursor-grabbing rounded-2xl relative group shadow-xl"
                       >
                          {movingId && <div className="absolute inset-0 bg-black/40 z-10 rounded-2xl animate-pulse" />}
                          <div className="flex justify-between items-start mb-4">
                             <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 bg-black/50 px-2.5 py-1 rounded-lg border border-white/5">
                               {issue.category.replace(/_/g, " ")}
                             </span>
                             <GripVertical className="w-4 h-4 text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <h4 className="text-sm font-bold text-white mb-2 leading-snug line-clamp-2">{issue.title}</h4>
                          <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
                             <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase">
                                <MapPin className="w-3 h-3 text-primary" /> {issue.area || issue.city}
                             </div>
                             {issue.slaBreached && (
                               <div className="flex items-center gap-1 text-[9px] font-black text-red-500 bg-red-500/10 px-2.5 py-1 rounded-lg border border-red-500/20 uppercase tracking-tighter">
                                 <AlertTriangle className="w-3 h-3" /> Breach
                               </div>
                             )}
                          </div>
                       </div>
                     ))}
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
