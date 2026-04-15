import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/auth";
import { Layout } from "../components/layout/Layout";
import { Loader2, TrendingUp, AlertTriangle, CheckCircle, Activity, BarChart3, Users, Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { cn } from "../utils/helpers";
import toast from "react-hot-toast";

export function AdminDashboard() {
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
      const res = await api.get("/issues"); // Optionally filter for officer/president
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
        <div className="p-8 text-center text-red-500">Failed to load dashboard metrics. Ensure you have Officer or President privileges.</div>
      </Layout>
    );
  }

  const handleExportCSV = () => {
    if (!issues || issues.length === 0) return toast.error("No data to export or still loading");

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
    link.setAttribute("download", `resolveit-report-${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Report downloaded safely!");
  };

  const COLORS = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4'];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-white flex items-center gap-3">
              <Activity className="w-8 h-8 text-primary" /> Command Center
            </h1>
            <p className="text-gray-400 mt-1">Real-time overview of civic issues and SLA tracking.</p>
          </div>
          <div className="flex gap-3">
             <button 
                onClick={handleExportCSV}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
             >
               <Download className="w-4 h-4" /> Export Report
             </button>
          </div>
        </div>

        {/* Global KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Total Issues" 
            value={stats.total} 
            icon={<BarChart3 className="text-blue-500 w-6 h-6" />}
            trend="+12% this week"
            trendUp={true}
          />
          <StatCard 
            title="Resolved" 
            value={stats.resolved} 
            icon={<CheckCircle className="text-emerald-500 w-6 h-6" />}
            trend={`Resolution Rate: ${stats.resolutionRate}%`}
            trendUp={true}
          />
          <StatCard 
            title="In Progress" 
            value={stats.inProgress} 
            icon={<Activity className="text-amber-500 w-6 h-6" />}
          />
          <StatCard 
            title="SLA Breached" 
            value={stats.slaBreached} 
            icon={<AlertTriangle className="text-red-500 w-6 h-6" />}
            trend="Require immediate attention"
            trendUp={false}
            alert={stats.slaBreached > 0}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart Section */}
          <div className="lg:col-span-2 glass-card p-6 h-[400px] flex flex-col">
            <h3 className="text-lg font-heading font-medium text-white mb-6">Category Breakdown</h3>
            <div className="flex-1 w-full relative">
              {stats.categoryBreakdown?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.categoryBreakdown} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="category" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => val.replace(/_/g, " ")} />
                    <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#0a0f1e', borderColor: '#3b82f6', borderRadius: '8px' }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {stats.categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">No category data available</div>
              )}
            </div>
          </div>

          <div className="glass-card p-6 h-[400px] flex flex-col">
            <h3 className="text-lg font-heading font-medium text-white mb-6">Distribution</h3>
            <div className="flex-1 w-full relative">
               {stats.categoryBreakdown?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.categoryBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="count"
                        stroke="none"
                      >
                        {stats.categoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#0a0f1e', borderColor: '#3b82f6', borderRadius: '8px' }} />
                    </PieChart>
                  </ResponsiveContainer>
               ) : (
                 <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">No data available</div>
               )}
            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
}

function StatCard({ title, value, icon, trend, trendUp, alert }) {
  return (
    <div className={cn(
        "glass-card p-6 relative overflow-hidden",
        alert ? "border-red-500/50 bg-red-500/5" : ""
    )}>
      {alert && <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/10 rounded-bl-full blur-xl"></div>}
      <div className="flex justify-between items-start mb-4 relative z-10">
        <h3 className="text-gray-400 font-medium text-sm">{title}</h3>
        <div className="p-2 bg-white/5 rounded-lg border border-white/5">{icon}</div>
      </div>
      <div className="space-y-1 relative z-10">
        <h4 className="text-3xl font-heading font-bold text-white">{value}</h4>
        {trend && (
          <p className={cn("text-xs font-medium flex items-center gap-1", trendUp === true ? "text-emerald-400" : trendUp === false ? "text-red-400" : "text-gray-500")}>
            {trendUp === true && <TrendingUp className="w-3 h-3" />}
            {trend}
          </p>
        )}
      </div>
    </div>
  );
}
