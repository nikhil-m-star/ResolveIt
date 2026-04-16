import { useState, useEffect } from "react";
import { Layout } from "../components/layout/Layout";
import { IssueMap } from "../components/issues/IssueMap";
import { useIssues } from "../hooks/useIssues";
import { Filter, Loader2, LocateFixed, Search, Map as MapIcon } from "lucide-react";
import { motion as Motion, AnimatePresence } from "framer-motion";

export function MapExplorer() {
  const [filters, setFilters] = useState({
    city: "",
    category: "",
    status: "",
    search: ""
  });
  const [detectedLocation, setDetectedLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const { data: issues, isLoading } = useIssues(filters);

  useEffect(() => {
    if ("geolocation" in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setDetectedLocation([position.coords.latitude, position.coords.longitude]);
          setIsLocating(false);
        },
        () => setIsLocating(false),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  return (
    <Layout>
      <div className="relative h-[calc(100vh-140px)] w-full overflow-hidden rounded-3xl border border-white/10 bg-slate-950/20 shadow-2xl">
        {/* Map Header Overlay */}
        <div className="absolute left-6 top-6 z-[400] flex flex-col gap-3 pointer-events-none">
          <Motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center gap-3 rounded-2xl border border-white/15 bg-slate-950/80 px-4 py-3 backdrop-blur-2xl shadow-xl pointer-events-auto"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary">
              <MapIcon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-heading text-lg font-bold text-white leading-tight">Civic Explorer</h1>
              <div className="flex items-center gap-2">
                 <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-secondary" />
                 </span>
                 <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Live Grid Analysis</p>
              </div>
            </div>
          </Motion.div>

          <Motion.button
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            onClick={() => setShowFilters(!showFilters)}
            className="flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-slate-100/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-xl transition hover:bg-white/20 pointer-events-auto"
          >
            <Filter className="h-4 w-4" />
             Filters {Object.values(filters).filter(Boolean).length > 0 && `(${Object.values(filters).filter(Boolean).length})`}
          </Motion.button>
        </div>

        {/* Floating Search Bar */}
        <div className="absolute right-6 top-6 z-[400] w-full max-w-xs pointer-events-none">
           <Motion.div 
             initial={{ x: 20, opacity: 0 }}
             animate={{ x: 0, opacity: 1 }}
             className="relative pointer-events-auto"
           >
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                placeholder="Search location or issue..."
                onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                className="w-full rounded-2xl border border-white/15 bg-slate-950/80 p-3.5 pl-11 text-sm text-white backdrop-blur-2xl focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 shadow-2xl"
              />
           </Motion.div>
        </div>

        {/* Filter Overlay Panel */}
        <AnimatePresence>
          {showFilters && (
            <Motion.div
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              className="absolute left-6 top-40 z-[400] w-64 rounded-2xl border border-white/10 bg-slate-950/90 p-5 backdrop-blur-3xl shadow-2xl"
            >
              <div className="space-y-4">
                <div className="space-y-2">
                   <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Category</label>
                   <select 
                    value={filters.category}
                    onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}
                    className="w-full rounded-lg border border-white/10 bg-white/5 p-2 text-xs text-white outline-none focus:border-primary/50"
                   >
                      <option value="">All Categories</option>
                      {["POTHOLE", "GARBAGE", "WATER_LEAK", "POWER_CUT", "STREETLIGHT", "SEWAGE", "TREE_FALLEN", "BRIBERY"].map(cat => (
                        <option key={cat} value={cat}>{cat.replace("_", " ")}</option>
                      ))}
                   </select>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Stability Status</label>
                   <select 
                    value={filters.status}
                    onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
                    className="w-full rounded-lg border border-white/10 bg-white/5 p-2 text-xs text-white outline-none focus:border-primary/50"
                   >
                      <option value="">All Statuses</option>
                      <option value="REPORTED">Reported</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED">Resolved</option>
                   </select>
                </div>

                <button 
                  onClick={() => setFilters({ city: "", category: "", status: "", search: "" })}
                  className="w-full rounded-lg bg-red-500/10 py-2 text-xs font-bold text-red-400 transition hover:bg-red-500/20"
                >
                  Reset All
                </button>
              </div>
            </Motion.div>
          )}
        </AnimatePresence>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="absolute bottom-10 left-1/2 z-[400] -translate-x-1/2 rounded-full border border-white/20 bg-primary/20 px-4 py-2 backdrop-blur-xl">
             <div className="flex items-center gap-3 text-sm font-bold text-primary">
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating Heatmap...
             </div>
          </div>
        )}

        <IssueMap issues={issues || []} userLocation={detectedLocation} />
      </div>
    </Layout>
  );
}
