import { useProfile } from "./queries";

export type Activity = "shows" | "aulas";

export const ACTIVITY_OPTIONS: { value: Activity; label: string; hint: string }[] = [
  { value: "shows", label: "Shows", hint: "Toco em shows, eventos e casas de show." },
  { value: "aulas", label: "Aulas", hint: "Dou aula de música, particular ou em escola." },
];

/**
 * O que o usuário faz — decide a forma do app inteiro: menu, painel e abas
 * do financeiro. Quem só dá aula não vê rider, formação nem mala de gig.
 *
 * O padrão é `shows` porque é o comportamento de quem já usava o produto
 * antes desta coluna existir: ninguém deve perder tela por causa de um campo
 * novo que nunca respondeu.
 */
export function useActivities() {
  const { data: profile } = useProfile();
  const raw = profile?.activities;
  const activities: Activity[] =
    Array.isArray(raw) && raw.length > 0 ? (raw as Activity[]) : ["shows"];

  const doesShows = activities.includes("shows");
  const doesTeaching = activities.includes("aulas");

  return {
    activities,
    doesShows,
    doesTeaching,
    /** Só dá aula: usado para escolher aba inicial e texto de cabeçalho. */
    teachesOnly: doesTeaching && !doesShows,
    /** Faz os dois: a agenda precisa mesclar shows e aulas. */
    doesBoth: doesShows && doesTeaching,
  };
}
