import { MapContainer, TileLayer, Marker, Popup, useMapEvents, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useState, useEffect } from "react";
import ReportForm from "./ReportForm.jsx";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/firebase.js";

const southWest = L.latLng(-90, -180); 
const northEast = L.latLng(90, 180); 
const bounds = L.latLngBounds(southWest, northEast);

export default function MapView() {
    
    const [selectedPos, setSelectedPos] = useState(null);
    const [reports, setReports] = useState([]);
    const [zoomLevel, setZoomLevel] = useState(13);
    const [bottomOpen, setBottomOpen] = useState(false);
    const [cursorPos, setCursorPos] = useState(null);

    useEffect(() => {

        const unsub = onSnapshot(collection(db, "reports"), (snapshot) => {
            const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setReports(data);
        });
        return () => unsub();

    }, []);

    function MapEvents() {
        
        const map = useMapEvents({
            click(e) {
                setSelectedPos(e.latlng);
            },
            zoomend() {
                setZoomLevel(map.getZoom());
            },
            mousemove(e) {
                setCursorPos(e.latlng);
            },
        });
        return null;
    }

    const showReports = zoomLevel >= 13;

    return (
        <div style={{ height: "100vh", width: "100vw", position: "relative" }}>
            <MapContainer
                center={[37.7749, -122.4194]}
                zoom={13}
                minZoom={2}
                style={{ height: "100%", width: "100%" }}
                zoomControl={false}
                maxBounds={bounds}
                maxBoundsViscosity={1.0}
            >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <ZoomControl position="bottomright" />
                <MapEvents />

                {showReports &&
                    reports.map(
                        (r) =>
                            r.pos && (
                                <Marker
                                    key={r.id}
                                    position={[r.pos.lat, r.pos.lng]}
                                >
                                    <Popup>
                                        <b>{r.title}</b>
                                        <p>{r.desc}</p>
                                        <p>Category: {r.category}</p>
                                    </Popup>
                                </Marker>
                            )
                    )}

                {selectedPos && (
                    <ReportForm
                        position={selectedPos}
                        onClose={() => setSelectedPos(null)}
                    />
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

