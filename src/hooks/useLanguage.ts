"use client";

import { useEffect, useState } from "react";
import {
  detectBrowserLanguage,
  isLanguage,
  LANGUAGE_COOKIE_KEY,
  LANGUAGE_STORAGE_KEY,
  type Language,
} from "@/lib/i18n";

function writeLanguageCookie(language: Language) {
  document.cookie = `${LANGUAGE_COOKIE_KEY}=${language}; path=/; max-age=31536000; SameSite=Lax`;
}

export function useLanguage() {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    const savedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);

    if (isLanguage(savedLanguage)) {
      setLanguageState(savedLanguage);
      writeLanguageCookie(savedLanguage);
      return;
    }

    const detectedLanguage = detectBrowserLanguage();

    setLanguageState(detectedLanguage);
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, detectedLanguage);
    writeLanguageCookie(detectedLanguage);
  }, []);

  function setLanguage(nextLanguage: Language) {
    setLanguageState(nextLanguage);
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    writeLanguageCookie(nextLanguage);
  }

  return {
    language,
    setLanguage,
    isDutch: language === "nl",
    isEnglish: language === "en",
  };
}