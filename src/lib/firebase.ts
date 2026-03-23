import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBmkZKImLMZeYEp4Yq_C67JGMLtl3vOhuk",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "auto-7e7ce.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "auto-7e7ce",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "auto-7e7ce.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "224918670712",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:224918670712:web:6986ee10c570bb25618c8d",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-JQK0NDG73L",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

let analytics: Analytics | null = null;
const analyticsEnabled =
  String(import.meta.env.VITE_ENABLE_ANALYTICS || "").toLowerCase() === "true" ||
  import.meta.env.PROD;

if (typeof window !== "undefined" && analyticsEnabled) {
  isSupported()
    .then((ok) => {
      if (ok) {
        try {
          analytics = getAnalytics(app);
        } catch (error) {
          console.warn("Firebase Analytics initialization skipped:", error);
        }
      }
    })
    .catch((error) => {
      console.warn("Firebase Analytics support check failed:", error);
    });
}

export { app, auth, db, storage, analytics };

