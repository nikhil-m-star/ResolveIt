import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/auth";
import { Layout } from "../components/layout/Layout";
import { Loader2, User as UserIcon, Medal, Star, CheckCircle2, ShieldAlert, Shield, MapPin, Edit3, Settings, Trophy, AlertTriangle, Target } from "lucide-react";
import { useUserCompat, UserButtonCompat } from "../lib/clerkCompat";
import { useState } from "react";
import { cn } from "../utils/helpers";
import toast from "react-hot-toast";

export function Profile() {
  const { user: clerkUser } = useUserCompat();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ city: "", area: "" });

  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await api.get("/users/me");
      if (res.data) {
        setFormData({ city: res.data.city || "", area: res.data.area || "" });
      }
      return res.data;
    },
  });

  const isOfficer = profile?.role === "OFFICER" || profile?.role === "PRESIDENT";

  const updateMutation = useMutation({
    mutationFn: (data) => api.patch("/users/me", data),
    onSuccess: () => {
      queryClient.invalidateQueries(["profile"]);
      setIsEditing(false);
      toast.success("Profile updated successfully");
    },
    onError: () => toast.error("Failed to update profile"),
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

  if (isError || !profile) {
    return (
      <Layout>
        <div className="p-8 text-center text-red-500">Failed to load profile data.</div>
      </Layout>
    );
  }

  const handleUpdate = (e) => {
      e.preventDefault();
      updateMutation.mutate(formData);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "RESOLVED": return "bg-emerald-500";
      case "IN_PROGRESS": return "bg-primary";
      case "REJECTED": return "bg-red-500";
      default: return "bg-slate-500";
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-12 animate-in fade-in duration-700">
        
        {/* Profile Card */}
        <div className="glass-card p-10 md:p-14 mb-12 flex flex-col md:flex-row items-center gap-12 border-l-[8px] border-primary bg-black/60 relative overflow-hidden group shadow-[0_0_50px_-12px_rgba(16,185,129,0.2)]">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
             <Fingerprint className="w-48 h-48 text-primary" />
          </div>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          
          <div className="relative">
            <div className="w-40 h-40 rounded-3xl bg-black border-2 border-primary/40 flex items-center justify-center overflow-hidden shadow-2xl relative">
               <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/10 to-transparent h-1/2 w-full animate-scan" style={{ animationDuration: '4s' }} />
               {clerkUser?.imageUrl ? (
                 <img src={clerkUser.imageUrl} alt={profile.name} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" />
               ) : (
                 <UserIcon className="w-16 h-16 text-primary/30" />
               )}
            </div>
            <div className="absolute -bottom-3 -right-3 px-3 py-1.5 bg-primary text-black text-[9px] font-black uppercase tracking-widest rounded-lg shadow-xl border border-primary/50">
               VERIFIED
            </div>
          </div>

          <div className="flex-1 text-center md:text-left space-y-6 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center justify-center md:justify-start gap-3 text-slate-500">
                <Terminal className="w-3.5 h-3.5" />
                <span className="text-[9px] font-black uppercase tracking-[0.4em]">User Details</span>
              </div>
              <h1 className="text-5xl font-heading font-black text-white tracking-tighter uppercase leading-none">{profile.name}</h1>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
               <div className="px-5 py-2 bg-primary/10 border border-primary/30 text-primary rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg">
                  ROLE: {profile.role}
               </div>
               <div className="px-5 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
                  LEVEL: 0{profile.role === 'PRESIDENT' ? 4 : profile.role === 'OFFICER' ? 3 : 1}
               </div>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-6 pt-2">
               <div className="flex items-center gap-2 text-slate-500 group-hover:text-primary transition-colors">
                  <MapPin className="w-4 h-4" /> 
                  <span className="text-[10px] font-black uppercase tracking-widest">
                     {profile.city && profile.area ? `${profile.area} // ${profile.city}` : "LOCATION_NOT_SET"}
                  </span>
               </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 z-10 w-full md:w-auto">
             <div className="flex items-center justify-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                <UserButtonCompat appearance={{ elements: { userButtonAvatarBox: "h-10 w-10 rounded-xl border-2 border-primary/20 shadow-2xl" } }} />
                <div className="text-right hidden sm:block">
                   <p className="text-[9px] font-black text-white uppercase tracking-widest">Account Status</p>
                   <p className="text-[8px] font-bold text-slate-500 uppercase">ACTIVE</p>
                </div>
             </div>
            <button 
               onClick={() => setIsEditing(!isEditing)}
               className={cn(
                 "w-full px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 border shadow-xl",
                 isEditing ? "bg-primary text-black border-primary" : "bg-white/5 hover:bg-white/10 border-white/10 text-white"
               )}
            >
              {isEditing ? <Settings className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
              {isEditing ? "CANCEL" : "EDIT PROFILE"}
            </button>
          </div>
        </div>

        {/* Dynamic Edit Form */}
        {isEditing && (
          <form onSubmit={handleUpdate} className="glass-card p-6 border-primary/20 space-y-4 animate-in fade-in slide-in-from-top-4">
            <h3 className="text-lg font-medium text-white mb-4">Edit Location Preferences</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">City</label>
                <input 
                  type="text" 
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  placeholder="e.g., San Francisco"
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Area / District</label>
                <input 
                  type="text" 
                  value={formData.area}
                  onChange={(e) => setFormData({...formData, area: e.target.value})}
                  placeholder="e.g., Downtown"
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <button 
                type="submit" 
                disabled={updateMutation.isPending}
                className="px-6 py-2.5 bg-primary hover:brightness-110 text-white rounded-lg font-medium transition-all shadow-lg disabled:opacity-50"
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Stats Containers */}
          <div className="space-y-8 md:col-span-1">
             <div className="glass-card bg-black/40 border border-white/5 p-8 flex flex-col gap-8">
                <div className="flex items-center justify-between">
                   <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
                      <Activity className="w-4 h-4 text-primary" /> My Impact
                   </h3>
                </div>
                
                <div className="space-y-4">
                   {[
                     { label: "ISSUES_REPORTED", value: profile._count?.issues || 0, icon: AlertTriangle, color: "text-primary", bg: "bg-primary/5", border: "border-primary/20" },
                     { label: "ISSUES_RESOLVED", value: profile._count?.resolvedIssues || 0, icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/5", border: "border-emerald-500/20" },
                     { label: "VOTES_GIVEN", value: profile._count?.votes || 0, icon: Medal, color: "text-blue-400", bg: "bg-blue-500/5", border: "border-blue-500/20" }
                   ].map((stat, i) => (
                     <div key={i} className={cn("p-4 border rounded-2xl flex items-center justify-between group/stat transition-all hover:bg-white/5", stat.bg, stat.border)}>
                        <div className="flex items-center gap-4">
                           <div className={cn("p-2 rounded-xl transition-transform group-hover/stat:scale-110", stat.bg, stat.color)}>
                              <stat.icon className="w-5 h-5" />
                           </div>
                           <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</span>
                        </div>
                        <span className="text-2xl font-heading font-black text-white">{stat.value}</span>
                     </div>
                   ))}
                </div>
             </div>

             {/* Deployment Authorization */}
             {!isOfficer && (
               <div className="glass-card p-8 bg-black/60 border-primary/20 relative overflow-hidden group shadow-2xl">
                 <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <ShieldAlert className="w-32 h-32 text-primary" />
                 </div>
                 <div className="relative z-10 space-y-6">
                   <div>
                      <h3 className="text-lg font-black text-primary uppercase tracking-tight flex items-center gap-3">
                        <ShieldAlert className="w-6 h-6" /> Role Level
                      </h3>
                      <div className="w-12 h-1 bg-primary mt-2 opacity-30" />
                   </div>
                   <p className="text-xs text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                     Your role is assigned by the administration. Contact support if you need access level changes.
                   </p>
                   <div className="w-full py-4 bg-white/5 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-3 border border-white/10 shadow-inner">
                      Citizen
                   </div>
                 </div>
               </div>
             )}
          </div>

          {/* Reports Ledger Container */}
          <div className="md:col-span-2 glass-card bg-black/40 border border-white/5 p-8 flex flex-col min-h-600 overflow-hidden relative group/ledger">
             <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-3xl opacity-0 group-hover/ledger:opacity-100 transition-opacity" />
             
             <div className="flex items-center justify-between mb-10 relative z-10">
                <div className="space-y-1">
                   <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-4">
                      <Target className="w-6 h-6 text-primary" /> My Reports
                   </h3>
                   <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-10">Issues you have reported</span>
                </div>
                <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-primary uppercase tracking-widest">
                   {profile.issues?.length || 0} Open Cases
                </div>
             </div>

             <div className="flex-1 space-y-5 relative z-10 scrollbar-hide overflow-y-auto">
                {profile.issues?.length > 0 ? (
                   <div className="grid gap-4">
                      {profile.issues.map((issue, idx) => (
                         <div key={issue.id} className="flex flex-col sm:flex-row items-center justify-between p-6 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/[0.08] hover:border-primary/30 transition-all group overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-4 text-[40px] font-black text-white opacity-[0.02] group-hover:opacity-[0.05] pointer-events-none select-none">
                               0{idx + 1}
                            </div>
                            <div className="flex items-center gap-6 w-full sm:w-auto mb-4 sm:mb-0">
                               <div className={cn(
                                 "w-12 h-12 rounded-xl flex items-center justify-center border transition-all shadow-2xl",
                                 issue.status === 'RESOLVED' ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" : "bg-primary/10 border-primary/30 text-primary"
                               )}>
                                  {issue.status === 'RESOLVED' ? <CheckCircle2 className="w-6 h-6" /> : <Activity className="w-6 h-6" />}
                               </div>
                               <div className="space-y-1">
                                  <h4 className="text-lg font-black text-white hover:text-primary transition-colors uppercase tracking-tight truncate max-w-[200px] sm:max-w-md">{issue.title}</h4>
                                  <div className="flex items-center gap-4">
                                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{issue.area || issue.city}</span>
                                     <div className="w-1 h-1 rounded-full bg-white/10" />
                                     <span className={cn("text-[9px] font-black uppercase tracking-widest", issue.status === 'RESOLVED' ? "text-emerald-500" : "text-primary")}>{issue.status}</span>
                                  </div>
                               </div>
                            </div>
                            <Link 
                               to={`/issues/${issue.id}`}
                               className="w-full sm:w-auto px-8 py-3 bg-black/40 text-[10px] font-black uppercase tracking-[0.2em] text-white rounded-xl hover:bg-primary hover:text-black transition-all border border-white/10 shadow-lg flex items-center justify-center gap-3 group/btn"
                            >
                               View Details <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                            </Link>
                         </div>
                      ))}
                   </div>
                ) : (
                   <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-8 border-2 border-dashed border-white/5 rounded-[3rem] bg-black/20">
                      <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center shadow-2xl relative">
                         <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl animate-pulse" />
                         <Star className="w-10 h-10 text-slate-600 relative z-10" />
                      </div>
                      <div className="space-y-4">
                         <h4 className="text-2xl font-black text-white uppercase tracking-tight">No reports found</h4>
                         <p className="text-xs text-slate-500 font-bold uppercase tracking-widest max-w-xs mx-auto leading-relaxed">You haven't reported any issues yet. Your reports will appear here once you start.</p>
                      </div>
                      <Link to="/report" className="px-10 py-4 bg-primary text-black text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all">
                         Report an Issue
                      </Link>
                   </div>
                )}
             </div>
          </div>
        </div>

      </div>
    </Layout>

  );
}
