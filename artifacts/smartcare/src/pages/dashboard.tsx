import { useQuery } from "@tanstack/react-query";
import { useGetDashboardStats, useGetAppointmentTrends, useGetRevenueSummary, useGetDoctorPerformance } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import {
  Users, Stethoscope, Calendar, CheckCircle, DollarSign,
  Clock, TrendingUp, AlertCircle, Pill, FileText
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, AreaChart, Area
} from "recharts";

function StatCard({ label, value, icon: Icon, color, loading }: any) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            {loading ? <Skeleton className="h-8 w-16 mt-1" /> : (
              <p className="text-2xl font-bold mt-1">
                {typeof value === "number" && value % 1 !== 0
                  ? `$${Number(value).toLocaleString("en", { minimumFractionDigits: 2 })}`
                  : Number(value ?? 0).toLocaleString()}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-xl ${color}`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function apptStatus(status: string) {
  const map: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-800",
    COMPLETED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
  };
  return map[status] ?? "bg-gray-100 text-gray-800";
}

/* ─── Admin Dashboard ─── */
function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: trends, isLoading: trendsLoading } = useGetAppointmentTrends();
  const { data: revenue, isLoading: revenueLoading } = useGetRevenueSummary();
  const { data: doctors, isLoading: doctorsLoading } = useGetDoctorPerformance();
  const { user } = useAuth();

  const statCards = [
    { label: "Total Patients", value: stats?.totalPatients, icon: Users, color: "bg-blue-500" },
    { label: "Total Doctors", value: stats?.totalDoctors, icon: Stethoscope, color: "bg-emerald-500" },
    { label: "Total Appointments", value: stats?.totalAppointments, icon: Calendar, color: "bg-violet-500" },
    { label: "Pending Appointments", value: stats?.pendingAppointments, icon: Clock, color: "bg-amber-500" },
    { label: "Completed Appointments", value: stats?.completedAppointments, icon: CheckCircle, color: "bg-green-500" },
    { label: "Total Revenue", value: stats?.totalRevenue, icon: DollarSign, color: "bg-cyan-600" },
    { label: "Pending Invoices", value: stats?.pendingInvoices, icon: AlertCircle, color: "bg-red-500" },
    { label: "Today's Appointments", value: stats?.todayAppointments, icon: TrendingUp, color: "bg-indigo-500" },
  ];

  const trendData = (trends ?? []).map((t: any) => ({
    date: t.date?.slice(5),
    Total: Number(t.count),
    Completed: Number(t.completed),
    Cancelled: Number(t.cancelled),
  }));

  const revenueData = (revenue ?? []).map((r: any) => ({
    month: r.month,
    Revenue: Number(r.revenue ?? 0),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {user?.name}</h1>
        <p className="text-muted-foreground">Here's what's happening at SmartCare today.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} loading={statsLoading} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Appointment Trends (Last 7 Days)</CardTitle>
            <CardDescription>Daily appointments breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {trendsLoading ? <Skeleton className="h-48 w-full" /> : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="Total" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.2} />
                  <Area type="monotone" dataKey="Completed" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} />
                  <Area type="monotone" dataKey="Cancelled" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
            <CardDescription>Paid invoices by month</CardDescription>
          </CardHeader>
          <CardContent>
            {revenueLoading ? <Skeleton className="h-48 w-full" /> : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(val: any) => `$${Number(val).toLocaleString()}`} />
                  <Bar dataKey="Revenue" fill="#0891b2" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Doctor Performance</CardTitle>
          <CardDescription>Appointments and completion rates per doctor</CardDescription>
        </CardHeader>
        <CardContent>
          {doctorsLoading ? <Skeleton className="h-32 w-full" /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 font-medium">Doctor</th>
                    <th className="text-left py-2 font-medium">Specialty</th>
                    <th className="text-right py-2 font-medium">Total</th>
                    <th className="text-right py-2 font-medium">Completed</th>
                    <th className="text-right py-2 font-medium">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {(doctors ?? []).length === 0 && (
                    <tr><td colSpan={5} className="py-4 text-center text-muted-foreground">No data yet</td></tr>
                  )}
                  {(doctors ?? []).map((d: any) => {
                    const rate = d.totalAppointments > 0
                      ? Math.round((d.completedAppointments / d.totalAppointments) * 100) : 0;
                    return (
                      <tr key={d.doctorId} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="py-2 font-medium">{d.doctorName}</td>
                        <td className="py-2 text-muted-foreground">{d.specialty}</td>
                        <td className="py-2 text-right">{d.totalAppointments}</td>
                        <td className="py-2 text-right">{d.completedAppointments}</td>
                        <td className="py-2 text-right">
                          <Badge variant={rate >= 70 ? "default" : "secondary"}>{rate}%</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Doctor Dashboard ─── */
function DoctorDashboard() {
  const { user, token } = useAuth();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["doctors", "me"],
    queryFn: async () => {
      const res = await fetch("/api/doctors/me", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Could not load doctor profile");
      return res.json();
    },
  });

  const { data: appointments, isLoading: apptLoading } = useQuery({
    queryKey: ["appointments", "doctor", profile?.doctorId],
    queryFn: async () => {
      const res = await fetch(`/api/appointments?doctorId=${profile.doctorId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Could not load appointments");
      return res.json() as Promise<any[]>;
    },
    enabled: !!profile?.doctorId,
  });

  const todayStr = new Date().toDateString();
  const all = appointments ?? [];
  const todayAppts = all.filter((a) => new Date(a.dateTime).toDateString() === todayStr);
  const pending = all.filter((a) => a.status === "PENDING");
  const completed = all.filter((a) => a.status === "COMPLETED");
  const uniquePatients = new Set(all.map((a) => a.patientId)).size;

  const statCards = [
    { label: "Today's Appointments", value: todayAppts.length, icon: Calendar, color: "bg-indigo-500" },
    { label: "Pending", value: pending.length, icon: Clock, color: "bg-amber-500" },
    { label: "Completed", value: completed.length, icon: CheckCircle, color: "bg-green-500" },
    { label: "Total Patients Seen", value: uniquePatients, icon: Users, color: "bg-blue-500" },
  ];

  const loading = profileLoading || apptLoading;

  const upcoming = all
    .filter((a) => a.status === "PENDING")
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome, Dr. {user?.name}</h1>
        <p className="text-muted-foreground">
          {profile ? `${profile.specialty} · License: ${profile.licenseNumber}` : "Loading your profile…"}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} loading={loading} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Appointments</CardTitle>
          <CardDescription>Your next pending appointments</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-40 w-full" /> : (
            upcoming.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No upcoming appointments</p>
            ) : (
              <div className="space-y-3">
                {upcoming.map((a: any) => (
                  <div key={a.appointmentId} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                    <div>
                      <p className="font-medium">{a.patientName}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(a.dateTime).toLocaleString("en", { dateStyle: "medium", timeStyle: "short" })}
                      </p>
                      {a.notes && <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">{a.notes}</p>}
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${apptStatus(a.status)}`}>{a.status}</span>
                  </div>
                ))}
              </div>
            )
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Appointment History</CardTitle>
          <CardDescription>Last 10 completed or cancelled appointments</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-32 w-full" /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 font-medium">Patient</th>
                    <th className="text-left py-2 font-medium">Date & Time</th>
                    <th className="text-left py-2 font-medium">Notes</th>
                    <th className="text-right py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {all.filter(a => a.status !== "PENDING")
                    .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())
                    .slice(0, 10)
                    .map((a: any) => (
                      <tr key={a.appointmentId} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="py-2 font-medium">{a.patientName}</td>
                        <td className="py-2 text-muted-foreground">
                          {new Date(a.dateTime).toLocaleString("en", { dateStyle: "medium", timeStyle: "short" })}
                        </td>
                        <td className="py-2 text-muted-foreground max-w-xs truncate">{a.notes ?? "—"}</td>
                        <td className="py-2 text-right">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${apptStatus(a.status)}`}>{a.status}</span>
                        </td>
                      </tr>
                    ))}
                  {all.filter(a => a.status !== "PENDING").length === 0 && (
                    <tr><td colSpan={4} className="py-4 text-center text-muted-foreground">No history yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Patient Dashboard ─── */
function PatientDashboard() {
  const { user, token } = useAuth();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["patients", "me"],
    queryFn: async () => {
      const res = await fetch("/api/patients/me", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Could not load patient profile");
      return res.json();
    },
  });

  const { data: appointments, isLoading: apptLoading } = useQuery({
    queryKey: ["appointments", "patient", profile?.patientId],
    queryFn: async () => {
      const res = await fetch(`/api/appointments?patientId=${profile.patientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Could not load appointments");
      return res.json() as Promise<any[]>;
    },
    enabled: !!profile?.patientId,
  });

  const { data: prescriptions, isLoading: rxLoading } = useQuery({
    queryKey: ["prescriptions", "patient", profile?.patientId],
    queryFn: async () => {
      const res = await fetch(`/api/prescriptions?patientId=${profile.patientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Could not load prescriptions");
      return res.json() as Promise<any[]>;
    },
    enabled: !!profile?.patientId,
  });

  const all = appointments ?? [];
  const upcoming = all.filter((a) => a.status === "PENDING")
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
  const completed = all.filter((a) => a.status === "COMPLETED");

  const loading = profileLoading || apptLoading || rxLoading;

  const statCards = [
    { label: "Upcoming Appointments", value: upcoming.length, icon: Calendar, color: "bg-indigo-500" },
    { label: "Completed Visits", value: completed.length, icon: CheckCircle, color: "bg-green-500" },
    { label: "Prescriptions", value: (prescriptions ?? []).length, icon: Pill, color: "bg-violet-500" },
    { label: "Total Appointments", value: all.length, icon: FileText, color: "bg-blue-500" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome, {user?.name}</h1>
        <p className="text-muted-foreground">
          {profile
            ? [profile.bloodType && `Blood Type: ${profile.bloodType}`, profile.gender].filter(Boolean).join(" · ")
            : "Loading your profile…"}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} loading={loading} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Appointments</CardTitle>
          <CardDescription>Your scheduled visits</CardDescription>
        </CardHeader>
        <CardContent>
          {apptLoading ? <Skeleton className="h-40 w-full" /> : (
            upcoming.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No upcoming appointments</p>
            ) : (
              <div className="space-y-3">
                {upcoming.slice(0, 5).map((a: any) => (
                  <div key={a.appointmentId} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                    <div>
                      <p className="font-medium">Dr. {a.doctorName}</p>
                      <p className="text-sm text-muted-foreground">{a.doctorSpecialty}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(a.dateTime).toLocaleString("en", { dateStyle: "medium", timeStyle: "short" })}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${apptStatus(a.status)}`}>{a.status}</span>
                  </div>
                ))}
              </div>
            )
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Prescriptions</CardTitle>
          <CardDescription>Your latest prescriptions from doctors</CardDescription>
        </CardHeader>
        <CardContent>
          {rxLoading ? <Skeleton className="h-32 w-full" /> : (
            (prescriptions ?? []).length === 0 ? (
              <p className="text-center text-muted-foreground py-6">No prescriptions yet</p>
            ) : (
              <div className="space-y-3">
                {(prescriptions ?? []).slice(0, 5).map((rx: any) => (
                  <div key={rx.prescriptionId} className="p-3 rounded-lg border bg-card">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-sm">Dr. {rx.doctorName}</p>
                      <p className="text-xs text-muted-foreground">{rx.issueDate}</p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(rx.drugs ?? []).map((d: any) => (
                        <span key={d.drugId} className="text-xs bg-violet-100 text-violet-800 px-2 py-0.5 rounded-full">
                          {d.drugName} · {d.dosage}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Root export ─── */
export default function DashboardPage() {
  const { user } = useAuth();

  if (user?.role === "DOCTOR") return <DoctorDashboard />;
  if (user?.role === "PATIENT") return <PatientDashboard />;
  return <AdminDashboard />;
}
