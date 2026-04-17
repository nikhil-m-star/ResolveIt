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
      <div className="px-4 py-8 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 relative">
        {/* Background Glow Effect - Perfect for depth */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-96 bg-primary/10 blur-[120px] rounded-full pointer-events-none -z-10" />
        
        {/* Dashboard Header - purified & perfected */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-10 mb-12 relative z-10 w-full">
          <div className="flex flex-col md:flex-row items-center gap-6 w-full max-w-2xl">
            <div className="relative w-full group/search">
               <div className="absolute inset-0 bg-primary/5 rounded-[24px] blur-xl opacity-0 group-focus-within/search:opacity-100 transition-all duration-500" />
               <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within/search:text-primary transition-colors z-10" />
               <input 
                 type="text"
                 placeholder="Search for issues..."
                 value={filters.search}
                 onChange={(e) => setFilters(prev => ({...prev, search: e.target.value}))}
                 className="relative z-10 w-full bg-white/5 border border-white/10 rounded-[24px] pl-14 pr-6 py-5 text-sm font-medium text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/40 transition-all shadow-2xl backdrop-blur-2xl"
               />
            </div>
          </div>

          <Link
            to="/report"
            className="group relative flex items-center justify-center gap-4 bg-primary text-black px-10 py-5 rounded-[24px] font-black uppercase text-[10px] tracking-widest transition-all hover:scale-105 active:scale-95 shadow-[0_10px_40px_-10px_rgba(16,185,129,0.4)] overflow-hidden shrink-0 w-full md:w-auto"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <PlusCircle className="h-5 w-5" />
            Report Issue
          </Link>
        </div>


        <div className="mx-auto max-w-5xl w-full relative z-10">
          <section className="flex min-h-[70vh] w-full flex-col overflow-hidden rounded-[40px] bg-black/40 border border-white/5 shadow-2xl backdrop-blur-3xl">
            {/* Minimal Sub-header */}
            <div className="px-8 py-4 border-b border-white/5 bg-white/5 flex items-center justify-between min-h-[56px]">
              <div className="flex items-center gap-4">
                {isLocating && (
                  <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase animate-pulse">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Searching location...
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-10 sm:px-10">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-32 text-slate-500 space-y-6">
                  <div className="relative">
                    <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
                    <Loader2 className="h-12 w-12 animate-spin text-primary absolute inset-0" style={{ animationDirection: 'reverse', animationDuration: '2.5s' }} />
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <p className="font-heading text-xl font-black uppercase tracking-tighter text-white">Updating Feed</p>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Connecting to secure city network...</p>
                  </div>
                </div>
              ) : isError ? (
                <div className="mx-auto max-w-md rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
                  <p className="text-red-400 font-black uppercase tracking-widest text-xs">Connection Warning</p>
                  <p className="text-slate-400 text-sm mt-2">Could not sync area reports. Please try refreshing.</p>
                </div>
              ) : issues?.length === 0 ? (
                <div className="flex flex-col items-center gap-6 py-32 text-center">
                  <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-8 shadow-2xl relative">
                    <div className="absolute inset-0 bg-primary/10 blur-xl animate-pulse rounded-full" />
                    <CheckCircle2 className="h-12 w-12 text-primary relative z-10" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-2xl font-heading font-black text-white uppercase tracking-tighter">City is Clear</p>
                    <p className="text-sm text-slate-500">No active reports detected in this area.</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {issues?.map((issue) => <IssueCard key={issue.id} issue={issue} />)}
                </div>
              )}
              <div className="h-16 w-full" />
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
