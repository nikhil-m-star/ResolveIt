import { useState, useMemo } from "react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  BarChart, Bar, XAxis, YAxis
} from "recharts";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/auth";
import { Layout } from "../components/layout/Layout";
import { Loader2, KanbanSquare, Target, Activity, CheckCircle2, GripVertical, MapPin, AlertTriangle, AlertCircle, Clock3, ShieldCheck, Flame, Users } from "lucide-react";
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
  const decodeJwtPayload = (token) => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      return JSON.parse(atob(base64));
    } catch { return {}; }
  };

  const token = localStorage.getItem("resolveit_token");
  const userData = decodeJwtPayload(token || "");
  const userRole = userData.role || "CITIZEN";
  const userArea = userData.area || "";
  const isOfficer = ["OFFICER", "PRESIDENT"].includes(userRole);

  const { data: issues, isLoading, isError } = useQuery({
    queryKey: ["kanbanIssues"],
    queryFn: async () => {
      // If officer, prioritize sector-wide reports. 
      if (isOfficer) {
        const res = await api.get("/issues?areaReports=true");
        // Only return if we actually have area-specific data, else fall back to global visibility
        if (res.data?.length > 0) return res.data;
      }
      return (await api.get("/issues")).data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ issueId, newStatus }) => {
      if (!isOfficer) throw new Error("Unauthorized");
      return api.patch(`/issues/${issueId}/status`, { newStatus, note: "Updated via Transparency Board." });
    },
    onMutate: () => setMovingId(true),
    onSuccess: () => {
      queryClient.invalidateQueries(["kanbanIssues"]);
      toast.success("Board synchronized");
    },
    onError: () => toast.error("Update failed. Personnel clearance required."),
    onSettled: () => setMovingId(false),
  });

  const categoryData = useMemo(() => {
    if (!issues) return [];
    const counts = {};
    issues.forEach(i => counts[i.category] = (counts[i.category] || 0) + 1);
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [issues]);

  const statusData = useMemo(() => {
    if (!issues) return [];
    const counts = { REPORTED: 0, IN_PROGRESS: 0, RESOLVED: 0, REJECTED: 0 };
    issues.forEach(i => counts[i.status] = (counts[i.status] || 0) + 1);
    return [
      { name: "Reported", value: counts.REPORTED },
      { name: "In Progress", value: counts.IN_PROGRESS },
      { name: "Resolved", value: counts.RESOLVED }
    ];
  }, [issues]);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    if (!isOfficer) {
      toast.error("Public view only. Handling restricted to officers.");
      setDraggedOver(null);
      return;
    }
    setDraggedOver(null);
    const issueId = e.dataTransfer.getData("issueId");
    const currentStatus = e.dataTransfer.getData("currentStatus");
    const issueArea = e.dataTransfer.getData("issueArea");
    
    // UI check before firing mutation
    if (userRole === "OFFICER" && issueArea !== userArea) {
      toast.error(`Operational Breach: Incident ${issueId.slice(-4)} is outside your sector.`);
      return;
    }

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
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 animate-pulse">Establishing secure link...</span>
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
          <h2 className="text-3xl font-heading font-black text-white mb-4 uppercase tracking-tighter">Diagnostic Error</h2>
          <p className="text-slate-500 text-sm uppercase tracking-widest leading-loose">Unable to establish case board connection.</p>
        </div>
      </Layout>
    );
  }

  const resolvedCount = issues?.filter(i => i.status === "RESOLVED").length || 0;
  const reportedCount = issues?.filter(i => i.status === "REPORTED").length || 0;
  const inProgressCount = issues?.filter(i => i.status === "IN_PROGRESS").length || 0;
  const slaBreachedCount = issues?.filter(i => i.slaBreached).length || 0;
  const unresolvedCount = reportedCount + inProgressCount;
  const totalVotes = issues?.reduce((sum, issue) => sum + (issue.votes || 0), 0) || 0;
  const totalCount = issues?.length || 1;
  const resolutionRate = Math.round((resolvedCount / totalCount) * 100);
  const avgVotes = Math.round(totalVotes / totalCount);
  const topArea = Object.entries(
    (issues || []).reduce((acc, issue) => {
      const key = issue.area || issue.city || "City Wide";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1])[0]?.[0] || "City Wide";

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-16 min-h-screen flex flex-col space-y-8 animate-in fade-in duration-1000">
        
        {/* Kanban Header & Metrics HUD */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-3">
             <div className="flex items-center gap-3 mb-2">
                <div className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-[8px] font-black text-primary uppercase tracking-[0.2em]">Live Data</div>
                {!isOfficer && (
                  <div className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-[8px] font-black text-cyan-300 uppercase tracking-[0.2em]">Citizen View</div>
                )}
             </div>
             <h1 className="text-hero-xl font-heading font-black text-white tracking-tighter uppercase leading-tight">Public Case Board</h1>
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest max-w-sm">
               {isOfficer
                 ? "Transparency in administrative handling and metropolitan resolution progress."
                 : "Live visibility into city handling status, case flow, and response performance."}
             </p>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row items-center gap-6 bg-black/40 border border-white/10 rounded-[28px] px-5 py-4 backdrop-blur-3xl shadow-2xl w-full md:w-auto relative group overflow-hidden"
          >
            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            
            <div className="flex flex-col gap-2 w-full md:w-64">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                City Resolution Speed <Activity className="w-3 h-3 text-primary" />
              </span>
              <div className="flex items-center gap-4">
                <div className="h-2 flex-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${resolutionRate}%` }}
                    className="h-full bg-primary shadow-[0_0_15px_#10b981]" 
                  />
                </div>
                <span className="text-sm font-black text-white min-w-[3ch]">
                  {resolutionRate}%
                </span>
              </div>
            </div>
            
            <div className="hidden md:block w-px h-10 bg-white/10" />
            
            <div className="flex items-center justify-between md:justify-start gap-6 w-full md:w-auto">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">In Handling</span>
                <span className="text-xl font-black text-white tracking-tighter">{issues?.filter(i => i.status !== "RESOLVED").length || 0}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Metropolitan SLA</span>
                <span className="text-xl font-black text-primary tracking-tighter">Optimal</span>
              </div>
            </div>
          </motion.div>
        </div>

        {!isOfficer && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="glass-card p-6 rounded-[32px] h-80 border border-white/5 flex flex-col relative overflow-hidden shadow-2xl bg-black/40">
              <h3 className="text-white font-black text-[10px] uppercase tracking-[0.2em] mb-2 opacity-50 z-10 flex items-center gap-2">
                 <Target className="w-3.5 h-3.5"/> Sector Incident Breakdown
              </h3>
              <ResponsiveContainer width="100%" height="100%" className="z-10">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none">
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: '#fff', fontSize: '10px', textTransform: 'uppercase', fontWeight: 900 }} itemStyle={{ color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent z-0 pointer-events-none"></div>
            </div>
            
            <div className="glass-card p-6 rounded-[32px] h-80 border border-white/5 flex flex-col relative overflow-hidden shadow-2xl bg-black/40">
              <h3 className="text-white font-black text-[10px] uppercase tracking-[0.2em] mb-2 opacity-50 z-10 flex items-center gap-2">
                 <Activity className="w-3.5 h-3.5"/> Official Resolution Pipeline
              </h3>
              <ResponsiveContainer width="100%" height="100%" className="z-10">
                <BarChart data={statusData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} fontWeight={900} />
                  <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                  <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: '#fff', fontSize: '10px', textTransform: 'uppercase', fontWeight: 900 }} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={40}>
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.name === 'Resolved' ? '#10b981' : entry.name === 'In Progress' ? '#f59e0b' : '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 bg-gradient-to-t from-blue-500/5 to-transparent z-0 pointer-events-none"></div>
            </div>
          </div>
        )}

        {/* Board Environment - Snap X implementation */}
        <div className="flex-1 overflow-x-auto pb-8 -mx-4 px-4 scrollbar-hide snap-x snap-mandatory">
          <div className="flex flex-row gap-4 h-full min-h-[500px] w-fit">
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
                    "relative flex flex-col rounded-[32px] bg-black/40 border transition-all duration-500 w-[85vw] shrink-0 h-fit min-h-[300px] snap-center",
                    isOver ? "border-primary bg-primary/5 scale-[1.02] shadow-[0_0_40px_rgba(16,185,129,0.1)]" : "border-white/5 shadow-2xl"
                  )}
                >
                  {/* Status Gradient Pulse */}
                  <div className={cn(
                    "absolute -top-20 left-1/2 -translate-x-1/2 w-48 h-48 blur-[80px] opacity-20 pointer-events-none transition-all duration-700",
                    column.id === "REPORTED" ? "bg-blue-500" : 
                    column.id === "IN_PROGRESS" ? "bg-amber-500" : "bg-emerald-500"
                  )} />

                  <div className="p-5 border-b border-white/5 bg-white/5 backdrop-blur-xl flex justify-between items-center relative z-10 rounded-t-[32px]">
                    <h3 className="text-[10px] font-black text-white flex items-center gap-3 uppercase tracking-[0.2em]">
                       <div className={cn("p-2.5 rounded-2xl bg-black/60 border border-white/10 shadow-2xl", column.color)}>
                          <Icon className="w-4 h-4" />
                       </div>
                       {column.title}
                    </h3>
                    <span className="px-3 py-1 bg-black/40 border border-white/10 rounded-full text-[10px] font-black text-slate-400 shadow-inner">
                      {columnIssues.length}
                    </span>
                  </div>

                  <div className="p-5 flex flex-col gap-4 relative z-10">
                     {columnIssues.map((issue) => (
                       <motion.div 
                          key={issue.id}
                          layoutId={issue.id}
                          draggable={isOfficer}
                          onDragStart={(e) => {
                            if (!isOfficer) return;
                            
                            // Check permission
                            const hasPermission = userRole === "PRESIDENT" || issue.area === userArea;
                            if (!hasPermission) {
                               toast.error("Sector Restricted: High-clearance transfer required.");
                               e.preventDefault();
                               return;
                            }

                            e.dataTransfer.setData("issueId", issue.id);
                            e.dataTransfer.setData("currentStatus", issue.status);
                            e.dataTransfer.setData("issueArea", issue.area || "");
                          }}
                          className={cn(
                            "p-5 bg-black/60 border border-white/5 hover:border-primary/40 transition-all rounded-[24px] relative group shadow-2xl hover:shadow-primary/10 overflow-hidden",
                            isOfficer && (userRole === "PRESIDENT" || issue.area === userArea) ? "cursor-grab active:cursor-grabbing" : "cursor-default opacity-80"
                          )}
                        >
                          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          
                          {movingId && <div className="absolute inset-0 bg-black/80 z-10 rounded-[32px] flex items-center justify-center backdrop-blur-sm">
                             <Loader2 className="w-5 h-5 animate-spin text-primary" />
                          </div>}

                          <div className="flex justify-between items-start mb-5">
                             <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                               {issue.category}
                             </span>
                             {isOfficer && (userRole === "PRESIDENT" || issue.area === userArea) ? (
                               <GripVertical className="w-4 h-4 text-slate-700 opacity-20 group-hover:opacity-100 transition-opacity" />
                             ) : (
                               <span className="text-[8px] font-black uppercase tracking-[0.2em] text-red-400 bg-red-400/5 border border-red-400/20 px-2.5 py-1 rounded-full uppercase">
                                 {isOfficer ? "Sector Restricted" : "View Only"}
                               </span>
                             )}
                          </div>
                          
                          <h4 className="text-lg font-heading font-black text-white mb-3 leading-[1.3] group-hover:text-primary/90 transition-colors">
                            {issue.title}
                          </h4>
                          
                          <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/5">
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
