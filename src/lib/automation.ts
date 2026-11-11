// Spots automated browsers (test robots, headless browsers, crawlers) so they don't count as
// visitors and can't create accounts. Real people's browsers never set these.
const AUTOMATED_UA = /HeadlessChrome|Headless|PhantomJS|Puppeteer|Playwright|Selenium|Cypress|bot\b|crawler|spider|curl\/|python-requests|Go-http-client/i;

export function isAutomatedBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  try {
    if ((navigator as Navigator & { webdriver?: boolean }).webdriver) return true;
    return AUTOMATED_UA.test(navigator.userAgent || "");
  } catch {
    return false;
  }
}

// Throwaway and test inboxes. The database refuses these too; this gives a clear message first.
export const BLOCKED_EMAIL_DOMAINS = [
  "mailosaur.net", "example.com", "example.org", "example.net", "yopmail.com", "mailinator.com",
  "guerrillamail.com", "sharklasers.com", "10minutemail.com", "temp-mail.org", "tempmail.com",
  "trashmail.com", "dispostable.com", "getnada.com", "maildrop.cc", "throwawaymail.com", "mailnesia.com",
];

export function isBlockedEmail(email: string): boolean {
  const domain = email.trim().toLowerCase().split("@")[1] || "";
  return BLOCKED_EMAIL_DOMAINS.some((d) => domain === d || domain.endsWith(`.${d}`));
}
