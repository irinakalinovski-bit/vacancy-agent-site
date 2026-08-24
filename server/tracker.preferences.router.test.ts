import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createUnauthenticatedContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("tracker preference router access", () => {
  it("rejects an unauthenticated preference read", async () => {
    const caller = appRouter.createCaller(createUnauthenticatedContext());
    await expect(caller.tracker.preferences()).rejects.toThrow("Please login");
  });

  it("rejects unauthenticated preference mutations", async () => {
    const caller = appRouter.createCaller(createUnauthenticatedContext());
    await expect(caller.tracker.setPreference({ vacancyId: 1, status: "saved" })).rejects.toThrow("Please login");
    await expect(caller.tracker.clearPreference({ vacancyId: 1 })).rejects.toThrow("Please login");
  });
});
