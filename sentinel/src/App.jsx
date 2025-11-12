import { useState } from "react";
import Header from "./components/Header.jsx";
import SignIn from "./components/SignIn.jsx";
import "./App.css";

export default function App() {
  const [mapInstance, setMapInstance] = useState(null);

  return (
    <div className="app-container">
      {/* <Header map={mapInstance} /> */}
      <SignIn setMapInstance={setMapInstance} />
    </div>
  );
}
