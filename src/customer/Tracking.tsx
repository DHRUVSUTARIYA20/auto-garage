import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import SimpleBill from "@/components/SimpleBill";
import { useToast } from "@/hooks/use-toast";
import { getBookingByTrackingId } from "@/lib/bookings";
import {
  Calendar,
  Clock,
  Car,
  MapPin,
  Phone,
  User,
  Wrench,
  CheckCircle2,
} from "lucide-react";

type BookingStatus = {
  trackingId: string;
  name: string;
  email: string;
  phone?: string | null;
  vehicle: string;
  date: string;
  time: string;
  services: Array<{ id: string; name?: string; price?: number }>;
  status: string;
  total: number;
  deliveryOption?: string | null;
  homeAddress?: string | null;
  notes?: string | null;
  deliveryFee?: number | null;
};

const Tracking = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [trackingId, setTrackingId] = useState(searchParams.get("id") || "");
  const [booking, setBooking] = useState<BookingStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!trackingId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a tracking ID",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      const result = await getBookingByTrackingId(trackingId);
      setBooking(result);
    } catch (error: any) {
      toast({
        title: "Booking not found",
        description: error.message || "Please check your tracking ID",
        variant: "destructive",
      });
      setBooking(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchParams.get("id")) {
      handleSearch();
    }
  }, []);

  const getStatusStep = (status: string) => {
    const steps = {
      pending: 1,
      confirmed: 2,
      "in progress": 3,
      completed: 4,
    };
    return steps[status.toLowerCase() as keyof typeof steps] || 0;
  };

  const currentStep = booking ? getStatusStep(booking.status) : 0;

  const statusSteps = [
    { step: 1, label: "Pending", description: "Waiting for confirmation" },
    { step: 2, label: "Confirmed", description: "Booking confirmed" },
    { step: 3, label: "In Progress", description: "Work in progress" },
    { step: 4, label: "Completed", description: "Service completed" },
  ];

  return (
    <div className="min-h-screen">
      <main className="pt-32 pb-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            {/* Search Section */}
            <div className="text-center mb-12">
              <span className="text-primary font-medium text-sm uppercase tracking-wider">Track Your Booking</span>
              <h1 className="font-display text-4xl md:text-5xl text-foreground mt-3 mb-4">
                SERVICE STATUS TRACKER
              </h1>
              <p className="text-muted-foreground">
                Enter your tracking ID to see the status of your service booking
              </p>
            </div>

            {/* Search Form */}
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="flex gap-2">
                  <Input
                    value={trackingId}
                    onChange={(e) => setTrackingId(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    className="flex-1"
                  />
                  <Button onClick={handleSearch} disabled={loading} size="lg">
                    {loading ? "Searching..." : "Track"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Booking Details */}
            {booking && (
              <div className="space-y-8">
                {/* Status Timeline */}
                <Card className="card-simple">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wrench className="w-5 h-5 text-primary" />
                      Booking Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Progress Bar */}
                    <div className="space-y-4">
                      {statusSteps.map((item, idx) => (
                        <div key={item.step} className="flex items-start gap-4">
                          <div className="flex flex-col items-center gap-2">
                            <div
                              className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold transition-all ${
                                currentStep >= item.step
                                  ? "bg-primary border-primary text-primary-foreground"
                                  : "border-muted-foreground text-muted-foreground"
                              }`}
                            >
                              {currentStep > item.step ? (
                                <CheckCircle2 className="w-6 h-6" />
                              ) : (
                                item.step
                              )}
                            </div>
                            {idx < statusSteps.length - 1 && (
                              <div
                                className={`w-0.5 h-8 ${
                                  currentStep > item.step ? "bg-primary" : "bg-muted"
                                }`}
                              />
                            )}
                          </div>
                          <div className="flex-1 pt-1">
                            <h3 className="font-semibold text-foreground">{item.label}</h3>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                            {currentStep === item.step && (
                              <Badge className="mt-2 bg-primary">Current</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Booking Information */}
                <Card className="card-simple">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Car className="w-5 h-5 text-primary" />
                      Booking Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-bold text-muted-foreground uppercase">Tracking ID</p>
                          <p className="text-lg font-mono font-bold text-primary">{booking.trackingId}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">
                            <User className="w-3 h-3" /> Customer Name
                          </p>
                          <p className="font-semibold">{booking.name}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">
                            <Phone className="w-3 h-3" /> Phone
                          </p>
                          <p className="font-semibold">{booking.phone || "N/A"}</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">
                            <Calendar className="w-3 h-3" /> Service Date
                          </p>
                          <p className="font-semibold">
                            {new Date(booking.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">
                            <Clock className="w-3 h-3" /> Time Slot
                          </p>
                          <p className="font-semibold">{booking.time}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-muted-foreground uppercase">Status</p>
                          <Badge className="mt-2 capitalize">
                            {booking.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Vehicle Information */}
                <Card className="card-simple">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Car className="w-5 h-5 text-primary" />
                      Vehicle Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase">Vehicle</p>
                        <p className="text-lg font-semibold mt-1">{booking.vehicle}</p>
                      </div>

                    </div>
                  </CardContent>
                </Card>

                {/* Services */}
                {booking.services && booking.services.length > 0 && (
                  <Card className="card-simple">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Wrench className="w-5 h-5 text-primary" />
                        Services Booked
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {booking.services.map((service) => (
                          <div
                            key={service.id}
                            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                          >
                            <span className="font-semibold">{service.name}</span>
                            <span className="text-primary font-bold">
                              ₹{service.price?.toLocaleString("en-IN") || "0"}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 pt-4 border-t flex items-center justify-between">
                        <span className="font-bold">Total Amount</span>
                        <span className="text-2xl font-display text-primary">
                          ₹{booking.total.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Delivery Information */}
                {booking.deliveryOption && booking.deliveryOption !== "none" && (
                  <Card className="card-simple">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-primary" />
                        Delivery Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase">Service Type</p>
                        <p className="text-lg font-semibold capitalize mt-1">
                          {booking.deliveryOption === "none"
                            ? "Visit Garage"
                            : booking.deliveryOption === "pickup"
                              ? "Pickup from Home"
                              : "Pickup & Delivery"}
                        </p>
                      </div>
                      {booking.homeAddress && (
                        <div>
                          <p className="text-xs font-bold text-muted-foreground uppercase">Delivery Address</p>
                          <p className="font-semibold mt-1">{booking.homeAddress}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Additional Notes */}
                {booking.notes && (
                  <Card className="card-simple bg-blue-50 border-blue-200">
                    <CardContent className="p-6">
                      <p className="text-xs font-bold text-blue-900 uppercase">Additional Notes</p>
                      <p className="mt-2 text-blue-900">{booking.notes}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Bill (if completed) */}
                {booking.status.toLowerCase() === "completed" && (
                  <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-green-900 mb-4">✓ Service Completed - Your Bill</h3>
                    <SimpleBill
                      trackingId={booking.trackingId}
                      customerName={booking.name}
                      customerEmail={booking.email}
                      customerPhone={booking.phone || undefined}
                      vehicle={booking.vehicle}
                      serviceDate={booking.date}
                      services={booking.services}
                      subtotal={booking.services?.reduce((sum, s) => sum + (s.price || 0), 0)}
                      deliveryFee={booking.deliveryOption && booking.deliveryOption !== "none" ? (booking.deliveryFee || 0) : undefined}
                      total={booking.total}
                      status={booking.status}
                      completedDate={new Date().toISOString()}
                      notes={booking.notes || undefined}
                    />
                  </div>
                )}
              </div>
            )}

            {/* No Results */}
            {searched && !booking && !loading && (
              <Card className="card-simple border-red-200 bg-red-50">
                <CardContent className="p-8 text-center">
                  <div className="text-4xl mb-4">🔍</div>
                  <h3 className="text-lg font-bold text-red-900 mb-2">Booking Not Found</h3>
                  <p className="text-red-800 mb-4">
                    We couldn't find a booking with this tracking ID. Please check and try again.
                  </p>
                  <Button
                    onClick={() => {
                      setBooking(null);
                      setSearched(false);
                      setTrackingId("");
                    }}
                    variant="outline"
                  >
                    Try Another ID
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Tracking;
