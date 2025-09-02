import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

const firebaseConfig = {
    apiKey: "AIzaSyD8JpSB_tK2CBj1tC6f434-vezZ2x0bRbk",
    authDomain: "birkrishnagoswami-b7360.firebaseapp.com",
    projectId: "birkrishnagoswami-b7360",
    storageBucket: "birkrishnagoswami-b7360.appspot.com",
    messagingSenderId: "790459013032",
    appId: "1:790459013032:web:d33b61fc48a0178cf82f9d",
    measurementId: "G-7GVXDMLLSY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get a Firestore instance
export const db = getFirestore(app);

// Get a Functions instance
export const functions = getFunctions(app);

// Connect to local emulator if in development environment
if (typeof window !== "undefined" && window.location !== undefined && window.location.hostname === "localhost") {
  //connectFunctionsEmulator(functions, "localhost", 5001);
} 

// Add default export for API route
export default function Firebase() {
  return null; // This is a utility file, not a React component
} 