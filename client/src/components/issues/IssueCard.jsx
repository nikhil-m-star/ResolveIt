import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { MapPin, ChevronUp, Bot, Loader2 } from "lucide-react";
import { cn, getCategoryColor, getCategoryIconNode, getStatusColor, evaluateIntensityColor } from "../../utils/helpers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/auth";
import toast from "react-hot-toast";
import { motion as Motion } from "framer-motion";

export function IssueCard({ issue }) {
  const queryClient = useQueryClient();
  const isResolved = issue.status === "RESOLVED";

  const voteMutation = useMutation({
    mutationFn: () => api.post(`/issues/${issue.id}/vote`),
    onSuccess: () => {
      queryClient.invalidateQueries(["issues"]);
    },
    onError: () => toast.error("Failed to register vote"),
  });

  return (
    <Motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -5, scale: 1.01 }}
      className="group relative flex flex-col gap-5 rounded-3xl border border-white/5 bg-slate-950/40 p-6 backdrop-blur-3xl transition-all duration-500 hover:border-primary/20 hover:bg-slate-900/60 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)]"
    >
      {/* Gloss Effect */}
      <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-br from-white/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-2xl border bg-slate-950/50 shadow-inner", getCategoryColor(issue.category))}>
            {getCategoryIconNode(issue.category, "w-5 h-5")}
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Category</span>
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest">
              {issue.category.replace(/_/g, " ")}
            </h4>
          </div>
        </div>
        <div className={cn("rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-wider backdrop-blur-md border", getStatusColor(issue.status))}>
          {issue.status.replace(/_/g, " ")}
        </div>
      </div>

      <div className="relative z-10 space-y-2.5">
        <Link to={`/issues/${issue.id}`} className="block group/title">
          <h3 className="line-clamp-2 font-heading text-xl font-bold text-white transition-all group-hover/title:text-primary group-hover/title:translate-x-1">
            {issue.title}
          </h3>
        </Link>
        <p className="line-clamp-2 text-sm leading-relaxed text-slate-400 font-medium">
          {issue.description}
        </p>
      </div>

      {issue.imageUrls?.length > 0 && (
        <div className="relative z-10 flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          {issue.imageUrls.map((url, i) => (
            <div key={i} className="relative aspect-[4/3] w-32 flex-shrink-0 overflow-hidden rounded-xl border border-white/10 group-hover:border-white/20 transition-colors">
               <img src={url} alt={`Evidence ${i}`} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
               <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
          ))}
        </div>
      )}

      <div className="relative z-10 mt-auto flex items-center justify-between border-t border-white/5 pt-5">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-slate-500">
             <MapPin className="h-3.5 w-3.5 text-primary/50" />
             <span className="text-xs font-bold tracking-tight text-slate-300">{issue.area || issue.city}</span>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
            Added {formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}
          </p>
        </div>
        
        <div className="flex items-center gap-2.5">
          {issue.intensity && (
            <div className="flex flex-col items-end gap-1" title={`Severity Index: ${issue.intensity}/10`}>
               <span className="text-[8px] font-black uppercase tracking-widest text-slate-600">Severity</span>
               <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-slate-950/60 px-3 py-1.5 shadow-inner border-glow">
                  <div className={cn("h-2 w-2 rounded-full animate-pulse", evaluateIntensityColor(issue.intensity))} />
                  <span className="text-xs font-bold text-white leading-none">{issue.intensity}</span>
               </div>
            </div>
          )}
          {issue.etaDays && !isResolved && (
            <div className="flex flex-col items-end gap-1">
               <span className="text-[8px] font-black uppercase tracking-widest text-slate-600">Response</span>
               <div className="rounded-xl bg-blue-600/20 border border-blue-500/30 px-3 py-1.5 backdrop-blur-xl">
                  <span className="text-xs font-bold text-blue-400">~{issue.etaDays}D ETA</span>
               </div>
            </div>
          )}
        </div>
      </div>

      <div className="absolute right-6 -top-4 flex items-center gap-3 rounded-2xl bg-slate-900 border border-white/10 p-1.5 shadow-2xl opacity-0 group-hover:opacity-100 group-hover:-top-6 transition-all duration-300">
        <div className="flex h-10 items-center gap-4 rounded-xl bg-slate-950 border border-white/5 px-4 shadow-inner">
           <button
             onClick={(e) => { e.preventDefault(); voteMutation.mutate(); }}
             disabled={voteMutation.isPending}
             className="flex items-center gap-2 group/vote transition-all active:scale-95 disabled:opacity-50"
           >
             {voteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronUp className="h-5 w-5 text-primary group-hover/vote:-translate-y-0.5 transition-transform" />}
             <span className="text-sm font-black text-white">{issue.votes}</span>
           </button>
        </div>
      </div>
    </Motion.div>
  );
}
