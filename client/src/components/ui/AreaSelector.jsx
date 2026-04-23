import { useState, useRef, useEffect } from "react";
import { ChevronDown, MapPin, Search, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../utils/helpers";
import { OPERATIONAL_AREAS } from "../../utils/constants";

export function AreaSelector({ 
  value, 
  onChange, 
  onSelect, 
  placeholder = "Select Area...",
  className,
  error = false,
  cityHint = "Bengaluru",
  countryHint = "India",
  limit = 10
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dynamicAreas, setDynamicAreas] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef(null);
  const timeoutRef = useRef(null);
  const requestIdRef = useRef(0);

  const selectedArea = OPERATIONAL_AREAS.find(a => a.name === value) || dynamicAreas.find(a => a.name === value);

  const staticFiltered = OPERATIONAL_AREAS.filter((area) =>
    area.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const mergedAreas = (() => {
    const map = new Map();
    [...staticFiltered, ...dynamicAreas].forEach((area) => {
      const key = area.name.toLowerCase();
      if (!map.has(key)) map.set(key, area);
    });
    return Array.from(map.values()).slice(0, limit);
  })();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    const q = searchTerm.trim();
    if (q.length < 2) {
      setDynamicAreas([]);
      setIsLoading(false);
      return;
    }

    timeoutRef.current = setTimeout(async () => {
      const requestId = ++requestIdRef.current;
      setIsLoading(true);
      try {
        const bias = [cityHint, countryHint].filter(Boolean).join(", ");
        const primary = `${q}, ${bias}`;
        const fallback = `${q}, ${countryHint}`;
        const buildUrl = (query) =>
          `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=${limit}&q=${encodeURIComponent(query)}`;

        const primaryRes = await fetch(buildUrl(primary));
        const primaryData = await primaryRes.json();
        let fallbackData = [];
        if (fallback !== primary) {
          const fallbackRes = await fetch(buildUrl(fallback));
          fallbackData = await fallbackRes.json();
        }

        const normalized = [...(primaryData || []), ...(fallbackData || [])]
          .map((item) => ({
            name:
              item.address?.suburb ||
              item.address?.city_district ||
              item.address?.neighbourhood ||
              item.address?.quarter ||
              item.address?.town ||
              item.address?.city ||
              item.display_name?.split(",")?.[0] ||
              "Unknown Area",
            lat: Number(item.lat),
            lng: Number(item.lon),
            city: item.address?.city || item.address?.town || cityHint || "Bengaluru",
          }))
          .filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng));

        const deduped = [];
        const seen = new Set();
        for (const area of normalized) {
          const key = area.name.toLowerCase();
          if (seen.has(key)) continue;
          seen.add(key);
          deduped.push(area);
        }

        if (requestId === requestIdRef.current) {
          setDynamicAreas(deduped);
        }
      } catch (error) {
        console.error("Area lookup failed:", error);
        if (requestId === requestIdRef.current) {
          setDynamicAreas([]);
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    }, 300);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [searchTerm, isOpen, cityHint, countryHint, limit]);

  const handleSelect = (area) => {
    if (onChange) onChange(area.name);
    if (onSelect) onSelect(area);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full bg-[#121212] border rounded-2xl px-6 py-4.5 text-left transition-all group",
          isOpen ? "border-primary/40 bg-[#1a1a1a] shadow-[0_0_30px_rgba(16,185,129,0.1)]" : "border-white/10 hover:border-white/20",
          error ? "border-red-500/50" : ""
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <MapPin className={cn(
              "w-4 h-4 transition-colors",
              selectedArea ? "text-primary" : "text-slate-600 group-hover:text-slate-400"
            )} />
            <span className={cn(
              "text-[11px] font-black uppercase tracking-widest transition-colors",
              selectedArea ? "text-white" : "text-slate-500"
            )}>
              {selectedArea?.name || placeholder}
            </span>
          </div>
          <ChevronDown className={cn(
            "w-4 h-4 text-slate-600 transition-transform duration-300",
            isOpen ? "rotate-180 text-primary" : ""
          )} />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 5, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            style={{ 
              backgroundColor: "#0a0a0a", 
              opacity: "1 !important",
              zIndex: 9999 
            }}
            className="absolute left-0 right-0 rounded-3xl border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,1)] pointer-events-auto"
          >
            {/* Search Input Inside Dropdown */}
            <div className="p-4 border-b border-white/5 bg-[#0a0a0a] rounded-t-3xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search any area..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-[10px] font-black uppercase tracking-widest text-white focus:outline-none focus:border-primary/40 transition-all"
                />
              </div>
            </div>

            <div 
              className="max-h-[280px] overflow-y-auto py-2 relative z-20 overscroll-contain"
              style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
            >
              {isLoading && (
                <div className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-500">
                  Loading areas...
                </div>
              )}
              {mergedAreas.length > 0 ? (
                mergedAreas.map((area) => (
                  <button
                    key={area.name}
                    type="button"
                    onClick={() => handleSelect(area)}
                    className="w-full text-left px-6 py-4 hover:bg-white/5 transition-all flex items-center justify-between group cursor-pointer active:bg-white/10"
                  >
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-widest transition-colors",
                      value === area.name ? "text-primary" : "text-slate-400 group-hover:text-white"
                    )}>
                      {area.name}
                    </span>
                    {value === area.name && (
                      <Check className="w-3.5 h-3.5 text-primary" />
                    )}
                  </button>
                ))
              ) : (
                <div className="px-6 py-10 text-center">
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">No matching sectors found</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
