"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { Search } from "lucide-react";

export interface SelectedPlace {
  address: string;
  lat: number;
  lng: number;
  placeId: string;
}

interface AddressSearchBarProps {
  defaultValue?: string;
  placeholder?: string;
  /** Called silently when the typed text resolves to a real place. */
  onSelect: (place: SelectedPlace) => void;
  /** Called whenever the user types — for live iframe updates etc. */
  onQueryChange?: (value: string) => void;
  trailing?: ReactNode;
  /**
   * "standalone" = rounded pill with own border (default).
   * "embedded" = no border, sits inside a parent card.
   */
  variant?: "standalone" | "embedded";
}

const QUEBEC_BOUNDS = {
  north: 62.6,
  south: 44.9,
  east: -57.1,
  west: -79.7,
};

export function AddressSearchBar({
  defaultValue,
  placeholder,
  onSelect,
  onQueryChange,
  trailing,
  variant = "standalone",
}: AddressSearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionTokenRef =
    useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const latestQueryRef = useRef("");

  const [query, setQuery] = useState(defaultValue ?? "");
  const placesLib = useMapsLibrary("places");

  useEffect(() => {
    if (!placesLib || sessionTokenRef.current) return;
    sessionTokenRef.current = new placesLib.AutocompleteSessionToken();
  }, [placesLib]);

  // Silent autocomplete + auto-resolve first match
  useEffect(() => {
    if (!placesLib) return;
    if (query.length < 5) return;

    latestQueryRef.current = query;
    const debounce = setTimeout(async () => {
      try {
        const result =
          await placesLib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
            input: query,
            includedRegionCodes: ["ca"],
            locationBias: QUEBEC_BOUNDS,
            sessionToken: sessionTokenRef.current ?? undefined,
          });
        // Drop stale responses
        if (latestQueryRef.current !== query) return;
        const first = result.suggestions.find((s) => s.placePrediction);
        const prediction = first?.placePrediction;
        if (!prediction) return;
        const place = prediction.toPlace();
        await place.fetchFields({
          fields: ["formattedAddress", "location", "id"],
        });
        if (latestQueryRef.current !== query) return;
        if (!place.location || !place.formattedAddress) return;
        // Renew session
        sessionTokenRef.current = new placesLib.AutocompleteSessionToken();
        onSelect({
          address: place.formattedAddress,
          lat: place.location.lat(),
          lng: place.location.lng(),
          placeId: place.id ?? "",
        });
      } catch {
        // ignore failures
      }
    }, 600);
    return () => clearTimeout(debounce);
  }, [query, placesLib, onSelect]);

  const isEmbedded = variant === "embedded";

  return (
    <div
      className={
        isEmbedded
          ? "flex items-center gap-2 px-4 py-3 transition-colors"
          : "flex items-center gap-2 rounded-full border border-border bg-card/60 backdrop-blur pl-5 pr-1.5 transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30"
      }
    >
      <Search size={16} className="shrink-0 text-muted-foreground" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        placeholder={placeholder}
        onChange={(e) => {
          const v = e.target.value;
          setQuery(v);
          onQueryChange?.(v);
        }}
        className="flex-1 h-11 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
        autoComplete="off"
        spellCheck={false}
      />
      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </div>
  );
}
