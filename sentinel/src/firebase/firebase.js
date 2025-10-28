// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: "sentinelapp-157a5.firebaseapp.com",
  projectId: "sentinelapp-157a5",
  storageBucket: "sentinelapp-157a5.firebasestorage.app",
  messagingSenderId: "996567385231",
  appId: "1:996567385231:web:7bb6408434782427b79cfa",
  measurementId: "G-5DFTY1RQ95"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);


export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;