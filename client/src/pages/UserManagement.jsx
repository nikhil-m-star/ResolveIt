import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/auth";
import { Layout } from "../components/layout/Layout";
import { 
  Users, 
  ShieldCheck, 
  User, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Search, 
  Filter, 
  Loader2, 
  MoreVertical,
  MapPin,
  Mail,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { useState } from "react";
import { cn } from "../utils/helpers";
import { AreaSelector } from "../components/ui/AreaSelector";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

export function UserManagement() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  const { data: users, isLoading, isError } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const res = await api.get("/users/admin/all");
      return res.data;
    },
  });

  const [promotingUserId, setPromotingUserId] = useState(null);
  const [promoArea, setPromoArea] = useState("");

  const roleMutation = useMutation({
    mutationFn: ({ userId, role, area }) => api.patch(`/users/admin/role/${userId}`, { role, area }),
    onSuccess: () => {
      queryClient.invalidateQueries(["admin", "users"]);
      toast.success("Personnel status updated");
      setPromotingUserId(null);
      setPromoArea("");
    },
    onError: () => toast.error("Failed to update status"),
  });

  const filteredUsers = users?.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchesSearch && matchesRole;
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

  if (isError) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Access Restricted</h2>
          <p className="text-slate-400">You do not have the required permissions to access the Presidential Command Center.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12 md:py-16 space-y-8 sm:space-y-10 md:space-y-12 animate-in fade-in duration-1000">
        
        {/* Promotion Modal - High Intensity Glass */}
        <AnimatePresence>
          {promotingUserId && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPromotingUserId(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-2xl z-[2000] flex items-center justify-center p-6"
            >
              <motion.div 
                 initial={{ scale: 0.9, opacity: 0, y: 20 }}
                 animate={{ scale: 1, opacity: 1, y: 0 }}
                 exit={{ scale: 0.9, opacity: 0, y: 20 }}
                 onClick={(e) => e.stopPropagation()}
                 className="w-full max-w-md glass-card rounded-[32px] sm:rounded-[40px] md:rounded-[48px] p-6 sm:p-8 md:p-10 border border-primary/20 shadow-[0_40px_100px_rgba(16,185,129,0.15)] bg-black/60 relative overflow-hidden"
              >
                  <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
                  
                  <div className="flex flex-col items-center text-center gap-8 relative z-10">
                    <div className="p-5 rounded-[24px] bg-primary/10 border border-primary/20">
                       <ShieldCheck className="w-10 h-10 text-primary" />
                    </div>
                    <div className="space-y-2">
                       <h2 className="text-3xl font-heading font-black text-white uppercase tracking-tighter">Set Area</h2>
                       <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest leading-relaxed">Designate the operational scope for this officer.</p>
                    </div>

                    <div className="w-full space-y-5">
                        <AreaSelector 
                          value={promoArea}
                          onChange={(val) => setPromoArea(val)}
                          onSelect={(selection) => setPromoArea(selection.name)}
                          placeholder="Assign operational area..."
                        />

                       <div className="flex gap-4">
                          <button 
                             onClick={() => setPromotingUserId(null)}
                             className="flex-1 py-4.5 text-[11px] font-black text-slate-500 hover:text-white uppercase tracking-[0.2em] transition-colors"
                          >
                             Cancel
                          </button>
                          <button 
                             onClick={() => {
                                if (promoArea.trim()) {
                                   roleMutation.mutate({ userId: promotingUserId, role: 'OFFICER', area: promoArea.trim() });
                                } else {
                                   toast.error("Area required");
                                }
                             }}
                             disabled={roleMutation.isPending}
                             className="flex-[2] py-4.5 bg-primary hover:bg-emerald-400 text-black font-black uppercase tracking-[0.2em] text-[11px] rounded-2xl transition-all shadow-[0_10px_20px_-10px_#10b981] disabled:opacity-50 active:scale-95"
                          >
                             {roleMutation.isPending ? "Syncing..." : "Save Changes"}
                          </button>
                       </div>
                    </div>
                  </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header HUD */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 sm:gap-8 md:gap-10">
          <div className="space-y-3">
             <motion.div 
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               className="flex items-center gap-3 text-[10px] font-black text-primary uppercase tracking-[0.4em]"
             >
                <Users className="h-3 w-3" /> Access Management
             </motion.div>
             <h1 className="text-4xl sm:text-6xl md:text-hero-xl font-heading font-black text-white tracking-tighter uppercase">
               Database
             </h1>
          </div>

          <div className="flex items-center gap-3 sm:gap-5 md:gap-6">
             <div className="bg-black/40 border border-white/10 rounded-[24px] sm:rounded-[32px] px-5 sm:px-6 md:px-8 py-4 sm:py-5 backdrop-blur-3xl shadow-2xl relative group overflow-hidden">
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Users</span>
                <span className="block text-3xl font-heading font-black text-white tracking-tighter leading-none">{users?.length || 0}</span>
             </div>
             <div className="hidden sm:block bg-black/40 border border-primary/20 rounded-[24px] md:rounded-[32px] px-6 md:px-8 py-4 md:py-5 backdrop-blur-3xl shadow-2xl relative group overflow-hidden">
                <div className="absolute inset-0 bg-primary/5 opacity-100 transition-opacity" />
                <span className="block text-[10px] font-black text-primary uppercase tracking-widest mb-1">Officers</span>
                <span className="block text-3xl font-heading font-black text-primary tracking-tighter leading-none">{users?.filter(u => u.role !== 'CITIZEN').length || 0}</span>
             </div>
          </div>
        </div>

        {/* Control Bar */}
        <div className="flex flex-col md:flex-row gap-5 p-2 md:p-2 rounded-[32px] bg-black/20 border border-white/5 backdrop-blur-3xl shadow-2xl">
          <div className="flex flex-1 items-center gap-4 rounded-[24px] bg-black/50 border border-white/10 px-4 py-3 shadow-inner group focus-within:border-primary/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Search className="h-4 w-4 text-primary" />
            </div>
            <input
              type="text"
              placeholder="Search personnel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none py-2 text-xs font-black text-white placeholder:text-slate-600 uppercase tracking-widest focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 p-1.5 bg-black/40 rounded-[24px] overflow-x-auto scrollbar-hide shrink-0">
             {["ALL", "USER", "OFFICER", "ADMIN"].map((label) => {
               const role = label === "USER" ? "CITIZEN" : label === "ADMIN" ? "PRESIDENT" : label;
               return (
                <button
                  key={label}
                  onClick={() => setRoleFilter(role)}
                  className={cn(
                    "px-6 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all relative overflow-hidden whitespace-nowrap min-w-[80px]",
                    roleFilter === role ? "text-black" : "text-slate-500 hover:text-white"
                  )}
                >
                  {roleFilter === role && (
                    <motion.div 
                      layoutId="filter-pill"
                      className="absolute inset-0 bg-primary shadow-[0_0_20px_rgba(16,185,129,0.4)]" 
                    />
                  )}
                  <span className="relative z-10">{label}</span>
                </button>
               );
             })}
          </div>
        </div>

        {/* Physical Database Database Table / Mobile Grid */}
        <div className="glass-card bg-black/40 border border-white/10 rounded-[28px] sm:rounded-[40px] md:rounded-[48px] shadow-[0_40px_100px_rgba(0,0,0,0.6)] backdrop-blur-3xl overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/5 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
                  <th className="px-10 py-7">User</th>
                  <th className="px-10 py-7">Scope</th>
                  <th className="px-10 py-7">Activity</th>
                  <th className="px-10 py-7 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <AnimatePresence mode="popLayout">
                  {filteredUsers?.map((u) => (
                    <motion.tr 
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      key={u.id} 
                      className="group transition-all hover:bg-primary/[0.02]"
                    >
                      <td className="px-10 py-8 relative">
                        {u.role !== 'CITIZEN' && <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-primary/40 rounded-r-full" />}
                        <div className="flex items-center gap-5">
                          <div className={cn(
                            "w-14 h-14 rounded-2xl bg-black/60 border border-white/10 flex items-center justify-center font-black text-lg transition-all shadow-2xl group-hover:scale-105 group-hover:border-primary/40",
                            u.role === 'PRESIDENT' ? "text-yellow-500" : u.role === 'OFFICER' ? "text-primary" : "text-white"
                          )}>
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col gap-1">
                            <h3 className="font-heading font-black text-white text-lg tracking-tight leading-none group-hover:text-primary/90 transition-colors uppercase">{u.name}</h3>
                            <div className="flex items-center gap-2 text-slate-500 font-black text-[9px] uppercase tracking-widest opacity-60">
                               <Mail className="w-2.5 h-2.5" /> {u.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="space-y-3">
                           <div className="flex items-center gap-2.5 text-[11px] font-black text-slate-300 uppercase tracking-widest">
                              <MapPin className="w-3.5 h-3.5 text-primary opacity-60" /> {u.area || "City Wide"}
                           </div>
                           <div className={cn("inline-flex items-center gap-2 px-3 py-1 rounded-lg border text-[9px] font-black uppercase tracking-[0.2em] shadow-inner", 
                             u.role === 'PRESIDENT' ? "text-yellow-500 bg-yellow-500/10 border-yellow-500/20" :
                             u.role === 'OFFICER' ? "text-primary bg-primary/10 border-primary/20" :
                             "text-slate-500 bg-white/5 border-white/5"
                           )}>
                              {u.role === 'PRESIDENT' ? "Super Admin" : u.role === 'OFFICER' ? "City Officer" : "Active User"}
                           </div>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-8">
                           <div className="flex flex-col">
                              <span className="text-white font-black text-xl tracking-tighter leading-none">{u._count?.issues || 0}</span>
                              <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.1em] mt-1">Reports</span>
                           </div>
                           <div className="flex flex-col">
                              <span className="text-emerald-400 font-black text-xl tracking-tighter leading-none">{u.resolvedCount || 0}</span>
                              <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.1em] mt-1">Clearance</span>
                           </div>
                        </div>
                      </td>
                      <td className="px-10 py-8 text-right">
                         <div className="flex items-center justify-end gap-3">
                            {u.role === 'CITIZEN' ? (
                               <button 
                                 onClick={() => setPromotingUserId(u.id)}
                                 disabled={roleMutation.isPending}
                                 className="flex items-center gap-3 px-5 py-3 bg-white/5 hover:bg-primary text-slate-300 hover:text-black border border-white/10 hover:border-primary rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl disabled:opacity-50 active:scale-95 group"
                               >
                                  <ArrowUpCircle className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" /> Make Officer
                               </button>
                            ) : u.role === 'OFFICER' ? (
                               <button 
                                 onClick={() => roleMutation.mutate({ userId: u.id, role: 'CITIZEN' })}
                                 disabled={roleMutation.isPending}
                                 className="flex items-center gap-3 px-5 py-3 bg-white/5 hover:bg-red-500 text-slate-300 hover:text-white border border-white/10 hover:border-red-500 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl disabled:opacity-50 active:scale-95 group"
                               >
                                  <ArrowDownCircle className="w-4 h-4 transition-transform group-hover:translate-y-0.5" /> Remove Officer
                               </button>
                            ) : (
                               <div className="px-6 py-3 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-inner">
                                  System Root
                               </div>
                            )}
                         </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Mobile Grid View */}
          <div className="lg:hidden p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
            <AnimatePresence mode="popLayout">
              {filteredUsers?.map((u) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={u.id}
                  className="p-4 sm:p-6 bg-white/5 border border-white/10 rounded-[24px] sm:rounded-[32px] space-y-5 sm:space-y-7"
                >
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-14 h-14 shrink-0 rounded-2xl bg-black/60 border border-white/10 flex items-center justify-center font-black text-xl shadow-2xl",
                      u.role === 'PRESIDENT' ? "text-yellow-500" : u.role === 'OFFICER' ? "text-primary" : "text-white"
                    )}>
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col gap-2 flex-1 min-w-0">
                      <h3
                        className="font-heading font-black text-white text-base sm:text-lg tracking-tight leading-tight uppercase line-clamp-2"
                        style={{ overflowWrap: "anywhere" }}
                        title={u.name}
                      >
                        {u.name}
                      </h3>
                      <div className={cn("inline-flex w-fit items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[8px] font-black uppercase tracking-[0.15em]", 
                        u.role === 'PRESIDENT' ? "text-yellow-500 bg-yellow-500/10 border-yellow-500/20" :
                        u.role === 'OFFICER' ? "text-primary bg-primary/10 border-primary/20" :
                        "text-slate-500 bg-white/5 border-white/5"
                      )}>
                        {u.role === 'PRESIDENT' ? "Super Admin" : u.role === 'OFFICER' ? "City Officer" : "Active User"}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                     <div className="p-3 sm:p-4 bg-black/40 border border-white/5 rounded-2xl flex flex-col items-center gap-1">
                        <span className="text-white font-black text-xl tracking-tighter">{u._count?.issues || 0}</span>
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Reports</span>
                     </div>
                     <div className="p-3 sm:p-4 bg-black/40 border border-white/5 rounded-2xl flex flex-col items-center gap-1">
                        <span className="text-emerald-400 font-black text-xl tracking-tighter">{u.resolvedCount || 0}</span>
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Clearance</span>
                     </div>
                  </div>

                  <div className="pt-2">
                    {u.role === 'CITIZEN' ? (
                      <button 
                        onClick={() => setPromotingUserId(u.id)}
                        disabled={roleMutation.isPending}
                        className="w-full flex items-center justify-center gap-3 px-5 sm:px-6 py-3.5 sm:py-4 bg-primary text-black rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                      >
                        <ArrowUpCircle className="w-5 h-5" /> Make Officer
                      </button>
                    ) : u.role === 'OFFICER' ? (
                      <button 
                        onClick={() => roleMutation.mutate({ userId: u.id, role: 'CITIZEN' })}
                        disabled={roleMutation.isPending}
                        className="w-full flex items-center justify-center gap-3 px-5 sm:px-6 py-3.5 sm:py-4 bg-white/5 text-slate-400 border border-white/10 rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                      >
                        <ArrowDownCircle className="w-5 h-5" /> Remove Officer
                      </button>
                    ) : (
                      <div className="w-full py-3.5 sm:py-4 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-center">
                        System Root Restricted
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </Layout>
  );
}
