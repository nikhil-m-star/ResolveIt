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
  const [showFilters, setShowFilters] = useState(false);

  const { data: issues, isLoading } = useIssues(filters);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setDetectedLocation([position.coords.latitude, position.coords.longitude]);
        },
        () => {},
        { enableHighAccuracy: true }
      );
    }
  }, []);

  return (
    <Layout>
      <div className="relative h-map-mobile md:h-map-desktop w-full overflow-hidden rounded-5xl border border-white/5 bg-black/20 shadow-2xl">
        {/* Minimal Map Header */}
        <div className="absolute left-4 top-4 md:left-8 md:top-8 z-400 flex flex-col md:flex-row items-start md:items-center gap-4 pointer-events-none">
          <Motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center gap-4 rounded-3xl border border-white/10 bg-black/80 px-5 py-3 backdrop-blur-3xl shadow-2xl pointer-events-auto"
          >
            <div className="h-8 w-8 flex items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MapIcon className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xs font-black text-white uppercase tracking-widest">Map</h1>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter flex items-center gap-1.5 focus:text-primary">
                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Telemetry 
              </p>
            </div>
          </Motion.div>

          {/* Search Pill */}
          <Motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="relative w-full md:w-64 pointer-events-auto"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input 
              type="text"
              placeholder="Search reports..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className="w-full bg-black border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 transition-all shadow-2xl backdrop-blur-3xl"
            />
          </Motion.div>
        </div>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="absolute bottom-24 left-1/2 z-400 -translate-x-1/2 rounded-full border border-white/10 bg-black/80 px-5 py-2.5 backdrop-blur-2xl shadow-2xl">
             <div className="flex items-center gap-3 text-[10px] font-black text-primary uppercase tracking-widest">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Synchronizing Sector...
             </div>
          </div>
        )}

        <IssueMap issues={issues || []} userLocation={detectedLocation} />
      </div>
    </Layout>

  );
}
