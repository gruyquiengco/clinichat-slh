import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // Add this line

const firebaseConfig = {
  apiKey: "AIzaSyAVDlpJswapXPm-bdmhMee6d1zEA73l63U",
  authDomain: "clinichat-slh.firebaseapp.com",
  projectId: "clinichat-slh",
  storageBucket: "clinichat-slh.firebasestorage.app",
  messagingSenderId: "603242046972",
  appId: "1:603242046972:web:2ae96ef16d0c0263bbbe79",
  measurementId: "G-JTVRF4YT1F"
};

const app = initializeApp(firebaseConfig);

// Export both db and auth
export const db = getFirestore(app, "clinchat-slh");
export const auth = getAuth(app); // Add this line
