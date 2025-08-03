import fs from 'fs';
import path from 'path';
import { addBusiness, addRule, clearStorage, getAllRules } from './storage';
import { BusinessSchema, RuleSchema } from './schemas';
import type { Business, Rule } from './schemas';

// Load business data from JSON files
export const loadBusinessData = (): void => {
  const businessesDir = path.join(process.cwd(), 'src', 'data', 'businesses');
  
  try {
    if (!fs.existsSync(businessesDir)) {
      console.log('Businesses directory not found, skipping business data load');
      return;
    }

    const files = fs.readdirSync(businessesDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));

    console.log(`Found ${jsonFiles.length} business files to load`);

    jsonFiles.forEach(file => {
      try {
        const filePath = path.join(businessesDir, file);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const businessData = JSON.parse(fileContent);
        
        // Convert string dates to Date objects
        const businessWithDates = {
          ...businessData,
          createdAt: businessData.createdAt ? new Date(businessData.createdAt) : new Date(),
          updatedAt: businessData.updatedAt ? new Date(businessData.updatedAt) : new Date(),
        };
        
        // Validate against schema
        const validation = BusinessSchema.safeParse(businessWithDates);
        if (!validation.success) {
          console.error(`Business validation failed for ${file}:`, validation.error);
          console.error('Business data that failed validation:', JSON.stringify(businessWithDates, null, 2));
          return;
        }
        
        // Add the business to storage
        addBusiness(validation.data);
        console.log(`Loaded business: ${businessData.name}`);
      } catch (error) {
        console.error(`Error loading business file ${file}:`, error);
      }
    });

    console.log(`Successfully loaded ${jsonFiles.length} businesses`);
  } catch (error) {
    console.error('Error loading business data:', error);
  }
};

// Load rule data from JSON files
export const loadRuleData = (): void => {
  const rulesDir = path.join(process.cwd(), 'src', 'data', 'rules');
  
  try {
    if (!fs.existsSync(rulesDir)) {
      console.log('Rules directory not found, skipping rule data load');
      return;
    }

    const files = fs.readdirSync(rulesDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));

    console.log(`Found ${jsonFiles.length} rule files to load`);

    jsonFiles.forEach(file => {
      try {
        const filePath = path.join(rulesDir, file);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const rulesData = JSON.parse(fileContent);
        
        // Extract business ID from filename (e.g., "pacific-crest-brew-co-rules.json" -> "pacific-crest-brew-co")
        const businessId = file.replace('-rules.json', '');
        
        // Handle different rule file structures
        let rules: any[] = [];
        if (Array.isArray(rulesData)) {
          rules = rulesData;
        } else if (rulesData.rules && Array.isArray(rulesData.rules)) {
          rules = rulesData.rules;
        } else {
          rules = [rulesData];
        }
        
        let validRulesCount = 0;
        rules.forEach((rule, index) => {
          try {
            // Convert string dates to Date objects for Zod validation
            const ruleWithDates = {
              ...rule,
              createdAt: rule.createdAt ? new Date(rule.createdAt) : new Date(),
              updatedAt: rule.updatedAt ? new Date(rule.updatedAt) : new Date(),
              // Ensure optional date strings are converted to Date objects for Zod validation
              effectiveDate: rule.effectiveDate ? new Date(rule.effectiveDate) : undefined,
              retiredDate: rule.retiredDate ? new Date(rule.retiredDate) : undefined,
            } as const;
            
            // Validate against schema
            const validation = RuleSchema.safeParse(ruleWithDates);
            if (!validation.success) {
              console.error(`Rule validation failed for ${file} rule ${index}:`, validation.error);
              return;
            }
            
            // Add business ID to the rule for filtering
            const ruleWithBusinessId = {
              ...validation.data,
              businessId: businessId
            };
            
            addRule(ruleWithBusinessId);
            validRulesCount++;
          } catch (error) {
            console.error(`Error processing rule ${index} in ${file}:`, error);
          }
        });
        
        console.log(`Loaded ${validRulesCount} valid rules from ${file} for business: ${businessId}`);
        if (validRulesCount === 0) {
          console.log(`No valid rules loaded from ${file} - checking structure:`, JSON.stringify(rulesData, null, 2).substring(0, 500));
        }
      } catch (error) {
        console.error(`Error loading rule file ${file}:`, error);
      }
    });

    console.log(`Successfully loaded rules from ${jsonFiles.length} files`);
    console.log(`Total rules in storage: ${getAllRules().length}`);
  } catch (error) {
    console.error('Error loading rule data:', error);
  }
};

// Main function to load all data
export const loadAllData = (): void => {
  console.log('Loading business and rule data...');
  clearStorage();
  loadBusinessData();
  loadRuleData();
  console.log('Data loading complete');
}; 