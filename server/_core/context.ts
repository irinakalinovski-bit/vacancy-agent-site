import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { getUserByOpenId, upsertUser } from "../db";

const LOCAL_OWNER_OPEN_ID = "local-owner";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(opts: CreateExpressContextOptions): Promise<TrpcContext> {
  let user: User | null = null;
  try {
    await upsertUser({ openId: LOCAL_OWNER_OPEN_ID, name: "Site owner", role: "admin" });
    user = await getUserByOpenId(LOCAL_OWNER_OPEN_ID) ?? null;
  } catch {
    user = null;
  }
  return { req: opts.req, res: opts.res, user };
}
