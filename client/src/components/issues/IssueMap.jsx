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
    <div className="w-full h-full min-h-[400px] sm:min-h-[500px] md:h-screen rounded-2xl md:rounded-none overflow-hidden border border-white/10 md:border-l relative z-0">
      <MapContainer
        center={defaultCenter}
        zoom={12}
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {issuesWithCoords.map((issue) => (
          <Marker key={issue.id} position={[issue.latitude, issue.longitude]}>
            <Popup className="glass-popup bg-background border border-white/10 text-white rounded-xl shadow-2xl p-0 overflow-hidden">
              <div className="p-3 bg-gray-900 shadow-xl border border-white/5 rounded-xl min-w-[200px]">
                  <h4 className="font-heading font-bold text-base mb-1 truncate text-white">
                      {issue.title}
                  </h4>
                  <div className="flex items-center gap-2 text-xs mb-2">
                      <span className="px-2 py-0.5 bg-primary/20 text-primary rounded-md font-medium border border-primary/30 uppercase">
                          {issue.category.replace(/_/g, " ")}
                      </span>
                      <span className="text-gray-400 capitalize">{issue.status.replace(/_/g, " ").toLowerCase()}</span>
                  </div>
                  <Link 
                     to={`/issues/${issue.id}`}
                     className="block w-full py-1.5 text-center bg-white/10 hover:bg-white/20 text-sm font-medium rounded-md transition-colors mt-2 text-white border border-white/10"
                  >
                      View Details
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
