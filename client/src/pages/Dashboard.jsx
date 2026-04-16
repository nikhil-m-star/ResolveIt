import { useState, useEffect, useRef } from "react";
import { Layout } from "../components/layout/Layout";
import { IssueCard } from "../components/issues/IssueCard";
import { IssueMap } from "../components/issues/IssueMap";
import { useIssues } from "../hooks/useIssues";
import { RefreshCcw, CheckCircle2, Loader2 } from "lucide-react";

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
    <Layout>
      <div className="px-4 py-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
        
        {/* Dashboard Header */}
        <div className="glass-card p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border-primary/20 bg-primary/5">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
               <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> Live Monitoring
            </div>
            <h1 className="text-4xl font-heading font-extrabold text-white tracking-tight">City Pulse Monitor</h1>
            <p className="text-slate-400 font-medium">Real-time situational awareness and civic response coordination.</p>
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 rounded-2xl bg-primary px-8 py-3.5 text-sm font-black text-white transition-all hover:brightness-110 shadow-xl shadow-primary/25 active:scale-95"
          >
            <RefreshCcw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            Refresh Sector
          </button>
        </div>

        <div className="mx-auto max-w-5xl w-full">
          <section className="flex min-h-[70vh] w-full flex-col overflow-hidden rounded-[2.5rem] bg-slate-950/40 border border-white/5 shadow-2xl backdrop-blur-3xl">
            {/* Minimal Sub-header */}
            <div className="px-8 py-5 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Chronological Intel Feed</span>
              {isLocating && (
                <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase animate-pulse">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Triangulating Sector...
                </div>
              )}
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
                <div className="grid gap-6">
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
