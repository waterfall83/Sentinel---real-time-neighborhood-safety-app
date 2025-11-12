import { useState, useEffect } from "react";
import { auth, googleProvider } from "../firebase/firebase.js";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import MapView from "./MapView";
import "./SignIn.css";

export default function GoogleAuth({ setMapInstance }) {
  const [user, setUser] = useState(auth.currentUser);

  const loginWithGoogle = async () => {
    const res = await signInWithPopup(auth, googleProvider);
    setUser(res.user);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return unsub;
  }, []);

  return (
    <div className={`signin-page ${user ? "map-active" : ""}`}>
      {user ? (
        <div className="map-container">
          <MapView user={user} setMapInstance={setMapInstance} />
          <div
            style={{
              zIndex: 10000,
              position: "absolute",
              top: 10,
              right: 10,
            }}
          >
            <button onClick={logout}>Logout</button>
          </div>
        </div>
      ) : (
        <div className="signin-center">
          <button onClick={loginWithGoogle}>Sign in with Google</button>
        </div>
      )}
    </div>
  );
}
