import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { MailCheck, ArrowLeft, Mail } from "lucide-react";
import { api } from "@/lib/api-client";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const { error } = await api.forgotPassword(email.trim());
      if (error) {
        throw new Error(error);
      }

      setSent(true);
      toast({
        title: "Reset email sent",
        description: "Check your inbox for the password reset link.",
      });
    } catch (error: any) {
      toast({
        title: "Request failed",
        description: error?.message || "Unable to send reset email.",
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
                  <MailCheck className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-3xl">Forgot Password</CardTitle>
                <CardDescription>
                  Enter your account email to receive a reset link.
                </CardDescription>
              </CardHeader>

              <CardContent>
                {sent ? (
                  <div className="space-y-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      If an account exists for <span className="font-medium text-foreground">{email}</span>, you will
                      receive a password reset email shortly.
                    </p>
                    <Button onClick={() => navigate("/login")} className="w-full">
                      Back to Login
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-base">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          required
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <Button type="submit" className="w-full mt-4" size="lg" disabled={loading}>
                      {loading ? "Sending..." : "Send Reset Link"}
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full gap-2"
                      onClick={() => navigate("/login")}
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to Login
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
