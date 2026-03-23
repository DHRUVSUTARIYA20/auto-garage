import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Car, LogOut, Plus, X } from "lucide-react";
import SimpleBill from "@/components/SimpleBill";
import { getBookingsForUser, type BookingRecord } from "@/lib/bookings";
import { useAuth } from "@/context/useAuth";
import { useToast } from "@/hooks/use-toast";
import ProfileEditorDialog from "@/components/ProfileEditorDialog";

type Booking = BookingRecord;

const Dashboard = () => {
  const { user, loading: authLoading, logout, refreshUser } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [selectedBillTrackingId, setSelectedBillTrackingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/register");
      return;
    }

    if (authLoading || !user) {
      return;
    }

    let isMounted = true;
    const loadBookings = async () => {
      try {
        console.log("📊 [Dashboard] Loading bookings for user:", user.id, user.email);
        const rows = await getBookingsForUser({ userId: user.id, email: user.email });
        console.log("📊 [Dashboard] Loaded bookings:", rows.length);
        if (isMounted) {
          setBookings(rows);
        }
      } catch (error) {
        console.error("Error loading bookings:", error);
      }
    };

    loadBookings();
    return () => { isMounted = false; };
  }, [navigate, user, authLoading]);

  const handleLogout = async () => {
    await logout();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "confirmed": return "bg-blue-100 text-blue-800";
      case "in progress": return "bg-purple-100 text-purple-800";
      case "completed": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (authLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center">Loading dashboard...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 pt-32 pb-24 bg-background">
        <div className="page-shell max-w-6xl">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <h1 className="text-4xl font-display text-foreground mb-2">My Account</h1>
              <p className="text-muted-foreground flex items-center gap-2">
                <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 capitalize font-bold">
                  {user.role}
                </Badge>
                Welcome back, {user.name}
              </p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => navigate("/booking")} className="gap-2 shadow-lg shadow-primary/20">
                <Plus className="w-4 h-4" />
                Book Service
              </Button>
              <Button onClick={handleLogout} variant="outline" className="gap-2">
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Sidebar / Profile Settings */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="card-simple overflow-hidden">
                <div className="h-24 bg-gradient-to-r from-primary/20 to-primary/40" />
                <CardContent className="p-6 -mt-10 relative">
                  <div className="w-20 h-20 rounded-2xl bg-card border-4 border-background shadow-xl overflow-hidden mb-4">
                    {user.photoUrl ? (
                      <img
                        src={user.photoUrl}
                        alt={user.name || "Profile"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-primary text-3xl font-display">
                        {(user.name?.[0] || "U").toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-bold">{user.name}</h3>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <ProfileEditorDialog triggerClassName="w-full gap-2 text-xs font-bold uppercase" />
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Button variant="ghost" className="w-full justify-start gap-3 font-semibold h-12 hover:bg-muted" onClick={() => navigate("/track")}>
                  <Clock className="w-4 h-4 text-primary" /> Track Active Booking
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-3 font-semibold h-12 hover:bg-muted" onClick={() => navigate("/garages")}>
                  <Car className="w-4 h-4 text-primary" /> Browse Garages
                </Button>
              </div>
            </div>

            {/* Bookings Area */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold">Booking History</h2>
                <Badge variant="secondary" className="px-3 py-1">{bookings.length} Total</Badge>
              </div>

              {bookings.length === 0 ? (
                <Card className="text-center py-16 border-dashed bg-muted/20">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Car className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">No repair history found</h3>
                  <p className="text-muted-foreground mb-8 max-w-sm mx-auto">You haven't made any bookings yet. Let's get your vehicle checked by experts!</p>
                  <Button onClick={() => navigate("/booking")} size="lg">Make New Booking</Button>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {bookings.map((booking) => (
                    <Card key={booking.trackingId} className="card-simple hover:border-primary/50 transition-all group overflow-hidden">
                      <CardContent className="p-0">
                        <div className="flex flex-col sm:flex-row">
                          <div className="flex-1 p-6 space-y-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-mono font-bold bg-muted px-2 py-0.5 rounded leading-none">#{booking.trackingId}</span>
                              <Badge className={`${getStatusColor(booking.status)} uppercase text-[9px] font-bold border-none`}>{booking.status}</Badge>
                            </div>
                            <div>
                              <h3 className="text-lg font-bold group-hover:text-primary transition-colors">{booking.vehicle}</h3>
                              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                                <Calendar className="w-3 h-3" /> {new Date(booking.date).toLocaleDateString()} at {booking.time}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {booking.services.map((s, i) => (
                                <span key={i} className="text-[10px] bg-secondary/50 px-2 py-0.5 rounded-full font-medium">{s.name}</span>
                              ))}
                            </div>
                          </div>
                          <div className="bg-muted/30 sm:w-48 p-6 flex flex-col justify-between items-end gap-4">
                            <p className="text-2xl font-display font-bold text-primary">₹{booking.total.toLocaleString()}</p>
                            <div className="w-full flex gap-2">
                              {booking.status.toLowerCase() === "completed" && (
                                <Button size="sm" variant="outline" className="flex-1 gap-2 text-[10px] font-bold uppercase tracking-wider" onClick={() => setSelectedBillTrackingId(booking.trackingId)}>
                                  View Bill
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                className={booking.status.toLowerCase() === "completed" ? "flex-1" : "w-full"}
                                onClick={() => {
                                  localStorage.setItem("lastTrackingId", booking.trackingId);
                                  navigate(`/track?id=${encodeURIComponent(booking.trackingId)}`);
                                }}
                              >
                                Track
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Bill Modal */}
      {selectedBillTrackingId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedBillTrackingId(null)}>
          <div className="bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-2xl font-bold">Service Bill</h2>
              <Button variant="ghost" size="sm" onClick={() => setSelectedBillTrackingId(null)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-6">
              {bookings.find(b => b.trackingId === selectedBillTrackingId) && (
                <SimpleBill
                  trackingId={selectedBillTrackingId}
                  customerName={bookings.find(b => b.trackingId === selectedBillTrackingId)?.name || user.name}
                  customerEmail={user.email}
                  customerPhone={user.email}
                  vehicle={bookings.find(b => b.trackingId === selectedBillTrackingId)?.vehicle || ""}
                  serviceDate={bookings.find(b => b.trackingId === selectedBillTrackingId)?.date || ""}
                  services={bookings.find(b => b.trackingId === selectedBillTrackingId)?.services || []}
                  subtotal={bookings.find(b => b.trackingId === selectedBillTrackingId)?.subtotal}
                  deliveryFee={bookings.find(b => b.trackingId === selectedBillTrackingId)?.deliveryFee}
                  total={bookings.find(b => b.trackingId === selectedBillTrackingId)?.total || 0}
                  status={bookings.find(b => b.trackingId === selectedBillTrackingId)?.status || ""}
                  completedDate={new Date().toISOString()}
                />
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
