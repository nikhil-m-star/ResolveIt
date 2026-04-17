import { useState, useEffect, useRef } from "react";
import { MapPin, Loader2, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../utils/helpers";

export function LocationAutocomplete({ 
  value, 
  onChange, 
  onSelect,
  placeholder = "Search area...", 
  className,
  icon: Icon = MapPin 
}) {
  const [query, setQuery] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = async (searchQuery) => {
    if (searchQuery.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      // Lock search to Bengaluru viewbox: [left, top, right, bottom]
      const BENGALURU_VIEWBOX = '77.3,13.2,77.8,12.7';
      const constrainedQuery = `${searchQuery} Bengaluru`;
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(constrainedQuery)}&viewbox=${BENGALURU_VIEWBOX}&bounded=1&addressdetails=1&limit=8`
      );
      const data = await response.json();
      
      // Filter out specific roads, house numbers, or points of interest to keep "Main Areas"
      const formatted = data
        .filter(item => {
          const type = item.addresstype || item.type;
          const excludedTypes = ['highway', 'road', 'building', 'house', 'commercial', 'industrial', 'retail'];
          return !excludedTypes.includes(type);
        })
        .map(item => ({
          id: item.place_id,
          display: item.display_name,
          name: item.address?.suburb || item.address?.city_district || item.address?.town || item.address?.city || item.display_name.split(',')[0],
          full: item.display_name,
          lat: Number(item.lat),
          lng: Number(item.lon),
          city: item.address?.city || item.address?.town || item.address?.village || "Bengaluru",
          area: item.address?.suburb || item.address?.city_district || item.address?.neighbourhood || item.display_name.split(',')[0]
        }));
      
      // Remove duplicates by name
      const uniqueResults = formatted.filter((v, i, a) => a.findIndex(t => (t.name === v.name)) === i);
      
      setSuggestions(uniqueResults);
      setIsOpen(uniqueResults.length > 0);
    } catch (error) {
      console.error("Location search failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val); // Allow free text typing

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(() => {
      fetchSuggestions(val);
    }, 500); // 500ms debounce
  };

  const handleSelect = (suggestion) => {
    setQuery(suggestion.name);
    onChange(suggestion.name);
    if (onSelect) onSelect(suggestion);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <div className="relative group">
        <Icon className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary opacity-60 group-focus-within:opacity-100 transition-opacity" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => query.length >= 3 && suggestions.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-12 py-4.5 text-white text-sm placeholder:text-slate-700 focus:outline-none focus:border-primary/40 focus:bg-black/60 transition-all font-black uppercase tracking-widest"
        />
        <div className="absolute right-5 top-1/2 -translate-y-1/2">
          {isLoading && (
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
          )}
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 5, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute z-50 left-0 right-0 mt-2 bg-black/80 border border-white/10 rounded-2xl backdrop-blur-3xl shadow-2xl overflow-hidden"
          >
            <div className="max-h-60 overflow-y-auto scrollbar-hide">
              {suggestions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSelect(s)}
                  className="w-full text-left px-6 py-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-none group"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-black text-white uppercase tracking-widest group-hover:text-primary transition-colors">
                      {s.name}
                    </span>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter truncate opacity-60">
                      {s.full}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
