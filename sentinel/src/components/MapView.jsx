import { MapContainer, TileLayer, Marker, Popup, useMapEvents, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./MapView.css";
import { useState, useEffect, useRef } from "react";
import ReportForm from "./ReportForm.jsx";
import * as L from "leaflet";
import { collection, onSnapshot, doc, updateDoc, increment, writeBatch } from "firebase/firestore";
import { db } from "../firebase/firebase.js";
import { getDistance } from "geolib";

const southWest = L.latLng(-90, -180);
const northEast = L.latLng(90, 180);
const bounds = L.latLngBounds(southWest, northEast);

export default function MapView({ user = null }) {

    const [selectedPos, setSelectedPos] = useState(null);
    const [reports, setReports] = useState([]);
    const [zoomLevel, setZoomLevel] = useState(13);
    const [bottomOpen, setBottomOpen] = useState(false);
    const [cursorPos, setCursorPos] = useState(null);
    const [voted, setVoted] = useState({});
    const [userPos, setUserPos] = useState(null);
    const [locationError, setLocationError] = useState(null);
    const [mapCenter, setMapCenter] = useState(null);

    const mapRef = useRef(null);

    useEffect(() => {
        if (!navigator.geolocation) {
            setLocationError("Geolocation is not supported by your browser");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                setUserPos({ lat: latitude, lng: longitude });
                setMapCenter({ lat: latitude, lng: longitude });
            },
            (err) => {
                setLocationError("Unable to retrieve your location");
                console.error(err);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }, []);

    useEffect(() => {

        if (userPos && mapRef.current) {
            mapRef.current.flyTo([userPos.lat, userPos.lng], 13, { duration: 1.2 });
        }

    }, [userPos]);

    useEffect(() => {

        if (!user?.uid) return;

        const votesRef = doc(db, "userVotes", user.uid);

        const unsub = onSnapshot(votesRef, (doc) => {
            if (doc.exists()) {
                setVoted(doc.data());
            }
        });

        return () => unsub();

    }, [user]);


    async function handleVote(reportId, voteType) {

        if (!user?.uid) {
            alert("Please login to vote");
            return;
        }

        try {
            const batch = writeBatch(db);

            const reportRef = doc(db, "reports", reportId);
            const field = voteType === 1 ? "votes.up" : "votes.down";
            batch.update(reportRef, { [field]: increment(1) });

            const votesRef = doc(db, "userVotes", user.uid);
            batch.set(votesRef, { [reportId]: true }, { merge: true });

            await batch.commit();

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

    const nearbyReports = (mapCenter && reports.length > 0)
        ? reports.filter((r) => {
            if (!r.pos || !r.pos.lat || !r.pos.lng) return false;

            return (
                getDistance(
                    { latitude: mapCenter.lat, longitude: mapCenter.lng },
                    { latitude: r.pos.lat, longitude: r.pos.lng }
                ) <= 7000 // 7 km, can edit later
            );
        })
        : [];

    function MapEvents() {

        const map = useMapEvents({
            click(e) {
                setSelectedPos(e.latlng);
            },
            zoomend() {
                setZoomLevel(map.getZoom());
                setMapCenter(map.getCenter());
            },
            moveend() {
                setMapCenter(map.getCenter());
            },
            mousemove(e) {
                setCursorPos(e.latlng);
            },
        });

        return null;
    }
    if (!userPos && !locationError) {
        return (
            <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
                Getting your location...
            </div>
        );
    }

    if (locationError) {
        return (
            <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", color: "red" }}>
                {locationError}
            </div>
        );
    }

    const showReports = zoomLevel >= 13;

    function formatDate(dateStr) {
        if (!dateStr) return "Unknown";
        try {
            return new Date(dateStr).toLocaleString();
        } catch (e) {
            return dateStr;
        }
    }

    return (
        <div style={{ height: "100vh", width: "100vw", position: "relative" }}>
            <MapContainer
                whenCreated={(mapInstance) => {
                    mapRef.current = mapInstance;
                    mapInstance.setView([userPos.lat, userPos.lng], 13);
                }}
                center={[userPos.lat, userPos.lng]}
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
                    nearbyReports.map(
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
                                        <p>Date: {r.createdAt ? formatDate(r.createdAt) : "Unknown"}</p>
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
                className={`bottom-drawer ${bottomOpen ? "open" : ""}`}
            >
                <div
                    className="drawer-handle"
                    onClick={() => setBottomOpen(!bottomOpen)}
                >
                    <div className="drawer-handle-bar" />
                </div>

                <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
                    <div className="drawer-header">
                        <h2>Nearby Reports</h2>
                        <p className="drawer-sub">See what's happening around you</p>
                    </div>

                    <div className="report-list">
                        {showReports ? (nearbyReports.length > 0 ? (
                            nearbyReports.filter((r) => r.pos).map((report) => (
                                <div key={report.id} className="report-card">
                                    <div className="report-top">
                                        <h3>{report.title}</h3>
                                        <span className="category-tag">{report.category}</span>
                                    </div>
                                    <p className="report-desc">{report.desc}</p>
                                    <div className="report-meta">
                                        📍 {report.pos.lat.toFixed(3)}, {report.pos.lng.toFixed(3)}
                                    </div>
                                    <div className="report-meta">🕒 {report.createdAt ? formatDate(report.createdAt) : "Unknown"}</div>
                                    <div className="vote-buttons">
                                        <button className={voted[report.id] ? "disabled-btn" : ""} disabled={voted[report.id]} onClick={(e) => { e.stopPropagation(); handleVote(report.id, 1); }}>Upvote: {report.votes.up}</button>
                                        <button className={voted[report.id] ? "disabled-btn" : ""} disabled={voted[report.id]} onClick={(e) => { e.stopPropagation(); handleVote(report.id, -1); }}>Downvote: {report.votes.down}</button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p>No nearby reports within 7 km.</p>
                        )
                        ) : (
                            < p className="zoom-hint">Zoom in to see nearby reports...</p>
                        )}
                    </div>
                </div>
            </div>
        </div >);
}

