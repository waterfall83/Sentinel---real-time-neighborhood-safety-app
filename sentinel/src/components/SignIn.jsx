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
                    <div style={{ position: "absolute", top: 10, right: 100 }}>
                        <button onClick={logout}>Logout</button>
                    </div>
                </div>
            ) : (
                <>
                    <h1>Welcome!</h1>
                    <p>hoeuhroeuowrheurhewouroewurhoewurouroewwurwurhoewurourowurhoewurourowurhoewurourowurhoewurourohoewurourowurhoewurourowurhoewurourowurhoewurourowurhoewurourowurhoewurourowurhoewurouro</p>
                    <div className="signin-center">
                        <div className="signin-inner">
                            <button onClick={loginWithGoogle}>Sign in with Google</button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
