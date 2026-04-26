import { useState, useEffect } from "react";
import { Layout } from "../components/layout/Layout";
import { api } from "../lib/auth";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Bot, Loader2, Sparkles, Download, RefreshCcw, ShieldAlert, FileText, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
      <div className="relative min-h-screen overflow-hidden">
        {/* Immersive Neural Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.15, 0.1] 
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute -top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-primary/20 blur-[120px]" 
          />
          <motion.div 
            animate={{ 
              scale: [1.2, 1, 1.2],
              opacity: [0.05, 0.1, 0.05] 
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[100px]" 
          />
        </div>

        <div className="max-w-4xl mx-auto px-6 py-16 relative z-10">
          
          {/* Header Section - Gradient Branding */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-20">
            <div className="flex flex-col gap-2">
               <h1 className="text-hero-xl font-heading font-black text-white uppercase tracking-tighter">
                 AI <span className="text-primary">Insights</span>
               </h1>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col sm:flex-row w-full md:w-auto items-stretch sm:items-center gap-2 sm:gap-3 p-1.5 rounded-[20px] bg-white/5 border border-white/5 backdrop-blur-xl shadow-2xl"
            >
              <select 
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="bg-transparent border-none rounded-xl px-5 py-4 sm:py-3 text-[11px] font-black uppercase tracking-widest text-white/70 focus:text-white focus:outline-none transition-colors cursor-pointer w-full text-center sm:text-left"
              >
                <option value="" className="bg-slate-900">City Wide</option>
                {availableAreas.map(a => <option key={a} value={a} className="bg-slate-900">{a}</option>)}
              </select>
              <button 
                onClick={fetchReport}
                disabled={isLoading}
                className="flex items-center justify-center gap-3 bg-primary hover:bg-emerald-400 rounded-xl px-8 py-4 sm:py-3.5 text-[11px] font-black uppercase tracking-[0.2em] text-black transition-all shadow-[0_10px_30px_-10px_#10b981] disabled:opacity-50 disabled:shadow-none active:scale-95 group w-full sm:w-auto"
              >
                <RefreshCcw className={cn("w-4 h-4 transition-transform group-hover:rotate-180 duration-500", isLoading && "animate-spin")} />
                {isLoading ? 'Processing...' : 'Generate Report'}
              </button>
            </motion.div>
          </div>

          {/* Main Container - High Intensity Glass */}
          <div className="glass-card bg-black/40 border border-white/10 p-1 md:p-1.5 rounded-[48px] shadow-[0_40px_100px_rgba(0,0,0,0.6)] backdrop-blur-3xl overflow-hidden group">
             <div className="p-10 md:p-16 rounded-[42px] bg-black/20 border border-white/5 relative h-full">
                
                <AnimatePresence mode="wait">
                  {isLoading ? (
                     <motion.div 
                       key="loading"
                       initial={{ opacity: 0 }}
                       animate={{ opacity: 1 }}
                       exit={{ opacity: 0 }}
                       className="py-32 flex flex-col items-center justify-center gap-12 relative"
                     >
                        {/* Advanced Neural Grid Scan */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-20">
                           <div className="w-full h-full grid grid-cols-8 gap-4 p-8">
                             {[...Array(64)].map((_, i) => (
                               <motion.div 
                                 key={i}
                                 animate={{ opacity: [0.1, 0.4, 0.1] }}
                                 transition={{ duration: 2, repeat: Infinity, delay: i * 0.02 }}
                                 className="w-1 h-1 bg-primary rounded-full shadow-[0_0_5px_#10b981]" 
                               />
                             ))}
                           </div>
                        </div>
                        
                        <div className="relative">
                           <div className="w-24 h-24 border-2 border-primary/10 rounded-full animate-ping absolute inset-0" />
                           <motion.div 
                             animate={{ rotate: 360 }}
                             transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                             className="w-24 h-24 border-t-2 border-r-2 border-primary rounded-full relative z-10" 
                           />
                           <div className="absolute inset-0 flex items-center justify-center">
                              <Bot className="h-8 w-8 text-primary animate-pulse" />
                           </div>
                        </div>

                        <div className="flex flex-col items-center gap-3 relative z-20">
                           <span className="text-[14px] font-black uppercase tracking-[0.4em] text-white">Updating analysis</span>
                           <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 animate-pulse">Processing city records...</span>
                        </div>
                     </motion.div>
                  ) : !report ? (
                     <motion.div 
                       key="empty"
                       initial={{ opacity: 0 }}
                       animate={{ opacity: 1 }}
                       className="flex flex-col items-center justify-center py-32 text-center"
                     >
                       <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-8 border border-white/5 shadow-inner group-hover:border-primary/20 transition-colors">
                          <FileText className="w-10 h-10 text-slate-700 group-hover:text-primary/40 transition-colors" />
                       </div>
                       <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">Awaiting Analysis</h3>
                       <p className="text-sm text-slate-600 mt-4 max-w-xs leading-relaxed uppercase tracking-tighter">Select an area to generate a high-fidelity diagnostic report.</p>
                     </motion.div>
                  ) : (
                     <motion.div 
                       key="content"
                       initial={{ opacity: 0, y: 20 }}
                       animate={{ opacity: 1, y: 0 }}
                       transition={{ duration: 0.8 }}
                       className="prose prose-invert max-w-none"
                     >
                        <div className="flex items-center gap-3 mb-16 text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] border-b border-white/5 pb-6">
                           <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_#10b981]" /> City Analysis
                           <ChevronRight className="w-3 h-3 mx-2 opacity-30" /> {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                        
                        <ReactMarkdown 
                            components={{
                                h1: ({node, ...props}) => <h1 className="text-4xl md:text-5xl font-heading font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-300 mt-20 mb-10 uppercase tracking-tighter" {...props} />,
                                h2: ({node, ...props}) => <h2 className="text-2xl md:text-3xl font-heading font-black text-white mt-16 mb-8 flex items-center gap-4 uppercase tracking-tight pb-4 border-b border-white/5" {...props} >
                                    <div className="w-3 h-3 bg-primary rounded shadow-[0_0_15px_#10b981] rotate-45" /> {props.children}
                                </h2>,
                                h3: ({node, ...props}) => <h3 className="text-[13px] font-black text-black mt-12 mb-6 uppercase tracking-[0.3em] bg-primary w-fit px-5 py-2 rounded-xl shadow-[0_5px_20px_rgba(16,185,129,0.3)]" {...props} />,
                                p: ({node, ...props}) => <p className="text-slate-300 leading-loose mb-8 font-medium text-[15px] md:text-[17px]" {...props} />,
                                ul: ({node, ...props}) => <ul className="space-y-6 mb-12 text-slate-300" {...props} />,
                                li: ({node, ...props}) => (
                                    <li className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/30 transition-colors group shadow-lg backdrop-blur-sm">
                                      <div className="mt-1.5 w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_#10b981] shrink-0 group-hover:scale-150 transition-transform" />
                                      <span className="font-medium text-[15px] leading-relaxed">{props.children}</span>
                                    </li>
                                ),
                                strong: ({node, ...props}) => <strong className="text-white font-black uppercase text-[12px] tracking-widest bg-primary/10 border border-primary/20 text-primary px-3 py-1 rounded-lg inline-flex items-center mx-1 shadow-[0_0_10px_rgba(16,185,129,0.1)]" {...props} />,
                                a: ({node, ...props}) => <Link to={props.href} className="text-black bg-primary hover:bg-emerald-400 px-4 py-1.5 rounded-lg font-black uppercase tracking-widest text-[11px] transition-all inline-flex items-center gap-2 shadow-[0_5px_15px_rgba(16,185,129,0.3)] hover:shadow-[0_8px_25px_rgba(16,185,129,0.5)] mx-1" {...props} />,
                                blockquote: ({node, ...props}) => (
                                    <blockquote className="relative border-l-4 border-primary bg-gradient-to-r from-primary/10 to-transparent p-10 rounded-r-3xl my-16 text-white text-lg md:text-xl font-medium italic shadow-2xl" {...props} />
                                ),
                            }}
                        >
                           {report}
                        </ReactMarkdown>

                        <div className="mt-20 pt-10 border-t border-white/5 flex flex-col items-center gap-6">
                           <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-600">End of Analysis Report</p>
                           <button 
                             onClick={handleExportPDF}
                             className="flex items-center gap-3 text-slate-400 hover:text-primary transition-colors text-[10px] font-black uppercase tracking-widest"
                           >
                             <Download className="h-4 w-4" /> Export Report
                           </button>
                        </div>
                     </motion.div>
                  )}
                </AnimatePresence>
             </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
