import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { adminAuth, adminDb } from "../lib/firebase-admin";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

const profilesCol = () => adminDb.collection("profiles");
const garagesCol = () => adminDb.collection("garages");
const staffCol = () => adminDb.collection("staff");
const tasksCol = () => adminDb.collection("tasks");
const timeLogsCol = () => adminDb.collection("time_logs");
const inventoryCol = () => adminDb.collection("inventory");

// Configure multer for staff profile uploads
const uploadsDir = path.join(process.cwd(), "public", "uploads", "staff");
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
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|webp/;
        const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
        const mimeOk = allowed.test(file.mimetype);
        cb(null, extOk && mimeOk);
    },
});

const isManagerOrAdmin = (role?: string) => {
    const normalized = String(role || "").toLowerCase();
    return normalized === "manager" || normalized === "admin";
};

const isAdmin = (role?: string) => String(role || "").toLowerCase() === "admin";

const getStaffRecordByUserId = async (userId?: string) => {
    if (!userId) return null;
    const snap = await staffCol().where("userId", "==", userId).limit(1).get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return { id: doc.id, garageId: doc.data().garageId, ...doc.data() };
};

// Upload staff profile image to backend storage
router.post("/upload-profile-image", authenticate, upload.single("image"), async (req: AuthRequest, res) => {
    try {
        const normalizedRole = String(req.userRole || "").toLowerCase();
        if (normalizedRole !== "manager" && normalizedRole !== "admin") {
            return res.status(403).json({ error: "Only garage owner or admin can upload staff profile images" });
        }

        if (!req.file) {
            return res.status(400).json({ error: "Image file is required" });
        }

        const imageUrl = `/uploads/staff/${req.file.filename}`;
        res.status(201).json({ imageUrl });
    } catch (error: any) {
        console.error("Upload profile image error:", error?.message || error);
        res.status(500).json({ error: "Failed to upload profile image" });
    }
});

// Create staff user and attach to manager's garage
router.post("/create", authenticate, async (req: AuthRequest, res) => {
    try {
        const normalizedRole = String(req.userRole || "").toLowerCase();
        if (normalizedRole !== "manager" && normalizedRole !== "admin") {
            return res.status(403).json({ error: "Only garage owner or admin can create staff" });
        }

        const {
            name,
            emailId,
            mobileNumber,
            address,
            password,
            services,
            experienceYears,
            yearOfJoin,
            salary,
            profilePicUrl,
        } = req.body;

        const normalizedName = String(name || "").trim();
        const normalizedEmail = String(emailId || "").trim().toLowerCase();
        const normalizedMobile = String(mobileNumber || "").trim();
        const normalizedAddress = String(address || "").trim();
        const normalizedPassword = String(password || "");
        const normalizedServices = String(services || "").trim();

        if (!normalizedName || !normalizedEmail || !normalizedMobile || !normalizedAddress || !normalizedPassword || !normalizedServices) {
            return res.status(400).json({ error: "Name, email, mobile, address, password and services are required" });
        }

        if (normalizedPassword.length < 6) {
            return res.status(400).json({ error: "Password must be at least 6 characters" });
        }

        let garageId = String(req.body.garageId || "").trim();

        // Managers default to their own garage if garageId is not provided.
        // Support both ownerId and legacy owner_id field names.
        if (!garageId) {
            if (normalizedRole === "admin") {
                return res.status(400).json({ error: "garageId is required for admin" });
            }

            const [myGarageByOwnerIdSnap, myGarageByOwnerSnakeSnap] = await Promise.all([
                garagesCol().where("ownerId", "==", req.userId).limit(1).get(),
                garagesCol().where("owner_id", "==", req.userId).limit(1).get(),
            ]);

            const myGarageDoc = !myGarageByOwnerIdSnap.empty
                ? myGarageByOwnerIdSnap.docs[0]
                : !myGarageByOwnerSnakeSnap.empty
                    ? myGarageByOwnerSnakeSnap.docs[0]
                    : null;

            if (!myGarageDoc) {
                return res.status(404).json({ error: "Garage not found for this account" });
            }
            garageId = myGarageDoc.id;
        }

        const garageSnap = await garagesCol().doc(garageId).get();
        if (!garageSnap.exists) {
            return res.status(404).json({ error: "Garage not found" });
        }

        if (normalizedRole === "manager") {
            const garageData = garageSnap.data()!;
            if (garageData.ownerId !== req.userId) {
                return res.status(403).json({ error: "Unauthorized for this garage" });
            }
        }

        let userRecord;
        let usedExistingUser = false;
        try {
            userRecord = await adminAuth.createUser({
                email: normalizedEmail,
                password: normalizedPassword,
                displayName: normalizedName,
            });
        } catch (err: any) {
            if (String(err?.code || "") === "auth/email-already-exists") {
                try {
                    userRecord = await adminAuth.getUserByEmail(normalizedEmail);
                    usedExistingUser = true;
                } catch {
                    return res.status(400).json({ error: "Staff email already exists but user could not be resolved" });
                }
            } else {
                return res.status(400).json({ error: err?.message || "Failed to create staff user" });
            }
        }

        const now = new Date().toISOString();

        await profilesCol().doc(userRecord.uid).set({
            email: normalizedEmail,
            name: normalizedName,
            full_name: normalizedName,
            mobileNumber: normalizedMobile,
            phone: normalizedMobile,
            address: normalizedAddress,
            role: "staff",
            createdAt: now,
            updatedAt: now,
        }, { merge: true });

        const existingStaffSnap = await staffCol()
            .where("userId", "==", userRecord.uid)
            .where("garageId", "==", garageId)
            .limit(1)
            .get();

        if (!existingStaffSnap.empty) {
            const existing = existingStaffSnap.docs[0];
            await existing.ref.update({
                ownerId: req.userId,
                name: normalizedName,
                emailId: normalizedEmail,
                mobileNumber: normalizedMobile,
                address: normalizedAddress,
                services: normalizedServices,
                experienceYears: Number.isFinite(Number(experienceYears)) ? Number(experienceYears) : null,
                yearOfJoin: Number.isFinite(Number(yearOfJoin)) ? Number(yearOfJoin) : null,
                salary: Number.isFinite(Number(salary)) ? Number(salary) : null,
                profilePicUrl: profilePicUrl || null,
                updatedAt: now,
            });

            return res.status(200).json({
                id: existing.id,
                userId: userRecord.uid,
                garageId,
                name: normalizedName,
                emailId: normalizedEmail,
                message: usedExistingUser
                    ? "Existing user linked to staff in this garage"
                    : "Staff record updated",
            });
        }

        const staffDoc = {
            userId: userRecord.uid,
            garageId,
            ownerId: req.userId,
            name: normalizedName,
            emailId: normalizedEmail,
            mobileNumber: normalizedMobile,
            address: normalizedAddress,
            services: normalizedServices,
            experienceYears: Number.isFinite(Number(experienceYears)) ? Number(experienceYears) : null,
            yearOfJoin: Number.isFinite(Number(yearOfJoin)) ? Number(yearOfJoin) : null,
            salary: Number.isFinite(Number(salary)) ? Number(salary) : null,
            profilePicUrl: profilePicUrl || null,
            createdAt: now,
            updatedAt: now,
        };

        const staffRef = await staffCol().add(staffDoc);

        res.status(201).json({
            id: staffRef.id,
            userId: userRecord.uid,
            garageId,
            name: normalizedName,
            emailId: normalizedEmail,
            message: usedExistingUser
                ? "Existing user linked to staff in this garage"
                : "Staff created successfully",
        });
    } catch (error: any) {
        console.error("Create staff error:", error?.message || error);
        res.status(500).json({ error: "Failed to create staff" });
    }
});

// Add staff to garage
router.post("/garage-staff", authenticate, async (req: AuthRequest, res) => {
    try {
        const { userId, garageId } = req.body;

        const garageSnap = await garagesCol().doc(garageId).get();
        if (!garageSnap.exists) return res.status(404).json({ error: "Garage not found" });
        const garageData = garageSnap.data()!;
        if (garageData.ownerId !== req.userId && req.userRole !== "admin") {
            return res.status(403).json({ error: "Unauthorized" });
        }

        const docRef = await staffCol().add({
            userId,
            garageId,
            createdAt: new Date().toISOString(),
        });

        // Update user role to staff if customer
        const profileSnap = await profilesCol().doc(userId).get();
        if (profileSnap.exists && profileSnap.data()?.role === "customer") {
            await profilesCol().doc(userId).update({ role: "staff" });
        }

        res.status(201).json({ id: docRef.id, userId, garageId });
    } catch (error: any) {
        res.status(500).json({ error: "Failed to add staff" });
    }
});

// Remove staff from garage
router.delete("/garage-staff/:userId", authenticate, async (req: AuthRequest, res) => {
    try {
        const { userId } = req.params;
        const garageId = String(req.query.garageId || "");

        if (!userId || !garageId) {
            return res.status(400).json({ error: "userId and garageId are required" });
        }

        const garageSnap = await garagesCol().doc(garageId).get();
        if (!garageSnap.exists) return res.status(404).json({ error: "Garage not found" });
        const garageData = garageSnap.data()!;
        if (garageData.ownerId !== req.userId && !isAdmin(req.userRole)) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        // Delete staff doc
        const staffSnap = await staffCol()
            .where("userId", "==", userId)
            .where("garageId", "==", garageId)
            .get();

        const batch = adminDb.batch();
        staffSnap.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();

        // Check remaining staff records
        const remaining = await staffCol().where("userId", "==", userId).get();

        if (remaining.empty) {
            const profileSnap = await profilesCol().doc(userId).get();
            if (profileSnap.exists && profileSnap.data()?.role === "staff") {
                await profilesCol().doc(userId).update({ role: "customer" });
            }
        }

        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: "Failed to remove staff" });
    }
});

// Get staff for a specific garage
router.get("/garage-staff/:garageId", authenticate, async (req: AuthRequest, res) => {
    try {
        const { garageId } = req.params;

        const snap = await staffCol().where("garageId", "==", garageId).get();
        const staffList = await Promise.all(
            snap.docs.map(async (d) => {
                const data = d.data();
                const profileSnap = await profilesCol().doc(data.userId).get();
                const user = profileSnap.exists
                    ? { id: profileSnap.id, ...profileSnap.data() }
                    : null;
                return { id: d.id, ...data, user };
            })
        );

        res.json(staffList);
    } catch (error: any) {
        res.status(500).json({ error: "Failed to fetch staff" });
    }
});

// Get staff profile
router.get("/profile/:userId", authenticate, async (req: AuthRequest, res) => {
    try {
        const { userId } = req.params;

        if (req.userId !== userId && !isManagerOrAdmin(req.userRole)) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        const profileSnap = await profilesCol().doc(userId).get();
        if (!profileSnap.exists) return res.json({ id: userId });

        const data = profileSnap.data()!;
        res.json({
            id: profileSnap.id,
            name: data.name,
            full_name: data.full_name,
            phone: data.phone,
            role: data.role,
        });
    } catch (error: any) {
        res.status(500).json({ error: "Failed to fetch profile" });
    }
});

// Get staff member's garage info
router.get("/my-garage", authenticate, async (req: AuthRequest, res) => {
    try {
        if (req.userRole !== "staff") {
            return res.status(403).json({ error: "Only staff can access this" });
        }

        const staffRecord = await getStaffRecordByUserId(req.userId);
        if (!staffRecord) {
            return res.status(404).json({ error: "Staff record not found" });
        }

        const garageSnap = await garagesCol().doc(staffRecord.garageId).get();
        if (!garageSnap.exists) {
            return res.status(404).json({ error: "Garage not found" });
        }

        const garageData = garageSnap.data()!;
        res.json({
            id: garageSnap.id,
            name: garageData.name,
            location: garageData.location,
            address: garageData.address,
            phone: garageData.phone,
            email: garageData.email,
            logo: garageData.logo,
            ownerId: garageData.ownerId,
        });
    } catch (error: any) {
        console.error("Get staff garage error:", error?.message || error);
        res.status(500).json({ error: "Failed to fetch garage info" });
    }
});

// Get time logs
router.get("/time-logs", authenticate, async (req: AuthRequest, res) => {
    try {
        const staffRecord = await getStaffRecordByUserId(req.userId);

        let q: FirebaseFirestore.Query = timeLogsCol().orderBy("workDate", "desc");

        if (staffRecord && String(req.userRole || "").toLowerCase() === "staff") {
            q = q.where("staffId", "==", staffRecord.id);
        }

        const snap = await q.get();
        const logs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        res.json(logs);
    } catch (error: any) {
        res.status(500).json({ error: "Failed to fetch time logs" });
    }
});

// Get inventory
router.get("/inventory", authenticate, async (req: AuthRequest, res) => {
    try {
        const role = String(req.userRole || "").toLowerCase();
        let q: FirebaseFirestore.Query = inventoryCol().orderBy("createdAt", "desc");

        if (role === "staff") {
            const staffRecord = await getStaffRecordByUserId(req.userId);
            if (!staffRecord) return res.json([]);
            q = q.where("garageId", "==", staffRecord.garageId);
        }

        const snap = await q.get();
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        res.json(items);
    } catch (error: any) {
        res.status(500).json({ error: "Failed to fetch inventory" });
    }
});

// Create work order / task
router.post("/work-orders", authenticate, async (req: AuthRequest, res) => {
    try {
        if (!isManagerOrAdmin(req.userRole)) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        const { booking_id, staff_id, description } = req.body;

        const payload = {
            bookingId: booking_id,
            staffId: staff_id,
            description,
            taskStatus: "pending",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const docRef = await tasksCol().add(payload);
        res.status(201).json({ id: docRef.id, ...payload });
    } catch (error: any) {
        res.status(500).json({ error: "Failed to create work order" });
    }
});

// Get all tasks
router.get("/work-orders", authenticate, async (req: AuthRequest, res) => {
    try {
        const includeAll = String(req.query.all || "") === "1";

        let q: FirebaseFirestore.Query = tasksCol().orderBy("createdAt", "desc");

        if (String(req.userRole || "").toLowerCase() === "staff" || !includeAll) {
            const staffRecord = await getStaffRecordByUserId(req.userId);
            if (staffRecord) {
                q = q.where("staffId", "==", staffRecord.id);
            } else {
                return res.json([]);
            }
        }

        const snap = await q.get();
        const tasks = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        res.json(tasks);
    } catch (error: any) {
        res.status(500).json({ error: "Failed to fetch work orders" });
    }
});

// Update task status
router.patch("/work-orders/:id", authenticate, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const { task_status } = req.body;

        const taskSnap = await tasksCol().doc(id).get();
        if (!taskSnap.exists) return res.status(404).json({ error: "Work order not found" });

        const taskData = taskSnap.data()!;
        const role = String(req.userRole || "").toLowerCase();
        let canUpdate = role === "admin" || role === "manager";

        if (!canUpdate && role === "staff") {
            const staffRecord = await getStaffRecordByUserId(req.userId);
            canUpdate = Boolean(staffRecord && staffRecord.id === taskData.staffId);
        }

        if (!canUpdate) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        await tasksCol().doc(id).update({
            taskStatus: task_status,
            updatedAt: new Date().toISOString(),
        });

        const updatedSnap = await tasksCol().doc(id).get();
        res.json({ id: updatedSnap.id, ...updatedSnap.data() });
    } catch (error: any) {
        res.status(500).json({ error: "Failed to update task" });
    }
});

export default router;
