import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { getAllRules } from "../../../lib/storage";
import { RuleSchema } from "../../../lib/schemas";

export const rulesRouter = createTRPCRouter({
  getAllRules: publicProcedure
    .output(z.array(RuleSchema))
    .query(() => {
      try {
        console.log('getAllRules called');
        const rules = getAllRules();
        console.log('getAllRules result:', rules.length, 'rules');
        return rules;
      } catch (error) {
        console.error('getAllRules error:', error);
        throw error;
      }
    }),

  // Remove mock data seeding - we now use real data files
  // seedMockData: publicProcedure
  //   .mutation(() => {
  //     seedMockData();
  //     return { message: "Mock data seeded successfully" };
  //   }),
});

// Explicit default export to help with module resolution
export default rulesRouter; 