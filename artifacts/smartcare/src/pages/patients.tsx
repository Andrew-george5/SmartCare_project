import { useState } from "react";
import {
  useListPatients, useCreatePatient, useCreateUser, useGetDoctorMe,
  getListPatientsQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Search, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function PatientsPage() {
  const { role } = useAuth();
  const isDoctor = role === "DOCTOR";
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "patient123", dateOfBirth: "", gender: "MALE", address: "", bloodType: "", phoneNumber: "" });
  const [error, setError] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data: doctorMe } = useGetDoctorMe({ query: { enabled: isDoctor } });
  const doctorId = isDoctor ? (doctorMe as any)?.doctorId : undefined;

  const { data: patients, isLoading } = useListPatients({
    search: search || undefined,
    doctorId: doctorId,
  });

  const createPatientMutation = useCreatePatient({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListPatientsQueryKey() });
        setShowDialog(false);
        setError(null);
        setForm({ name: "", email: "", password: "patient123", dateOfBirth: "", gender: "MALE", address: "", bloodType: "", phoneNumber: "" });
      },
      onError: (err: any) => {
        setError(err?.message ?? "Failed to create patient profile");
      }
    }
  });

  const createUserMutation = useCreateUser({
    mutation: {
      onSuccess: async (userData: any) => {
        await createPatientMutation.mutateAsync({
          data: {
            userId: userData.userId,
            dateOfBirth: form.dateOfBirth,
            gender: form.gender,
            address: form.address || undefined,
            bloodType: form.bloodType || undefined,
          }
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
    if (!form.dateOfBirth) { setError("Date of birth is required"); return; }
    setError(null);
    createUserMutation.mutate({
      data: { name: form.name, email: form.email, password: form.password, role: "PATIENT", phoneNumber: form.phoneNumber || undefined }
    });
  };

  const isPending = createUserMutation.isPending || createPatientMutation.isPending;

  const filtered = (patients ?? []).filter((p: any) =>
    !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Patients</h1>
          <p className="text-muted-foreground">
            {isDoctor ? "Patients you have treated" : "Manage patient records"}
          </p>
        </div>
        {!isDoctor && (
          <Button onClick={() => { setShowDialog(true); setError(null); }} className="gap-2">
            <Plus className="w-4 h-4" /> Add Patient
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search patients by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto overflow-y-auto max-h-[560px]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-4 font-medium">Name</th>
                  <th className="text-left p-4 font-medium">Email</th>
                  <th className="text-left p-4 font-medium">Gender</th>
                  <th className="text-left p-4 font-medium">Date of Birth</th>
                  <th className="text-left p-4 font-medium">Blood Type</th>
                  <th className="text-left p-4 font-medium">Phone</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="border-b"><td colSpan={6} className="p-4"><Skeleton className="h-4 w-full" /></td></tr>
                ))}
                {!isLoading && filtered.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">
                    {isDoctor ? "No patients found for your appointments" : "No patients found"}
                  </td></tr>
                )}
                {filtered.map((p: any) => (
                  <tr key={p.patientId} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold">
                          {p.name?.charAt(0)}
                        </div>
                        <span className="font-medium">{p.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground">{p.email}</td>
                    <td className="p-4"><Badge variant="outline">{p.gender}</Badge></td>
                    <td className="p-4 text-muted-foreground">{p.dateOfBirth ?? "—"}</td>
                    <td className="p-4"><Badge variant="secondary">{p.bloodType || "—"}</Badge></td>
                    <td className="p-4 text-muted-foreground">{p.phoneNumber || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {!isDoctor && (
        <Dialog open={showDialog} onOpenChange={open => { setShowDialog(open); if (!open) setError(null); }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Patient</DialogTitle>
            </DialogHeader>
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
                  <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="John Doe" />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Email <span className="text-destructive">*</span></Label>
                  <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="patient@email.com" />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Password</Label>
                  <Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 6 characters" />
                </div>
                <div className="space-y-2">
                  <Label>Date of Birth <span className="text-destructive">*</span></Label>
                  <Input type="date" value={form.dateOfBirth} onChange={e => setForm(f => ({ ...f, dateOfBirth: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select value={form.gender} onValueChange={v => setForm(f => ({ ...f, gender: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Blood Type</Label>
                  <Select value={form.bloodType} onValueChange={v => setForm(f => ({ ...f, bloodType: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {["A+","A-","B+","B-","O+","O-","AB+","AB-"].map(bt => (
                        <SelectItem key={bt} value={bt}>{bt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="123 Main St" />
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
                {isPending ? "Creating..." : "Create Patient"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}