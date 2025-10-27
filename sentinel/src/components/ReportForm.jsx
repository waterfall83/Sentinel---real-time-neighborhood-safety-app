import { Marker, Popup } from "react-leaflet";
import { useState } from "react";

export default function ReportForm({ position, onClose }) {
    
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");

  if (!position) return null;

  const handleSubmit = (e) => {

    e.preventDefault();
    // temp: logs report
    // TODO: save report and show nearby reports on the map + improve ui
    console.log("report draft:", { position, title, description, category });
    onClose?.();

  };

  return (
    <Marker position={position}>
      <Popup>
        <div style={{ minWidth: 220 }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 8 }}>
              <label style={{ display: "block", fontSize: 12 }}>Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: "100%" }} />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={{ display: "block", fontSize: 12 }}>Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} style={{ width: "100%" }} />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={{ display: "block", fontSize: 12 }}>Category</label>
              <input value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: "100%" }} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit">Save</button>
              <button type="button" onClick={() => onClose?.()}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </Popup>
    </Marker>
  );
}