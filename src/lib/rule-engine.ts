import type { Business, Rule, Criterion, CriteriaGroup } from './schemas';
import { getAllRules } from './storage';

// Helper function to get nested value using dot notation
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

// Evaluate a single criterion against business attributes
const evaluateCriterion = (criterion: Criterion, business: Business): boolean => {
  const { key, operator, value } = criterion;
  
  // Handle nested paths (e.g., "flags.foodSupplyChain", "size.numEmployees")
  let businessValue: any;
  
  // Special handling for revenue field (no dot in key)
  if (key === 'revenue') {
    businessValue = business.revenue;
  } else if (key.includes('.')) {
    // Special handling for locations array
    if (key.startsWith('locations.')) {
      const locationField = key.split('.')[1]; // e.g., "country", "state"
      // Check if ANY location matches the criteria
      return business.locations?.some(location => {
        const locationValue = location[locationField as keyof typeof location];
        return compareValues(locationValue, operator, value);
      }) || false;
    }
    
    // Nested path - check in composable schemas first, then attributes
    businessValue = getNestedValue(business, key);
  } else {
    // Flat key: check root-level properties first (including flags)
    // @ts-ignore - dynamic access
    businessValue = (business as any)[key];

    // Fallback to attributes map
    if (businessValue === undefined) {
      businessValue = business.attributes?.[key];
    }
  }

  // Use the enhanced comparison function that handles currency-aware operations
  return compareValues(businessValue, operator, value);
};

// Evaluate a criteria group (AND/OR logic)
const evaluateCriteriaGroup = (group: CriteriaGroup, business: Business): boolean => {
  if (group.criteria.length === 0) return true;

  const results = group.criteria.map(criterion => evaluateCriterion(criterion, business));

  if (group.operator === 'AND') {
    return results.every(result => result);
  } else if (group.operator === 'OR') {
    return results.some(result => result);
  }

  return false;
};

// Evaluate all criteria groups for a rule
const evaluateRuleCriteria = (rule: Rule, business: Business): boolean => {
  if (rule.criteriaGroups.length === 0) return true;

  // All criteria groups must be true (AND logic between groups)
  return rule.criteriaGroups.every(group => evaluateCriteriaGroup(group, business));
};

// Main function to evaluate rules for a business
export const evaluateRulesForBusiness = (business: Business): Rule[] => {
  const allRules = getAllRules();
  const applicableRules: Rule[] = [];

  for (const rule of allRules) {
    if (evaluateRuleCriteria(rule, business)) {
      applicableRules.push(rule);
    }
  }

  return applicableRules;
};

// Helper function to check if a specific rule applies to a business
export const doesRuleApplyToBusiness = (rule: Rule, business: Business): boolean => {
  return evaluateRuleCriteria(rule, business);
};

// Currency formatting utility
export function formatCurrency(amount: number, currency: string): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    notation: 'compact',
    maximumFractionDigits: 1
  });
  return formatter.format(amount);
}

// Currency conversion utility (simplified - in production you'd use real exchange rates)
const EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.85,
  GBP: 0.73,
  ZAR: 15.5,
  ARS: 350,
  // Add more currencies as needed
};

export function convertCurrency(amount: number, fromCurrency: string, toCurrency: string): number {
  if (fromCurrency === toCurrency) return amount;
  
  const fromRate = EXCHANGE_RATES[fromCurrency] || 1;
  const toRate = EXCHANGE_RATES[toCurrency] || 1;
  
  // Convert to USD first, then to target currency
  const usdAmount = amount / fromRate;
  return usdAmount * toRate;
}

// Enhanced comparison function for currency-aware operations
function compareValues(actualValue: any, operator: string, expectedValue: any): boolean {
  switch (operator) {
    case '=':
      return actualValue === expectedValue;
    case '!=':
      return actualValue !== expectedValue;
    case '>':
      return actualValue > expectedValue;
    case '>=':
      return actualValue >= expectedValue;
    case '<':
      return actualValue < expectedValue;
    case '<=':
      return actualValue <= expectedValue;
    case 'CONTAINS':
      return String(actualValue).includes(String(expectedValue));
    case 'NOT_CONTAINS':
      return !String(actualValue).includes(String(expectedValue));
    case 'IN':
      return Array.isArray(expectedValue) && expectedValue.includes(actualValue);
    case 'NOT_IN':
      return Array.isArray(expectedValue) && !expectedValue.includes(actualValue);
    case 'CURRENCY_GTE':
      // Handle currency-aware greater than or equal comparison
      if (typeof actualValue === 'object' && actualValue.amount && actualValue.currency) {
        const expectedAmount = expectedValue.amount;
        const expectedCurrency = expectedValue.currency;
        
        // If currencies match, direct comparison
        if (actualValue.currency === expectedCurrency) {
          return actualValue.amount >= expectedAmount;
        }
        
        // If currencies don't match, convert to expected currency for comparison
        const convertedAmount = convertCurrency(actualValue.amount, actualValue.currency, expectedCurrency);
        return convertedAmount >= expectedAmount;
      }
      return false;
    default:
      return false;
  }
} 