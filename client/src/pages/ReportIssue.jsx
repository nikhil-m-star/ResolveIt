import { useState, useCallback, useEffect } from "react";
import { Layout } from "../components/layout/Layout";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import { api } from "../lib/auth";
import toast from "react-hot-toast";
import { ArrowRight, ArrowLeft, Bot, UploadCloud, MapPin, AlertCircle, Loader2, CheckCircle2, ShieldAlert, LocateFixed } from "lucide-react";
import { cn } from "../utils/helpers";
import { motion, AnimatePresence } from "framer-motion";
import { AreaSelector } from "../components/ui/AreaSelector";

function LocationPicker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return position ? <Marker position={position} /> : null;
}

function MapCenterSync({ position }) {
  const map = useMap();
  useEffect(() => {
    if (Array.isArray(position) && position.length === 2) {
      map.flyTo(position, map.getZoom(), { animate: true, duration: 1 });
    }
  }, [map, position]);
  return null;
}

export function ReportIssue() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreviews, setImagePreviews] = useState([]);
  
  // AI States
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    images: [],
    city: "Bengaluru",
    area: "",
    latitude: 12.9716,
    longitude: 77.5946,
    isAnonymous: false,
  });

  const updateForm = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));

  const onDrop = useCallback((acceptedFiles) => {
    if (formData.images.length + acceptedFiles.length > 3) {
      toast.error("You can only upload up to 3 images");
      return;
    }
    setFormData(prev => ({ ...prev, images: [...prev.images, ...acceptedFiles] }));
  }, [formData.images]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 3,
  });

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  useEffect(() => {
    const previews = formData.images.map((file) => URL.createObjectURL(file));
    setImagePreviews(previews);

    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [formData.images]);

  const handleBlurAIAnalyzers = async () => {
    if (!formData.title || !formData.description || formData.title.length < 5) return;

    setIsCategorizing(true);
    setDuplicateWarning(null);

    try {
      // Run both AI calls concurrently safely
      const [catRes, dupRes] = await Promise.allSettled([
        api.post("/issues/auto-categorize", { title: formData.title, description: formData.description }),
        api.post("/issues/check-duplicate", { 
           title: formData.title, 
           description: formData.description, 
           city: formData.city, 
           area: formData.area || "General" 
        })
      ]);

      if (catRes.status === "fulfilled" && catRes.value.data.category) {
        updateForm("category", catRes.value.data.category);
        toast.success(<span>AI Suggested Category: <b>{catRes.value.data.category}</b></span>, { icon: <Bot className="w-4 h-4 text-primary" /> });
      }

      if (dupRes.status === "fulfilled" && dupRes.value.data.isDuplicate) {
        setDuplicateWarning(dupRes.value.data);
      }
    } catch (err) {
      console.error("AI Analysis failed silently", err);
    } finally {
      setIsCategorizing(false);
    }
  };

  const [isLocatingGPS, setIsLocatingGPS] = useState(false);

  const handleUseCurrentLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsLocatingGPS(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        updateForm("latitude", latitude);
        updateForm("longitude", longitude);
        
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || "Bengaluru";
          const area = data.address?.suburb || data.address?.neighbourhood || data.address?.road || "";
          updateForm("city", city);
          updateForm("area", area);
          toast.success("Location Synced!", { icon: "📍" });
        } catch (err) {
          console.error("Reverse geocode failed", err);
        } finally {
          setIsLocatingGPS(false);
        }
      },
      () => {
        toast.error("Failed to get location. Please pin manually.");
        setIsLocatingGPS(false);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, []);

  // Auto-detect on step 3 entry or first mount
  useEffect(() => {
    if (step === 3 && formData.latitude === 12.9716 && formData.longitude === 77.5946) {
      handleUseCurrentLocation();
    }
  }, [step, handleUseCurrentLocation, formData.latitude, formData.longitude]);

  const handleSubmit = async () => {
    if (!formData.category) return toast.error("Please select a category");
    if (!formData.area) return toast.error("Please provide an area or neighborhood name");

    setIsSubmitting(true);
    const payload = new FormData();
    payload.append("title", formData.title);
    payload.append("description", formData.description);
    payload.append("category", formData.category);
    payload.append("city", formData.city);
    payload.append("area", formData.area);
    payload.append("latitude", formData.latitude);
    payload.append("longitude", formData.longitude);
    payload.append("isAnonymous", formData.isAnonymous);
    
    formData.images.forEach(file => {
      payload.append("images", file);
    });

    try {
      toast.loading("Uploading securely & Analyzing Intensity via AI...", { id: "submit" });
      const { data } = await api.post("/issues", payload, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success("Issue Reported Successfully!", { id: "submit" });
      navigate(`/issues/${data.id}`);
    } catch (error) {
      console.error("Submission error", error);
      toast.error("Failed to report issue", { id: "submit" });
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-12 animate-in fade-in duration-700">
        
        {/* Header Section */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
             <Bot className="w-3.5 h-3.5" /> AI Assisted
          </div>
          <h1 className="text-hero-md font-heading font-black text-white tracking-tighter uppercase">Report an Issue</h1>
          <p className="text-slate-400 font-medium">Your help makes the city better. Our AI will help you fill in the details.</p>
        </div>

        {/* Progress Tracker */}
        <div className="max-w-xl mx-auto relative px-8">
           <div className="absolute left-0 top-1/2 w-full h-[2px] bg-white/5 -translate-y-1/2" />
           <div 
             className="absolute left-0 top-1/2 h-[2px] bg-primary transition-all duration-700 -translate-y-1/2" 
             style={{ width: `${((step - 1) / 2) * 100}%` }}
           />
           <div className="flex justify-between relative">
              {[1, 2, 3].map((num) => (
                <div 
                  key={num} 
                  className={cn(
                    "w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm transition-all duration-500 border-2",
                    step > num ? "bg-primary border-primary text-white shadow-lg" : 
                    step === num ? "bg-black border-primary text-primary shadow-2xl scale-110" : 
                    "bg-black border-white/5 text-slate-600"
                  )}
                >
                  {step > num ? <CheckCircle2 className="w-5 h-5" /> : num}
                </div>
              ))}
           </div>
        </div>

        {duplicateWarning && (
           <div className="p-6 bg-black border border-white/5 rounded-4xl flex items-start gap-4 animate-in zoom-in duration-300">
              <div className="p-2 bg-black rounded-xl">
                 <AlertCircle className="w-6 h-6 text-primary" />
              </div>
              <div>
                 <h4 className="font-bold text-white flex items-center gap-2 uppercase tracking-widest text-sm">Similar report found <Bot className="w-4 h-4 opacity-50" /></h4>
                 <p className="text-xs mt-1 text-slate-400 leading-relaxed font-medium">{duplicateWarning.reasoning}</p>
              </div>
           </div>
        )}

        {/* Management Interface (Wizard Steps) */}
        <div className="glass-card overflow-hidden border-white/5 bg-black/40 p-10 backdrop-blur-3xl shadow-2xl rounded-6xl">
          
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="space-y-2">
                <h2 className="text-lg font-black text-white uppercase tracking-widest">Step 01</h2>
                <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Issue Details</p>
              </div>
              
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Title</label>
                <input 
                  type="text" 
                  value={formData.title}
                  onChange={(e) => updateForm("title", e.target.value)}
                  placeholder="Summarize the issue..."
                  className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-slate-700 focus:outline-none focus:border-primary/50 transition-all shadow-inner font-medium"
                />
              </div>

              <div className="space-y-3 relative group">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Describe the issue</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => updateForm("description", e.target.value)}
                  onBlur={handleBlurAIAnalyzers}
                  placeholder="Tell us what happened. Our AI will help analyze the details..."
                  rows={6}
                  className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-slate-700 focus:outline-none focus:border-primary/50 transition-all font-medium resize-none shadow-inner"
                />
                <AnimatePresence>
                  {isCategorizing && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-4 bottom-4 flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-xl border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest"
                    >
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Analyzing...
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <h2 className="text-lg font-black text-white uppercase tracking-widest">Step 02</h2>
                  <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Category & Photos</p>
                </div>
                {formData.category && (
                  <div className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-2xl text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2 shadow-lg">
                    <Bot className="w-3.5 h-3.5" /> AI Recommended
                  </div>
                )}
              </div>
              
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Category</label>
                <div className="relative">
                  <select 
                    value={formData.category}
                    onChange={(e) => updateForm("category", e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-primary/50 transition-all appearance-none font-medium shadow-inner"
                  >
                    <option value="" disabled>Select category...</option>
                    <option value="POTHOLE">Potholes & Road Damage</option>
                    <option value="GARBAGE">Sanitation & Waste</option>
                    <option value="WATER_LEAK">Water Infrastructure</option>
                    <option value="POWER_CUT">Power Outages</option>
                    <option value="STREETLIGHT">Streetlights</option>
                    <option value="SEWAGE">Drainage & Sewage</option>
                    <option value="TREE_FALLEN">Fallen Trees</option>
                    <option value="BRIBERY">Bribery</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              {formData.category === "BRIBERY" && (
                 <motion.div 
                   initial={{ scale: 0.95, opacity: 0 }}
                   animate={{ scale: 1, opacity: 1 }}
                   className="p-6 bg-black border border-white/5 rounded-4xl flex items-start gap-4"
                 >
                   <div className="p-2 bg-black rounded-xl border border-white/10">
                      <ShieldAlert className="w-6 h-6 text-white" />
                   </div>
                   <div className="flex-1">
                     <p className="text-xs text-white font-black uppercase tracking-widest mb-3">Anonymous mode enabled</p>
                     <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                          <input 
                             type="checkbox" 
                             checked={formData.isAnonymous}
                             onChange={(e) => updateForm("isAnonymous", e.target.checked)}
                             className="sr-only p-4"
                          />
                          <div className={cn("w-6 h-6 rounded-lg border flex items-center justify-center transition-all", formData.isAnonymous ? "bg-primary border-primary" : "bg-black border-white/10 group:hover:border-primary/50")}>
                             {formData.isAnonymous && <CheckCircle2 className="w-4 h-4 text-white" />}
                          </div>
                        </div>
                        <span className="text-sm text-slate-400 font-medium group:hover:text-white transition-colors">Mask Identity for this submission</span>
                     </label>
                   </div>
                 </motion.div>
              )}

              <div className="space-y-4">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Photos</label>
                <div 
                   {...getRootProps()} 
                   className={cn(
                     "border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all",
                     isDragActive ? "border-primary bg-primary/10 shadow-2xl" : "border-white/5 bg-black/30 hover:border-primary/30 hover:bg-black/50 shadow-inner",
                     formData.images.length >= 3 && "opacity-30 pointer-events-none"
                   )}
                >
                   <input {...getInputProps()} />
                   <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/5 shadow-xl">
                     <UploadCloud className="w-8 h-8 text-primary" />
                   </div>
                   <p className="text-sm text-white font-bold mb-1">Upload Photos</p>
                   <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Max 3 (JPEG, PNG, WEBP)</p>
                </div>

                <AnimatePresence>
                  {formData.images.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="flex gap-4 mt-6 overflow-x-auto pb-4 px-2"
                    >
                      {formData.images.map((file, idx) => (
                        <div key={idx} className="relative group flex-shrink-0 animate-in zoom-in-75">
                          <div className="w-28 h-28 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                             <img src={imagePreviews[idx]} alt="Evidence" className="w-full h-full object-cover" />
                          </div>
                          <button 
                            onClick={() => removeImage(idx)}
                            className="absolute -top-2 -right-2 w-7 h-7 bg-black text-white rounded-xl flex items-center justify-center shadow-xl opacity-0 hover:opacity-100 transition-opacity border border-white/10"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="space-y-2">
                <h2 className="text-lg font-black text-white uppercase tracking-widest">Step 03</h2>
                <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Location</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-3">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">City</label>
                    <input 
                      type="text" 
                      value={formData.city} readOnly disabled
                      className="w-full bg-black border border-white/5 rounded-2xl px-6 py-4 text-slate-600 font-bold shadow-inner"
                    />
                 </div>
                 <div className="space-y-3">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Area / Neighborhood</label>
                    <AreaSelector 
                      value={formData.area} 
                      onChange={(val) => updateForm("area", val)}
                      onSelect={(area) => {
                        updateForm("area", area.name);
                        updateForm("city", area.city || "Bengaluru");
                        updateForm("latitude", area.lat);
                        updateForm("longitude", area.lng);
                      }}
                      placeholder="Select Operational Sector..."
                    />
                 </div>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                     <MapPin className="w-3.5 h-3.5 text-primary"/> Pick location on map
                  </label>
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={isLocatingGPS}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary/10 border border-primary/20 text-[10px] font-black uppercase text-primary tracking-widest transition-all hover:bg-primary hover:text-white disabled:opacity-50"
                  >
                    {isLocatingGPS ? <Loader2 className="w-3 h-3 animate-spin" /> : <LocateFixed className="w-3.5 h-3.5" />}
                    Find my location
                  </button>
                </div>
                <div className="w-full h-80 rounded-5xl overflow-hidden border border-white/10 relative z-0 shadow-2xl">
                  <MapContainer 
                    center={[formData.latitude, formData.longitude]} 
                    zoom={15} 
                    className="w-full h-full"
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LocationPicker 
                       position={[formData.latitude, formData.longitude]} 
                       setPosition={(coords) => {
                          updateForm("latitude", coords[0]);
                          updateForm("longitude", coords[1]);
                       }} 
                    />
                    <MapCenterSync position={[formData.latitude, formData.longitude]} />
                  </MapContainer>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Bar */}
          <div className="flex items-center justify-between mt-12 pt-8 border-t border-white/5">
            <button 
              onClick={() => setStep(s => Math.max(1, s - 1))}
              disabled={step === 1 || isSubmitting}
              className="px-6 py-3 text-slate-500 hover:text-white disabled:opacity-0 transition-all font-black uppercase text-[10px] tracking-widest flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            
            {step < 3 ? (
              <button 
                onClick={() => {
                   if (step === 1) handleBlurAIAnalyzers();
                   setStep(s => Math.min(3, s + 1));
                }}
                disabled={(step === 1 && (!formData.title || !formData.description))}
                className="flex items-center gap-2 bg-primary hover:brightness-110 disabled:opacity-50 text-white px-10 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-xl active:scale-95"
              >
                Next <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting || !formData.area}
                className="flex items-center gap-3 bg-primary hover:brightness-110 disabled:opacity-50 text-white px-12 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all hover:scale-105 shadow-xl active:scale-95"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                ) : (
                  <>Submit</>
                )}
              </button>
            )}
          </div>
          
        </div>
      </div>

    </Layout>
  );
}
