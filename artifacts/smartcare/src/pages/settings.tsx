import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Percent, Settings2 } from "lucide-react";

export default function SettingsPage() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [feeInput, setFeeInput] = useState("");
  const [editing, setEditing] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load settings");
      return res.json() as Promise<{ feePercent: number }>;
    },
    enabled: !!token,
  });

  const mutation = useMutation({
    mutationFn: async (feePercent: number) => {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ feePercent }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).message || "Failed to update settings");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/settings"] });
      setEditing(false);
      toast({ title: "Platform fee updated successfully" });
    },
    onError: (err: any) => {
      toast({ title: err.message ?? "Failed to update", variant: "destructive" });
    },
  });

  function handleEdit() {
    setFeeInput(String(settings?.feePercent ?? "10"));
    setEditing(true);
  }

  function handleSave() {
    const val = parseFloat(feeInput);
    if (isNaN(val) || val < 0 || val > 100) {
      toast({ title: "Fee must be between 0 and 100", variant: "destructive" });
      return;
    }
    mutation.mutate(val);
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold">Platform Settings</h1>
        <p className="text-muted-foreground">Configure system-wide settings for SmartCare HMS</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Percent className="w-4 h-4 text-primary" />
            </div>
            Platform Service Fee
          </CardTitle>
          <CardDescription>
            A percentage deducted from each appointment fee. The doctor receives the remainder.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <Skeleton className="h-10 w-40" />
          ) : editing ? (
            <div className="flex items-end gap-3">
              <div className="space-y-1.5">
                <Label>Fee Percentage</Label>
                <div className="relative w-36">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={feeInput}
                    onChange={e => setFeeInput(e.target.value)}
                    className="pr-8"
                    autoFocus
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">%</span>
                </div>
              </div>
              <Button onClick={handleSave} disabled={mutation.isPending}>
                {mutation.isPending ? "Saving…" : "Save"}
              </Button>
              <Button variant="outline" onClick={() => setEditing(false)} disabled={mutation.isPending}>
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold text-primary">
                {settings?.feePercent ?? 10}<span className="text-2xl">%</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleEdit} className="gap-1.5">
                <Settings2 className="w-3.5 h-3.5" /> Change
              </Button>
            </div>
          )}

          <div className="rounded-lg bg-muted/50 border p-4 text-sm space-y-1 text-muted-foreground">
            <p className="font-medium text-foreground">How it works</p>
            <p>When a doctor sets a consultation fee of <strong>$100</strong> and the platform fee is <strong>{settings?.feePercent ?? 10}%</strong>:</p>
            <ul className="mt-1 space-y-0.5 list-disc list-inside">
              <li>Patient pays: <strong className="text-foreground">${(100).toFixed(2)}</strong></li>
              <li>Platform fee: <strong className="text-foreground">${(100 * (settings?.feePercent ?? 10) / 100).toFixed(2)}</strong></li>
              <li>Doctor receives: <strong className="text-foreground">${(100 - 100 * (settings?.feePercent ?? 10) / 100).toFixed(2)}</strong></li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
