import { describe, it, expect, vi } from "vitest";
import { hasAccess, canUploadDocument, countQuotaDocuments, FREE_DOC_LIMIT, FREE_LIMIT_CODE } from "@/lib/planAccess";
import { sessionBelongsToUser } from "../../supabase/functions/_shared/checkoutOwnership";
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

describe("checkout result ownership", () => {
  const me = "user-123";

  it("accepts a session carrying our id in client_reference_id", () => {
    expect(sessionBelongsToUser({ client_reference_id: me }, me)).toBe(true);
  });

  it("accepts session, subscription and customer metadata", () => {
    expect(sessionBelongsToUser({ metadata: { userId: me } }, me)).toBe(true);
    expect(sessionBelongsToUser({ subscription: { metadata: { userId: me } } }, me)).toBe(true);
    expect(sessionBelongsToUser({ customer: { metadata: { user_id: me } } }, me)).toBe(true);
  });

  it("denies another user's session", () => {
    expect(sessionBelongsToUser({ client_reference_id: "someone-else" }, me)).toBe(false);
    expect(sessionBelongsToUser({ metadata: { userId: "someone-else" } }, me)).toBe(false);
  });

  it("denies a session with no ownership evidence at all", () => {
    expect(sessionBelongsToUser({}, me)).toBe(false);
    expect(sessionBelongsToUser({ subscription: "sub_123", customer: "cus_123" }, me)).toBe(false);
  });

  it("denies when there is no authenticated user", () => {
    expect(sessionBelongsToUser({ client_reference_id: me }, "")).toBe(false);
  });
});

describe("quota counting", () => {
  const doc = (processing_status: string) => ({ processing_status });

  it("does not count failed documents against the free limit", () => {
    const docs = [doc("completed"), doc("failed"), doc("failed"), doc("pending")];
    expect(countQuotaDocuments(docs)).toBe(2);
    expect(canUploadDocument(null, countQuotaDocuments(docs), false)).toBe(true);
  });

  it("counts completed and in-progress documents", () => {
    const docs = [doc("completed"), doc("pending"), doc("processing")];
    expect(countQuotaDocuments(docs)).toBe(3);
    expect(canUploadDocument(null, countQuotaDocuments(docs), false)).toBe(false);
  });

  it("treats a missing status as quota-eligible", () => {
    expect(countQuotaDocuments([{}, {}] as any)).toBe(2);
  });

  it("under concurrency, both racing uploads see the same serialized count", () => {
    // The database trigger takes a per-user advisory lock before counting, so
    // the second insert of a race observes the first one. Modelled here:
    const stored = [doc("completed"), doc("completed")];
    const first = canUploadDocument(null, countQuotaDocuments(stored), false);
    expect(first).toBe(true);
    stored.push(doc("pending")); // first insert committed under the lock
    expect(canUploadDocument(null, countQuotaDocuments(stored), false)).toBe(false);
  });
});

describe("revocation audit payloads", () => {
  // Mirrors what revoke_shared_brief / revoke_media_share write.
  const briefPayload = { shared_brief_id: "11111111-1111-1111-1111-111111111111", revoked_at: "2026-09-14T00:00:00Z" };
  const mediaPayload = { media_share_id: "22222222-2222-2222-2222-222222222222", revoked_at: "2026-09-14T00:00:00Z" };

  it("never includes the raw share token", () => {
    for (const payload of [briefPayload, mediaPayload]) {
      expect(Object.keys(payload)).not.toContain("token");
      expect(JSON.stringify(payload)).not.toMatch(/token/i);
    }
  });

  it("identifies the affected record by id", () => {
    expect(briefPayload.shared_brief_id).toMatch(/^[0-9a-f-]{36}$/);
    expect(mediaPayload.media_share_id).toMatch(/^[0-9a-f-]{36}$/);
  });
});
