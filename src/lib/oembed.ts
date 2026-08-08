/**
 * Metadados básicos (só título) de um link de música via oEmbed público —
 * sem chave de API, sem OAuth. YouTube e Spotify suportam CORS direto do
 * navegador; Deezer não tem oEmbed público, então fica de fora.
 */
export type TrackMeta = { title: string; author?: string | undefined };

function isYouTube(url: string) {
  return /youtu\.?be/i.test(url);
}

function isSpotify(url: string) {
  return /open\.spotify\.com/i.test(url);
}

/** "Música - Fulano" ou "Fulano - Música" (convenção mais comum no YouTube/Spotify). */
function splitTitleArtist(raw: string, fallbackAuthor?: string): TrackMeta {
  const cleaned = raw.replace(/\(official.*?\)|\[official.*?\]/gi, "").trim();
  const parts = cleaned.split(/\s+-\s+/);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    // Heurística: no YouTube costuma vir "Artista - Música"; usamos o
    // author_name da API quando disponível pra decidir o lado certo.
    if (fallbackAuthor && parts[0].toLowerCase().includes(fallbackAuthor.toLowerCase())) {
      return { title: parts.slice(1).join(" - ").trim(), author: fallbackAuthor };
    }
    return { title: parts.slice(1).join(" - ").trim(), author: parts[0].trim() };
  }
  return { title: cleaned, author: fallbackAuthor };
}

export async function fetchTrackMeta(url: string): Promise<TrackMeta | null> {
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    if (isYouTube(trimmed)) {
      const res = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(trimmed)}&format=json`,
      );
      if (!res.ok) return null;
      const data = (await res.json()) as { title?: string; author_name?: string };
      if (!data.title) return null;
      return splitTitleArtist(data.title, data.author_name);
    }
    if (isSpotify(trimmed)) {
      const res = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(trimmed)}`);
      if (!res.ok) return null;
      const data = (await res.json()) as { title?: string };
      if (!data.title) return null;
      return splitTitleArtist(data.title);
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Metadados genéricos de qualquer link (matéria, YouTube, Instagram) para o
 * portfólio. YouTube tem oEmbed próprio com CORS; para o resto usamos o
 * noembed, que cobre Instagram, Vimeo, SoundCloud e afins.
 */
export type LinkMeta = {
  title: string;
  author?: string | undefined;
  thumbnail?: string | undefined;
  date?: string | undefined;
};

export async function fetchLinkMeta(url: string): Promise<LinkMeta | null> {
  const trimmed = url.trim();
  if (!trimmed) return null;
  const endpoints = isYouTube(trimmed)
    ? [`https://www.youtube.com/oembed?url=${encodeURIComponent(trimmed)}&format=json`]
    : [`https://noembed.com/embed?url=${encodeURIComponent(trimmed)}`];
  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint);
      if (!res.ok) continue;
      const data = (await res.json()) as {
        title?: string;
        author_name?: string;
        provider_name?: string;
        thumbnail_url?: string;
        upload_date?: string;
        error?: string;
      };
      if (data.error || !data.title) continue;
      return {
        title: data.title,
        author: data.author_name || data.provider_name,
        thumbnail: data.thumbnail_url,
        date: data.upload_date?.slice(0, 10),
      };
    } catch {
      // tenta o próximo endpoint
    }
  }
  return null;
}
