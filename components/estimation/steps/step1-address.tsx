"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { APIProvider } from "@vis.gl/react-google-maps";
import { toast } from "sonner";
import type { EstimationDraft, FieldCapture } from "@/lib/estimation/store";
import type { FieldValues } from "@/lib/estimation/schema";
import { Button } from "@/components/ui/button";
import {
  TerrainEditorDialog,
  emptyField,
} from "@/components/estimation/terrain-editor/terrain-editor-dialog";
import {
  AddTerrainCard,
  TerrainCard,
} from "@/components/estimation/terrain-card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface StepProps {
  draft: EstimationDraft;
  upsertField: (field: FieldValues, capture?: FieldCapture) => void;
  removeField: (fieldId: string) => void;
  onNext: () => void;
}

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

const FIELD_COLORS = [
  "#E8A33D",
  "#4FA3FF",
  "#9CCB6C",
  "#E36161",
  "#B98AFA",
  "#F2C476",
];

function colorForIndex(i: number): string {
  return FIELD_COLORS[i % FIELD_COLORS.length]!;
}

export function Step1Address({
  draft,
  upsertField,
  removeField,
  onNext,
}: StepProps) {
  const t = useTranslations("Estimation");
  const tList = useTranslations("TerrainList");

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorField, setEditorField] = useState<FieldValues | null>(null);
  const [editorCapture, setEditorCapture] = useState<FieldCapture | undefined>(
    undefined,
  );
  const [editorColor, setEditorColor] = useState<string>(FIELD_COLORS[0]!);
  const [pendingDelete, setPendingDelete] = useState<FieldValues | null>(null);

  function openForCreate() {
    const seed = emptyField();
    seed.name = `Terrain ${draft.fields.length + 1}`;
    setEditorField(seed);
    setEditorCapture(undefined);
    setEditorColor(colorForIndex(draft.fields.length));
    setEditorOpen(true);
  }

  function openForEdit(field: FieldValues) {
    const idx = draft.fields.findIndex((f) => f.id === field.id);
    setEditorField(field);
    setEditorCapture(draft.captures[field.id]);
    setEditorColor(colorForIndex(idx === -1 ? draft.fields.length : idx));
    setEditorOpen(true);
  }

  function handleSave(field: FieldValues, capture?: FieldCapture) {
    upsertField(field, capture);
    setEditorOpen(false);
    setEditorField(null);
    setEditorCapture(undefined);
    toast.success(tList("saved", { name: field.name }));
  }

  function handleRemove(field: FieldValues) {
    setPendingDelete(field);
  }

  function confirmRemove() {
    if (!pendingDelete) return;
    removeField(pendingDelete.id);
    toast.success(tList("deleted"));
    setPendingDelete(null);
  }

  function isFieldComplete(f: FieldValues): boolean {
    return (
      f.name.trim().length >= 2 &&
      f.address.trim().length >= 5 &&
      f.surfaceM2 > 0 &&
      f.poles.length >= 1 &&
      Boolean(f.config) &&
      Boolean(draft.captures[f.id])
    );
  }
  const incompleteFields = draft.fields.filter((f) => !isFieldComplete(f));
  const canContinue =
    draft.fields.length > 0 && incompleteFields.length === 0;

  if (!apiKey) {
    return (
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="lb-h2">{tList("title")}</h1>
          <p className="lb-lede text-base">{tList("missingKey")}</p>
        </header>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey} libraries={["places"]}>
      <div className="space-y-8">
        <header className="space-y-2">
          <h1 className="lb-h2">{tList("title")}</h1>
          <p className="lb-lede text-base">{tList("subtitle")}</p>
        </header>

        {/* Card grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {draft.fields.map((field, i) => (
            <TerrainCard
              key={field.id}
              field={field}
              color={colorForIndex(i)}
              captureDataUrl={draft.captures[field.id]?.dataUrl}
              onEdit={() => openForEdit(field)}
              onRemove={() => handleRemove(field)}
            />
          ))}
          <AddTerrainCard onClick={openForCreate} />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              {draft.fields.length === 0
                ? tList("hintEmpty")
                : tList(
                    draft.fields.length > 1 ? "hintCountPlural" : "hintCount",
                    { count: draft.fields.length },
                  )}
            </p>
            {incompleteFields.length > 0 ? (
              <p className="text-xs text-destructive">
                {tList("incompleteHint", {
                  names: incompleteFields
                    .map((f) => `« ${f.name || "—"} »`)
                    .join(", "),
                })}
              </p>
            ) : null}
          </div>
          <Button
            type="button"
            size="lg"
            className="rounded-full"
            disabled={!canContinue}
            onClick={onNext}
          >
            {t("next")}
          </Button>
        </div>
      </div>

      {editorField ? (
        <TerrainEditorDialog
          open={editorOpen}
          onClose={() => setEditorOpen(false)}
          onSave={handleSave}
          onCaptureCommit={(field, capture) => {
            // Persist the new capture immediately so the terrain card image
            // refreshes even if the user closes the dialog mid-flow.
            upsertField(field, capture);
            setEditorCapture(capture);
          }}
          initial={editorField}
          capture={editorCapture}
          color={editorColor}
        />
      ) : null}

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        title={tList("confirmDeleteTitle")}
        description={
          pendingDelete
            ? tList("confirmDeleteBody", { name: pendingDelete.name })
            : undefined
        }
        confirmLabel={tList("confirmDeleteConfirm")}
        destructive
        onConfirm={confirmRemove}
      />
    </APIProvider>
  );
}
