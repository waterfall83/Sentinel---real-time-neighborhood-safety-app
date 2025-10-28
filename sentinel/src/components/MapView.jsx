import { MapContainer, TileLayer, Marker, Popup, useMapEvents, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useState, useEffect } from "react";
import ReportForm from "./ReportForm.jsx";
import { collection, onSnapshot, doc, updateDoc, increment } from "firebase/firestore";
import { db } from "../firebase/firebase.js";

const southWest = L.latLng(-90, -180);
const northEast = L.latLng(90, 180);
const bounds = L.latLngBounds(southWest, northEast);

export default function MapView(user=null) {

    const [selectedPos, setSelectedPos] = useState(null);
    const [reports, setReports] = useState([]);
    const [zoomLevel, setZoomLevel] = useState(13);
    const [bottomOpen, setBottomOpen] = useState(false);
    const [cursorPos, setCursorPos] = useState(null);
    const [voted, setVoted] = useState({});

    async function handleVote(reportId, voteType) {

        if (voted[reportId]) {
            alert("You have already voted on this report!");
            return;
        }

        try {
            const reportRef = doc(db, "reports", reportId);
            const field = voteType === 1 ? "votes.up" : "votes.down";

            await updateDoc(reportRef, { [field]: increment(1) });

            setVoted(prev => ({
                ...prev,
                [reportId]: true
            }));

            setReports((prev) =>
                prev.map((r) =>
                    r.id === reportId
                    ? {
                          ...r,
                          votes: {
                              ...r.votes,
                              [voteType === 1 ? 'up' : 'down']: (voteType === 1 ? r.votes?.up : r.votes?.down) + 1
                          },
                      }
                    : r
                )
            );
        } catch (e) {
            console.error("vote failed", e);
        }
    }

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
                                        <p>Up: {r.votes.up} , Down: {r.votes.down} </p>
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
                    <h2>Nearby Danger</h2>
                    <hr></hr>

                    {showReports ? (
                        (() => {
                            const visibleReports = reports.filter((r) => r.pos);

                            return visibleReports.map((report) => (
                                <div key={report.id}>
                                    <h3>{report.title}</h3>
                                    <p>{report.desc}</p>
                                    <p>Category: {report.category}</p>
                                    <p>Location (lat, long): {report.pos.lat}, {report.pos.lng}</p>
                                    <p>Up: {report.votes.up} , Down: {report.votes.down} </p>
                                    <div style={{ display: "flex", gap: "10px", marginTop: "5px" }}>
                                        <button onClick={() => handleVote(report.id, 1)}>Upvote</button>
                                        <button onClick={() => handleVote(report.id, -1)}>Downvote</button>
                                    </div>
                                </div>
                            ));
                        })()
                    ) : (
                        <p>Zoom in to see reports</p>
                    )}
                </div>
            </div>
        </div>
    );
}

