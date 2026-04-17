import { useState, useEffect } from "react";
import { Layout } from "../components/layout/Layout";
import { api } from "../lib/auth";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Bot, Loader2, Sparkles, Download, RefreshCcw, ShieldAlert, FileText, ChevronRight } from "lucide-react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

export function AIInsights() {
  const [report, setReport] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [area, setArea] = useState("");
  const [availableAreas, setAvailableAreas] = useState([]);

  // Fetch unique areas for the selector
  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const { data: issues } = await api.get("/issues");
        const uniqueAreas = [...new Set(issues.map(i => i.area).filter(Boolean))];
        setAvailableAreas(uniqueAreas);
      } catch (err) {
        console.error("Failed to fetch areas", err);
      }
    };
    fetchAreas();
  }, []);

  const fetchReport = async () => {
    setIsLoading(true);
    setReport(""); // Clear previous
    try {
      const url = area ? `/issues/ai-report?area=${encodeURIComponent(area)}` : "/issues/ai-report";
      const { data } = await api.get(url);
      setReport(data.report);
      setLastUpdated(new Date());
      toast.success("Intelligence Briefing Compiled");
    } catch (error) {
      console.error("Failed to fetch AI report", error);
      toast.error("Failed to generate AI Insights report");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPDF = () => {
    toast.success("Exporting report...");
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-12 animate-in fade-in duration-700">
        
        {/* Header Section - Minimal */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-16">
          <h1 className="text-6xl font-heading font-black text-white uppercase tracking-tight">AI Insights</h1>
          
          <div className="flex items-center gap-3">
            <select 
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50"
            >
              <option value="">Whole City</option>
              {availableAreas.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <button 
              onClick={fetchReport}
              disabled={isLoading}
              className="flex items-center gap-2 bg-primary hover:brightness-110 rounded-xl px-6 py-3 text-sm font-black uppercase tracking-widest text-white transition-all shadow-xl disabled:opacity-50"
            >
              <RefreshCcw className={cn("w-4 h-4", isLoading && "animate-spin")} />
              {isLoading ? 'Processing...' : 'Generate Intelligence'}
            </button>
          </div>
        </div>

        {/* Main Intelligence Report - Pure Minimalist */}
        <div className="glass-card bg-black border border-white/5 p-12 relative overflow-hidden shadow-2xl">
           <div className="relative z-10">
              {isLoading ? (
                 <div className="py-32 flex flex-col items-center justify-center gap-6 text-slate-500">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-[10px] font-black uppercase tracking-widest animate-pulse">Syncing Sector Data...</span>
                 </div>
              ) : !report ? (
                 <div className="flex flex-col items-center justify-center py-32 text-center border-2 border-dashed border-white/5 rounded-3xl">
                   <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6">
                      <FileText className="w-8 h-8 text-slate-700" />
                   </div>
                   <h3 className="text-lg font-black text-slate-500 uppercase tracking-widest">Awaiting Command</h3>
                   <p className="text-sm text-slate-600 mt-2 max-w-xs">Initialize city-wide analysis for executive briefing.</p>
                 </div>
              ) : (
                 <div className="animate-in fade-in duration-1000 prose prose-invert max-w-none">
                    <div className="flex items-center gap-2 mb-12 text-slate-600 text-[10px] font-black uppercase tracking-widest">
                       <div className="w-1.5 h-1.5 rounded-full bg-primary" /> Sector Briefing Protocol
                       <ChevronRight className="w-2.5 h-2.5" /> {new Date().toLocaleDateString()}
                    </div>
                    
                    <ReactMarkdown 
                       components={{
                           h1: ({node, ...props}) => <h1 className="text-4xl font-heading font-black text-white mt-12 mb-6 uppercase tracking-tight" {...props} />,
                           h2: ({node, ...props}) => <h2 className="text-2xl font-heading font-bold text-white mt-12 mb-4 border-l-4 border-primary pl-4" {...props} />,
                           h3: ({node, ...props}) => <h3 className="text-xl font-heading font-bold text-slate-200 mt-8 mb-4 uppercase tracking-wide" {...props} />,
                           p: ({node, ...props}) => <p className="text-slate-300 leading-relaxed mb-6 font-medium text-lg" {...props} />,
                           ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-3 mb-8 text-slate-300 font-medium" {...props} />,
                           li: ({node, ...props}) => <li className="list-item" {...props} />,
                           strong: ({node, ...props}) => <strong className="text-white font-black uppercase text-sm tracking-widest" {...props} />,
                           a: ({node, ...props}) => <Link to={props.href} className="text-primary font-bold hover:brightness-125 transition-all underline decoration-primary/30" {...props} />,
                           blockquote: ({node, ...props}) => (
                               <blockquote className="border-l-4 border-primary/30 bg-primary/5 p-6 rounded-r-2xl my-8 italic text-slate-300" {...props} />
                           ),
                       }}
                    >
                       {report}
                    </ReactMarkdown>
                 </div>
              )}
           </div>
        </div>
      </div>
    </Layout>

  );
}
