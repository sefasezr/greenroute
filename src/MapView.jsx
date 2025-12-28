// src/MapView.jsx
import { MapContainer, TileLayer, Polyline, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function MapView({ baseline, optimized }) {
  if (!optimized.length) return null;

  const center = [
    optimized[0].latitude,
    optimized[0].longitude,
  ];

  const toLine = (data) =>
    data.map((d) => [d.latitude, d.longitude]);

  return (
    <MapContainer center={center} zoom={12} style={{ height: "80vh" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* 🔴 BASELINE */}
      <Polyline
        positions={toLine(baseline)}
        color="red"
        weight={4}
        dashArray="6"
      />

      {/* 🔵 OPTIMIZED */}
      <Polyline
        positions={toLine(optimized)}
        color="blue"
        weight={4}
      />

      {/* Duraklar */}
      {optimized.map((p, i) => (
        <Marker key={i} position={[p.latitude, p.longitude]}>
          <Popup>
            <b>{p.Mahalle}</b><br />
            Stop: {p.stop_order}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
