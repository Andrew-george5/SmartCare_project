import { useState } from "react";
import { useListDoctors, useCreateDoctor, useCreateUser, getListDoctorsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Stethoscope, AlertCircle } from "lucide-react";

const SPECIALTIES = ["Cardiology","Neurology","Orthopedics","Pediatrics","Dermatology","Oncology","Gynecology","Psychiatry","Radiology","General Surgery","Internal Medicine","Emergency Medicine"];

export default function DoctorsPage() {
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "doctor123", specialty: "Cardiology", licenseNumber: "", phoneNumber: "" });
  const [error, setError] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data: doctors, isLoading } = useListDoctors({ search: search || undefined, specialty: specialty || undefined });

  const createDoctorMutation = useCreateDoctor({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListDoctorsQueryKey() });
        setShowDialog(false);
        setError(null);
        setForm({ name: "", email: "", password: "doctor123", specialty: "Cardiology", licenseNumber: "", phoneNumber: "" });
      },
      onError: (err: any) => {
        setError(err?.message ?? "Failed to create doctor profile");
      }
    }
  });

  const createUserMutation = useCreateUser({
    mutation: {
      onSuccess: async (userData: any) => {
        await createDoctorMutation.mutateAsync({
          data: { userId: userData.userId, specialty: form.specialty, licenseNumber: form.licenseNumber }
        });
      },
      onError: (err: any) => {
        setError(err?.message ?? "Failed to create user account");
      }
    }
  });

  const handleCreate = () => {
    if (!form.name.trim()) { setError("Full name is required"); return; }
    if (!form.email.trim()) { setError("Email is required"); return; }
    if (!form.licenseNumber.trim()) { setError("License number is required"); return; }
    setError(null);
    createUserMutation.mutate({ data: { name: form.name, email: form.email, password: form.password, role: "DOCTOR", phoneNumber: form.phoneNumber || undefined } });
  };

  const isPending = createUserMutation.isPending || createDoctorMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Doctors</h1>
          <p className="text-muted-foreground">Manage medical staff</p>
        </div>
        <Button onClick={() => { setShowDialog(true); setError(null); }} className="gap-2">
          <Plus className="w-4 h-4" /> Add Doctor
        </Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search doctors..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <select
          value={specialty}
          onChange={e => setSpecialty(e.target.value)}
          className="border rounded-md px-3 text-sm bg-background text-foreground"
        >
          <option value="">All Specialties</option>
          {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading && Array(6).fill(0).map((_, i) => (
          <Card key={i}><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
        ))}
        {!isLoading && (doctors ?? []).length === 0 && (
          <div className="col-span-3 text-center py-12 text-muted-foreground">No doctors found</div>
        )}
        {(doctors ?? []).map((d: any) => (
          <Card key={d.doctorId} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-lg shrink-0">
                  {d.name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{d.name}</p>
                  <p className="text-sm text-muted-foreground truncate">{d.email}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                      <Stethoscope className="w-3 h-3 mr-1" />{d.specialty}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">License: {d.licenseNumber}</p>
                  {d.phoneNumber && <p className="text-xs text-muted-foreground">{d.phoneNumber}</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showDialog} onOpenChange={open => { setShowDialog(open); if (!open) setError(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add New Doctor</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            {error && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Full Name <span className="text-destructive">*</span></Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Dr. Jane Smith" />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Email <span className="text-destructive">*</span></Label>
                <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="doctor@hospital.com" />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Password</Label>
                <Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 6 characters" />
              </div>
              <div className="space-y-2">
                <Label>Specialty</Label>
                <select
                  value={form.specialty}
                  onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                >
                  {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>License Number <span className="text-destructive">*</span></Label>
                <Input value={form.licenseNumber} onChange={e => setForm(f => ({ ...f, licenseNumber: e.target.value }))} placeholder="LIC-12345" />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Phone Number</Label>
                <Input type="tel" value={form.phoneNumber} onChange={e => setForm(f => ({ ...f, phoneNumber: e.target.value }))} placeholder="+1 555 000 0000" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} disabled={isPending}>Cancel</Button>
            <Button onClick={handleCreate} disabled={isPending}>
              {isPending ? "Creating..." : "Create Doctor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}