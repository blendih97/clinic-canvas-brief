import { useLocale } from "@/hooks/useLocale";
import type { Locale } from "@/lib/i18n";

const languageOptions: { label: string; value: Locale }[] = [
  { label: "English", value: "en" },
  { label: "العربية", value: "ar" },
];

type LanguageSwitcherProps = {
  className?: string;
  mode?: "ui" | "translation";
};

const LanguageSwitcher = ({ className = "", mode = "ui" }: LanguageSwitcherProps) => {
  const { locale, setLocale, setTranslationLocale, translationLocale } = useLocale();
  const activeLocale = mode === "translation" ? translationLocale : locale;
  const handleChange = mode === "translation" ? setTranslationLocale : setLocale;

  return (
    <div className={`inline-flex items-center gap-1 rounded-lg border border-border bg-card p-1 ${className}`.trim()}>
      {languageOptions.map((option) => {
        const isActive = option.value === activeLocale;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => void handleChange(option.value)}
            className={`rounded-md px-3 py-1.5 text-xs transition-colors ${
              isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};

export default LanguageSwitcher;