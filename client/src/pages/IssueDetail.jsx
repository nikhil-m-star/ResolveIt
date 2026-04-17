import { useParams, Link } from "react-router-dom";
import { useIssue } from "../hooks/useIssue";
import { Layout } from "../components/layout/Layout";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/auth";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import { 
  Bot, MapPin, ArrowBigUp, ArrowBigDown, Clock, AlertTriangle, MessageSquare, 
  Loader2, CheckCircle2, Shield, ShieldAlert, Activity, Terminal, Fingerprint,
  ChevronRight, Database, Search
} from "lucide-react";
import { cn, getCategoryIconNode, getCategoryColor, getStatusColor, evaluateIntensityColor } from "../utils/helpers";
import { useState } from "react";

export function IssueDetail() {
  const { id } = useParams();
  const { data: issue, isLoading, isError } = useIssue(id);
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [selectedStatus, setSelectedStatus] = useState(issue?.status || "REPORTED");

  // Read role from JWT
  const decodeJwtPayload = (token) => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      return JSON.parse(atob(base64));
    } catch { return {}; }
  };
  const token = localStorage.getItem("resolveit_token");
  const userData = token ? decodeJwtPayload(token) : {};
  const userRole = userData.role || "CITIZEN";
  const userArea = userData.area || "";
  const isOfficial = userRole === "OFFICER" || userRole === "PRESIDENT";
  const canUpdateStatus = userRole === "PRESIDENT" || (userRole === "OFFICER" && String(issue?.area || "").trim().toLowerCase() === String(userArea).trim().toLowerCase());

  const voteMutation = useMutation({
    mutationFn: (type) => api.post(`/issues/${id}/vote`, { type }),
    onSuccess: () => queryClient.invalidateQueries(["issue", id]),
    onError: () => toast.error("Failed to register vote"),
  });

  const commentMutation = useMutation({
    mutationFn: () => api.post(`/issues/${id}/comments`, { text: comment }),
    onSuccess: () => {
      setComment("");
      queryClient.invalidateQueries(["issue", id]);
      toast.success("Comment added");
    },
    onError: () => toast.error("Failed to comment"),
  });

  const statusMutation = useMutation({
    mutationFn: (data) => api.patch(`/issues/${id}/status`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["issue", id]);
      toast.success("Status updated successfully");
      setStatusNote("");
    },
    onError: () => toast.error("Failed to update status"),
  });

  const handleUpdateStatus = () => {
    statusMutation.mutate({ newStatus: selectedStatus, note: statusNote });
  };

  const handleSubmitComment = async (e) => {
      e.preventDefault();
      if (!comment.trim()) return;
      commentMutation.mutate();
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full text-primary pt-20">
          <Loader2 className="w-10 h-10 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (isError || !issue) {
    return (
      <Layout>
        <div className="p-8 text-center text-red-500 font-medium">Failed to load issue details.</div>
      </Layout>
    );
  }

  const isResolved = issue.status === "RESOLVED";

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        
        {/* Status Update (Officials with Permission Only) */}
        {isOfficial && (
          canUpdateStatus ? (
            <div className="glass-card bg-black/60 border-l-[6px] border-primary p-6 animate-in slide-in-from-top-6 duration-700 shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
                  <Terminal className="w-32 h-32 text-primary" />
               </div>
               
               <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                  <div className="flex items-center gap-4 shrink-0">
                     <div className="w-12 h-12 bg-primary flex items-center justify-center rounded-xl shadow-lg">
                        <Shield className="w-6 h-6 text-black" />
                     </div>
                     <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Update Status</h3>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Role: {userRole} | Sector: {userArea}</p>
                     </div>
                  </div>

                  <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                     <div className="md:col-span-3">
                        <select 
                          value={selectedStatus}
                          onChange={(e) => setSelectedStatus(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white focus:outline-none focus:border-primary/40 transition-all"
                        >
                           <option value="REPORTED">Reported</option>
                           <option value="IN_PROGRESS">Processing</option>
                           <option value="RESOLVED">Resolved</option>
                           <option value="REJECTED">Cancelled</option>
                        </select>
                     </div>
                     <div className="md:col-span-6 relative group/input">
                        <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within/input:text-primary transition-colors" />
                        <input 
                          type="text"
                          value={statusNote}
                          onChange={(e) => setStatusNote(e.target.value)}
                          placeholder="ADD A NOTE..."
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-[10px] font-black uppercase tracking-widest text-white placeholder:text-slate-700 focus:outline-none focus:border-primary/40 transition-all"
                        />
                     </div>
                     <div className="md:col-span-3">
                        <button 
                          onClick={handleUpdateStatus}
                          disabled={statusMutation.isPending || selectedStatus === issue.status}
                          className="w-full py-3 bg-primary hover:bg-emerald-400 text-black text-[10px] font-black uppercase tracking-widest rounded-xl shadow-xl transition-all disabled:opacity-50 active:scale-95"
                        >
                           {statusMutation.isPending ? "Saving..." : "Update"}
                        </button>
                     </div>
                  </div>
               </div>
            </div>
          ) : (
             <div className="glass-card bg-red-500/10 border-l-[6px] border-red-500 p-6 animate-in slide-in-from-top-6 duration-700 shadow-2xl relative overflow-hidden group">
                <div className="flex items-center gap-6">
                   <div className="w-12 h-12 bg-red-500/20 flex items-center justify-center rounded-xl">
                      <ShieldAlert className="w-6 h-6 text-red-500" />
                   </div>
                   <div>
                      <h3 className="text-sm font-black text-red-400 uppercase tracking-widest">Permission Restricted</h3>
                      <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mt-1">This report is in {issue.area || issue.city}, which is outside your assigned sector ({userArea}).</p>
                   </div>
                </div>
             </div>
          )
        )}

        {/* Diagnostic Header Block */}
        <div className="glass-card bg-black/40 border border-white/5 p-8 md:p-12 flex flex-col md:flex-row gap-12 items-start relative overflow-hidden group hover-glow transition-all duration-700">
          <div className="absolute top-0 left-0 w-full h-1 bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="flex-1 space-y-8 w-full relative z-10">
            <div className="flex flex-wrap items-center gap-4">
               <div className={cn(
                 "px-4 py-2 rounded-lg border-2 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em]",
                 getCategoryColor(issue.category).replace('bg-', 'bg-').replace('text-', 'text-')
               )}>
                 <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                 {issue.category.replace(/_/g, " ")}
               </div>
               
               <div className={cn(
                 "px-4 py-2 rounded-lg border-2 text-[10px] font-black uppercase tracking-[0.2em]",
                 getStatusColor(issue.status)
               )}>
                 STATUS: {issue.status.replace(/_/g, " ")}
               </div>

               {issue.slaBreached && (
                 <div className="px-4 py-2 bg-red-500 text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-lg animate-pulse flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" /> PRIORITY_ESCALATION
                 </div>
               )}
            </div>

            <div className="space-y-4">
               <div className="flex items-center gap-3 text-slate-500 group-hover:text-primary transition-colors">
                  <Activity className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-[0.4em]">Reference: #{issue.id.slice(-8).toUpperCase()}</span>
               </div>
               <h1 className="text-hero-lg font-heading font-black text-white tracking-tighter uppercase leading-none">
                 {issue.title}
               </h1>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
               {[
                 { icon: MapPin, label: issue.area || issue.city, color: "text-primary" },
                 { icon: Clock, label: formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true }), color: "text-blue-400" },
                 { icon: Database, label: `${issue.isAnonymous ? "Reported Anonymously" : "Verified User"}`, color: "text-emerald-400" }
               ].map((meta, i) => (
                 <div key={i} className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                    <meta.icon className={cn("w-3.5 h-3.5", meta.color)} />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{meta.label}</span>
                 </div>
               ))}
            </div>

            <div className="max-w-2xl">
               <div className="flex items-center gap-2 mb-4 text-slate-600">
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Description</span>
                  <div className="h-px flex-1 bg-white/10" />
               </div>
               <p className="text-slate-400 leading-relaxed text-lg font-medium border-l-2 border-white/10 pl-6">
                 "{issue.description}"
               </p>
            </div>
          </div>

          {/* Metric Stack */}
          <div className="w-full md:w-72 flex flex-col gap-6 shrink-0 pt-8 md:pt-0">
             <div className="bg-white/5 border border-white/10 rounded-6xl p-8 flex flex-col items-center gap-4 shadow-2xl relative overflow-hidden group/votes">
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/votes:opacity-100 transition-opacity duration-700" />
                <button 
                   onClick={() => voteMutation.mutate('UP')}
                   disabled={voteMutation.isPending}
                   className={cn(
                     "w-full py-2 flex items-center justify-center transition-all active:scale-95 disabled:opacity-50",
                     issue.userVote === 'UP' ? "text-primary scale-125" : "text-slate-600 hover:text-primary"
                   )}
                >
                   <ArrowBigUp className={cn("w-14 h-14", issue.userVote === 'UP' ? "fill-primary" : "fill-none")} />
                </button>
                <div className="flex flex-col items-center relative z-10">
                   <span className={cn("text-5xl font-heading font-black tracking-tighter transition-colors", issue.userVote ? "text-primary" : "text-white")}>{issue.votes}</span>
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-2">Grid Priority</span>
                </div>
                <button 
                   onClick={() => voteMutation.mutate('DOWN')}
                   disabled={voteMutation.isPending}
                   className={cn(
                     "w-full py-2 flex items-center justify-center transition-all active:scale-95 disabled:opacity-50",
                     issue.userVote === 'DOWN' ? "text-red-500 scale-125" : "text-slate-600 hover:text-red-500"
                   )}
                >
                   <ArrowBigDown className={cn("w-14 h-14", issue.userVote === 'DOWN' ? "fill-red-500" : "fill-none")} />
                </button>
             </div>

             {/* AI Insights Card */}
             {(issue.intensity || issue.etaDays) && (
               <>
                 {!isOfficial && (
                   <div className="glass-card p-6 bg-black border-primary/20 relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-4 opacity-10"><ShieldAlert className="w-24 h-24 text-primary" /></div>
                     <div className="relative z-10">
                       <h3 className="text-lg font-bold text-primary flex items-center gap-2 mb-2">
                        <ShieldAlert className="w-5 h-5" /> Role Verification
                       </h3>
                       <p className="text-sm text-slate-400 mb-6 relative z-10 leading-relaxed">
                         Officer assignment is restricted to President-level controls. Contact strategic command for role elevation.
                       </p>
                       <div className="w-full py-3 bg-white/5 text-slate-500 font-bold rounded-xl relative z-10 flex items-center justify-center gap-2 border border-white/5">
                          President Approval Pending
                       </div>
                     </div>
                   </div>
                 )}
                 <div className="w-full bg-white/5 border border-white/10 rounded-xl p-4 space-y-3 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-2 opacity-10"><Bot className="w-16 h-16" /></div>
                   <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Bot className="w-4 h-4 text-primary" /> AI Insights
                   </h4>
                   {issue.intensity && (
                     <div>
                       <div className="flex justify-between text-sm mb-1 font-medium">
                          <span className="text-slate-300">Severity</span>
                          <span className={cn("text-primary", evaluateIntensityColor(issue.intensity).replace("bg-", "text-").replace("500", "400"))}>{issue.intensity}/10</span>
                       </div>
                       <div className="w-full bg-black rounded-full h-2">
                         <div className={cn("h-2 rounded-full", evaluateIntensityColor(issue.intensity))} style={{ width: `${(issue.intensity/10)*100}%` }}></div>
                       </div>
                     </div>
                   )}
                   {issue.etaDays && !isResolved && (
                     <div className="pt-2 border-t border-white/10">
                       <div className="text-sm font-medium text-slate-300 flex justify-between items-center">
                          <span>Expected Resolution</span>
                          <span className="text-primary font-bold bg-primary/10 px-2 py-0.5 rounded border border-primary/20">~{issue.etaDays} Days</span>
                       </div>
                     </div>
                   )}
                 </div>
               </>
             )}
          </div>
        </div>

        {/* Media Gallery */}
        {issue.imageUrls?.length > 0 && (
          <div className="space-y-3">
             <h3 className="text-lg font-heading font-semibold text-white">Evidence</h3>
             <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
               {issue.imageUrls.map((url, i) => (
                 <a key={i} href={url} target="_blank" rel="noreferrer" className="shrink-0 group">
                   <div className="w-64 h-48 sm:w-80 sm:h-60 rounded-xl overflow-hidden border border-white/10 relative">
                     <img src={url} alt={`Evidence ${i+1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                     <div className="absolute inset-0 bg-black/40 opacity-0 group:hover:opacity-100 flex items-center justify-center transition-opacity">
                        <span className="bg-white/20 backdrop-blur text-white px-3 py-1.5 rounded-full text-sm font-medium border border-white/30">View Full</span>
                     </div>
                   </div>
                 </a>
               ))}
             </div>
          </div>
        )}

        {/* Diagnostic Timeline & Dialogue */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           
           {/* High-Fidelity Audit Trail */}
           <div className="lg:col-span-1 glass-card bg-black/40 border border-white/5 p-8 flex flex-col gap-8">
             <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
                   <Activity className="w-4 h-4 text-primary" /> History
                </h3>
             </div>
             
             <div className="space-y-10 relative">
               {/* Sequencing Track */}
               <div className="absolute left-[13px] top-2 bottom-2 w-px bg-white/5 overflow-hidden">
                  <div className="w-full h-full bg-primary/10 animate-scan" style={{ animationDuration: '4s' }} />
               </div>

               {/* Origin Point */}
               <div className="relative pl-10 group/step">
                  <div className="absolute left-0 top-1 w-7 h-7 rounded-lg bg-black border border-primary/40 flex items-center justify-center z-10 group-hover/step:border-primary transition-colors">
                     <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-white uppercase tracking-widest">Problem Reported</p>
                    <p className="text-[10px] text-slate-500 uppercase font-bold">{formatDistanceToNow(new Date(issue.createdAt))} ago</p>
                  </div>
               </div>

               {/* Shift Logs */}
               {issue.statusHistory?.map((history, idx) => (
                 <div key={history.id} className="relative pl-10 group/step">
                    <div className="absolute left-0 top-1 w-7 h-7 rounded-lg bg-black border border-white/10 flex items-center justify-center z-10 group-hover/step:border-primary transition-colors shadow-2xl">
                       {history.newStatus === "RESOLVED" ? (
                         <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                       ) : (
                         <ChevronRight className="w-4 h-4 text-slate-500 group-hover/step:text-primary transition-colors" />
                       )}
                    </div>
                    <div className="space-y-2">
                       <div className="flex items-center justify-between gap-4">
                          <p className="text-[10px] font-black text-white uppercase tracking-widest">Update 0{idx + 1}</p>
                          <span className={cn("px-2 py-0.5 text-[8px] font-black uppercase rounded border", getStatusColor(history.newStatus))}>{history.newStatus}</span>
                       </div>
                       <p className="text-[9px] font-bold text-slate-500 uppercase">By {history.user?.name} • {formatDistanceToNow(new Date(history.createdAt))} ago</p>
                       {history.note && (
                         <div className="p-4 bg-white/5 border border-white/5 rounded-xl text-xs text-slate-400 font-medium leading-relaxed">
                           "{history.note}"
                         </div>
                       )}
                    </div>
                 </div>
               ))}
             </div>

             {/* Assigned Officer Block */}
             {issue.assignedTo && (
                <div className="mt-8 pt-6 border-t border-white/10">
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Assigned Officer</h4>
                  <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                       {issue.assignedTo.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white w-150 truncate">{issue.assignedTo.name}</p>
                      <p className="text-xs text-slate-400">Field Officer</p>
                    </div>
                  </div>
                </div>
             )}
           </div>

           {/* Comments Block */}
           <div className="lg:col-span-2 glass-card bg-black border border-white/5 p-6 flex flex-col h-full min-h-400">
             <h3 className="text-lg font-heading font-semibold text-white flex items-center gap-2 mb-6">
                <MessageSquare className="w-5 h-5 text-slate-400" /> Discussion
             </h3>
             
             <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {issue.comments?.length === 0 ? (
                  <div className="h-40 flex items-center justify-center text-slate-500 text-sm">
                    No comments yet. Start the discussion!
                  </div>
                ) : (
                   issue.comments?.map(c => (
                     <div key={c.id} className="bg-white/5 border border-white/5 p-4 rounded-xl space-y-2">
                       <div className="flex justify-between items-center text-xs">
                         <span className="font-medium text-primary">{c.user?.name} {c.user?.role !== "CITIZEN" && <span className="bg-primary text-white px-1.5 py-0.5 rounded text-[10px] ml-1 uppercase">Official</span>}</span>
                         <span className="text-slate-500">{formatDistanceToNow(new Date(c.createdAt))} ago</span>
                       </div>
                       <p className="text-sm text-slate-300">{c.comment}</p>
                     </div>
                   ))
                )}
             </div>

             <form onSubmit={handleSubmitComment} className="relative mt-auto border-t border-white/10 pt-4">
                <textarea 
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  onKeyDown={(e) => { 
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (comment.trim()) {
                        handleSubmitComment(e);
                      }
                    }
                  }}
                  placeholder="Add a public comment or update..."
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 resize-none"
                  rows={2}
                />
                <div className="flex justify-end mt-2">
                   <button 
                     type="submit" 
                     disabled={!comment.trim()}
                     className="px-4 py-2 bg-primary hover:brightness-110 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                   >
                      Post Comment
                   </button>
                </div>
             </form>
           </div>
        </div>

      </div>
    </Layout>
  );
}
