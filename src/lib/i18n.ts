export type Language = "en" | "nl";

export const LANGUAGE_STORAGE_KEY = "poolr-language";
export const LANGUAGE_COOKIE_KEY = "poolr-language";

export function isLanguage(value: string | null | undefined): value is Language {
  return value === "en" || value === "nl";
}

export function detectBrowserLanguage(): Language {
  if (typeof window === "undefined") {
    return "en";
  }

  const browserLanguage = window.navigator.language.toLowerCase();
  const browserLanguages = window.navigator.languages.map((language) =>
    language.toLowerCase()
  );

  const prefersDutch =
    browserLanguage.startsWith("nl") ||
    browserLanguages.some((language) => language.startsWith("nl"));

  return prefersDutch ? "nl" : "en";
}

export function getLanguageFromCookieValue(value: string | null | undefined) {
  return isLanguage(value) ? value : "en";
}