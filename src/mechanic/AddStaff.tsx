import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/useAuth";
import { api } from "@/lib/api-client";

const parseNumber = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

type StaffForm = {
  name: string;
  emailId: string;
  mobileNumber: string;
  address: string;
  password: string;
  services: string;
  experience: string;
  yearOfJoin: string;
  salary: string;
};

export default function AddStaff() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading } = useAuth();

  const [submitting, setSubmitting] = useState(false);
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState("");
  const [form, setForm] = useState<StaffForm>({
    name: "",
    emailId: "",
    mobileNumber: "",
    address: "",
    password: "",
    services: "",
    experience: "",
    yearOfJoin: "",
    salary: "",
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/customer/register", { replace: true });
    }
  }, [loading, user, navigate]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfilePic = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setProfilePic(file);
    if (!file) {
      setProfilePreview("");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setProfilePreview((reader.result as string) || "");
    reader.readAsDataURL(file);
  };

  const uploadProfilePicture = async () => {
    if (!profilePic) return "";
    try {
      const { data, error } = await api.uploadStaffProfileImageApi(profilePic);
      if (error) {
        console.warn("Profile picture upload failed, continuing without image:", error);
        return "";
      }
      return data?.imageUrl || "";
    } catch (err) {
      console.warn("Profile picture upload failed, continuing without image:", err);
      return "";
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;

    setSubmitting(true);

    try {
      const name = form.name.trim();
      const email = form.emailId.trim().toLowerCase();
      const mobileNumber = form.mobileNumber.trim();
      const address = form.address.trim();
      const password = form.password.trim();
      const services = form.services.trim();

      if (!name || !email || !mobileNumber || !address || !password || !services) {
        throw new Error("Name, Email ID, Mobile Number, Address, Password, and Services are required.");
      }

      if (mobileNumber.length < 10) {
        throw new Error("Mobile number must be at least 10 digits.");
      }

      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters long.");
      }

      const profilePicUrl = await uploadProfilePicture();

      const { error } = await api.createStaffApi({
        name,
        emailId: email,
        mobileNumber,
        address,
        password,
        services,
        experienceYears: parseNumber(form.experience),
        yearOfJoin: parseNumber(form.yearOfJoin),
        salary: parseNumber(form.salary),
        profilePicUrl: profilePicUrl || null,
      });

      if (error) {
        throw new Error(error);
      }

      toast({
        title: "Staff added successfully",
        description: "Staff member can now log in with the provided email and password.",
      });

      setForm({
        name: "",
        emailId: "",
        mobileNumber: "",
        address: "",
        password: "",
        services: "",
        experience: "",
        yearOfJoin: "",
        salary: "",
      });
      setProfilePic(null);
      setProfilePreview("");
    } catch (error: any) {
      toast({
        title: "Unable to add staff",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <main className="pt-32 pb-24 bg-background">
          <div className="container mx-auto px-4 text-center text-muted-foreground">Loading...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <main className="pt-32 pb-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-3xl">Add New Staff</CardTitle>
                <CardDescription>Create a staff profile with login credentials.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        name="name"
                        value={form.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emailId">Email ID</Label>
                      <Input
                        id="emailId"
                        type="email"
                        name="emailId"
                        value={form.emailId}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="mobileNumber">Mobile Number</Label>
                      <Input
                        id="mobileNumber"
                        name="mobileNumber"
                        type="tel"
                        value={form.mobileNumber}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        value={form.password}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      name="address"
                      value={form.address}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="services">Services</Label>
                    <Textarea
                      id="services"
                      name="services"
                      value={form.services}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="experience">Experience (Years)</Label>
                      <Input
                        id="experience"
                        name="experience"
                        type="number"
                        min="0"
                        value={form.experience}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="yearOfJoin">Year of Join</Label>
                      <Input
                        id="yearOfJoin"
                        name="yearOfJoin"
                        type="number"
                        min="1990"
                        max="2100"
                        value={form.yearOfJoin}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="salary">Salary</Label>
                      <Input
                        id="salary"
                        name="salary"
                        type="number"
                        min="0"
                        value={form.salary}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="profilePic">Profile Pic</Label>
                    <Input
                      id="profilePic"
                      name="profilePic"
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePic}
                    />
                    {profilePreview ? (
                      <img src={profilePreview} alt="Profile preview" className="h-24 w-24 rounded border object-cover" />
                    ) : null}
                  </div>

                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? "Creating Staff..." : "Create Staff"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
