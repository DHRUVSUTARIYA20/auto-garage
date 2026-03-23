import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/useAuth";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api-client";
import ProfileEditorDialog from "@/components/ProfileEditorDialog";
import {
  Users,
  Calendar,
  Settings,
  Plus,
  Wrench,
  Store,
  ExternalLink,
  ClipboardList,
  UserPlus,
  Trash2,
  Phone,
  Mail,
  MapPin,
  TrendingUp,
  ChevronDown,
  AlertCircle,
  Menu,
  X,
} from "lucide-react";
import Footer from "@/components/Footer";

type Staff = {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
};

type Booking = {
  id: string;
  trackingId: string;
  name: string;
  email: string;
  phone: string;
  vehicle: string;
  date: string;
  time: string;
  deliveryOption?: string;
  homeAddress?: string;
  total: number;
  status: string;
  assignedTo?: string;
  assignedToName?: string;
  taskStatus?: string;
  progressPercentage?: number;
  taskNotes?: string;
  createdAt: string;
};

type Garage = {
  id: string;
  name: string;
  contactPhone: string | null;
  addressStreet: string | null;
  pickupFee: number;
  deliveryFee: number;
  serviceCatalog: Array<{ id: string; name: string; price: number }>;
  staff: Staff[];
  bookings: Booking[];
};

const normalizeStatusKey = (status?: string) => String(status || "").trim().toLowerCase().replace(/[\s_]+/g, "-");

const slugifyServiceId = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || `service-${Date.now()}`;

const normalizeServiceCatalog = (raw: any): Array<{ id: string; name: string; price: number }> => {
  if (Array.isArray(raw)) {
    return raw
      .map((item, idx) => {
        if (typeof item === "string") {
          const name = item.trim();
          if (!name) return null;
          return { id: slugifyServiceId(name), name, price: 0 };
        }
        if (!item || typeof item !== "object") return null;
        const name = String(item.name ?? item.service_name ?? item.service ?? "").trim();
        if (!name) return null;
        const id = String(item.id ?? item.service_id ?? slugifyServiceId(name));
        const price = Number(item.price ?? item.amount ?? 0) || 0;
        return { id, name, price };
      })
      .filter((item): item is { id: string; name: string; price: number } => Boolean(item));
  }

  if (typeof raw === "string") {
    return raw
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((name) => ({ id: slugifyServiceId(name), name, price: 0 }));
  }

  return [];
};

export default function GarageHostDashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [garage, setGarage] = useState<Garage | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "staff" | "bookings" | "settings">("overview");

  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    name: "",
    contactPhone: "",
    addressStreet: "",
    pickupFee: 299,
    deliveryFee: 499,
    serviceCatalog: [] as Array<{ id: string; name: string; price: number }>,
  });
  const [newServiceName, setNewServiceName] = useState("");
  const [newServicePrice, setNewServicePrice] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const [assignTaskBookingId, setAssignTaskBookingId] = useState<string | null>(null);
  const [selectedStaffForAssignment, setSelectedStaffForAssignment] = useState<string>("");
  const [bookingsFilter, setBookingsFilter] = useState<"all" | "pending" | "in-progress" | "completed" | "unassigned">("all");

  const normalizeGarageData = (raw: Record<string, any>): Garage => ({
    id: String(raw.id ?? ""),
    name: String(raw.garage_name ?? raw.name ?? ""),
    contactPhone: String(raw.contact_phone ?? raw.contactPhone ?? ""),
    addressStreet: String(raw.location ?? raw.addressStreet ?? ""),
    pickupFee: Math.max(0, Number(raw.pickupFee ?? raw.pickup_fee ?? 299) || 0),
    deliveryFee: Math.max(0, Number(raw.deliveryFee ?? raw.delivery_fee ?? 499) || 0),
    serviceCatalog: normalizeServiceCatalog(raw.serviceCatalog ?? raw.service_catalog ?? raw.services),
    staff: (raw.staff || []).map((s: any) => ({
      id: s.id,
      userId: s.user_id || s.userId,
      user: {
        id: s.user?.id || s.user_id || s.userId,
        name: s.user?.name || s.name || "Staff",
        email: s.user?.email || s.emailId || "",
        role: s.user?.role || "staff"
      }
    })),
    bookings: (raw.bookings || []).map((b: any) => ({
      id: b.id,
      trackingId: b.tracking_id || b.trackingId || b.id.slice(0, 8),
      name: b.name || b.customer?.name || "Customer",
      email: b.email || b.customer?.email || "",
      phone: b.phone || b.customer?.phone || "",
      vehicle: b.vehicle || "Vehicle",
      date: b.service_date || b.date || "",
      time: b.time || "",
      deliveryOption: String(b.deliveryOption ?? b.delivery_option ?? "none"),
      homeAddress: String(b.homeAddress ?? b.home_address ?? ""),
      total: Number(b.total_price ?? b.totalPrice ?? b.total ?? b.subtotal ?? 0) || 0,
      status: b.status || "pending",
      assignedTo: b.assignedTo || b.assigned_to || "",
      assignedToName: b.assignedToName || b.assigned_to_name || "",
      taskStatus: b.taskStatus || b.task_status || "",
      progressPercentage: Number(b.progressPercentage ?? b.progress_percentage ?? 0),
      taskNotes: b.taskNotes || b.task_notes || "",
      createdAt: b.created_at || b.createdAt || ""
    }))
  });

  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const loadData = async () => {
    setLoading(true);
    try {
      let resolvedGarage: any = null;

      // Sometimes after create/update the backend may briefly return null.
      // Retry a few times before showing the "No Garage Found" state.
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const { data, error } = await api.getMyGarageApi();
        if (error) {
          console.error("Garage load error:", error);
          throw new Error(error);
        }

        if (data) {
          resolvedGarage = data;
          break;
        }

        if (attempt < 2) {
          await wait(700);
        }
      }

      if (!resolvedGarage) {
        console.warn("No garage data returned from API after retries");
        setGarage(null);
        return;
      }

      console.log("Garage data from API:", resolvedGarage);
      console.log("Bookings from API:", resolvedGarage.bookings);

      const normalized = normalizeGarageData(resolvedGarage);
      console.log("Normalized garage:", normalized);
      setGarage(normalized);
      setSettingsForm({
        name: normalized.name || "",
        contactPhone: normalized.contactPhone || "",
        addressStreet: normalized.addressStreet || "",
        pickupFee: normalized.pickupFee,
        deliveryFee: normalized.deliveryFee,
        serviceCatalog: normalized.serviceCatalog || [],
      });
    } catch (error: any) {
      console.error("Garage loading failed:", error);
      toast({
        title: "Error Loading Garage",
        description: error.message || "Failed to load garage data. Please try refreshing or creating a garage.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGarageSettings = async () => {
    if (!garage?.id) return;

    setIsSavingSettings(true);
    try {
      const { error } = await api.updateGarageWithFallback(garage.id, {
        garage_name: settingsForm.name,
        contact_phone: settingsForm.contactPhone,
        location: settingsForm.addressStreet,
        pickupFee: Math.max(0, Number(settingsForm.pickupFee) || 0),
        deliveryFee: Math.max(0, Number(settingsForm.deliveryFee) || 0),
        serviceCatalog: settingsForm.serviceCatalog,
        services: settingsForm.serviceCatalog.map((service) => service.name),
      });

      if (error) throw new Error(error);

      toast({ title: "Garage updated", description: "Garage profile settings saved." });
      await loadData();
    } catch (error: any) {
      toast({ title: "Save failed", description: error.message || "Unable to save settings", variant: "destructive" });
    } finally {
      setIsSavingSettings(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    loadData();
  }, [authLoading, user]);

  useEffect(() => {
    if (authLoading || !user) return;
    if (loading) return;
    if (garage) return;

    const retryTimer = window.setTimeout(() => {
      loadData();
    }, 1500);

    return () => window.clearTimeout(retryTimer);
  }, [authLoading, user, loading, garage]);

  const handleUpdateBookingStatus = async (trackingId: string, status: string) => {
    try {
      const { error } = await api.updateBookingStatusApi(trackingId, status);
      if (error) throw new Error(error);
      toast({ title: "Status updated", description: `Booking ${trackingId} set to ${status}` });
      loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleAssignTask = async () => {
    if (!assignTaskBookingId || !selectedStaffForAssignment) return;

    try {
      const selectedStaff = garage?.staff.find(s => (s.user.id || s.userId) === selectedStaffForAssignment);
      if (!selectedStaff) throw new Error("Staff member not found");

      const { error } = await api.assignTaskToStaffApi(
        assignTaskBookingId,
        selectedStaffForAssignment,
        selectedStaff.user.name
      );
      
      if (error) throw new Error(error);

      toast({
        title: "Task assigned",
        description: `Task assigned to ${selectedStaff.user.name}`,
      });

      setAssignTaskBookingId(null);
      setSelectedStaffForAssignment("");
      loadData();
    } catch (error: any) {
      toast({
        title: "Assignment failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRemoveStaff = async (staffUserId: string, staffName: string) => {
    if (!garage?.id) return;

    const confirmed = window.confirm(`Remove ${staffName} from this garage?`);
    if (!confirmed) return;

    try {
      const { error } = await api.removeGarageStaffApi(staffUserId, garage.id);
      if (error) throw new Error(error);
      toast({ title: "Staff removed", description: `${staffName} removed successfully.` });
      loadData();
    } catch (error: any) {
      toast({ title: "Failed to remove staff", description: error.message, variant: "destructive" });
    }
  };

  const persistServiceCatalog = async (catalog: Array<{ id: string; name: string; price: number }>) => {
    if (!garage?.id) return false;

    const { error } = await api.updateGarageWithFallback(garage.id, {
      serviceCatalog: catalog,
      services: catalog.map((service) => service.name),
    });

    if (error) {
      toast({ title: "Failed to save services", description: error, variant: "destructive" });
      return false;
    }

    return true;
  };

  const handleAddService = async () => {
    const name = newServiceName.trim();
    const price = Number(newServicePrice || 0);
    if (!name) return;

    const nextCatalog = [
      ...settingsForm.serviceCatalog,
      {
        id: slugifyServiceId(name),
        name,
        price: Number.isFinite(price) ? Math.max(0, price) : 0,
      },
    ];

    setSettingsForm((prev) => ({ ...prev, serviceCatalog: nextCatalog }));
    setNewServiceName("");
    setNewServicePrice("");

    const ok = await persistServiceCatalog(nextCatalog);
    if (ok) {
      toast({ title: "Service saved", description: "Service and price stored successfully." });
      loadData();
    }
  };

  const handleUpdateService = (index: number, field: "name" | "price", value: string) => {
    setSettingsForm((prev) => {
      const next = [...prev.serviceCatalog];
      const current = next[index];
      if (!current) return prev;

      if (field === "name") {
        const nextName = value;
        next[index] = {
          ...current,
          name: nextName,
          id: slugifyServiceId(nextName || current.id),
        };
      } else {
        next[index] = {
          ...current,
          price: Math.max(0, Number(value || 0) || 0),
        };
      }

      return { ...prev, serviceCatalog: next };
    });
  };

  const handleRemoveService = async (index: number) => {
    const nextCatalog = settingsForm.serviceCatalog.filter((_, idx) => idx !== index);
    setSettingsForm((prev) => ({ ...prev, serviceCatalog: nextCatalog }));

    const ok = await persistServiceCatalog(nextCatalog);
    if (ok) {
      toast({ title: "Service removed", description: "Service catalog updated." });
      loadData();
    }
  };

  // All hooks MUST be declared before any conditional returns
  const stats = useMemo(() => {
    if (!garage) return { 
      revenue: 0, 
      completed: 0, 
      pending: 0,
      inProgress: 0,
      due: 0,
      dueAmount: 0,
      completionRate: 0,
      avgServiceValue: 0,
    };
    
    const completed = garage.bookings.filter(b => normalizeStatusKey(b.status) === "completed").length;
    const pending = garage.bookings.filter(b => normalizeStatusKey(b.status) === "pending").length;
    const inProgress = garage.bookings.filter(b => normalizeStatusKey(b.status) === "in-progress").length;
    const due = pending + inProgress; // Tasks not yet completed
    
    const revenue = garage.bookings
      .filter((b) => normalizeStatusKey(b.status) === "completed")
      .reduce((sum, b) => sum + (b.total || 0), 0);
    const dueAmount = garage.bookings
      .filter((b) => normalizeStatusKey(b.status) !== "completed")
      .reduce((sum, b) => sum + (b.total || 0), 0);
    
    const completionRate = garage.bookings.length > 0 
      ? Math.round((completed / garage.bookings.length) * 100) 
      : 0;
    
    const avgServiceValue = completed > 0 
      ? Math.round(revenue / completed) 
      : 0;

    return { 
      revenue, 
      completed, 
      pending,
      inProgress,
      due,
      dueAmount,
      completionRate,
      avgServiceValue,
    };
  }, [garage]);

  const filteredBookings = useMemo(() => {
    if (!garage) return [];
    
    let filtered = garage.bookings;
    
    switch (bookingsFilter) {
      case "pending":
        filtered = filtered.filter(b => b.status?.toLowerCase() === "pending");
        break;
      case "in-progress":
        filtered = filtered.filter(b => normalizeStatusKey(b.status) === "in-progress");
        break;
      case "completed":
        filtered = filtered.filter(b => normalizeStatusKey(b.status) === "completed");
        break;
      case "unassigned":
        filtered = filtered.filter(b => !b.assignedTo && b.status?.toLowerCase() !== "completed");
        break;
      default:
        break;
    }
    
    return filtered;
  }, [garage, bookingsFilter]);

  // Safe to check after all hooks
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-2">Loading dashboard...</h2>
          <p className="text-muted-foreground">Checking your account and garage access.</p>
        </div>
      </div>
    );
  }

  if (!garage) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-2">Loading dashboard...</h2>
          <p className="text-muted-foreground mb-6">
            Fetching your garage details. Please wait.
          </p>
          <div className="inline-flex items-center gap-2 text-sm text-primary font-semibold">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Syncing garage data
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 pt-24 pb-12">
        <div className="page-shell max-w-7xl">
          {/* Dashboard Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <div className="flex items-center gap-2 text-primary mb-2">
                <Store className="w-5 h-5" />
                <span className="text-sm font-bold uppercase tracking-[0.2em]">Garage Host Portal</span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-display text-foreground tracking-tight">
                {garage.name}
              </h1>
              <p className="text-muted-foreground mt-2 max-w-xl">
                Managing your operations, staff, and customer bookings in one place.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <ProfileEditorDialog />
              <Button variant="outline" className="gap-2" onClick={() => navigate(`/garage/${garage.id}`)}>
                <ExternalLink className="w-4 h-4" />
                View Public Page
              </Button>
              <Button onClick={() => logout()} variant="destructive" className="gap-2">
                Sign Out
              </Button>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-12">
            <Card className="card-simple">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Revenue</p>
                    <p className="text-2xl font-bold">₹{stats.revenue.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-simple">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500">
                    <ClipboardList className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Completed</p>
                    <p className="text-2xl font-bold">{stats.completed}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-simple">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500">
                    <Wrench className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">In Progress</p>
                    <p className="text-2xl font-bold">{stats.inProgress}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-simple">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Due/Pending</p>
                    <p className="text-2xl font-bold text-red-600">{stats.due}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-simple">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Completion Rate</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.completionRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Fixed left-corner menu trigger + active tab indicator */}
          <div className="fixed left-0 top-24 z-30">
            <Button
              variant="outline"
              className="h-10 pl-3 pr-4 gap-2 rounded-l-none rounded-r-xl border-l-0 border-primary/25 bg-background/95 backdrop-blur shadow-lg"
              onClick={() => setMenuOpen(true)}
            >
              <Menu className="w-4 h-4" />
              Menu
            </Button>
          </div>
          <div className="mb-6 flex items-center justify-end">
            <Badge variant="outline" className="capitalize">{activeTab}</Badge>
          </div>

          {menuOpen && (
            <>
              <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setMenuOpen(false)} />
              <div className="fixed left-0 top-0 h-full w-80 max-w-[85vw] bg-background border-r z-50 p-5">
                <div className="flex items-center justify-between mb-6">
                  <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Dashboard Menu</p>
                  <Button variant="ghost" size="icon" onClick={() => setMenuOpen(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() => { setActiveTab("overview"); setMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${activeTab === "overview" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "hover:bg-muted text-muted-foreground"}`}
                  >
                    <Store className="w-4 h-4" />
                    Overview
                  </button>
                  <button
                    onClick={() => { setActiveTab("bookings"); setMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${activeTab === "bookings" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "hover:bg-muted text-muted-foreground"}`}
                  >
                    <Calendar className="w-4 h-4" />
                    Bookings
                  </button>
                  <button
                    onClick={() => { setActiveTab("staff"); setMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${activeTab === "staff" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "hover:bg-muted text-muted-foreground"}`}
                  >
                    <Users className="w-4 h-4" />
                    Staff Management
                  </button>
                  <button
                    onClick={() => { setActiveTab("settings"); setMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${activeTab === "settings" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "hover:bg-muted text-muted-foreground"}`}
                  >
                    <Settings className="w-4 h-4" />
                    Garage Settings
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Content Area */}
          <div className="max-w-5xl mx-auto">
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Performance Metrics Row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="card-simple bg-gradient-to-br from-green-50 to-green-50/50 border-green-200">
                      <CardContent className="p-6">
                        <p className="text-xs font-bold text-green-900 uppercase tracking-wider">Avg Service Value</p>
                        <p className="text-3xl font-bold text-green-700 mt-2">₹{stats.avgServiceValue.toLocaleString()}</p>
                        <p className="text-[10px] text-green-600 mt-2">Per booking average</p>
                      </CardContent>
                    </Card>

                    <Card className="card-simple bg-gradient-to-br from-blue-50 to-blue-50/50 border-blue-200">
                      <CardContent className="p-6">
                        <p className="text-xs font-bold text-blue-900 uppercase tracking-wider">Due/Incomplete</p>
                        <p className="text-3xl font-bold text-blue-700 mt-2">₹{stats.dueAmount.toLocaleString()}</p>
                        <p className="text-[10px] text-blue-600 mt-2">{stats.due} tasks pending</p>
                      </CardContent>
                    </Card>

                    <Card className="card-simple bg-gradient-to-br from-purple-50 to-purple-50/50 border-purple-200">
                      <CardContent className="p-6">
                        <p className="text-xs font-bold text-purple-900 uppercase tracking-wider">Total Services</p>
                        <p className="text-3xl font-bold text-purple-700 mt-2">{garage.bookings.length}</p>
                        <p className="text-[10px] text-purple-600 mt-2">All time bookings</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Due Payments Section */}
                  {stats.due > 0 && (
                    <Card className="card-simple border-orange-200 bg-orange-50/50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2 text-orange-900">
                          <AlertCircle className="w-5 h-5" />
                          Due/Incomplete Payments (₹{stats.dueAmount.toLocaleString()})
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {garage.bookings
                          .filter(b => b.status?.toLowerCase() !== "completed")
                          .slice(0, 5)
                          .map((booking) => (
                            <div key={booking.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-100">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-[10px] font-mono font-bold text-orange-700">#{booking.trackingId}</span>
                                  <Badge className="text-[9px] uppercase font-bold bg-slate-100 text-slate-900 border border-slate-300">
                                    {booking.status}
                                  </Badge>
                                </div>
                                <p className="text-sm font-semibold text-slate-900">{booking.name}</p>
                                <p className="text-xs text-slate-700">{booking.vehicle} • {new Date(booking.date).toLocaleDateString()}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-orange-700">₹{booking.total.toLocaleString()}</p>
                              </div>
                            </div>
                          ))}
                        {stats.due > 5 && (
                          <Button variant="outline" className="w-full text-xs font-bold uppercase" onClick={() => setActiveTab("bookings")}>
                            View All {stats.due} Incomplete Tasks
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Recent Bookings */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-2xl font-bold">Recent Activity</h2>
                      <Button variant="ghost" className="text-primary text-xs font-bold uppercase" onClick={() => setActiveTab("bookings")}>
                        View All
                      </Button>
                    </div>

                    <div className="grid gap-3">
                      {garage.bookings.length === 0 ? (
                        <p className="text-muted-foreground italic">No bookings found yet.</p>
                      ) : (
                        garage.bookings.slice(0, 5).map((booking) => (
                          <Card key={booking.id} className="card-simple hover:bg-muted/30 transition-colors">
                            <CardContent className="p-4 flex items-center justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-[10px] font-bold uppercase py-0.5 px-2 bg-primary/20 text-primary rounded-full">
                                    {booking.trackingId}
                                  </span>
                                  <Badge 
                                    variant={booking.status?.toLowerCase() === "completed" ? "default" : "secondary"} 
                                    className={`text-[9px] uppercase font-bold px-2 py-0 ${
                                      booking.status?.toLowerCase() === "completed" ? "bg-green-100 text-green-800" :
                                      booking.status?.toLowerCase() === "in progress" ? "bg-blue-100 text-blue-800" :
                                      "bg-yellow-100 text-yellow-800"
                                    }`}
                                  >
                                    {booking.status}
                                  </Badge>
                                </div>
                                <h3 className="font-bold text-foreground">{booking.vehicle}</h3>
                                <p className="text-xs text-muted-foreground">{booking.name} • {new Date(booking.date).toLocaleDateString()}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-primary">₹{booking.total.toLocaleString()}</p>
                                {booking.status?.toLowerCase() !== "completed" && (
                                  <Button variant="outline" size="sm" className="h-7 text-[10px] uppercase font-bold mt-1" onClick={() => setActiveTab("bookings")}>
                                    Action
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "staff" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <Card className="card-simple">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <UserPlus className="w-5 h-5 text-primary" />
                          Add Staff Member
                        </CardTitle>
                        <CardDescription>Create a new staff account to add team members to your workshop.</CardDescription>
                      </div>
                      <Button onClick={() => navigate('/garage/staff/add')} className="gap-2 whitespace-nowrap">
                        <Plus className="w-4 h-4" />
                        Create New Staff
                      </Button>
                    </CardHeader>
                  </Card>

                  <div className="space-y-4">
                    <h2 className="text-2xl font-bold">Your Team</h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {garage.staff.length === 0 ? (
                        <p className="text-muted-foreground italic col-span-2">No staff assigned yet.</p>
                      ) : (
                        garage.staff.map((s) => (
                          <Card key={s.id} className="card-simple border-l-4 border-l-primary group">
                            <CardContent className="p-4 flex items-center justify-between gap-4">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-primary">
                                  {s.user.name[0]}
                                </div>
                                <div>
                                  <p className="font-bold">{s.user.name}</p>
                                  <p className="text-xs text-muted-foreground">{s.user.email}</p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleRemoveStaff(s.user.id, s.user.name || s.user.email)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "bookings" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-foreground">All Bookings</h2>
                    
                    {/* Filter Buttons */}
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: "all", label: "All", count: garage.bookings.length },
                        { value: "pending", label: "Pending", count: garage.bookings.filter(b => b.status?.toLowerCase() === "pending").length },
                        { value: "in-progress", label: "In Progress", count: garage.bookings.filter(b => b.status?.toLowerCase() === "in progress").length },
                        { value: "completed", label: "Completed", count: garage.bookings.filter(b => b.status?.toLowerCase() === "completed").length },
                        { value: "unassigned", label: "Unassigned", count: garage.bookings.filter(b => !b.assignedTo && b.status?.toLowerCase() !== "completed").length },
                      ].map((filter) => (
                        <Button
                          key={filter.value}
                          variant={bookingsFilter === filter.value ? "default" : "outline"}
                          size="sm"
                          className="gap-2 text-xs font-bold uppercase"
                          onClick={() => setBookingsFilter(filter.value as any)}
                        >
                          {filter.label}
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            bookingsFilter === filter.value 
                              ? "bg-primary-foreground/20" 
                              : "bg-muted"
                          }`}>
                            {filter.count}
                          </span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4">
                    {filteredBookings.length === 0 ? (
                      <Card className="card-simple border-dashed">
                        <CardContent className="p-12 text-center">
                          <p className="text-muted-foreground font-semibold mb-2">No bookings found</p>
                          <p className="text-sm text-muted-foreground">Try changing the filter to see other bookings</p>
                        </CardContent>
                      </Card>
                    ) : (
                      filteredBookings.map((booking) => (
                        <Card key={booking.id} className="card-simple hover:border-primary/50 transition-all group">
                          <CardContent className="p-6 space-y-4">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline" className="font-mono text-[10px] bg-muted">{booking.trackingId}</Badge>
                                  <Badge 
                                    variant={booking.status?.toLowerCase() === "completed" ? "default" : booking.status?.toLowerCase() === "cancelled" ? "destructive" : "secondary"} 
                                    className={`uppercase text-[9px] font-bold ${
                                      booking.status?.toLowerCase() === "completed" ? "bg-green-100 text-green-800" :
                                      booking.status?.toLowerCase() === "in progress" ? "bg-blue-100 text-blue-800" :
                                      "bg-yellow-100 text-yellow-800"
                                    }`}
                                  >
                                    {booking.status}
                                  </Badge>
                                  {booking.assignedTo && (
                                    <Badge className="bg-green-100 text-green-800 text-[9px]">
                                      ✓ Assigned
                                    </Badge>
                                  )}
                                </div>
                                <h3 className="text-lg font-bold group-hover:text-primary transition-colors">{booking.vehicle}</h3>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-2">
                                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {booking.name}</span>
                                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(booking.date).toLocaleDateString()}</span>
                                  <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> ₹{booking.total.toLocaleString()}</span>
                                </div>
                                {booking.deliveryOption && booking.deliveryOption !== "none" && (
                                  <div className="mt-2 rounded-md border bg-muted/30 p-3">
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Pickup/Delivery Address</p>
                                    <p className="text-xs text-foreground font-medium">
                                      {booking.homeAddress || "Address not provided"}
                                    </p>
                                  </div>
                                )}
                                {booking.assignedToName && (
                                  <div className="text-xs text-primary mt-2 font-semibold">
                                    👨‍🔧 {booking.assignedToName}
                                  </div>
                                )}
                                {booking.taskStatus && (
                                  <div className="mt-3 rounded-md border bg-muted/40 p-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="text-[10px] font-bold uppercase text-muted-foreground">Mechanic Update</span>
                                      <Badge className="text-[9px] uppercase">
                                        {booking.taskStatus}
                                      </Badge>
                                      <span className="text-[11px] font-semibold text-primary">
                                        {Math.min(100, Math.max(0, booking.progressPercentage || 0))}%
                                      </span>
                                    </div>
                                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                                      <div
                                        className="h-full bg-primary transition-all"
                                        style={{ width: `${Math.min(100, Math.max(0, booking.progressPercentage || 0))}%` }}
                                      />
                                    </div>
                                    {booking.taskNotes && (
                                      <p className="mt-2 text-xs text-muted-foreground">{booking.taskNotes}</p>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-col gap-2 border-t md:border-t-0 pt-4 md:pt-0">
                                <select
                                  className="h-9 px-3 rounded-md border text-xs font-bold uppercase bg-background"
                                  value={booking.status || "pending"}
                                  onChange={(e) => handleUpdateBookingStatus(booking.trackingId, e.target.value)}
                                >
                                  <option value="pending">Pending</option>
                                  <option value="confirmed">Confirmed</option>
                                  <option value="in progress">In Progress</option>
                                  <option value="completed">Completed</option>
                                  <option value="cancelled">Cancelled</option>
                                </select>
                                {garage.staff.length > 0 && !booking.assignedTo ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-9 gap-2"
                                    onClick={() => setAssignTaskBookingId(booking.id)}
                                  >
                                    <Wrench className="w-4 h-4" />
                                    Assign Task
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    disabled
                                    className="h-9 gap-2 text-muted-foreground"
                                  >
                                    <Wrench className="w-4 h-4" />
                                    {booking.assignedTo ? "Assigned" : "No Staff"}
                                  </Button>
                                )}
                              </div>
                            </div>

                            {assignTaskBookingId === booking.id && (
                              <div className="border-t pt-4 space-y-3 bg-muted/30 -mx-6 -mb-4 px-6 py-4 rounded-b-lg">
                                <label className="block text-sm font-semibold">Assign to Staff Member</label>
                                <select
                                  value={selectedStaffForAssignment}
                                  onChange={(e) => setSelectedStaffForAssignment(e.target.value)}
                                  className="w-full h-9 px-3 rounded-md border text-sm bg-background"
                                >
                                  <option value="">Select staff member...</option>
                                  {garage.staff.map((staff) => {
                                    const staffUserId = staff.user.id || staff.userId;
                                    return (
                                    <option key={staffUserId} value={staffUserId}>
                                      {staff.user.name} - {staff.user.email}
                                    </option>
                                    );
                                  })}
                                </select>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={handleAssignTask}
                                    disabled={!selectedStaffForAssignment}
                                    className="flex-1"
                                  >
                                    Confirm Assignment
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setAssignTaskBookingId(null);
                                      setSelectedStaffForAssignment("");
                                    }}
                                    className="flex-1"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === "settings" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h2 className="text-2xl font-bold">Garage Profile</h2>
                  <Card className="card-simple overflow-hidden">
                    <div className="h-32 bg-gradient-to-r from-primary/20 to-primary/40" />
                    <CardContent className="p-6 -mt-12">
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="w-24 h-24 rounded-2xl bg-card border-4 border-background flex items-center justify-center text-4xl font-display text-primary shadow-xl overflow-hidden">
                          {user?.photoUrl ? (
                            <img
                              src={user.photoUrl}
                              alt={user.name || "Garage Owner"}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              {(garage.name?.[0] || "G").toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 space-y-4 pt-6 md:pt-14">
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase font-bold text-muted-foreground">Garage Name</label>
                              <Input
                                value={settingsForm.name}
                                onChange={(e) => setSettingsForm((prev) => ({ ...prev, name: e.target.value }))}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase font-bold text-muted-foreground">Contact Phone</label>
                              <Input
                                value={settingsForm.contactPhone}
                                onChange={(e) => setSettingsForm((prev) => ({ ...prev, contactPhone: e.target.value }))}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase font-bold text-muted-foreground">Pickup Fee (INR)</label>
                              <Input
                                type="number"
                                min={0}
                                value={settingsForm.pickupFee}
                                onChange={(e) => setSettingsForm((prev) => ({ ...prev, pickupFee: Math.max(0, Number(e.target.value) || 0) }))}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase font-bold text-muted-foreground">Pickup & Delivery Fee (INR)</label>
                              <Input
                                type="number"
                                min={0}
                                value={settingsForm.deliveryFee}
                                onChange={(e) => setSettingsForm((prev) => ({ ...prev, deliveryFee: Math.max(0, Number(e.target.value) || 0) }))}
                              />
                            </div>
                            <div className="space-y-1 md:col-span-2">
                              <label className="text-[10px] uppercase font-bold text-muted-foreground">Address</label>
                              <Input
                                value={settingsForm.addressStreet}
                                onChange={(e) => setSettingsForm((prev) => ({ ...prev, addressStreet: e.target.value }))}
                              />
                            </div>
                          </div>
                          <Button className="mt-4" onClick={handleSaveGarageSettings} disabled={isSavingSettings}>
                            {isSavingSettings ? "Saving..." : "Save Changes"}
                          </Button>

                          <div className="mt-8 border-t pt-6 space-y-4">
                            <div>
                              <p className="text-sm font-bold text-foreground">Service & Pricing</p>
                              <p className="text-xs text-muted-foreground">Add services with custom prices visible to customers.</p>
                            </div>

                            <div className="grid md:grid-cols-[1fr,180px,120px] gap-2">
                              <Input
                                value={newServiceName}
                                onChange={(e) => setNewServiceName(e.target.value)}
                              />
                              <Input
                                type="number"
                                min={0}
                                value={newServicePrice}
                                onChange={(e) => setNewServicePrice(e.target.value)}
                              />
                              <Button type="button" onClick={handleAddService}>Add Service</Button>
                            </div>

                            {settingsForm.serviceCatalog.length === 0 ? (
                              <p className="text-xs text-muted-foreground">No services added yet.</p>
                            ) : (
                              <div className="space-y-2">
                                {settingsForm.serviceCatalog.map((service, index) => (
                                  <div key={`${service.id}-${index}`} className="grid md:grid-cols-[1fr,180px,90px] gap-2 items-center">
                                    <Input
                                      value={service.name}
                                      onChange={(e) => handleUpdateService(index, "name", e.target.value)}
                                    />
                                    <Input
                                      type="number"
                                      min={0}
                                      value={service.price}
                                      onChange={(e) => handleUpdateService(index, "price", e.target.value)}
                                    />
                                    <Button type="button" variant="destructive" onClick={() => handleRemoveService(index)}>
                                      Remove
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
          </div>
        </div>
      </main>
    </div>
  );
}
