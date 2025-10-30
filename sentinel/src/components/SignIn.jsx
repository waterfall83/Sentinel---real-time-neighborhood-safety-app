import { useState, useEffect } from "react";
import { auth, googleProvider } from "../firebase/firebase.js";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import MapView from "./MapView";
import "./SignIn.css";

export default function GoogleAuth() {
    const [user, setUser] = useState(auth.currentUser);

    const loginWithGoogle = async () => {
        try {
            const res = await signInWithPopup(auth, googleProvider);
            setUser(res.user);
        } catch (e) {
            console.error(e);
            alert(e.message);
        }
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
        <div className={`signin-page ${user ? 'map-active' : ''}`}>
            {user ? (
                <div className="map-container">
                    <MapView user={user} />
                    <div style={{
                        zIndex: 10000,
                        display: "flex",
                        fontSize: "14px",
                        color: "black",
                        position: "absolute",
                        top: 20,
                        right: 10
                    }}>
                        <button onClick={logout} >Logout</button>
                    </div>
                </div>
            ) : (
                <>
                    <div className="signin-center">
                        <div className="signin-inner" style={{ height: "calc(80vh)", display: "flex", justifyContent: "center", alignItems: "center" }}>
                            <button onClick={loginWithGoogle}>Sign in with Google</button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
