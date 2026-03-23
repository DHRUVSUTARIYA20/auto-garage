import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import admin from "firebase-admin";
import { adminAuth, adminDb } from "../lib/firebase-admin";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

// Configure multer for garage logo uploads
const uploadsDir = path.join(process.cwd(), "public", "uploads", "garages");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = allowed.test(file.mimetype);
    cb(null, extOk && mimeOk);
  },
});

const garagesCol = () => adminDb.collection("garages");
const profilesCol = () => adminDb.collection("profiles");

// Get all garages
router.get("/", async (req, res) => {
  try {
    const snap = await garagesCol().orderBy("createdAt", "desc").get();
    const garages = await Promise.all(
      snap.docs.map(async (d) => {
        const data = d.data();
        let owner = null;
        if (data.ownerId) {
          const ownerSnap = await profilesCol().doc(data.ownerId).get();
          if (ownerSnap.exists) {
            const o = ownerSnap.data()!;
            owner = { id: ownerSnap.id, name: o.name, email: o.email };
          }
        }
        return { id: d.id, ...data, owner };
      })
    );
    res.json(garages);
  } catch (error: any) {
    console.error("GET /garages error:", error?.message || error);
    res.status(500).json({ error: error?.message || "Failed to fetch garages" });
  }
});

// Get my garage (for managers)
router.get("/my-garage", authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(400).json({ error: "User ID not found" });
    }

    const [byOwnerIdSnap, byOwnerSnakeSnap] = await Promise.all([
      garagesCol().where("ownerId", "==", userId).limit(1).get(),
      garagesCol().where("owner_id", "==", userId).limit(1).get(),
    ]);

    const doc = !byOwnerIdSnap.empty
      ? byOwnerIdSnap.docs[0]
      : !byOwnerSnakeSnap.empty
        ? byOwnerSnakeSnap.docs[0]
        : null;

    if (!doc) {
      // No garage found for this user
      return res.json(null);
    }

    const garageData = doc.data();
    
    // Get bookings for this garage.
    // Support both garageId and legacy garage_id field names.
    const bookingsCol = () => adminDb.collection("bookings");
    const [bookingsByCamelSnap, bookingsBySnakeSnap] = await Promise.all([
      bookingsCol().where("garageId", "==", doc.id).get(),
      bookingsCol().where("garage_id", "==", doc.id).get(),
    ]);

    const bookingMap = new Map<string, Record<string, unknown>>();
    for (const snap of [bookingsByCamelSnap, bookingsBySnakeSnap]) {
      snap.docs.forEach((d) => {
        bookingMap.set(d.id, { id: d.id, ...d.data() });
      });
    }

    const bookings = Array.from(bookingMap.values()).sort((a: any, b: any) => {
      const aTime = Date.parse(String(a?.createdAt || a?.created_at || "")) || 0;
      const bTime = Date.parse(String(b?.createdAt || b?.created_at || "")) || 0;
      return bTime - aTime;
    });
    
    // Get staff for this garage
    const staffCol = () => adminDb.collection("staff");
    const staffSnap = await staffCol()
      .where("garageId", "==", doc.id)
      .get();
    
    const staffPromises = staffSnap.docs.map(async (staffDoc) => {
      const staffData = staffDoc.data();
      const userDoc = await profilesCol().doc(staffData.userId).get();
      return {
        id: staffDoc.id,
        ...staffData,
        user: userDoc.exists ? { id: userDoc.id, ...userDoc.data() } : null
      };
    });
    
    const staff = await Promise.all(staffPromises);

    console.log(`[/my-garage] Garage ${doc.id}: Found ${bookings.length} bookings, ${staff.length} staff members`);
    
    res.json({ 
      id: doc.id, 
      ...garageData,
      bookings,
      staff
    });
  } catch (error: any) {
    console.error("/my-garage error:", error);
    res.status(500).json({ error: "Failed to fetch your garage. Details: " + (error?.message || error?.toString()) });
  }
});

// Get single garage
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await garagesCol().doc(id).get();
    if (!doc.exists) return res.status(404).json({ error: "Garage not found" });

    const data = doc.data()!;
    let owner = null;
    if (data.ownerId) {
      const ownerSnap = await profilesCol().doc(data.ownerId).get();
      if (ownerSnap.exists) {
        const o = ownerSnap.data()!;
        owner = { id: ownerSnap.id, name: o.name, email: o.email };
      }
    }
    res.json({ id: doc.id, ...data, owner });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch garage" });
  }
});

// Create garage
router.post("/", authenticate, upload.single("logo"), async (req: AuthRequest, res) => {
  try {
    const { garage_name, location, contact_phone, open_time, description, pickupFee, pickup_fee, deliveryFee, delivery_fee } = req.body;

    const normalizedPickupFee = Math.max(0, Number(pickupFee ?? pickup_fee ?? 299) || 0);
    const normalizedDeliveryFee = Math.max(0, Number(deliveryFee ?? delivery_fee ?? 499) || 0);

    const payload: Record<string, unknown> = {
      name: garage_name,
      location,
      contactPhone: contact_phone,
      openTime: open_time,
      description,
      pickupFee: normalizedPickupFee,
      deliveryFee: normalizedDeliveryFee,
      ownerId: req.userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // If a logo file was uploaded, store its URL
    if (req.file) {
      payload.logoUrl = `/uploads/garages/${req.file.filename}`;
    }

    const docRef = await garagesCol().add(payload);
    res.status(201).json({ id: docRef.id, ...payload });
  } catch (error: any) {
    console.error("POST /garages error:", error);
    res.status(500).json({ error: error?.message || error?.toString() || "Failed to create garage" });
  }
});

// Update garage
router.put("/:id", authenticate, upload.single("logo"), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const {
      garage_name,
      name,
      location,
      contact_phone,
      contactPhone,
      open_time,
      openTime,
      description,
      services,
      serviceCatalog,
      mechanicsCount,
      mechanics_count,
      sinceYear,
      since_year,
      problemsSolvedCount,
      problems_solved_count,
      sellsSecondHand,
      sells_second_hand,
      pickupFee,
      pickup_fee,
      deliveryFee,
      delivery_fee,
    } = req.body;

    const garageSnap = await garagesCol().doc(id).get();
    if (!garageSnap.exists) return res.status(404).json({ error: "Garage not found" });

    const garageData = garageSnap.data()!;
    const ownerId = String(garageData.ownerId ?? garageData.owner_id ?? "");
    if (ownerId !== req.userId && req.userRole !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const parseMaybeJsonArray = (value: unknown) => {
      if (value == null) return undefined;
      if (Array.isArray(value)) return value;
      if (typeof value !== "string") return undefined;
      const trimmed = value.trim();
      if (!trimmed) return [];
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed : undefined;
      } catch {
        return trimmed
          .split(",")
          .map((entry) => entry.trim())
          .filter(Boolean);
      }
    };

    const normalizedServices = parseMaybeJsonArray(services);
    const normalizedServiceCatalog = parseMaybeJsonArray(serviceCatalog);

    const updates: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (garage_name !== undefined || name !== undefined) {
      updates.name = String(garage_name ?? name ?? "").trim();
    }
    if (location !== undefined) {
      updates.location = String(location || "").trim();
    }
    if (contact_phone !== undefined || contactPhone !== undefined) {
      updates.contactPhone = String(contact_phone ?? contactPhone ?? "").trim();
    }
    if (open_time !== undefined || openTime !== undefined) {
      updates.openTime = String(open_time ?? openTime ?? "").trim();
    }
    if (description !== undefined) {
      updates.description = String(description || "").trim();
    }
    if (normalizedServices !== undefined) {
      updates.services = normalizedServices;
    }
    if (normalizedServiceCatalog !== undefined) {
      updates.serviceCatalog = normalizedServiceCatalog;
    }
    if (mechanicsCount !== undefined || mechanics_count !== undefined) {
      updates.mechanicsCount = Math.max(0, Number(mechanicsCount ?? mechanics_count ?? 0) || 0);
    }
    if (sinceYear !== undefined || since_year !== undefined) {
      const parsedYear = Number(sinceYear ?? since_year ?? 0) || 0;
      updates.sinceYear = parsedYear > 0 ? parsedYear : 0;
    }
    if (problemsSolvedCount !== undefined || problems_solved_count !== undefined) {
      updates.problemsSolvedCount = Math.max(0, Number(problemsSolvedCount ?? problems_solved_count ?? 0) || 0);
    }
    if (sellsSecondHand !== undefined || sells_second_hand !== undefined) {
      const flag = sellsSecondHand ?? sells_second_hand;
      if (typeof flag === "string") {
        const normalized = flag.trim().toLowerCase();
        updates.sellsSecondHand = normalized === "true" || normalized === "1" || normalized === "yes";
      } else {
        updates.sellsSecondHand = Boolean(flag);
      }
    }
    if (pickupFee !== undefined || pickup_fee !== undefined) {
      updates.pickupFee = Math.max(0, Number(pickupFee ?? pickup_fee ?? 0) || 0);
    }
    if (deliveryFee !== undefined || delivery_fee !== undefined) {
      updates.deliveryFee = Math.max(0, Number(deliveryFee ?? delivery_fee ?? 0) || 0);
    }

    // If a new logo was uploaded, update it
    if (req.file) {
      updates.logoUrl = `/uploads/garages/${req.file.filename}`;
    }

    await garagesCol().doc(id).update(updates);
    const updatedSnap = await garagesCol().doc(id).get();
    res.json({ id: updatedSnap.id, ...updatedSnap.data() });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to update garage" });
  }
});

// Admin: Create garage with owner details
router.post("/admin/create-with-owner", authenticate, upload.single("logo"), async (req: AuthRequest, res) => {
  try {
    console.log("\n📨 [/admin/create-with-owner] Request received");
    console.log("   User ID:", req.userId);
    console.log("   User Role:", req.userRole);
    console.log("   Content-Type:", req.headers["content-type"]);
    console.log("   Body keys:", Object.keys(req.body));
    console.log("   Full body:", JSON.stringify(req.body, null, 2));
    console.log("   File:", req.file ? { filename: req.file.filename, size: req.file.size } : "none");
    
    // Check if user is admin
    if (req.userRole !== "admin") {
      console.log("❌ Not admin, user role is:", req.userRole);
      return res.status(403).json({ error: "Only admins can create garages with owner details" });
    }

    const {
      garageName,
      garageLocation,
      garageContactPhone,
      garageOpenTime,
      garageDescription,
      ownerEmail,
      ownerPassword,
      ownerMobileNumber,
      ownerName,
    } = req.body;

    // Validate required fields with detailed error messages
    const missingFields = [];
    if (!garageName) missingFields.push("Garage name");
    if (!ownerEmail) missingFields.push("Owner email");
    if (!ownerPassword) missingFields.push("Owner password");
    if (!ownerMobileNumber) missingFields.push("Owner mobile number");
    if (!ownerName) missingFields.push("Owner name");

    if (missingFields.length > 0) {
      console.log("❌ Missing fields:", missingFields);
      console.log("📦 Received body:", req.body);
      return res.status(400).json({ 
        error: `Missing required fields: ${missingFields.join(", ")}`,
        missingFields 
      });
    }

    // Create Firebase user for garage owner
    let ownerUid: string;
    try {
      const userRecord = await adminAuth.createUser({
        email: ownerEmail.trim().toLowerCase(),
        password: ownerPassword,
        displayName: ownerName.trim(),
      });
      ownerUid = userRecord.uid;
    } catch (error: any) {
      const code = error?.code || "";
      if (code === "auth/email-already-exists") {
        return res.status(400).json({ error: "This email is already registered" });
      }
      return res.status(400).json({ error: error?.message || "Failed to create user account" });
    }

    // Create profile for garage owner
    try {
      await profilesCol().doc(ownerUid).set({
        email: ownerEmail.trim().toLowerCase(),
        name: ownerName.trim(),
        full_name: ownerName.trim(),
        mobileNumber: ownerMobileNumber.trim(),
        role: "manager",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error: any) {
      // Clean up the created user if profile creation fails
      await adminAuth.deleteUser(ownerUid);
      return res.status(500).json({ error: "Failed to create owner profile" });
    }

    // Create garage
    const garagePayload: Record<string, unknown> = {
      name: garageName.trim(),
      location: garageLocation?.trim() || "Not specified",
      contactPhone: garageContactPhone?.trim() || null,
      openTime: garageOpenTime?.trim() || "Not specified",
      description: garageDescription?.trim() || null,
      pickupFee: 299,
      deliveryFee: 499,
      ownerId: ownerUid,
      ownerEmail: ownerEmail.trim().toLowerCase(),
      ownerMobileNumber: ownerMobileNumber.trim(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Add image URL if uploaded
    if (req.file) {
      garagePayload.logoUrl = `/uploads/garages/${req.file.filename}`;
    }

    const docRef = await garagesCol().add(garagePayload);

    res.status(201).json({ 
      id: docRef.id, 
      ...garagePayload,
      message: `Garage created successfully. Owner can login with email: ${ownerEmail} or mobile: ${ownerMobileNumber}`
    });
  } catch (error: any) {
    console.error("Admin create garage error:", error);
    res.status(500).json({ error: error?.message || "Failed to create garage" });
  }
});

// Delete garage
router.delete("/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const garageSnap = await garagesCol().doc(id).get();
    if (!garageSnap.exists) return res.status(404).json({ error: "Garage not found" });

    const garageData = garageSnap.data()!;
    const ownerId = String(garageData.ownerId ?? garageData.owner_id ?? "");
    if (ownerId !== req.userId && req.userRole !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await garagesCol().doc(id).delete();
    res.json({ message: "Garage deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to delete garage" });
  }
});

export default router;
