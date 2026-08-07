import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { searchAddress, type PlaceSuggestion } from "@/lib/geocoding";

/**
 * Campo de endereço com busca (Nominatim/OpenStreetMap) — digita o nome do
 * local ou rua, escolhe uma sugestão, e endereço/cidade/UF entram sozinhos.
 * Continua editável à mão depois, não é obrigatório usar a busca.
 */
export function AddressSearchField({
  value,
  onChange,
  onSelect,
}: {
  value: string;
  onChange: (v: string) => void;
  onSelect: (place: PlaceSuggestion) => void;
}) {
  const [results, setResults] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 3) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const found = await searchAddress(value);
      setResults(found);
      setLoading(false);
      setOpen(found.length > 0);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  function pick(place: PlaceSuggestion) {
    onSelect(place);
    setOpen(false);
    setResults([]);
  }

  return (
    <div className="space-y-2">
      <Label>Endereço completo</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <div className="relative">
            <MapPin className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            {loading ? (
              <Loader2 className="absolute right-2.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            ) : null}
            <Input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onFocus={() => results.length > 0 && setOpen(true)}
              placeholder="Digite o nome do local ou a rua — casa de shows, bar, teatro..."
              className="pl-8 pr-8"
            />
          </div>
        </PopoverAnchor>
        <PopoverContent
          align="start"
          className="w-[--radix-popover-trigger-width] p-1"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <ul className="max-h-64 overflow-y-auto">
            {results.map((place, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => pick(place)}
                  className="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
                >
                  {place.label}
                </button>
              </li>
            ))}
          </ul>
        </PopoverContent>
      </Popover>
      <p className="text-xs text-muted-foreground">Usado para abrir a rota no mapa.</p>
    </div>
  );
}
