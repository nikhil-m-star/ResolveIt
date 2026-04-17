import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import { ChevronRight } from "lucide-react";
import { cn, getCategoryColor } from "../../utils/helpers";

// Fix Leaflet's default icon path issues
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const STATUS_MARKER_STYLE = {
  REPORTED: { core: "#3b82f6", glow: "rgba(59,130,246,0.78)", ring: "rgba(59,130,246,0.30)" },
  IN_PROGRESS: { core: "#f59e0b", glow: "rgba(245,158,11,0.78)", ring: "rgba(245,158,11,0.30)" },
  RESOLVED: { core: "#22c55e", glow: "rgba(34,197,94,0.78)", ring: "rgba(34,197,94,0.30)" },
  REJECTED: { core: "#f43f5e", glow: "rgba(244,63,94,0.78)", ring: "rgba(244,63,94,0.30)" },
};

const createCustomMarker = (status) => {
  const palette = STATUS_MARKER_STYLE[status] || STATUS_MARKER_STYLE.REPORTED;
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="position:relative;display:flex;align-items:center;justify-content:center;width:32px;height:32px;">
            <div style="position:absolute;inset:0;border-radius:9999px;background:${palette.ring};animation:ping 1.8s cubic-bezier(0,0,0.2,1) infinite;"></div>
            <div style="position:relative;width:12px;height:12px;border-radius:9999px;background:${palette.core};border:2px solid #0b0b0b;box-shadow:0 0 12px ${palette.glow};"></div>
          </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const getStatusDotColor = (status) => (STATUS_MARKER_STYLE[status] || STATUS_MARKER_STYLE.REPORTED).core;

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

const MapUpdater = ({ issues, userLocation, focusLocation }) => {
  const map = useMap();
  const hasCenteredOnUserRef = useRef(false);
  const prevFocusRef = useRef(null);

  useEffect(() => {
    if (isValidLatLng(focusLocation)) {
      const nextKey = `${Number(focusLocation[0]).toFixed(6)},${Number(focusLocation[1]).toFixed(6)}`;
      if (prevFocusRef.current !== nextKey) {
        map.flyTo(focusLocation, 15, { animate: true, duration: 1.2 });
        prevFocusRef.current = nextKey;
      }
      return;
    }

    if (isValidLatLng(userLocation) && !hasCenteredOnUserRef.current) {
      map.flyTo(userLocation, 14, { animate: true, duration: 1.5 });
      hasCenteredOnUserRef.current = true;
      return;
    }

    const issuesWithCoords = (issues || []).filter(isValidIssueCoordinate);
    if (issuesWithCoords.length > 0 && !hasCenteredOnUserRef.current) {
      const bounds = L.latLngBounds(issuesWithCoords.map((i) => [i.latitude, i.longitude]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [issues, map, userLocation, focusLocation]);

  return null;
};
export function IssueMap({ issues, userLocation, focusLocation }) {
  const defaultCenter = isValidLatLng(focusLocation)
    ? focusLocation
    : (isValidLatLng(userLocation) ? userLocation : [12.9716, 77.5946]);
  const issuesWithCoords = (issues || []).filter(isValidIssueCoordinate);

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer
        center={defaultCenter}
        zoom={12}
        className="w-full h-full bg-[#111]"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {issuesWithCoords.map((issue) => (
          <Marker 
            key={issue.id} 
            position={[issue.latitude, issue.longitude]}
            icon={createCustomMarker(issue.status)}
          >
            <Popup className="premium-map-popup" minWidth={240}>
              <div className="relative overflow-hidden group">
                  <div className="flex items-center gap-2 mb-3">
                     <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: getStatusDotColor(issue.status) }} />
                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Sector Report</span>
                  </div>
                  <h4 className="font-heading font-black text-lg mb-2 text-white uppercase tracking-tighter leading-[1.2]">
                      {issue.title}
                  </h4>
                  <div className="flex items-center gap-2 mb-6">
                      <span className={cn("px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border border-white/10 bg-white/5", getCategoryColor(issue.category))}>
                          {issue.category}
                      </span>
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-auto opacity-60">{issue.area || "City Wide"}</span>
                  </div>
                  <Link 
                     to={`/issues/${issue.id}`}
                     className="flex items-center justify-center gap-2 w-full py-4 bg-primary hover:bg-emerald-400 text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all active:scale-95 shadow-[0_15px_30px_-10px_rgba(16,185,129,0.4)]"
                  >
                      Open Case <ChevronRight className="w-3 h-3" />
                  </Link>
              </div>
            </Popup>
          </Marker>
        ))}
        {isValidLatLng(userLocation) && (
          <CircleMarker
            center={userLocation}
            radius={10}
            pathOptions={{ 
              color: "#10b981", 
              fillColor: "#10b981", 
              fillOpacity: 0.3, 
              weight: 2,
              className: "animate-pulse" 
            }}
          >
            <Popup>
              <div className="px-4 py-2 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl">
                 <span className="text-[10px] font-black uppercase tracking-widest text-primary">Your Location</span>
              </div>
            </Popup>
          </CircleMarker>
        )}
        <MapUpdater issues={issues} userLocation={userLocation} focusLocation={focusLocation} />
      </MapContainer>
    </div>
  );
}
