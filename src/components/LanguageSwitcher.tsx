import { Globe } from "lucide-react";
import { useLocale } from "@/hooks/useLocale";
import { SUPPORTED_LANGUAGES } from "@/lib/supportedLanguages";

type LanguageSwitcherProps = {
  className?: string;
  mode?: "ui" | "translation";
};

// English first, then every RinVita language by its own name (e.g. "Français — French").
const options = [...SUPPORTED_LANGUAGES].sort((a, b) => (a.code === "en" ? -1 : b.code === "en" ? 1 : a.name.localeCompare(b.name)));

const LanguageSwitcher = ({ className = "", mode = "ui" }: LanguageSwitcherProps) => {
  const { locale, setLocale, setTranslationLocale, translationLocale } = useLocale();
  const active = mode === "translation" ? translationLocale : locale;
  const change = mode === "translation" ? setTranslationLocale : setLocale;

  return (
    <label className={`relative inline-flex items-center rounded-lg border border-border bg-card ${className}`.trim()}>
      <Globe className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-muted-foreground" aria-hidden />
      <span className="sr-only">{mode === "translation" ? "Translation language" : "Language"}</span>
      <select
        value={active}
        onChange={(e) => void change(e.target.value)}
        className="appearance-none bg-transparent py-1.5 pl-8 pr-8 text-xs text-foreground focus:outline-none cursor-pointer"
      >
        {options.map((l) => (
          <option key={l.code} value={l.code}>
            {l.nativeName && l.nativeName !== l.name ? `${l.nativeName} — ${l.name}` : l.name}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-2.5 text-[10px] text-muted-foreground" aria-hidden>▾</span>
    </label>
  );
};

export default LanguageSwitcher;
