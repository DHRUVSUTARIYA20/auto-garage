import admin from "firebase-admin";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

// Ensure env is loaded before reading env vars
dotenv.config({ path: path.join(process.cwd(), ".env.local") });
dotenv.config();

// Initialize Firebase Admin SDK.
// Uses a service-account JSON file, individual env vars, or project-ID-only mode.
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || "";
const projectId = process.env.FIREBASE_PROJECT_ID || "auto-7e7ce";

let initOptions: admin.AppOptions = {
  projectId,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "auto-7e7ce.firebasestorage.app",
};

if (serviceAccountPath && fs.existsSync(path.resolve(serviceAccountPath))) {
  const serviceAccount = JSON.parse(fs.readFileSync(path.resolve(serviceAccountPath), "utf-8"));
  initOptions.credential = admin.credential.cert(serviceAccount);
} else if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
  initOptions.credential = admin.credential.cert({
    projectId,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  });
} else {
  // No explicit credentials — try application default, if that fails skip credential
  // (works in emulator mode or when FIRESTORE_EMULATOR_HOST / FIREBASE_AUTH_EMULATOR_HOST is set)
  try {
    initOptions.credential = admin.credential.applicationDefault();
  } catch {
    // No credentials available — will only work with emulator or public rules
    console.warn("No Firebase Admin credentials found. Server will attempt to connect without auth.");
  }
}

if (!admin.apps.length) {
  admin.initializeApp(initOptions);
}

export const adminApp = admin.app();
export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export const adminStorage = admin.storage();

export const isFirebaseConfigured = true;
