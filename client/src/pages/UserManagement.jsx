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
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-8 animate-in fade-in slide-in-from-bottom-4">
        
        {/* Promotion Modal Overlay */}
        <AnimatePresence>
          {promotingUserId && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setPromotingUserId(null)}
                className="fixed inset-0 bg-black/80 backdrop-blur-md z-[2000] flex items-center justify-center p-6"
              >
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-md glass-panel rounded-[2.5rem] p-8 border border-primary/20 shadow-[0_32px_64px_-16px_rgba(16,185,129,0.3)]"
                >
                  <div className="flex flex-col items-center text-center gap-6">
                    <div className="p-4 rounded-3xl bg-primary/10 border border-primary/20">
                       <ShieldCheck className="w-12 h-12 text-primary" />
                    </div>
                    <div>
                       <h2 className="text-2xl font-black text-white uppercase tracking-tight">Assign Jurisdiction</h2>
                       <p className="text-slate-400 text-sm mt-2">Designate the operational sector for this officer.</p>
                    </div>

                    <div className="w-full space-y-4">
                       <div className="relative group">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                          <input 
                            type="text"
                            placeholder="e.g. Koramangala"
                            value={promoArea}
                            onChange={(e) => setPromoArea(e.target.value)}
                            onKeyDown={(e) => {
                               if (e.key === 'Enter' && promoArea.trim()) {
                                  roleMutation.mutate({ userId: promotingUserId, role: 'OFFICER', area: promoArea.trim() });
                               }
                            }}
                            autoFocus
                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-11 pr-4 py-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 transition-all font-bold"
                          />
                       </div>

                       <button 
                          onClick={() => {
                             if (promoArea.trim()) {
                                roleMutation.mutate({ userId: promotingUserId, role: 'OFFICER', area: promoArea.trim() });
                             } else {
                                toast.error("Jurisdiction required");
                             }
                          }}
                          disabled={roleMutation.isPending}
                          className="w-full py-4 bg-primary hover:bg-emerald-400 text-black font-black uppercase tracking-[0.2em] text-xs rounded-2xl transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
                       >
                          {roleMutation.isPending ? "Syncing..." : "Confirm Elevation"}
                       </button>
                       
                       <button 
                          onClick={() => setPromotingUserId(null)}
                          className="w-full py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors"
                       >
                          Cancel Protocol
                       </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-5xl font-heading font-black text-white tracking-tight uppercase">Manage</h1>
          </div>

          <div className="flex items-center gap-3">
             <div className="bg-black border border-white/5 rounded-2xl px-6 py-3 shadow-xl">
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5 text-center">Active Force</span>
                <span className="block text-2xl font-black text-white text-center leading-none">{users?.length || 0}</span>
             </div>
             <div className="bg-black border border-white/5 rounded-2xl px-6 py-3 shadow-xl">
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5 text-center">Officers</span>
                <span className="block text-2xl font-black text-primary text-center leading-none">{users?.filter(u => u.role !== 'CITIZEN').length || 0}</span>
             </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-primary transition-colors" />
            <input 
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 transition-all shadow-inner"
            />
          </div>
          <div className="flex items-center gap-2 bg-black/50 border border-white/10 rounded-2xl px-4 p-1">
             <Filter className="w-4 h-4 text-slate-500" />
             {["ALL", "CITIZEN", "OFFICER", "PRESIDENT"].map((role) => (
               <button
                 key={role}
                 onClick={() => setRoleFilter(role)}
                 className={cn(
                   "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                   roleFilter === role ? "bg-primary text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                 )}
               >
                 {role}
               </button>
             ))}
          </div>
        </div>

        {/* User Table */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02] text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <th className="px-8 py-5">Personnel</th>
                  <th className="px-8 py-5">Jurisdiction</th>
                  <th className="px-8 py-5">Performance</th>
                  <th className="px-8 py-5 text-right">Actions</th>
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
                      className="group hover:bg-white/[0.02] transition-all"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 via-black to-black border border-white/5 flex items-center justify-center font-bold text-white shadow-xl">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-bold text-white text-base leading-tight">{u.name}</h3>
                            <div className="flex items-center gap-1.5 text-slate-500 font-medium text-xs mt-1">
                               <Mail className="w-3 h-3" /> {u.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="space-y-2">
                           <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                              <MapPin className="w-3.5 h-3.5 text-primary" /> {u.area || u.city}
                           </div>
                           <div className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-wider", 
                             u.role === 'PRESIDENT' ? "text-yellow-500 bg-yellow-500/10 border-yellow-500/20" :
                             u.role === 'OFFICER' ? "text-primary bg-primary/10 border-primary/20" :
                             "text-slate-400 bg-slate-400/10 border-slate-400/20"
                           )}>
                              {u.role === 'PRESIDENT' ? <ShieldCheck className="w-3 h-3" /> : u.role === 'OFFICER' ? <ShieldCheck className="w-3 h-3" /> : <User className="w-3 h-3" />}
                              {u.role}
                           </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-6">
                           <div className="text-center">
                              <span className="block text-white font-black text-lg leading-none">{u._count?.issues || 0}</span>
                              <span className="text-[9px] font-bold text-slate-500 uppercase">Reports</span>
                           </div>
                           <div className="text-center">
                              <span className="block text-emerald-400 font-black text-lg leading-none">{u.resolvedCount || 0}</span>
                              <span className="text-[9px] font-bold text-slate-500 uppercase">Clearance</span>
                           </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                         <div className="flex items-center justify-end gap-2">
                            {u.role === 'CITIZEN' ? (
                               <button 
                                 onClick={() => setPromotingUserId(u.id)}
                                 disabled={roleMutation.isPending}
                                 className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/20 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                               >
                                  <ArrowUpCircle className="w-4 h-4" /> Elevate to Officer
                               </button>
                            ) : u.role === 'OFFICER' ? (
                               <button 
                                 onClick={() => roleMutation.mutate({ userId: u.id, role: 'CITIZEN' })}
                                 disabled={roleMutation.isPending}
                                 className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                               >
                                  <ArrowDownCircle className="w-4 h-4" /> Demote to Citizen
                               </button>
                            ) : (
                               <div className="px-4 py-2 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest leading-none">
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
        </div>

      </div>
    </Layout>
  );
}
