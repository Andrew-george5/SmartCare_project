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
import { CreditCard, DollarSign, TrendingUp, Receipt, Percent } from "lucide-react";
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

  const { data: doctorMe } = useGetDoctorMe({
    query: { queryKey: ["doctors", "me"], enabled: isDoctor },
  });
  const doctorId = isDoctor ? (doctorMe as any)?.doctorId : undefined;

  const { data: patientMe } = useQuery({
    queryKey: ["patients", "me"],
    queryFn: async () => {
      const res = await fetch("/api/patients/me", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to load patient profile");
      return res.json();
    },
    enabled: isPatient && !!token,
    staleTime: 60000,
  });
  const patientId = isPatient ? (patientMe as any)?.patientId : undefined;

  // Fetch platform settings to show fee context
  const { data: settings } = useQuery({
    queryKey: ["/api/settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return { feePercent: 10 };
      return res.json() as Promise<{ feePercent: number }>;
    },
    enabled: !!token && (isAdmin || isDoctor),
    staleTime: 60000,
  });
  const feePercent = Number(settings?.feePercent ?? 10);

  const invoiceParams = useMemo(() => {
    const p: Record<string, any> = {};
    if (statusFilter) p.status = statusFilter;
    if (mode === "bills" && patientId) p.patientId = patientId;
    if (mode === "profit" && doctorId) p.doctorId = doctorId;
    return p;
  }, [mode, statusFilter, patientId, doctorId]);

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

  // ── Total amount (what patients paid)
  const totalAll = invoiceList.reduce((sum, i) => sum + Number(i.totalAmount ?? 0), 0);
  const totalPaid = invoiceList.filter(i => i.status === "PAID").reduce((sum, i) => sum + Number(i.totalAmount ?? 0), 0);
  const totalPending = invoiceList.filter(i => i.status === "PENDING").reduce((sum, i) => sum + Number(i.totalAmount ?? 0), 0);

  // ── Net amount (what doctors actually receive after fee)
  const totalNet = invoiceList.reduce((sum, i) => sum + Number(i.netAmount ?? 0), 0);
  const paidNet = invoiceList.filter(i => i.status === "PAID").reduce((sum, i) => sum + Number(i.netAmount ?? 0), 0);
  const pendingNet = invoiceList.filter(i => i.status === "PENDING").reduce((sum, i) => sum + Number(i.netAmount ?? 0), 0);

  // ── Platform fee (the site's cut)
  const totalPlatformFee = invoiceList.reduce((sum, i) => sum + Number(i.platformFee ?? 0), 0);
  const paidPlatformFee = invoiceList.filter(i => i.status === "PAID").reduce((sum, i) => sum + Number(i.platformFee ?? 0), 0);

  const fmt = (n: number) => `$${n.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const summaryCards = useMemo(() => {
    if (mode === "bills") {
      return [
        { label: "Total Billed", value: fmt(totalAll), icon: Receipt, color: "bg-blue-100 text-blue-600" },
        { label: "Paid", value: fmt(totalPaid), icon: DollarSign, color: "bg-green-100 text-green-600" },
        { label: "Outstanding", value: fmt(totalPending), icon: CreditCard, color: "bg-amber-100 text-amber-600" },
      ];
    }
    if (mode === "profit") {
      // Doctor sees their NET earnings (after fee deduction)
      return [
        { label: "Your Net Earnings", value: fmt(totalNet), sub: `After ${feePercent}% platform fee`, icon: TrendingUp, color: "bg-emerald-100 text-emerald-600" },
        { label: "Collected", value: fmt(paidNet), sub: "From paid invoices", icon: DollarSign, color: "bg-green-100 text-green-600" },
        { label: "Awaiting Payment", value: fmt(pendingNet), sub: "From pending invoices", icon: CreditCard, color: "bg-amber-100 text-amber-600" },
      ];
    }
    // Admin — revenue = all money, profit = platform's cut
    return [
      { label: "Total Revenue", value: fmt(totalAll), sub: "All patient payments", icon: TrendingUp, color: "bg-blue-100 text-blue-600" },
      { label: "Platform Profit", value: fmt(paidPlatformFee), sub: `${feePercent}% fee on collected`, icon: Percent, color: "bg-violet-100 text-violet-600" },
      { label: "Pending", value: fmt(totalPending), sub: "Awaiting payment", icon: CreditCard, color: "bg-amber-100 text-amber-600" },
    ];
  }, [mode, totalAll, totalPaid, totalPending, totalNet, paidNet, pendingNet, paidPlatformFee, totalPlatformFee, feePercent]);

  const pageTitle = mode === "profit" ? "Profit" : mode === "bills" ? "Bills" : "Billing & Revenue";
  const pageDesc =
    mode === "profit"
      ? "Your net earnings from appointments after platform fee"
      : mode === "bills"
        ? "Your invoices and payment history"
        : "All patient payments and platform revenue";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">{pageTitle}</h1>
          <p className="text-muted-foreground">{pageDesc}</p>
        </div>
        {(isAdmin || isDoctor) && settings && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/60 border rounded-lg px-3 py-1.5">
            <Percent className="w-3.5 h-3.5" />
            <span>Platform fee: <strong className="text-foreground">{feePercent}%</strong></span>
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {summaryCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`p-3 rounded-xl shrink-0 ${card.color.split(" ")[0]}`}>
                <card.icon className={`w-5 h-5 ${card.color.split(" ")[1]}`} />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className="text-xl font-bold">{card.value}</p>
                {"sub" in card && card.sub && (
                  <p className="text-xs text-muted-foreground mt-0.5">{card.sub}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Doctor: Fee breakdown banner */}
      {isDoctor && invoiceList.length > 0 && (
        <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/40 px-5 py-3 text-sm">
          <div className="flex items-center gap-6 flex-wrap">
            <div>
              <span className="text-muted-foreground">Gross Billed: </span>
              <span className="font-semibold">{fmt(totalAll)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Platform Fee ({feePercent}%): </span>
              <span className="font-semibold text-red-600">-{fmt(totalPlatformFee)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Your Total: </span>
              <span className="font-semibold text-emerald-600">{fmt(totalNet)}</span>
            </div>
          </div>
        </div>
      )}

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
                  {isDoctor && <th className="text-right p-4 font-medium text-red-600">Fee ({feePercent}%)</th>}
                  {isDoctor && <th className="text-right p-4 font-medium text-emerald-600">You Receive</th>}
                  {isAdmin && <th className="text-right p-4 font-medium text-violet-600">Platform Profit</th>}
                  <th className="text-left p-4 font-medium">Status</th>
                  {mode === "bills" && <th className="text-left p-4 font-medium">Action</th>}
                </tr>
              </thead>
              <tbody>
                {isLoading &&
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="border-b">
                      <td colSpan={8} className="p-4">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    </tr>
                  ))}
                {!isLoading && invoiceList.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
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
                    <td className="p-4 text-right font-semibold">{fmt(Number(inv.totalAmount))}</td>
                    {isDoctor && (
                      <td className="p-4 text-right text-sm text-red-500">
                        {inv.platformFee != null ? `-${fmt(Number(inv.platformFee))}` : "—"}
                      </td>
                    )}
                    {isDoctor && (
                      <td className="p-4 text-right font-semibold text-emerald-600">
                        {inv.netAmount != null ? fmt(Number(inv.netAmount)) : "—"}
                      </td>
                    )}
                    {isAdmin && (
                      <td className="p-4 text-right text-sm text-violet-600 font-medium">
                        {inv.platformFee != null ? fmt(Number(inv.platformFee)) : "—"}
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

              {/* Table footer totals */}
              {!isLoading && invoiceList.length > 0 && (
                <tfoot>
                  <tr className="border-t bg-muted/20 font-semibold">
                    <td className="p-4 text-muted-foreground text-xs uppercase tracking-wide" colSpan={isPatient ? 2 : isDoctor ? 3 : 3}>
                      Totals
                    </td>
                    <td className="p-4 text-right">{fmt(totalAll)}</td>
                    {isDoctor && (
                      <td className="p-4 text-right text-red-500">-{fmt(totalPlatformFee)}</td>
                    )}
                    {isDoctor && (
                      <td className="p-4 text-right text-emerald-600">{fmt(totalNet)}</td>
                    )}
                    {isAdmin && (
                      <td className="p-4 text-right text-violet-600">{fmt(totalPlatformFee)}</td>
                    )}
                    <td className="p-4" colSpan={mode === "bills" ? 2 : 1} />
                  </tr>
                </tfoot>
              )}
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
                <p className="text-2xl font-bold mt-1">{fmt(Number(selectedInvoice.totalAmount))}</p>
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
