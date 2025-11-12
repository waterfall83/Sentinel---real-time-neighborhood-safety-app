import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./MapView.css";
import { useState, useEffect, useRef } from "react";
import ReportForm from "./ReportForm.jsx";
import * as L from "leaflet";
import { collection, onSnapshot, doc, writeBatch, increment } from "firebase/firestore";
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
  const [voted, setVoted] = useState({});
  const [userPos, setUserPos] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [mapCenter, setMapCenter] = useState(null);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const markerRefs = useRef({});
  const mapRef = useRef(null);
  const circleRef = useRef(null);

  const [mapReady, setMapReady] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState("nearby");
  const [rangeKm, setRangeKm] = useState(7);
  const [sortBy, setSortBy] = useState("upvotes");

  const [showRadius, setShowRadius] = useState(false);
  const [centerCrimeRate, setCenterCrimeRate] = useState(0);

  /* === GEOLOCATION === */
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported by your browser");
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

  /* === FIRESTORE === */
  useEffect(() => {
    if (!user?.uid) return;
    const votesRef = doc(db, "userVotes", user.uid);
    const unsub = onSnapshot(votesRef, (snap) => {
      if (snap.exists()) setVoted(snap.data());
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "reports"), (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setReports(data);
    });
    return () => unsub();
  }, []);

  async function handleVote(reportId, type) {
    if (!user?.uid) {
      alert("Please login to vote");
      return;
    }
    try {
      const batch = writeBatch(db);
      const reportRef = doc(db, "reports", reportId);
      const field = type === 1 ? "votes.up" : "votes.down";
      batch.update(reportRef, { [field]: increment(1) });
      const votesRef = doc(db, "userVotes", user.uid);
      batch.set(votesRef, { [reportId]: true }, { merge: true });
      await batch.commit();
    } catch (err) {
      console.error("vote failed", err);
    }
  }

  /* === MAP EVENTS === */
  function MapEvents() {
    const map = useMapEvents({
      click(e) {
        const click = e.latlng;
        setSelectedPos(click);

        const nearby = reports.filter((r) => {
          if (!r.pos) return false;
          const dist = getDistance(
            { latitude: click.lat, longitude: click.lng },
            { latitude: r.pos.lat, longitude: r.pos.lng }
          );
          const radius = r.radius ?? 800;
          return dist <= radius;
        });

        const score = (cat) =>
          cat === "Severe" ? 90 : cat === "Moderate" ? 60 : 30;

        let avg = 0;
        if (nearby.length > 0) {
          avg = nearby.reduce((s, r) => s + score(r.category), 0) / nearby.length;
        }

        setCenterCrimeRate(Math.round(avg));

        if (showRadius) {
          if (!circleRef.current) {
            circleRef.current = L.circle(click, {
              radius: 800,
              color: "#7147d3",
              fillColor: "#7147d3",
              fillOpacity: 0.15,
              weight: 2,
            }).addTo(map);
          } else {
            circleRef.current.setLatLng(click);
          }
        } else if (circleRef.current) {
          circleRef.current.remove();
          circleRef.current = null;
        }
      },

      zoomend() {
        setZoomLevel(map.getZoom());
        setMapCenter(map.getCenter());
      },

      moveend() {
        setMapCenter(map.getCenter());
      },
    });

    return null;
  }

  /* === CRIME RATE UPDATE === */
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    function handleClick(e) {
      const click = e.latlng;

      const nearby = reports.filter((r) => {
        if (!r.pos) return false;
        const dist = getDistance(
          { latitude: click.lat, longitude: click.lng },
          { latitude: r.pos.lat, longitude: r.pos.lng }
        );
        const radius = r.radius ?? 800;
        return dist <= radius; 
      });

      let avg = 0;
      if (nearby.length > 0) {
        avg =
          nearby.reduce((sum, r) => sum + (r.crimeProb ?? 50), 0) /
          nearby.length;
      }

      setCenterCrimeRate(Math.round(avg));

      if (showRadius) {
        if (!circleRef.current) {
          circleRef.current = L.circle(click, {
            radius: 800,
            color: "#7147d3",
            fillColor: "#7147d3",
            fillOpacity: 0.15,
            weight: 2,
          }).addTo(map);
        } else {
          circleRef.current.setLatLng(click);
        }
      } else if (circleRef.current) {
        circleRef.current.remove();
        circleRef.current = null;
      }
    }

    map.on("click", handleClick);
    return () => map.off("click", handleClick);
  }, [reports, showRadius]);



  /* === FILTERING / SORTING === */
  const filteredReports = reports
    .filter((r) => {
      const text = `${r.title} ${r.desc}`.toLowerCase();
      return text.includes(searchQuery.toLowerCase());
    })
    .filter((r) => {
      if (sortMode === "nearby" && mapCenter && r.pos) {
        const dist = getDistance(
          { latitude: mapCenter.lat, longitude: mapCenter.lng },
          { latitude: r.pos.lat, longitude: r.pos.lng }
        );
        return dist <= rangeKm * 1000;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "upvotes") return b.votes.up - a.votes.up;
      if (sortBy === "downvotes") return b.votes.down - a.votes.down;
      if (sortBy === "severity") {
        const order = { Severe: 3, Moderate: 2, Low: 1 };
        return (order[b.category] || 0) - (order[a.category] || 0);
      }
      return 0;
    });

  function formatDate(dateStr) {
    if (!dateStr) return "Unknown";
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
  }

  if (!userPos && !locationError)
    return <div className="loading-screen">Getting your location...</div>;
  if (locationError) return <div className="error-screen">{locationError}</div>;

  const showReports = zoomLevel >= 13;

  /* === UI === */
  return (
    <div style={{ height: "100vh", width: "100vw", position: "relative" }}>

      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "60px",
          backgroundColor: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          zIndex: 1000,
          fontWeight: "bold",
          fontSize: "18px",
          color: "#000",
          fontFamily: "Poppins, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "16px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontWeight: 600,
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={showRadius}
              onChange={(e) => setShowRadius(e.target.checked)}
              style={{ accentColor: "#7147d3" }}
            />
            Show radius
          </label>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "#f6f1ff",
              border: "1px solid #e6dcff",
              color: "#4a2ea8",
              padding: "6px 10px",
              borderRadius: "999px",
              fontWeight: 700,
              fontSize: "13px",
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#d33",
                display: "inline-block",
              }}
            />
            {centerCrimeRate}% Crime Rate
          </div>
        </div>

        Sentinel
      </div>

      <MapContainer
        whenCreated={(map) => {
          mapRef.current = map;
          setMapReady(true); 
        }}
        center={[userPos.lat, userPos.lng]}
        zoom={13}
        minZoom={2}
        zoomControl={false}
        style={{ height: "100%", width: "100%" }}
        maxBounds={bounds}
        maxBoundsViscosity={1.0}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <ZoomControl position="bottomright" />
        <MapEvents />

        {showReports &&
          filteredReports.map((r) => {
            if (!r.pos) return null;
            const color =
              r.category === "Severe"
                ? "#d33"
                : r.category === "Moderate"
                  ? "#e7a61a"
                  : "#4caf50";
            const radius = r.radius ?? 300;

            return (
              <Marker
                key={r.id}
                position={[r.pos.lat, r.pos.lng]}
                ref={(ref) => (markerRefs.current[r.id] = ref)}
                eventHandlers={{ click: () => setSelectedMarker(r.id) }}
              >
                <Popup onClose={() => setSelectedMarker(null)} className="marker-popup">
                  <div className="popup-card">
                    <div className="popup-content">
                      <div className="popup-header">
                        <h3 className="popup-title">{r.title}</h3>
                        <span className="popup-category-badge">{r.category}</span>
                      </div>
                      <p className="popup-desc">{r.desc}</p>

                      <div className="popup-meta">
                        📍 {r.pos.lat.toFixed(5)}, {r.pos.lng.toFixed(5)}
                      </div>
                      <div className="popup-meta">🕒 {formatDate(r.createdAt)}</div>
                    </div>

                    <div className="popup-votes">
                      <button className="popup-vote-btn up" >
                        <svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 6l-6 8h12z" /></svg>
                      </button>
                      <span className="popup-vote-count">{r.votes.up - r.votes.down}</span>
                      <button className="popup-vote-btn down" >
                        <svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 18l6-8H6z" /></svg>
                      </button>
                    </div>
                  </div>
                </Popup>

                {showRadius && (
                  <Circle
                    center={[r.pos.lat, r.pos.lng]}
                    radius={radius}
                    color={color}
                    fillOpacity={0.15}
                  />
                )}
              </Marker>
            );
          })}

        {selectedPos && <ReportForm position={selectedPos} onClose={() => setSelectedPos(null)} />}
      </MapContainer>

      <div className={`bottom-drawer ${bottomOpen ? "open" : ""}`}>
        <div className="drawer-handle" onClick={() => setBottomOpen(!bottomOpen)}>
          <div className="drawer-handle-bar" />
        </div>

        <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
          <div className="drawer-header">
            <h2>Reports</h2>
            <p className="drawer-sub">
              {sortMode === "nearby" ? "Nearby incidents" : "Worldwide incidents"}
            </p>
          </div>

          <div className="search-sort-bar">
            <input
              type="text"
              className="report-search-input"
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <div className="sort-toggle">
              <button className={sortMode === "nearby" ? "active" : ""} onClick={() => setSortMode("nearby")}>
                📍 Nearby
              </button>
              <button className={sortMode === "worldwide" ? "active" : ""} onClick={() => setSortMode("worldwide")}>
                🌐 Worldwide
              </button>
            </div>

            {sortMode === "nearby" && (
              <div className="range-filter">
                <label>
                  Within Range: <span>{rangeKm} km</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={rangeKm}
                  onChange={(e) => setRangeKm(Number(e.target.value))}
                />
              </div>
            )}

            <div className="sort-by">
              <label>Sort by:</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="upvotes">👍 Upvotes</option>
                <option value="downvotes">👎 Downvotes</option>
                <option value="severity">⚠️ Severity</option>
              </select>
            </div>
          </div>

          <div className="report-list">
            {filteredReports.length > 0 ? (
              filteredReports.map((r) => (
                <div
                  key={r.id}
                  id={`report-${r.id}`}
                  className="report-card"
                  onClick={() => {
                    setSelectedMarker(r.id);
                    setBottomOpen(false);
                    const map = mapRef.current;
                    if (map) map.flyTo([r.pos.lat, r.pos.lng], 16, { duration: 1 });
                  }}
                >
                  <div className="vote-column">
                    <button
                      className={`vote-arrow up ${voted[r.id] ? "disabled" : ""}`}
                      disabled={voted[r.id]}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVote(r.id, 1);
                      }}
                    >
                      <svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 6l-6 8h12z" /></svg>
                    </button>
                    <span className="vote-count">{r.votes.up - r.votes.down}</span>
                    <button
                      className={`vote-arrow down ${voted[r.id] ? "disabled" : ""}`}
                      disabled={voted[r.id]}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVote(r.id, -1);
                      }}
                    >
                      <svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 18l6-8H6z" /></svg>
                    </button>
                  </div>

                  <div className="report-content">
                    <div className="report-top">
                      <h3>{r.title}</h3>
                      <span className="category-tag">{r.category}</span>
                    </div>
                    <p className="report-desc">{r.desc}</p>
                    <div className="report-meta">📍 {r.pos.lat.toFixed(3)}, {r.pos.lng.toFixed(3)}</div>
                    <div className="report-meta">🕒 {formatDate(r.createdAt)}</div>
                  </div>
                </div>
              ))
            ) : (
              <p>No reports found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
