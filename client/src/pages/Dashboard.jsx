import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Layout } from "../components/layout/Layout";
import { IssueCard } from "../components/issues/IssueCard";
import { IssueMap } from "../components/issues/IssueMap";
import { useIssues } from "../hooks/useIssues";
import { cn } from "../utils/helpers";
import { RefreshCcw, CheckCircle2, Loader2, PlusCircle, Search } from "lucide-react";

export function Dashboard() {
  const [filters, setFilters] = useState({
    city: "",
    category: "",
    status: "",
    search: "",
    lat: null,
    lng: null
  });
  const [detectedCity, setDetectedCity] = useState("");
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    if ("geolocation" in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            setFilters(prev => ({ ...prev, lat: latitude, lng: longitude }));
            // Fetch city name using reverse geocoding
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            const data = await res.json();
            const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || "Bengaluru";
            setDetectedCity(city);
          } catch (error) {
            console.error("Failed to determine city:", error);
          } finally {
            setIsLocating(false);
          }
        },
        (error) => {
          console.warn("Geolocation denied or failed:", error);
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setIsLocating(false);
    }
  }, []);

  const { data: issues, isLoading, isError, refetch } = useIssues(filters);

  return (
    <Layout>
      <div className="px-4 py-8 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700">
        
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col md:flex-row items-center gap-6 w-full md:w-auto">
            <h1 className="text-5xl font-heading font-black text-white tracking-tight uppercase">Feed</h1>
            
            <div className="relative w-full md:w-80 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-primary transition-colors" />
              <input 
                type="text"
                placeholder="Search sector reports..."
                value={filters.search || ""}
                onChange={(e) => setFilters(prev => ({...prev, search: e.target.value}))}
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 transition-all shadow-sm"
              />
            </div>
          </div>

          <Link
            to="/report"
            className="group relative flex items-center gap-4 bg-primary text-white pl-8 pr-10 py-5 rounded-4xl font-black uppercase text-xs tracking-widest transition-all hover:scale-105 active:scale-95 shadow-2xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 group-hover:rotate-90 transition-transform">
               <PlusCircle className="h-5 w-5" />
            </div>
            Report Issue
          </Link>
        </div>

        {/* Intelligence Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           {[
             { label: "Active Intel", value: issues?.filter(i => i.status !== 'RESOLVED').length || 0, color: "text-primary" },
             { label: "Resolved Today", value: issues?.filter(i => i.status === 'RESOLVED' && new Date(i.updatedAt).toDateString() === new Date().toDateString()).length || 0, color: "text-emerald-400" },
             { label: "Sector Health", value: "98.2%", color: "text-blue-400" },
             { label: "AI Accuracy", value: "94.0%", color: "text-amber-400" }
           ].map((stat, idx) => (
             <div key={idx} className="glass-card bg-black/40 border border-white/5 p-6 rounded-3xl flex flex-col gap-2">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</span>
                <span className={cn("text-3xl font-heading font-black", stat.color)}>{stat.value}</span>
             </div>
           ))}
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
           {['ALL', 'REPORTED', 'IN_PROGRESS', 'RESOLVED'].map((status) => (
             <button
               key={status}
               onClick={() => setFilters(prev => ({ ...prev, status: status === 'ALL' ? '' : status }))}
               className={cn(
                 "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border",
                 (filters.status === status || (status === 'ALL' && !filters.status))
                   ? "bg-primary border-primary text-white shadow-lg"
                   : "bg-black/40 border-white/10 text-slate-500 hover:text-white hover:border-white/20"
               )}
             >
               {status.replace('_', ' ')}
             </button>
           ))}
        </div>


        <div className="mx-auto max-w-5xl w-full">
          <section className="flex min-h-[70vh] w-full flex-col overflow-hidden rounded-5xl bg-black border border-white/5 shadow-2xl backdrop-blur-3xl">
            {/* Minimal Sub-header */}
            <div className="px-8 py-3 border-b border-white/5 bg-white/5 flex items-center justify-between min-h-[48px]">
              <div className="flex items-center gap-4">

                {isLocating && (
                  <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase animate-pulse">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Triangulating Sector...
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-8 sm:px-8">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-4">
                  <div className="relative">
                    <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
                    <Loader2 className="h-10 w-10 animate-spin text-primary absolute inset-0" style={{ animationDirection: 'reverse', animationDuration: '3s' }} />
                  </div>
                  <p className="font-heading text-lg font-bold">Syncing Feed...</p>
                </div>
              ) : isError ? (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center text-red-400 font-bold">
                  Grid connection failure. Please signal again.
                </div>
              ) : issues?.length === 0 ? (
                <div className="flex flex-col items-center gap-4 py-20 text-center text-slate-400">
                  <div className="inline-block rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
                    <CheckCircle2 className="h-10 w-10 text-emerald-400/50" />
                  </div>
                  <div>
                    <p className="text-xl font-heading font-bold text-white">Grid Secured</p>
                    <p className="text-sm mt-2">No active reports detected in this sector.</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {issues?.map((issue) => <IssueCard key={issue.id} issue={issue} />)}
                </div>
              )}
              <div className="h-12 w-full" />
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
