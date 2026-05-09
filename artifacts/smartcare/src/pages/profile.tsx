import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useUpdatePatient } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { User, Heart, Phone, Mail, MapPin, CalendarDays, Droplets, Pencil, X, Check } from "lucide-react";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value?: string | null }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-0">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium mt-0.5">{value || <span className="text-muted-foreground italic">Not set</span>}</p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ gender: "", dateOfBirth: "", bloodType: "", address: "" });

  const { data: patient, isLoading } = useQuery({
    queryKey: ["/api/patients/me"],
    queryFn: async () => {
      const res = await fetch("/api/patients/me", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to load profile");
      return res.json() as Promise<any>;
    },
    enabled: !!token,
  });

  const updateMutation = useUpdatePatient({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["/api/patients/me"] });
        setEditing(false);
        toast({ title: "Profile updated successfully" });
      },
      onError: (err: any) => {
        toast({ title: err?.message ?? "Failed to update profile", variant: "destructive" });
      },
    },
  });

  function startEdit() {
    setForm({
      gender: patient?.gender ?? "",
      dateOfBirth: patient?.dateOfBirth ?? "",
      bloodType: patient?.bloodType ?? "",
      address: patient?.address ?? "",
    });
    setEditing(true);
  }

  function handleSave() {
    if (!patient?.patientId) return;
    updateMutation.mutate({
      id: patient.patientId,
      data: {
        gender: form.gender || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        bloodType: form.bloodType || undefined,
        address: form.address || undefined,
      } as any,
    });
  }

  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">My Profile</h1>
        <p className="text-muted-foreground">View and update your personal and medical information</p>
      </div>

      {/* Identity card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl shrink-0">
              {initials}
            </div>
            <div>
              <h2 className="text-xl font-bold">{user?.name}</h2>
              <p className="text-muted-foreground text-sm">{user?.email}</p>
              <Badge className="mt-1" variant="secondary">Patient</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account info */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4" /> Account Information
          </CardTitle>
          <CardDescription>Your login and contact details</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <>
              <InfoRow icon={User} label="Full Name" value={user?.name} />
              <InfoRow icon={Mail} label="Email Address" value={user?.email} />
              <InfoRow icon={Phone} label="Phone Number" value={patient?.phoneNumber} />
            </>
          )}
        </CardContent>
      </Card>

      {/* Medical info */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Heart className="w-4 h-4" /> Medical Information
              </CardTitle>
              <CardDescription>Your health details used by doctors</CardDescription>
            </div>
            {!editing && (
              <Button variant="outline" size="sm" className="gap-2" onClick={startEdit} disabled={isLoading}>
                <Pencil className="w-3.5 h-3.5" /> Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : editing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Gender</Label>
                  <Select value={form.gender} onValueChange={v => setForm(f => ({ ...f, gender: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select gender..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Date of Birth</Label>
                  <Input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={e => setForm(f => ({ ...f, dateOfBirth: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Blood Type</Label>
                  <Select value={form.bloodType} onValueChange={v => setForm(f => ({ ...f, bloodType: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select blood type..." /></SelectTrigger>
                    <SelectContent>
                      {BLOOD_TYPES.map(bt => (
                        <SelectItem key={bt} value={bt}>{bt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Address</Label>
                  <Input
                    value={form.address}
                    onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                    placeholder="123 Main St, City"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Button size="sm" className="gap-2" onClick={handleSave} disabled={updateMutation.isPending}>
                  <Check className="w-3.5 h-3.5" />
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
                <Button size="sm" variant="outline" className="gap-2" onClick={() => setEditing(false)} disabled={updateMutation.isPending}>
                  <X className="w-3.5 h-3.5" /> Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <InfoRow icon={User} label="Gender" value={patient?.gender} />
              <InfoRow icon={CalendarDays} label="Date of Birth" value={patient?.dateOfBirth} />
              <InfoRow icon={Droplets} label="Blood Type" value={patient?.bloodType} />
              <InfoRow icon={MapPin} label="Address" value={patient?.address} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
