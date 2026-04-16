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
      // Fallback for fresh accounts with no direct assignments yet.
      const allRes = await api.get("/issues");
      return allRes.data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ issueId, newStatus }) => api.patch(`/issues/${issueId}/status`, { newStatus, note: "Status updated from Kanban." }),
    onMutate: () => setMovingId(true),
    onSuccess: () => {
      queryClient.invalidateQueries(["kanbanIssues"]);
      toast.success("Issue status updated!");
    },
    onError: () => toast.error("Failed to update status. Only Officers have access."),
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
        <div className="p-8 text-center text-red-500">Failed to load issues board.</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8 h-full flex flex-col">
        <div className="mb-6">
          <h1 className="text-3xl font-heading font-bold text-white flex items-center gap-3">
            <KanbanSquare className="w-8 h-8 text-primary" /> Issue Board
          </h1>
          <p className="text-gray-400 mt-1">Manage and track the progress of active civic issues through drag and drop.</p>
        </div>

        <div className="flex-1 overflow-x-auto pb-8 scrollbar-hide">
          <div className="grid grid-flow-col auto-cols-[minmax(280px,1fr)] gap-6 h-full min-h-[600px]">
          {COLUMNS.map((column) => {
            const columnIssues = issues?.filter((issue) => issue.status === column.id) || [];
            const Icon = column.icon;

            return (
              <div 
                key={column.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, column.id)}
                className="glass-card flex flex-col bg-white/5 border border-white/5 rounded-2xl overflow-hidden min-w-[280px] md:min-w-[320px]"
              >
                <div className="p-4 border-b border-white/5 bg-black/20 flex justify-between items-center">
                  <h3 className="font-heading font-bold text-white flex items-center gap-2">
                     <Icon className={cn("w-5 h-5", column.color)} />
                     {column.title}
                  </h3>
                  <span className="px-2.5 py-0.5 bg-white/10 rounded-full text-xs font-bold text-white">
                    {columnIssues.length}
                  </span>
                </div>

                <div className="p-4 flex-1 overflow-y-auto space-y-3 min-h-[300px]">
                   {columnIssues.map((issue) => (
                     <div 
                        key={issue.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("issueId", issue.id);
                          e.dataTransfer.setData("currentStatus", issue.status);
                        }}
                        className="p-4 bg-white/5 border border-white/10 hover:border-primary/50 hover:bg-white/10 rounded-xl cursor-grab active:cursor-grabbing transition-all relative group"
                     >
                        {movingId && <div className="absolute inset-0 bg-black/20 z-10 rounded-xl" />}
                        <div className="flex justify-between items-start mb-2">
                           <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-black/40 px-2 py-0.5 rounded">
                             {issue.category.replace(/_/g, " ")}
                           </span>
                           <GripVertical className="w-4 h-4 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <h4 className="text-sm font-semibold text-white mb-1 line-clamp-2">{issue.title}</h4>
                        <div className="flex items-center justify-between mt-3 text-xs text-gray-500 border-t border-white/5 pt-2">
                           <span>{issue.area || issue.city}</span>
                           {issue.slaBreached && (
                             <span className="text-red-400 font-bold px-1.5 py-0.5 bg-red-400/10 rounded">SLA Breached</span>
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
