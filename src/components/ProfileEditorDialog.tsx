import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/useAuth";
import { api } from "@/lib/api-client";

type ProfileForm = {
  email: string;
  name: string;
  full_name: string;
  mobileNumber: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  bio: string;
  photoUrl: string;
};

const emptyForm: ProfileForm = {
  email: "",
  name: "",
  full_name: "",
  mobileNumber: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  country: "",
  pincode: "",
  bio: "",
  photoUrl: "",
};

export default function ProfileEditorDialog({ triggerClassName }: { triggerClassName?: string }) {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState<ProfileForm>(emptyForm);

  const initials = useMemo(() => {
    const base = form.name || user?.name || "U";
    const parts = base.trim().split(/\s+/).filter(Boolean);
    return (parts[0]?.[0] || "U") + (parts[1]?.[0] || "");
  }, [form.name, user?.name]);

  useEffect(() => {
    if (!open) return;

    let mounted = true;
    const loadProfile = async () => {
      setLoading(true);
      try {
        const { data, error } = await api.getProfileDetailsApi();
        if (error) throw new Error(error);
        if (!mounted) return;

        const profile = (data || {}) as Record<string, any>;
        setForm({
          email: String(profile.email || user?.email || ""),
          name: String(profile.name || user?.name || ""),
          full_name: String(profile.full_name || profile.name || user?.name || ""),
          mobileNumber: String(profile.mobileNumber || ""),
          addressLine1: String(profile.addressLine1 || ""),
          addressLine2: String(profile.addressLine2 || ""),
          city: String(profile.city || ""),
          state: String(profile.state || ""),
          country: String(profile.country || ""),
          pincode: String(profile.pincode || ""),
          bio: String(profile.bio || ""),
          photoUrl: String(profile.photoUrl || ""),
        });
      } catch (err: any) {
        toast({ title: "Profile load failed", description: err?.message || "Unable to load profile", variant: "destructive" });
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadProfile();
    return () => {
      mounted = false;
    };
  }, [open, user?.email, user?.name, toast]);

  const updateField = (key: keyof ProfileForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleFileSelect = async (file?: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const { data, error } = await api.uploadProfileImageApi(file);
      if (error) throw new Error(error);
      updateField("photoUrl", String((data as any)?.imageUrl || ""));
      toast({ title: "Photo uploaded", description: "Profile image updated." });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err?.message || "Failed to upload image", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        full_name: form.full_name,
        mobileNumber: form.mobileNumber,
        addressLine1: form.addressLine1,
        addressLine2: form.addressLine2,
        city: form.city,
        state: form.state,
        country: form.country,
        pincode: form.pincode,
        bio: form.bio,
        photoUrl: form.photoUrl,
      };

      const { error } = await api.updateProfileDetailsApi(payload);
      if (error) throw new Error(error);

      await refreshUser();
      toast({ title: "Profile saved", description: "Your profile details were updated." });
      setOpen(false);
    } catch (err: any) {
      toast({ title: "Save failed", description: err?.message || "Failed to update profile", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={triggerClassName}>Edit Profile</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>Update your details and profile photo.</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">Loading profile...</div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 border">
                {form.photoUrl ? <AvatarImage src={form.photoUrl} alt={form.name || "Profile"} /> : null}
                <AvatarFallback className="text-lg font-bold">{initials.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                  disabled={uploading}
                />
                <p className="text-xs text-muted-foreground">PNG, JPG, WEBP up to 5MB</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-muted-foreground">Name</label>
                <Input value={form.name} onChange={(e) => updateField("name", e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-muted-foreground">Full Name</label>
                <Input value={form.full_name} onChange={(e) => updateField("full_name", e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-muted-foreground">Email</label>
                <Input value={form.email} disabled />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-muted-foreground">Mobile Number</label>
                <Input value={form.mobileNumber} onChange={(e) => updateField("mobileNumber", e.target.value)} />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Address Line 1</label>
                <Input value={form.addressLine1} onChange={(e) => updateField("addressLine1", e.target.value)} />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Address Line 2</label>
                <Input value={form.addressLine2} onChange={(e) => updateField("addressLine2", e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-muted-foreground">City</label>
                <Input value={form.city} onChange={(e) => updateField("city", e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-muted-foreground">State</label>
                <Input value={form.state} onChange={(e) => updateField("state", e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-muted-foreground">Country</label>
                <Input value={form.country} onChange={(e) => updateField("country", e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-muted-foreground">Pincode</label>
                <Input value={form.pincode} onChange={(e) => updateField("pincode", e.target.value)} />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Bio</label>
                <Textarea rows={3} value={form.bio} onChange={(e) => updateField("bio", e.target.value)} />
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving || uploading}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading || saving || uploading}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
