import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/useAuth";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api-client";
import ProfileEditorDialog from "@/components/ProfileEditorDialog";
import { Building2, MapPin, Phone, Plus, Search, UserCog, Users, TrendingUp, Filter, CheckCircle2, Clock } from "lucide-react";
import Footer from "@/components/Footer";

type AdminOption =
  | "manage-garage"
  | "garage-wise-staff"
  | "manage-customer"
  | "manage-all-users"
  | "garage-contact"
  | "analytics";

type Garage = {
  id: string;
  name: string;
  contactPhone: string;
  ownerName?: string;
  ownerEmail?: string;
  ownerMobileNumber?: string;
  defaultPassword?: string;
  email?: string;
  addressState: string;
  addressCountry: string;
  mechanicsCount: number;
  mapUrl: string;
  openTime: string;
  description: string;
  createdAt: string;
};

type Booking = {
  id: string;
  garageId: string;
  trackingId: string;
  name: string;
  email: string;
  phone: string;
  vehicle: string;
  date: string;
  time: string;
  total: number;
  status: string;
  createdAt: string;
  userId: string;
};

type CustomerSummary = {
  email: string;
  name: string;
  phone: string;
  totalBookings: number;
  totalSpent: number;
  lastBookingAt: string;
};

type GarageStaffMember = {
  id: string;
  userId?: string;
  garageId?: string;
  name?: string;
  emailId?: string;
  role?: string;
  user?: {
    id?: string;
    name?: string;
    email?: string;
    role?: string;
  };
};

const navOptions: Array<{ key: AdminOption; label: string }> = [
  { key: "analytics", label: "Analytics Overview" },
  { key: "manage-garage", label: "Manage Garage" },
  { key: "garage-wise-staff", label: "Garage Wise Staff" },
  { key: "manage-customer", label: "Customer Activity" },
  { key: "manage-all-users", label: "All Users" },
  { key: "garage-contact", label: "Garage Contacts" },
];

const bookingStatuses = ["pending", "confirmed", "in-progress", "completed", "cancelled"];

const INDIA_TIME_ZONE = "Asia/Kolkata";

const toIsoDateString = (value: unknown): string => {
  if (!value) return "";

  if (typeof value === "string") return value;

  if (value instanceof Date) return value.toISOString();

  if (typeof value === "number") return new Date(value).toISOString();

  if (typeof value === "object") {
    const timestamp = value as {
      seconds?: number;
      _seconds?: number;
      nanoseconds?: number;
      _nanoseconds?: number;
      toDate?: () => Date;
    };

    if (typeof timestamp.toDate === "function") {
      return timestamp.toDate().toISOString();
    }

    const seconds = timestamp.seconds ?? timestamp._seconds;
    const nanos = timestamp.nanoseconds ?? timestamp._nanoseconds ?? 0;

    if (typeof seconds === "number") {
      const millis = seconds * 1000 + Math.floor(nanos / 1_000_000);
      return new Date(millis).toISOString();
    }
  }

  return "";
};

const toISTDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const monthKeyIST = (date: Date) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: INDIA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";

  return `${year}-${month}`;
};

const monthLabelIST = (date: Date) =>
  date.toLocaleString("en-IN", {
    timeZone: INDIA_TIME_ZONE,
    month: "short",
  });

const normalizeGarage = (raw: Record<string, any>): Garage => ({
  id: String(raw.id ?? ""),
  name: String(raw.garage_name ?? raw.name ?? ""),
  contactPhone: String(raw.contact_phone ?? raw.contactPhone ?? ""),
  ownerName: String(raw.ownerName ?? raw.owner_name ?? raw.owner?.name ?? ""),
  ownerEmail: String(raw.ownerEmail ?? raw.owner_email ?? raw.owner?.email ?? ""),
  ownerMobileNumber: String(raw.ownerMobileNumber ?? raw.owner_mobile_number ?? ""),
  defaultPassword: String(raw.defaultPassword ?? raw.default_password ?? ""),
  email: String(raw.email ?? ""),
  addressState: String(raw.location ?? raw.address_state ?? raw.addressState ?? ""),
  addressCountry: String(raw.address_country ?? raw.addressCountry ?? ""),
  mechanicsCount: Number(raw.mechanics_count ?? raw.mechanicsCount ?? 0) || 0,
  mapUrl: String(raw.map_url ?? raw.mapUrl ?? ""),
  openTime: String(raw.open_time ?? raw.openTime ?? ""),
  description: String(raw.description ?? ""),
  createdAt: toIsoDateString(raw.created_at ?? raw.createdAt),
});

const normalizeBooking = (raw: Record<string, any>): Booking => ({
  id: String(raw.id ?? ""),
  garageId: String(raw.garage_id ?? raw.garageId ?? ""),
  trackingId: String(raw.tracking_id ?? raw.trackingId ?? ""),
  name: String(raw.name ?? raw.customer?.name ?? ""),
  email: String(raw.email ?? raw.customer?.email ?? ""),
  phone: String(raw.phone ?? raw.customer?.phone ?? ""),
  vehicle: String(raw.vehicle ?? ""),
  date: String(raw.service_date ?? raw.date ?? ""),
  time: String(raw.time ?? ""),
  total: Number(raw.total_price ?? raw.totalPrice ?? raw.total ?? raw.subtotal ?? 0) || 0,
  status: String(raw.status ?? "pending"),
  createdAt: toIsoDateString(raw.created_at ?? raw.createdAt),
  userId: String(raw.customer_id ?? raw.userId ?? ""),
});

const toDateLabel = (value: string) => {
  if (!value) return "-";
  const date = toISTDate(value);
  if (!date) return value;
  return date.toLocaleString("en-IN", {
    timeZone: INDIA_TIME_ZONE,
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const Admin = () => {
  const { user, loading: authLoading, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [activeOption, setActiveOption] = useState<AdminOption>("analytics");
  const [garages, setGarages] = useState<Garage[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingGarageId, setSavingGarageId] = useState<string | null>(null);
  const [deletingGarageId, setDeletingGarageId] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [garageStaffByGarage, setGarageStaffByGarage] = useState<Record<string, GarageStaffMember[]>>({});
  const [selectedCustomerEmail, setSelectedCustomerEmail] = useState<string>("");
  const [userRoleFilter, setUserRoleFilter] = useState<string>("all");

  const [garageEdits, setGarageEdits] = useState<Record<string, Partial<Garage>>>({});
  const [contactEdits, setContactEdits] = useState<Record<string, Partial<Garage>>>({});
  const [showAddGarageForm, setShowAddGarageForm] = useState(false);
  const [newGarageForm, setNewGarageForm] = useState({
    garageName: "",
    garageLocation: "",
    garageContactPhone: "",
    garageOpenTime: "",
    garageDescription: "",
    ownerName: "",
    ownerEmail: "",
    ownerPassword: "",
    ownerMobileNumber: "",
    garageImage: null as File | null,
  });
  const [addingGarage, setAddingGarage] = useState(false);
  const [expandedGarageId, setExpandedGarageId] = useState<string | null>(null);
  const isAdminUser = !!user && user.role === "admin";

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [garageResult, bookingResult, userResult] = await Promise.all([
        api.getGarages(),
        api.getAdminBookings(),
        api.getUsersApi(),
      ]);

      const nextGarages = Array.isArray(garageResult.data)
        ? garageResult.data.map((row) => normalizeGarage(row as Record<string, any>))
        : [];

      const nextBookings = Array.isArray(bookingResult.data)
        ? bookingResult.data.map((row) => normalizeBooking(row as Record<string, any>))
        : [];

      setGarages(nextGarages);
      setBookings(nextBookings);
      setUsers(Array.isArray(userResult.data) ? userResult.data : []);

      const staffEntries = await Promise.all(
        nextGarages.map(async (garage) => {
          const staffResult = await api.getGarageStaffApi(garage.id);
          const staffList = Array.isArray(staffResult.data)
            ? (staffResult.data as GarageStaffMember[])
            : [];
          return [garage.id, staffList] as const;
        })
      );

      setGarageStaffByGarage(Object.fromEntries(staffEntries));

      if (nextBookings.length > 0 && !selectedCustomerEmail) {
        setSelectedCustomerEmail(nextBookings[0].email);
      }
    } catch (error: any) {
      toast({ title: "Failed to load admin data", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    loadAdminData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

  const updateGarageEditField = (id: string, field: string, value: any, type: "garage" | "contact") => {
    if (type === "garage") {
      setGarageEdits((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
    } else {
      setContactEdits((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
    }
  };

  const saveGaragePatch = async (id: string, patch: Partial<Garage>, title: string, successMsg: string) => {
    setSavingGarageId(id);
    const { error } = await api.updateGarageWithFallback(id, patch as Record<string, unknown>);
    setSavingGarageId(null);

    if (error) {
      toast({ title: "Save failed", description: error, variant: "destructive" });
    } else {
      toast({ title, description: successMsg });
      loadAdminData();
    }
  };

  const deleteGarage = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this garage?")) return;
    setDeletingGarageId(id);
    const { error } = await api.deleteGarageWithFallback(id);
    setDeletingGarageId(null);

    if (error) {
      toast({ title: "Delete failed", description: error, variant: "destructive" });
    } else {
      toast({ title: "Garage deleted", description: "The garage was removed from the database." });
      loadAdminData();
    }
  };

  const handleAddGarage = async () => {
    // Validate required fields
    if (!newGarageForm.garageName.trim()) {
      toast({ title: "Error", description: "Garage name is required", variant: "destructive" });
      return;
    }
    
    if (!newGarageForm.ownerName.trim()) {
      toast({ title: "Error", description: "Owner name is required", variant: "destructive" });
      return;
    }
    
    if (!newGarageForm.ownerEmail.trim()) {
      toast({ title: "Error", description: "Owner email is required", variant: "destructive" });
      return;
    }
    
    if (!newGarageForm.ownerPassword.trim()) {
      toast({ title: "Error", description: "Owner password is required", variant: "destructive" });
      return;
    }
    
    if (!newGarageForm.ownerMobileNumber.trim()) {
      toast({ title: "Error", description: "Owner mobile number is required", variant: "destructive" });
      return;
    }

    setAddingGarage(true);
    try {
      // Create FormData for multipart submission
      const formData = new FormData();
      formData.append("garageName", newGarageForm.garageName.trim());
      formData.append("garageLocation", newGarageForm.garageLocation.trim() || "Not specified");
      formData.append("garageContactPhone", newGarageForm.garageContactPhone.trim() || "");
      formData.append("garageOpenTime", newGarageForm.garageOpenTime.trim() || "");
      formData.append("garageDescription", newGarageForm.garageDescription.trim() || "");
      formData.append("ownerName", newGarageForm.ownerName.trim());
      formData.append("ownerEmail", newGarageForm.ownerEmail.trim());
      formData.append("ownerPassword", newGarageForm.ownerPassword.trim());
      formData.append("ownerMobileNumber", newGarageForm.ownerMobileNumber.trim());
      
      if (newGarageForm.garageImage) {
        formData.append("logo", newGarageForm.garageImage);
      }

      const response = await fetch("/api/garages/admin/create-with-owner", {
        method: "POST",
        body: formData,
        headers: {
          // Don't set Content-Type; browser will set it with boundary
        },
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create garage");
      }

      const result = await response.json();

      toast({
        title: "Garage added successfully",
        description: result.message || "New garage and owner account have been created.",
      });

      // Reset form
      setNewGarageForm({
        garageName: "",
        garageLocation: "",
        garageContactPhone: "",
        garageOpenTime: "",
        garageDescription: "",
        ownerName: "",
        ownerEmail: "",
        ownerPassword: "",
        ownerMobileNumber: "",
        garageImage: null,
      });
      setShowAddGarageForm(false);
      loadAdminData();
    } catch (error: any) {
      toast({
        title: "Failed to add garage",
        description: error?.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setAddingGarage(false);
    }
  };

  const filteredGarages = useMemo(() => {
    const query = search.toLowerCase();
    return garages.filter((g) => {
      if (!query) return true;
      return [
        g.name,
        g.addressState,
        g.ownerName,
        g.ownerEmail,
        g.ownerMobileNumber,
        g.contactPhone,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [garages, search]);

  const customerSummaries = useMemo(() => {
    const map = new Map<string, CustomerSummary>();
    for (const b of bookings) {
      const email = b.email || "unknown@auto.com";
      const existing = map.get(email);
      if (existing) {
        existing.totalBookings += 1;
        existing.totalSpent += (b.total || 0);
      } else {
        map.set(email, { email, name: b.name, phone: b.phone, totalBookings: 1, totalSpent: b.total || 0, lastBookingAt: b.createdAt });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [bookings]);

  const usersList = useMemo(() => {
    const assignedStaffUserIds = new Set<string>();
    Object.values(garageStaffByGarage).forEach((members) => {
      members.forEach((member) => {
        const id = String(member.userId || member.user?.id || "").trim();
        if (id) assignedStaffUserIds.add(id);
      });
    });

    return users.map(u => ({
      id: u.id,
      name: u.name || "No name",
      email: u.email,
      role:
        assignedStaffUserIds.has(String(u.id || "")) && ["customer", "user", ""].includes(String(u.role || "").toLowerCase())
          ? "staff"
          : (u.role || "user"),
      source: "Database"
    }));
  }, [users, garageStaffByGarage]);

  const filteredUsersList = useMemo(() => {
    const query = search.trim().toLowerCase();
    return usersList.filter((u) => {
      const roleMatch = userRoleFilter === "all" || String(u.role).toLowerCase() === userRoleFilter;
      if (!roleMatch) return false;
      if (!query) return true;
      return [u.name, u.email, u.role]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [usersList, userRoleFilter, search]);

  const garageStaffRows = useMemo(() => {
    return garages.map((garage) => {
      const staffMembers = (garageStaffByGarage[garage.id] || []).map((member, idx) => ({
        id: String(member.id || member.userId || `${garage.id}-${idx}`),
        name: String(member.name || member.user?.name || "No name"),
        email: String(member.emailId || member.user?.email || "No email"),
        role: String(member.user?.role || member.role || "staff"),
      }));

      return {
        garage,
        staffMembers,
      };
    });
  }, [garages, garageStaffByGarage]);

  const filteredGarageStaffRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return garageStaffRows;

    return garageStaffRows
      .map((row) => {
        const garageMatched = [row.garage.name, row.garage.addressState]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));

        const staffMembers = garageMatched
          ? row.staffMembers
          : row.staffMembers.filter((member) =>
              [member.name, member.email, member.role]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(query))
            );

        return { ...row, staffMembers };
      })
      .filter((row) => row.staffMembers.length > 0 || [row.garage.name, row.garage.addressState]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)));
  }, [garageStaffRows, search]);

  const filteredCustomerSummaries = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return customerSummaries;
    return customerSummaries.filter((customer) =>
      [customer.name, customer.email, customer.phone]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [customerSummaries, search]);

  useEffect(() => {
    if (activeOption !== "manage-customer") return;
    if (filteredCustomerSummaries.length === 0) return;
    const hasSelected = filteredCustomerSummaries.some((c) => c.email === selectedCustomerEmail);
    if (!hasSelected) {
      setSelectedCustomerEmail(filteredCustomerSummaries[0].email);
    }
  }, [activeOption, filteredCustomerSummaries, selectedCustomerEmail]);

  const selectedCustomerBookings = useMemo(() => {
    if (!selectedCustomerEmail) return [];
    return bookings
      .filter((b) => b.email === selectedCustomerEmail)
      .sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
  }, [bookings, selectedCustomerEmail]);

  const analytics = useMemo(() => {
    const normalizeStatus = (value: string) => value.replace(/[\s_]+/g, "-").toLowerCase();

    const completedRevenue = bookings
      .filter((booking) => normalizeStatus(booking.status) === "completed")
      .reduce((sum, booking) => sum + (booking.total || 0), 0);
    const totalBookings = bookings.length;
    const completedCount = bookings.filter((booking) => normalizeStatus(booking.status) === "completed").length;
    const pendingCount = bookings.filter((booking) => normalizeStatus(booking.status) === "pending").length;
    const inProgressCount = bookings.filter((booking) => normalizeStatus(booking.status) === "in-progress").length;
    const cancellationCount = bookings.filter((booking) => normalizeStatus(booking.status) === "cancelled").length;

    const completionRate = totalBookings > 0 ? Math.round((completedCount / totalBookings) * 100) : 0;
    const cancellationRate = totalBookings > 0 ? Math.round((cancellationCount / totalBookings) * 100) : 0;
    const averageOrderValue = completedCount > 0 ? Math.round(completedRevenue / completedCount) : 0;

    const activeGarages = new Set(bookings.map((booking) => booking.garageId).filter(Boolean)).size;

    const garageLookup = new Map(garages.map((garage) => [garage.id, garage.name]));
    const garageRevenueMap = new Map<string, number>();
    bookings.forEach((booking) => {
      const current = garageRevenueMap.get(booking.garageId) || 0;
      garageRevenueMap.set(booking.garageId, current + (booking.total || 0));
    });

    const garageRevenueRows = Array.from(garageRevenueMap.entries())
      .map(([garageId, revenue]) => ({
        garageId,
        garageName: garageLookup.get(garageId) || "Unknown Garage",
        revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const maxGarageRevenue = garageRevenueRows[0]?.revenue || 0;

    const statusCounts = bookingStatuses.map((status) => {
      const count = bookings.filter((booking) => normalizeStatus(booking.status) === status).length;
      return {
        status,
        count,
        percentage: totalBookings > 0 ? Math.round((count / totalBookings) * 100) : 0,
      };
    });

    const now = new Date();
    const monthKey = (date: Date) => monthKeyIST(date);
    const monthLabel = (date: Date) => monthLabelIST(date);

    const months = Array.from({ length: 6 }, (_, index) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      return {
        key: monthKey(d),
        label: monthLabel(d),
        bookings: 0,
        revenue: 0,
      };
    });

    const monthIndexMap = new Map(months.map((m, index) => [m.key, index]));

    bookings.forEach((booking) => {
      const parsed = new Date(booking.date || booking.createdAt);
      if (Number.isNaN(parsed.getTime())) return;
      const index = monthIndexMap.get(monthKey(parsed));
      if (index === undefined) return;

      months[index].bookings += 1;
      months[index].revenue += booking.total || 0;
    });

    const maxMonthlyRevenue = months.reduce((max, month) => Math.max(max, month.revenue), 0);

    return {
      totalRevenue: completedRevenue,
      totalBookings,
      completedCount,
      pendingCount,
      inProgressCount,
      cancellationCount,
      completionRate,
      cancellationRate,
      averageOrderValue,
      activeGarages,
      garageRevenueRows,
      maxGarageRevenue,
      statusCounts,
      months,
      maxMonthlyRevenue,
      topCustomers: customerSummaries.slice(0, 5),
    };
  }, [bookings, garages, customerSummaries]);

  const renderSection = () => {
    if (activeOption === "analytics") {
      return (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="card-simple">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Revenue</p>
                    <p className="text-2xl font-bold">₹{analytics.totalRevenue.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="card-simple">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Completion Rate</p>
                    <p className="text-2xl font-bold">{analytics.completionRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="card-simple">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-500">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">AOV</p>
                    <p className="text-2xl font-bold">₹{analytics.averageOrderValue.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="card-simple">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500">
                    <Filter className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Cancellation Rate</p>
                    <p className="text-2xl font-bold">{analytics.cancellationRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Card className="card-simple">
              <CardContent className="p-5">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Bookings</p>
                <p className="text-2xl font-bold mt-2">{analytics.totalBookings}</p>
              </CardContent>
            </Card>
            <Card className="card-simple">
              <CardContent className="p-5">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">In Progress</p>
                <p className="text-2xl font-bold mt-2">{analytics.inProgressCount}</p>
              </CardContent>
            </Card>
            <Card className="card-simple">
              <CardContent className="p-5">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Pending</p>
                <p className="text-2xl font-bold mt-2">{analytics.pendingCount}</p>
              </CardContent>
            </Card>
            <Card className="card-simple">
              <CardContent className="p-5">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active Garages</p>
                <p className="text-2xl font-bold mt-2">{analytics.activeGarages || garages.length}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="card-simple">
              <CardHeader><CardTitle>Garage Revenue Leaderboard</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {analytics.garageRevenueRows.map((row, idx) => (
                  <div key={row.garageId} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold">{idx + 1}. {row.garageName}</span>
                      <span className="font-bold text-primary">₹{row.revenue.toLocaleString()}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${analytics.maxGarageRevenue > 0 ? Math.max((row.revenue / analytics.maxGarageRevenue) * 100, 4) : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
                {analytics.garageRevenueRows.length === 0 ? <p className="text-sm text-muted-foreground">No revenue data available.</p> : null}
              </CardContent>
            </Card>
            <Card className="card-simple">
              <CardHeader><CardTitle>Status Distribution</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {analytics.statusCounts.map((item) => (
                  <div key={item.status} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="capitalize">{item.status.replace(/-/g, " ")}</span>
                      <span className="font-bold">{item.count} ({item.percentage}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${item.percentage}%` }} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="card-simple">
              <CardHeader><CardTitle>6-Month Revenue Trend</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {analytics.months.map((month) => (
                  <div key={month.key} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold">{month.label}</span>
                      <span className="font-bold">₹{month.revenue.toLocaleString()} • {month.bookings} bookings</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${analytics.maxMonthlyRevenue > 0 ? Math.max((month.revenue / analytics.maxMonthlyRevenue) * 100, 4) : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="card-simple">
              <CardHeader><CardTitle>Top Customers</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {analytics.topCustomers.map((customer, idx) => (
                  <div key={customer.email} className="flex items-center justify-between py-2 border-b last:border-0 text-sm">
                    <div>
                      <p className="font-semibold">{idx + 1}. {customer.name || customer.email}</p>
                      <p className="text-xs text-muted-foreground">{customer.totalBookings} bookings</p>
                    </div>
                    <p className="font-bold text-primary">₹{customer.totalSpent.toLocaleString()}</p>
                  </div>
                ))}
                {analytics.topCustomers.length === 0 ? <p className="text-sm text-muted-foreground">No customer activity available.</p> : null}
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    if (activeOption === "manage-garage") {
      return (
        <div className="space-y-6">
          {/* Add Garage Form */}
          {showAddGarageForm ? (
            <Card className="card-simple border-primary/50 border-2">
              <CardHeader className="bg-primary/5">
                <CardTitle>Add New Garage with Owner</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Garage Details Section */}
                <div className="space-y-3">
                  <h3 className="font-bold text-sm text-primary">Garage Details</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Garage Name *</label>
                      <Input
                        value={newGarageForm.garageName}
                        onChange={(e) => setNewGarageForm((prev) => ({ ...prev, garageName: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Contact Phone</label>
                      <Input
                        value={newGarageForm.garageContactPhone}
                        onChange={(e) => setNewGarageForm((prev) => ({ ...prev, garageContactPhone: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">City/State/Location</label>
                      <Input
                        value={newGarageForm.garageLocation}
                        onChange={(e) => setNewGarageForm((prev) => ({ ...prev, garageLocation: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Opening Time</label>
                      <Input
                        value={newGarageForm.garageOpenTime}
                        onChange={(e) => setNewGarageForm((prev) => ({ ...prev, garageOpenTime: e.target.value }))}
                      />
                    </div>
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Description</label>
                      <textarea
                        className="w-full border rounded px-3 py-2 text-sm resize-none"
                        rows={2}
                        value={newGarageForm.garageDescription}
                        onChange={(e) => setNewGarageForm((prev) => ({ ...prev, garageDescription: e.target.value }))}
                      />
                    </div>
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Garage Image/Logo</label>
                      <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          id="garage-image"
                          onChange={(e) => setNewGarageForm((prev) => ({
                            ...prev,
                            garageImage: e.target.files?.[0] || null
                          }))}
                        />
                        <label htmlFor="garage-image" className="cursor-pointer">
                          {newGarageForm.garageImage ? (
                            <div className="text-sm">
                              <p className="font-semibold text-green-600">✓ {newGarageForm.garageImage.name}</p>
                              <p className="text-xs text-muted-foreground">Click to change</p>
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">
                              <p className="font-semibold">Click to upload image</p>
                              <p className="text-xs">or drag and drop (PNG, JPG, GIF)</p>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Owner Details Section */}
                <div className="space-y-3 pt-4 border-t">
                  <h3 className="font-bold text-sm text-primary">Garage Owner Details</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Owner Name *</label>
                      <Input
                        value={newGarageForm.ownerName}
                        onChange={(e) => setNewGarageForm((prev) => ({ ...prev, ownerName: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Owner Email *</label>
                      <Input
                        type="email"
                        value={newGarageForm.ownerEmail}
                        onChange={(e) => setNewGarageForm((prev) => ({ ...prev, ownerEmail: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Mobile Number *</label>
                      <Input
                        type="tel"
                        value={newGarageForm.ownerMobileNumber}
                        onChange={(e) => setNewGarageForm((prev) => ({ ...prev, ownerMobileNumber: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Password *</label>
                      <Input
                        type="password"
                        value={newGarageForm.ownerPassword}
                        onChange={(e) => setNewGarageForm((prev) => ({ ...prev, ownerPassword: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    onClick={handleAddGarage}
                    disabled={addingGarage}
                    className="flex-1"
                  >
                    {addingGarage ? "Creating..." : "Create Garage & Owner Account"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddGarageForm(false);
                      setNewGarageForm({
                        garageName: "",
                        garageLocation: "",
                        garageContactPhone: "",
                        garageOpenTime: "",
                        garageDescription: "",
                        ownerName: "",
                        ownerEmail: "",
                        ownerPassword: "",
                        ownerMobileNumber: "",
                        garageImage: null,
                      });
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Button onClick={() => setShowAddGarageForm(true)} className="gap-2">
              <Plus className="w-4 h-4" /> Add New Garage
            </Button>
          )}

          {/* Existing Garages */}
          <div className="space-y-4">
            {filteredGarages.length === 0 ? (
              <Card className="card-simple border-dashed">
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No garages found</p>
                </CardContent>
              </Card>
            ) : (
              filteredGarages.map((garage) => {
                const draft = garageEdits[garage.id] || {};
                const name = draft.name ?? garage.name;
                const addressState = draft.addressState ?? garage.addressState;
                const ownerName = garage.ownerName || "Owner name not set";
                const garageEmail = garage.ownerEmail || garage.email || `garage.${garage.id.slice(0, 8)}@autogarage.local`;
                const isExpanded = expandedGarageId === garage.id;
                
                return (
                  <Card key={garage.id} className="card-simple p-5 border-l-4 border-l-primary">
                    <button
                      type="button"
                      className="w-full text-left"
                      onClick={() => setExpandedGarageId(isExpanded ? null : garage.id)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-lg font-bold text-foreground">{garage.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">{garage.addressState || "Location not set"}</p>
                          <p className="text-xs text-muted-foreground mt-1">Owner: {ownerName}</p>
                        </div>
                        <Badge variant="outline" className="uppercase text-[9px]">
                          {isExpanded ? "Hide Details" : "View Details"}
                        </Badge>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="mt-5 pt-5 border-t space-y-5">
                        {/* Edit Fields */}
                        <div className="grid md:grid-cols-3 gap-4 pb-2">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground">Name</label>
                            <Input value={name} onChange={e => updateGarageEditField(garage.id, "name", e.target.value, "garage")} />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground">State</label>
                            <Input value={addressState} onChange={e => updateGarageEditField(garage.id, "addressState", e.target.value, "garage")} />
                          </div>
                          <div className="flex items-end gap-2 pb-0.5">
                            <Button size="sm" onClick={() => saveGaragePatch(garage.id, { name, addressState }, "Updated", "Done")}>Save</Button>
                            <Button size="sm" variant="destructive" onClick={() => deleteGarage(garage.id)}>Delete</Button>
                          </div>
                        </div>

                        {/* Garage Details */}
                        <div className="grid md:grid-cols-3 gap-3 bg-muted/20 p-4 rounded-lg text-xs">
                          <div>
                            <p className="text-muted-foreground uppercase font-bold text-[10px]">Garage ID</p>
                            <p className="font-mono mt-1">{garage.id}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground uppercase font-bold text-[10px]">Contact Phone</p>
                            <p className="mt-1">{garage.contactPhone || "-"}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground uppercase font-bold text-[10px]">Owner Name</p>
                            <p className="mt-1">{ownerName}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground uppercase font-bold text-[10px]">Owner Email</p>
                            <p className="mt-1">{garageEmail}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground uppercase font-bold text-[10px]">Owner Mobile</p>
                            <p className="mt-1">{garage.ownerMobileNumber || "-"}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground uppercase font-bold text-[10px]">Open Time</p>
                            <p className="mt-1">{garage.openTime || "-"}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground uppercase font-bold text-[10px]">Created At</p>
                            <p className="mt-1">{toDateLabel(garage.createdAt)}</p>
                          </div>
                          <div className="md:col-span-3">
                            <p className="text-muted-foreground uppercase font-bold text-[10px]">Description</p>
                            <p className="mt-1">{garage.description || "-"}</p>
                          </div>
                        </div>

                        {/* Owner Access */}
                        <div className="space-y-4">
                          <h3 className="font-bold text-sm">Owner Access</h3>
                          <div className="grid md:grid-cols-1 gap-4 bg-muted/40 p-4 rounded-lg">
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold uppercase text-muted-foreground">Email/Username</label>
                              <div className="flex gap-2">
                                <code className="flex-1 bg-background p-2 rounded text-xs font-mono border">{garageEmail}</code>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    navigator.clipboard.writeText(garageEmail);
                                    toast({ title: "Copied!", description: "Email copied to clipboard" });
                                  }}
                                >
                                  Copy
                                </Button>
                              </div>
                            </div>
                          </div>
                          <p className="text-[10px] text-muted-foreground italic">
                            Password is hidden in admin panel for security. Owner can login at /garage/login using their own password.
                          </p>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })
            )}
          </div>
        </div>
      );
    }

    if (activeOption === "garage-wise-staff") {
      return (
        <div className="space-y-4">
          {filteredGarageStaffRows.length === 0 ? (
            <Card className="card-simple border-dashed">
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No staff found for current filter.</p>
              </CardContent>
            </Card>
          ) : (
            filteredGarageStaffRows.map(({ garage, staffMembers }) => (
              <Card key={garage.id} className="card-simple p-5 border-l-4 border-l-primary">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div>
                    <p className="text-lg font-bold">{garage.name}</p>
                    <p className="text-xs text-muted-foreground">{garage.addressState || "Location not set"}</p>
                  </div>
                  <Badge variant="secondary">{staffMembers.length} Staff</Badge>
                </div>

                {staffMembers.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-4 text-xs text-muted-foreground">
                    No manager/mechanic assigned to this garage yet.
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-3">
                    {staffMembers.map((member) => (
                      <div key={member.id} className="rounded-lg border p-3 bg-background/70">
                        <p className="font-semibold text-sm text-foreground">{member.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{member.email}</p>
                        <Badge variant="outline" className="mt-2 text-[10px] uppercase">{member.role}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      );
    }

    if (activeOption === "manage-customer") {
      return (
        <div className="grid lg:grid-cols-[340px,1fr] gap-4">
          <Card className="card-simple p-4">
            <p className="text-xs font-bold uppercase text-muted-foreground mb-3">Customers</p>
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {filteredCustomerSummaries.length === 0 ? (
                <p className="text-sm text-muted-foreground">No customer activity found.</p>
              ) : (
                filteredCustomerSummaries.map((customer) => (
                  <button
                    key={customer.email}
                    type="button"
                    onClick={() => setSelectedCustomerEmail(customer.email)}
                    className={`w-full text-left rounded-lg border p-3 transition ${selectedCustomerEmail === customer.email ? "border-primary bg-primary/10" : "border-border hover:border-primary/60"}`}
                  >
                    <p className="text-sm font-semibold text-foreground">{customer.name || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">{customer.email}</p>
                    <p className="text-[11px] text-muted-foreground mt-2">{customer.totalBookings} bookings • ₹{customer.totalSpent.toLocaleString()}</p>
                  </button>
                ))
              )}
            </div>
          </Card>

          <Card className="card-simple p-4">
            <p className="text-xs font-bold uppercase text-muted-foreground mb-3">Booking Timeline</p>
            {!selectedCustomerEmail ? (
              <p className="text-sm text-muted-foreground">Select a customer to view activity.</p>
            ) : selectedCustomerBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No bookings found for selected customer.</p>
            ) : (
              <div className="space-y-3">
                {selectedCustomerBookings.map((booking) => (
                  <div key={booking.id} className="rounded-lg border p-3 bg-background/70">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-sm">{booking.vehicle || "Vehicle"}</p>
                      <Badge variant="outline" className="capitalize">{booking.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Tracking ID: {booking.trackingId || "-"}</p>
                    <p className="text-xs text-muted-foreground">Date: {booking.date || "-"} {booking.time ? `• ${booking.time}` : ""}</p>
                    <p className="text-xs font-semibold mt-2">Total: ₹{(booking.total || 0).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      );
    }

    if (activeOption === "garage-contact") {
      return (
        <div className="space-y-3">
          {filteredGarages.length === 0 ? (
            <Card className="card-simple border-dashed">
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No garage contacts found.</p>
              </CardContent>
            </Card>
          ) : (
            filteredGarages.map((garage) => (
              <Card key={garage.id} className="card-simple p-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-bold text-base">{garage.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{garage.addressState || "Location not set"}</p>
                    <p className="text-xs text-muted-foreground">{garage.description || "No description"}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-lg border p-3 bg-background/70">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Contact Phone</p>
                      <p className="mt-1 font-semibold text-foreground">{garage.contactPhone || "-"}</p>
                    </div>
                    <div className="rounded-lg border p-3 bg-background/70">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Owner Name</p>
                      <p className="mt-1 font-semibold text-foreground">{garage.ownerName || "-"}</p>
                    </div>
                    <div className="rounded-lg border p-3 bg-background/70">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Owner Email</p>
                      <p className="mt-1 font-semibold text-foreground break-all">{garage.ownerEmail || garage.email || "-"}</p>
                    </div>
                    <div className="rounded-lg border p-3 bg-background/70">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Owner Mobile</p>
                      <p className="mt-1 font-semibold text-foreground">{garage.ownerMobileNumber || "-"}</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      );
    }

    if (activeOption === "manage-all-users") {
      return (
        <div className="space-y-3">
          <Card className="card-simple p-4">
            <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
              <p className="text-xs font-bold uppercase text-muted-foreground">Filter Users</p>
              <div className="flex items-center gap-3">
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="h-9 min-w-36 text-xs font-bold uppercase px-3 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="all">All Roles</option>
                  <option value="customer">Customer</option>
                  <option value="manager">Manager</option>
                  <option value="mechanic">Mechanic</option>
                  <option value="admin">Admin</option>
                  <option value="staff">Staff</option>
                </select>
                <Badge variant="secondary">{filteredUsersList.length} Users</Badge>
              </div>
            </div>
          </Card>

          {filteredUsersList.map(u => (
            <Card key={u.id} className="card-simple p-4 flex items-center justify-between gap-3">
              <div>
                <p className="font-bold">{u.name}</p>
                <p className="text-xs text-muted-foreground">{u.email}</p>
              </div>
              <select
                value={u.role}
                onChange={async (e) => {
                  const { error } = await api.updateUserRoleApi(u.id, e.target.value);
                  if (!error) { toast({ title: "Role Updated" }); loadAdminData(); }
                }}
                className="h-9 min-w-36 text-xs font-bold uppercase px-3 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="customer">Customer</option>
                <option value="manager">Manager</option>
                <option value="mechanic">Mechanic</option>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </Card>
          ))}
          {filteredUsersList.length === 0 ? (
            <Card className="card-simple border-dashed">
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No users found for current filter.</p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      );
    }

    return <div className="p-10 text-center text-muted-foreground">Section under construction or coming soon.</div>;
  };

  if (authLoading) return null;
  if (loading) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="relative z-10 bg-background border-b">
        <div className="page-shell flex items-center gap-6 h-12 overflow-x-auto scrollbar-hide">
          {navOptions.map(opt => (
            <button
              key={opt.key}
              onClick={() => setActiveOption(opt.key)}
              className={`text-[10px] font-bold uppercase tracking-widest whitespace-nowrap h-full px-2 border-b-2 transition-all ${activeOption === opt.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 pt-24 pb-12">
        <div className="page-shell max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <h1 className="text-4xl font-display text-foreground">Admin Control</h1>
              <p className="text-muted-foreground">System-wide management and performance insights.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  className="pl-9 h-10"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <ProfileEditorDialog />
              {activeOption === "manage-garage" && !showAddGarageForm && (
                <Button onClick={() => setShowAddGarageForm(true)} className="gap-2">
                  <Plus className="w-4 h-4" /> Add Garage
                </Button>
              )}
              <Button onClick={() => logout()} variant="destructive" className="gap-2">
                Sign Out
              </Button>
            </div>
          </div>

          {renderSection()}
        </div>
      </main>
    </div>
  );
};

export default Admin;
