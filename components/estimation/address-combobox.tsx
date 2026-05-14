"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Loader2, MapPin } from "lucide-react";
import type { SelectedPlace } from "@/components/estimation/places-autocomplete";

interface AddressComboboxProps {
  defaultValue?: string;
  placeholder?: string;
  onSelect: (place: SelectedPlace) => void;
}

const QUEBEC_BOUNDS = {
  north: 62.6,
  south: 44.9,
  east: -57.1,
  west: -79.7,
};

interface SuggestionRow {
  placeId: string;
  primary: string;
  secondary: string;
  prediction: google.maps.places.PlacePrediction;
}

export function AddressCombobox({
  defaultValue,
  placeholder,
  onSelect,
}: AddressComboboxProps) {
  const id = useId();
  const placesLib = useMapsLibrary("places");
  const sessionTokenRef =
    useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const latestQueryRef = useRef("");
  const containerRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState(defaultValue ?? "");
  const [suggestions, setSuggestions] = useState<SuggestionRow[]>([]);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState<number>(-1);
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);

  // Renew the autocomplete session on first load.
  useEffect(() => {
    if (!placesLib || sessionTokenRef.current) return;
    sessionTokenRef.current = new placesLib.AutocompleteSessionToken();
  }, [placesLib]);

  // Debounced suggestion fetch.
  useEffect(() => {
    if (!placesLib) return;
    if (query.trim().length < 3) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    latestQueryRef.current = query;
    setLoading(true);
    const debounce = setTimeout(async () => {
      try {
        const result =
          await placesLib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
            input: query,
            includedRegionCodes: ["ca"],
            locationBias: QUEBEC_BOUNDS,
            sessionToken: sessionTokenRef.current ?? undefined,
          });
        if (latestQueryRef.current !== query) return;

        const rows: SuggestionRow[] = result.suggestions
          .filter((s): s is { placePrediction: google.maps.places.PlacePrediction } =>
            Boolean(s.placePrediction),
          )
          .slice(0, 5)
          .map((s) => {
            const p = s.placePrediction;
            const text = p.text?.toString() ?? "";
            const main = p.mainText?.toString() ?? text;
            const secondary = p.secondaryText?.toString() ?? "";
            return {
              placeId: p.placeId,
              primary: main || text,
              secondary,
              prediction: p,
            };
          });
        setSuggestions(rows);
        setOpen(true);
        setHighlight(rows.length > 0 ? 0 : -1);
      } catch {
        // ignore — keep existing suggestions
      } finally {
        if (latestQueryRef.current === query) setLoading(false);
      }
    }, 250);
    return () => clearTimeout(debounce);
  }, [query, placesLib]);

  // Close dropdown when clicking outside.
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (containerRef.current.contains(e.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  async function selectSuggestion(row: SuggestionRow) {
    if (!placesLib) return;
    setResolving(true);
    try {
      const place = row.prediction.toPlace();
      await place.fetchFields({
        fields: ["formattedAddress", "location", "id"],
      });
      if (!place.location || !place.formattedAddress) return;
      sessionTokenRef.current = new placesLib.AutocompleteSessionToken();
      const address = place.formattedAddress;
      setQuery(address);
      setOpen(false);
      setSuggestions([]);
      onSelect({
        address,
        lat: place.location.lat(),
        lng: place.location.lng(),
        placeId: place.id ?? row.placeId,
      });
    } finally {
      setResolving(false);
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight(
        (h) => (h - 1 + suggestions.length) % suggestions.length,
      );
    } else if (e.key === "Enter" && highlight >= 0) {
      e.preventDefault();
      const row = suggestions[highlight];
      if (row) void selectSuggestion(row);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const showDropdown = open && (loading || suggestions.length > 0);

  return (
    <div ref={containerRef} className="relative">
      <Input
        type="text"
        value={query}
        placeholder={placeholder}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true);
        }}
        onKeyDown={onKeyDown}
        autoComplete="off"
        spellCheck={false}
        role="combobox"
        aria-expanded={showDropdown}
        aria-controls={`${id}-listbox`}
        aria-autocomplete="list"
        aria-activedescendant={
          highlight >= 0 ? `${id}-option-${highlight}` : undefined
        }
        className={cn(
          "bg-input transition-[border-radius]",
          showDropdown && "rounded-b-none border-b-transparent",
        )}
      />

      {/* Loading indicator inside the input on the right */}
      {(loading || resolving) && (
        <Loader2
          size={14}
          className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground pointer-events-none"
        />
      )}

      {showDropdown ? (
        <ul
          id={`${id}-listbox`}
          role="listbox"
          className="absolute top-full left-0 right-0 z-[60] bg-popover rounded-b-md ring-1 ring-foreground/10 shadow-2xl overflow-hidden py-1 max-h-80 overflow-y-auto"
        >
          {suggestions.length === 0 && loading ? (
            <li className="px-4 py-3.5 text-sm text-muted-foreground inline-flex items-center gap-2">
              <Loader2 size={12} className="animate-spin" />
              Recherche…
            </li>
          ) : (
            suggestions.map((row, i) => {
              const isHighlighted = i === highlight;
              return (
                <li
                  key={row.placeId}
                  id={`${id}-option-${i}`}
                  role="option"
                  aria-selected={isHighlighted}
                >
                  <button
                    type="button"
                    onMouseEnter={() => setHighlight(i)}
                    onClick={() => void selectSuggestion(row)}
                    className={cn(
                      "w-full text-left px-4 py-3 flex items-center gap-3 transition cursor-pointer",
                      isHighlighted ? "bg-foreground/5" : "hover:bg-foreground/5",
                    )}
                  >
                    <MapPin
                      size={16}
                      className="shrink-0 text-muted-foreground"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-foreground truncate">
                        {row.primary}
                      </span>
                      {row.secondary ? (
                        <span className="block text-xs text-muted-foreground truncate mt-0.5">
                          {row.secondary}
                        </span>
                      ) : null}
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      ) : null}
    </div>
  );
}
