import { useMemo, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

export interface CountryOption {
  code: string;
  flag_emoji: string;
  name_en: string;
  name_ar?: string;
}

interface CountryComboboxProps {
  countries: CountryOption[];
  disabled?: boolean;
  onChange: (countryCode: string) => void;
  placeholder: string;
  value: string;
}

const CountryCombobox = ({ countries, disabled = false, onChange, placeholder, value }: CountryComboboxProps) => {
  const [open, setOpen] = useState(false);

  const selectedCountry = useMemo(
    () => countries.find((country) => country.code === value) ?? null,
    [countries, value],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          disabled={disabled}
          className="h-10 w-full justify-between rounded-lg border-input bg-background px-3 text-sm font-normal text-foreground hover:bg-background"
        >
          <span className="truncate">
            {selectedCountry ? `${selectedCountry.flag_emoji} ${selectedCountry.name_en}` : placeholder}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search country..." />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            {countries.map((country) => (
              <CommandItem
                key={country.code}
                value={`${country.name_en} ${country.code} ${country.name_ar ?? ""}`}
                onSelect={() => {
                  onChange(country.code);
                  setOpen(false);
                }}
              >
                <span className="mr-2 text-base">{country.flag_emoji}</span>
                <span className="flex-1 truncate">{country.name_en}</span>
                <Check className={cn("h-4 w-4", value === country.code ? "opacity-100" : "opacity-0")} />
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default CountryCombobox;