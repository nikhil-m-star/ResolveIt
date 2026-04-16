import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/auth";
import { Layout } from "../components/layout/Layout";
import { Loader2, TrendingUp, AlertTriangle, CheckCircle, Activity, BarChart3, Users, Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { cn } from "../utils/helpers";
import toast from "react-hot-toast";

export function AdminDashboard() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ["adminStats"],
    queryFn: async () => {
      const res = await api.get("/admin/stats");
      return res.data;
    },
  });

  const { data: issues } = useQuery({
    queryKey: ["adminIssues"],
    queryFn: async () => {
      const res = await api.get("/issues");
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full pt-32 text-primary">
          <Loader2 className="w-10 h-10 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (isError || !stats) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Metrics Unavailable</h2>
          <p className="text-slate-400">Ensure you have the required Official clearance to access the Command Center.</p>
        </div>
      </Layout>
    );
  }

  const handleExportCSV = () => {
    if (!issues || issues.length === 0) return toast.error("No data to export or still loading");
    setIsGenerating(true);

    const headers = ["ID", "Title", "Category", "Status", "Intensity", "City", "Area", "Created At", "SLA Breached"];
    const rows = issues.map(issue => [
      issue.id,
      `"${issue.title.replace(/"/g, '""')}"`,
      issue.category,
      issue.status,
      issue.intensity || "N/A",
      `"${issue.city}"`,
      `"${issue.area || ""}"`,
      new Date(issue.createdAt).toISOString(),
      issue.slaBreached ? "Yes" : "No"
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `resolveit-intelligence-export-${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsGenerating(false);
    toast.success("Intelligence export complete");
  };

  const COLORS = ["#3b82f6", "#06b6d4", "#6366f1", "#8b5cf6", "#ec4899", "#f59e0b"];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-12 animate-in fade-in duration-700">
        
        {/* Admin Header */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
               <Activity className="w-3.5 h-3.5" /> Sector Intelligence Active
            </div>
            <h1 className="text-4xl font-heading font-extrabold text-white tracking-tight">Command Center</h1>
            <p className="text-slate-400 font-medium">Strategic overview of city-wide operations and performance metrics.</p>
          </div>
          <button 
            onClick={handleExportCSV}
            disabled={isGenerating}
            className="flex items-center gap-2 rounded-2xl bg-white/5 border border-white/10 px-8 py-3.5 text-sm font-black text-white hover:bg-white/10 transition-all active:scale-95 disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-primary" />} 
            Log Data Export
          </button>
        </div>

        {/* Strategic KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Total Reports" 
            value={stats.total} 
            icon={<BarChart3 className="text-primary w-5 h-5" />}
            trend="+8.2% vs last month"
          />
          <StatCard 
            title="Success Rate" 
            value={`${stats.resolutionRate}%`} 
            icon={<CheckCircle className="text-emerald-400 w-5 h-5" />}
            trend="Clearance optimization active"
          />
          <StatCard 
            title="Active Operations" 
            value={stats.inProgress} 
            icon={<Activity className="text-blue-400 w-5 h-5" />}
            trend="Ongoing field response"
          />
          <StatCard 
            title="Critical Breaches" 
            value={stats.slaBreached} 
            icon={<AlertTriangle className="w-5 h-5" />}
            trend={stats.slaBreached > 0 ? "Immediate action required" : "Operations within SLA"}
            alert={stats.slaBreached > 0}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Data Visualization */}
          <div className="lg:col-span-2 glass-card overflow-hidden h-[450px] flex flex-col p-8">
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] mb-8">Category Distribution</h3>
            <div className="flex-1 w-full">
              {stats.categoryBreakdown?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.categoryBreakdown} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                    <XAxis dataKey="category" stroke="#475569" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} tickFormatter={(val) => val.split('_')[0].substring(0, 6)} />
                    <YAxis stroke="#475569" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} />
                    <Tooltip cursor={{fill: 'rgba(255,255,255,0.02)'}} contentStyle={{ backgroundColor: '#020617', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={40}>
                      {stats.categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-600 text-xs font-bold uppercase tracking-widest">Awaiting sector data...</div>
              )}
            </div>
          </div>

          <div className="glass-card overflow-hidden h-[450px] flex flex-col p-8">
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] mb-8">Resource Spread</h3>
            <div className="flex-1 w-full flex items-center justify-center">
               {stats.categoryBreakdown?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.categoryBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={8}
                        dataKey="count"
                        stroke="none"
                      >
                        {stats.categoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }} />
                    </PieChart>
                  </ResponsiveContainer>
               ) : (
                 <div className="h-full flex items-center justify-center text-slate-600 text-xs font-bold uppercase tracking-widest">Analyzing distribution...</div>
               )}
            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
}

function StatCard({ title, value, icon, trend, alert }) {
  return (
    <div className={cn(
        "glass-card p-8 group hover:border-primary/40 transition-all",
        alert && "border-red-500/30 bg-red-500/5 hover:border-red-500/50"
    )}>
      <div className="flex justify-between items-start mb-6">
        <div className="p-3 bg-slate-900 border border-white/5 rounded-2xl shadow-inner group-hover:bg-primary/10 transition-colors">
           {icon}
        </div>
        {alert && <div className="p-1 px-2.5 bg-red-500 text-white text-[8px] font-black uppercase tracking-widest rounded-full animate-pulse shadow-lg shadow-red-500/20">Critical</div>}
      </div>
      <div className="space-y-1">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">{title}</h3>
        <h4 className="text-4xl font-heading font-black text-white tracking-tight">{value}</h4>
        {trend && (
          <p className={cn("text-[9px] font-bold uppercase tracking-wider pt-2", alert ? "text-red-400" : "text-slate-500")}>
            {trend}
          </p>
        )}
      </div>
    </div>
  );
}
