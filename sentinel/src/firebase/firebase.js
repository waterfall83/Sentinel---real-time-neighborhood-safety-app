// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCI288hHTMfQWAaeXQcia_8InFf9npxRmk",
  authDomain: "sentinel-10d40.firebaseapp.com",
  projectId: "sentinel-10d40",
  storageBucket: "sentinel-10d40.firebasestorage.app",
  messagingSenderId: "619299607719",
  appId: "1:619299607719:web:02526ad7cb620321b87782",
  measurementId: "G-VMP1HBCT4B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);