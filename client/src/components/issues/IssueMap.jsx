import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState, useCallback } from "react";
import { ChevronRight } from "lucide-react";
import { cn, getCategoryColor } from "../../utils/helpers";
import { renderToString } from 'react-dom/server';

const STATUS_MARKER_STYLE = {
  REPORTED: { core: "#3b82f6", glow: "rgba(59,130,246,0.78)", ring: "rgba(59,130,246,0.30)" },
  IN_PROGRESS: { core: "#f59e0b", glow: "rgba(245,158,11,0.78)", ring: "rgba(245,158,11,0.30)" },
  RESOLVED: { core: "#22c55e", glow: "rgba(34,197,94,0.78)", ring: "rgba(34,197,94,0.30)" },
  REJECTED: { core: "#f43f5e", glow: "rgba(244,63,94,0.78)", ring: "rgba(244,63,94,0.30)" },
};

export const getIntensityMarkerStyle = (intensity) => {
  const score = Number(intensity) || 5;
  if (score <= 3) {
    return { core: "#10b981", glow: "rgba(16,185,129,0.85)", ring: "rgba(16,185,129,0.35)", label: "Low Severity", textClass: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" };
  } else if (score <= 5) {
    return { core: "#06b6d4", glow: "rgba(6,182,212,0.85)", ring: "rgba(6,182,212,0.35)", label: "Moderate Severity", textClass: "text-cyan-400 border-cyan-500/20 bg-cyan-500/5" };
  } else if (score <= 7) {
    return { core: "#f59e0b", glow: "rgba(245,158,11,0.85)", ring: "rgba(245,158,11,0.35)", label: "High Severity", textClass: "text-amber-400 border-amber-500/20 bg-amber-500/5" };
  } else if (score <= 9) {
    return { core: "#f97316", glow: "rgba(249,115,22,0.85)", ring: "rgba(249,115,22,0.35)", label: "Severe Threat", textClass: "text-orange-400 border-orange-500/20 bg-orange-500/5" };
  } else {
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

function MapUpdater({ issuesWithCoords, userLocation, focusLocation, hasCenteredOnUserRef, prevFocusRef }) {
  const map = useMap();
  
  useEffect(() => {
    if (!map) return;

    if (isValidLatLng(focusLocation)) {
      const nextKey = `${Number(focusLocation[0]).toFixed(6)},${Number(focusLocation[1]).toFixed(6)}`;
      if (prevFocusRef.current !== nextKey) {
        map.setView([Number(focusLocation[0]), Number(focusLocation[1])], 15);
        prevFocusRef.current = nextKey;
      }
      return;
    }

    if (isValidLatLng(userLocation) && !hasCenteredOnUserRef.current) {
      map.setView([Number(userLocation[0]), Number(userLocation[1])], 14);
      hasCenteredOnUserRef.current = true;
      return;
    }

    if (issuesWithCoords.length > 0 && !hasCenteredOnUserRef.current) {
      const bounds = L.latLngBounds(issuesWithCoords.map(i => [Number(i.latitude), Number(i.longitude)]));
      map.fitBounds(bounds, { padding: [50, 50] });
      hasCenteredOnUserRef.current = true;
    }
  }, [map, issuesWithCoords, userLocation, focusLocation, hasCenteredOnUserRef, prevFocusRef]);
  
  return null;
}

const createCustomIcon = (markerStyle) => {
  const iconHtml = renderToString(
    <div style={{ transform: "translate(-50%, -50%)" }} className="relative flex items-center justify-center w-8 h-8">
      <div className="absolute inset-0 rounded-full animate-ping opacity-75" style={{ backgroundColor: markerStyle.ring, animationDuration: "1.8s" }} />
      <div className="relative w-3 h-3 rounded-full border-2 border-[#0b0b0b]" style={{ backgroundColor: markerStyle.core, boxShadow: `0 0 12px ${markerStyle.glow}` }} />
    </div>
  );
  return L.divIcon({ html: iconHtml, className: "", iconSize: [32, 32], iconAnchor: [16, 16] });
};

const createUserIcon = () => {
  const iconHtml = renderToString(
    <div style={{ transform: "translate(-50%, -50%)" }} className="relative flex items-center justify-center w-10 h-10">
      <div className="absolute inset-0 rounded-full bg-emerald-500/30 animate-pulse border border-emerald-500/50" />
      <div className="relative w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#0b0b0b] shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
    </div>
  );
  return L.divIcon({ html: iconHtml, className: "", iconSize: [40, 40], iconAnchor: [20, 20] });
};

export function IssueMap({ issues, userLocation, focusLocation }) {
  const navigate = useNavigate();
  const [activeIssue, setActiveIssue] = useState(null);
  const hasCenteredOnUserRef = useRef(false);
  const prevFocusRef = useRef(null);

  const defaultCenter = isValidLatLng(focusLocation)
    ? [Number(focusLocation[0]), Number(focusLocation[1])]
    : (isValidLatLng(userLocation) 
        ? [Number(userLocation[0]), Number(userLocation[1])] 
        : [12.9716, 77.5946]);

  const issuesWithCoords = (issues || []).filter(isValidIssueCoordinate);

  return (
    <div className="w-full h-full relative z-0">
      <style>{"\
        .leaflet-container { background: #111; }
        .leaflet-tile { filter: brightness(1.5) contrast(1.2) sepia(0.3) hue-rotate(180deg) saturate(2); }\
        .leaflet-popup-content-wrapper, .leaflet-popup-tip { background: transparent; box-shadow: none; overflow: visible; }\
        .leaflet-popup-content { margin: 0; line-height: normal; }\
      "}</style>
      <MapContainer
        center={defaultCenter}
        zoom={12}
        className="w-full h-full bg-[#111]"
        zoomControl={false}
        onClick={() => setActiveIssue(null)}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />
        <MapUpdater 
          issuesWithCoords={issuesWithCoords} 
          userLocation={userLocation} 
          focusLocation={focusLocation}
          hasCenteredOnUserRef={hasCenteredOnUserRef}
          prevFocusRef={prevFocusRef}
        />

        {issuesWithCoords.map((issue) => {
          const markerStyle = getIntensityMarkerStyle(issue.intensity);
          return (
            <Marker
              key={issue.id}
              position={[Number(issue.latitude), Number(issue.longitude)]}
              icon={createCustomIcon(markerStyle)}
              eventHandlers={{
                click: () => setActiveIssue(issue),
              }}
            />
          );
        })}

        {activeIssue && (
          <Popup
            position={[Number(activeIssue.latitude), Number(activeIssue.longitude)]}
            closeButton={false}
            offset={[0, -15]}
          >
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-50 min-w-[260px] bg-black/95 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-2xl animate-in zoom-in duration-200">
              <button 
                onClick={(e) => { e.stopPropagation(); setActiveIssue(null); }}
                className="absolute top-3 right-3 text-slate-500 hover:text-white text-base font-black w-6 h-6 flex items-center justify-center focus:outline-none"
              >
                ×
              </button>
              <div className="relative overflow-hidden group">
                  <div className="flex items-center justify-between gap-2 mb-3">
                     <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: getIntensityMarkerStyle(activeIssue.intensity).core }} />
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
          </Popup>
        )}

        {isValidLatLng(userLocation) && (
          <Marker
            position={[Number(userLocation[0]), Number(userLocation[1])]}
            icon={createUserIcon()}
          />
        )}
      </MapContainer>
    </div>
  );
}
