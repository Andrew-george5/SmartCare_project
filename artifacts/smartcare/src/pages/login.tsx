import { useState } from "react";
import { useLocation } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@smartcare.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const [, setLocation] = useLocation();

  const loginMutation = useLogin({
    mutation: {
      onSuccess: (data: any) => {
        login(data.token, data.user);
        setLocation("/dashboard");
      },
      onError: (err: any) => {
        setError(err?.data?.error || "Invalid credentials. Please try again.");
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    loginMutation.mutate({ data: { email, password } });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground text-2xl font-bold mb-4">
            SC
          </div>
          <h1 className="text-3xl font-bold text-foreground">SmartCare HMS</h1>
          <p className="text-muted-foreground mt-1">Helwan University — Hospital Management System</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Sign in to your account</CardTitle>
            <CardDescription>Enter your credentials to access the system</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? "Signing in..." : "Sign in"}
              </Button>
            </form>
            <div className="mt-4 p-3 bg-muted rounded-md text-sm text-muted-foreground space-y-2">
              <div>
                <p className="font-medium">Demo credentials</p>
                <p>Email: admin@smartcare.com</p>
                <p>Password: admin123</p>
              </div>
              <button className="text-primary font-medium" onClick={() => setLocation("/signup")}>
                Create a patient account
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
