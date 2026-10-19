import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { useSubscription } from "@/hooks/useSubscription";

const state = vi.hoisted(() => ({
  user: { id: "patient-test" },
  profile: { comped_plan: null as string | null, comped_until: null as string | null },
  paid: false,
  tier: "free",
}));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => state }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  from: () => {
    const query = { select: () => query, eq: () => query, order: () => query, limit: () => query, maybeSingle: async () => ({ data: null }) };
    return query;
  },
  rpc: async (name: string) => ({ data: name === "user_plan_tier" ? state.tier : state.paid }),
  channel: () => { const channel = { on: () => channel, subscribe: () => channel }; return channel; },
  removeChannel: vi.fn(),
} }));

beforeEach(() => {
  state.profile = { comped_plan: null, comped_until: null };
  state.paid = false;
  state.tier = "free";
});

it("updates mounted plan access immediately when a claim refreshes the profile", async () => {
  const { result, rerender } = renderHook(() => useSubscription());
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.planTier).toBe("free");
  act(() => {
    state.paid = true;
    state.tier = "standard";
    state.profile = { comped_plan: "standard", comped_until: "2026-12-18T23:59:59.999999Z" };
    rerender();
  });
  await waitFor(() => expect(result.current.planTier).toBe("standard"));
  expect(result.current.isActive).toBe(true);
});