import { useEffect, useState, useRef, KeyboardEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListDrugs,
  useCreateDrug,
  useDeleteDrug,
  getListDrugsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Search, Pill, X, FlaskConical } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function DrugsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { token } = useAuth();

  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [drugName, setDrugName] = useState("");
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [ingredientInput, setIngredientInput] = useState("");
  const ingredientRef = useRef<HTMLInputElement>(null);

  const { data: drugs, isLoading } = useListDrugs({ search: search || undefined });

  const createMutation = useCreateDrug({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListDrugsQueryKey() });
        qc.invalidateQueries({ queryKey: getListDrugsQueryKey({ search: search || undefined }) });
        setShowDialog(false);
        resetForm();
        toast({ title: "Drug added successfully" });
      },
      onError: (err: any) => {
        toast({ title: err?.message ?? "Failed to add drug", variant: "destructive" });
      },
    },
  });

  const deleteMutation = useDeleteDrug({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListDrugsQueryKey() });
        qc.invalidateQueries({ queryKey: getListDrugsQueryKey({ search: search || undefined }) });
        toast({ title: "Drug removed" });
      },
      onError: () => {
        toast({ title: "Failed to remove drug", variant: "destructive" });
      },
    },
  });

  function resetForm() {
    setDrugName("");
    setIngredients([]);
    setIngredientInput("");
  }

  function addIngredient() {
    const val = ingredientInput.trim();
    if (val && !ingredients.includes(val)) {
      setIngredients((prev) => [...prev, val]);
    }
    setIngredientInput("");
    ingredientRef.current?.focus();
  }

  function handleIngredientKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addIngredient();
    } else if (e.key === "Backspace" && ingredientInput === "" && ingredients.length > 0) {
      setIngredients((prev) => prev.slice(0, -1));
    }
  }

  function removeIngredient(i: number) {
    setIngredients((prev) => prev.filter((_, idx) => idx !== i));
  }

  function handleCreate() {
    if (!drugName.trim()) return;
    createMutation.mutate({
      data: { drugName: drugName.trim(), activeIngredients: ingredients },
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Drugs</h1>
          <p className="text-muted-foreground">Manage the drug formulary and active ingredients</p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Add Drug
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by drug name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Drug list */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-20" /></CardContent></Card>
          ))}
        </div>
      ) : (drugs ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <Pill className="w-10 h-10 opacity-30" />
          <p className="text-sm">{search ? `No drugs match "${search}"` : "No drugs added yet"}</p>
          <Button variant="outline" size="sm" onClick={() => setShowDialog(true)} className="gap-1">
            <Plus className="w-3.5 h-3.5" /> Add the first drug
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(drugs ?? []).map((drug: any) => (
            <Card key={drug.drugId} className="group hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                      <Pill className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{drug.drugName}</p>
                      <p className="text-xs text-muted-foreground">
                        ID #{drug.drugId}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-red-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => deleteMutation.mutate({ id: drug.drugId })}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>

                {(drug.activeIngredients ?? []).length > 0 ? (
                  <div className="mt-3">
                    <div className="flex items-center gap-1 mb-1.5">
                      <FlaskConical className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Active ingredients</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {drug.activeIngredients.map((ing: string, i: number) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-800 font-medium"
                        >
                          {ing}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-muted-foreground italic">No active ingredients listed</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add drug dialog */}
      <Dialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Drug</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Drug Name <span className="text-destructive">*</span></Label>
              <Input
                placeholder="e.g. Amoxicillin"
                value={drugName}
                onChange={(e) => setDrugName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") ingredientRef.current?.focus(); }}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Active Ingredients</Label>
              <p className="text-xs text-muted-foreground">Type an ingredient and press Enter or comma to add it</p>
              <div
                className="min-h-[42px] flex flex-wrap gap-1.5 items-center px-3 py-2 rounded-md border border-input bg-background cursor-text focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1"
                onClick={() => ingredientRef.current?.focus()}
              >
                {ingredients.map((ing, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-800 font-medium"
                  >
                    {ing}
                    <button
                      type="button"
                      className="hover:text-emerald-600"
                      onClick={(e) => { e.stopPropagation(); removeIngredient(i); }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  ref={ingredientRef}
                  className="flex-1 min-w-[120px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  placeholder={ingredients.length === 0 ? "e.g. Amoxicillin trihydrate" : ""}
                  value={ingredientInput}
                  onChange={(e) => setIngredientInput(e.target.value)}
                  onKeyDown={handleIngredientKey}
                  onBlur={addIngredient}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => { setShowDialog(false); resetForm(); }} disabled={createMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending || !drugName.trim()}>
              {createMutation.isPending ? "Adding…" : "Add Drug"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
