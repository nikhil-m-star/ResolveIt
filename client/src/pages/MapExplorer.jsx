import { useState, useEffect } from "react";
import { Layout } from "../components/layout/Layout";
import { IssueMap } from "../components/issues/IssueMap";
import { useIssues } from "../hooks/useIssues";
import { Filter, Loader2, LocateFixed, Search, Map as MapIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LocationAutocomplete } from "../components/ui/LocationAutocomplete";

export function MapExplorer() {
  const [filters, setFilters] = useState({
    city: "",
    area: "",
    category: "",
    status: "",
    search: ""
  });
  const [detectedLocation, setDetectedLocation] = useState(null);
  const [focusLocation, setFocusLocation] = useState(null);
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
    <Layout compact>
      <div className="relative h-map-mobile md:h-map-desktop w-full overflow-hidden rounded-[40px] border border-white/5 bg-black/40 shadow-[0_32px_64px_rgba(0,0,0,0.8)]">
        {/* Immersive Map Header */}
        <div className="absolute left-6 top-6 right-6 md:right-auto z-map-ui flex flex-col md:flex-row items-start md:items-center gap-4 pointer-events-none md:top-8 w-[calc(100%-48px)] md:w-auto">
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center gap-5 w-full md:w-auto overflow-hidden rounded-[24px] border border-white/10 bg-black/60 px-6 py-3.5 backdrop-blur-3xl shadow-2xl pointer-events-auto shrink-0"
          >
            <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <MapIcon className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-[10px] font-black text-white uppercase tracking-[0.2em] opacity-80">Explorer</h1>
              <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981] animate-pulse" /> 
                 Live Reports 
              </p>
            </div>
          </motion.div>

          {/* Search Pill - High Intensity Glass */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="relative w-full md:w-80 pointer-events-auto"
          >
            <LocationAutocomplete 
              value={filters.search}
              onChange={(val) => setFilters({...filters, search: val, area: ""})}
              onSelect={(selection) => {
                if (Number.isFinite(selection?.lat) && Number.isFinite(selection?.lng)) {
                  setFocusLocation([selection.lat, selection.lng]);
                }
                setFilters((prev) => ({
                  ...prev,
                  search: selection?.name || prev.search,
                  area: selection?.area || prev.area,
                  city: selection?.city || prev.city,
                }));
              }}
              cityHint={filters.city || "Bengaluru"}
              placeholder="Search by area..."
              icon={Search}
            />
          </motion.div>
        </div>

        {/* Loading Indicator - Simplified Language */}
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-24 left-1/2 z-400 -translate-x-1/2 rounded-full border border-white/10 bg-black/80 px-8 py-3.5 backdrop-blur-3xl shadow-[0_24px_48px_rgba(0,0,0,0.8)]"
          >
             <div className="flex items-center gap-4 text-[11px] font-black text-primary uppercase tracking-[0.2em]">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                Updating maps...
             </div>
          </motion.div>
        )}

        <IssueMap issues={issues || []} userLocation={detectedLocation} focusLocation={focusLocation} />
      </div>
    </Layout>

  );
}
