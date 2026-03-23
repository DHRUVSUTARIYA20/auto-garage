import admin from "firebase-admin";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootPath = path.resolve(__dirname, "..");

// Load environment variables
dotenv.config({ path: path.join(rootPath, ".env.local") });

// Initialize Firebase Admin
const projectId = process.env.FIREBASE_PROJECT_ID || "auto-7e7ce";
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

let initOptions = {
  projectId,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "auto-7e7ce.firebasestorage.app",
};

if (serviceAccountPath && fs.existsSync(path.resolve(serviceAccountPath))) {
  const serviceAccount = JSON.parse(
    fs.readFileSync(path.resolve(serviceAccountPath), "utf-8")
  );
  initOptions.credential = admin.credential.cert(serviceAccount);
} else if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
  initOptions.credential = admin.credential.cert({
    projectId,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  });
} else {
  try {
    initOptions.credential = admin.credential.applicationDefault();
  } catch {
    console.error("❌ No Firebase credentials found!");
    process.exit(1);
  }
}

if (!admin.apps.length) {
  admin.initializeApp(initOptions);
}

const adminAuth = admin.auth();
const adminDb = admin.firestore();

const email = "dhruvsutariya06@gmail.com";
const password = "123456";
const name = "Admin User";

async function addAdmin() {
  try {
    console.log(`📝 Adding admin user: ${email}`);

    // Create Firebase Auth user
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
    });

    console.log(`✅ Firebase Auth user created: ${userRecord.uid}`);

    // Create Firestore profile
    await adminDb.collection("profiles").doc(userRecord.uid).set({
      email,
      name,
      full_name: name,
      role: "admin",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    console.log(`✅ Firestore profile created`);
    console.log("\n🎉 Admin user successfully added!");
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`👤 Role: admin`);
    console.log(`🆔 UID: ${userRecord.uid}`);

    process.exit(0);
  } catch (error) {
    if (error.code === "auth/email-already-exists") {
      console.error(`❌ User already exists: ${email}`);
    } else {
      console.error("❌ Error:", error.message);
    }
    process.exit(1);
  }
}

addAdmin();
