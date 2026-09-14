import { describe, it, expect, vi } from "vitest";
import { hasAccess, canUploadDocument, FREE_DOC_LIMIT, FREE_LIMIT_CODE } from "@/lib/planAccess";
import { resolveWebhookEnv } from "../../supabase/functions/_shared/stripeEnv";
import { saveEnquiryAndNotify, type EnquiryClient } from "../../supabase/functions/_shared/enquiries";

describe("free document limit", () => {
  it("allows a free user up to the limit", () => {
    expect(canUploadDocument(null, 0, false)).toBe(true);
    expect(canUploadDocument(null, FREE_DOC_LIMIT - 1, false)).toBe(true);
  });

  it("blocks a free user at the limit", () => {
    expect(canUploadDocument(null, FREE_DOC_LIMIT, false)).toBe(false);
    expect(canUploadDocument(null, FREE_DOC_LIMIT + 5, false)).toBe(false);
  });

  it("never blocks a paid subscriber", () => {
    expect(canUploadDocument(null, 500, true)).toBe(true);
  });

  it("exposes the structured server code the client matches on", () => {
    expect(FREE_LIMIT_CODE).toBe("free_document_limit_reached");
  });
});

describe("paid feature gating", () => {
  const paidFeatures = ["share_brief", "export", "request_records", "request_imaging", "unlimited_uploads"] as const;

  it("denies every paid feature to a free account", () => {
    for (const f of paidFeatures) {
      expect(hasAccess(null, f, { isActive: false, planTier: "free" })).toBe(false);
    }
  });

  it("grants paid features to a standard subscriber", () => {
    for (const f of paidFeatures) {
      expect(hasAccess(null, f, { isActive: true, planTier: "standard" })).toBe(true);
    }
  });

  it("keeps family invites on the Family plan only", () => {
    expect(hasAccess(null, "family_invite", { isActive: true, planTier: "standard" })).toBe(false);
    expect(hasAccess(null, "family_invite", { isActive: true, planTier: "family" })).toBe(true);
  });

  it("ignores a stale profile plan and uses the live access state", () => {
    const staleProfile = { plan: "family" } as any;
    expect(hasAccess(staleProfile, "share_brief", { isActive: false, planTier: "free" })).toBe(false);
  });
});

describe("stripe webhook environment safety", () => {
  it("accepts only explicit environments", () => {
    expect(resolveWebhookEnv("live")).toBe("live");
    expect(resolveWebhookEnv("sandbox")).toBe("sandbox");
  });

  it("rejects missing or invalid environments instead of defaulting to sandbox", () => {
    expect(resolveWebhookEnv(null)).toBeNull();
    expect(resolveWebhookEnv("")).toBeNull();
    expect(resolveWebhookEnv("LIVE")).toBeNull();
    expect(resolveWebhookEnv("production")).toBeNull();
  });
});

describe("enquiry pipeline", () => {
  const input = { name: "Dr Test", email: "dr@example.com", organisation: "Clinic", origin: "clinics" };

  function client(opts: { insertError?: string; emailThrows?: boolean }): EnquiryClient {
    return {
      from: () => ({
        insert: async () => ({ error: opts.insertError ? { message: opts.insertError } : null }),
      }),
      functions: {
        invoke: async () => {
          if (opts.emailThrows) throw new Error("email down");
          return { error: null };
        },
      },
    };
  }

  it("saves and notifies on the happy path", async () => {
    const result = await saveEnquiryAndNotify(client({}), input);
    expect(result).toMatchObject({ saved: true, notified: true });
  });

  it("still reports success when the notification fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await saveEnquiryAndNotify(client({ emailThrows: true }), input);
    expect(result.saved).toBe(true);
    expect(result.notified).toBe(false);
  });

  it("reports failure when the enquiry cannot be saved", async () => {
    const result = await saveEnquiryAndNotify(client({ insertError: "db down" }), input);
    expect(result.saved).toBe(false);
    expect(result.error).toBe("db down");
  });
});
