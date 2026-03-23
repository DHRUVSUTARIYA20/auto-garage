import { api } from "@/lib/api-client";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs, updateDoc, serverTimestamp } from "firebase/firestore";
import { getProfile } from "@/lib/firebase-db";

export type StaffProfile = {
  id: string;
  role?: string | null;
  name?: string | null;
  full_name?: string | null;
  phone?: string | null;
};

export type WorkOrder = {
  id: string;
  booking_id?: string | null;
  assigned_to?: string | null;
  status: string | null;
  priority?: string | null;
  service_type?: string | null;
  vehicle_brand?: string | null;
  vehicle_model?: string | null;
  vehicle_no?: string | null;
  customer_name?: string | null;
  phone?: string | null;
  pickup_required?: boolean | null;
  estimated_time?: string | null;
  assigned_bay?: number | null;
  scheduled_date?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  completed_at?: string | null;
};

export type InventoryItem = {
  id: string;
  part_name: string;
  quantity: number;
  min_stock: number;
};

export type TimeLog = {
  id?: string;
  work_date: string;
  clock_in?: string | null;
  clock_out?: string | null;
  hours?: number | null;
};

const demoWorkOrders: WorkOrder[] = [
  {
    id: "WO-1001",
    status: "in-progress",
    priority: "high",
    service_type: "Brake Service",
    vehicle_brand: "Honda",
    vehicle_model: "City",
    vehicle_no: "DL8CAF1234",
    customer_name: "Rahul Sharma",
    estimated_time: "2h",
    assigned_bay: 2,
    scheduled_date: new Date().toISOString(),
  },
  {
    id: "WO-1002",
    status: "pending",
    priority: "medium",
    service_type: "Oil Change",
    vehicle_brand: "Hyundai",
    vehicle_model: "i20",
    vehicle_no: "UP14AB5678",
    customer_name: "Neha Verma",
    estimated_time: "1h",
    assigned_bay: 1,
    scheduled_date: new Date().toISOString(),
  },
];

const demoInventory: InventoryItem[] = [
  { id: "INV-1", part_name: "Engine Oil 5W-30", quantity: 24, min_stock: 10 },
  { id: "INV-2", part_name: "Brake Pads", quantity: 6, min_stock: 8 },
  { id: "INV-3", part_name: "Air Filter", quantity: 12, min_stock: 6 },
];

const demoTimeLogs: TimeLog[] = [
  {
    id: "TL-1",
    work_date: new Date().toISOString().slice(0, 10),
    clock_in: "09:05",
    clock_out: "18:10",
    hours: 9,
  },
];

const normalizeWorkOrders = (data: any[]): WorkOrder[] =>
  data.map((order: any) => ({
    ...order,
    id: String(order.id),
    booking_id: order.booking_id || order.bookingId,
    assigned_to: order.staff_id || order.assignedTo || order.assigned_to,
    status: order.task_status || order.status || "pending",
    service_type:
      order.booking?.service?.service_name ||
      order.serviceType ||
      order.service_type ||
      "Service",
    customer_name:
      order.booking?.customer?.name ||
      order.customerName ||
      order.customer_name ||
      "Customer",
    phone: order.booking?.customer?.phone || order.phone,
    created_at: order.created_at || order.createdAt,
    updated_at: order.updated_at || order.updatedAt,
  })) as WorkOrder[];

const isDemoUserId = (userId?: string | null) =>
  String(userId || "").trim().toLowerCase().startsWith("demo-");

const isDemoWorkOrderId = (id?: string | null) =>
  /^wo-/i.test(String(id || "").trim());

const hasBackendTokenCookie = () =>
  typeof document !== "undefined" &&
  document.cookie.split(";").some((part) => part.trim().startsWith("token="));

export async function getStaffProfile(userId: string) {
  if (isDemoUserId(userId)) {
    return { id: userId, role: "staff", name: "Demo Staff", full_name: "Demo Staff" } as StaffProfile;
  }

  const { data, error } = await api.request<StaffProfile>(`/staff/profile/${userId}`);
  if (!error && data) {
    return data;
  }

  // Firestore fallback
  try {
    const profile = await getProfile(userId);
    if (profile) {
      return {
        id: userId,
        role: profile.role || "staff",
        name: profile.name || profile.full_name || "Staff User",
        full_name: profile.full_name || profile.name || "Staff User",
        phone: (profile as any).phone || null,
      } as StaffProfile;
    }
  } catch {}

  return { id: userId, role: "staff", name: "Staff User", full_name: "Staff User" } as StaffProfile;
}

export async function getWorkOrdersForStaff(userId: string) {
  if (isDemoUserId(userId)) {
    return demoWorkOrders;
  }

  const { data, error } = await api.request<WorkOrder[]>("/staff/work-orders");
  if (!error && Array.isArray(data) && data.length > 0) {
    return normalizeWorkOrders(data as any[]);
  }

  // Firestore fallback
  try {
    const tasksRef = collection(db, "tasks");
    const q = query(tasksRef, where("staffId", "==", userId), orderBy("createdAt", "desc"), limit(50));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const tasks = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      return normalizeWorkOrders(tasks);
    }
  } catch {}

  return demoWorkOrders;
}

export async function getInventoryItems(userId?: string) {
  if (isDemoUserId(userId)) {
    return demoInventory;
  }

  const { data, error } = await api.request<any[]>("/staff/inventory");
  if (!error && Array.isArray(data) && data.length > 0) {
    return data.map((item: any) => ({
      id: item.id,
      part_name: item.partName || item.part_name,
      quantity: Number(item.quantity || 0),
      min_stock: Number(item.minStock || item.min_stock || 0),
    })) as InventoryItem[];
  }

  // Firestore fallback
  try {
    const invRef = collection(db, "inventory");
    const q = query(invRef, orderBy("partName", "asc"), limit(100));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map(d => {
        const item = d.data();
        return {
          id: d.id,
          part_name: item.partName || item.part_name || "",
          quantity: Number(item.quantity || 0),
          min_stock: Number(item.minStock || item.min_stock || 0),
        };
      }) as InventoryItem[];
    }
  } catch {}

  return demoInventory;
}

export async function getTimeLogsForStaff(userId: string) {
  if (isDemoUserId(userId)) {
    return demoTimeLogs;
  }

  const { data, error } = await api.request<any[]>('/staff/time-logs');
  if (!error && Array.isArray(data) && data.length > 0) {
    return data.map((log: any) => ({
      id: log.id,
      work_date: log.workDate || log.work_date || "-",
      clock_in: log.clockIn || log.clock_in || null,
      clock_out: log.clockOut || log.clock_out || null,
      hours: typeof log.hours === "number" ? log.hours : Number(log.hours || 0),
    })) as TimeLog[];
  }

  // Firestore fallback
  try {
    const logsRef = collection(db, "time_logs");
    const q = query(logsRef, where("userId", "==", userId), orderBy("workDate", "desc"), limit(30));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map(d => {
        const log = d.data();
        return {
          id: d.id,
          work_date: log.workDate || log.work_date || "-",
          clock_in: log.clockIn || log.clock_in || null,
          clock_out: log.clockOut || log.clock_out || null,
          hours: typeof log.hours === "number" ? log.hours : Number(log.hours || 0),
        };
      }) as TimeLog[];
    }
  } catch {}

  return demoTimeLogs;
}

export async function updateWorkOrderStatus(id: string, status: string) {
  if (isDemoWorkOrderId(id) || !hasBackendTokenCookie()) {
    return { id, task_status: status };
  }

  const { data, error } = await api.request<any>(`/staff/work-orders/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ task_status: status }),
  });
  if (!error) {
    return data;
  }

  // Firestore fallback
  try {
    const taskRef = doc(db, "tasks", id);
    await updateDoc(taskRef, { taskStatus: status, updatedAt: serverTimestamp() });
    return { id, task_status: status };
  } catch {
    return { id, task_status: status };
  }
}
