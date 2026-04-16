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

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border border-blue-500/20 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" /> NVIDIA NIM POWERED
              </span>
            </div>
            <h1 className="text-4xl font-heading font-bold text-white mb-2">Strategic Intelligence</h1>
            <p className="text-gray-400">Advanced civic analysis for strategic planning and resolution tracking.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <select 
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50"
            >
              <option value="">Whole City</option>
              {availableAreas.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <button 
              onClick={fetchReport}
              disabled={isLoading}
              className="flex items-center gap-2 bg-primary hover:bg-blue-600 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Generate Report
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="glass-card p-6 border-white/5">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                   <ShieldAlert className="w-4 h-4" /> Transparency Protocol
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  This analysis is available to all citizens to ensure democratic accountability in municipal response.
                </p>
                <div className="mt-6 pt-6 border-t border-white/5">
                   <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2">
                      <span>Sync Status</span>
                      <span className="text-blue-400 font-bold">Encrypted</span>
                   </div>
                   <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Last Scan</span>
                      <span>{lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}</span>
                   </div>
                </div>
            </div>

            <div className="glass-pill p-4 border-primary/10 bg-primary/5 rounded-2xl">
               <div className="flex items-start gap-3">
                  <div className="bg-primary/20 p-2 rounded-lg">
                     <Bot className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white leading-tight">Civic Intelligence</h4>
                    <p className="text-[11px] text-slate-400 mt-1">Llama 3.3-70B Analyzing top 50 sector-specific issues.</p>
                  </div>
               </div>
            </div>
          </div>

          {/* Main Report Section */}
          <div className="lg:col-span-3">
             <div className="glass-card min-h-[600px] border-white/10 shadow-2xl relative overflow-hidden">
                
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 blur-[100px] pointer-events-none" />

                <div className="p-8 sm:p-12 relative z-10">
                   {isLoading ? (
                      <div className="flex flex-col items-center justify-center py-32 text-center">
                         <div className="relative mb-8">
                            <Loader2 className="w-16 h-16 text-primary animate-spin opacity-20" />
                            <Sparkles className="w-8 h-8 text-primary absolute inset-0 m-auto animate-pulse" />
                         </div>
                         <h2 className="text-2xl font-heading text-xl font-bold text-white mb-2 italic">Scanning Civic Grid...</h2>
                         <p className="text-slate-400 max-w-sm mx-auto text-sm">
                            Our AI is analyzing recurring patterns and hyperlinking referenced incidents...
                         </p>
                      </div>
                   ) : !report ? (
                      <div className="flex flex-col items-center justify-center py-32 text-center border-2 border-dashed border-white/5 rounded-3xl">
                        <FileText className="w-12 h-12 text-slate-700 mb-4" />
                        <h3 className="text-lg font-bold text-slate-500 uppercase tracking-widest">Ready for Analysis</h3>
                        <p className="text-sm text-slate-600 mt-2 max-w-xs">Click the generate button to begin AI-powered city-wide reporting.</p>
                      </div>
                   ) : (
                      <div className="prose prose-invert prose-slate max-w-none">
                         <div className="flex items-center gap-2 mb-8 text-slate-500 text-xs font-bold uppercase tracking-widest">
                            <FileText className="w-4 h-4" /> Civic Intelligence Report
                            <ChevronRight className="w-3 h-3" /> {new Date().toLocaleDateString()}
                            {area && <><ChevronRight className="w-3 h-3" /> Area: {area}</>}
                         </div>
                         
                         <ReactMarkdown 
                            components={{
                                h1: ({node, ...props}) => <h1 className="text-3xl font-heading font-bold text-white mt-8 mb-4 grad-text-primary" {...props} />,
                                h2: ({node, ...props}) => <h2 className="text-2xl font-heading font-bold text-white mt-10 mb-4 border-b border-white/10 pb-2" {...props} />,
                                h3: ({node, ...props}) => <h3 className="text-xl font-heading font-bold text-slate-200 mt-6 mb-3" {...props} />,
                                p: ({node, ...props}) => <p className="text-slate-300 leading-relaxed mb-4" {...props} />,
                                ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-2 mb-6 text-slate-300" {...props} />,
                                li: ({node, ...props}) => <li className="marker:text-primary list-item" {...props} />,
                                strong: ({node, ...props}) => <strong className="text-white font-bold" {...props} />,
                                a: ({node, ...props}) => <Link to={props.href} className="text-blue-400 font-bold underline hover:text-blue-300 transition-colors" {...props} />,
                                blockquote: ({node, ...props}) => (
                                    <blockquote className="border-l-4 border-primary/50 bg-primary/5 p-4 rounded-r-xl my-6 italic text-slate-300" {...props} />
                                ),
                            }}
                         >
                            {report}
                         </ReactMarkdown>

                         <div className="mt-16 pt-8 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-500">
                            <p>© {new Date().getFullYear()} ResolveIt Intelligence</p>
                            <p>Analysis by Llama 3.3 via NVIDIA NIM</p>
                         </div>
                      </div>
                   )}
                </div>
             </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}
