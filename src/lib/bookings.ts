import { api } from "@/lib/api-client";
import { db } from "@/lib/firebase";
import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";

export type BookingService = {
  id: string;
  name?: string;
  price?: number;
};

export type BookingRecord = {
  trackingId: string;
  name: string;
  email: string;
  phone?: string | null;
  vehicle: string;
  services: BookingService[];
  date: string;
  time: string;
  deliveryOption?: string | null;
  deliveryFee?: number | null;
  homeAddress?: string | null;
  subtotal?: number | null;
  total: number;
  status: string;
  createdAt: string;
  userId?: string | null;
};

export type CreateBookingInput = {
  trackingId: string;
  name: string;
  email: string;
  phone?: string | null;
  vehicle: string;
  services: BookingService[];
  date: string;
  time: string;
  deliveryOption?: string | null;
  deliveryFee?: number | null;
  homeAddress?: string | null;
  subtotal?: number | null;
  total: number;
  status: string;
  userId?: string | null;
  garageId?: string | null;
};

const toNumber = (value: unknown, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const mapBookingResponse = (data: any): BookingRecord => ({
  trackingId: data.trackingId || data.tracking_id,
  name: data.name,
  email: data.email,
  phone: data.phone,
  vehicle: data.vehicle,
  services: Array.isArray(data.services)
    ? data.services
    : typeof data.services === "string"
      ? JSON.parse(data.services)
      : [],
  date: data.serviceDate || data.service_date || data.date,
  time: data.time,
  deliveryOption: data.deliveryOption || data.delivery_option,
  deliveryFee: data.deliveryFee ?? data.delivery_fee,
  homeAddress: data.homeAddress || data.home_address,
  subtotal: toNumber(data.subtotal ?? data.sub_total ?? data.totalPrice ?? data.total_price ?? data.total, 0),
  total: toNumber(data.total ?? data.total_price ?? data.totalPrice ?? data.subtotal, 0),
  status: data.status,
  createdAt: data.createdAt || data.created_at,
  userId: data.userId || data.user_id,
});

const getBookingsFromFirestore = async (params: { userId?: string; email?: string }) => {
  if (!params.userId && !params.email) {
    return [] as BookingRecord[];
  }

  try {
    const allBookings: BookingRecord[] = [];

    if (params.userId) {
      // Try querying with customerId field (new format)
      try {
        const q1 = query(
          collection(db, "bookings"),
          where("customerId", "==", params.userId),
          orderBy("createdAt", "desc"),
          limit(100)
        );
        const snap1 = await getDocs(q1);
        allBookings.push(...snap1.docs.map((doc) => mapBookingResponse({ id: doc.id, ...doc.data() })));
      } catch (e1) {
        console.warn("Failed to query with customerId:", e1);
      }

      // Try querying with userId field (legacy format)
      if (allBookings.length === 0) {
        try {
          const q2 = query(
            collection(db, "bookings"),
            where("userId", "==", params.userId),
            orderBy("createdAt", "desc"),
            limit(100)
          );
          const snap2 = await getDocs(q2);
          allBookings.push(...snap2.docs.map((doc) => mapBookingResponse({ id: doc.id, ...doc.data() })));
        } catch (e2) {
          console.warn("Failed to query with userId:", e2);
        }
      }
    } else if (params.email) {
      const q = query(
        collection(db, "bookings"),
        where("email", "==", params.email),
        orderBy("createdAt", "desc"),
        limit(100)
      );
      const snap = await getDocs(q);
      allBookings.push(...snap.docs.map((doc) => mapBookingResponse({ id: doc.id, ...doc.data() })));
    }

    return allBookings;
  } catch (error) {
    console.warn("Firestore query error:", error);
    return [] as BookingRecord[];
  }
};

export async function createBooking(input: CreateBookingInput) {
  const { data, error } = await api.createBookingApi(input);

  if (error || !data) {
    throw new Error(error || "Unable to create booking.");
  }

  return mapBookingResponse(data);
}

export async function getBookingByTrackingId(trackingId: string) {
  const { data, error } = await api.getBookingByTrackingIdApi(trackingId);

  if (error || !data) {
    throw new Error(error || "Booking not found.");
  }

  return mapBookingResponse(data);
}

export async function getBookingsForUser(params: { userId?: string; email?: string }) {
  console.log("\n🔍 [getBookingsForUser] Fetching bookings");
  console.log("   userId:", params.userId);
  console.log("   email:", params.email);
  
  try {
    // Always try the backend API first
    // The httpOnly token cookie is automatically sent by the browser via credentials: "include"
    console.log("   📡 Calling backend API /bookings/my-bookings");
    const { data, error } = await api.getMyBookingsApi();

    console.log("   API Response - Error:", error);
    console.log("   API Response - Data length:", Array.isArray(data) ? data.length : 0);
    console.log("   API Response - Data:", data);

    if (error) {
      console.log("   ⚠️ Backend error:", error);
      console.log("   Falling back to Firestore...");
      return getBookingsFromFirestore(params);
    }

    return (data || []).map((row: any) => mapBookingResponse(row));
  } catch (err: any) {
    console.error("\n❌ [getBookingsForUser] Error:", err?.message || err);
    console.log("   Falling back to Firestore...");
    return getBookingsFromFirestore(params);
  }
}
