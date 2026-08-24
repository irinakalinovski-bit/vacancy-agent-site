import { publicProcedure, router } from "./_core/trpc";
import { clearVacancyPreference, createManualSearchRequest, getLatestManualSearchRequest, getTrackerSnapshot, getVacancyPreferences, importResearchResult, setVacancyPreference, vacancyPreferenceInputSchema } from "./tracker";
import { z } from "zod";

export const appRouter = router({
  system: router({
    health: publicProcedure.query(() => ({ ok: true })),
  }),
  auth: router({
    me: publicProcedure.query(({ ctx }) => ctx.user),
    logout: publicProcedure.mutation(() => ({ success: true as const })),
  }),
  tracker: router({
    snapshot: publicProcedure.query(() => getTrackerSnapshot()),
    requestManualSearch: publicProcedure.mutation(() => createManualSearchRequest(1)),
    latestManualSearch: publicProcedure.query(() => getLatestManualSearchRequest(1)),
    importResearch: publicProcedure.input(z.unknown()).mutation(({ input }) => importResearchResult(input)),
    preferences: publicProcedure.query(() => getVacancyPreferences(1)),
    setPreference: publicProcedure.input(vacancyPreferenceInputSchema).mutation(({ input }) => setVacancyPreference(1, input)),
    clearPreference: publicProcedure.input(z.object({ vacancyId: z.number().int().positive() })).mutation(({ input }) => clearVacancyPreference(1, input.vacancyId)),
  }),
});

export type AppRouter = typeof appRouter;
