import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import { CANONICAL_RESEARCH_PLAYBOOK, CANONICAL_RESEARCH_PLAYBOOK_VERSION } from "./canonicalResearchPlaybook";
import { manualSearchRequests } from "../drizzle/schema";

const mocks = vi.hoisted(() => ({
  getDb: vi.fn(),
  inserted: [] as Array<{ table: unknown; values: unknown }>,
}));

vi.mock("./db", () => ({ getDb: mocks.getDb }));

const { appRouter } = await import("./routers");

function createAuthenticatedContext(): TrpcContext {
  return {
    user: { id: 42, openId: "test-user", name: "Test User", email: null, loginMethod: null, role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

beforeEach(() => {
  mocks.inserted.length = 0;
  mocks.getDb.mockResolvedValue({
    insert: (table: unknown) => ({
      values: (values: unknown) => {
        mocks.inserted.push({ table, values });
        return { onDuplicateKeyUpdate: async () => undefined };
      },
    }),
  });
});

describe("tracker requestManualSearch router mutation", () => {
  it("runs the real protected request creation path and returns a generated ID, timestamp, and complete canonical playbook", async () => {
    const caller = appRouter.createCaller(createAuthenticatedContext());
    const result = await caller.tracker.requestManualSearch();

    expect(result.requestCode).toMatch(/^FIND-[A-F0-9]{8}$/);
    expect(result.requestedAt).toBeInstanceOf(Date);
    expect(result.requestedAt.getTime()).toBeGreaterThan(0);
    expect(result.prompt).toContain(`Request ID: ${result.requestCode}`);
    expect(result.prompt).toContain(`Requested at (UTC): ${result.requestedAt.toISOString()}`);
    expect(result.prompt).toContain(CANONICAL_RESEARCH_PLAYBOOK_VERSION);
    expect(result.prompt).toContain(CANONICAL_RESEARCH_PLAYBOOK);
    expect(result.prompt).not.toContain("ingest-scheduled-refresh.ts");
    expect(mocks.inserted).toContainEqual(expect.objectContaining({ table: manualSearchRequests, values: expect.objectContaining({ requestCode: result.requestCode, requestedByUserId: 42, status: "requested", requestedAt: result.requestedAt }) }));
  });
});
