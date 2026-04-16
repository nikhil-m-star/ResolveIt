import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/auth";
import { Layout } from "../components/layout/Layout";
import { Loader2, User as UserIcon, Medal, Star, CheckCircle2, ShieldAlert, Shield, MapPin, Edit3, Settings, Trophy, AlertTriangle } from "lucide-react";
import { useUserCompat } from "../lib/clerkCompat";
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

  const getTierColor = (tier) => {
    switch (tier) {
      case "PLATINUM": return "text-blue-300 bg-blue-500/10 border-blue-500/30";
      case "GOLD": return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
      case "SILVER": return "text-gray-300 bg-gray-500/10 border-gray-500/30";
      case "BRONZE": return "text-amber-600 bg-amber-700/10 border-amber-700/30";
      default: return "text-white bg-white/5 border-white/10";
    }
  };

  const isOfficer = profile.role === "OFFICER" || profile.role === "PRESIDENT";

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        
        {/* Header Block */}
        <div className="glass-card p-8 flex flex-col md:flex-row items-center md:items-start gap-8 text-center md:text-left relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
          {/* Decorative background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative">
            <div className="w-32 h-32 rounded-full border-4 border-white/10 overflow-hidden bg-white/5 flex items-center justify-center shadow-xl">
               {clerkUser?.imageUrl ? (
                 <img src={clerkUser.imageUrl} alt="Profile" className="w-full h-full object-cover" />
               ) : (
                 <UserIcon className="w-16 h-16 text-gray-500" />
               )}
            </div>
            {isOfficer && (
              <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white p-2 rounded-full border-2 border-background shadow-lg">
                <Shield className="w-5 h-5 fill-current" />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-3 z-10">
            <div>
              <h1 className="text-3xl font-heading font-bold text-white mb-2">{profile.name}</h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                 <span className={cn("px-3 py-1 rounded-lg text-sm font-bold uppercase tracking-wider border", getTierColor(profile.tier))}>
                    {profile.tier} TIER
                 </span>
                 <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-400 font-medium">
                    {profile.role}
                 </span>
                 <span className="flex items-center gap-1.5 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-lg text-sm font-bold">
                    <Star className="w-4 h-4 fill-current" /> {profile.points} PTS
                 </span>
              </div>
            </div>

            <p className="text-gray-400 text-sm flex items-center justify-center md:justify-start gap-2 pt-2">
              <MapPin className="w-4 h-4" /> 
              {profile.city && profile.area ? `${profile.area}, ${profile.city}` : "Location not set"}
            </p>
          </div>

          <button 
             onClick={() => setIsEditing(!isEditing)}
             className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 z-10"
          >
            {isEditing ? <Settings className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
            {isEditing ? "Cancel" : "Edit Profile"}
          </button>
        </div>

        {/* Dynamic Edit Form */}
        {isEditing && (
          <form onSubmit={handleUpdate} className="glass-card p-6 border-primary/20 space-y-4 animate-in fade-in slide-in-from-top-4">
            <h3 className="text-lg font-medium text-white mb-4">Edit Location Preferences</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">City</label>
                <input 
                  type="text" 
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  placeholder="e.g., San Francisco"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Area / District</label>
                <input 
                  type="text" 
                  value={formData.area}
                  onChange={(e) => setFormData({...formData, area: e.target.value})}
                  placeholder="e.g., Downtown"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <button 
                type="submit" 
                disabled={updateMutation.isPending}
                className="px-6 py-2.5 bg-primary hover:bg-blue-600 text-white rounded-lg font-medium transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Stats Container */}
          <div className="space-y-6 md:col-span-1">
             <div className="glass-card p-6 space-y-6">
                <h3 className="text-lg font-medium text-white">Impact Stats</h3>
                <div className="space-y-4">
                   <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg"><AlertTriangle className="w-5 h-5" /></div>
                         <span className="text-gray-300 text-sm">Issues Reported</span>
                      </div>
                      <span className="font-bold text-white font-heading text-lg">{profile._count?.issues || 0}</span>
                   </div>
                   <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg"><CheckCircle2 className="w-5 h-5" /></div>
                         <span className="text-gray-300 text-sm">Issues Resolved</span>
                      </div>
                      <span className="font-bold text-white font-heading text-lg">{profile._count?.resolvedIssues || 0}</span>
                   </div>
                   <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg"><Medal className="w-5 h-5" /></div>
                         <span className="text-gray-300 text-sm">Upvotes Given</span>
                      </div>
                      <span className="font-bold text-white font-heading text-lg">{profile._count?.votes || 0}</span>
                   </div>
                </div>
             </div>

             {/* Officer Upgrade Banner */}
             {!isOfficer && (
               <div className="glass-card p-6 bg-gradient-to-b from-blue-900/20 to-background border-blue-500/30 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-10"><ShieldAlert className="w-24 h-24 text-blue-400" /></div>
                 <h3 className="text-lg font-bold text-blue-400 flex items-center gap-2 mb-2">
                    <ShieldAlert className="w-5 h-5" /> Officer Role Access
                 </h3>
                 <p className="text-sm text-gray-400 mb-6 relative z-10 leading-relaxed">
                   Officer assignment is now restricted to President-level admin controls only. Contact the President for role elevation.
                 </p>
                 <div className="w-full py-3 bg-blue-600/40 text-white/90 font-bold rounded-xl relative z-10 flex items-center justify-center gap-2 border border-white/10">
                    President approval required
                 </div>
               </div>
             )}
          </div>

          {/* Activity Feed Container */}
          <div className="md:col-span-2 glass-card p-6 flex flex-col min-h-[400px]">
             <h3 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" /> Recent Activity
             </h3>
             {((profile._count?.issues === 0 || !profile._count?.issues) && (profile._count?.resolvedIssues === 0 || !profile._count?.resolvedIssues)) ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 py-8 border border-white/5 rounded-xl bg-black/20">
                   <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center">
                      <Star className="w-6 h-6 text-gray-500" />
                   </div>
                   <div>
                      <h4 className="text-white font-medium mb-1">Begin Your Civic Journey</h4>
                      <p className="text-sm text-gray-500 max-w-sm mx-auto">Start engaging with ResolveIt to earn activity and track your civic footprint!</p>
                   </div>
                </div>
             ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 py-12 border-2 border-dashed border-white/5 rounded-xl bg-black/20">
                   <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
                      <Star className="w-8 h-8 text-gray-500" />
                   </div>
                   <div>
                      <h4 className="text-white font-medium mb-1">Your civic footprint</h4>
                      <p className="text-sm text-gray-500 max-w-sm mx-auto">Activities, badges, and recent issue engagements will appear here as you interact with ResolveIt.</p>
                   </div>
                </div>
             )}
          </div>
        </div>

      </div>
    </Layout>
  );
}
