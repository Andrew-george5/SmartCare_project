import { useState } from "react";
import {
  useListClinics, useCreateClinic, useListClinicReservations,
  useCreateClinicReservation, useListDoctors,
  getListClinicsQueryKey, getListClinicReservationsQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Building2, Clock } from "lucide-react";

const DAYS = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

export default function ClinicsPage() {
  const [showClinicDialog, setShowClinicDialog] = useState(false);
  const [showReservationDialog, setShowReservationDialog] = useState(false);
  const [clinicForm, setClinicForm] = useState({ type: "" });
  const [resForm, setResForm] = useState({ clinicId: "", doctorId: "", day: "MONDAY", startHour: "09:00", endHour: "13:00" });
  const qc = useQueryClient();

  const { data: clinics, isLoading: clinicsLoading } = useListClinics();
  const { data: reservations, isLoading: resLoading } = useListClinicReservations({});
  const { data: doctors } = useListDoctors({});

  const createClinicMutation = useCreateClinic({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListClinicsQueryKey() });
        setShowClinicDialog(false);
        setClinicForm({ type: "" });
      }
    }
  });

  const createResMutation = useCreateClinicReservation({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListClinicReservationsQueryKey() });
        setShowReservationDialog(false);
      }
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Clinics & Schedules</h1>
        <p className="text-muted-foreground">Manage clinic rooms and doctor schedules</p>
      </div>

      <Tabs defaultValue="clinics">
        <TabsList>
          <TabsTrigger value="clinics">Clinics</TabsTrigger>
          <TabsTrigger value="reservations">Doctor Schedules</TabsTrigger>
        </TabsList>

        <TabsContent value="clinics" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowClinicDialog(true)} className="gap-2">
              <Plus className="w-4 h-4" /> Add Clinic
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {clinicsLoading && Array(4).fill(0).map((_, i) => (
              <Card key={i}><CardContent className="p-6"><Skeleton className="h-16" /></CardContent></Card>
            ))}
            {!clinicsLoading && (clinics ?? []).length === 0 && (
              <div className="col-span-4 text-center py-12 text-muted-foreground">No clinics found</div>
            )}
            {(clinics ?? []).map((c: any) => (
              <Card key={c.clinicId} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <Building2 className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <p className="font-semibold">{c.type}</p>
                  <p className="text-xs text-muted-foreground mt-1">Clinic #{c.clinicId}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reservations" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowReservationDialog(true)} className="gap-2">
              <Plus className="w-4 h-4" /> Add Schedule
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left p-4 font-medium">Doctor</th>
                      <th className="text-left p-4 font-medium">Clinic</th>
                      <th className="text-left p-4 font-medium">Day</th>
                      <th className="text-left p-4 font-medium">Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resLoading && Array(3).fill(0).map((_, i) => (
                      <tr key={i} className="border-b"><td colSpan={4} className="p-4"><Skeleton className="h-4 w-full" /></td></tr>
                    ))}
                    {!resLoading && (reservations ?? []).length === 0 && (
                      <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No schedules found</td></tr>
                    )}
                    {(reservations ?? []).map((r: any) => (
                      <tr key={r.reservationId} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="p-4 font-medium">Dr. {r.doctorName}</td>
                        <td className="p-4 text-muted-foreground">{r.clinicType} (#{r.clinicId})</td>
                        <td className="p-4"><Badge variant="outline">{r.day}</Badge></td>
                        <td className="p-4">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {r.startHour} — {r.endHour}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showClinicDialog} onOpenChange={setShowClinicDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Clinic</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Clinic Type</Label>
              <Input value={clinicForm.type} onChange={e => setClinicForm(f => ({ ...f, type: e.target.value }))} placeholder="e.g. Cardiology, General, ICU..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClinicDialog(false)}>Cancel</Button>
            <Button
              onClick={() => createClinicMutation.mutate({ data: { type: clinicForm.type } })}
              disabled={createClinicMutation.isPending || !clinicForm.type}
            >
              {createClinicMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showReservationDialog} onOpenChange={setShowReservationDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Doctor Schedule</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Doctor</Label>
              <Select value={resForm.doctorId} onValueChange={v => setResForm(f => ({ ...f, doctorId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select doctor..." /></SelectTrigger>
                <SelectContent>
                  {(doctors ?? []).map((d: any) => (
                    <SelectItem key={d.doctorId} value={String(d.doctorId)}>Dr. {d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Clinic</Label>
              <Select value={resForm.clinicId} onValueChange={v => setResForm(f => ({ ...f, clinicId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select clinic..." /></SelectTrigger>
                <SelectContent>
                  {(clinics ?? []).map((c: any) => (
                    <SelectItem key={c.clinicId} value={String(c.clinicId)}>{c.type} (#{c.clinicId})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Day</Label>
              <Select value={resForm.day} onValueChange={v => setResForm(f => ({ ...f, day: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Hour</Label>
                <Input type="time" value={resForm.startHour} onChange={e => setResForm(f => ({ ...f, startHour: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>End Hour</Label>
                <Input type="time" value={resForm.endHour} onChange={e => setResForm(f => ({ ...f, endHour: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReservationDialog(false)}>Cancel</Button>
            <Button
              onClick={() => createResMutation.mutate({ data: {
                clinicId: Number(resForm.clinicId),
                doctorId: Number(resForm.doctorId),
                day: resForm.day,
                startHour: resForm.startHour,
                endHour: resForm.endHour,
              } })}
              disabled={createResMutation.isPending || !resForm.clinicId || !resForm.doctorId}
            >
              {createResMutation.isPending ? "Saving..." : "Save Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
