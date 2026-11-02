import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import DocumentUpload from "@/components/DocumentUpload";

const mocks = vi.hoisted(() => ({
  save: vi.fn(async (_docs: Array<{ id: string }>, _userId: string) => {}), remove: vi.fn(async (_id: string, _path?: string) => {}), invoke: vi.fn(),
  visits: vi.fn(async (_visits: Array<{ documentId: string }>, _userId: string) => {}),
}));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: "synthetic" }, profile: null }) }));
vi.mock("@/store/vaultStore", () => ({ useVaultStore: () => ({ addDocuments: mocks.save, removeDocument: mocks.remove, addVisits: mocks.visits }) }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { functions: { invoke: mocks.invoke }, rpc: vi.fn(async () => ({})) } }));
vi.mock("@/lib/analytics", () => ({ trackEvent: vi.fn() }));
vi.mock("@/components/UploadConsentModal", () => ({ default: () => null }));

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.setItem("rinvita.uploadConsent.synthetic", "true");
  mocks.invoke.mockResolvedValue({ data: { documentMeta: { name: "Synthetic record" }, visits: [{ findings: "Synthetic only" }] }, error: null });
});

it("saves successful extraction before review and closing never deletes it", async () => {
  const close = vi.fn();
  render(<DocumentUpload open onClose={close} />);
  fireEvent.change(screen.getByPlaceholderText(/Paste clinical text/), { target: { value: "SYNTHETIC TEST ONLY" } });
  fireEvent.click(screen.getByRole("button", { name: /Upload and translate/ }));
  await waitFor(() => expect(mocks.save).toHaveBeenCalledTimes(1));
  expect(mocks.save.mock.calls[0][0][0].id).toBe(mocks.visits.mock.calls[0][0][0].documentId);
  fireEvent.click(screen.getByRole("button", { name: "Done" }));
  expect(close).toHaveBeenCalledTimes(1);
  expect(mocks.remove).not.toHaveBeenCalled();
});

it("requires confirmation before removing the automatically saved record", async () => {
  render(<DocumentUpload open onClose={vi.fn()} />);
  fireEvent.change(screen.getByPlaceholderText(/Paste clinical text/), { target: { value: "SYNTHETIC TEST ONLY" } });
  fireEvent.click(screen.getByRole("button", { name: /Upload and translate/ }));
  await waitFor(() => expect(mocks.save).toHaveBeenCalledTimes(1));
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
  fireEvent.click(screen.getByRole("button", { name: "Remove this document" }));
  expect(mocks.remove).not.toHaveBeenCalled();
  confirm.mockReturnValue(true);
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Remove this document" })));
  expect(mocks.remove).toHaveBeenCalledTimes(1);
  expect(mocks.remove.mock.calls[0][0]).toBe(mocks.save.mock.calls[0][0][0].id);
  confirm.mockRestore();
});