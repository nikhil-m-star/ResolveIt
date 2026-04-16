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
      <div className="relative h-[calc(100vh-120px)] md:h-[calc(100vh-160px)] w-full overflow-hidden rounded-[2.5rem] border border-white/5 bg-slate-950/20 shadow-2xl">
        {/* Minimal Map Header */}
        <div className="absolute left-4 top-4 md:left-8 md:top-8 z-[400] pointer-events-none">
          <Motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center gap-4 rounded-[1.5rem] border border-white/10 bg-slate-950/60 px-5 py-3 backdrop-blur-3xl shadow-2xl pointer-events-auto"
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
        </div>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="absolute bottom-24 left-1/2 z-[400] -translate-x-1/2 rounded-full border border-white/10 bg-slate-950/80 px-5 py-2.5 backdrop-blur-2xl shadow-2xl">
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
