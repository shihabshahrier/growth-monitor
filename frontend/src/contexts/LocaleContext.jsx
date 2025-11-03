import { createContext, useContext, useMemo, useState } from "react";
import { locales, messages } from "@/utils/translations";

const STORAGE_KEY = "gm_locale";
const LocaleContext = createContext(null);

export function LocaleProvider({ children }) {
  const [locale, setLocale] = useState(() => {
    const persisted = localStorage.getItem(STORAGE_KEY);
    if (persisted && locales[persisted]) return persisted;
    return "en";
  });

  const value = useMemo(() => {
    const translate = (key) => messages[locale]?.[key] ?? key;
    return {
      locale,
      locales,
      t: translate,
      setLocale: (next) => {
        if (locales[next]) {
          setLocale(next);
          localStorage.setItem(STORAGE_KEY, next);
        }
      },
    };
  }, [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export const useLocale = () => {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return ctx;
};
