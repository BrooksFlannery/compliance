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
  
  // Handle nested paths (e.g., "attributes.hasAlcoholLicense", "size.numEmployees")
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
    // Flat key: check root-level properties first, then attributes
    // @ts-ignore - dynamic access
    businessValue = (business as any)[key];

    // Fallback to attributes map
    if (businessValue === undefined) {
      businessValue = business.attributes?.[key];
    }
  }
  
  const result = compareValues(businessValue, operator, value);
  
  // Debug logging for failed criteria
  if (!result) {
    console.log(`    ✗ Criterion failed: ${key} ${operator} ${JSON.stringify(value)} (actual: ${JSON.stringify(businessValue)})`);
  }
  
  // Use the enhanced comparison function that handles currency-aware operations
  return result;
};

// Evaluate a criteria group (AND/OR logic)
const evaluateCriteriaGroup = (group: CriteriaGroup, business: Business): boolean => {
  if (group.criteria.length === 0) return true;

  const results = group.criteria.map(criterion => evaluateCriterion(criterion, business));

  if (group.operator === 'AND') {
    const result = results.every(result => result);
    if (!result) {
      console.log(`  ✗ Criteria group failed (AND): ${group.criteria.length} criteria, ${results.filter(r => r).length} passed`);
    }
    return result;
  } else if (group.operator === 'OR') {
    const result = results.some(result => result);
    if (!result) {
      console.log(`  ✗ Criteria group failed (OR): ${group.criteria.length} criteria, ${results.filter(r => r).length} passed`);
    }
    return result;
  }

  return false;
};

// Evaluate all criteria groups for a rule
const evaluateRuleCriteria = (rule: Rule, business: Business): boolean => {
  if (rule.criteriaGroups.length === 0) return true;

  // All criteria groups must be true (AND logic between groups)
  const result = rule.criteriaGroups.every(group => evaluateCriteriaGroup(group, business));
  
  if (!result) {
    console.log(`  Rule "${rule.title}" failed - criteria groups evaluation failed`);
  }
  
  return result;
};

// Main function to evaluate rules for a business (business-specific rules only)
export const evaluateRulesForBusiness = (business: Business): Rule[] => {
  const allRules = getAllRules();
  const applicableRules: Rule[] = [];

  console.log(`Evaluating rules for business: ${business.name} (ID: ${business.id})`);

  // Filter rules to only those that belong to this business
  const businessRules = allRules.filter(rule => (rule as any).businessId === business.id);
  console.log(`Found ${businessRules.length} rules specific to ${business.name}`);

  for (const rule of businessRules) {
    const applies = evaluateRuleCriteria(rule, business);
    
    if (applies) {
      applicableRules.push(rule);
      console.log(`✓ Rule applies: ${rule.title}`);
    } else {
      console.log(`✗ Rule does not apply: ${rule.title}`);
    }
  }

  console.log(`Total applicable rules for ${business.name}: ${applicableRules.length}`);
  return applicableRules;
};

// New function to evaluate ALL rules against a business (cross-business rule application)
export const evaluateAllRulesForBusiness = (business: Business): Rule[] => {
  const allRules = getAllRules();
  const applicableRules: Rule[] = [];

  console.log(`Evaluating ALL rules for business: ${business.name} (ID: ${business.id})`);
  console.log(`Total rules in system: ${allRules.length}`);

  for (const rule of allRules) {
    const applies = evaluateRuleCriteria(rule, business);
    
    if (applies) {
      applicableRules.push(rule);
      const ruleSource = (rule as any).businessId === business.id ? 'business-specific' : 'cross-business';
      console.log(`✓ Rule applies (${ruleSource}): ${rule.title}`);
    } else {
      console.log(`✗ Rule does not apply: ${rule.title}`);
    }
  }

  console.log(`Total applicable rules for ${business.name}: ${applicableRules.length}`);
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