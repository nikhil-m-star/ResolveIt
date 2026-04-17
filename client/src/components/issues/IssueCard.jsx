import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { MapPin, ArrowBigUp, ArrowBigDown } from "lucide-react";
import { cn, getCategoryIconNode, getStatusColor } from "../../utils/helpers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/auth";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

export function IssueCard({ issue }) {
  const queryClient = useQueryClient();

  const voteMutation = useMutation({
    mutationFn: (type) => api.post(`/issues/${issue.id}/vote`, { type }),
    onSuccess: () => {
      queryClient.invalidateQueries(["issues"]);
    },
    onError: () => toast.error("Failed to register vote"),
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-black/40 backdrop-blur-xl hover:border-primary/50 hover:-translate-y-2 transition-all duration-500 shadow-2xl max-w-sm sm:max-w-md mx-auto w-full"
    >
      {/* Scanning Light Effect on Hover */}


      {/* Hero Image Section - Top Stack */}
      <div className="relative aspect-video w-full overflow-hidden shrink-0">
        {issue.imageUrls?.length > 0 ? (
          <img 
            src={issue.imageUrls[0]} 
            alt={issue.title} 
            className="h-full w-full object-cover saturate-[0.4] opacity-80 group-hover:saturate-100 group-hover:opacity-100 transition-all duration-700 group-hover:scale-105" 
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-white/5 saturate-[0.4] group-hover:saturate-100 transition-all">
             <div className="p-4 rounded-2xl bg-black border border-white/5 opacity-50 group-hover:opacity-100 transition-opacity">
               {getCategoryIconNode(issue.category, "w-10 h-10 text-primary")}
             </div>
          </div>
        )}
        
        <div className="absolute inset-x-4 top-4 z-10">
           <div className={cn("inline-block rounded-lg px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.2em] border shadow-2xl backdrop-blur-md", getStatusColor(issue.status))}>
              {issue.status}
           </div>
        </div>
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <div className="p-4 sm:p-5 flex flex-col gap-4 relative z-10">
        <div className="space-y-3">
          <div className="flex items-center">
            <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                 {formatDistanceToNow(new Date(issue.createdAt))} ago
               </span>
            </div>
          </div>

          <Link to={`/issues/${issue.id}`} className="block">
            <h3 className="line-clamp-2 font-heading text-lg sm:text-xl font-black text-white group-hover:text-primary transition-colors leading-[1.1] uppercase tracking-tight">
              {issue.title}
            </h3>
          </Link>
          
          <div className="flex items-center gap-3 text-slate-400 group-hover:text-slate-300 transition-colors">
             <MapPin className="h-3.5 w-3.5 text-primary" />
             <span className="text-[10px] font-black uppercase tracking-widest leading-none truncate">{issue.area || issue.city}</span>
          </div>
        </div>

        <div className="flex items-center pt-4 border-t border-white/5">
           {/* Tactical Voting Pill */}
           <div className="flex items-center gap-2 bg-black/40 border border-white/5 rounded-2xl px-3 py-1.5 shadow-inner">
              <button
                onClick={(e) => { e.preventDefault(); voteMutation.mutate('UP'); }}
                disabled={voteMutation.isPending}
                className={cn(
                  "p-1 transition-all duration-300 disabled:opacity-50 hover:scale-110",
                  issue.userVote === 'UP' ? "text-primary" : "text-slate-600 hover:text-primary"
                )}
              >
                <ArrowBigUp className={cn("h-5 w-5", issue.userVote === 'UP' ? "fill-primary" : "fill-none")} />
              </button>
              <span className={cn(
                "text-[11px] font-black px-1 min-w-[24px] text-center transition-colors font-heading",
                issue.userVote ? "text-primary" : "text-white"
              )}>
                {issue.votes}
              </span>
              <button
                onClick={(e) => { e.preventDefault(); voteMutation.mutate('DOWN'); }}
                disabled={voteMutation.isPending}
                className={cn(
                  "p-1 transition-all duration-300 disabled:opacity-50 hover:scale-110",
                  issue.userVote === 'DOWN' ? "text-red-500" : "text-slate-600 hover:text-red-500"
                )}
              >
                <ArrowBigDown className={cn("h-5 w-5", issue.userVote === 'DOWN' ? "fill-red-500" : "fill-none")} />
              </button>
           </div>
        </div>
      </div>
    </motion.div>
  );
}
