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

  const getRankIcon = (index) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (index === 1) return <Medal className="w-5 h-5 text-slate-400" />;
    if (index === 2) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="font-bold text-slate-600 w-5 text-center text-sm">{index + 1}</span>;
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-12">
        
        {/* Header Section */}
        <div className="text-center space-y-4 max-w-2xl mx-auto animate-in fade-in duration-700">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
             <Trophy className="w-3.5 h-3.5" /> Rankings
          </div>
          <h1 className="text-hero-md font-heading font-black text-white tracking-tighter uppercase">Impact Leaderboard</h1>
          <p className="text-slate-500 text-sm font-medium">Recognizing individuals driving real change through vigilance and action.</p>
        </div>

        {/* Tab Selection */}
        <div className="flex justify-center">
          <div className="bg-black/50 p-1.5 rounded-2xl border border-white/5 flex gap-1 shadow-2xl">
            <button
              onClick={() => setActiveTab("citizens")}
              className={cn(
                "px-8 py-2.5 rounded-xl text-sm font-bold transition-all duration-300",
                activeTab === "citizens" ? "bg-primary text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
              )}
            >
              Citizens
            </button>
            <button
              onClick={() => setActiveTab("officers")}
              className={cn(
                "px-8 py-2.5 rounded-xl text-sm font-bold transition-all duration-300",
                activeTab === "officers" ? "bg-primary text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
              )}
            >
              Officials
            </button>
          </div>
        </div>

        <div className="glass-card overflow-hidden">
          {/* Desktop Table Header – hidden on mobile */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
            <div className="col-span-1">Rank</div>
            <div className="col-span-5">Member</div>
            <div className="col-span-3 text-center">Primary Contribution</div>
            <div className="col-span-3 text-right">Performance</div>
          </div>

          <div className="divide-y divide-white/5">
            {(activeTab === "citizens" ? citizens : officers).map((user, index) => (
              <div 
                key={user.id} 
                className="flex flex-col md:grid md:grid-cols-12 gap-4 px-6 md:px-8 py-6 items-center hover:bg-white/5 transition-all"
              >
                {/* Rank + User – stacked row on mobile */}
                <div className="flex items-center gap-4 w-full md:col-span-6">
                  <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/5">
                    {getRankIcon(index)}
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-black border border-white/5 flex items-center justify-center font-bold text-white shadow-xl shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-white truncate text-base">{user.name}</h3>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                      Validated Member
                    </span>
                  </div>
                </div>

                {/* Stats row – side by side on mobile */}
                <div className="flex items-center justify-between w-full md:col-span-6 gap-4 pl-14 md:pl-0">
                  <div className="flex flex-col items-center md:flex-1">
                    {activeTab === "citizens" ? (
                      <>
                        <span className="text-xl font-black text-white">{user._count?.issues || 0}</span>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Reports</span>
                      </>
                    ) : (
                      <>
                        <span className="text-xl font-black text-emerald-400">{user.resolvedCount || 0}</span>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Resolved</span>
                      </>
                    )}
                  </div>

                  <div className="md:flex md:justify-end md:flex-1">
                    {activeTab === "citizens" ? (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-xl border border-white/5 text-primary">
                         <ThumbsUp className="w-3.5 h-3.5" />
                         <span className="text-xs font-bold">{user._count?.votes || 0} Votes</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 rounded-xl border border-yellow-500/20 text-yellow-500">
                         <Star className="w-3.5 h-3.5" />
                         <span className="text-xs font-bold">{Number(user.avgRating || 0).toFixed(1)} Rating</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {(activeTab === "citizens" ? citizens : officers).length === 0 && (
              <div className="text-center py-20 text-slate-500 font-medium">
                Gathering impact data for this category...
              </div>
            )}
          </div>
        </div>

      </div>
    </Layout>
  );
}

