import { createTRPCRouter } from "./trpc";
import { businessRouter } from "./routers/business";
import rulesRouter from "./routers/rules";

export const appRouter = createTRPCRouter({
  business: businessRouter,
  rules: rulesRouter,
});

export type AppRouter = typeof appRouter; 