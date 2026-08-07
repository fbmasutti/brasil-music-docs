export type PlaceSuggestion = {
  label: string;
  fullAddress: string;
  city: string;
  state: string;
};

function stateAbbreviation(state: string | undefined): string {
  const map: Record<string, string> = {
    Acre: "AC",
    Alagoas: "AL",
    Amapá: "AP",
    Amazonas: "AM",
    Bahia: "BA",
    Ceará: "CE",
    "Distrito Federal": "DF",
    "Espírito Santo": "ES",
    Goiás: "GO",
    Maranhão: "MA",
    "Mato Grosso": "MT",
    "Mato Grosso do Sul": "MS",
    "Minas Gerais": "MG",
    Pará: "PA",
    Paraíba: "PB",
    Paraná: "PR",
    Pernambuco: "PE",
    Piauí: "PI",
    "Rio de Janeiro": "RJ",
    "Rio Grande do Norte": "RN",
    "Rio Grande do Sul": "RS",
    Rondônia: "RO",
    Roraima: "RR",
    "Santa Catarina": "SC",
    "São Paulo": "SP",
    Sergipe: "SE",
    Tocantins: "TO",
  };
  return (state && map[state]) || state || "";
}

/**
 * Busca de endereços via Nominatim (OpenStreetMap) — pública, sem chave de
 * API. Evita depender do Google Places (que exige faturamento habilitado)
 * só pra sugerir endereço de show.
 */
export async function searchAddress(query: string): Promise<PlaceSuggestion[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  const params = new URLSearchParams({
    format: "jsonv2",
    addressdetails: "1",
    limit: "5",
    countrycodes: "br",
    q,
  });
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as Array<{
      display_name: string;
      address?: Record<string, string>;
    }>;
    return data.map((d) => ({
      label: d.display_name,
      fullAddress: d.display_name,
      city: d.address?.["city"] || d.address?.["town"] || d.address?.["municipality"] || "",
      state: stateAbbreviation(d.address?.["state"]),
    }));
  } catch {
    return [];
  }
}
