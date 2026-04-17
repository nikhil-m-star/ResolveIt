import { useParams, Link } from "react-router-dom";
import { useIssue } from "../hooks/useIssue";
import { Layout } from "../components/layout/Layout";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/auth";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import { Bot, MapPin, ArrowBigUp, ArrowBigDown, Clock, AlertTriangle, MessageSquare, Loader2, CheckCircle2, Shield, ShieldAlert } from "lucide-react";
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
  const userRole = token ? decodeJwtPayload(token).role : "CITIZEN";
  const isOfficial = userRole === "OFFICER" || userRole === "PRESIDENT";

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
        
        {/* Management Controls (Officals Only) */}
        {isOfficial && (
          <div className="glass-card bg-black border border-primary/30 p-6 animate-in fade-in slide-in-from-top-4">
             <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="shrink-0 flex items-center gap-3">
                   <div className="p-3 bg-primary rounded-2xl shadow-lg">
                      <Shield className="w-6 h-6 text-white" />
                   </div>
                   <div>
                      <h3 className="text-white font-bold leading-none">Status Management</h3>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Official Oversight Active</p>
                   </div>
                </div>

                <div className="flex-1 flex flex-col md:flex-row items-center gap-4 w-full">
                   <select 
                     value={selectedStatus}
                     onChange={(e) => setSelectedStatus(e.target.value)}
                     className="bg-black border border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-primary/50 w-full md:w-48"
                   >
                      <option value="REPORTED">Reported</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="REJECTED">Rejected</option>
                   </select>
                   <input 
                     type="text"
                     value={statusNote}
                     onChange={(e) => setStatusNote(e.target.value)}
                     placeholder="Official audit note (optional)..."
                     className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 w-full"
                   />
                   <button 
                     onClick={handleUpdateStatus}
                     disabled={statusMutation.isPending || selectedStatus === issue.status}
                     className="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 whitespace-nowrap"
                   >
                      {statusMutation.isPending ? "Syncing..." : "Update Case"}
                   </button>
                </div>
             </div>
          </div>
        )}

        {/* Header Block */}
        <div className="glass-card bg-black border border-white/5 p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start relative">
          
          <div className="flex-1 space-y-4 w-full">
            <div className="flex flex-wrap items-center gap-3">
              <div className={cn("px-3 py-1.5 rounded-lg border flex items-center gap-2 text-sm font-bold capitalize", getCategoryColor(issue.category))}>
                {getCategoryIconNode(issue.category, "w-4 h-4")} {issue.category.replace(/_/g, " ")}
              </div>
              <div className={cn("px-3 py-1.5 rounded-lg border text-sm font-bold", getStatusColor(issue.status))}>
                {issue.status.replace(/_/g, " ")}
              </div>
              
              {issue.slaBreached && (
                <div className="px-3 py-1.5 text-sm font-bold bg-red-500/10 text-red-500 border border-red-500/30 rounded-lg flex items-center gap-1.5">
                   <AlertTriangle className="w-4 h-4" /> SLA Breached
                </div>
              )}
            </div>

            <h1 className="text-3xl font-heading font-bold text-white tracking-tight">{issue.title}</h1>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
               <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-md border border-white/5 font-medium">
                 <MapPin className="w-4 h-4 text-primary" /> {issue.area || issue.city}
               </span>
               <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-md border border-white/5 font-medium">
                 <Clock className="w-4 h-4 text-primary" /> {formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}
               </span>
               <span className="px-3 py-1.5 bg-white/5 rounded-md border border-white/5 font-medium">
                 Reported by: <span className="text-white">{issue.isAnonymous ? "Anonymous User" : issue.createdBy?.name || "Citizen"}</span>
               </span>
            </div>

            <p className="text-slate-300 leading-relaxed text-base pt-2">
              {issue.description}
            </p>
          </div>

          {/* Action Box - Reddit Style */}
          <div className="w-full md:w-64 flex flex-col gap-4 shrink-0">
             <div className="flex flex-col items-center bg-white/5 border border-white/10 rounded-6xl p-4 gap-2 shadow-2xl">
                <button 
                   onClick={() => voteMutation.mutate('UP')}
                   disabled={voteMutation.isPending}
                   className={cn(
                     "w-full py-3 flex items-center justify-center transition-all active:scale-95 disabled:opacity-50",
                     issue.userVote === 'UP' ? "text-primary scale-110" : "text-slate-500 hover:text-primary"
                   )}
                >
                   <ArrowBigUp className={cn("w-10 h-10", issue.userVote === 'UP' ? "fill-primary" : "fill-none")} />
                </button>
                <div className="flex flex-col items-center">
                   <span className={cn("text-3xl font-black transition-colors", issue.userVote ? "text-primary" : "text-white")}>{issue.votes}</span>
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-extra-wide">Net Score</span>
                </div>
                <button 
                   onClick={() => voteMutation.mutate('DOWN')}
                   disabled={voteMutation.isPending}
                   className={cn(
                     "w-full py-3 flex items-center justify-center transition-all active:scale-95 disabled:opacity-50",
                     issue.userVote === 'DOWN' ? "text-red-500 scale-110" : "text-slate-500 hover:text-red-500"
                   )}
                >
                   <ArrowBigDown className={cn("w-10 h-10", issue.userVote === 'DOWN' ? "fill-red-500" : "fill-none")} />
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

        {/* Two Column Layout for Status & Updates */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           
           {/* Timeline Log */}
           <div className="lg:col-span-1 glass-card bg-black border border-white/5 p-6 space-y-6 self-start">
             <h3 className="text-lg font-heading font-semibold text-white">Audit Trail</h3>
             <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[11px] before:w-[2px] before:bg-white/10">
               {/* Original Created Event */}
               <div className="relative pl-8">
                  <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-primary/20 border border-primary flex items-center justify-center -ml-[1px] z-10">
                     <div className="w-2 h-2 rounded-full bg-primary"></div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-white">Issue Reported</p>
                    <p className="text-xs text-slate-500">{formatDistanceToNow(new Date(issue.createdAt))} ago</p>
                  </div>
               </div>

               {/* Map Status Updates */}
               {issue.statusHistory?.map((history) => (
                 <div key={history.id} className="relative pl-8">
                    <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-background border border-white/20 flex items-center justify-center -ml-[1px] z-10">
                       {history.newStatus === "RESOLVED" ? (
                         <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                       ) : (
                         <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                       )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-white flex items-center gap-2">
                        Updated to <span className={cn("px-2 py-0.5 text-xs rounded border", getStatusColor(history.newStatus))}>{history.newStatus}</span>
                      </p>
                      <p className="text-xs text-slate-500">By {history.user?.name} • {formatDistanceToNow(new Date(history.createdAt))} ago</p>
                      {history.note && (
                        <div className="mt-2 p-3 bg-black/40 border border-white/5 rounded-lg text-sm text-slate-300 italic text-italic">
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
