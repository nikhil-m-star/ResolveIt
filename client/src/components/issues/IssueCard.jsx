import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { MapPin, ArrowBigUp, ArrowBigDown, Bot, Loader2 } from "lucide-react";
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
      className="group relative flex flex-col md:flex-row overflow-hidden rounded-[1.2rem] border border-white/5 bg-black hover:border-primary/30 transition-all duration-500 shadow-2xl max-w-4xl mx-auto w-full"
    >
      {/* Hero Image Section - Tighter for Desktop */}
      <div className="relative aspect-[16/9] md:aspect-square md:w-48 overflow-hidden shrink-0">
        {issue.imageUrls?.length > 0 ? (
          <img 
            src={issue.imageUrls[0]} 
            alt={issue.title} 
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" 
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-white/[0.02]">
             {getCategoryIconNode(issue.category, "w-6 h-6 text-slate-800")}
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
      </div>

      <div className="p-4 flex flex-1 flex-col justify-between gap-3">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className={cn("rounded-full px-2 py-0.5 text-[7px] font-black uppercase tracking-[0.2em] border border-white/10 shadow-sm", getStatusColor(issue.status))}>
              {issue.status}
            </div>
            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter">
              {formatDistanceToNow(new Date(issue.createdAt))} ago
            </span>
          </div>

          <Link to={`/issues/${issue.id}`} className="block group/link">
            <h3 className="line-clamp-1 font-heading text-base font-bold text-white group-hover/link:text-primary transition-colors leading-tight">
              {issue.title}
            </h3>
          </Link>
          
          <div className="flex items-center gap-2 mt-2 text-slate-500">
             <MapPin className="h-3 w-3" />
             <span className="text-[9px] font-black uppercase tracking-widest leading-none">{issue.area || issue.city}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/[0.03]">
          <div className="flex items-center gap-4">
             {/* Reddit Style Voting Pill */}
             <div className="flex items-center gap-1 bg-white/[0.03] border border-white/5 rounded-full px-2 py-1">
                <button
                  onClick={(e) => { e.preventDefault(); voteMutation.mutate('UP'); }}
                  disabled={voteMutation.isPending}
                  className="p-1 text-slate-500 hover:text-primary transition-colors disabled:opacity-50"
                >
                  <ArrowBigUp className="h-4 w-4 fill-current" />
                </button>
                <span className="text-[10px] font-black text-white px-1 min-w-[20px] text-center">{issue.votes}</span>
                <button
                  onClick={(e) => { e.preventDefault(); voteMutation.mutate('DOWN'); }}
                  disabled={voteMutation.isPending}
                  className="p-1 text-slate-500 hover:text-primary transition-colors disabled:opacity-50"
                >
                  <ArrowBigDown className="h-4 w-4 fill-current" />
                </button>
             </div>
          </div>

          <button className="text-[9px] font-black text-slate-500 uppercase tracking-widest hover:text-primary transition-colors">
            View Protocol
          </button>
        </div>
      </div>
    </Motion.div>
  );
}
