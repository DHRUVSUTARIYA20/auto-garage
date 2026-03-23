import admin from "firebase-admin";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const rootPath = path.resolve(__dirname);

dotenv.config({ path: path.join(rootPath, ".env.local") });

const projectId = process.env.FIREBASE_PROJECT_ID || "auto-7e7ce";
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

let initOptions = { projectId };

if (serviceAccountPath && fs.existsSync(path.resolve(serviceAccountPath))) {
  const serviceAccount = JSON.parse(fs.readFileSync(path.resolve(serviceAccountPath), "utf-8"));
  initOptions.credential = admin.credential.cert(serviceAccount);
} else if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
  initOptions.credential = admin.credential.cert({
    projectId,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  });
}

if (!admin.apps.length) {
  admin.initializeApp(initOptions);
}

const adminDb = admin.firestore();
const profilesCol = () => adminDb.collection("profiles");

async function checkAdmin() {
  try {
    const snap = await profilesCol().where("email", "==", "dhruvsutariya06@gmail.com").get();
    
    if (snap.empty) {
      console.log("❌ Admin user not found!");
      process.exit(1);
    }
    
    const doc = snap.docs[0];
    const data = doc.data();
    
    console.log("✅ Admin user found!");
    console.log(`   UID: ${doc.id}`);
    console.log(`   Email: ${data.email}`);
    console.log(`   Role: ${data.role}`);
    console.log(`   Name: ${data.name || data.full_name}`);
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

checkAdmin();
