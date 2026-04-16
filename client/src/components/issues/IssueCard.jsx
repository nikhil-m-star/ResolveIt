import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { MapPin, ArrowBigUp, ArrowBigDown, Bot, Loader2, Activity } from "lucide-react";
import { cn, getCategoryColor, getCategoryIconNode, getStatusColor, evaluateIntensityColor } from "../../utils/helpers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/auth";
import toast from "react-hot-toast";
import { motion as Motion } from "framer-motion";

export function IssueCard({ issue }) {
  const queryClient = useQueryClient();
  const isResolved = issue.status === "RESOLVED";

  const voteMutation = useMutation({
    mutationFn: (type) => api.post(`/issues/${issue.id}/vote`, { type }),
    onSuccess: () => {
      queryClient.invalidateQueries(["issues"]);
    },
    onError: () => toast.error("Failed to register vote"),
  });

  return (
    <Motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="group relative flex flex-col overflow-hidden rounded-[1.5rem] border border-white/5 bg-black hover:border-primary/30 transition-all duration-500 shadow-2xl max-w-md mx-auto w-full"
    >
      {/* Hero Image Section - Top Stack */}
      <div className="relative aspect-video w-full overflow-hidden shrink-0">
        {issue.imageUrls?.length > 0 ? (
          <img 
            src={issue.imageUrls[0]} 
            alt={issue.title} 
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" 
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-white/[0.02]">
             {getCategoryIconNode(issue.category, "w-8 h-8 text-slate-800")}
          </div>
        )}
        
        <div className="absolute inset-x-4 top-4">
           <div className={cn("inline-block rounded-full px-2 py-0.5 text-[7px] font-black uppercase tracking-[0.2em] border border-white/10 shadow-sm backdrop-blur-md", getStatusColor(issue.status))}>
              {issue.status}
           </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
      </div>

      <div className="p-5 flex flex-col gap-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter">
              {formatDistanceToNow(new Date(issue.createdAt))} ago
            </span>
          </div>

          <Link to={`/issues/${issue.id}`} className="block group/link">
            <h3 className="line-clamp-2 font-heading text-lg font-bold text-white group-hover/link:text-primary transition-colors leading-tight">
              {issue.title}
            </h3>
          </Link>
          
          <div className="flex items-center gap-2 mt-3 text-slate-500">
             <MapPin className="h-3 w-3" />
             <span className="text-[10px] font-black uppercase tracking-widest leading-none">{issue.area || issue.city}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/[0.03]">
           {/* Reddit Style Voting Pill */}
           <div className="flex items-center gap-1 bg-white/[0.03] border border-white/5 rounded-full px-2 py-1">
              <button
                onClick={(e) => { e.preventDefault(); voteMutation.mutate('UP'); }}
                disabled={voteMutation.isPending}
                className={cn(
                  "p-1 transition-all duration-300 disabled:opacity-50",
                  issue.userVote === 'UP' ? "text-primary scale-110" : "text-slate-500 hover:text-primary"
                )}
              >
                <ArrowBigUp className={cn("h-4 w-4", issue.userVote === 'UP' ? "fill-primary" : "fill-none")} />
              </button>
              <span className={cn(
                "text-[10px] font-black px-1 min-w-[20px] text-center transition-colors",
                issue.userVote ? "text-primary" : "text-white"
              )}>
                {issue.votes}
              </span>
              <button
                onClick={(e) => { e.preventDefault(); voteMutation.mutate('DOWN'); }}
                disabled={voteMutation.isPending}
                className={cn(
                  "p-1 transition-all duration-300 disabled:opacity-50",
                  issue.userVote === 'DOWN' ? "text-red-500 scale-110" : "text-slate-500 hover:text-red-500"
                )}
              >
                <ArrowBigDown className={cn("h-4 w-4", issue.userVote === 'DOWN' ? "fill-red-500" : "fill-none")} />
              </button>
           </div>

           {/* Analytics Badge instead of View Protocol */}
           <div className="flex items-center gap-2 text-[8px] font-black text-slate-600 uppercase tracking-widest">
              <Activity className="h-3 w-3" /> Intel-Driven
           </div>
        </div>
      </div>
    </Motion.div>
  );
}
