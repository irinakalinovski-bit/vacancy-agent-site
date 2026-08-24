import { beforeEach, describe, expect, it, vi } from "vitest";
import { trackerConfigs, vacancies, vacancyPreferences } from "../drizzle/schema";

const getDb = vi.hoisted(() => vi.fn());
vi.mock("./db", () => ({ getDb }));

import { clearVacancyPreference, getVacancyPreferences, setVacancyPreference } from "./tracker";

type Preference = { vacancyId: number; status: "saved" | "hidden" };

function createMockDb(preferences: Preference[] = [], vacancyExists = true) {
  const storedPreferences = [...preferences];
  const insert = vi.fn((table: unknown) => ({
    values: vi.fn((value: unknown) => ({
      onDuplicateKeyUpdate: vi.fn(async () => {
        if (table === vacancyPreferences) {
          const next = value as { vacancyId: number; status: Preference["status"] };
          const existing = storedPreferences.findIndex((item) => item.vacancyId === next.vacancyId);
          if (existing >= 0) storedPreferences[existing] = { vacancyId: next.vacancyId, status: next.status };
          else storedPreferences.push({ vacancyId: next.vacancyId, status: next.status });
        }
      }),
    })),
  }));
  const select = vi.fn((selection: unknown) => ({
    from: (table: unknown) => ({
      where: () => table === vacancies
        ? { limit: vi.fn().mockResolvedValue(vacancyExists ? [{ id: 21 }] : []) }
        : Promise.resolve(selection ? storedPreferences : []),
    }),
  }));
  const deleteMock = vi.fn(() => ({
    where: vi.fn(async () => {
      storedPreferences.splice(0, storedPreferences.length);
    }),
  }));
  return { db: { insert, select, delete: deleteMock }, storedPreferences, insert, deleteMock };
}

describe("private vacancy preferences", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists a user’s private saved and hidden states", async () => {
    const mock = createMockDb([{ vacancyId: 7, status: "saved" }, { vacancyId: 9, status: "hidden" }]);
    getDb.mockResolvedValue(mock.db);

    await expect(getVacancyPreferences(1)).resolves.toEqual([{ vacancyId: 7, status: "saved" }, { vacancyId: 9, status: "hidden" }]);
  });

  it("upserts a saved preference only after the vacancy exists", async () => {
    const mock = createMockDb([{ vacancyId: 21, status: "hidden" }]);
    getDb.mockResolvedValue(mock.db);

    await expect(setVacancyPreference(1, { vacancyId: 21, status: "saved" })).resolves.toEqual({ vacancyId: 21, status: "saved" });
    expect(mock.storedPreferences).toEqual([{ vacancyId: 21, status: "saved" }]);
    expect(mock.insert).toHaveBeenCalledWith(trackerConfigs);
    expect(mock.insert).toHaveBeenCalledWith(vacancyPreferences);
  });

  it("persists, replaces, and clears one private preference across repeated helper calls", async () => {
    const mock = createMockDb();
    getDb.mockResolvedValue(mock.db);

    await setVacancyPreference(1, { vacancyId: 21, status: "saved" });
    await expect(getVacancyPreferences(1)).resolves.toEqual([{ vacancyId: 21, status: "saved" }]);

    await setVacancyPreference(1, { vacancyId: 21, status: "hidden" });
    await expect(getVacancyPreferences(1)).resolves.toEqual([{ vacancyId: 21, status: "hidden" }]);

    await clearVacancyPreference(1, 21);
    await expect(getVacancyPreferences(1)).resolves.toEqual([]);
  });

  it("rejects a preference for a vacancy that does not exist", async () => {
    const mock = createMockDb([], false);
    getDb.mockResolvedValue(mock.db);

    await expect(setVacancyPreference(1, { vacancyId: 404, status: "hidden" })).rejects.toThrow("Vacancy not found");
  });

  it("clears a user preference without changing the shared vacancy", async () => {
    const mock = createMockDb([{ vacancyId: 21, status: "saved" }]);
    getDb.mockResolvedValue(mock.db);

    await expect(clearVacancyPreference(1, 21)).resolves.toEqual({ vacancyId: 21, status: null });
    expect(mock.storedPreferences).toEqual([]);
    expect(mock.deleteMock).toHaveBeenCalledWith(vacancyPreferences);
  });
});
