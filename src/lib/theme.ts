import { useEffect, useState } from "react";

export type Theme = "dark" | "light";

const STORAGE_KEY = "stagekit:theme";

export function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "dark" || stored === "light") return stored;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset["theme"] = theme;
}

/**
 * Script inline (ver src/routes/__root.tsx) já aplica o tema certo antes da
 * hidratação, pra não piscar — este hook só assume o que já está no DOM e
 * passa a controlar as trocas depois disso.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() =>
    typeof document === "undefined"
      ? "light"
      : (document.documentElement.dataset["theme"] as Theme) || getInitialTheme(),
  );

  useEffect(() => {
    applyTheme(theme);
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  function toggleTheme() {
    setThemeState((t) => (t === "dark" ? "light" : "dark"));
  }

  return { theme, setTheme: setThemeState, toggleTheme };
}

/** Script injetado no <head> para setar data-theme antes do primeiro paint. */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${STORAGE_KEY}");if(t!=="dark"&&t!=="light"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}document.documentElement.dataset.theme=t;}catch(e){}})();`;
