import { describe, it, expect } from "vitest";
import { shouldShowEndOfPilot, type PilotStatus } from "@/hooks/usePilotStatus";

const base: PilotStatus = { enabled: true, pilot_patient: true, partner: "Synthetic Partner", ended: true, ending_soon: false, paid: false, choice: null, deletion_status: null };

describe("end-of-pilot screen", () => {
  it("shows once the pilot has ended and the patient hasn't chosen", () => expect(shouldShowEndOfPilot(base)).toBe(true));
  it("shows in the last 14 days before the end", () => expect(shouldShowEndOfPilot({ ...base, ended: false, ending_soon: true })).toBe(true));
  it("stays hidden while the switch is off", () => expect(shouldShowEndOfPilot({ ...base, enabled: false })).toBe(false));
  it("stays hidden for patients who didn't join through a partner", () => expect(shouldShowEndOfPilot({ enabled: true, pilot_patient: false })).toBe(false));
  it("stays hidden once the patient is on their own paid plan", () => expect(shouldShowEndOfPilot({ ...base, paid: true })).toBe(false));
  it("stays hidden after choosing free", () => expect(shouldShowEndOfPilot({ ...base, choice: "free" })).toBe(false));
  it("keeps showing after choosing paid until checkout succeeds", () => expect(shouldShowEndOfPilot({ ...base, choice: "paid" })).toBe(true));
  it("stays hidden while a closure is in progress", () => expect(shouldShowEndOfPilot({ ...base, deletion_status: "failed" })).toBe(false));
  it("stays hidden if the backend doesn't have it yet", () => expect(shouldShowEndOfPilot(null)).toBe(false));
});
