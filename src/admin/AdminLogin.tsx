import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Mail, Lock, Eye, EyeOff, Phone } from "lucide-react";
import { useAuth } from "@/context/useAuth";
import { getProfile } from "@/lib/firebase-db";

export default function AdminLogin() {
  const [emailOrMobile, setEmailOrMobile] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loginType, setLoginType] = useState<"email" | "mobile">("email");
  const { toast } = useToast();
  const navigate = useNavigate();
  const { login, logout, user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (user?.role === "admin") {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [authLoading, navigate, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);

    try {
      let nextUser;
      
      if (loginType === "email") {
        nextUser = await login(emailOrMobile.trim(), password, undefined, rememberMe);
      } else {
        nextUser = await login(undefined, password, emailOrMobile.trim(), rememberMe);
      }

      if (!nextUser?.id) {
        throw new Error("Unable to create session. Please try again.");
      }

      let isAdmin = String(nextUser.role || "").toLowerCase() === "admin";

      if (!isAdmin) {
        const profile = await getProfile(nextUser.id);
        if (profile) {
          isAdmin = String(profile.role || "").toLowerCase() === "admin";
        }
      }

      if (!isAdmin) {
        await logout();
        throw new Error("Access denied. Admin role required.");
      }

      toast({
        title: "Admin login successful",
        description: "Redirecting to admin dashboard...",
      });
      // Navigation handled by login() function in AuthContext
    } catch (error: any) {
      const message = error?.message || "Invalid credentials";
      setAuthError(message);
      toast({
        title: "Login failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <main className="pt-32 pb-24 bg-gradient-to-b from-background to-muted/30">
        <div className="page-shell">
          <div className="max-w-md mx-auto">
            <Card className="border-2">
              <CardHeader className="text-center space-y-2">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-3xl">Admin Login</CardTitle>
                <CardDescription>Sign in to access the admin dashboard</CardDescription>
              </CardHeader>

              <CardContent>
                {authError ? (
                  <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                    {authError}
                  </div>
                ) : null}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Login Type Switcher */}
                  <div className="flex gap-2 mb-4">
                    <Button
                      type="button"
                      variant={loginType === "email" ? "default" : "outline"}
                      className="flex-1 gap-2"
                      onClick={() => {
                        setLoginType("email");
                        setEmailOrMobile("");
                        setAuthError(null);
                      }}
                    >
                      <Mail className="w-4 h-4" />
                      Email
                    </Button>
                    <Button
                      type="button"
                      variant={loginType === "mobile" ? "default" : "outline"}
                      className="flex-1 gap-2"
                      onClick={() => {
                        setLoginType("mobile");
                        setEmailOrMobile("");
                        setAuthError(null);
                      }}
                    >
                      <Phone className="w-4 h-4" />
                      Mobile
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emailOrMobile" className="text-base">
                      {loginType === "email" ? "Email Address" : "Mobile Number"}
                    </Label>
                    <div className="relative">
                      {loginType === "email" ? (
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      ) : (
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      )}
                      <Input
                        id="emailOrMobile"
                        type={loginType === "email" ? "email" : "tel"}
                        value={emailOrMobile}
                        onChange={(e) => setEmailOrMobile(e.target.value)}
                        required
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-base">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-border accent-primary"
                    />
                    Keep me signed in
                  </label>

                  <Button
                    type="submit"
                    className="w-full mt-6"
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? "Signing in..." : "Sign In as Admin"}
                  </Button>
                </form>

                <div className="mt-6 text-center text-sm text-muted-foreground">
                  <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="text-primary hover:underline font-semibold"
                  >
                    Back to Home
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
