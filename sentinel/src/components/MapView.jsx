import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useState } from "react";
import ReportForm from "./ReportForm";

export default function MapView({ reports = [] }) {
  const [selectedPos, setSelectedPos] = useState(null);

  const MapClick = () => {
    useMapEvents({
      click(e) {
        setSelectedPos(e.latlng);
      },
    });
    return null;
  };

  return (
    <MapContainer
      center={[37.7749, -122.4194]}
      zoom={13}
      style={{ height: "50vh", width: "100vh" }} 
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MapClick />

      {reports.map((r, i) =>
        r.location ? (
          <Marker key={r.id ?? i} position={[r.location.lat, r.location.lng]}>
            <Popup>
              <b>{r.title}</b>
              <p>{r.description}</p>
              <p>Category: {r.category}</p>
            </Popup>
          </Marker>
        ) : null
      )}

      {selectedPos && <ReportForm position={selectedPos} onClose={() => setSelectedPos(null)} />}
    </MapContainer>
  );
}
