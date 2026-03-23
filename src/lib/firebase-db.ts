import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  limit,
  serverTimestamp,
  type DocumentData,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "./firebase";

const PROFILES = "profiles";
const GARAGES = "garages";
const GARAGE_STAFF = "garage_staff";
const BOOKINGS = "bookings";

// --- Profiles ---
export async function getProfile(uid: string): Promise<{ role?: string; name?: string; full_name?: string } | null> {
  const snap = await getDoc(doc(db, PROFILES, uid));
  return snap.exists() ? (snap.data() as { role?: string; name?: string; full_name?: string }) : null;
}

export async function setProfile(uid: string, data: { role?: string; name?: string; full_name?: string }): Promise<void> {
  await setDoc(doc(db, PROFILES, uid), { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

export async function createProfile(
  uid: string,
  data: { role: string; name: string; full_name?: string }
): Promise<void> {
  await setDoc(doc(db, PROFILES, uid), {
    ...data,
    full_name: data.full_name ?? data.name,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

// --- Garages (Firestore doc id = garage id) ---
function garageToRecord(id: string, data: DocumentData): Record<string, unknown> {
  return {
    id,
    ...data,
    created_at:
      typeof data.createdAt === "string"
        ? data.createdAt
        : data.createdAt?.toMillis?.()
          ? new Date(data.createdAt.toMillis()).toISOString()
          : data.created_at,
  };
}

export async function getGaragesList(): Promise<Record<string, unknown>[]> {
  // Firestore can throw if `createdAt` field types are inconsistent (Timestamp vs string).
  // In that case, fall back to a non-ordered query so the UI still shows garages.
  try {
    const q = query(collection(db, GARAGES), orderBy("createdAt", "desc"), limit(200));
    const snap = await getDocs(q);
    return snap.docs.map((d) => garageToRecord(d.id, d.data()));
  } catch {
    const q = query(collection(db, GARAGES), limit(200));
    const snap = await getDocs(q);
    return snap.docs.map((d) => garageToRecord(d.id, d.data()));
  }
}

export async function getGarageById(garageId: string): Promise<Record<string, unknown> | null> {
  const snap = await getDoc(doc(db, GARAGES, garageId));
  if (!snap.exists()) return null;
  return garageToRecord(snap.id, snap.data());
}

export async function getGarageByOwnerId(ownerId: string): Promise<Record<string, unknown> | null> {
  const q = query(collection(db, GARAGES), where("ownerId", "==", ownerId), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return garageToRecord(d.id, d.data());
}

export async function createGarage(data: Record<string, unknown>): Promise<{ id: string }> {
  const docRef = await addDoc(collection(db, GARAGES), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { id: docRef.id };
}

export async function updateGarage(garageId: string, data: Record<string, unknown>): Promise<void> {
  await updateDoc(doc(db, GARAGES, garageId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteGarageFirestore(garageId: string): Promise<void> {
  await deleteDoc(doc(db, GARAGES, garageId));
}

// Map API-style keys to Firestore-safe keys (we store camelCase in Firestore)
const garageFieldMap: Record<string, string> = {
  name: "name",
  garage_name: "name",
  contact_phone: "contactPhone",
  contactPhone: "contactPhone",
  open_time: "openTime",
  openTime: "openTime",
  service_image_url: "serviceImageUrl",
  serviceImageUrl: "serviceImageUrl",
  logo_url: "logoUrl",
  logoUrl: "logoUrl",
  address_country: "addressCountry",
  addressCountry: "addressCountry",
  address_state: "addressState",
  addressState: "addressState",
  address_street: "addressStreet",
  addressStreet: "addressStreet",
  owner_id: "ownerId",
  ownerId: "ownerId",
  created_at: "createdAt",
  map_url: "mapUrl",
  mapUrl: "mapUrl",
  mechanics_count: "mechanicsCount",
  mechanicsCount: "mechanicsCount",
  since_year: "sinceYear",
  sinceYear: "sinceYear",
  problems_solved_count: "problemsSolvedCount",
  problemsSolvedCount: "problemsSolvedCount",
  sells_second_hand: "sellsSecondHand",
  sellsSecondHand: "sellsSecondHand",
  description: "description",
  rating: "rating",
  reviews: "reviews",
  services: "services",
  car_repair_types: "carRepairTypes",
  carRepairTypes: "carRepairTypes",
  payment_methods: "paymentMethods",
  paymentMethods: "paymentMethods",
};

export function toFirestoreGarage(data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined) continue;
    const key = garageFieldMap[k] ?? k;
    out[key] = v;
  }
  return out;
}

export function fromFirestoreGarage(data: Record<string, unknown>): Record<string, unknown> {
  const reverse: Record<string, string> = {};
  for (const [a, b] of Object.entries(garageFieldMap)) {
    if (a !== b) reverse[b] = a;
  }
  const out: Record<string, unknown> = { ...data };
  for (const [k, v] of Object.entries(data)) {
    const snake = reverse[k];
    if (snake) out[snake] = v;
  }
  return out;
}

// --- Storage (garage images, staff images) ---
const STORAGE_GARAGE_IMAGES = "garage-images";

export async function uploadGarageImage(file: File, pathPrefix: string): Promise<string | null> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${pathPrefix}/${Date.now()}-${safeName}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file, { cacheControl: "3600" });
  const url = await getDownloadURL(storageRef);
  return url;
}

export async function uploadStaffImage(file: File, pathPrefix: string): Promise<string | null> {
  return uploadGarageImage(file, pathPrefix);
}

// --- Garage staff ---
export async function addGarageStaffDoc(payload: Record<string, unknown>): Promise<string> {
  const ref = await addDoc(collection(db, GARAGE_STAFF), {
    ...payload,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getGarageStaffByGarage(garageId: string): Promise<Record<string, unknown>[]> {
  const q = query(collection(db, GARAGE_STAFF), where("garageId", "==", garageId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getBookingsListFirestore(): Promise<Record<string, unknown>[]> {
  try {
    const q = query(collection(db, BOOKINGS), orderBy("createdAt", "desc"), limit(500));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch {
    const q = query(collection(db, BOOKINGS), limit(500));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
}
