import { MapContainer, TileLayer, Marker, Popup, useMapEvents, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useState } from "react";
import ReportForm from "./ReportForm.jsx";

export default function MapView({ reports = [] }) {
    const [selectedPos, setSelectedPos] = useState(null);
    const [bottomOpen, setBottomOpen] = useState(false);

    const MapClick = () => {
        useMapEvents({
            click(e) {
                setSelectedPos(e.latlng);
            },
        });
        return null;
    };

    return (
        <div style={{ height: "100vh", width: "100vw", position: "relative" }}>
            {/* Map */}
            <MapContainer
                center={[37.7749, -122.4194]}
                zoom={13}
                style={{ height: "100%", width: "100%" }}
                zoomControl={false}
            >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <ZoomControl position="bottomright" />
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

            <div
                style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: bottomOpen ? "60%" : "120px",
                    backgroundColor: "#fff",
                    borderTopLeftRadius: "20px",
                    borderTopRightRadius: "20px",
                    boxShadow: "0 -2px 10px rgba(0,0,0,0.2)",
                    transition: "height 0.3s ease",
                    zIndex: 1000,
                    overflow: "hidden",
                }}
                onClick={() => setBottomOpen(!bottomOpen)}
            >
                <div
                    style={{
                        width: "50px",
                        height: "6px",
                        backgroundColor: "#ccc",
                        borderRadius: "3px",
                        margin: "10px auto",
                    }}
                />

                <div style={{ padding: "10px", overflowY: "auto", height: "calc(100% - 30px)" }}>

                        {/* ui goes here: search bar, find nearby, etc. */}
                        <p> </p>
                </div>
            </div>
        </div>
    );
}
