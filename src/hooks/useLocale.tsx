import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { defaultLocale, isLocale, isLocaleLoaded, isRtlLocale, loadLocale, translate, type Locale } from "@/lib/i18n";

type LocaleContextType = {
  isRTL: boolean;
  locale: Locale;
  translationLocale: Locale;
  setLocale: (nextLocale: Locale) => Promise<void>;
  setTranslationLocale: (nextLocale: Locale) => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
};

const STORAGE_KEY = "rinvita-ui-locale";

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

const getInitialLocale = (): Locale => {
  if (typeof window === "undefined") return defaultLocale;

  const storedLocale = window.localStorage.getItem(STORAGE_KEY);
  if (isLocale(storedLocale)) return storedLocale;

  // English unless the person has chosen another language.
  return defaultLocale;
};

export const LocaleProvider = ({ children }: { children: ReactNode }) => {
  const { profile, refreshProfile, user } = useAuth();
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);
  const [translationLocale, setTranslationLocaleState] = useState<Locale>(getInitialLocale);

  useEffect(() => {
    if (isLocale(profile?.preferred_ui_language) && profile.preferred_ui_language !== locale) {
      setLocaleState(profile.preferred_ui_language);
    }
    if (isLocale(profile?.preferred_translation_language) && profile.preferred_translation_language !== translationLocale) {
      setTranslationLocaleState(profile.preferred_translation_language);
    }
  }, [locale, profile?.preferred_translation_language, profile?.preferred_ui_language, translationLocale]);

  // Languages other than English and Arabic load on demand; re-render once they arrive.
  const [, setLoadedTick] = useState(0);
  useEffect(() => {
    if (isLocaleLoaded(locale)) return;
    let alive = true;
    void loadLocale(locale).then(() => { if (alive) setLoadedTick((n) => n + 1); });
    return () => { alive = false; };
  }, [locale]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const direction = isRtlLocale(locale) ? "rtl" : "ltr";
    document.documentElement.lang = locale;
    document.documentElement.dir = direction;
    document.body.dir = direction;
    window.localStorage.setItem(STORAGE_KEY, locale);
  }, [locale]);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => translate(locale, key, params),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale, isLocaleLoaded(locale)],
  );

  const setLocale = useCallback(
    async (nextLocale: Locale) => {
      if (nextLocale === locale) return;

      await loadLocale(nextLocale);
      setLocaleState(nextLocale);

      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({ preferred_ui_language: nextLocale, preferred_translation_language: nextLocale } as never)
        .eq("id", user.id);

      if (error) {
        toast.error(translate(nextLocale, "settings.languageSaveError"));
        return;
      }

      await refreshProfile();
    },
    [locale, refreshProfile, user],
  );

  const setTranslationLocale = useCallback(
    async (nextLocale: Locale) => {
      if (nextLocale === translationLocale) return;

      setTranslationLocaleState(nextLocale);

      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({ preferred_translation_language: nextLocale } as never)
        .eq("id", user.id);

      if (error) {
        toast.error(translate(locale, "settings.languageSaveError"));
        return;
      }

      await refreshProfile();
    },
    [locale, refreshProfile, translationLocale, user],
  );

  const value = useMemo(
    () => ({ isRTL: isRtlLocale(locale), locale, setLocale, setTranslationLocale, t, translationLocale }),
    [locale, setLocale, setTranslationLocale, t, translationLocale],
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