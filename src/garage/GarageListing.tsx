import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Phone, Clock, ArrowRight, Search } from "lucide-react";
import { GlitchText } from "@/components/ui/glitch-text";
import { api } from "@/lib/api-client";

interface Garage {
  id: string;
  name: string;
  contact_phone: string | null;
  open_time: string | null;
  service_image_url: string | null;
  logo_url: string | null;
  services: string[] | null;
  address_state: string | null;
  address_country: string | null;
  rating: number | null;
  reviews: number | null;
}

const toStringArray = (value: unknown): string[] | null => {
  if (value == null) return null;
  if (Array.isArray(value)) {
    const out: string[] = [];
    for (const item of value) {
      if (item == null) continue;
      if (typeof item === "string") {
        if (item.trim()) out.push(item.trim());
        continue;
      }
      if (typeof item === "object") {
        const maybe =
          (item as any).name ??
          (item as any).service_name ??
          (item as any).service ??
          (item as any).title ??
          (item as any).label;
        if (typeof maybe === "string" && maybe.trim()) out.push(maybe.trim());
        else {
          try {
            out.push(JSON.stringify(item));
          } catch {
            out.push("");
          }
        }
        continue;
      }
      // numbers/booleans/etc
      const s = String(item);
      if (s.trim()) out.push(s.trim());
    }
    return out.length ? out : null;
  }
  if (typeof value === "string") {
    const parts = value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    return parts.length ? parts : null;
  }
  return null;
};

const normalizeGarage = (raw: Record<string, unknown>): Garage => ({
  id: String(raw.id ?? ""),
  name: String(raw.name ?? ""),
  contact_phone: (raw.contact_phone as string | null) ?? (raw.contactPhone as string | null) ?? null,
  open_time: (raw.open_time as string | null) ?? (raw.openTime as string | null) ?? null,
  service_image_url:
    (raw.service_image_url as string | null) ?? (raw.serviceImageUrl as string | null) ?? null,
  logo_url: (raw.logo_url as string | null) ?? (raw.logoUrl as string | null) ?? null,
  services: toStringArray(raw.services),
  address_state:
    (raw.address_state as string | null) ??
    (raw.addressState as string | null) ??
    // backend stores state/location as `location`
    (raw.location as string | null) ??
    null,
  address_country: (raw.address_country as string | null) ?? (raw.addressCountry as string | null) ?? null,
  rating: raw.rating != null ? Number(raw.rating) : null,
  reviews: raw.reviews != null ? Number(raw.reviews) : null,
});

const fallbackImage = "/mercedes.png";
const apiOrigin = (() => {
  try {
    return new URL(import.meta.env.VITE_API_URL || `${window.location.origin}/api`).origin;
  } catch {
    return window.location.origin;
  }
})();

const backendOrigin = (() => {
  try {
    const configured = (import.meta.env.VITE_API_URL || "").trim();
    if (/^https?:\/\//i.test(configured)) {
      return new URL(configured).origin;
    }
  } catch {
    // ignore and fallback
  }

  if (typeof window !== "undefined" && /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname)) {
    return "http://localhost:3001";
  }

  return window.location.origin;
})();

const normalizeAssetPath = (value: string) => {
  const normalized = value.replace(/\\+/g, "/").trim();
  const lower = normalized.toLowerCase();

  const publicUploadsIndex = lower.indexOf("public/uploads/");
  if (publicUploadsIndex >= 0) {
    return `/${normalized.slice(publicUploadsIndex + "public/".length)}`;
  }

  const uploadsIndex = lower.indexOf("/uploads/");
  if (uploadsIndex >= 0) {
    return normalized.slice(uploadsIndex);
  }

  if (lower.startsWith("uploads/")) {
    return `/${normalized}`;
  }

  return normalized;
};

const resolveImageUrl = (value?: string | null) => {
  if (!value) return "";
  const cleaned = normalizeAssetPath(value);
  if (!cleaned || cleaned.toLowerCase() === "null" || cleaned.toLowerCase() === "undefined") return "";
  if (/^(https?:|data:|blob:)/i.test(cleaned)) return cleaned;
  if (cleaned.startsWith("/uploads/") || cleaned.startsWith("uploads/")) {
    const uploadsPath = cleaned.startsWith("/") ? cleaned : `/${cleaned}`;
    return `${backendOrigin}${uploadsPath}`;
  }
  if (cleaned.startsWith("/")) return `${apiOrigin}${cleaned}`;
  return `${apiOrigin}/${cleaned}`;
};

const isProbablyImageUrl = (url: string) => {
  if (!url) return false;
  if (/^https?:/i.test(url)) return true;
  if (/^data:image\//i.test(url) || /^blob:/i.test(url)) return true;
  if (url.includes("/uploads/") || url.includes("/storage/v1/object/public/")) return true;
  return /\.(png|jpe?g|webp|gif|svg|avif)(\?|#|$)/i.test(url);
};

const getGarageImage = (garage: Garage) => {
  const serviceImage = resolveImageUrl(garage.service_image_url);
  const logoImage = resolveImageUrl(garage.logo_url);

  if (isProbablyImageUrl(serviceImage)) return serviceImage;
  if (isProbablyImageUrl(logoImage)) return logoImage;
  return fallbackImage;
};

const getGarageLogoImage = (garage: Garage) => {
  const logoImage = resolveImageUrl(garage.logo_url);
  return isProbablyImageUrl(logoImage) ? logoImage : fallbackImage;
};

const GarageListing = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [garages, setGarages] = useState<Garage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const loadGarages = async () => {
      setLoading(true);
      try {
        const { data } = await api.getGarages();

        if (!isMounted) return;

        setLoadError(null);
        const normalized = Array.isArray(data)
          ? data.map((row) => normalizeGarage(row as Record<string, unknown>))
          : [];
        setGarages(normalized);
      } catch {
        if (!isMounted) return;
        setLoadError("Failed to load garages");
        setGarages([]);
      }
      setLoading(false);
    };

    loadGarages();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredGarages = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return garages.filter((garage) => {
      const locationText = [garage.address_state, garage.address_country]
        .filter(Boolean)
        .join(", ")
        .toLowerCase();
      return garage.name.toLowerCase().includes(query) || locationText.includes(query);
    });
  }, [garages, searchQuery]);

  return (
    <div className="min-h-screen">
      <main className="pt-32 pb-24 bg-background">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-primary font-medium text-sm uppercase tracking-wider">Find Your Garage</span>
            <h1 className="font-display text-4xl md:text-5xl text-foreground mt-3 mb-4">
              <GlitchText text="BROWSE GARAGES" className="text-foreground" speed={40} />
            </h1>
            <p className="text-muted-foreground">
              Choose from our network of trusted and verified auto repair centers across India.
            </p>
          </div>

          {/* Search Bar (Global \" / \" shortcut focuses this input) */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="global-garage-search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 py-6 text-base"
              />
            </div>
          </div>

          {/* Results Info */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-muted-foreground">
              {loading
                ? "Loading garages..."
                : `Showing ${filteredGarages.length} garage${filteredGarages.length !== 1 ? "s" : ""}`}
            </p>
          </div>

          {/* Garage Grid */}
          {loadError && (
            <div className="text-center py-12 text-destructive">
              Unable to load garages: {loadError}
            </div>
          )}

          {!loadError && filteredGarages.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

              {filteredGarages.map((garage) => (
                <Card
                  key={garage.id}
                  className="overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col h-full bg-card/80 backdrop-blur-sm border-white/10"
                >
                    {/* Image */}
                    <div className="relative h-48 bg-muted overflow-hidden">
                      <img
                        src={getGarageImage(garage)}
                        data-secondary-src={getGarageLogoImage(garage)}
                        alt={garage.name}
                        onError={(event) => {
                          const nextSrc = event.currentTarget.dataset.secondarySrc;
                          if (nextSrc && event.currentTarget.src !== nextSrc) {
                            event.currentTarget.src = nextSrc;
                            return;
                          }

                          if (event.currentTarget.src !== fallbackImage) {
                            event.currentTarget.src = fallbackImage;
                          }
                        }}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                      {garage.open_time && (
                        <Badge className="absolute top-4 right-4 bg-green-500 text-white">Open Hours</Badge>
                      )}
                    </div>

                    {/* Content */}
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-start justify-between gap-2">
                        <span className="text-lg">{garage.name}</span>
                        {garage.rating ? (
                          <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-semibold">{garage.rating}</span>
                          </div>
                        ) : (
                          <Badge variant="secondary">New</Badge>
                        )}
                      </CardTitle>
                      {garage.reviews ? (
                        <CardDescription className="text-xs">({garage.reviews} reviews)</CardDescription>
                      ) : (
                        <CardDescription className="text-xs">No reviews yet</CardDescription>
                      )}
                    </CardHeader>

                    <CardContent className="flex-1 space-y-3">
                      {/* Location */}
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">
                          {[garage.address_state, garage.address_country].filter(Boolean).join(", ") || "Location not set"}
                        </span>
                      </div>

                      {/* Phone */}
                      <div className="flex items-start gap-2">
                        <Phone className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{garage.contact_phone || "Not provided"}</span>
                      </div>

                      {/* Time */}
                      <div className="flex items-start gap-2">
                        <Clock className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{garage.open_time || "Hours not listed"}</span>
                      </div>

                      {/* Services */}
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Services:</p>
                        <div className="flex flex-wrap gap-1">
                          {(garage.services || []).length > 0 ? (
                            (garage.services || []).map((service, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {service}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">No services listed</span>
                          )}
                        </div>
                      </div>
                    </CardContent>

                    {/* Action Button */}
                    <div className="p-4 border-t">
                      <Button
                        className="w-full"
                        onClick={() => {
                          window.location.href = `/garage/${garage.id}`;
                        }}
                      >
                        View Details <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                {loading ? "Loading garages..." : "No garages found matching your search."}
              </p>
              <Button variant="outline" onClick={() => setSearchQuery("")}>
                Clear Search
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default GarageListing;
