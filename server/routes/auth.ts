import { Router, type Response } from "express";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import fs from "fs";
import { adminAuth, adminDb } from "../lib/firebase-admin";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
// Keep in sync with frontend demo credentials in `src/lib/defaultCredentials.ts`
// and older docs that may use a different admin email.
// `DEFAULT_ADMIN_EMAIL` can be a comma-separated list.
const DEFAULT_ADMIN_EMAILS = (process.env.DEFAULT_ADMIN_EMAIL || "admin@autogarage.local,admin@garage.com")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const isAdminEmail = (email?: string | null) => {
  const normalized = String(email || "").trim().toLowerCase();
  return DEFAULT_ADMIN_EMAILS.some((v) => v.toLowerCase() === normalized);
};

const normalizeRole = (value?: string | null, fallback: string = "customer") => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "admin") return "admin";
  if (normalized === "manager") return "manager";
  if (normalized === "staff" || normalized === "mechanic") return "staff";
  if (normalized === "customer" || normalized === "user") return "customer";
  return fallback;
};

const buildAuthCookieOptions = (rememberMe: boolean) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
});

const profilesCol = () => adminDb.collection("profiles");

const profileUploadsDir = path.join(process.cwd(), "public", "uploads", "profiles");
if (!fs.existsSync(profileUploadsDir)) {
  fs.mkdirSync(profileUploadsDir, { recursive: true });
}

const profileUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, profileUploadsDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `profile-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = allowed.test(file.mimetype);
    cb(null, extOk && mimeOk);
  },
});

// Login – accepts { email } or { mobileNumber } with password, or { idToken }
router.post("/login", async (req, res) => {
  try {
    const { email, mobileNumber, password, rememberMe, idToken } = req.body;

    if (!email && !mobileNumber && !idToken) {
      return res.status(400).json({ error: "Email, mobile number, or idToken required" });
    }

    let uid: string;
    let userEmail: string;

    if (idToken) {
      const decoded = await adminAuth.verifyIdToken(idToken);
      uid = decoded.uid;
      userEmail = decoded.email || email || "";
    } else if (email) {
      try {
        const userRecord = await adminAuth.getUserByEmail(email);
        uid = userRecord.uid;
        userEmail = userRecord.email || email;
      } catch {
        return res.status(401).json({ error: "Invalid credentials" });
      }
    } else if (mobileNumber) {
      // Look up user by mobile number in profiles collection
      try {
        const profileSnap = await profilesCol()
          .where("mobileNumber", "==", mobileNumber.trim())
          .limit(1)
          .get();
        
        if (profileSnap.empty) {
          return res.status(401).json({ error: "Invalid credentials" });
        }
        
        const profileDoc = profileSnap.docs[0];
        uid = profileDoc.id;
        userEmail = profileDoc.data().email || `user_${uid}@autogarage.local`;
      } catch (error) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
    } else {
      return res.status(400).json({ error: "Email, mobile number, or idToken required" });
    }

    const profileSnap = await profilesCol().doc(uid).get();
    const profileData = profileSnap.exists ? profileSnap.data() : null;

    const role = normalizeRole(profileData?.role, isAdminEmail(userEmail) ? "admin" : "customer");
    const name = profileData?.name || profileData?.full_name || "User";

    const token = jwt.sign(
      { userId: uid, email: userEmail, name, role },
      JWT_SECRET,
      { expiresIn: rememberMe ? "30d" : "1d" }
    );

    res.cookie("token", token, buildAuthCookieOptions(Boolean(rememberMe)));

    res.json({ user: { id: uid, email: userEmail, name, role } });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedName = String(name || "").trim() || "User";
    const role = isAdminEmail(normalizedEmail) ? "admin" : "customer";

    let userRecord;
    try {
      userRecord = await adminAuth.createUser({
        email: normalizedEmail,
        password,
        displayName: normalizedName,
      });
    } catch (err: any) {
      const code = err?.code || "";
      if (code === "auth/email-already-exists") {
        return res.status(400).json({ error: "User already registered" });
      }
      return res.status(400).json({ error: err?.message || "Registration failed" });
    }

    await profilesCol().doc(userRecord.uid).set({
      email: normalizedEmail,
      name: normalizedName,
      full_name: normalizedName,
      role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const token = jwt.sign(
      { userId: userRecord.uid, email: normalizedEmail, name: normalizedName, role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, buildAuthCookieOptions(true));

    res.json({
      user: { id: userRecord.uid, email: normalizedEmail, name: normalizedName, role },
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get current user
router.get("/me", authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) return res.json({ user: null });

    const profileSnap = await profilesCol().doc(req.userId).get();
    if (!profileSnap.exists) return res.json({ user: null });

    const profile = profileSnap.data()!;
    res.json({
      user: {
        id: profileSnap.id,
        email: profile.email,
        name: profile.name || profile.full_name,
        role: profile.role,
      },
    });
  } catch (error) {
    res.json({ user: null });
  }
});

// Get full profile details for the logged-in user
router.get("/profile", authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) return res.status(400).json({ error: "User not found" });

    const profileSnap = await profilesCol().doc(req.userId).get();
    if (!profileSnap.exists) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const profile = profileSnap.data() || {};
    res.json({
      id: profileSnap.id,
      email: profile.email || req.userEmail || "",
      name: profile.name || profile.full_name || "",
      full_name: profile.full_name || profile.name || "",
      role: profile.role || req.userRole || "customer",
      mobileNumber: profile.mobileNumber || "",
      addressLine1: profile.addressLine1 || "",
      addressLine2: profile.addressLine2 || "",
      city: profile.city || "",
      state: profile.state || "",
      country: profile.country || "",
      pincode: profile.pincode || "",
      bio: profile.bio || "",
      photoUrl: profile.photoUrl || "",
    });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// Upload profile image
router.post("/upload-profile-image", authenticate, profileUpload.single("image"), async (req: AuthRequest, res) => {
  try {
    if (!req.userId) return res.status(400).json({ error: "User not found" });
    if (!req.file) return res.status(400).json({ error: "Image file is required" });

    const imageUrl = `/uploads/profiles/${req.file.filename}`;
    await profilesCol().doc(req.userId).set(
      {
        photoUrl: imageUrl,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    res.status(201).json({ imageUrl });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to upload profile image" });
  }
});

// Logout
router.post("/logout", (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Failed to logout" });
  }
});

// Update profile
router.patch("/update-profile", authenticate, async (req: AuthRequest, res) => {
  try {
    const {
      name,
      full_name,
      mobileNumber,
      addressLine1,
      addressLine2,
      city,
      state,
      country,
      pincode,
      bio,
      photoUrl,
    } = req.body;

    const updates: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (name !== undefined) updates.name = String(name || "").trim();
    if (full_name !== undefined) updates.full_name = String(full_name || "").trim();
    if (mobileNumber !== undefined) updates.mobileNumber = String(mobileNumber || "").trim();
    if (addressLine1 !== undefined) updates.addressLine1 = String(addressLine1 || "").trim();
    if (addressLine2 !== undefined) updates.addressLine2 = String(addressLine2 || "").trim();
    if (city !== undefined) updates.city = String(city || "").trim();
    if (state !== undefined) updates.state = String(state || "").trim();
    if (country !== undefined) updates.country = String(country || "").trim();
    if (pincode !== undefined) updates.pincode = String(pincode || "").trim();
    if (bio !== undefined) updates.bio = String(bio || "").trim();
    if (photoUrl !== undefined) updates.photoUrl = String(photoUrl || "").trim();

    await profilesCol().doc(req.userId!).set(updates, { merge: true });

    if (typeof updates.name === "string" && updates.name) {
      await adminAuth.updateUser(req.userId!, { displayName: updates.name as string });
    }

    const snap = await profilesCol().doc(req.userId!).get();
    res.json({ id: snap.id, ...snap.data() });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// Admin: Get all users
router.get("/users", authenticate, async (req: AuthRequest, res) => {
  if (req.userRole !== "admin") return res.status(403).json({ error: "Unauthorized" });

  try {
    const snap = await profilesCol().orderBy("createdAt", "desc").get();
    const users = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json(users);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Admin: Update user role
router.patch("/users/:id/role", authenticate, async (req: AuthRequest, res) => {
  if (req.userRole !== "admin") return res.status(403).json({ error: "Unauthorized" });

  const { id } = req.params;
  const { role } = req.body;

  try {
    await profilesCol().doc(id).update({ role, updatedAt: new Date().toISOString() });
    const snap = await profilesCol().doc(id).get();
    res.json({ id: snap.id, ...snap.data() });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
