import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Phone, Lock, User } from "lucide-react";
import { useAuth } from "@/context/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await register(form.name, form.email, form.password);
      toast({
        title: "Account created!",
        description: "Your account is ready. Redirecting to dashboard...",
      });
      // Navigation handled by register() function in AuthContext
    } catch (error: any) {
      const message = String(error?.message || "Please try again.");
      const lower = message.toLowerCase();
      const alreadyRegistered =
        lower.includes("already registered") ||
        lower.includes("email-already-exists") ||
        lower.includes("already exists");

      if (alreadyRegistered) {
        toast({
          title: "Account already exists",
          description: "Please sign in with your email.",
        });
        navigate("/login");
        return;
      }

      toast({
        title: "Registration failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-24 flex items-center justify-center">
      <div className="page-shell max-w-md">
        <Card className="border-2">
          <CardHeader className="text-center space-y-2">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
              <UserPlus className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-3xl">Create Account</CardTitle>
            <CardDescription>Join our network for seamless garage booking</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="name"
                    name="name"
                    onChange={handleChange}
                    required
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    onChange={handleChange}
                    required
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="phone"
                    name="phone"
                    onChange={handleChange}
                    required
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    onChange={handleChange}
                    required
                    className="pl-10"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full mt-6"
                size="lg"
                disabled={loading}
              >
                {loading ? "Creating Account..." : "Register"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Already registered?{" "}
              <button
                type="button"
                onClick={() => navigate("/customer/login")}
                className="text-primary hover:underline font-semibold"
              >
                Go to Login
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
