// Referral codes, such as SNYDER30 for patients referred by Snyder Patient Advocacy.
// A link with ?code=SNYDER30 remembers the code on this device; checkout applies it.
// Patients can also type a code at checkout.
const KEY = "rinvita.promoCode";
const VALID = /^[A-Z0-9]{3,20}$/;

export function capturePromoCode(search: string) {
  try {
    const code = new URLSearchParams(search).get("code")?.trim().toUpperCase();
    if (code && VALID.test(code)) localStorage.setItem(KEY, code);
  } catch { /* storage unavailable */ }
}
export function readPromoCode(): string | null {
  try {
    const code = localStorage.getItem(KEY);
    return code && VALID.test(code) ? code : null;
  } catch { return null; }
}
