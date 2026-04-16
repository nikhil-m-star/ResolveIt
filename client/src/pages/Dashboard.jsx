import { useState, useEffect, useRef } from "react";
import { Layout } from "../components/layout/Layout";
import { IssueCard } from "../components/issues/IssueCard";
import { IssueMap } from "../components/issues/IssueMap";
import { useIssues } from "../hooks/useIssues";
import { Search, Filter, Loader2, RefreshCcw, CheckCircle2, LocateFixed } from "lucide-react";

export function Dashboard() {
  const [filters, setFilters] = useState({
    city: "",
    category: "",
    status: "",
    search: ""
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
  const searchTimeout = useRef(null);

  // Simple debounced search (normally move to hook)
  const handleSearch = (e) => {
    const value = e.target.value;
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: value }));
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, []);

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6 rounded-2xl border border-white/10 bg-slate-950/45 p-5 backdrop-blur-xl sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">ResolveIt Live Monitor</p>
              <h1 className="font-heading text-2xl font-bold text-white sm:text-3xl">City Pulse Dashboard</h1>
              <p className="text-sm text-slate-300">Track active incidents, prioritize fixes, and coordinate civic response in real time.</p>
            </div>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh Feed
            </button>
          </div>
        </div>

        <div className="mx-auto max-w-4xl">
          <section className="flex min-h-[70vh] w-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-950/45 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] backdrop-blur-3xl">
            <div className="space-y-4 border-b border-white/10 bg-white/5 p-5 sm:p-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search issues by title or description..."
                  onChange={handleSearch}
                  className="w-full rounded-2xl border border-white/10 bg-black/40 py-3 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                <div className="flex min-w-max items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2">
                  <Filter className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-300">Filters</span>
                </div>
                {isLocating ? (
                  <div className="flex min-w-max items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-400">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Locating...
                  </div>
                ) : detectedCity ? (
                  <button
                    onClick={() => setFilters((prev) => ({ ...prev, city: prev.city ? "" : detectedCity }))}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold min-w-max transition-all ${
                      filters.city
                        ? "bg-primary/20 text-primary border-primary/30 shadow-[0_0_12px_rgba(251,146,60,0.2)]"
                        : "bg-white/5 text-slate-400 border-white/10 hover:border-white/20"
                    }`}
                  >
                    <LocateFixed className="h-4 w-4" />
                    {filters.city ? filters.city : `Near ${detectedCity}`}
                  </button>
                ) : null}
                <select 
                  onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}
                  className="text-xs font-bold bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-slate-300 outline-none hover:border-white/20 transition-all appearance-none min-w-max cursor-pointer"
                >
                  <option value="">All Categories</option>
                  <option value="POTHOLE">Potholes</option>
                  <option value="GARBAGE">Garbage</option>
                  <option value="POWER_CUT">Power Cuts</option>
                  <option value="WATER_LEAK">Water Leaks</option>
                  <option value="BRIBERY">Bribery</option>
                  <option value="STREETLIGHT">Streetlight</option>
                  <option value="SEWAGE">Sewage</option>
                  <option value="TREE_FALLEN">Fallen Tree</option>
                  <option value="OTHER">Other</option>
                </select>
                <select 
                  onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
                  className="text-xs font-bold bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-slate-300 outline-none hover:border-white/20 transition-all appearance-none min-w-max cursor-pointer"
                >
                  <option value="">All Statuses</option>
                  <option value="REPORTED">Reported</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
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
