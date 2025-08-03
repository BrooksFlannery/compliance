import { z } from "zod";

// Core composable schemas
export const AnnualRevenueSchema = z.object({
  amount: z.number(),
  currency: z.string(),
});

export const IndustrySchema = z.object({
  name: z.string(),
  // Industry classification codes used by regulations
  naics: z.string().optional(),
  sic: z.string().optional(),
});

export const LocationSchema = z.object({
  country: z.string(),
  state: z.string().optional(),
  province: z.string().optional(),
  county: z.string().optional(),
  city: z.string().optional(),
  fullName: z.string().optional(),
});

export const BusinessSizeSchema = z.object({
  numEmployees: z.number().optional(),
  sbaSizeStandard: z.enum(['Small Business', 'Large Business']).optional(),
  chainStatus: z.enum(['independent', 'franchise', 'large_chain', 'single_location']).optional(),
});

export const BusinessTypeSchema = z.object({
  businessType: z.enum(['LLC', 'Corporation', 'Partnership', 'Sole Proprietorship']).optional(),
});

// User schema
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  passwordHash: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Core business schema with simplified structure
export const BusinessSchema = z.object({
  id: z.string(),
  name: z.string(),
  locations: z.array(LocationSchema),
  
  // Core structured schemas - all optional
  revenue: AnnualRevenueSchema.optional(),
  industry: IndustrySchema.optional(),
  size: BusinessSizeSchema.optional(),
  type: BusinessTypeSchema.optional(),
  
  // Flexible attributes for everything else (activities, flags, products, etc.)
  attributes: z.record(z.any()).optional(),
  
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Criterion schema - updated to support new operators
export const CriterionSchema = z.object({
  id: z.string(),
  key: z.string(),
  operator: z.enum([
    '=', '!=', 'IN', 'NOT_IN', '>', '>=', '<', '<=', 
    'CONTAINS', 'NOT_CONTAINS', 'CURRENCY_GTE'
  ]),
  value: z.any(),
});

// Criteria group schema
export const CriteriaGroupSchema = z.object({
  id: z.string(),
  operator: z.enum(['AND', 'OR']),
  criteria: z.array(CriterionSchema),
});

// Rule schema
export const RuleSchema = z.object({
  id: z.string(),
  title: z.string(),
  shortDescription: z.string().optional(),
  fullText: z.string().optional(),
  source: z.string().optional(),
  jurisdiction: z.string().optional(),
  effectiveDate: z.date().optional(),
  retiredDate: z.date().optional(),
  categories: z.array(z.string()),
  criteriaGroups: z.array(CriteriaGroupSchema),
  businessId: z.string().optional(), // Optional for backward compatibility
  createdAt: z.date(),
  updatedAt: z.date(),
});

// tRPC input schemas
export const GetBusinessInputSchema = z.object({
  id: z.string(),
});

export const GetBusinessRulesInputSchema = z.object({
  businessId: z.string(),
});

export const CreateBusinessInputSchema = z.object({
  name: z.string(),
  locations: z.array(LocationSchema),
  revenue: AnnualRevenueSchema.optional(),
  industry: IndustrySchema.optional(),
  size: BusinessSizeSchema.optional(),
  type: BusinessTypeSchema.optional(),
  attributes: z.record(z.any()).optional(),
});

// Type exports
export type User = z.infer<typeof UserSchema>;
export type Business = z.infer<typeof BusinessSchema>;
export type Rule = z.infer<typeof RuleSchema>;
export type Criterion = z.infer<typeof CriterionSchema>;
export type CriteriaGroup = z.infer<typeof CriteriaGroupSchema>;

// Composable schema types
export type AnnualRevenue = z.infer<typeof AnnualRevenueSchema>;
export type Industry = z.infer<typeof IndustrySchema>;
export type Location = z.infer<typeof LocationSchema>;
export type BusinessSize = z.infer<typeof BusinessSizeSchema>;
export type BusinessType = z.infer<typeof BusinessTypeSchema>; 