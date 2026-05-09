import { useState, useEffect } from "react";
import {
  useListAppointments,
  useCreateAppointment,
  useUpdateAppointment,
  useCancelAppointment,
  useListDoctors,
  getListAppointmentsQueryKey,
  useGetDoctorMe,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import {
  Plus,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Stethoscope,
  StickyNote,
  Search,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const DAY_ORDER = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];
const DAY_JS: Record<string, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

function getNextDateForDay(dayName: string): string {
  const target = DAY_JS[dayName];
  const now = new Date();
  const diff = (target - now.getDay() + 7) % 7 || 7;
  const next = new Date(now);
  next.setDate(now.getDate() + diff);
  return next.toISOString().split("T")[0];
}

function isDateOnDay(dateStr: string, dayName: string): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr + "T00:00:00");
  return d.getDay() === DAY_JS[dayName];
}

export default function AppointmentsPage() {
  const { role, token } = useAuth();
  const isDoctor = role === "DOCTOR";
  const isPatient = role === "PATIENT";
  const isAdmin = role === "ADMIN";
  const [status, setStatus] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Patient booking state
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [notes, setNotes] = useState("");

  // Admin booking state (simple form)
  const [adminForm, setAdminForm] = useState({
    patientId: "",
    doctorId: "",
    dateTime: "",
    notes: "",
  });

  const [adminPatientSearch, setAdminPatientSearch] = useState("");
  const [adminDoctorSearch, setAdminDoctorSearch] = useState("");
  const [adminSelectedPatient, setAdminSelectedPatient] = useState<any>(null);
  const [adminSelectedDoctor, setAdminSelectedDoctor] = useState<any>(null);
  const [adminSelectedSlot, setAdminSelectedSlot] = useState<any>(null);
  const [adminSelectedDate, setAdminSelectedDate] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  // Doctor notes viewer
  const [viewingAppointment, setViewingAppointment] = useState<any>(null);

  const qc = useQueryClient();

  const { data: doctorMe } = useGetDoctorMe({ query: { enabled: isDoctor } });
  const doctorId = isDoctor ? (doctorMe as any)?.doctorId : undefined;

  const { data: patientMe } = useQuery({
    queryKey: ["/api/patients/me"],
    queryFn: async () => {
      const res = await fetch("/api/patients/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load patient profile");
      return res.json();
    },
    enabled: isPatient,
  });
  const patientId = isPatient ? (patientMe as any)?.patientId : undefined;

  const { data: appointments, isLoading } = useListAppointments({
    status: status || undefined,
    doctorId: doctorId,
    patientId: isPatient ? patientId : undefined,
  });

  const { data: doctors } = useListDoctors({});

  // Fetch clinic reservations for selected doctor (patient flow)
  const { data: doctorSlots, isLoading: slotsLoading } = useQuery({
    queryKey: ["/api/clinic-reservations", selectedDoctorId],
    queryFn: async () => {
      const res = await fetch(
        `/api/clinic-reservations?doctorId=${selectedDoctorId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) throw new Error("Failed to load schedule");
      return res.json() as Promise<any[]>;
    },
    enabled: isPatient && !!selectedDoctorId,
  });

  const { data: allPatients } = useQuery({
    queryKey: ["/api/patients"],
    queryFn: async () => {
      const res = await fetch("/api/patients", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load patients");
      return res.json();
    },
    enabled: isAdmin,
  });

  const { data: adminDoctorSlots, isLoading: adminSlotsLoading } = useQuery({
    queryKey: ["/api/clinic-reservations", adminSelectedDoctor?.doctorId],
    queryFn: async () => {
      const res = await fetch(
        `/api/clinic-reservations?doctorId=${adminSelectedDoctor.doctorId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) throw new Error("Failed to load schedule");
      return res.json() as Promise<any[]>;
    },
    enabled: isAdmin && !!adminSelectedDoctor?.doctorId,
  });

  // When doctor changes, reset slot/date selection
  useEffect(() => {
    setSelectedSlot(null);
    setSelectedDate("");
  }, [selectedDoctorId]);

  // When slot changes, auto-set the next valid date
  useEffect(() => {
    if (selectedSlot) {
      setSelectedDate(getNextDateForDay(selectedSlot.day));
    }
  }, [selectedSlot]);

  const createMutation = useCreateAppointment({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListAppointmentsQueryKey() });
        setShowDialog(false);
        resetForm();
      },
      onError: (err: any) => {
        setError(err?.message ?? "Failed to book appointment");
      },
    },
  });

  const updateMutation = useUpdateAppointment();
  const cancelMutation = useCancelAppointment();

  function resetForm() {
    setSelectedDoctorId("");
    setSelectedSlot(null);
    setSelectedDate("");
    setNotes("");
    setAdminForm({ patientId: "", doctorId: "", dateTime: "", notes: "" });
    setAdminPatientSearch("");
    setAdminDoctorSearch("");
    setAdminSelectedPatient(null);
    setAdminSelectedDoctor(null);
    setAdminSelectedSlot(null);
    setAdminSelectedDate("");
    setAdminNotes("");
    setError(null);
  }

  function handlePatientBook() {
    if (!selectedDoctorId) {
      setError("Please select a doctor");
      return;
    }
    if (!selectedSlot) {
      setError("Please select a time slot");
      return;
    }
    if (!selectedDate) {
      setError("Please select a date");
      return;
    }
    if (!isDateOnDay(selectedDate, selectedSlot.day)) {
      setError(
        `The selected date must be a ${selectedSlot.day.charAt(0) + selectedSlot.day.slice(1).toLowerCase()}`,
      );
      return;
    }
    setError(null);
    const dateTime = new Date(
      `${selectedDate}T${selectedSlot.startHour}:00`,
    ).toISOString();
    createMutation.mutate({
      data: {
        patientId: Number(patientId),
        doctorId: Number(selectedDoctorId),
        dateTime,
        notes: notes || undefined,
      } as any,
    });
  }

  function handleAdminBook() {
    if (!adminSelectedPatient) {
      setError("Please select a patient");
      return;
    }
    if (!adminSelectedDoctor) {
      setError("Please select a doctor");
      return;
    }
    if (!adminSelectedSlot) {
      setError("Please select a time slot");
      return;
    }
    if (!adminSelectedDate) {
      setError("Please select a date");
      return;
    }
    if (!isDateOnDay(adminSelectedDate, adminSelectedSlot.day)) {
      setError(
        `The selected date must be a ${adminSelectedSlot.day.charAt(0) + adminSelectedSlot.day.slice(1).toLowerCase()}`,
      );
      return;
    }
    setError(null);
    const dateTime = new Date(
      `${adminSelectedDate}T${adminSelectedSlot.startHour}:00`,
    ).toISOString();
    createMutation.mutate({
      data: {
        patientId: Number(adminSelectedPatient.patientId),
        doctorId: Number(adminSelectedDoctor.doctorId),
        dateTime,
        notes: adminNotes || undefined,
      } as any,
    });
  }

  function handleStatusChange(id: number, newStatus: string) {
    updateMutation.mutate(
      { id, data: { status: newStatus } as any },
      {
        onSuccess: () =>
          qc.invalidateQueries({ queryKey: getListAppointmentsQueryKey() }),
      },
    );
  }

  function handleCancel(id: number) {
    cancelMutation.mutate(
      { id },
      {
        onSuccess: () =>
          qc.invalidateQueries({ queryKey: getListAppointmentsQueryKey() }),
      },
    );
  }

  // Group slots by day for patient slot picker
  const slotsByDay: Record<string, any[]> = {};
  (doctorSlots ?? []).forEach((s: any) => {
    if (!slotsByDay[s.day]) slotsByDay[s.day] = [];
    slotsByDay[s.day].push(s);
  });
  const availableDays = DAY_ORDER.filter(
    (d) => (slotsByDay[d] ?? []).length > 0,
  );

  const adminSlotsByDay: Record<string, any[]> = {};
  (adminDoctorSlots ?? []).forEach((s: any) => {
    if (!adminSlotsByDay[s.day]) adminSlotsByDay[s.day] = [];
    adminSlotsByDay[s.day].push(s);
  });
  const adminAvailableDays = DAY_ORDER.filter(
    (d) => (adminSlotsByDay[d] ?? []).length > 0,
  );

  const filteredPatients = (allPatients ?? []).filter((p: any) => {
    const q = adminPatientSearch.toLowerCase();
    return (
      !q ||
      p.name?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q)
    );
  });

  const filteredDoctors = (doctors ?? []).filter((d: any) => {
    const q = adminDoctorSearch.toLowerCase();
    return (
      !q ||
      d.name?.toLowerCase().includes(q) ||
      d.email?.toLowerCase().includes(q)
    );
  });

  const colSpan = isDoctor ? 5 : isPatient ? 5 : 6;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Appointments</h1>
          <p className="text-muted-foreground">
            {isDoctor
              ? "Accept or decline incoming appointment requests"
              : isPatient
                ? "Book and track your appointments"
                : "View and manage all appointments"}
          </p>
        </div>
        {(isAdmin || isPatient) && (
          <Button
            onClick={() => {
              setShowDialog(true);
              resetForm();
            }}
            className="gap-2"
          >
            <Plus className="w-4 h-4" /> Book Appointment
          </Button>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {["", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"].map((s) => (
          <Button
            key={s}
            variant={status === s ? "default" : "outline"}
            size="sm"
            onClick={() => setStatus(s)}
          >
            {s || "All"}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-4 font-medium">Patient</th>
                  <th className="text-left p-4 font-medium">Doctor</th>
                  <th className="text-left p-4 font-medium">Specialty</th>
                  <th className="text-left p-4 font-medium">Date & Time</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading &&
                  Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <tr key={i} className="border-b">
                        <td colSpan={colSpan} className="p-4">
                          <Skeleton className="h-4 w-full" />
                        </td>
                      </tr>
                    ))}
                {!isLoading && (appointments ?? []).length === 0 && (
                  <tr>
                    <td
                      colSpan={colSpan}
                      className="p-8 text-center text-muted-foreground"
                    >
                      No appointments found
                    </td>
                  </tr>
                )}
                {(appointments ?? []).map((a: any) => (
                  <tr
                    key={a.appointmentId}
                    className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="p-4 font-medium">{a.patientName}</td>
                    <td className="p-4 text-muted-foreground">
                      Dr. {a.doctorName}
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {a.doctorSpecialty}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {a.dateTime
                          ? new Date(a.dateTime).toLocaleDateString()
                          : "—"}
                        <Clock className="w-3 h-3 ml-1" />
                        {a.dateTime
                          ? new Date(a.dateTime).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[a.status] ?? ""}`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        {isDoctor && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1"
                            onClick={() => setViewingAppointment(a)}
                          >
                            <StickyNote className="w-3 h-3" /> Notes
                          </Button>
                        )}
                        {isDoctor && a.status === "PENDING" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1 text-green-600 hover:text-green-700"
                              onClick={() =>
                                handleStatusChange(a.appointmentId, "CONFIRMED")
                              }
                            >
                              <CheckCircle className="w-3 h-3" /> Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
                              onClick={() =>
                                handleStatusChange(a.appointmentId, "CANCELLED")
                              }
                            >
                              <XCircle className="w-3 h-3" /> Decline
                            </Button>
                          </>
                        )}
                        {isAdmin && a.status === "PENDING" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1"
                            onClick={() =>
                              handleStatusChange(a.appointmentId, "CONFIRMED")
                            }
                          >
                            <CheckCircle className="w-3 h-3" /> Confirm
                          </Button>
                        )}
                        {isAdmin && a.status === "CONFIRMED" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1"
                            onClick={() =>
                              handleStatusChange(a.appointmentId, "COMPLETED")
                            }
                          >
                            <CheckCircle className="w-3 h-3" /> Complete
                          </Button>
                        )}
                        {isAdmin &&
                          (a.status === "PENDING" ||
                            a.status === "CONFIRMED") && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
                              onClick={() => handleCancel(a.appointmentId)}
                            >
                              <XCircle className="w-3 h-3" /> Cancel
                            </Button>
                          )}
                        {isPatient && a.status === "PENDING" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
                            onClick={() => handleCancel(a.appointmentId)}
                          >
                            <XCircle className="w-3 h-3" /> Cancel
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Booking dialog */}
      <Dialog
        open={showDialog}
        onOpenChange={(open) => {
          setShowDialog(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Book New Appointment</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {error && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {/* ── PATIENT BOOKING FLOW ── */}
            {isPatient && (
              <>
                {/* Step 1: Select Doctor */}
                <div className="space-y-1.5">
                  <Label>
                    Doctor <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={selectedDoctorId}
                    onValueChange={setSelectedDoctorId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a doctor..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(doctors ?? []).map((d: any) => (
                        <SelectItem key={d.doctorId} value={String(d.doctorId)}>
                          Dr. {d.name} — {d.specialty}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Step 2: Available Time Slots */}
                {selectedDoctorId && (
                  <div className="space-y-2">
                    <Label>
                      Available Time Slots{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    {slotsLoading && (
                      <div className="space-y-2">
                        <Skeleton className="h-14 w-full" />
                        <Skeleton className="h-14 w-full" />
                      </div>
                    )}
                    {!slotsLoading && availableDays.length === 0 && (
                      <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                        This doctor has no scheduled time slots yet.
                      </div>
                    )}
                    {!slotsLoading && availableDays.length > 0 && (
                      <div className="space-y-2">
                        {availableDays.map((day) => (
                          <div key={day}>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                              {day.charAt(0) + day.slice(1).toLowerCase()}s
                            </p>
                            <div className="space-y-1.5">
                              {slotsByDay[day].map((slot: any) => {
                                const isSelected =
                                  selectedSlot?.reservationId ===
                                  slot.reservationId;
                                return (
                                  <button
                                    key={slot.reservationId}
                                    type="button"
                                    onClick={() => setSelectedSlot(slot)}
                                    className={`w-full text-left rounded-lg border px-4 py-3 transition-all ${
                                      isSelected
                                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                                        : "border-border hover:border-primary/50 hover:bg-muted/40"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Stethoscope className="w-3.5 h-3.5 text-muted-foreground" />
                                        <span className="text-sm font-medium">
                                          {slot.clinicType}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                        <Clock className="w-3.5 h-3.5" />
                                        {slot.startHour} – {slot.endHour}
                                      </div>
                                    </div>
                                    {isSelected && (
                                      <div className="mt-1 flex items-center gap-1 text-xs text-primary font-medium">
                                        <CheckCircle className="w-3 h-3" />{" "}
                                        Selected
                                      </div>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Pick date (only valid days) */}
                {selectedSlot && (
                  <div className="space-y-1.5">
                    <Label>
                      Appointment Date{" "}
                      <span className="text-destructive">*</span>
                      <span className="ml-1 text-xs text-muted-foreground font-normal">
                        (must be a{" "}
                        {selectedSlot.day.charAt(0) +
                          selectedSlot.day.slice(1).toLowerCase()}
                        )
                      </span>
                    </Label>
                    <Input
                      type="date"
                      value={selectedDate}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />
                    {selectedDate &&
                      !isDateOnDay(selectedDate, selectedSlot.day) && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Please pick a{" "}
                          {selectedSlot.day.charAt(0) +
                            selectedSlot.day.slice(1).toLowerCase()}
                        </p>
                      )}
                    {selectedDate &&
                      isDateOnDay(selectedDate, selectedSlot.day) && (
                        <p className="text-xs text-emerald-600 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Appointment at {selectedSlot.startHour} on{" "}
                          {new Date(
                            selectedDate + "T00:00:00",
                          ).toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      )}
                  </div>
                )}

                {/* Notes */}
                {selectedSlot && (
                  <div className="space-y-1.5">
                    <Label>Notes (optional)</Label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Describe your symptoms or reason for visit..."
                      rows={3}
                    />
                  </div>
                )}

                {/* Booking summary */}
                {selectedSlot &&
                  selectedDate &&
                  isDateOnDay(selectedDate, selectedSlot.day) && (
                    <div className="rounded-lg bg-muted/50 border p-3 text-sm space-y-1">
                      <p className="font-semibold text-foreground">
                        Booking summary
                      </p>
                      <p className="text-muted-foreground">
                        Doctor: Dr.{" "}
                        {
                          (doctors ?? []).find(
                            (d: any) => String(d.doctorId) === selectedDoctorId,
                          )?.name
                        }
                      </p>
                      <p className="text-muted-foreground">
                        Date:{" "}
                        {new Date(
                          selectedDate + "T00:00:00",
                        ).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-muted-foreground">
                        Time: {selectedSlot.startHour}
                      </p>
                      <p className="text-muted-foreground">
                        Clinic: {selectedSlot.clinicType}
                      </p>
                      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 mt-1">
                        Pending doctor approval
                      </Badge>
                    </div>
                  )}
              </>
            )}

            {/* ── ADMIN BOOKING FLOW ── */}
            {isAdmin && (
              <>
                {/* Step 1: Search & select patient */}
                <div className="space-y-1.5">
                  <Label>
                    Patient <span className="text-destructive">*</span>
                  </Label>
                  {adminSelectedPatient ? (
                    <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2">
                      <div>
                        <p className="text-sm font-medium">
                          {adminSelectedPatient.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {adminSelectedPatient.email}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-muted-foreground"
                        onClick={() => {
                          setAdminSelectedPatient(null);
                          setAdminPatientSearch("");
                        }}
                      >
                        Change
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by name or email..."
                          value={adminPatientSearch}
                          onChange={(e) =>
                            setAdminPatientSearch(e.target.value)
                          }
                          className="pl-9"
                        />
                      </div>
                      {adminPatientSearch && (
                        <div className="rounded-lg border divide-y max-h-40 overflow-y-auto">
                          {filteredPatients.length === 0 && (
                            <p className="p-3 text-sm text-muted-foreground text-center">
                              No patients found
                            </p>
                          )}
                          {filteredPatients.slice(0, 8).map((p: any) => (
                            <button
                              key={p.patientId}
                              type="button"
                              className="w-full text-left px-3 py-2 hover:bg-muted/50 transition-colors"
                              onClick={() => {
                                setAdminSelectedPatient(p);
                                setAdminPatientSearch("");
                              }}
                            >
                              <p className="text-sm font-medium">{p.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {p.email}
                              </p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Step 2: Search & select doctor */}
                <div className="space-y-1.5">
                  <Label>
                    Doctor <span className="text-destructive">*</span>
                  </Label>
                  {adminSelectedDoctor ? (
                    <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2">
                      <div>
                        <p className="text-sm font-medium">
                          Dr. {adminSelectedDoctor.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {adminSelectedDoctor.specialty} ·{" "}
                          {adminSelectedDoctor.email}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-muted-foreground"
                        onClick={() => {
                          setAdminSelectedDoctor(null);
                          setAdminDoctorSearch("");
                          setAdminSelectedSlot(null);
                          setAdminSelectedDate("");
                        }}
                      >
                        Change
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by name or email..."
                          value={adminDoctorSearch}
                          onChange={(e) => setAdminDoctorSearch(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                      {adminDoctorSearch && (
                        <div className="rounded-lg border divide-y max-h-40 overflow-y-auto">
                          {filteredDoctors.length === 0 && (
                            <p className="p-3 text-sm text-muted-foreground text-center">
                              No doctors found
                            </p>
                          )}
                          {filteredDoctors.slice(0, 8).map((d: any) => (
                            <button
                              key={d.doctorId}
                              type="button"
                              className="w-full text-left px-3 py-2 hover:bg-muted/50 transition-colors"
                              onClick={() => {
                                setAdminSelectedDoctor(d);
                                setAdminDoctorSearch("");
                                setAdminSelectedSlot(null);
                                setAdminSelectedDate("");
                              }}
                            >
                              <p className="text-sm font-medium">
                                Dr. {d.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {d.specialty} · {d.email}
                              </p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Step 3: Time slots (mirrors patient flow) */}
                {adminSelectedDoctor && (
                  <div className="space-y-2">
                    <Label>
                      Available Time Slots{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    {adminSlotsLoading && (
                      <div className="space-y-2">
                        <Skeleton className="h-14 w-full" />
                        <Skeleton className="h-14 w-full" />
                      </div>
                    )}
                    {!adminSlotsLoading && adminAvailableDays.length === 0 && (
                      <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                        This doctor has no scheduled time slots yet.
                      </div>
                    )}
                    {!adminSlotsLoading && adminAvailableDays.length > 0 && (
                      <div className="space-y-2">
                        {adminAvailableDays.map((day) => (
                          <div key={day}>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                              {day.charAt(0) + day.slice(1).toLowerCase()}s
                            </p>
                            <div className="space-y-1.5">
                              {adminSlotsByDay[day].map((slot: any) => {
                                const isSelected =
                                  adminSelectedSlot?.reservationId ===
                                  slot.reservationId;
                                return (
                                  <button
                                    key={slot.reservationId}
                                    type="button"
                                    onClick={() => {
                                      setAdminSelectedSlot(slot);
                                      setAdminSelectedDate(
                                        getNextDateForDay(slot.day),
                                      );
                                    }}
                                    className={`w-full text-left rounded-lg border px-4 py-3 transition-all ${
                                      isSelected
                                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                                        : "border-border hover:border-primary/50 hover:bg-muted/40"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Stethoscope className="w-3.5 h-3.5 text-muted-foreground" />
                                        <span className="text-sm font-medium">
                                          {slot.clinicType}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                        <Clock className="w-3.5 h-3.5" />
                                        {slot.startHour} – {slot.endHour}
                                      </div>
                                    </div>
                                    {isSelected && (
                                      <div className="mt-1 flex items-center gap-1 text-xs text-primary font-medium">
                                        <CheckCircle className="w-3 h-3" />{" "}
                                        Selected
                                      </div>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Step 4: Date picker */}
                {adminSelectedSlot && (
                  <div className="space-y-1.5">
                    <Label>
                      Appointment Date{" "}
                      <span className="text-destructive">*</span>
                      <span className="ml-1 text-xs text-muted-foreground font-normal">
                        (must be a{" "}
                        {adminSelectedSlot.day.charAt(0) +
                          adminSelectedSlot.day.slice(1).toLowerCase()}
                        )
                      </span>
                    </Label>
                    <Input
                      type="date"
                      value={adminSelectedDate}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setAdminSelectedDate(e.target.value)}
                    />
                    {adminSelectedDate &&
                      !isDateOnDay(
                        adminSelectedDate,
                        adminSelectedSlot.day,
                      ) && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Please pick a{" "}
                          {adminSelectedSlot.day.charAt(0) +
                            adminSelectedSlot.day.slice(1).toLowerCase()}
                        </p>
                      )}
                    {adminSelectedDate &&
                      isDateOnDay(adminSelectedDate, adminSelectedSlot.day) && (
                        <p className="text-xs text-emerald-600 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Appointment at {adminSelectedSlot.startHour} on{" "}
                          {new Date(
                            adminSelectedDate + "T00:00:00",
                          ).toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      )}
                  </div>
                )}

                {/* Notes */}
                {adminSelectedSlot && (
                  <div className="space-y-1.5">
                    <Label>Notes (optional)</Label>
                    <Textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Reason for visit..."
                      rows={3}
                    />
                  </div>
                )}

                {/* Booking summary */}
                {adminSelectedPatient &&
                  adminSelectedDoctor &&
                  adminSelectedSlot &&
                  adminSelectedDate &&
                  isDateOnDay(adminSelectedDate, adminSelectedSlot.day) && (
                    <div className="rounded-lg bg-muted/50 border p-3 text-sm space-y-1">
                      <p className="font-semibold text-foreground">
                        Booking summary
                      </p>
                      <p className="text-muted-foreground">
                        Patient: {adminSelectedPatient.name}
                      </p>
                      <p className="text-muted-foreground">
                        Doctor: Dr. {adminSelectedDoctor.name} —{" "}
                        {adminSelectedDoctor.specialty}
                      </p>
                      <p className="text-muted-foreground">
                        Date:{" "}
                        {new Date(
                          adminSelectedDate + "T00:00:00",
                        ).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-muted-foreground">
                        Time: {adminSelectedSlot.startHour}
                      </p>
                      <p className="text-muted-foreground">
                        Clinic: {adminSelectedSlot.clinicType}
                      </p>
                    </div>
                  )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            {isPatient && (
              <Button
                onClick={handlePatientBook}
                disabled={
                  createMutation.isPending ||
                  !selectedDoctorId ||
                  !selectedSlot ||
                  !selectedDate ||
                  !isDateOnDay(selectedDate, selectedSlot?.day)
                }
              >
                {createMutation.isPending
                  ? "Booking..."
                  : "Request Appointment"}
              </Button>
            )}
            {isAdmin && (
              <Button
                onClick={handleAdminBook}
                disabled={
                  createMutation.isPending ||
                  !adminSelectedPatient ||
                  !adminSelectedDoctor ||
                  !adminSelectedSlot ||
                  !adminSelectedDate ||
                  !isDateOnDay(adminSelectedDate, adminSelectedSlot?.day)
                }
              >
                {createMutation.isPending ? "Booking..." : "Book Appointment"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Doctor notes viewer */}
      <Dialog
        open={!!viewingAppointment}
        onOpenChange={(open) => {
          if (!open) setViewingAppointment(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <StickyNote className="w-4 h-4" /> Patient Notes
            </DialogTitle>
          </DialogHeader>
          {viewingAppointment && (
            <div className="space-y-3 py-1">
              <div className="text-sm text-muted-foreground space-y-0.5">
                <p>
                  <span className="font-medium text-foreground">Patient:</span>{" "}
                  {viewingAppointment.patientName}
                </p>
                <p>
                  <span className="font-medium text-foreground">Date:</span>{" "}
                  {viewingAppointment.dateTime
                    ? new Date(viewingAppointment.dateTime).toLocaleDateString(
                        "en-US",
                        {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        },
                      )
                    : "—"}
                </p>
                <p>
                  <span className="font-medium text-foreground">Time:</span>{" "}
                  {viewingAppointment.dateTime
                    ? new Date(viewingAppointment.dateTime).toLocaleTimeString(
                        [],
                        { hour: "2-digit", minute: "2-digit" },
                      )
                    : "—"}
                </p>
              </div>
              <div className="rounded-lg border p-4 bg-muted/40">
                {viewingAppointment.notes?.trim() ? (
                  <p className="text-sm whitespace-pre-wrap">
                    {viewingAppointment.notes}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No notes written
                  </p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setViewingAppointment(null)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
