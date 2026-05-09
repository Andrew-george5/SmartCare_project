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
import {
  User, Heart, Phone, Mail, MapPin, CalendarDays, Droplets,
  Pencil, X, Check, CircleAlert, CircleCheck, ChevronRight
} from "lucide-react";

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
        qc.invalidateQueries({ queryKey: ["/api/patients/me", "layout-check"] });
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

  const completionFields = [
    { key: "name", label: "Full Name", value: user?.name, icon: User },
    { key: "email", label: "Email Address", value: user?.email, icon: Mail },
    { key: "phoneNumber", label: "Phone Number", value: patient?.phoneNumber, icon: Phone },
    { key: "gender", label: "Gender", value: patient?.gender, icon: User },
    { key: "dateOfBirth", label: "Date of Birth", value: patient?.dateOfBirth, icon: CalendarDays },
    { key: "bloodType", label: "Blood Type", value: patient?.bloodType, icon: Droplets },
    { key: "address", label: "Address", value: patient?.address, icon: MapPin },
  ];

  const filledCount = completionFields.filter(f => !!f.value).length;
  const totalCount = completionFields.length;
  const percentage = Math.round((filledCount / totalCount) * 100);
  const missingFields = completionFields.filter(f => !f.value);
  const isComplete = filledCount === totalCount;

  const progressColor =
    percentage === 100 ? "bg-green-500" :
    percentage >= 60 ? "bg-amber-400" :
    "bg-red-500";

  const progressTextColor =
    percentage === 100 ? "text-green-700" :
    percentage >= 60 ? "text-amber-700" :
    "text-red-700";

  const progressBgColor =
    percentage === 100 ? "bg-green-50 border-green-200" :
    percentage >= 60 ? "bg-amber-50 border-amber-200" :
    "bg-red-50 border-red-200";

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
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl shrink-0">
                {initials}
              </div>
              {!isLoading && (
                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${isComplete ? "bg-green-500" : "bg-red-500"}`}>
                  {isComplete
                    ? <Check className="w-3 h-3 text-white" />
                    : <CircleAlert className="w-3 h-3 text-white" />
                  }
                </div>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{user?.name}</h2>
              <p className="text-muted-foreground text-sm">{user?.email}</p>
              <Badge className="mt-1" variant="secondary">Patient</Badge>
            </div>
            {!isLoading && !isComplete && (
              <Button size="sm" className="gap-2 shrink-0" onClick={startEdit}>
                <Pencil className="w-3.5 h-3.5" />
                Complete Profile
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Profile Completion Card */}
      {!isLoading && (
        <Card className={`border ${progressBgColor}`}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {isComplete
                  ? <CircleCheck className="w-5 h-5 text-green-600" />
                  : <CircleAlert className="w-5 h-5 text-red-500" />
                }
                <span className={`text-sm font-semibold ${progressTextColor}`}>
                  {isComplete ? "Profile Complete!" : "Profile Incomplete"}
                </span>
              </div>
              <span className={`text-2xl font-bold ${progressTextColor}`}>{percentage}%</span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-black/10 rounded-full h-2.5 mb-4">
              <div
                className={`h-2.5 rounded-full transition-all duration-500 ${progressColor}`}
                style={{ width: `${percentage}%` }}
              />
            </div>

            {isComplete ? (
              <p className="text-sm text-green-700">
                All your information is filled in. Your profile is fully visible to your doctors.
              </p>
            ) : (
              <div className="space-y-2.5">
                <p className="text-sm text-muted-foreground">
                  {filledCount} of {totalCount} fields complete. Missing:
                </p>
                <div className="flex flex-wrap gap-2">
                  {missingFields.map(field => (
                    <button
                      key={field.key}
                      onClick={startEdit}
                      className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border border-red-300 bg-white text-red-700 hover:bg-red-50 transition-colors"
                    >
                      <field.icon className="w-3 h-3" />
                      {field.label}
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground pt-1">
                  Click any missing field above or use the <strong>Edit</strong> button in Medical Information to complete your profile.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <Skeleton className="h-28 w-full rounded-xl" />
      )}

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
