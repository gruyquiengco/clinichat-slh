import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// REPLACE THE VALUES BELOW WITH YOUR FIREBASE PROJECT CONFIG
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
export const db = getFirestore(app);
