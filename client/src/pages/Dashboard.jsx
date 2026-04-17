import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Layout } from "../components/layout/Layout";
import { IssueCard } from "../components/issues/IssueCard";
import { useIssues } from "../hooks/useIssues";
import { Search, PlusCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export function Dashboard() {
  const [filters, setFilters] = useState({ city: "", area: "", category: "", status: "", search: "", lat: null, lng: null });
  const [detectedCity, setDetectedCity] = useState("Bengaluru");
  const queryClient = useQueryClient();
  const { data: issues, isLoading, isError, refetch } = useIssues(filters);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        setFilters(prev => ({ ...prev, lat: latitude, lng: longitude }));
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          setDetectedCity(data.address?.city || data.address?.town || "Bengaluru");
        } catch (e) { console.error("Reverse geocoding failed", e); }
      }, null, { timeout: 5000 });
    }
  }, []);

  const handleRefresh = () => {
    setFilters({ city: "", area: "", category: "", status: "", search: "", lat: null, lng: null });
    queryClient.invalidateQueries(["issues"]);
    refetch();
    toast.success("Feed Synchronized");
  };

  return (
    <Layout>
      <div className="px-4 py-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 relative">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 relative z-10 w-full">
          <div className="relative w-full md:w-auto flex-1 max-w-xl group/search">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 transition-colors" />
             <input 
               type="text"
               placeholder="Search incidents..."
               value={filters.search}
               onChange={(e) => setFilters(prev => ({...prev, search: e.target.value}))}
               className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white focus:outline-none focus:border-primary/40 transition-all"
             />
          </div>
          <Link to="/report" className="w-full md:w-auto justify-center bg-primary text-black px-6 py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
             <PlusCircle className="h-4 w-4" /> Report
          </Link>
        </div>

        <section className="min-h-[70vh] rounded-3xl glass-card overflow-hidden">
          <div className="p-4 md:p-8">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-5">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Syncing Cases...</p>
              </div>
            ) : isError ? (
              <div className="p-6 text-center bg-red-500/5 rounded-2xl border border-red-500/20">
                <p className="text-red-400 font-black uppercase text-[10px]">Sync Failure</p>
                <button onClick={handleRefresh} className="mt-4 text-white hover:underline text-xs">Retry Connection</button>
              </div>
            ) : issues?.length === 0 ? (
              <div className="flex flex-col items-center gap-5 py-16 text-center">
                <CheckCircle2 className="h-12 w-12 text-primary opacity-20" />
                <div className="space-y-4">
                  <h3 className="text-2xl font-heading font-black text-white uppercase tracking-tighter">Sector Clear</h3>
                  <p className="text-sm text-slate-500 max-w-xs mx-auto">No reports detected in this vicinity. Situation is optimal.</p>
                  <button onClick={handleRefresh} className="mt-4 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black text-primary uppercase tracking-[0.2em] hover:bg-white/10 transition-all">
                    Reset & Refresh Feed
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {issues.map(issue => <IssueCard key={issue.id} issue={issue} />)}
              </div>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
}
