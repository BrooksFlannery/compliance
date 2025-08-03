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

export const addRule = (rule: Rule): Rule => {
  storage.rules.set(rule.id, rule);
  return rule;
};

export const getBusiness = (id: string): Business | undefined => {
  return storage.businesses.get(id);
};

export const getRule = (id: string): Rule | undefined => {
  return storage.rules.get(id);
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