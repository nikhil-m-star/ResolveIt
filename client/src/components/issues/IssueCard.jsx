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
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ scale: 1.008 }}
      className={cn(
        "group relative flex flex-col gap-3 rounded-2xl border border-white/12 bg-slate-950/45 p-5 backdrop-blur-xl transition-all duration-300 z-20",
        "shadow-[0_18px_36px_rgba(2,6,23,0.35)] hover:border-primary/35"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn("rounded-lg border p-2", getCategoryColor(issue.category))}>
            {getCategoryIconNode(issue.category, "w-4 h-4")}
          </div>
          <span className="text-sm font-semibold capitalize tracking-wide text-slate-100">
            {issue.category.replace(/_/g, " ")}
          </span>
        </div>
        <div className={cn("rounded-md border px-2.5 py-1 text-xs font-bold", getStatusColor(issue.status))}>
          {issue.status.replace(/_/g, " ")}
        </div>
      </div>

      <div className="mt-1">
        <Link to={`/issues/${issue.id}`} className="block">
          <h3 className="line-clamp-2 font-heading text-lg font-semibold text-white transition-colors group-hover:text-primary">
            {issue.title}
          </h3>
        </Link>
        <p className="mt-2 line-clamp-2 text-sm text-slate-300">{issue.description}</p>
      </div>

      {issue.imageUrls?.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {issue.imageUrls.map((url, i) => (
            <img key={i} src={url} alt={`Evidence ${i}`} className="h-20 w-32 flex-shrink-0 rounded-lg border border-white/10 object-cover" />
          ))}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-4 text-xs text-slate-300">
        <div className="flex items-center gap-1.5 flex-wrap">
          <MapPin className="w-3.5 h-3.5" />
          <span>{issue.area || issue.city}</span>
          <span className="hidden sm:block">•</span>
          <span>{formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}</span>
        </div>
        
        <div className="flex items-center gap-3">
          {issue.intensity && (
            <div className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2 py-1" title={`AI Intensity Score: ${issue.intensity}/10`}>
              <Bot className="h-3.5 w-3.5 text-primary" />
              <div className={cn("h-2 w-2 rounded-full", evaluateIntensityColor(issue.intensity))} />
              <span className="font-medium text-slate-200">{issue.intensity}</span>
            </div>
          )}
          {issue.etaDays && !isResolved && (
            <span className="rounded-md border border-secondary/35 bg-secondary/12 px-2 py-1 font-medium text-secondary">
              ~{issue.etaDays}d ETA
            </span>
          )}
        </div>
      </div>

      <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/70 px-2 py-1 shadow-lg">
        <button
          onClick={() => voteMutation.mutate()}
          disabled={voteMutation.isPending}
          className="rounded-full p-1.5 text-slate-300 transition hover:bg-white/10 hover:text-white disabled:opacity-70"
        >
          {voteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronUp className="h-4 w-4" />}
        </button>
        <span className="text-xs font-bold text-white">{issue.votes}</span>
      </div>
    </Motion.div>
  );
}
