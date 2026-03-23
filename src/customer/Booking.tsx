import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

export const bookingSchema = z.object({
  selectedGarage: z.string().min(1, "Please select a garage"),
  date: z.date({ required_error: "Please choose a date" }).refine((d) => {
    const today = new Date(); today.setHours(0,0,0,0);
    const chosen = new Date(d); chosen.setHours(0,0,0,0);
    return chosen >= today;
  }, { message: "Date must be today or later" }),
  selectedServices: z.array(z.string()).min(1, "Please choose at least one service"),
  selectedTime: z.string().min(1, "Please choose a time"),
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().min(7, "Enter a valid phone").optional(),
  vehicle: z.string().min(2, "Vehicle info required"),
  deliveryOption: z.enum(["none", "pickup", "delivery"], {
    errorMap: () => ({ message: "Please select a delivery option" })
  }),
  homeAddress: z.string().optional(),
  notes: z.string().max(500).optional(),
}).superRefine((data, ctx) => {
  const needsAddress = data.deliveryOption === "pickup" || data.deliveryOption === "delivery";
  const address = String(data.homeAddress || "").trim();

  if (needsAddress && address.length < 5) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["homeAddress"],
      message: "Address is required",
    });
  }
});
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { CalendarDays, Clock, Car, User, Mail, Phone, CheckCircle, Truck, Home, MapPin, CreditCard, Store } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createBooking } from "@/lib/bookings";
import { useAuth } from "@/context/useAuth";
import { api } from "@/lib/api-client";

const slugifyServiceId = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || `service-${Date.now()}`;

const normalizeGarageServices = (garage: any): Array<{ id: string; name: string; price: number }> => {
  if (!garage) {
    return [];
  }

  const fromCatalog = Array.isArray(garage?.serviceCatalog)
    ? garage.serviceCatalog
        .map((item: any) => {
          const name = String(item?.name ?? "").trim();
          if (!name) return null;
          return {
            id: String(item?.id ?? slugifyServiceId(name)),
            name,
            price: Number(item?.price ?? 0) || 0,
          };
        })
        .filter((item: any) => Boolean(item))
    : [];

  if (fromCatalog.length > 0) {
    return fromCatalog as Array<{ id: string; name: string; price: number }>;
  }

  const servicesArray = Array.isArray(garage?.services) ? garage.services : [];
  if (servicesArray.length > 0) {
    return servicesArray
      .map((serviceName: any) => String(serviceName || "").trim())
      .filter(Boolean)
      .map((name: string) => ({ id: slugifyServiceId(name), name, price: 0 }));
  }

  return [];
};

const buildDeliveryOptions = (pickupFee: number, deliveryFee: number) => [
  { id: "none", label: "Visit Garage (No Delivery)", price: 0, description: "Drop off at garage" },
  { id: "pickup", label: "Pickup from Home", price: Math.max(0, pickupFee), description: "We pick up your car and return it" },
  { id: "delivery", label: "Pickup & Delivery", price: Math.max(0, deliveryFee), description: "Full home service with dropoff & pickup" },
];

const timeSlots = [
  "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"
];

const Booking = () => {
  const [searchParams] = useSearchParams();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [garages, setGarages] = useState<Array<{
    id: string;
    name: string;
    contact_phone?: string;
    services?: string[];
    serviceCatalog?: Array<{ id?: string; name?: string; price?: number }>;
    pickupFee?: number | string;
    pickup_fee?: number | string;
    deliveryFee?: number | string;
    delivery_fee?: number | string;
  }>>([]);
  const [loadingGarages, setLoadingGarages] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch garages on mount
  useEffect(() => {
    const fetchGarages = async () => {
      try {
        const response = await api.getGarages();
        if (response.data && Array.isArray(response.data)) {
          setGarages(response.data || []);
        }
      } catch (error) {
        console.error("Error loading garages:", error);
        toast({
          title: "Error",
          description: "Failed to load garages",
          variant: "destructive",
        });
      } finally {
        setLoadingGarages(false);
      }
    };
    fetchGarages();
  }, [toast]);

  type BookingFormValues = z.infer<typeof bookingSchema>;

  const { register, handleSubmit, control, watch, setValue, clearErrors, formState: { errors, isValid, isSubmitting } } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    mode: 'onChange',
    defaultValues: { selectedGarage: '', date: undefined, selectedServices: [], selectedTime: '', name: user?.name || '', email: user?.email || '', phone: '', vehicle: '', deliveryOption: 'none', homeAddress: '', notes: '' }
  });

  // Pre-fill user information when user changes
  useEffect(() => {
    if (user?.name) {
      setValue('name', user.name);
    }
    if (user?.email) {
      setValue('email', user.email);
    }
    if (user?.mobileNumber) {
      setValue('phone', user.mobileNumber);
    }
    if (user?.addressLine1) {
      setValue('homeAddress', user.addressLine1 + (user?.addressLine2 ? ' ' + user.addressLine2 : ''));
    }
  }, [user, setValue]);

  const watchedServices = (watch('selectedServices') || []) as string[];
  const watchedDeliveryOption = (watch('deliveryOption') || 'none') as string;
  const watchedGarageId = watch('selectedGarage');
  const garageIdFromQuery = (searchParams.get("garageId") || "").trim();

  const selectedGarage = garages.find((garage) => garage.id === watchedGarageId);
  const services = normalizeGarageServices(selectedGarage);
  const pickupFee = Math.max(0, Number(selectedGarage?.pickupFee ?? selectedGarage?.pickup_fee ?? 299) || 0);
  const deliveryFeeForGarage = Math.max(0, Number(selectedGarage?.deliveryFee ?? selectedGarage?.delivery_fee ?? 499) || 0);
  const deliveryOptions = buildDeliveryOptions(pickupFee, deliveryFeeForGarage);

  useEffect(() => {
    setValue("selectedServices", []);
  }, [watchedGarageId, setValue]);

  useEffect(() => {
    if (!garageIdFromQuery || loadingGarages || garages.length === 0) {
      return;
    }

    const match = garages.find((garage) => garage.id === garageIdFromQuery);
    if (!match) {
      return;
    }

    setValue("selectedGarage", match.id, { shouldValidate: true });
  }, [garageIdFromQuery, garages, loadingGarages, setValue]);

  useEffect(() => {
    if (watchedDeliveryOption === "none") {
      setValue("homeAddress", "", { shouldValidate: true });
      clearErrors("homeAddress");
    }
  }, [watchedDeliveryOption, setValue, clearErrors]);

  const deliveryFee = deliveryOptions.find(opt => opt.id === watchedDeliveryOption)?.price || 0;

  const subtotalINR = (watchedServices || []).reduce((sum, id) => {
    const s = services.find((x) => x.id === id);
    return sum + (s?.price ?? 0);
  }, 0);

  const totalINR = subtotalINR + deliveryFee;

  const onSubmit = async (data: BookingFormValues) => {
    // Generate Tracking ID
    const trackingId = `GAR-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    const bookingServices = watchedServices.map((id) => {
      const s = services.find((x) => x.id === id);
      return { id, name: s?.name, price: s?.price };
    });

    try {
      await createBooking({
        trackingId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        vehicle: data.vehicle,
        services: bookingServices,
        date: data.date?.toISOString().split("T")[0] || "",
        time: data.selectedTime,
        deliveryOption: data.deliveryOption,
        deliveryFee: deliveryFee,
        homeAddress: data.homeAddress || "",
        subtotal: subtotalINR,
        total: totalINR,
        status: "Pending",
        userId: user?.id,
        garageId: data.selectedGarage,
      });

      localStorage.setItem("lastTrackingId", trackingId);
      setIsSubmitted(true);
      toast({
        title: "Booking Confirmed!",
        description: `Tracking ID: ${trackingId}`,
      });
    } catch (error: any) {
      toast({
        title: "Booking failed",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    }
  };



  const lastTrackingId = localStorage.getItem('lastTrackingId') || 'GAR-XXXXXX';

  if (isSubmitted) {
    return (
      <div className="min-h-screen">
        <main className="pt-32 pb-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-lg mx-auto text-center">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h1 className="font-display text-4xl text-foreground mb-4">BOOKING CONFIRMED!</h1>
              
              <Card className="my-8 bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-2">Your Tracking ID</p>
                  <p className="font-mono text-3xl font-bold text-primary mb-4">{lastTrackingId}</p>
                  <p className="text-sm text-muted-foreground">Save this ID to track your booking status</p>
                </CardContent>
              </Card>
              
              <p className="text-muted-foreground mb-8">
                Thank you for your booking. You can track your service status anytime using your Tracking ID.
                Our team will contact you shortly to confirm your appointment.
              </p>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => { window.location.href = `/track?id=${encodeURIComponent(lastTrackingId)}`; }}>Track Booking</Button>
                <Button variant="outline" onClick={() => setIsSubmitted(false)}>Book Another Service</Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <main className="pt-28 pb-24 bg-background">
        <div className="container mx-auto px-4 max-w-7xl">

          <div className="text-center max-w-3xl mx-auto mb-8 md:mb-12 rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm px-6 py-8">
            <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-primary font-medium text-xs uppercase tracking-[0.18em]">Online Booking</span>
            <h1 className="font-display text-4xl md:text-5xl text-foreground mt-3 mb-4">
              BOOK YOUR SERVICE
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Schedule your appointment online in just a few clicks. Choose your service,
              pick a date and time that works for you.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid xl:grid-cols-12 gap-6 items-start">

              <Card className="xl:col-span-6 border-border/70 shadow-sm bg-card/70 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Store className="w-5 h-5 text-primary" />
                    Select Garage
                  </CardTitle>
                  <CardDescription>Choose your preferred garage</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {loadingGarages ? (
                    <p className="text-sm text-muted-foreground">Loading garages...</p>
                  ) : garages.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No garages available</p>
                  ) : (
                    <Controller
                      control={control}
                      name="selectedGarage"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="h-12">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {garages.map((garage) => (
                              <SelectItem key={garage.id} value={garage.id}>
                                {garage.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  )}
                  {errors.selectedGarage && (
                    <p className="text-sm text-destructive mt-1">{errors.selectedGarage.message as string}</p>
                  )}
                </CardContent>
              </Card>

              <Card className="xl:col-span-6 border-border/70 shadow-sm bg-card/70 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="w-5 h-5 text-primary" />
                    Select Service
                  </CardTitle>
                  <CardDescription>Choose the service you need</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {!watchedGarageId ? (
                    <p className="text-sm text-muted-foreground">Please select a garage first to view available services.</p>
                  ) : services.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No services configured for this garage yet.</p>
                  ) : (
                    services.map((service) => (
                      <label
                        key={service.id}
                        className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                          watchedServices.includes(service.id)
                            ? "border-primary bg-primary/10 shadow-sm"
                            : "border-border/80 hover:border-primary/50 hover:bg-muted/20"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            {...register('selectedServices')}
                            value={service.id}
                            className="sr-only"
                          />
                          <div className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center ${
                            watchedServices.includes(service.id) ? "border-primary bg-primary" : "border-muted-foreground"
                          }`}>
                            {watchedServices.includes(service.id) && (
                              <div className="w-2 h-2 bg-primary-foreground rounded-sm" />
                            )}
                          </div>
                          <span className="font-medium">{service.name}</span>
                        </div>
                        <span className="font-display text-lg text-foreground">
                          Rs {service.price.toLocaleString('en-IN')}
                        </span>
                      </label>
                    ))
                  )}

                  {errors.selectedServices && (
                    <p className="text-sm text-destructive mt-1">{errors.selectedServices.message as string}</p>
                  )}
                </CardContent>
              </Card>


              <Card className="xl:col-span-6 border-border/70 shadow-sm bg-card/70 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-primary" />
                    Pick Date & Time
                  </CardTitle>
                  <CardDescription>Select your preferred schedule</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Controller
                    control={control}
                    name="date"
                    render={({ field }) => (
                      <div className="flex justify-center">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(d) => field.onChange(d)}
                          disabled={(date) => date < new Date() || date.getDay() === 0}
                          className="w-full max-w-[22rem] aspect-square rounded-2xl border border-border/70 bg-background/30 p-4"
                          classNames={{
                            months: "flex justify-center",
                            month: "space-y-4 w-full",
                            caption: "flex justify-center items-center relative mb-1",
                            caption_label: "text-2xl font-semibold",
                            nav: "absolute right-2 top-2 flex items-center gap-2",
                            nav_button: "h-9 w-9 rounded-full border border-border/70 bg-background/50 p-0 opacity-100 hover:bg-muted",
                            nav_button_previous: "static",
                            nav_button_next: "static",
                            table: "w-full border-collapse",
                            head_row: "grid grid-cols-7",
                            row: "grid grid-cols-7 mt-2",
                            head_cell: "h-10 w-10 mx-auto text-center text-sm text-muted-foreground font-medium",
                            cell: "h-10 w-10 mx-auto text-center text-sm p-0 relative",
                            day: "h-10 w-10 rounded-xl p-0 font-medium hover:bg-muted",
                          }}
                        />
                      </div>
                    )}
                  />

                  {errors.date && (
                    <p className="text-sm text-destructive mt-1">{errors.date.message as string}</p>
                  )}

                  <div>
                    <Label className="flex items-center gap-2 mb-3">
                      <Clock className="w-4 h-4 text-primary" />
                      Select Time
                    </Label>
                    <Controller
                      control={control}
                      name="selectedTime"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="h-12">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {timeSlots.map((time) => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />

                    {errors.selectedTime && (
                      <p className="text-sm text-destructive mt-1">{errors.selectedTime.message as string}</p>
                    )}
                  </div>
                </CardContent>
              </Card>


              <Card className="xl:col-span-6 border-border/70 shadow-sm bg-card/70 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    Your Information
                  </CardTitle>
                  <CardDescription>
                    {user?.id ? "Your profile information is pre-filled. Review and update if needed." : "Enter your details"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="name" className="pl-10" {...register('name')} />
                    </div>
                    {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message as string}</p>}
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="email" type="email" className="pl-10" {...register('email')} />
                      {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message as string}</p> }
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative mt-1">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="phone" type="tel" className="pl-10" {...register('phone')} />
                      {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone.message as string}</p> }
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="vehicle">Vehicle Info</Label>
                    <div className="relative mt-1">
                      <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="vehicle" className="pl-10" {...register('vehicle')} />
                      {errors.vehicle && <p className="text-sm text-destructive mt-1">{errors.vehicle.message as string}</p> }
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Textarea
                      id="notes"
                      className="mt-1"
                      rows={3}
                      {...register('notes')}
                    />
                    {errors.notes && <p className="text-sm text-destructive mt-1">{errors.notes.message as string}</p> }
                  </div>

                  <div className="pt-4 border-t">
                    <Label className="text-base font-semibold mb-4 block">Delivery & Pickup Options</Label>
                    <div className="space-y-3">
                      {deliveryOptions.map((option) => (
                        <label
                          key={option.id}
                          className={`flex items-start p-4 rounded-xl border cursor-pointer transition-all ${
                            watchedDeliveryOption === option.id
                              ? "border-primary bg-primary/10 shadow-sm"
                              : "border-border/80 hover:border-primary/50 hover:bg-muted/20"
                          }`}
                        >
                          <input
                            type="radio"
                            {...register('deliveryOption')}
                            value={option.id}
                            className="sr-only"
                          />
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            watchedDeliveryOption === option.id ? "border-primary bg-primary" : "border-muted-foreground"
                          }`}>
                            {watchedDeliveryOption === option.id && (
                              <div className="w-2 h-2 bg-white rounded-full" />
                            )}
                          </div>
                          <div className="ml-4 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {option.id === 'none' && <Home className="w-4 h-4 text-primary" />}
                              {option.id === 'pickup' && <Truck className="w-4 h-4 text-primary" />}
                              {option.id === 'delivery' && <MapPin className="w-4 h-4 text-primary" />}
                              <p className="font-medium">{option.label}</p>
                              <span className="ml-auto text-foreground font-display">+Rs {option.price}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{option.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {(watchedDeliveryOption === 'pickup' || watchedDeliveryOption === 'delivery') && (
                    <div>
                      <Label htmlFor="homeAddress" className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Home Address
                      </Label>
                      <Textarea
                        id="homeAddress"
                        className="mt-1"
                        rows={2}
                        {...register('homeAddress')}
                      />
                      {errors.homeAddress && <p className="text-sm text-destructive mt-1">{errors.homeAddress.message as string}</p> }
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="xl:col-span-12 xl:sticky xl:top-24 border-primary/30 shadow-lg shadow-primary/10 bg-gradient-to-br from-card to-card/70 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    Price Breakdown
                  </CardTitle>
                  <CardDescription>Review charges and confirm your appointment</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">Service Total</div>
                      <div className="text-right">
                        <div className="font-display text-lg text-foreground">Rs {subtotalINR.toLocaleString('en-IN')}</div>
                      </div>
                    </div>
                    {deliveryFee > 0 && (
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          Delivery Fee
                          <span className="ml-1 text-xs">({deliveryOptions.find(o => o.id === watchedDeliveryOption)?.label})</span>
                        </div>
                        <div className="font-display text-lg text-foreground">+Rs {deliveryFee.toLocaleString('en-IN')}</div>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-3 border-t border-border/70">
                      <div>
                        <p className="font-semibold">Total Amount</p>
                        <p className="text-xs text-muted-foreground">Inclusive of selected delivery option</p>
                      </div>
                      <div className="font-display text-3xl text-primary">Rs {totalINR.toLocaleString('en-IN')}</div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold"
                    size="lg"
                    disabled={!isValid || isSubmitting}
                  >
                    {isSubmitting ? "Confirming..." : "Confirm Booking"}
                  </Button>
                  {!isValid && (
                    <p className="text-xs text-muted-foreground">Fill all required fields to enable booking.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Booking;
