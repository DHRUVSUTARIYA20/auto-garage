import fs from "fs";
import path from "path";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const loadEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const content = fs.readFileSync(filePath, "utf8");
  return content.split("\n").reduce((acc, line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      return acc;
    }
    const [key, ...rest] = trimmed.split("=");
    if (!key) {
      return acc;
    }
    acc[key] = rest.join("=").trim();
    return acc;
  }, {});
};

const envPath = path.resolve(process.cwd(), ".env.local");
const env = loadEnvFile(envPath);

// Initialize Firebase Admin
const serviceAccountPath = env.FIREBASE_SERVICE_ACCOUNT_PATH;
let adminApp;

if (getApps().length === 0) {
  const resolvedPath = serviceAccountPath ? path.resolve(process.cwd(), serviceAccountPath) : null;
  if (resolvedPath && fs.existsSync(resolvedPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, "utf8"));
    console.log(`Using service account: ${serviceAccount.client_email} (project: ${serviceAccount.project_id})`);
    adminApp = initializeApp({ credential: cert(serviceAccount) });
  } else if (env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) {
    adminApp = initializeApp({
      credential: cert({
        projectId: env.FIREBASE_PROJECT_ID || "auto-7e7ce",
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
    });
  } else {
    console.error("Missing Firebase credentials. Set FIREBASE_SERVICE_ACCOUNT_PATH in .env.local");
    console.error("Tried path:", resolvedPath, "exists:", resolvedPath ? fs.existsSync(resolvedPath) : false);
    process.exit(1);
  }
} else {
  adminApp = getApps()[0];
}

const adminAuth = getAuth(adminApp);
const adminDb = getFirestore(adminApp);

const staffUsers = [
  // Staff/role accounts
  { email: "admin@garage.com", password: "admin123", role: "admin", full_name: "Admin User" },
  { email: "advisor@garage.com", password: "advisor123", role: "service_advisor", full_name: "Service Advisor" },
  { email: "senior@garage.com", password: "senior123", role: "senior_mechanic", full_name: "Senior Mechanic" },
  { email: "junior@garage.com", password: "junior123", role: "junior_mechanic", full_name: "Junior Mechanic" },
  { email: "pickup@garage.com", password: "pickup123", role: "pickup_driver", full_name: "Pickup Driver" },
  { email: "sales@garage.com", password: "sales123", role: "car_seller", full_name: "Car Seller" },
  // Demo login accounts
  { email: "admin@autogarage.local", password: "Admin@123", role: "admin", full_name: "Demo Admin" },
  { email: "manager@autogarage.local", password: "Manager@123", role: "manager", full_name: "Demo Manager" },
  { email: "staff@autogarage.local", password: "Staff@123", role: "staff", full_name: "Demo Staff" },
  { email: "customer@autogarage.local", password: "Customer@123", role: "customer", full_name: "Demo Customer" },
];

const ensureUser = async (staff) => {
  try {
    const user = await adminAuth.createUser({
      email: staff.email,
      password: staff.password,
      displayName: staff.full_name,
      emailVerified: true,
    });
    return user;
  } catch (error) {
    if (error.code === "auth/email-already-exists") {
      const existing = await adminAuth.getUserByEmail(staff.email);
      return existing;
    }
    console.error(`Error creating ${staff.email}: code=${error.code}, message=${error.message}`);
    throw error;
  }
};

const upsertProfile = async (userId, staff) => {
  await adminDb.collection("profiles").doc(userId).set(
    {
      role: staff.role,
      full_name: staff.full_name,
      email: staff.email,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
};

const seed = async () => {
  for (const staff of staffUsers) {
    const user = await ensureUser(staff);
    if (!user) {
      console.error(`Failed to create or find user for ${staff.email}`);
      continue;
    }
    await upsertProfile(user.uid, staff);
    console.log(`Seeded ${staff.email} (${staff.role})`);
  }
};

seed().catch((error) => {
  console.error("Seed failed:", error.message || error);
  process.exit(1);
});
