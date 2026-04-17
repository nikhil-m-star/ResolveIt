import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";

// Fix Leaflet's default icon path issues
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

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
      map.flyTo(userLocation, 14, { animate: true, duration: 1 });
      hasCenteredOnUserRef.current = true;
      return;
    }

    const issuesWithCoords = (issues || []).filter(isValidIssueCoordinate);
    if (issuesWithCoords.length > 0) {
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
    <div className="w-full h-full min-h-400 sm:min-h-500 md:h-screen rounded-2xl md:rounded-none overflow-hidden border border-white/10 md:border-l relative z-0">
      <MapContainer
        center={defaultCenter}
        zoom={12}
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {issuesWithCoords.map((issue) => (
          <Marker key={issue.id} position={[issue.latitude, issue.longitude]}>
            <Popup className="glass-popup custom-leaflet-popup">
              <div className="p-4 bg-black/95 backdrop-blur-xl border-2 border-white/10 rounded-2xl min-w-240 shadow-[0_0_30px_rgba(0,0,0,0.5)] transform -translate-y-2">
                  <div className="flex items-center gap-2 mb-3">
                     <div className={cn("w-2 h-2 rounded-full animate-pulse", getStatusColor(issue.status).replace('text-', 'bg-').replace('border-', 'bg-'))} />
                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Signal Detected</span>
                  </div>
                  <h4 className="font-heading font-black text-lg mb-2 text-white uppercase tracking-tight leading-tight">
                      {issue.title}
                  </h4>
                  <div className="flex items-center gap-2 mb-4">
                      <span className={cn("px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border", getCategoryColor(issue.category))}>
                          {issue.category.substring(0, 12)}
                      </span>
                  </div>
                  <Link 
                     to={`/issues/${issue.id}`}
                     className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary hover:bg-emerald-400 text-black text-[10px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95"
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
            radius={8}
            pathOptions={{ color: "#22d3ee", fillColor: "#06b6d4", fillOpacity: 0.8, weight: 2 }}
          >
            <Popup>You are here</Popup>
          </CircleMarker>
        )}
        <MapUpdater issues={issues} userLocation={userLocation} />
      </MapContainer>
    </div>
  );
}

