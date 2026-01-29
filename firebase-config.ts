import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your existing Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyAVDlpJswapXPm-bdmhMee6d1zEA73l63U",
  authDomain: "clinichat-slh.firebaseapp.com",
  projectId: "clinichat-slh",
  storageBucket: "clinichat-slh.firebasestorage.app",
  messagingSenderId: "603242046972",
  appId: "1:603242046972:web:2ae96ef16d0c0263bbbe79",
  measurementId: "G-JTVRF4YT1F"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore and explicitly point to the 'clinchat-slh' database
// This fixes the "Missing or insufficient permissions" error
export const db = getFirestore(app, "clinchat-slh");
