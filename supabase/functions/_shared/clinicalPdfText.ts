/** Preserve explicit allergy reaction in every summary bullet. Never infer a reaction. */
export function allergySummaryText(allergy: { substance: string; severity?: string | null; reaction?: string | null }) {
  return [allergy.substance, allergy.severity && `(${allergy.severity})`, allergy.reaction].filter(Boolean).join(" · ");
}