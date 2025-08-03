import { z } from "zod";

// Core composable schemas
export const AnnualRevenueSchema = z.object({
  amount: z.number(),
  currency: z.string(),
});

export const IndustrySchema = z.object({
  name: z.string(),
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

export const ActivitiesSchema = z.object({
  activities: z.array(z.string()),
});

export const ProductsSchema = z.object({
  products: z.array(z.string()),
});

export const BusinessSizeSchema = z.object({
  numEmployees: z.number().optional(),
  sbaSizeStandard: z.enum(['Small Business', 'Large Business']).optional(),
  chainStatus: z.enum(['independent', 'franchise', 'large_chain', 'single_location']).optional(),
});

export const BusinessTypeSchema = z.object({
  businessType: z.enum(['LLC', 'Corporation', 'Partnership', 'Sole Proprietorship']).optional(),
});

export const BusinessFlagsSchema = z.object({
  hasAgriculturalOperations: z.boolean().optional(),
  foodSupplyChain: z.boolean().optional(),
  internationalOperations: z.boolean().optional(),
  largeEnterprise: z.boolean().optional(),
});

// User schema
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  passwordHash: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Core business schema with composable parts
export const BusinessSchema = z.object({
  id: z.string(),
  name: z.string(),
  locations: z.array(LocationSchema),
  
  // Composable schemas - all optional
  revenue: AnnualRevenueSchema.optional(),
  industry: IndustrySchema.optional(),
  activities: ActivitiesSchema.optional(),
  products: ProductsSchema.optional(),
  size: BusinessSizeSchema.optional(),
  type: BusinessTypeSchema.optional(),
  flags: BusinessFlagsSchema.optional(),
  
  // Flexible attributes for anything else
  attributes: z.record(z.any()).optional(),
  
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Specific business type schemas using composition
export const RestaurantSchema = BusinessSchema.extend({
  industry: IndustrySchema.extend({
    name: z.literal('Restaurant'),
    naics: z.string().default('722511'),
  }),
  activities: ActivitiesSchema.extend({
    activities: z.array(z.string()).default(['serves_food', 'handles_hot_liquids']),
  }),
  attributes: z.object({
    servesAlcohol: z.boolean().optional(),
    seatingCapacity: z.number().optional(),
    hasKitchen: z.boolean().optional(),
  }).optional(),
});

export const ManufacturingSchema = BusinessSchema.extend({
  industry: IndustrySchema.extend({
    name: z.literal('Manufacturing'),
  }),
  activities: ActivitiesSchema.extend({
    activities: z.array(z.string()).default(['manufacturing', 'handles_equipment']),
  }),
  attributes: z.object({
    hasHazardousMaterials: z.boolean().optional(),
    equipment: z.array(z.string()).optional(),
    squareFootage: z.number().optional(),
  }).optional(),
});

export const AgriculturalSchema = BusinessSchema.extend({
  industry: IndustrySchema.extend({
    name: z.literal('Agriculture'),
  }),
  activities: ActivitiesSchema.extend({
    activities: z.array(z.string()).default(['agricultural_production']),
  }),
  flags: BusinessFlagsSchema.extend({
    hasAgriculturalOperations: z.literal(true),
  }),
  attributes: z.object({
    cropTypes: z.array(z.string()).optional(),
    livestockTypes: z.array(z.string()).optional(),
    farmSize: z.number().optional(),
  }).optional(),
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
  activities: ActivitiesSchema.optional(),
  products: ProductsSchema.optional(),
  size: BusinessSizeSchema.optional(),
  type: BusinessTypeSchema.optional(),
  flags: BusinessFlagsSchema.optional(),
  attributes: z.record(z.any()).optional(),
});

// Type exports
export type User = z.infer<typeof UserSchema>;
export type Business = z.infer<typeof BusinessSchema>;
export type Restaurant = z.infer<typeof RestaurantSchema>;
export type Manufacturing = z.infer<typeof ManufacturingSchema>;
export type Agricultural = z.infer<typeof AgriculturalSchema>;
export type Rule = z.infer<typeof RuleSchema>;
export type Criterion = z.infer<typeof CriterionSchema>;
export type CriteriaGroup = z.infer<typeof CriteriaGroupSchema>;

// Composable schema types
export type AnnualRevenue = z.infer<typeof AnnualRevenueSchema>;
export type Industry = z.infer<typeof IndustrySchema>;
export type Location = z.infer<typeof LocationSchema>;
export type Activities = z.infer<typeof ActivitiesSchema>;
export type Products = z.infer<typeof ProductsSchema>;
export type BusinessSize = z.infer<typeof BusinessSizeSchema>;
export type BusinessType = z.infer<typeof BusinessTypeSchema>;
export type BusinessFlags = z.infer<typeof BusinessFlagsSchema>; 