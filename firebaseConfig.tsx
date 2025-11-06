// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAC3kuXpTprsuPN3g8cgSM6DRZKxT542eI",
  authDomain: "giftwrapnew.firebaseapp.com",
  projectId: "giftwrapnew",
  storageBucket: "giftwrapnew.appspot.com", // Fixed typo: ".firebasestorage.app" → ".app"
  messagingSenderId: "908987993137",
  appId: "1:908987993137:web:1b37f82c32bc19122c9910"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);       // Firestore
export const auth = getAuth(app);          // Authentication
export const storage = getStorage(app);    // Storage
