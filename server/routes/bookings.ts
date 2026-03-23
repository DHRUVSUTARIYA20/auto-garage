import { Router } from "express";
import { adminDb } from "../lib/firebase-admin";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

const bookingsCol = () => adminDb.collection("bookings");
const garagesCol = () => adminDb.collection("garages");

const normalizeStatus = (value?: string) => {
    const normalized = String(value || "pending").trim().toLowerCase();
    if (normalized === "in-progress") return "in progress";
    return normalized;
};

const sortByCreatedAtDesc = (rows: Array<Record<string, any>>) =>
    rows.sort((a, b) => {
        const aTime = Date.parse(String(a.createdAt || "")) || 0;
        const bTime = Date.parse(String(b.createdAt || "")) || 0;
        return bTime - aTime;
    });

const getBookingsList = async (customerId?: string) => {
    try {
        console.log("\n🔍 [getBookingsList] Starting query");
        console.log("   Input customerId:", customerId);
        console.log("   Type:", typeof customerId);
        
        if (!customerId) {
            console.log("   No customerId provided, fetching all bookings for admin");
            const snap = await bookingsCol().get();
            const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            const sorted = sortByCreatedAtDesc(rows);
            console.log("   ✅ Total bookings fetched:", sorted.length);
            return sorted;
        }
        
        // Query with customerId field (new format)
        console.log("\n   Step 1: Trying customerId field query");
        const q1 = bookingsCol().where("customerId", "==", customerId);
        const snap = await q1.get();
        console.log("   ✅ customerId query returned:", snap.size, "documents");
        
        if (!snap.empty) {
            console.log("   🎯 Found bookings with customerId field!");
            const results = snap.docs.map((d) => {
                const data = d.data();
                console.log("      - Booking ID:", d.id, "Status:", data.status, "Name:", data.name);
                return { id: d.id, ...data };
            });
            const sorted = sortByCreatedAtDesc(results);
            console.log("   Total returned:", sorted.length);
            return sorted;
        }
        
        // If not found with customerId, try userId field (legacy format)
        console.log("\n   Step 2: No results with customerId, trying userId field");
        const q2 = bookingsCol().where("userId", "==", customerId);
        const snap2 = await q2.get();
        console.log("   ✅ userId query returned:", snap2.size, "documents");
        
        if (!snap2.empty) {
            console.log("   🎯 Found bookings with userId field!");
            const results = snap2.docs.map((d) => {
                const data = d.data();
                console.log("      - Booking ID:", d.id, "Status:", data.status, "Name:", data.name);
                return { id: d.id, ...data };
            });
            const sorted = sortByCreatedAtDesc(results);
            console.log("   Total returned:", sorted.length);
            return sorted;
        }
        
        // If still not found, list ALL bookings to see what's there
        console.log("\n   Step 3: No bookings found with either field");
        console.log("   📋 Scanning ALL bookings in database to debug...");
        const allQ = bookingsCol().limit(20);
        const allSnap = await allQ.get();
        console.log("   Total bookings in database:", allSnap.size);
        
        if (allSnap.size > 0) {
            console.log("   Sample bookings:");
            allSnap.docs.forEach((d, i) => {
                const data = d.data();
                console.log(`      ${i + 1}. customerId="${data.customerId}" userId="${data.userId}" name="${data.name}"`);
                if (i === 4) console.log("      ...(showing 5 samples)");
            });
        } else {
            console.log("   ⚠️ NO BOOKINGS IN DATABASE AT ALL!");
        }
        
        console.log("\n❌ [getBookingsList] Returning empty array");
        return [];
    } catch (error: any) {
        console.error("\n❌ [getBookingsList] ERROR:", error?.message || error);
        console.error("   Stack:", error?.stack);
        return [];
    }
};

// Create booking
router.post("/", authenticate, async (req: AuthRequest, res) => {
    try {
        console.log("📝 [POST /bookings] Creating booking");
        console.log("   userId (customerId):", req.userId);
        console.log("   userRole:", req.userRole);
        console.log("   Body:", JSON.stringify(req.body, null, 2));
        
        const {
            trackingId, name, email, phone, vehicle, services,
            date, time, deliveryOption, deliveryFee, homeAddress,
            subtotal, total, status, garage_id, garageId, service_id, service_date, total_price,
        } = req.body;

        const normalizedStatus = normalizeStatus(status || "pending");
        const normalizedGarageId = String(garageId || garage_id || "").trim() || null;

        const bookingPayload: Record<string, unknown> = {
            trackingId: trackingId || null,
            customerId: req.userId,
            // Keep a single canonical field for garage relation.
            garageId: normalizedGarageId,
            serviceId: service_id || null,
            name: name || null,
            email: email || null,
            phone: phone || null,
            vehicle: vehicle || null,
            services: Array.isArray(services) ? services : null,
            time: time || null,
            deliveryOption: deliveryOption || null,
            deliveryFee: deliveryFee ?? 0,
            homeAddress: homeAddress || null,
            subtotal: subtotal ?? total ?? total_price ?? 0,
            totalPrice: total_price ?? total ?? subtotal ?? 0,
            status: normalizedStatus,
            serviceDate: service_date || date || null,
            date: date || service_date || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        console.log("   Saving booking with:", bookingPayload);
        
        const docRef = await bookingsCol().add(bookingPayload);
        
        console.log("   ✅ Booking saved with ID:", docRef.id);
        
        res.status(201).json({ id: docRef.id, ...bookingPayload });
    } catch (error: any) {
        console.error("Create booking error:", error?.message || error);
        res.status(500).json({ error: "Failed to create booking" });
    }
});

// Track booking by tracking id (public - no auth required)
router.get("/track/:trackingId", async (req, res) => {
    try {
        const { trackingId } = req.params;

        const snap = await bookingsCol().where("trackingId", "==", trackingId).limit(1).get();

        if (snap.empty) return res.status(404).json({ error: "Booking not found" });

        const doc = snap.docs[0];
        const data = doc.data();

        // Public tracking should expose only customer-facing booking progress.
        // Internal staff/mechanic task fields are intentionally omitted.
        const normalized = {
            id: doc.id,
            trackingId: data.trackingId,
            tracking_id: data.trackingId,
            name: data.name,
            email: data.email,
            phone: data.phone,
            vehicle: data.vehicle,
            services: Array.isArray(data.services) ? data.services : [],
            date: data.date || data.serviceDate,
            time: data.time,
            status: data.status,
            deliveryOption: data.deliveryOption,
            delivery_option: data.deliveryOption,
            deliveryFee: data.deliveryFee,
            delivery_fee: data.deliveryFee,
            homeAddress: data.homeAddress,
            home_address: data.homeAddress,
            serviceDate: data.serviceDate,
            service_date: data.serviceDate,
            createdAt: data.createdAt,
            created_at: data.createdAt,
            userId: data.customerId,
            customer_id: data.customerId,
            total: data.totalPrice,
            total_price: data.totalPrice,
        };

        res.json(normalized);
    } catch (error: any) {
        console.error("Track booking error:", error?.message || error);
        res.status(500).json({ error: "Failed to track booking" });
    }
});

// Get user bookings
router.get("/my-bookings", authenticate, async (req: AuthRequest, res) => {
    try {
        console.log("📖 [GET /my-bookings] Fetching bookings");
        console.log("   userId:", req.userId);
        console.log("   userRole:", req.userRole);
        
        const bookings = await getBookingsList(req.userId);
        
        console.log("   Found bookings:", bookings.length);
        console.log("   Bookings:", JSON.stringify(bookings, null, 2));
        
        res.json(bookings);
    } catch (error: any) {
        console.error("My bookings error:", error?.message || error);
        res.status(500).json({ error: "Failed to fetch bookings" });
    }
});

// Get all bookings (Admin only)
router.get("/admin", authenticate, async (req: AuthRequest, res) => {
    if (req.userRole !== "admin") return res.status(403).json({ error: "Unauthorized" });

    try {
        const bookings = await getBookingsList();
        res.json(bookings);
    } catch (error: any) {
        console.error("Admin bookings error:", error?.message || error);
        res.status(500).json({ error: "Failed to fetch all bookings" });
    }
});

// Update booking status
router.patch("/status/:id", authenticate, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const normalizedStatus = normalizeStatus(status);
        const normalizedRole = String(req.userRole || "").toLowerCase();

        // Find booking by id or trackingId
        let bookingDoc: FirebaseFirestore.QueryDocumentSnapshot | null = null;
        const byId = await bookingsCol().doc(id).get();
        if (byId.exists) {
            bookingDoc = byId as any;
        } else {
            const byTracking = await bookingsCol().where("trackingId", "==", id).limit(1).get();
            if (!byTracking.empty) bookingDoc = byTracking.docs[0];
        }

        if (!bookingDoc) return res.status(404).json({ error: "Booking not found" });

        const bookingData = bookingDoc.data()!;
        const bookingGarageId = String(bookingData.garageId || bookingData.garage_id || "").trim() || null;
        let canUpdate = normalizedRole === "admin";

        if (!canUpdate && bookingGarageId) {
            const garageSnap = await garagesCol().doc(bookingGarageId).get();
            if (garageSnap.exists) {
                canUpdate = garageSnap.data()?.ownerId === req.userId;
            }
        }

        if (!canUpdate) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        await bookingsCol().doc(bookingDoc.id).update({
            status: normalizedStatus,
            updatedAt: new Date().toISOString(),
        });

        const updatedSnap = await bookingsCol().doc(bookingDoc.id).get();
        res.json({ id: updatedSnap.id, ...updatedSnap.data() });
    } catch (error: any) {
        res.status(500).json({ error: "Failed to update booking status" });
    }
});

// Assign task to staff member
router.patch("/:bookingId/assign-task", authenticate, async (req: AuthRequest, res) => {
    try {
        const { bookingId } = req.params;
        const { staffUserId, staffName } = req.body;
        const normalizedRole = String(req.userRole || "").toLowerCase();

        // Verify booking exists
        const bookingDoc = await bookingsCol().doc(bookingId).get();
        if (!bookingDoc.exists) return res.status(404).json({ error: "Booking not found" });

        const bookingData = bookingDoc.data()!;
        const bookingGarageId = String(bookingData.garageId || bookingData.garage_id || "").trim() || null;

        if (!bookingGarageId) {
            return res.status(400).json({ error: "Booking has no garage assigned" });
        }

        // Admin is always allowed. Other users must own this garage.
        if (normalizedRole !== "admin") {
            const garageSnap = await garagesCol().doc(bookingGarageId).get();
            if (!garageSnap.exists) {
                return res.status(404).json({ error: "Garage not found" });
            }

            const garageData = garageSnap.data() || {};
            const garageOwnerId = String((garageData as any).ownerId || (garageData as any).owner_id || "").trim();
            if (!garageOwnerId || garageOwnerId !== req.userId) {
                return res.status(403).json({ error: "Only garage owner or admin can assign tasks" });
            }
        }

        // Verify staff member exists and belongs to the garage
        const staffQuery = await adminDb
            .collection("staff")
            .where("userId", "==", staffUserId)
            .where("garageId", "==", bookingGarageId)
            .limit(1)
            .get();

        if (staffQuery.empty) {
            return res.status(403).json({ error: "Staff member not found in this garage" });
        }

        // Update booking with task assignment
        await bookingsCol().doc(bookingId).update({
            assignedTo: staffUserId,
            assignedToName: staffName,
            taskStatus: "assigned",
            assignedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });

        const updated = await bookingsCol().doc(bookingId).get();
        res.json({ id: updated.id, ...updated.data() });
    } catch (error: any) {
        console.error("Assign task error:", error?.message || error);
        res.status(500).json({ error: "Failed to assign task" });
    }
});

// Get staff assigned tasks
router.get("/staff/my-tasks", authenticate, async (req: AuthRequest, res) => {
    try {
        const normalizedRole = String(req.userRole || "").toLowerCase();
        if (normalizedRole !== "staff" && normalizedRole !== "mechanic") {
            return res.status(403).json({ error: "Only staff can view tasks" });
        }

        // Get staff record to find their garage
        const staffSnap = await adminDb.collection("staff").where("userId", "==", req.userId).limit(1).get();
        if (staffSnap.empty) {
            return res.status(404).json({ error: "Staff record not found" });
        }

        const staffData = staffSnap.docs[0].data();
        const garageId = staffData.garageId;

        // Fetch assigned tasks first (avoids composite-index issues), then filter by garage in-memory.
        const tasks = await bookingsCol()
            .where("assignedTo", "==", req.userId)
            .get();

        const taskList = tasks.docs
            .map(d => ({
            id: d.id,
            ...d.data(),
            garageId: garageId,
            }))
            .filter((row: any) => {
                const rowGarageId = String(row.garageId || row.garage_id || "").trim();
                return rowGarageId === String(garageId || "").trim();
            })
            .sort((a: any, b: any) => {
                const aTime = Date.parse(String(a?.createdAt || a?.created_at || "")) || 0;
                const bTime = Date.parse(String(b?.createdAt || b?.created_at || "")) || 0;
                return bTime - aTime;
            });

        res.json(taskList);
    } catch (error: any) {
        console.error("Get tasks error:", error?.message || error);
        res.status(500).json({ error: "Failed to fetch tasks" });
    }
});

// Update task progress/completion
router.patch("/staff/task/:bookingId/update-progress", authenticate, async (req: AuthRequest, res) => {
    try {
        const normalizedRole = String(req.userRole || "").toLowerCase();
        if (normalizedRole !== "staff" && normalizedRole !== "mechanic") {
            return res.status(403).json({ error: "Only staff can update tasks" });
        }

        const { bookingId } = req.params;
        const { taskStatus, progressPercentage, notes } = req.body;

        const bookingDoc = await bookingsCol().doc(bookingId).get();
        if (!bookingDoc.exists) return res.status(404).json({ error: "Task not found" });

        const bookingData = bookingDoc.data()!;

        // Verify task is assigned to this staff member
        if (bookingData.assignedTo !== req.userId) {
            return res.status(403).json({ error: "This task is not assigned to you" });
        }

        // Update task progress
        await bookingsCol().doc(bookingId).update({
            taskStatus: taskStatus || bookingData.taskStatus,
            progressPercentage: progressPercentage || 0,
            // Keep mechanic/staff work notes internal to owner/staff dashboards.
            taskNotes: notes || bookingData.taskNotes || "",
            updatedAt: new Date().toISOString(),
        });

        const updated = await bookingsCol().doc(bookingId).get();
        res.json({ id: updated.id, ...updated.data() });
    } catch (error: any) {
        console.error("Update task progress error:", error?.message || error);
        res.status(500).json({ error: "Failed to update task" });
    }
});

export default router;
