// Fictional data for the partner admin demo (/demo/partner-admin).
// Everything here is invented for demonstration. Nothing is read from or written to live services.

export const CASE_STAGES = ["Enquiry", "Quote received", "Booked", "Treated", "Home"] as const;
export type CaseStage = (typeof CASE_STAGES)[number];
export type SignupStatus = "Invited" | "Joined";

export interface DemoCase {
  id: string;
  name: string;
  email: string;
  status: SignupStatus;
  invitedDaysAgo: number;
  joinedDaysAgo: number | null;
  lastActiveDaysAgo: number | null;
  stage: CaseStage;
  next: string;
  nextInDays: number | null; // negative = overdue, 0 = today
  treatment: string;
  isEleanor?: boolean;
}

export const DEMO_BRANDS: Record<string, { name: string; logo: string }> = {
  kixa: { name: "KIXA", logo: "/partners/kixa.png" },
  medvoyage: { name: "MedVoyage Global", logo: "/partners/medvoyage.png" },
  tmcg: { name: "TMCG", logo: "/partners/tmcg.png" },
  health4travel: { name: "Health4Travel", logo: "/partners/health4travel.png" },
};

export const DEMO_CASES: DemoCase[] = [
  { id: "c1", name: "Eleanor Morgan", email: "eleanor.morgan@example.com", status: "Joined", invitedDaysAgo: 21, joinedDaysAgo: 20, lastActiveDaysAgo: 1, stage: "Booked", next: "Confirm admission time with the hospital", nextInDays: 0, treatment: "Endocrinology review", isEleanor: true },
  { id: "c2", name: "Omar Haddad", email: "o.haddad@example.com", status: "Joined", invitedDaysAgo: 14, joinedDaysAgo: 13, lastActiveDaysAgo: 2, stage: "Quote received", next: "Send quote to patient for approval", nextInDays: -1, treatment: "Knee replacement" },
  { id: "c3", name: "Layla Nasser", email: "layla.n@example.com", status: "Joined", invitedDaysAgo: 9, joinedDaysAgo: 9, lastActiveDaysAgo: 0, stage: "Enquiry", next: "Request quotes from two hospitals", nextInDays: 1, treatment: "Cardiology second opinion" },
  { id: "c4", name: "Yusuf Al-Rashid", email: "yusuf.r@example.com", status: "Invited", invitedDaysAgo: 4, joinedDaysAgo: null, lastActiveDaysAgo: null, stage: "Enquiry", next: "Resend invitation if not joined", nextInDays: 2, treatment: "Spinal surgery" },
  { id: "c5", name: "Mariam Saleh", email: "m.saleh@example.com", status: "Joined", invitedDaysAgo: 40, joinedDaysAgo: 39, lastActiveDaysAgo: 6, stage: "Treated", next: "Check discharge letter has reached her home doctor", nextInDays: 3, treatment: "Oncology treatment" },
  { id: "c6", name: "Ahmed Karim", email: "ahmed.k@example.com", status: "Joined", invitedDaysAgo: 75, joinedDaysAgo: 74, lastActiveDaysAgo: 31, stage: "Home", next: "", nextInDays: null, treatment: "Cataract surgery" },
  { id: "c7", name: "Noor Abbas", email: "noor.abbas@example.com", status: "Invited", invitedDaysAgo: 1, joinedDaysAgo: null, lastActiveDaysAgo: null, stage: "Enquiry", next: "", nextInDays: null, treatment: "IVF consultation" },
];

export interface DemoActivity { daysAgo: number; time: string; text: string; detail: string }

/** What a patient sees in their own "Account activity" section (example entries). */
export const DEMO_PATIENT_ACTIVITY: DemoActivity[] = [
  { daysAgo: 1, time: "16:42", text: "Your shared link was opened", detail: "Opened by the recipient at Example City Hospital (view only)" },
  { daysAgo: 1, time: "09:15", text: "You shared your records", detail: "Health brief, 3 documents and 1 scan · link expires in 7 days" },
  { daysAgo: 3, time: "18:03", text: "You downloaded your health brief", detail: "Full health brief (PDF), with originals" },
  { daysAgo: 6, time: "11:20", text: "Records received from a hospital", detail: "Example City Hospital uploaded 2 documents through your records request" },
  { daysAgo: 20, time: "14:07", text: "Account created", detail: "Joined RinVita through an invitation from your care coordinator" },
];

export const DAY_MS = 86_400_000;

export function daysAgoLabel(days: number | null, now = Date.now()): string {
  if (days === null) return "—";
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return new Date(now - days * DAY_MS).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function dueLabel(days: number | null, now = Date.now()): string {
  if (days === null) return "";
  if (days < 0) return `Overdue by ${-days} day${days === -1 ? "" : "s"}`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due ${new Date(now + days * DAY_MS).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;
}

export function caseStats(cases: DemoCase[]) {
  return {
    invited: cases.length,
    joined: cases.filter((c) => c.status === "Joined").length,
    active: cases.filter((c) => c.lastActiveDaysAgo !== null && c.lastActiveDaysAgo <= 30).length,
    booked: cases.filter((c) => ["Booked", "Treated", "Home"].includes(c.stage)).length,
  };
}

/** Cases with a next step due today or earlier, most overdue first. */
export function needsAction(cases: DemoCase[]): DemoCase[] {
  return cases.filter((c) => c.next && c.nextInDays !== null && c.nextInDays <= 0)
    .sort((a, b) => (a.nextInDays ?? 0) - (b.nextInDays ?? 0));
}
