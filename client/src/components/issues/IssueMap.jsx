import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import { ChevronRight } from "lucide-react";
import { cn, getStatusColor, getCategoryColor } from "../../utils/helpers";

// Fix Leaflet's default icon path issues
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const createCustomMarker = (status) => {
  return L.divIcon({
    className: "custom-marker",
    html: `<div class="relative flex items-center justify-center w-8 h-8">
            <div class="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
            <div class="relative w-3 h-3 bg-primary border-2 border-black rounded-full shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
          </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
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

const MapUpdater = ({ issues, userLocation }) => {
  const map = useMap();
  const hasCenteredOnUserRef = useRef(false);

  useEffect(() => {
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
  }, [issues, map, userLocation]);

  return null;
};
export function IssueMap({ issues, userLocation }) {
  const defaultCenter = isValidLatLng(userLocation) ? userLocation : [12.9716, 77.5946];
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
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {issuesWithCoords.map((issue) => (
          <Marker 
            key={issue.id} 
            position={[issue.latitude, issue.longitude]}
            icon={createCustomMarker(issue.status)}
          >
            <Popup className="glass-popup custom-leaflet-popup">
              <div className="p-5 bg-black/90 backdrop-blur-2xl border border-white/10 rounded-[24px] min-w-[200px] shadow-2xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  
                  <div className="flex items-center gap-2 mb-3">
                     <div className={cn("w-2 h-2 rounded-full animate-pulse", getStatusColor(issue.status).replace('text-', 'bg-'))} />
                     <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">Report Located</span>
                  </div>
                  <h4 className="font-heading font-black text-md mb-2 text-white uppercase tracking-tight leading-tight">
                      {issue.title}
                  </h4>
                  <div className="flex items-center gap-2 mb-5">
                      <span className={cn("px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border border-white/5 bg-white/5", getCategoryColor(issue.category))}>
                          {issue.category}
                      </span>
                  </div>
                  <Link 
                     to={`/issues/${issue.id}`}
                     className="flex items-center justify-center gap-2 w-full py-3 bg-primary hover:bg-emerald-400 text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all active:scale-95 shadow-[0_10px_20px_-10px_rgba(16,185,129,0.5)]"
                  >
                      View Report <ChevronRight className="w-3 h-3" />
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
        <MapUpdater issues={issues} userLocation={userLocation} />
      </MapContainer>
    </div>
  );
}

