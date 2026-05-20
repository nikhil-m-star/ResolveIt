import { GoogleMap, useJsApiLoader, OverlayViewF, OverlayView } from "@react-google-maps/api";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState, useCallback } from "react";
import { ChevronRight } from "lucide-react";
import { cn, getCategoryColor } from "../../utils/helpers";

const STATUS_MARKER_STYLE = {
  REPORTED: { core: "#3b82f6", glow: "rgba(59,130,246,0.78)", ring: "rgba(59,130,246,0.30)" },
  IN_PROGRESS: { core: "#f59e0b", glow: "rgba(245,158,11,0.78)", ring: "rgba(245,158,11,0.30)" },
  RESOLVED: { core: "#22c55e", glow: "rgba(34,197,94,0.78)", ring: "rgba(34,197,94,0.30)" },
  REJECTED: { core: "#f43f5e", glow: "rgba(244,63,94,0.78)", ring: "rgba(244,63,94,0.30)" },
};

const getStatusDotColor = (status) => (STATUS_MARKER_STYLE[status] || STATUS_MARKER_STYLE.REPORTED).core;

export const getIntensityMarkerStyle = (intensity) => {
  const score = Number(intensity) || 5;
  if (score <= 3) {
    // Low (1-3) - Emerald Green
    return { core: "#10b981", glow: "rgba(16,185,129,0.85)", ring: "rgba(16,185,129,0.35)", label: "Low Severity", textClass: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" };
  } else if (score <= 5) {
    // Moderate (4-5) - Cyber Cyan
    return { core: "#06b6d4", glow: "rgba(6,182,212,0.85)", ring: "rgba(6,182,212,0.35)", label: "Moderate Severity", textClass: "text-cyan-400 border-cyan-500/20 bg-cyan-500/5" };
  } else if (score <= 7) {
    // High (6-7) - Tactical Amber
    return { core: "#f59e0b", glow: "rgba(245,158,11,0.85)", ring: "rgba(245,158,11,0.35)", label: "High Severity", textClass: "text-amber-400 border-amber-500/20 bg-amber-500/5" };
  } else if (score <= 9) {
    // Severe (8-9) - Warning Orange
    return { core: "#f97316", glow: "rgba(249,115,22,0.85)", ring: "rgba(249,115,22,0.35)", label: "Severe Threat", textClass: "text-orange-400 border-orange-500/20 bg-orange-500/5" };
  } else {
    // Critical (10) - Emergency Red
    return { core: "#ef4444", glow: "rgba(239,68,68,0.95)", ring: "rgba(239,68,68,0.40)", label: "Critical Emergency", textClass: "text-red-400 border-red-500/20 bg-red-500/5" };
  }
};

const isFiniteNumber = (value) => Number.isFinite(Number(value));
const isValidIssueCoordinate = (issue) =>
  issue &&
  isFiniteNumber(issue.latitude) &&
  isFiniteNumber(issue.longitude) &&
  Math.abs(Number(issue.latitude)) <= 90 &&
  Math.abs(Number(issue.longitude)) <= 180;
const isValidLatLng = (coords) =>
  Array.isArray(coords) &&
  coords.length === 2 &&
  isFiniteNumber(coords[0]) &&
  isFiniteNumber(coords[1]) &&
  Math.abs(Number(coords[0])) <= 90 &&
  Math.abs(Number(coords[1])) <= 180;

const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#0b0c10" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#a5b4fc" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0b0c10" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#1f2937" }] },
  { featureType: "administrative.country", elementType: "labels.text.fill", stylers: [{ color: "#818cf8" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#c084fc" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#a5b4fc" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#064e3b" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#34d399" }] },
  { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#1e1b4b" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#312e81" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#4f46e5" }] },
  { featureType: "road.highway.controlled_access", elementType: "geometry", stylers: [{ color: "#5850ec" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#1e3a8a" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#60a5fa" }] }
];

export function IssueMap({ issues, userLocation, focusLocation }) {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
  });

  const navigate = useNavigate();
  const [map, setMap] = useState(null);
  const [activeIssue, setActiveIssue] = useState(null);
  const hasCenteredOnUserRef = useRef(false);
  const prevFocusRef = useRef(null);

  const defaultCenter = isValidLatLng(focusLocation)
    ? { lat: Number(focusLocation[0]), lng: Number(focusLocation[1]) }
    : (isValidLatLng(userLocation) 
        ? { lat: Number(userLocation[0]), lng: Number(userLocation[1]) } 
        : { lat: 12.9716, lng: 77.5946 });

  const issuesWithCoords = (issues || []).filter(isValidIssueCoordinate);

  const onLoad = useCallback((mapInstance) => {
    setMap(mapInstance);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  useEffect(() => {
    if (!map) return;

    if (isValidLatLng(focusLocation)) {
      const nextKey = `${Number(focusLocation[0]).toFixed(6)},${Number(focusLocation[1]).toFixed(6)}`;
      if (prevFocusRef.current !== nextKey) {
        map.panTo({ lat: Number(focusLocation[0]), lng: Number(focusLocation[1]) });
        map.setZoom(15);
        prevFocusRef.current = nextKey;
      }
      return;
    }

    if (isValidLatLng(userLocation) && !hasCenteredOnUserRef.current) {
      map.panTo({ lat: Number(userLocation[0]), lng: Number(userLocation[1]) });
      map.setZoom(14);
      hasCenteredOnUserRef.current = true;
      return;
    }

    const issuesWithCoords = (issues || []).filter(isValidIssueCoordinate);
    if (issuesWithCoords.length > 0 && !hasCenteredOnUserRef.current) {
      const bounds = new window.google.maps.LatLngBounds();
      issuesWithCoords.forEach((i) => {
        bounds.extend({ lat: Number(i.latitude), lng: Number(i.longitude) });
      });
      map.fitBounds(bounds);
    }
  }, [issues, map, userLocation, focusLocation]);

  if (!isLoaded) {
    return (
      <div className="w-full h-full bg-[#111] flex items-center justify-center">
        <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em] animate-pulse">
          Loading Google Maps Radar...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative z-0">
      <GoogleMap
        mapContainerClassName="w-full h-full bg-[#111]"
        center={defaultCenter}
        zoom={12}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={() => setActiveIssue(null)}
        options={{
          styles: darkMapStyle,
          disableDefaultUI: true,
          zoomControl: false,
        }}
      >
        {issuesWithCoords.map((issue) => {
          const markerStyle = getIntensityMarkerStyle(issue.intensity);
          return (
            <OverlayViewF
              key={issue.id}
              position={{ lat: Number(issue.latitude), lng: Number(issue.longitude) }}
              mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/issues/${issue.id}`);
                }}
                style={{ transform: "translate(-50%, -50%)" }}
                className="relative flex items-center justify-center w-8 h-8 focus:outline-none"
              >
                <div 
                  className="absolute inset-0 rounded-full animate-ping opacity-75"
                  style={{ 
                    backgroundColor: markerStyle.ring, 
                    animationDuration: "1.8s" 
                  }}
                />
                <div 
                  className="relative w-3 h-3 rounded-full border-2 border-[#0b0b0b]"
                  style={{ 
                    backgroundColor: markerStyle.core,
                    boxShadow: `0 0 12px ${markerStyle.glow}`
                  }}
                />
              </button>
            </OverlayViewF>
          );
        })}

        {activeIssue && (
          <OverlayViewF
            position={{ lat: Number(activeIssue.latitude), lng: Number(activeIssue.longitude) }}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
          >
            <div 
              style={{ transform: "translate(-50%, -105%)" }}
              className="absolute bottom-4 z-50 min-w-[260px] bg-black/95 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-2xl animate-in zoom-in duration-200"
            >
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIssue(null);
                }}
                className="absolute top-3 right-3 text-slate-500 hover:text-white text-base font-black w-6 h-6 flex items-center justify-center focus:outline-none"
              >
                ×
              </button>
              <div className="relative overflow-hidden group">
                  <div className="flex items-center justify-between gap-2 mb-3">
                     <div className="flex items-center gap-2">
                        <div 
                          className="w-2 h-2 rounded-full animate-pulse" 
                          style={{ backgroundColor: getIntensityMarkerStyle(activeIssue.intensity).core }} 
                        />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Sector Report</span>
                     </div>
                     <span className={cn("px-2 py-0.5 border rounded-lg text-[8px] font-black tracking-widest uppercase leading-none", getIntensityMarkerStyle(activeIssue.intensity).textClass)}>
                        INTENSITY {activeIssue.intensity || 5}/10
                     </span>
                  </div>
                  <h4 className="font-heading font-black text-base mb-2 text-white uppercase tracking-tighter leading-[1.2]">
                      {activeIssue.title}
                  </h4>
                  <div className="flex items-center gap-2 mb-6">
                      <span className={cn("px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border border-white/10 bg-white/5", getCategoryColor(activeIssue.category))}>
                          {activeIssue.category}
                      </span>
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-auto opacity-60">{activeIssue.area || "City Wide"}</span>
                  </div>
                  <Link 
                     to={`/issues/${activeIssue.id}`}
                     className="flex items-center justify-center gap-2 w-full py-3 bg-primary hover:bg-emerald-400 text-black text-[9px] font-black uppercase tracking-[0.2em] rounded-xl transition-all active:scale-95 shadow-[0_15px_30px_-10px_rgba(16,185,129,0.4)]"
                  >
                      Open Case <ChevronRight className="w-3 h-3" />
                  </Link>
              </div>
            </div>
          </OverlayViewF>
        )}

        {isValidLatLng(userLocation) && (
          <OverlayViewF
            position={{ lat: Number(userLocation[0]), lng: Number(userLocation[1]) }}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
          >
            <div 
              style={{ transform: "translate(-50%, -50%)" }}
              className="relative flex items-center justify-center w-10 h-10"
            >
              <div className="absolute inset-0 rounded-full bg-emerald-500/30 animate-pulse border border-emerald-500/50" />
              <div className="relative w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#0b0b0b] shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
            </div>
          </OverlayViewF>
        )}
      </GoogleMap>
    </div>
  );
}
