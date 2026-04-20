import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { defaultLocale, isLocale, translate, type Locale } from "@/lib/i18n";

type LocaleContextType = {
  isRTL: boolean;
  locale: Locale;
  setLocale: (nextLocale: Locale) => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
};

const STORAGE_KEY = "rinvita-ui-locale";

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

const getInitialLocale = (): Locale => {
  if (typeof window === "undefined") return defaultLocale;

  const storedLocale = window.localStorage.getItem(STORAGE_KEY);
  if (isLocale(storedLocale)) return storedLocale;

  return window.navigator.language.toLowerCase().startsWith("ar") ? "ar" : defaultLocale;
};

export const LocaleProvider = ({ children }: { children: ReactNode }) => {
  const { profile, refreshProfile, user } = useAuth();
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  useEffect(() => {
    if (isLocale(profile?.preferred_ui_language) && profile.preferred_ui_language !== locale) {
      setLocaleState(profile.preferred_ui_language);
    }
  }, [locale, profile?.preferred_ui_language]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const direction = locale === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = locale;
    document.documentElement.dir = direction;
    document.body.dir = direction;
    window.localStorage.setItem(STORAGE_KEY, locale);
  }, [locale]);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => translate(locale, key, params),
    [locale],
  );

  const setLocale = useCallback(
    async (nextLocale: Locale) => {
      if (nextLocale === locale) return;

      setLocaleState(nextLocale);

      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({ preferred_ui_language: nextLocale } as never)
        .eq("id", user.id);

      if (error) {
        toast.error(translate(nextLocale, "settings.languageSaveError"));
        return;
      }

      await refreshProfile();
    },
    [locale, refreshProfile, user],
  );

  const value = useMemo(
    () => ({ isRTL: locale === "ar", locale, setLocale, t }),
    [locale, setLocale, t],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
};

export const useLocale = () => {
  const context = useContext(LocaleContext);

  if (!context) {
    throw new Error("useLocale must be used within LocaleProvider");
  }

  return context;
};