export const ENV = {
  appId: process.env.APP_ID ?? "vacancy-agent-site",
  cookieSecret: process.env.APP_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  ownerOpenId: "local-owner",
  isProduction: process.env.NODE_ENV === "production",
  importToken: process.env.RESEARCH_IMPORT_TOKEN ?? "",
};
