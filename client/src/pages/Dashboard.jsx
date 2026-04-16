import { useState, useEffect, useRef } from "react";
import { Layout } from "../components/layout/Layout";
import { IssueCard } from "../components/issues/IssueCard";
import { IssueMap } from "../components/issues/IssueMap";
import { useIssues } from "../hooks/useIssues";
import { Search, Filter, Loader2, RefreshCcw, CheckCircle2, MapPin } from "lucide-react";

export function Dashboard() {
  const [filters, setFilters] = useState({
    city: "Bengaluru", // default, could pull from profile
    category: "",
    status: "",
    search: ""
  });

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            // Fetch city name using reverse geocoding
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            const data = await res.json();
            const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || "Bengaluru";
            setFilters(prev => ({ ...prev, city }));
          } catch (error) {
            console.error("Failed to determine city:", error);
          }
        },
        (error) => {
          console.warn("Geolocation denied or failed:", error);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
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
      <div className="flex flex-col md:flex-row h-full">
        {/* LEFT PANEL - Filters & Feed */}
        <div className="w-full md:w-3/5 lg:w-1/2 flex flex-col h-full bg-background border-r border-white/5 relative z-10 overflow-hidden">
          
          <div className="p-4 sm:p-6 border-b border-white/10 glass-panel sticky top-0 z-20 space-y-4 shadow-xl shadow-black/20">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-heading font-bold text-white tracking-tight text-glow">
                  Live Feed
                </h1>
                <button 
                  onClick={() => refetch()} 
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-colors group"
                >
                  <RefreshCcw className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input 
                  type="text" 
                  placeholder="Search issues by title or description..." 
                  onChange={handleSearch}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 text-white placeholder:text-gray-500 transition-shadow"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10 cursor-pointer min-w-max">
                  <Filter className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs font-medium text-gray-300">Filters</span>
                </div>
                {/* Future implementation: Dropdowns for category, status, area here */}
                <select 
                  onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}
                  className="text-xs font-medium bg-black/50 border border-white/10 rounded-lg px-2 py-1.5 text-gray-300 outline-none hover:bg-white/5 appearance-none min-w-max pr-8"
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
                  className="text-xs font-medium bg-black/50 border border-white/10 rounded-lg px-2 py-1.5 text-gray-300 outline-none hover:bg-white/5 appearance-none min-w-max pr-8"
                >
                  <option value="">All Statuses</option>
                  <option value="REPORTED">Reported</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
              </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 pb-8 space-y-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400 space-y-3">
                 <Loader2 className="w-8 h-8 animate-spin text-primary" />
                 <p className="font-medium animate-pulse">Scanning civic grid...</p>
              </div>
            ) : isError ? (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-center">
                 Failed to load issues. Try refreshing.
              </div>
            ) : issues?.length === 0 ? (
               <div className="text-center py-20 text-gray-500 flex flex-col items-center gap-3">
                 <div className="p-4 bg-white/5 border border-white/10 rounded-2xl inline-block">
                   <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                 </div>
                 <p className="text-lg font-medium text-white">No active issues found</p>
                 <p className="text-sm">Enjoy the perfect infrastructure!</p>
               </div>
            ) : (
               issues?.map(issue => (
                 <IssueCard key={issue.id} issue={issue} />
               ))
            )}
            <div className="h-12 w-full" /> {/* Bottom spacer for scrolling */}
          </div>
        </div>

        {/* RIGHT PANEL - Tactical Map */}
        <div className="hidden md:block md:w-2/5 lg:w-1/2 h-full bg-black relative">
          <div className="absolute top-4 right-4 z-[400] bg-background/80 backdrop-blur-md rounded-lg px-3 py-1.5 border border-white/10 shadow-xl pointer-events-none">
             <span className="text-xs font-bold font-heading text-white flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                LIVE HEATMAP
             </span>
          </div>
          <IssueMap issues={issues || []} />
        </div>
      </div>
    </Layout>
  );
}
