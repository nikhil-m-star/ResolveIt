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
  const [detectedLocation, setDetectedLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    if ("geolocation" in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            setDetectedLocation([latitude, longitude]);
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

        <div className="flex flex-col gap-5 xl:flex-row">
          <section className="flex min-h-[70vh] w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-950/45 shadow-[0_20px_44px_rgba(2,6,23,0.45)] xl:w-[52%]">
            <div className="space-y-4 border-b border-white/10 bg-slate-950/50 p-4 sm:p-5">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search issues by title or description..."
                  onChange={handleSearch}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-400 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/35"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <div className="flex min-w-max items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5">
                  <Filter className="h-3.5 w-3.5 text-slate-300" />
                  <span className="text-xs font-medium text-slate-200">Filters</span>
                </div>
                {isLocating ? (
                  <div className="flex min-w-max items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Detecting location...
                  </div>
                ) : detectedCity ? (
                  <button
                    onClick={() => setFilters((prev) => ({ ...prev, city: prev.city ? "" : detectedCity }))}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium min-w-max transition-colors ${
                      filters.city
                        ? "bg-primary/20 text-primary border-primary/35"
                        : "bg-white/5 text-slate-200 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <LocateFixed className="h-3.5 w-3.5" />
                    {filters.city ? `Location: ${filters.city}` : `Use location: ${detectedCity}`}
                  </button>
                ) : null}
                <select 
                  onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}
                  className="text-xs font-medium bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-slate-200 outline-none hover:bg-white/10 appearance-none min-w-max pr-8"
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
                  className="text-xs font-medium bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-slate-200 outline-none hover:bg-white/10 appearance-none min-w-max pr-8"
                >
                  <option value="">All Statuses</option>
                  <option value="REPORTED">Reported</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-5">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-300 space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="font-medium">Scanning civic grid...</p>
                </div>
              ) : isError ? (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-center text-red-200">
                  Failed to load issues. Try refreshing.
                </div>
              ) : issues?.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-20 text-center text-slate-300">
                  <div className="inline-block rounded-2xl border border-white/10 bg-white/5 p-4">
                    <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                  </div>
                  <p className="text-lg font-medium text-white">No active issues found</p>
                  <p className="text-sm">Looks calm for now. Try changing filters or location.</p>
                </div>
              ) : (
                issues?.map((issue) => <IssueCard key={issue.id} issue={issue} />)
              )}
              <div className="h-8 w-full" />
            </div>
          </section>

          <section className="relative min-h-[70vh] w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-950/45 shadow-[0_20px_44px_rgba(2,6,23,0.45)] xl:w-[48%]">
            <div className="pointer-events-none absolute left-4 top-4 z-[400] rounded-lg border border-white/10 bg-slate-950/75 px-3 py-2 backdrop-blur">
              <span className="flex items-center gap-2 text-xs font-bold text-white">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-secondary" />
                </span>
                LIVE HEATMAP
              </span>
            </div>
            <IssueMap issues={issues || []} userLocation={detectedLocation} />
          </section>
        </div>
      </div>
    </Layout>
  );
}
