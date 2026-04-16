import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { MapPin, ChevronUp, Bot, Loader2 } from "lucide-react";
import { cn, getCategoryColor, getCategoryIcon, getStatusColor, evaluateIntensityColor } from "../../utils/helpers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/auth";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

export function IssueCard({ issue }) {
  const queryClient = useQueryClient();
  const Icon = getCategoryIcon(issue.category);
  const isResolved = issue.status === "RESOLVED";

  const voteMutation = useMutation({
    mutationFn: () => api.post(`/issues/${issue.id}/vote`),
    onSuccess: () => {
      queryClient.invalidateQueries(["issues"]);
    },
    onError: () => toast.error("Failed to register vote"),
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ scale: 1.01, boxShadow: "0px 0px 25px rgba(0, 255, 255, 0.15)", borderColor: "rgba(0, 255, 255, 0.4)" }}
      className={cn(
        "group relative flex flex-col gap-3 p-5 rounded-2xl transition-all duration-300",
        "bg-white/[0.02] border border-primary/20 backdrop-blur-xl z-20"
      )}
    >
      {/* Top Banner */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn("p-2 rounded-lg border", getCategoryColor(issue.category))}>
            <Icon className="w-4 h-4" />
          </div>
          <span className="text-sm font-semibold capitalize tracking-wide opacity-90">
            {issue.category.replace(/_/g, " ")}
          </span>
        </div>
        <div className={cn("px-2.5 py-1 text-xs font-bold rounded-md border", getStatusColor(issue.status))}>
          {issue.status.replace(/_/g, " ")}
        </div>
      </div>

      {/* Content */}
      <div className="mt-2">
        <Link to={`/issues/${issue.id}`} className="block">
          <h3 className="font-heading text-lg font-semibold text-white group-hover:text-primary transition-colors line-clamp-2">
            {issue.title}
          </h3>
        </Link>
        <p className="text-sm text-gray-400 mt-2 line-clamp-2">{issue.description}</p>
      </div>

      {/* Media Thumbnails - Simplified for feed */}
      {issue.imageUrls?.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {issue.imageUrls.map((url, i) => (
             <img key={i} src={url} alt={`Evidence ${i}`} className="h-20 w-32 object-cover rounded-lg border border-white/10 flex-shrink-0" />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500 mt-auto pt-4 border-t border-white/5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <MapPin className="w-3.5 h-3.5" />
          <span>{issue.area || issue.city}</span>
          <span className="hidden sm:block">•</span>
          <span>{formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}</span>
        </div>
        
        {/* Status / Intensity Chips */}
        <div className="flex items-center gap-3">
            {issue.intensity && (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-md border border-white/5" title={`AI Intensity Score: ${issue.intensity}/10`}>
                 <Bot className="w-3.5 h-3.5 text-primary" />
                 <div className={cn("w-2 h-2 rounded-full", evaluateIntensityColor(issue.intensity))} />
                 <span className="font-medium text-gray-300">{issue.intensity}</span>
              </div>
            )}
             {issue.etaDays && !isResolved && (
               <span className="px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md font-medium">
                 ~{issue.etaDays}d ETA
               </span>
             )}
        </div>
      </div>

      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 bg-background border border-white/10 rounded-full shadow-lg flex flex-col items-center gap-1">
          <button 
             onClick={() => voteMutation.mutate()} 
             disabled={voteMutation.isPending}
           className="p-2.5 text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-70 transition-all rounded-t-full rounded-b-sm"
          >
             {voteMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChevronUp className="w-5 h-5" />}
          </button>
          <span className="text-sm font-bold text-white px-2">
            {issue.votes}
          </span>
          <div className="h-2" />
      </div>
    </motion.div>
  );
}
