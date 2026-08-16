import { createContext, useContext, useState } from "react";
import { translations } from "./translations";

const STORAGE_KEY = "pc-lang";
const LanguageContext = createContext(null);

function getPath(obj, path) {
  return path.split(".").reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || "sr";
    } catch {
      return "sr";
    }
  });

  const setLang = (next) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  };

  const t = (path) => {
    const value = getPath(translations[lang], path) ?? getPath(translations.sr, path);
    return value ?? path;
  };

  return <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used inside LanguageProvider");
  return ctx;
}
