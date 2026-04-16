import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/auth";
import { Layout } from "../components/layout/Layout";
import { Loader2, Trophy, Medal, Star, Target, CheckCircle2, ThumbsUp } from "lucide-react";
import { cn } from "../utils/helpers";
import { useState } from "react";

export function Leaderboard() {
  const [activeTab, setActiveTab] = useState("citizens"); // 'citizens' | 'officers'

  const { data, isLoading, isError } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const res = await api.get("/users/leaderboard");
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full pt-32 text-primary">
          <Loader2 className="w-10 h-10 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (isError || !data) {
    return (
      <Layout>
        <div className="p-8 text-center text-red-500">Failed to load leaderboard data.</div>
      </Layout>
    );
  }

  const { citizens, officers } = data;

  const getTierColor = (tier) => {
    switch (tier) {
      case "PLATINUM": return "text-blue-300 bg-blue-500/10 border-blue-500/30";
      case "GOLD": return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
      case "SILVER": return "text-gray-300 bg-gray-500/10 border-gray-500/30";
      case "BRONZE": return "text-amber-600 bg-amber-700/10 border-amber-700/30";
      default: return "text-white bg-white/5 border-white/10";
    }
  };

  const getRankIcon = (index) => {
    if (index === 0) return <Trophy className="w-6 h-6 text-yellow-400" />;
    if (index === 1) return <Medal className="w-6 h-6 text-gray-300" />;
    if (index === 2) return <Medal className="w-6 h-6 text-amber-600" />;
    return <span className="font-bold text-gray-500 w-6 text-center">{index + 1}</span>;
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        
        {/* Header Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full mb-2 border border-primary/20">
            <Trophy className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-heading font-bold text-white text-glow">Community Hall of Fame</h1>
          <p className="text-gray-400">Discover the citizens and officials making the biggest impact in our community through active engagement and swift resolutions.</p>
        </div>

        {/* Tab Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/5 p-1 rounded-xl border border-white/10 flex">
            <button
              onClick={() => setActiveTab("citizens")}
              className={cn(
                "px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300",
                activeTab === "citizens" ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-gray-400 hover:text-white"
              )}
            >
              Top Citizens
            </button>
            <button
              onClick={() => setActiveTab("officers")}
              className={cn(
                "px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300",
                activeTab === "officers" ? "bg-red-500 text-white shadow-lg shadow-red-500/20" : "text-gray-400 hover:text-white"
              )}
            >
              Top Officials
            </button>
          </div>
        </div>

        {/* Leaderboard List */}
        <div className="glass-card p-2 md:p-6 overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Header Row */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-white/5">
              <div className="col-span-1">Rank</div>
              <div className="col-span-5">Name & Tier</div>
              <div className="col-span-3 text-center">Score</div>
              <div className="col-span-3 text-right">Key Stats</div>
            </div>

            {/* User Rows */}
            <div className="space-y-4 mt-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-hide">
              {(activeTab === "citizens" ? citizens : officers).map((user, index) => (
                <div 
                  key={user.id} 
                  className={cn(
                    "grid grid-cols-12 gap-4 px-6 py-4 items-center rounded-xl transition-colors border",
                    index < 3 ? "bg-white/5 border-white/10" : "bg-transparent hover:bg-white/5 border-transparent"
                  )}
                >
                  <div className="col-span-1 flex items-center justify-start">
                    {getRankIcon(index)}
                  </div>
                  
                  <div className="col-span-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/40 to-purple-500/40 flex items-center justify-center font-bold text-white shadow-inner flex-shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white truncate max-w-[200px]">{user.name}</h3>
                      <span className={cn("text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border inline-block mt-1 font-bold", getTierColor(user.tier))}>
                        {user.tier}
                      </span>
                    </div>
                  </div>

                  <div className="col-span-3 flex justify-center">
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400/20" />
                      <span className="font-bold text-white">{user.points || 0} pts</span>
                    </div>
                  </div>

                  <div className="col-span-3 flex justify-end">
                    {activeTab === "citizens" ? (
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1"><Target className="w-4 h-4" /> {user._count?.issues || 0} Posts</span>
                        <span className="flex items-center gap-1"><ThumbsUp className="w-4 h-4" /> {user._count?.votes || 0} Votes</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> {user.resolvedCount || 0} Resolved</span>
                        {/* Rating block if it exists */}
                        {user.avgRating > 0 && (
                          <span className="flex items-center gap-1 text-yellow-400">
                             <Star className="w-4 h-4 fill-yellow-400" /> {Number(user.avgRating).toFixed(1)}/5
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {(activeTab === "citizens" ? citizens : officers).length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No {activeTab} available for the leaderboard yet.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
}
