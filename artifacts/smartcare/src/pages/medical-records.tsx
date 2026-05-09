import { useState } from "react";
import {
  useListMedicalRecords, useCreateMedicalRecord, useUpdateMedicalRecord,
  useListPatients, useListAppointments,
  getListMedicalRecordsQueryKey, useGetDoctorMe
} from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, FileText, Stethoscope, CalendarDays, ClipboardList, StickyNote, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "@/lib/auth";

/* ─────────────────────────────────────────
   Patient read-only view
───────────────────────────────────────── */
function PatientMedicalRecords() {
  const { token } = useAuth();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: patientMe, isLoading: patientLoading } = useQuery({
    queryKey: ["/api/patients/me"],
    queryFn: async () => {
      const res = await fetch("/api/patients/me", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to load patient profile");
      return res.json() as Promise<any>;
    },
    enabled: !!token,
  });

  const { data: records, isLoading: recordsLoading } = useListMedicalRecords({
    patientId: patientMe?.patientId,
  }, { query: { enabled: !!patientMe?.patientId } } as any);

  const isLoading = patientLoading || recordsLoading;
  const sorted = [...(records ?? [])].sort((a: any, b: any) =>
    new Date(b.visitDate ?? 0).getTime() - new Date(a.visitDate ?? 0).getTime()
  );

  // Group by year
  const byYear: Record<string, any[]> = {};
  sorted.forEach((r: any) => {
    const year = r.visitDate ? r.visitDate.slice(0, 4) : "Unknown";
    if (!byYear[year]) byYear[year] = [];
    byYear[year].push(r);
  });
  const years = Object.keys(byYear).sort((a, b) => Number(b) - Number(a));

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">My Medical Records</h1>
        <p className="text-muted-foreground">Your full visit history, diagnoses, and doctor notes</p>
      </div>

      {/* Summary strip */}
      {!isLoading && (
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Records</p>
                <p className="text-2xl font-bold">{sorted.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Last Visit</p>
                <p className="text-sm font-semibold mt-0.5">
                  {sorted[0]?.visitDate
                    ? new Date(sorted[0].visitDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                    : "—"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Records */}
      {isLoading && (
        <div className="space-y-3">
          {Array(3).fill(0).map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-24 w-full" /></CardContent></Card>
          ))}
        </div>
      )}

      {!isLoading && sorted.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="font-medium text-muted-foreground">No medical records yet</p>
            <p className="text-sm text-muted-foreground mt-1">Records will appear here after your doctor creates them following a visit</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && years.map(year => (
        <div key={year} className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs font-semibold px-2">{year}</Badge>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="space-y-3">
            {byYear[year].map((r: any) => {
              const expanded = expandedId === r.recordId;
              return (
                <Card key={r.recordId} className="overflow-hidden transition-shadow hover:shadow-md">
                  <CardHeader className="pb-3 pt-4 px-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Stethoscope className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-sm font-semibold leading-snug">
                            Dr. {r.doctorName}
                          </CardTitle>
                          <CardDescription className="text-xs mt-0.5 flex items-center gap-1">
                            <CalendarDays className="w-3 h-3" />
                            {r.visitDate
                              ? new Date(r.visitDate).toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" })
                              : "—"}
                          </CardDescription>
                        </div>
                      </div>
                      <button
                        onClick={() => setExpandedId(expanded ? null : r.recordId)}
                        className="text-muted-foreground hover:text-foreground transition-colors p-1 shrink-0"
                        aria-label={expanded ? "Collapse" : "Expand"}
                      >
                        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </CardHeader>

                  <CardContent className="px-5 pb-4 space-y-3">
                    {/* Diagnosis — always visible */}
                    <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3">
                      <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1 flex items-center gap-1">
                        <ClipboardList className="w-3 h-3" /> Diagnosis
                      </p>
                      <p className="text-sm text-blue-900">{r.diagnosis}</p>
                    </div>

                    {/* Notes & meta — expanded only */}
                    {expanded && (
                      <>
                        {r.notes && (
                          <div className="rounded-lg bg-muted/50 border px-4 py-3">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1">
                              <StickyNote className="w-3 h-3" /> Doctor's Notes
                            </p>
                            <p className="text-sm text-foreground whitespace-pre-wrap">{r.notes}</p>
                          </div>
                        )}
                        <div className="flex gap-4 text-xs text-muted-foreground pt-1">
                          <span>Record #{r.recordId}</span>
                          {r.appointmentId && <span>Appointment #{r.appointmentId}</span>}
                        </div>
                      </>
                    )}

                    {!expanded && r.notes && (
                      <button
                        onClick={() => setExpandedId(r.recordId)}
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        <StickyNote className="w-3 h-3" /> View doctor's notes
                      </button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────
   Admin / Doctor view (unchanged)
───────────────────────────────────────── */
function StaffMedicalRecords() {
  const { role } = useAuth();
  const isDoctor = role === "DOCTOR";
  const isAdmin = role === "ADMIN";
  const [showDialog, setShowDialog] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [selectedPatient, setSelectedPatient] = useState("all");
  const [form, setForm] = useState({ patientId: "", appointmentId: "", visitDate: "", diagnosis: "", notes: "" });
  const qc = useQueryClient();

  const { data: doctorMe } = useGetDoctorMe({ query: { queryKey: ["doctors", "me"], enabled: isDoctor } });
  const doctorId = isDoctor ? (doctorMe as any)?.doctorId : undefined;

  const { data: records, isLoading } = useListMedicalRecords({
    patientId: (selectedPatient && selectedPatient !== "all") ? Number(selectedPatient) : undefined,
    doctorId: doctorId,
  });

  const { data: patients } = useListPatients({ doctorId: isDoctor ? doctorId : undefined });
  const { data: appointments } = useListAppointments({ doctorId: isDoctor ? doctorId : undefined });

  const createMutation = useCreateMedicalRecord({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListMedicalRecordsQueryKey() });
        setShowDialog(false);
        setEditingRecord(null);
        setForm({ patientId: "", appointmentId: "", visitDate: "", diagnosis: "", notes: "" });
      }
    }
  });

  const updateMutation = useUpdateMedicalRecord({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListMedicalRecordsQueryKey() });
        setShowDialog(false);
        setEditingRecord(null);
        setForm({ patientId: "", appointmentId: "", visitDate: "", diagnosis: "", notes: "" });
      }
    }
  });

  const handleAppointmentSelect = (apptId: string) => {
    const appt = (appointments ?? []).find((a: any) => String(a.appointmentId) === apptId);
    if (appt) {
      setForm(f => ({ ...f, appointmentId: apptId, patientId: String((appt as any).patientId), visitDate: appt.dateTime ? new Date(appt.dateTime).toISOString().split("T")[0] : f.visitDate }));
    } else {
      setForm(f => ({ ...f, appointmentId: apptId }));
    }
  };

  const completedAppointments = (appointments ?? []).filter((a: any) => a.status === "CONFIRMED" || a.status === "COMPLETED");
  const availableAppointments = completedAppointments.filter((a: any) => !(records ?? []).some((r: any) => String(r.appointmentId) === String(a.appointmentId)));

  const openNew = () => {
    setEditingRecord(null);
    setForm({ patientId: "", appointmentId: "", visitDate: "", diagnosis: "", notes: "" });
    setShowDialog(true);
  };

  const openEdit = (r: any) => {
    setEditingRecord(r);
    setForm({
      patientId: String(r.patientId ?? ""),
      appointmentId: String(r.appointmentId ?? ""),
      visitDate: r.visitDate ?? "",
      diagnosis: r.diagnosis ?? "",
      notes: r.notes ?? "",
    });
    setShowDialog(true);
  };

  const handleSubmit = () => {
    if (editingRecord) {
      updateMutation.mutate({ id: editingRecord.recordId, data: { diagnosis: form.diagnosis, notes: form.notes } as any });
    } else {
      if (!form.appointmentId) return;
      createMutation.mutate({
        data: {
          patientId: Number(form.patientId),
          doctorId: doctorId,
          appointmentId: Number(form.appointmentId),
          visitDate: form.visitDate,
          diagnosis: form.diagnosis,
          notes: form.notes || undefined,
        } as any
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Medical Records</h1>
          <p className="text-muted-foreground">{isDoctor ? "Records from your patients" : "Patient medical history and records"}</p>
        </div>
        {isDoctor && <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" /> New Record</Button>}
      </div>

      <div className="flex gap-3">
        <div className="w-64">
          <Select value={selectedPatient} onValueChange={setSelectedPatient}>
            <SelectTrigger><SelectValue placeholder="Filter by patient..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Patients</SelectItem>
              {(patients ?? []).map((p: any) => (
                <SelectItem key={p.patientId} value={String(p.patientId)}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {isLoading && Array(3).fill(0).map((_, i) => (
          <Card key={i}><CardContent className="p-6"><Skeleton className="h-24 w-full" /></CardContent></Card>
        ))}
        {!isLoading && (records ?? []).length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No medical records found</p>
          </div>
        )}
        {(records ?? []).map((r: any) => (
          <Card key={r.recordId} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="font-semibold">{r.patientName}</span>
                    {isAdmin && (
                      <>
                        <span className="text-muted-foreground text-sm">•</span>
                        <span className="text-muted-foreground text-sm">Dr. {r.doctorName}</span>
                      </>
                    )}
                    <span className="text-muted-foreground text-sm">•</span>
                    <span className="text-muted-foreground text-sm">{r.visitDate}</span>
                  </div>
                  <p className="font-medium text-sm mb-1">Diagnosis:</p>
                  <p className="text-muted-foreground text-sm">{r.diagnosis}</p>
                  {r.notes && (
                    <>
                      <p className="font-medium text-sm mt-2 mb-1">Notes:</p>
                      <p className="text-muted-foreground text-sm">{r.notes}</p>
                    </>
                  )}
                </div>
                <div className="text-xs text-muted-foreground text-right shrink-0">
                  <p>Record #{r.recordId}</p>
                  {r.appointmentId && <p>Appt #{r.appointmentId}</p>}
                </div>
              </div>
              {isDoctor && (
                <div className="mt-4 flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => openEdit(r)}>Edit</Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {isDoctor && (
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingRecord ? "Edit Medical Record" : "New Medical Record"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {!editingRecord && (
                <div className="space-y-2">
                  <Label>Appointment <span className="text-destructive">*</span></Label>
                  <Select value={form.appointmentId} onValueChange={handleAppointmentSelect}>
                    <SelectTrigger><SelectValue placeholder="Select appointment..." /></SelectTrigger>
                    <SelectContent>
                      {availableAppointments.map((a: any) => (
                        <SelectItem key={a.appointmentId} value={String(a.appointmentId)}>
                          #{a.appointmentId} — {a.patientName} ({new Date(a.dateTime).toLocaleDateString()})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>Patient</Label>
                <Input
                  value={form.patientId
                    ? ((patients ?? []).find((p: any) => String(p.patientId) === form.patientId) as any)?.name ?? form.patientId
                    : "Auto-filled from appointment"}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label>Visit Date</Label>
                <Input
                  type="date"
                  value={form.visitDate}
                  onChange={e => setForm(f => ({ ...f, visitDate: e.target.value }))}
                  disabled={!!editingRecord}
                />
              </div>
              <div className="space-y-2">
                <Label>Diagnosis <span className="text-destructive">*</span></Label>
                <Textarea
                  value={form.diagnosis}
                  onChange={e => setForm(f => ({ ...f, diagnosis: e.target.value }))}
                  placeholder="Enter diagnosis..."
                />
              </div>
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Additional notes..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)} disabled={isPending}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={isPending || (!editingRecord && !form.appointmentId) || !form.diagnosis}>
                {isPending ? "Saving..." : editingRecord ? "Save Changes" : "Create Record"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   Root export — branches by role
───────────────────────────────────────── */
export default function MedicalRecordsPage() {
  const { role } = useAuth();
  if (role === "PATIENT") return <PatientMedicalRecords />;
  return <StaffMedicalRecords />;
}
