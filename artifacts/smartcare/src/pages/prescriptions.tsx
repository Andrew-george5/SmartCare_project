import { useState } from "react";
import {
  useListPrescriptions,
  useCreatePrescription,
  useListDrugs,
  useListMedicalRecords,
  getListPrescriptionsQueryKey,
  useGetDoctorMe,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pill, Trash2, Info, CheckCircle2, TrendingUp, Building2, ChevronsUpDown, Check } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export default function PrescriptionsPage() {
  const { role, token } = useAuth();
  const { toast } = useToast();
  const isDoctor = role === "DOCTOR";
  const isPatient = role === "PATIENT";

  // ── dialog state ─────────────────────────────────────────────────────────
  const [showDialog, setShowDialog] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState("");
  const [form, setForm] = useState({
    issueDate: new Date().toISOString().split("T")[0],
    consultationFee: "",
    drugs: [{ drugId: "", dosage: "", frequency: "", duration: "" }],
  });
  // track which drug-row combobox is open (by index, or null for none)
  const [openDrugIdx, setOpenDrugIdx] = useState<number | null>(null);
  const [openRecordCombo, setOpenRecordCombo] = useState(false);

  const qc = useQueryClient();

  // ── platform fee setting ──────────────────────────────────────────────────
  const { data: platformSettings } = useQuery({
    queryKey: ["/api/settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to load settings");
      return res.json() as Promise<{ feePercent: number }>;
    },
    enabled: isDoctor && !!token,
    staleTime: 60000,
  });
  const feePercent = platformSettings?.feePercent ?? 10;

  // ── current user's profile ────────────────────────────────────────────────
  const { data: doctorMe } = useGetDoctorMe({
    query: { queryKey: ["doctors", "me"], enabled: isDoctor },
  });
  const doctorId = isDoctor ? (doctorMe as any)?.doctorId : undefined;

  // For patients, fetch /patients/me to get their patientId
  const { data: patientMe } = useQuery({
    queryKey: ["patients", "me"],
    queryFn: async () => {
      const res = await fetch("/api/patients/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load patient profile");
      return res.json();
    },
    enabled: isPatient && !!token,
    staleTime: 60000,
  });
  const patientId = isPatient ? (patientMe as any)?.patientId : undefined;

  // ── data ─────────────────────────────────────────────────────────────────
  const { data: prescriptions, isLoading } = useListPrescriptions(
    isDoctor
      ? { doctorId }
      : isPatient
        ? { patientId }
        : {},
    { query: { enabled: isDoctor ? !!doctorId : isPatient ? !!patientId : true } },
  );
  const prescriptionList = (prescriptions ?? []) as any[];

  const { data: drugsData } = useListDrugs();
  const drugs = (drugsData ?? []) as any[];

  const { data: records } = useListMedicalRecords(
    { doctorId: isDoctor ? doctorId : undefined },
    { query: { enabled: isDoctor ? !!doctorId : true } },
  );
  const allRecords = (records ?? []) as any[];

  // Records that don't yet have a prescription
  const recordsWithoutPrescription = allRecords.filter(
    (r: any) => !prescriptionList.some((p: any) => p.recordId === r.recordId),
  );

  const selectedRecord = allRecords.find(
    (r: any) => String(r.recordId) === selectedRecordId,
  ) ?? null;

  // ── mutation ──────────────────────────────────────────────────────────────
  const createMutation = useCreatePrescription({
    mutation: {
      onSuccess: (data: any) => {
        qc.invalidateQueries({ queryKey: getListPrescriptionsQueryKey() });
        qc.invalidateQueries({ queryKey: ["prescriptions"] });
        qc.invalidateQueries({ queryKey: ["dashboard", "stats"] });
        qc.invalidateQueries({ queryKey: ["/api/invoices"] });
        resetDialog();
        const hasFee = !!form.consultationFee && Number(form.consultationFee) > 0;
        toast({
          title: "Prescription saved",
          description: hasFee
            ? `Invoice of $${Number(form.consultationFee).toFixed(2)} automatically created for the patient.`
            : "Prescription created successfully.",
        });
      },
      onError: (err: any) => {
        toast({
          title: err?.message ?? "Failed to save prescription",
          variant: "destructive",
        });
      },
    },
  });

  // ── helpers ───────────────────────────────────────────────────────────────
  function resetDialog() {
    setShowDialog(false);
    setSelectedRecordId("");
    setForm({
      issueDate: new Date().toISOString().split("T")[0],
      consultationFee: "",
      drugs: [{ drugId: "", dosage: "", frequency: "", duration: "" }],
    });
  }

  const addDrug = () =>
    setForm((f) => ({
      ...f,
      drugs: [...f.drugs, { drugId: "", dosage: "", frequency: "", duration: "" }],
    }));

  const removeDrug = (i: number) =>
    setForm((f) => ({ ...f, drugs: f.drugs.filter((_, idx) => idx !== i) }));

  const updateDrug = (i: number, field: string, value: string) =>
    setForm((f) => ({
      ...f,
      drugs: f.drugs.map((d, idx) => (idx === i ? { ...d, [field]: value } : d)),
    }));

  const canSave =
    !!selectedRecordId &&
    !!selectedRecord &&
    !!form.issueDate &&
    form.drugs.some((d) => d.drugId && d.dosage && d.frequency);

  function handleSavePrescription() {
    if (!selectedRecord) return;
    createMutation.mutate({
      data: {
        recordId: selectedRecord.recordId,
        issueDate: form.issueDate,
        ...(form.consultationFee && Number(form.consultationFee) > 0
          ? { consultationFee: Number(form.consultationFee) }
          : {}),
        drugs: form.drugs
          .filter((d) => d.drugId)
          .map((d) => ({
            drugId: Number(d.drugId),
            dosage: d.dosage,
            frequency: d.frequency,
            duration: d.duration || undefined,
          })),
      } as any,
    });
  }

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Prescriptions</h1>
          <p className="text-muted-foreground">
            {isDoctor ? "Prescriptions you have issued" : "Your prescriptions"}
          </p>
        </div>
        {isDoctor && (
          <Button
            onClick={() => {
              resetDialog();
              setShowDialog(true);
            }}
            className="gap-2"
          >
            <Plus className="w-4 h-4" /> New Prescription
          </Button>
        )}
      </div>

      {/* List */}
      <div className="space-y-3">
        {isLoading &&
          Array(3)
            .fill(0)
            .map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            ))}
        {!isLoading && prescriptionList.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Pill className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No prescriptions found</p>
            {isDoctor && (
              <p className="text-sm mt-1">Create one using the button above.</p>
            )}
          </div>
        )}
        {prescriptionList.map((p: any) => (
          <Card key={p.prescriptionId} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-semibold">{p.patientName}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground text-sm">
                      Dr. {p.doctorName}
                    </span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground text-sm">
                      {p.issueDate}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Record #{p.recordId}
                    {p.appointmentId ? ` · Appointment #${p.appointmentId}` : ""}
                  </p>
                </div>
                <Badge variant="outline">#{p.prescriptionId}</Badge>
              </div>

              <div className="space-y-2">
                {(p.drugs ?? []).map((d: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                  >
                    <Pill className="w-4 h-4 text-primary shrink-0" />
                    <div className="flex-1">
                      <span className="font-medium text-sm">{d.drugName}</span>
                      <div className="flex gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                        <span>Dosage: {d.dosage}</span>
                        <span>Frequency: {d.frequency}</span>
                        {d.duration && <span>Duration: {d.duration}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {p.appointmentId && isDoctor && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Invoice auto-created — patient will see it in Bills</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* New prescription dialog */}
      {isDoctor && (
        <Dialog open={showDialog} onOpenChange={(open) => { if (!open) resetDialog(); else setShowDialog(true); }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New Prescription</DialogTitle>
              <DialogDescription>
                Select a medical record, fill in the prescription details, and optionally set a consultation fee to auto-create an invoice for the patient.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Medical record selector */}
              <div className="space-y-2">
                <Label>
                  Medical Record <span className="text-destructive">*</span>
                </Label>
                {recordsWithoutPrescription.length === 0 ? (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      No medical records are available for prescribing. Create a medical
                      record for an appointment first, then return here.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Popover open={openRecordCombo} onOpenChange={setOpenRecordCombo}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                        <span className="truncate">
                          {selectedRecordId
                            ? (() => { const r = recordsWithoutPrescription.find((r: any) => String(r.recordId) === selectedRecordId); return r ? `#${r.recordId} — ${r.patientName}` : "Select a medical record…"; })()
                            : "Select a medical record…"}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-[--radix-popover-trigger-width]" align="start">
                      <Command>
                        <CommandInput placeholder="Search by patient or record…" />
                        <CommandList>
                          <CommandEmpty>No records found.</CommandEmpty>
                          <CommandGroup>
                            {recordsWithoutPrescription.map((r: any) => (
                              <CommandItem
                                key={r.recordId}
                                value={`${r.patientName} ${r.recordId} ${r.visitDate}`}
                                onSelect={() => { setSelectedRecordId(String(r.recordId)); setOpenRecordCombo(false); }}
                              >
                                <Check className={`mr-2 h-4 w-4 ${selectedRecordId === String(r.recordId) ? "opacity-100" : "opacity-0"}`} />
                                #{r.recordId} — {r.patientName}
                                {r.appointmentId ? ` (Appt #${r.appointmentId})` : ""} · {r.visitDate}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
                <p className="text-xs text-muted-foreground">
                  Only medical records without an existing prescription are shown.
                </p>
              </div>

              {/* Selected record summary */}
              {selectedRecord && (
                <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
                  <p className="font-medium">
                    Record #{selectedRecord.recordId} — {selectedRecord.patientName}
                  </p>
                  <p className="text-muted-foreground">
                    Diagnosis: {selectedRecord.diagnosis}
                  </p>
                  {selectedRecord.notes && (
                    <p className="text-muted-foreground">Notes: {selectedRecord.notes}</p>
                  )}
                </div>
              )}

              {/* Issue date */}
              <div className="space-y-2">
                <Label>Issue Date</Label>
                <Input
                  type="date"
                  value={form.issueDate}
                  onChange={(e) => setForm((f) => ({ ...f, issueDate: e.target.value }))}
                />
              </div>

              {/* Consultation fee — optional, auto-creates invoice */}
              <div className="space-y-2">
                <Label>
                  Consultation Fee (USD){" "}
                  <span className="text-muted-foreground font-normal text-xs">(optional — auto-creates invoice)</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                    $
                  </span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-7"
                    value={form.consultationFee}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, consultationFee: e.target.value }))
                    }
                  />
                </div>
                {form.consultationFee && Number(form.consultationFee) > 0 && (() => {
                  const total = Number(form.consultationFee);
                  const fee = parseFloat((total * feePercent / 100).toFixed(2));
                  const net = parseFloat((total - fee).toFixed(2));
                  return (
                    <div className="rounded-lg border bg-muted/40 px-4 py-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Patient pays</span>
                        <span className="font-semibold text-foreground">${total.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Building2 className="w-3 h-3" /> Platform fee ({feePercent}%)
                        </span>
                        <span className="font-medium text-red-500">−${fee.toFixed(2)}</span>
                      </div>
                      <div className="border-t pt-2 flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1 font-medium text-foreground">
                          <TrendingUp className="w-3 h-3 text-emerald-600" /> You receive
                        </span>
                        <span className="font-bold text-emerald-600">${net.toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Drugs */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>
                    Drugs <span className="text-destructive">*</span>
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addDrug}
                    className="gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Drug
                  </Button>
                </div>
                {form.drugs.map((drug, i) => (
                  <div key={i} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Drug {i + 1}</p>
                      {form.drugs.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-destructive"
                          onClick={() => removeDrug(i)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2 space-y-1">
                        <Label className="text-xs">Drug Name</Label>
                        <Popover
                          open={openDrugIdx === i}
                          onOpenChange={(open) => setOpenDrugIdx(open ? i : null)}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className="w-full justify-between font-normal h-9 text-sm"
                            >
                              <span className="truncate">
                                {drug.drugId
                                  ? drugs.find((d: any) => String(d.drugId) === drug.drugId)?.drugName
                                  : drugs.length === 0 ? "No drugs in system" : "Select drug…"}
                              </span>
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="p-0 w-[--radix-popover-trigger-width]" align="start">
                            <Command>
                              <CommandInput placeholder="Search drug…" />
                              <CommandList>
                                <CommandEmpty>No drug found.</CommandEmpty>
                                <CommandGroup>
                                  {drugs.map((d: any) => (
                                    <CommandItem
                                      key={d.drugId}
                                      value={d.drugName}
                                      onSelect={() => {
                                        updateDrug(i, "drugId", String(d.drugId));
                                        setOpenDrugIdx(null);
                                      }}
                                    >
                                      <Check
                                        className={`mr-2 h-4 w-4 ${drug.drugId === String(d.drugId) ? "opacity-100" : "opacity-0"}`}
                                      />
                                      {d.drugName}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Dosage</Label>
                        <Input
                          value={drug.dosage}
                          onChange={(e) => updateDrug(i, "dosage", e.target.value)}
                          placeholder="e.g. 500mg"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Frequency</Label>
                        <Input
                          value={drug.frequency}
                          onChange={(e) => updateDrug(i, "frequency", e.target.value)}
                          placeholder="e.g. Twice daily"
                        />
                      </div>
                      <div className="col-span-2 space-y-1">
                        <Label className="text-xs">Duration (optional)</Label>
                        <Input
                          value={drug.duration}
                          onChange={(e) => updateDrug(i, "duration", e.target.value)}
                          placeholder="e.g. 7 days"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={resetDialog}>
                Cancel
              </Button>
              <Button
                onClick={handleSavePrescription}
                disabled={createMutation.isPending || !canSave}
              >
                {createMutation.isPending ? "Saving…" : "Save Prescription"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
