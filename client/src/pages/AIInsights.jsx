import { useState, useEffect } from "react";
import { Layout } from "../components/layout/Layout";
import { api } from "../lib/auth";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Bot, Loader2, Sparkles, Download, RefreshCcw, ShieldAlert, FileText, ChevronRight } from "lucide-react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { cn } from "../utils/helpers";

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
      toast.success("AI Report Generated");
    } catch (error) {
      console.error("Failed to fetch AI report", error);
      toast.error("Failed to generate AI Report");
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
              {isLoading ? 'Analyzing...' : 'Generate Report'}
            </button>
          </div>
        </div>

        {/* Main Intelligence Report - Pure Minimalist */}
        <div className="glass-card bg-black border border-white/5 p-12 relative overflow-hidden shadow-2xl">
           <div className="relative z-10">
              {isLoading ? (
                 <div className="py-32 flex flex-col items-center justify-center gap-8 relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent h-1/2 w-full animate-scan pointer-events-none" />
                    <div className="relative">
                       <div className="w-20 h-20 border-4 border-primary/20 rounded-full animate-ping absolute inset-0" />
                       <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin relative z-10" />
                    </div>
                    <div className="flex flex-col items-center gap-2">
                       <span className="text-[12px] font-black uppercase tracking-[0.3em] text-primary animate-pulse">Analyzing Area Reports</span>
                       <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Processing City Data...</span>
                    </div>
                 </div>
              ) : !report ? (
                 <div className="flex flex-col items-center justify-center py-32 text-center border-2 border-dashed border-white/5 rounded-3xl">
                   <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6">
                      <FileText className="w-8 h-8 text-slate-700" />
                   </div>
                   <h3 className="text-lg font-black text-slate-500 uppercase tracking-widest">Awaiting Analysis</h3>
                   <p className="text-sm text-slate-600 mt-2 max-w-xs">Create an AI-powered report for your city.</p>
                 </div>
              ) : (
                 <div className="animate-in fade-in duration-1000 prose prose-invert max-w-none">
                    <div className="flex items-center gap-2 mb-12 text-slate-600 text-[10px] font-black uppercase tracking-widest">
                       <div className="w-1.5 h-1.5 rounded-full bg-primary" /> City Analysis Report
                       <ChevronRight className="w-2.5 h-2.5" /> {new Date().toLocaleDateString()}
                    </div>
                    
                    <ReactMarkdown 
                        components={{
                            h1: ({node, ...props}) => <h1 className="text-4xl font-heading font-black text-white mt-12 mb-8 uppercase tracking-tight border-b-2 border-white/5 pb-4" {...props} />,
                            h2: ({node, ...props}) => <h2 className="text-2xl font-heading font-bold text-white mt-12 mb-6 flex items-center gap-3" {...props} >
                                <div className="w-1 h-8 bg-primary rounded-full" /> {props.children}
                            </h2>,
                            h3: ({node, ...props}) => <h3 className="text-xl font-heading font-bold text-slate-200 mt-10 mb-4 uppercase tracking-wider bg-white/5 w-fit px-4 py-1 rounded-lg" {...props} />,
                            p: ({node, ...props}) => <p className="text-slate-300 leading-relaxed mb-8 font-medium text-lg/8" {...props} />,
                            ul: ({node, ...props}) => <ul className="space-y-4 mb-10 text-slate-300 font-medium" {...props} />,
                            li: ({node, ...props}) => (
                                <li className="flex items-start gap-3">
                                  <div className="mt-2.5 w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                                  <span>{props.children}</span>
                                </li>
                            ),
                            strong: ({node, ...props}) => <strong className="text-white font-black uppercase text-[11px] tracking-widest bg-white/5 px-2 py-0.5 rounded border border-white/5" {...props} />,
                            a: ({node, ...props}) => <Link to={props.href} className="text-primary font-bold hover:brightness-125 transition-all underline decoration-primary/30 decoration-2 underline-offset-4" {...props} />,
                            blockquote: ({node, ...props}) => (
                                <blockquote className="border-l-4 border-primary/40 bg-primary/5 p-8 rounded-2xl my-10 italic text-slate-300 text-xl font-medium" {...props} />
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
