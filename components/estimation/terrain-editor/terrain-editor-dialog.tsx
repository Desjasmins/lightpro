"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FieldValues, GeoPoint } from "@/lib/estimation/schema";
import { defaultFieldConfig } from "@/lib/estimation/config-derive";
import { IdentityTab } from "./identity-tab";
import { PerimeterTab } from "./perimeter-tab";
import { PolesTab } from "./poles-tab";
import { ConfigurationTab } from "./configuration-tab";
import {
  Check,
  MapPin,
  Pencil,
  Pin,
  Settings,
  X,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

export type EditorTab = "identity" | "perimeter" | "poles" | "configuration";

interface TerrainEditorDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (field: FieldValues) => void;
  /**
   * Called when the in-dialog field changes (e.g. user freezes the view in
   * the Identity tab) so the parent draft can reflect the change immediately
   * even before the final save.
   */
  onChangeCommit?: (field: FieldValues) => void;
  initial: FieldValues;
  /** Color used for polygon + markers (per-terrain). */
  color: string;
}

const TAB_ORDER: EditorTab[] = [
  "identity",
  "perimeter",
  "poles",
  "configuration",
];

export function TerrainEditorDialog({
  open,
  onClose,
  onSave,
  onChangeCommit,
  initial,
  color,
}: TerrainEditorDialogProps) {
  const t = useTranslations("TerrainEditor");
  const [tab, setTab] = useState<EditorTab>("identity");
  const [field, setField] = useState<FieldValues>(initial);

  // Reset state ONLY when the dialog transitions to open.
  useEffect(() => {
    if (open) {
      setField(initial);
      setTab("identity");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Lock background scroll while the dialog is open.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  // When the user reaches the configuration tab without an existing config,
  // seed it with sensible defaults so all 4 options are visibly pre-selected.
  useEffect(() => {
    if (tab !== "configuration") return;
    if (field.config) return;
    setField((f) => ({ ...f, config: defaultFieldConfig() }));
  }, [tab, field.config]);

  if (!open) return null;

  function patch(p: Partial<FieldValues>) {
    setField((f) => {
      const next = { ...f, ...p };
      // Optimistically commit identity-tab changes (lockedZoom, address, …)
      // so the parent terrain card thumbnail updates as the user works.
      onChangeCommit?.(next);
      return next;
    });
  }

  const isIdentityValid =
    field.name.trim().length >= 2 &&
    field.address.trim().length >= 5 &&
    field.lat !== 0 &&
    field.lng !== 0 &&
    field.lockedZoom != null;
  const isPerimeterValid =
    (field.perimeter?.length ?? 0) >= 3 && field.surfaceM2 > 0;
  const isPolesValid = field.poles.length >= 1;
  const isConfigValid = Boolean(field.config);

  const tabs: {
    id: EditorTab;
    label: string;
    sublabel: string;
    icon: React.ReactNode;
    valid: boolean;
  }[] = [
    {
      id: "identity",
      label: t("tabs.identity"),
      sublabel: t("tabs.identitySublabel"),
      icon: <Pencil size={14} />,
      valid: isIdentityValid,
    },
    {
      id: "perimeter",
      label: t("tabs.perimeter"),
      sublabel: t("tabs.perimeterSublabel"),
      icon: <MapPin size={14} />,
      valid: isPerimeterValid,
    },
    {
      id: "poles",
      label: t("tabs.poles"),
      sublabel: t("tabs.polesSublabel"),
      icon: <Pin size={14} />,
      valid: isPolesValid,
    },
    {
      id: "configuration",
      label: t("tabs.configuration"),
      sublabel: t("tabs.configurationSublabel"),
      icon: <Settings size={14} />,
      valid: isConfigValid,
    },
  ];

  const currentTabIndex = TAB_ORDER.indexOf(tab);
  const isFirstTab = currentTabIndex === 0;
  const isLastTab = currentTabIndex === TAB_ORDER.length - 1;
  const currentTabValid = tabs[currentTabIndex]!.valid;

  function handlePrev() {
    if (isFirstTab) return;
    setTab(TAB_ORDER[currentTabIndex - 1]!);
  }

  function handleNext() {
    if (!currentTabValid) return;
    if (isLastTab) {
      onSave(field);
      return;
    }
    setTab(TAB_ORDER[currentTabIndex + 1]!);
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col">
      <header className="flex items-center gap-4 px-4 py-3 border-b border-white/10 bg-black shrink-0">
        <div className="flex items-center gap-2 min-w-0 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Fermer"
            className="text-white/70 hover:text-white"
          >
            <X size={18} />
          </Button>
          <h2 className="text-sm font-medium truncate text-white max-w-[160px] hidden md:block">
            {field.name || t("newField")}
          </h2>
        </div>

        <nav
          role="tablist"
          className="flex items-center gap-1 flex-1 justify-center overflow-x-auto"
        >
          {tabs.map((t, i) => {
            const active = t.id === tab;
            const canJump = t.valid || i <= currentTabIndex;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => canJump && setTab(t.id)}
                disabled={!canJump}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 transition text-left shrink-0",
                  active
                    ? "bg-white text-black cursor-pointer"
                    : canJump
                      ? "text-white/70 hover:bg-white/5 hover:text-white cursor-pointer"
                      : "text-white/30 cursor-not-allowed",
                )}
              >
                <span
                  className={cn(
                    "inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-semibold shrink-0",
                    active
                      ? "bg-black text-white"
                      : t.valid
                        ? "bg-green-600 text-white"
                        : "bg-white/10 text-white",
                  )}
                >
                  {t.valid ? <Check size={11} /> : i + 1}
                </span>
                <span className="text-sm font-medium hidden sm:inline">
                  {t.label}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="default"
            className="rounded-full text-white/70 hover:text-white hidden sm:inline-flex"
            onClick={onClose}
          >
            {t("footer.cancel")}
          </Button>
          {!isFirstTab ? (
            <Button
              type="button"
              variant="outline"
              size="default"
              className="rounded-full"
              onClick={handlePrev}
            >
              <ArrowLeft size={14} className="sm:mr-1.5" />
              <span className="hidden sm:inline">{t("footer.previous")}</span>
            </Button>
          ) : null}
          <Button
            type="button"
            size="default"
            className="rounded-full"
            disabled={!currentTabValid}
            onClick={handleNext}
          >
            <span className="hidden sm:inline">
              {isLastTab ? t("footer.save") : t("footer.next")}
            </span>
            <ArrowRight size={14} className="sm:ml-1.5" />
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        {tab === "identity" ? (
          <IdentityTab
            value={field}
            onChange={patch}
            onAdvance={isIdentityValid ? handleNext : undefined}
          />
        ) : null}
        {tab === "perimeter" ? (
          <PerimeterTab value={field} onChange={patch} color={color} />
        ) : null}
        {tab === "poles" ? (
          <PolesTab value={field} onChange={patch} color={color} />
        ) : null}
        {tab === "configuration" ? (
          <ConfigurationTab value={field} onChange={patch} color={color} />
        ) : null}
      </main>
    </div>
  );
}

export function emptyField(): FieldValues {
  return {
    id: `f_${Math.random().toString(36).slice(2, 10)}`,
    name: "",
    sportType: "SOCCER",
    iesClass: "CLASS_IV",
    address: "",
    lat: 0,
    lng: 0,
    surfaceM2: 0,
    poles: [],
    perimeter: [] as GeoPoint[],
  };
}
