import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { BusinessSchema, GetBusinessInputSchema, GetBusinessRulesInputSchema, RuleSchema } from "../../../lib/schemas";
import { evaluateRulesForBusiness } from "../../../lib/rule-engine";
import { getAllBusinesses, getBusiness } from "../../../lib/storage";

export const businessRouter = createTRPCRouter({
  getAllBusinesses: publicProcedure
    .output(z.array(BusinessSchema))
    .query(() => {
      try {
        console.log('getAllBusinesses called');
        const businesses = getAllBusinesses();
        console.log('getAllBusinesses result:', businesses.length, 'businesses');
        return businesses;
      } catch (error) {
        console.error('getAllBusinesses error:', error);
        throw error;
      }
    }),
    
  getBusiness: publicProcedure
    .input(GetBusinessInputSchema)
    .output(BusinessSchema)
    .query(({ input }) => {
      try {
        console.log('getBusiness called with id:', input.id);
        const business = getBusiness(input.id);
        if (!business) {
          console.log('Business not found:', input.id);
          throw new TRPCError({ code: 'NOT_FOUND' });
        }
        console.log('getBusiness result:', business.name);
        return business;
      } catch (error) {
        console.error('getBusiness error:', error);
        throw error;
      }
    }),
    
  getBusinessRules: publicProcedure
    .input(GetBusinessRulesInputSchema)
    .output(z.array(RuleSchema))
    .query(({ input }) => {
      try {
        console.log('getBusinessRules called with businessId:', input.businessId);
        const business = getBusiness(input.businessId);
        if (!business) {
          console.log('Business not found for rules:', input.businessId);
          throw new TRPCError({ code: 'NOT_FOUND' });
        }
        const rules = evaluateRulesForBusiness(business);
        console.log('getBusinessRules result:', rules.length, 'rules for', business.name);
        return rules;
      } catch (error) {
        console.error('getBusinessRules error:', error);
        throw error;
      }
    }),
    

});

export default businessRouter; 