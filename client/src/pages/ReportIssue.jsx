import { useState, useCallback, useRef } from "react";
import { Layout } from "../components/layout/Layout";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { api } from "../lib/auth";
import toast from "react-hot-toast";
import { ArrowRight, ArrowLeft, Bot, UploadCloud, MapPin, AlertCircle, Loader2, CheckCircle2, ShieldAlert } from "lucide-react";
import { cn } from "../utils/helpers";

function LocationPicker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return position ? <Marker position={position} /> : null;
}

export function ReportIssue() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
      <div className="max-w-3xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-white mb-2">Report an Issue</h1>
          <p className="text-gray-400">Help us improve the civic infrastructure. AI will assist you along the way.</p>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-8 relative">
           <div className="absolute left-0 top-1/2 w-full h-0.5 bg-white/10 -z-10" />
           {[1, 2, 3].map((num) => (
             <div 
               key={num} 
               className={cn(
                 "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors border-4 border-background",
                 step >= num ? "bg-primary text-white" : "bg-white/10 text-gray-500"
               )}
             >
               {step > num ? <CheckCircle2 className="w-5 h-5" /> : num}
             </div>
           ))}
        </div>

        {duplicateWarning && (
           <div className="mb-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-start gap-3 text-orange-200">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                 <h4 className="font-bold flex items-center gap-2">Possible Duplicate Detected <Bot className="w-4 h-4 opacity-50" /></h4>
                 <p className="text-sm mt-1 opacity-90">{duplicateWarning.reasoning}</p>
              </div>
           </div>
        )}

        {/* Wizard Steps */}
        <div className="glass-card p-6 sm:p-8">
          
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-heading font-semibold">1. Describe the Problem</h2>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Issue Title</label>
                <input 
                  type="text" 
                  value={formData.title}
                  onChange={(e) => updateForm("title", e.target.value)}
                  placeholder="e.g. Huge Pothole near Central Mall"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>

              <div className="space-y-2 relative">
                <label className="text-sm font-medium text-gray-300">Description</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => updateForm("description", e.target.value)}
                  onBlur={handleBlurAIAnalyzers}
                  placeholder="Provide details. AI will automatically analyze this when you're done typing to suggest a category and check for duplicates..."
                  rows={5}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/50 transition-colors resize-none"
                />
                {isCategorizing && (
                   <div className="absolute right-3 bottom-3 flex items-center gap-2 text-primary/70 text-xs font-medium">
                     <Loader2 className="w-3.5 h-3.5 animate-spin" />
                     AI Analyzing...
                   </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-heading font-semibold flex items-center justify-between">
                2. Category & Evidence
                {formData.category && <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-md border border-primary/30 flex items-center gap-1"><Bot className="w-3 h-3"/> AI Categorized</span>}
              </h2>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Category Selection</label>
                <select 
                  value={formData.category}
                  onChange={(e) => updateForm("category", e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors appearance-none"
                >
                  <option value="" disabled>Select a category...</option>
                  <option value="POTHOLE">Pothole</option>
                  <option value="GARBAGE">Garbage & Waste</option>
                  <option value="WATER_LEAK">Water Leakage</option>
                  <option value="POWER_CUT">Power Cut</option>
                  <option value="STREETLIGHT">Broken Streetlight</option>
                  <option value="SEWAGE">Sewage Issue</option>
                  <option value="TREE_FALLEN">Fallen Tree</option>
                  <option value="BRIBERY">Bribery / Corruption</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              {formData.category === "BRIBERY" && (
                 <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                   <ShieldAlert className="w-5 h-5 text-red-500 flex-shrink-0" />
                   <div>
                     <p className="text-sm text-red-200 font-medium mb-2">Bribery/Corruption reports can be submitted anonymously.</p>
                     <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                           type="checkbox" 
                           checked={formData.isAnonymous}
                           onChange={(e) => updateForm("isAnonymous", e.target.checked)}
                           className="w-4 h-4 rounded border-white/20 bg-black text-red-500 focus:ring-red-500 focus:ring-offset-gray-900"
                        />
                        <span className="text-sm text-white">Hide my identity from this report</span>
                     </label>
                   </div>
                 </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Evidence Images (Up to 3)</label>
                <div 
                  {...getRootProps()} 
                  className={cn(
                    "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
                    isDragActive ? "border-primary bg-primary/5" : "border-white/10 hover:border-white/20 hover:bg-white/5",
                    formData.images.length >= 3 && "opacity-50 pointer-events-none"
                  )}
                >
                  <input {...getInputProps()} />
                  <UploadCloud className="w-10 h-10 mx-auto text-gray-400 mb-3" />
                  <p className="text-sm text-gray-300">Drag & drop images here, or click to select files</p>
                  <p className="text-xs text-gray-500 mt-1">JPEG, PNG, WEBP only. Max 3 files.</p>
                </div>

                {formData.images.length > 0 && (
                  <div className="flex gap-4 mt-4 overflow-x-auto pb-2">
                    {formData.images.map((file, idx) => (
                      <div key={idx} className="relative group flex-shrink-0">
                        <img 
                          src={URL.createObjectURL(file)} 
                          alt={`Upload preview ${idx}`} 
                          className="w-24 h-24 object-cover rounded-lg border border-white/10"
                        />
                        <button 
                          onClick={() => removeImage(idx)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full text-white text-xs font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-heading font-semibold">3. Pin the Location</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">City</label>
                    <input 
                      type="text" 
                      value={formData.city} readOnly disabled
                      className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-2.5 text-gray-500 cursor-not-allowed"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Area / Neighborhood</label>
                    <input 
                      type="text" 
                      value={formData.area} 
                      onChange={(e) => updateForm("area", e.target.value)}
                      placeholder="e.g. Indiranagar"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-primary/50 transition-colors"
                    />
                 </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                   <MapPin className="w-4 h-4"/> Click on the map to pin exact location
                </label>
                <div className="w-full h-64 rounded-xl overflow-hidden border border-white/10 relative z-0">
                  <MapContainer 
                    center={[formData.latitude, formData.longitude]} 
                    zoom={13} 
                    className="w-full h-full"
                  >
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                    <LocationPicker 
                       position={[formData.latitude, formData.longitude]} 
                       setPosition={(coords) => {
                          updateForm("latitude", coords[0]);
                          updateForm("longitude", coords[1]);
                       }} 
                    />
                  </MapContainer>
                </div>
              </div>

            </div>
          )}

          {/* Wizard Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10">
            <button 
              onClick={() => setStep(s => Math.max(1, s - 1))}
              disabled={step === 1 || isSubmitting}
              className="flex items-center gap-2 text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400 transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            
            {step < 3 ? (
              <button 
                onClick={() => setStep(s => Math.min(3, s + 1))}
                disabled={(step === 1 && (!formData.title || !formData.description))}
                className="flex items-center gap-2 bg-primary hover:bg-blue-600 disabled:opacity-50 disabled:bg-primary text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-primary/20"
              >
                Next Step <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting || !formData.area}
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white px-8 py-2.5 rounded-xl font-medium transition-all hover:scale-105 shadow-lg shadow-emerald-500/20"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                ) : (
                  <>Submit Report</>
                )}
              </button>
            )}
          </div>
          
        </div>
      </div>
    </Layout>
  );
}
