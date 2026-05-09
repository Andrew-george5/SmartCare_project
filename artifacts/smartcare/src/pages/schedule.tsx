import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useListClinics,
  useCreateClinicReservation,
  useDeleteClinicReservation,
  getListClinicReservationsQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Building2, Clock, Users } from "lucide-react";

const DAYS = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
const DAY_SHORT: Record<string, string> = {
  SUNDAY: "Sun", MONDAY: "Mon", TUESDAY: "Tue",
  WEDNESDAY: "Wed", THURSDAY: "Thu", FRIDAY: "Fri", SATURDAY: "Sat",
};
const DAY_COLOR: Record<string, string> = {
  SUNDAY: "bg-rose-50 border-rose-200",
  MONDAY: "bg-sky-50 border-sky-200",
  TUESDAY: "bg-violet-50 border-violet-200",
  WEDNESDAY: "bg-amber-50 border-amber-200",
  THURSDAY: "bg-emerald-50 border-emerald-200",
  FRIDAY: "bg-orange-50 border-orange-200",
  SATURDAY: "bg-pink-50 border-pink-200",
};
const DAY_BADGE: Record<string, string> = {
  SUNDAY: "bg-rose-100 text-rose-700",
  MONDAY: "bg-sky-100 text-sky-700",
  TUESDAY: "bg-violet-100 text-violet-700",
  WEDNESDAY: "bg-amber-100 text-amber-700",
  THURSDAY: "bg-emerald-100 text-emerald-700",
  FRIDAY: "bg-orange-100 text-orange-700",
  SATURDAY: "bg-pink-100 text-pink-700",
};


export default function SchedulePage() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();

  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ clinicId: "", day: "MONDAY", startHour: "09:00", endHour: "13:00", maxPatients: "1" });

  // Get doctor profile to get doctorId
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["doctors", "me"],
    queryFn: async () => {
      const res = await fetch("/api/doctors/me", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Could not load doctor profile");
      return res.json();
    },
  });

  // Get this doctor's reservations
  const { data: reservations, isLoading: resLoading } = useQuery({
    queryKey: getListClinicReservationsQueryKey({ doctorId: profile?.doctorId }),
    queryFn: async () => {
      const res = await fetch(`/api/clinic-reservations?doctorId=${profile.doctorId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Could not load reservations");
      return res.json() as Promise<any[]>;
    },
    enabled: !!profile?.doctorId,
  });

  const { data: allClinics } = useListClinics();
  const clinics = (allClinics ?? []).filter(
    (c: any) =>
      c.type?.toLowerCase().includes(profile?.specialty?.toLowerCase()) ||
      profile?.specialty?.toLowerCase().includes(c.type?.toLowerCase())
  );

  const createMutation = useCreateClinicReservation({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListClinicReservationsQueryKey({ doctorId: profile?.doctorId }) });
        setShowDialog(false);
        setForm({ clinicId: "", day: "MONDAY", startHour: "09:00", endHour: "13:00", maxPatients: "1" });
        toast({ title: "Slot reserved successfully" });
      },
      onError: (err: any) => {
        toast({ title: err?.message ?? "Failed to reserve slot", variant: "destructive" });
      },
    },
  });

  const deleteMutation = useDeleteClinicReservation({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListClinicReservationsQueryKey({ doctorId: profile?.doctorId }) });
        toast({ title: "Slot removed" });
      },
      onError: () => {
        toast({ title: "Failed to remove slot", variant: "destructive" });
      },
    },
  });

  function handleAdd() {
    if (!form.clinicId || !profile?.doctorId) return;
    if (form.startHour >= form.endHour) {
      toast({ title: "End time must be after start time", variant: "destructive" });
      return;
    }
    if (Number(form.maxPatients) < 1) {
      toast({ title: "Max patients must be at least 1", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      data: {
        clinicId: Number(form.clinicId),
        doctorId: profile.doctorId,
        day: form.day,
        startHour: form.startHour,
        endHour: form.endHour,
        maxPatients: Number(form.maxPatients),
      } as any,
    });
  }

  // Group reservations by day
  const byDay: Record<string, any[]> = {};
  DAYS.forEach((d) => { byDay[d] = []; });
  (reservations ?? []).forEach((r: any) => {
    if (byDay[r.day]) byDay[r.day].push(r);
    else byDay[r.day] = [r];
  });

  const loading = profileLoading || resLoading;
  const totalSlots = (reservations ?? []).length;
  const activeDays = DAYS.filter((d) => byDay[d].length > 0).length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Weekly Clinic Schedule</h1>
          <p className="text-muted-foreground">
            {profile
              ? `Dr. ${profile.name} · ${profile.specialty}`
              : "Loading your profile…"}
          </p>
        </div>
        <Button
          onClick={() => setShowDialog(true)}
          className="gap-2"
          disabled={!profile}
        >
          <Plus className="w-4 h-4" /> Reserve Slot
        </Button>
      </div>
      
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Slots</p>
              {loading ? <Skeleton className="h-7 w-10 mt-0.5" /> : <p className="text-2xl font-bold">{totalSlots}</p>}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-100">
              <Clock className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Days</p>
              {loading ? <Skeleton className="h-7 w-10 mt-0.5" /> : <p className="text-2xl font-bold">{activeDays}</p>}
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2 md:col-span-1">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-violet-100">
              <Building2 className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Clinics Used</p>
              {loading ? <Skeleton className="h-7 w-10 mt-0.5" /> : (
                <p className="text-2xl font-bold">
                  {new Set((reservations ?? []).map((r: any) => r.clinicId)).size}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array(7).fill(0).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-24" /></CardContent></Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {DAYS.map((day) => {
            const slots = byDay[day] ?? [];
            return (
              <Card key={day} className={`border-2 ${DAY_COLOR[day]}`}>
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${DAY_BADGE[day]}`}>
                      {DAY_SHORT[day]}
                    </span>
                    {slots.length > 0 && (
                      <span className="text-xs text-muted-foreground">{slots.length} slot{slots.length > 1 ? "s" : ""}</span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-2">
                  {slots.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-3">No slots</p>
                  ) : (
                    slots.map((r: any) => (
                      <div key={r.reservationId} className="flex items-center justify-between bg-white/80 rounded-lg px-3 py-2 shadow-sm border border-white">
                        <div>
                          <p className="text-xs font-semibold text-foreground">{r.clinicType}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <Clock className="w-3 h-3" />
                            {r.startHour} — {r.endHour}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <Users className="w-3 h-3" />
                            Max {r.maxPatients ?? 1} patients
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => deleteMutation.mutate({ id: r.reservationId })}
                          disabled={deleteMutation.isPending}
                          title="Remove slot"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-7 text-xs text-muted-foreground hover:text-foreground gap-1 mt-1"
                    onClick={() => { setForm(f => ({ ...f, day })); setShowDialog(true); }}
                    disabled={!profile}
                  >
                    <Plus className="w-3 h-3" /> Add slot
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add slot dialog */}
      <Dialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reserve Clinic Slot</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Clinic</Label>
              {clinics.length === 0 && profile ? (
                <div className="rounded-md border border-dashed px-4 py-3 text-sm text-muted-foreground">
                  No <span className="font-medium text-foreground">{profile.specialty}</span> clinics have been created yet. Ask an admin to add one first.
                </div>
              ) : (
                <Select value={form.clinicId} onValueChange={(v) => setForm((f) => ({ ...f, clinicId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select clinic..." /></SelectTrigger>
                  <SelectContent>
                    {clinics.map((c: any) => (
                      <SelectItem key={c.clinicId} value={String(c.clinicId)}>
                        {c.type} · Clinic #{c.clinicId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {profile && clinics.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Showing only <span className="font-medium">{profile.specialty}</span> clinics matching your specialty.
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Day of Week</Label>
              <Select value={form.day} onValueChange={(v) => setForm((f) => ({ ...f, day: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DAYS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={form.startHour}
                  onChange={(e) => setForm((f) => ({ ...f, startHour: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={form.endHour}
                  onChange={(e) => setForm((f) => ({ ...f, endHour: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Max Patients</Label>
              <Input
                type="number"
                min="1"
                value={form.maxPatients}
                onChange={(e) => setForm((f) => ({ ...f, maxPatients: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setShowDialog(false)} disabled={createMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={createMutation.isPending || !form.clinicId}>
              {createMutation.isPending ? "Reserving…" : "Reserve Slot"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
