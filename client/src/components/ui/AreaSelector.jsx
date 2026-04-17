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
  error = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef(null);

  const selectedArea = OPERATIONAL_AREAS.find(a => a.name === value);

  const filteredAreas = OPERATIONAL_AREAS.filter(area => 
    area.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (area) => {
    onChange(area.name);
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
          "w-full bg-black/40 border rounded-2xl px-6 py-4.5 text-left transition-all backdrop-blur-3xl group",
          isOpen ? "border-primary/40 bg-black/60 shadow-[0_0_30px_rgba(16,185,129,0.1)]" : "border-white/10 hover:border-white/20",
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
                  placeholder="FILTER AREAS..."
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
              {filteredAreas.length > 0 ? (
                filteredAreas.map((area) => (
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
