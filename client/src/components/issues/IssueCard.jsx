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
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="group relative flex flex-col overflow-hidden rounded-[1.5rem] border border-white/5 bg-slate-950/20 backdrop-blur-3xl transition-all duration-500 hover:border-primary/20 shadow-xl"
    >
      {/* Hero Image Section */}
      <div className="relative aspect-[16/9] w-full overflow-hidden">
        {issue.imageUrls?.length > 0 ? (
          <img 
            src={issue.imageUrls[0]} 
            alt={issue.title} 
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" 
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-900/50">
             {getCategoryIconNode(issue.category, "w-8 h-8 text-slate-700")}
          </div>
        )}
        
        <div className="absolute inset-x-4 top-4 flex justify-between items-start opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className={cn("rounded-full px-3 py-1 text-[8px] font-black uppercase tracking-widest backdrop-blur-md border border-white/10", getStatusColor(issue.status))}>
            {issue.status}
          </div>
        </div>
      </div>

      <div className="p-5 flex flex-col gap-4">
        <Link to={`/issues/${issue.id}`} className="block">
          <h3 className="line-clamp-1 font-heading text-lg font-bold text-white group-hover:text-primary transition-colors">
            {issue.title}
          </h3>
        </Link>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-500">
             <MapPin className="h-3 w-3" />
             <span className="text-[10px] font-bold uppercase tracking-widest">{issue.area || issue.city}</span>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => { e.preventDefault(); voteMutation.mutate(); }}
              disabled={voteMutation.isPending}
              className="flex items-center gap-1.5 text-slate-400 hover:text-primary transition-colors"
            >
              <ChevronUp className="h-4 w-4" />
              <span className="text-xs font-black">{issue.votes}</span>
            </button>
          </div>
        </div>
      </div>
    </Motion.div>
  );
}
