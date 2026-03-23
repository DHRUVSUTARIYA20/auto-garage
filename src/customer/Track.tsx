import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Car, MapPin, AlertCircle, CheckCircle2, Truck, Home } from "lucide-react";
import { getBookingByTrackingId, type BookingRecord } from "@/lib/bookings";

type Booking = BookingRecord;

const Track = () => {
  const [trackingId, setTrackingId] = useState("");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNotFound(false);
    setBooking(null);

    try {
      const normalized = trackingId.trim().toUpperCase();
      const found = await getBookingByTrackingId(normalized);
      setBooking(found);
      setNotFound(false);
    } catch (_error) {
      setNotFound(true);
      setBooking(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "in progress":
        return "bg-purple-100 text-purple-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5" />;
      case "pending":
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen">
      <main className="pt-32 pb-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-primary font-medium text-sm uppercase tracking-wider">Track Order</span>
            <h1 className="font-display text-4xl md:text-5xl text-foreground mt-3 mb-4">
              TRACK YOUR BOOKING
            </h1>
            <p className="text-muted-foreground">
              Enter your Tracking ID to check the status of your service appointment.
            </p>
          </div>

          <div className="max-w-md mx-auto mb-12">
            <form onSubmit={handleSearch}>
              <div className="flex gap-2">
                <Input
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  className="font-mono"
                  required
                />
                <Button type="submit" disabled={loading}>
                  {loading ? "Searching..." : "Search"}
                </Button>
              </div>
            </form>
          </div>

          {notFound && (
            <div className="max-w-2xl mx-auto mb-12">
              <Card className="border-destructive/50 bg-destructive/5">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-destructive" />
                    <div>
                      <p className="font-semibold text-destructive">Booking not found</p>
                      <p className="text-sm text-muted-foreground">
                        Please check the Tracking ID and try again. Make sure you haven't made any typos.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {booking && (
            <div className="max-w-3xl mx-auto">
              {/* Status Card */}
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Booking Status</CardTitle>
                      <CardDescription>Tracking ID: {booking.trackingId}</CardDescription>
                    </div>
                    <Badge className={`${getStatusColor(booking.status)}`}>
                      <span className="flex items-center gap-2">
                        {getStatusIcon(booking.status)}
                        {booking.status}
                      </span>
                    </Badge>
                  </div>
                </CardHeader>
              </Card>

              {/* Booking Details */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Service Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Services</p>
                      <ul className="mt-1 space-y-1">
                        {booking.services.map((service) => (
                          <li key={service.id} className="text-sm font-medium">
                            {service.name || "Unknown Service"}
                            <span className="text-primary ml-2">₹{service.price?.toLocaleString("en-IN") || "0"}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Appointment</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Date</p>
                        <p className="font-medium">{new Date(booking.date).toLocaleDateString("en-IN")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Time</p>
                        <p className="font-medium">{booking.time}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {booking.deliveryOption && booking.deliveryOption !== 'none' && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {booking.deliveryOption === 'pickup' ? (
                          <Truck className="w-5 h-5 text-blue-600" />
                        ) : (
                          <MapPin className="w-5 h-5 text-blue-600" />
                        )}
                        {booking.deliveryOption === 'pickup' ? 'Pickup Service' : 'Delivery Service'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Service Type</p>
                        <p className="font-medium">
                          {booking.deliveryOption === 'pickup' ? 'We pick up & return your car' : 'Full home service with pickup & delivery'}
                        </p>
                      </div>
                      {booking.homeAddress && (
                        <div>
                          <p className="text-sm text-muted-foreground">Home Address</p>
                          <p className="font-medium text-sm">{booking.homeAddress}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-muted-foreground">Delivery Fee</p>
                        <p className="font-medium text-primary">₹{booking.deliveryFee?.toLocaleString('en-IN') || '0'}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Customer Details */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg">Your Details</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{booking.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium text-sm break-all">{booking.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{booking.phone || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Vehicle</p>
                    <p className="font-medium">{booking.vehicle}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Total Amount */}
              <Card className="bg-primary/5 border-primary/20 mb-6">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    {booking.subtotal && (
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">Services</p>
                        <p className="font-medium">₹{booking.subtotal.toLocaleString('en-IN')}</p>
                      </div>
                    )}
                    {booking.deliveryFee && booking.deliveryFee > 0 && (
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">Delivery Fee</p>
                        <p className="font-medium">+₹{booking.deliveryFee.toLocaleString('en-IN')}</p>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <p className="text-lg font-semibold">Total Amount</p>
                      <p className="font-display text-2xl text-primary">₹{booking.total.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-4">
                <Button onClick={() => navigate("/")} variant="outline" className="flex-1">
                  Back to Home
                </Button>
                <Button onClick={() => navigate("/booking")} className="flex-1">
                  Book Another Service
                </Button>
              </div>
            </div>
          )}

          {!booking && !notFound && (
            <div className="max-w-2xl mx-auto text-center py-12">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-10 h-10 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                Enter your Tracking ID above to view your booking details and status.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Track;
