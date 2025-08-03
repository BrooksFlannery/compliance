import type { Business, Rule } from './schemas';

// Global in-memory storage
export const storage = {
  businesses: new Map<string, Business>(),
  rules: new Map<string, Rule>(),
};

// Helper functions for storage operations
export const addBusiness = (business: Business): Business => {
  storage.businesses.set(business.id, business);
  return business;
};

// Generate a composite key so that rules with the same `id` coming from different
// businesses do not overwrite each other in the in-memory map. This preserves
// backwards compatibility for rules that do not have a `businessId` (treated as
// "global").
export const addRule = (rule: Rule): Rule => {
  const compositeKey = `${rule.businessId ?? 'global'}:${rule.id}`;
  storage.rules.set(compositeKey, rule);
  return rule;
};

export const getBusiness = (id: string): Business | undefined => {
  return storage.businesses.get(id);
};

// Retrieve a rule using the composite key. Callers that only know the rule
// `id` can still pass it directly if they are certain that the identifier is
// unique. When both `businessId` and `ruleId` are known, they should be
// concatenated with a colon (same strategy used in `addRule`).
export const getRule = (compositeId: string): Rule | undefined => {
  return storage.rules.get(compositeId);
};

export const getAllBusinesses = (): Business[] => {
  return Array.from(storage.businesses.values());
};

export const getAllRules = (): Rule[] => {
  return Array.from(storage.rules.values());
};

export const clearStorage = (): void => {
  storage.businesses.clear();
  storage.rules.clear();
}; 