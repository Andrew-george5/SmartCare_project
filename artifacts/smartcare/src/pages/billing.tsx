import { useMemo, useState } from "react";
import {
  useListInvoices,
  useCreatePayment,
  getListInvoicesQueryKey,
  useGetDoctorMe,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CreditCard, DollarSign, TrendingUp, Receipt } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  PAID: "bg-green-100 text-green-800",
  REFUNDED: "bg-blue-100 text-blue-800",
};

export default function BillingPage() {
  const { role, token } = useAuth();
  const [location] = useLocation();
  const isPatient = role === "PATIENT";
  const isDoctor = role === "DOCTOR";
  const isAdmin = role === "ADMIN";

  // Derive view mode from path or role
  const mode = useMemo(() => {
    if (location.startsWith("/billing/profit")) return "profit";
    if (location.startsWith("/billing/revenue")) return "revenue";
    if (location.startsWith("/billing/bills")) return "bills";
    if (isDoctor) return "profit";
    if (isPatient) return "bills";
    return "revenue";
  }, [location, isDoctor, isPatient]);

  const [statusFilter, setStatusFilter] = useState("");
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [payForm, setPayForm] = useState({ amount: "", method: "CARD" });
  const qc = useQueryClient();

  // Fetch current user's profile to get role-specific IDs
  const { data: doctorMe } = useGetDoctorMe({
    query: { queryKey: ["doctors", "me"], enabled: isDoctor },
  });
  const doctorId = isDoctor ? (doctorMe as any)?.doctorId : undefined;

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

  // Build params depending on role
  const invoiceParams = useMemo(() => {
    const p: Record<string, any> = {};
    if (statusFilter) p.status = statusFilter;
    if (mode === "bills" && patientId) p.patientId = patientId;
    if (mode === "profit" && doctorId) p.doctorId = doctorId;
    return p;
  }, [mode, statusFilter, patientId, doctorId]);

  // Only fetch when we have the required ID
  const canFetch =
    mode === "revenue" ||
    (mode === "bills" && !!patientId) ||
    (mode === "profit" && !!doctorId);

  const { data: invoices, isLoading } = useListInvoices(invoiceParams, {
    query: { enabled: canFetch },
  });

  const payMutation = useCreatePayment({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListInvoicesQueryKey() });
        setShowPayDialog(false);
        setSelectedInvoice(null);
        setPayForm({ amount: "", method: "CARD" });
      },
    },
  });

  const handlePay = (invoice: any) => {
    setSelectedInvoice(invoice);
    setPayForm({ amount: String(invoice.totalAmount), method: "CARD" });
    setShowPayDialog(true);
  };

  const invoiceList = (invoices ?? []) as any[];

  const totalPaid = invoiceList
    .filter((i) => i.status === "PAID")
    .reduce((sum, i) => sum + Number(i.totalAmount), 0);

  const totalPending = invoiceList
    .filter((i) => i.status === "PENDING")
    .reduce((sum, i) => sum + Number(i.totalAmount), 0);

  const totalAll = invoiceList
    .reduce((sum, i) => sum + Number(i.totalAmount), 0);

  // Summary card config per mode
  const summaryCards = useMemo(() => {
    if (mode === "bills") {
      return [
        { label: "Total Billed", value: `$${totalAll.toLocaleString("en", { minimumFractionDigits: 2 })}`, icon: Receipt, color: "bg-blue-100 text-blue-600" },
        { label: "Paid", value: `$${totalPaid.toLocaleString("en", { minimumFractionDigits: 2 })}`, icon: DollarSign, color: "bg-green-100 text-green-600" },
        { label: "Outstanding", value: `$${totalPending.toLocaleString("en", { minimumFractionDigits: 2 })}`, icon: CreditCard, color: "bg-amber-100 text-amber-600" },
      ];
    }
    if (mode === "profit") {
      return [
        { label: "Total Earnings", value: `$${totalAll.toLocaleString("en", { minimumFractionDigits: 2 })}`, icon: TrendingUp, color: "bg-emerald-100 text-emerald-600" },
        { label: "Collected", value: `$${totalPaid.toLocaleString("en", { minimumFractionDigits: 2 })}`, icon: DollarSign, color: "bg-green-100 text-green-600" },
        { label: "Awaiting Payment", value: `$${totalPending.toLocaleString("en", { minimumFractionDigits: 2 })}`, icon: CreditCard, color: "bg-amber-100 text-amber-600" },
      ];
    }
    // admin revenue
    return [
      { label: "Total Revenue", value: `$${totalAll.toLocaleString("en", { minimumFractionDigits: 2 })}`, icon: TrendingUp, color: "bg-emerald-100 text-emerald-600" },
      { label: "Collected", value: `$${totalPaid.toLocaleString("en", { minimumFractionDigits: 2 })}`, icon: DollarSign, color: "bg-green-100 text-green-600" },
      { label: "Pending", value: `$${totalPending.toLocaleString("en", { minimumFractionDigits: 2 })}`, icon: CreditCard, color: "bg-amber-100 text-amber-600" },
    ];
  }, [mode, totalAll, totalPaid, totalPending]);

  const pageTitle = mode === "profit" ? "Profit" : mode === "bills" ? "Bills" : "Billing & Revenue";
  const pageDesc =
    mode === "profit"
      ? "Your earnings from completed appointments"
      : mode === "bills"
        ? "Your invoices and payment history"
        : "All invoices and total revenue";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{pageTitle}</h1>
        <p className="text-muted-foreground">{pageDesc}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {summaryCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${card.color.split(" ")[0]}`}>
                <card.icon className={`w-5 h-5 ${card.color.split(" ")[1]}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className="text-xl font-bold">{card.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {["", "PENDING", "PAID", "REFUNDED"].map((s) => (
          <Button
            key={s}
            variant={statusFilter === s ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(s)}
          >
            {s || "All"}
          </Button>
        ))}
      </div>

      {/* Invoice table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-4 font-medium">Invoice #</th>
                  {!isPatient && <th className="text-left p-4 font-medium">Patient</th>}
                  {!isDoctor && <th className="text-left p-4 font-medium">Doctor</th>}
                  <th className="text-left p-4 font-medium">Date</th>
                  <th className="text-right p-4 font-medium">Total</th>
                  {isDoctor && <th className="text-right p-4 font-medium">Platform Fee</th>}
                  {isDoctor && <th className="text-right p-4 font-medium">You Receive</th>}
                  {isAdmin && <th className="text-right p-4 font-medium">Platform Fee</th>}
                  <th className="text-left p-4 font-medium">Status</th>
                  {mode === "bills" && <th className="text-left p-4 font-medium">Action</th>}
                </tr>
              </thead>
              <tbody>
                {isLoading &&
                  Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <tr key={i} className="border-b">
                        <td colSpan={6} className="p-4">
                          <Skeleton className="h-4 w-full" />
                        </td>
                      </tr>
                    ))}
                {!isLoading && invoiceList.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      {mode === "bills"
                        ? "No bills yet. Bills are created automatically when your doctor issues a prescription."
                        : mode === "profit"
                          ? "No earnings yet. Invoices are created automatically when you save a prescription with a fee."
                          : "No invoices found."}
                    </td>
                  </tr>
                )}
                {invoiceList.map((inv: any) => (
                  <tr key={inv.invoiceId} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-mono text-sm">#{inv.invoiceId}</td>
                    {!isPatient && <td className="p-4 font-medium">{inv.patientName}</td>}
                    {!isDoctor && <td className="p-4 text-muted-foreground">{inv.doctorName}</td>}
                    <td className="p-4 text-muted-foreground">{inv.issueDate}</td>
                    <td className="p-4 text-right font-semibold">${Number(inv.totalAmount).toFixed(2)}</td>
                    {isDoctor && (
                      <td className="p-4 text-right text-sm text-red-500">
                        {inv.platformFee != null ? `-$${Number(inv.platformFee).toFixed(2)}` : "—"}
                      </td>
                    )}
                    {isDoctor && (
                      <td className="p-4 text-right font-semibold text-emerald-600">
                        {inv.netAmount != null ? `$${Number(inv.netAmount).toFixed(2)}` : "—"}
                      </td>
                    )}
                    {isAdmin && (
                      <td className="p-4 text-right text-sm text-primary font-medium">
                        {inv.platformFee != null ? `$${Number(inv.platformFee).toFixed(2)}` : "—"}
                      </td>
                    )}
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[inv.status] ?? ""}`}>
                        {inv.status}
                      </span>
                    </td>
                    {mode === "bills" && (
                      <td className="p-4">
                        {inv.status === "PENDING" && (
                          <Button
                            size="sm"
                            variant="default"
                            className="h-7 text-xs"
                            onClick={() => handlePay(inv)}
                          >
                            Pay Now
                          </Button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pay dialog — patients only */}
      <Dialog open={showPayDialog} onOpenChange={setShowPayDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Invoice #{selectedInvoice.invoiceId}</p>
                <p className="font-semibold">{selectedInvoice.patientName}</p>
                <p className="text-2xl font-bold mt-1">${Number(selectedInvoice.totalAmount).toFixed(2)}</p>
              </div>
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input
                  type="number"
                  value={payForm.amount}
                  onChange={(e) => setPayForm((f) => ({ ...f, amount: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={payForm.method} onValueChange={(v) => setPayForm((f) => ({ ...f, method: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CARD">Credit/Debit Card</SelectItem>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="DIGITAL_WALLET">Digital Wallet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPayDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                payMutation.mutate({
                  data: {
                    invoiceId: selectedInvoice.invoiceId,
                    amount: Number(payForm.amount),
                    method: payForm.method,
                  } as any,
                })
              }
              disabled={payMutation.isPending}
            >
              {payMutation.isPending ? "Processing..." : "Confirm Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
