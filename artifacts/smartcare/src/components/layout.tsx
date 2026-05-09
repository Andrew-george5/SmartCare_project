import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard, Users, Stethoscope, Calendar, FileText,
  Pill, CreditCard, Bell, LogOut, Menu, KeyRound, Building2, Wallet, TrendingUp, UserCircle, Settings2, AlertCircle
} from "lucide-react";
import { useState, type ReactNode } from "react";

const nav = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard", roles: ["ADMIN", "DOCTOR", "PATIENT"] },
  { label: "Appointments", icon: Calendar, href: "/appointments", roles: ["ADMIN", "DOCTOR", "PATIENT"] },
  { label: "Patients", icon: Users, href: "/patients", roles: ["ADMIN"] },
  { label: "Doctors", icon: Stethoscope, href: "/doctors", roles: ["ADMIN"] },
  { label: "Clinics", icon: Building2, href: "/clinics", roles: ["ADMIN"] },
  { label: "My Schedule", icon: Building2, href: "/schedule", roles: ["DOCTOR"] },
  { label: "Drugs", icon: Pill, href: "/drugs", roles: ["ADMIN", "DOCTOR"] },
  { label: "Medical Records", icon: FileText, href: "/medical-records", roles: ["ADMIN", "DOCTOR", "PATIENT"] },
  { label: "Prescriptions", icon: Pill, href: "/prescriptions", roles: ["ADMIN", "DOCTOR", "PATIENT"] },
  { label: "Bills", icon: CreditCard, href: "/billing/bills", roles: ["PATIENT"] },
  { label: "Profit", icon: TrendingUp, href: "/billing/profit", roles: ["DOCTOR"] },
  { label: "Billing", icon: Wallet, href: "/billing/revenue", roles: ["ADMIN"] },
  { label: "Notifications", icon: Bell, href: "/notifications", roles: ["ADMIN", "DOCTOR", "PATIENT"] },
  { label: "My Profile", icon: UserCircle, href: "/profile", roles: ["PATIENT"] },
  { label: "Settings", icon: Settings2, href: "/settings", roles: ["ADMIN"] },
];

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, token, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showChangePw, setShowChangePw] = useState(false);
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwLoading, setPwLoading] = useState(false);
  const { toast } = useToast();

  const filteredNav = nav.filter(item => !user || item.roles.includes(user.role));

  // Fetch unread notification count — polling every 30s
  const { data: notifications } = useQuery({
    queryKey: ["/api/notifications", "unread-count"],
    queryFn: async () => {
      const res = await fetch("/api/notifications", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return [];
      return res.json() as Promise<any[]>;
    },
    enabled: !!token,
    refetchInterval: 30000,
    staleTime: 20000,
  });
  const unreadCount = (notifications ?? []).filter((n: any) => !n.isRead).length;

  // Fetch doctor's own ID — DOCTOR role only
  const { data: doctorMe } = useQuery({
    queryKey: ["/api/doctors/me", "layout-doctor"],
    queryFn: async () => {
      const res = await fetch("/api/doctors/me", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return null;
      return res.json() as Promise<any>;
    },
    enabled: !!token && user?.role === "DOCTOR",
    staleTime: 60000,
  });
  const doctorId = (doctorMe as any)?.doctorId;

  // Fetch pending appointments count for doctor — polls every 30s
  const { data: pendingAppointments } = useQuery({
    queryKey: ["/api/appointments", "doctor-pending", doctorId],
    queryFn: async () => {
      const res = await fetch(`/api/appointments?doctorId=${doctorId}&status=PENDING`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return [];
      return res.json() as Promise<any[]>;
    },
    enabled: !!token && user?.role === "DOCTOR" && !!doctorId,
    refetchInterval: 30000,
    staleTime: 20000,
  });
  const hasPendingAppointments = user?.role === "DOCTOR" && (pendingAppointments ?? []).length > 0;

  // Fetch patient profile to check completeness — PATIENT role only
  const { data: patientProfile } = useQuery({
    queryKey: ["/api/patients/me", "layout-check"],
    queryFn: async () => {
      const res = await fetch("/api/patients/me", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return null;
      return res.json() as Promise<any>;
    },
    enabled: !!token && user?.role === "PATIENT",
    staleTime: 60000,
  });

  const isProfileIncomplete =
    user?.role === "PATIENT" &&
    patientProfile !== undefined &&
    patientProfile !== null &&
    (!patientProfile.gender || !patientProfile.dateOfBirth || !patientProfile.bloodType || !patientProfile.address);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (pwForm.next.length < 6) {
      toast({ title: "New password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setPwLoading(true);
    try {
      const res = await fetch("/api/users/me/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).message || "Failed to change password");
      }
      toast({ title: "Password changed successfully" });
      setShowChangePw(false);
      setPwForm({ current: "", next: "", confirm: "" });
    } catch (err: any) {
      toast({ title: err.message ?? "Error", variant: "destructive" });
    } finally {
      setPwLoading(false);
    }
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-bold text-sm">
            SC
          </div>
          <div>
            <p className="font-semibold text-sidebar-foreground text-sm">SmartCare HMS</p>
            <p className="text-xs text-muted-foreground">Helwan University</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-3">
          {filteredNav.map(({ label, icon: Icon, href }) => {
            const active = location === href || location.startsWith(href + "/");
            const isNotifications = href === "/notifications";
            const isProfile = href === "/profile";
            const isAppointments = href === "/appointments";
            return (
              <button
                key={href}
                onClick={() => { setLocation(href); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1 text-left">{label}</span>
                {isNotifications && unreadCount > 0 && (
                  <span className={`text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none ${
                    active ? "bg-white/20 text-white" : "bg-red-500 text-white"
                  }`}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
                {isAppointments && hasPendingAppointments && (
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0 animate-pulse" title="Pending appointments awaiting response" />
                )}
                {isProfile && isProfileIncomplete && (
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" title="Profile incomplete" />
                )}
              </button>
            );
          })}
        </nav>
      </ScrollArea>

      <Separator />
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name}</p>
            <Badge variant="secondary" className="text-xs">{user?.role}</Badge>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2"
          onClick={() => { setSidebarOpen(false); setShowChangePw(true); }}
        >
          <KeyRound className="w-4 h-4" />
          Change Password
        </Button>
        <Button variant="outline" size="sm" className="w-full gap-2" onClick={logout}>
          <LogOut className="w-4 h-4" />
          Sign out
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <div className="flex h-screen bg-background">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex flex-col w-64 bg-sidebar border-r border-sidebar-border shrink-0">
          <SidebarContent />
        </aside>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
            <aside className="relative w-64 h-full bg-sidebar border-r border-sidebar-border">
              <SidebarContent />
            </aside>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Mobile header */}
          <header className="md:hidden flex items-center gap-3 p-4 border-b bg-card">
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </Button>
            <span className="font-semibold flex-1">SmartCare HMS</span>
            {unreadCount > 0 && (
              <button onClick={() => setLocation("/notifications")} className="relative">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              </button>
            )}
          </header>

          {/* Incomplete profile banner */}
          {isProfileIncomplete && location !== "/profile" && (
            <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center gap-3">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <p className="text-sm text-amber-800 flex-1">
                Your profile is incomplete. Please enter the rest of your data in the{" "}
                <button
                  onClick={() => setLocation("/profile")}
                  className="font-semibold underline underline-offset-2 hover:text-amber-900 transition-colors"
                >
                  My Profile
                </button>{" "}
                section.
              </p>
              <button
                onClick={() => setLocation("/profile")}
                className="text-xs font-medium text-amber-700 hover:text-amber-900 border border-amber-300 rounded px-2 py-1 hover:bg-amber-100 transition-colors shrink-0"
              >
                Complete now
              </button>
            </div>
          )}

          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={showChangePw} onOpenChange={open => { setShowChangePw(open); if (!open) setPwForm({ current: "", next: "", confirm: "" }); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleChangePassword} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="current-pw">Current Password</Label>
              <Input
                id="current-pw"
                type="password"
                placeholder="Enter current password"
                value={pwForm.current}
                onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-pw">New Password</Label>
              <Input
                id="new-pw"
                type="password"
                placeholder="At least 6 characters"
                value={pwForm.next}
                onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-pw">Confirm New Password</Label>
              <Input
                id="confirm-pw"
                type="password"
                placeholder="Repeat new password"
                value={pwForm.confirm}
                onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                required
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setShowChangePw(false)} disabled={pwLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={pwLoading}>
                {pwLoading ? "Saving…" : "Save Password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
