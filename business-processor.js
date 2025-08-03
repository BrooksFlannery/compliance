const fs = require('fs').promises;
const path = require('path');
const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'your-openai-api-key-here'
});

// Configuration
const CONFIG = {
  inputFile: 'buisness.md',
  outputDir: './businesses',
  delayBetweenRequests: 2000, // 2 seconds to avoid rate limits
  analysisPrompt: `Provide a comprehensive market analysis for this business including:

1. **Current Market Position**: How does this business fit in their industry?
2. **Industry Trends**: What are the key trends affecting this sector?
3. **Competitive Landscape**: Who are the main competitors and how does this business compare?
4. **Growth Opportunities**: What opportunities exist for expansion or improvement?
5. **Risk Factors**: What challenges or risks should be considered?
6. **Recent Developments**: Any recent news or changes in the industry that might affect this business?

Please search the web for current information and provide specific, actionable insights.`
};

// Utility function to create directory if it doesn't exist
async function ensureDirectoryExists(dirPath) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

// Function to sanitize filename
function sanitizeFilename(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Function to parse business data from the markdown file
async function parseBusinessData() {
  const content = await fs.readFile(CONFIG.inputFile, 'utf8');
  const businesses = [];
  
  // Split by business sections (looking for ### headers)
  const sections = content.split(/(?=### \d+\. )/);
  
  for (const section of sections) {
    if (section.trim() && section.includes('### ')) {
      const lines = section.trim().split('\n');
      const business = {};
      
      for (const line of lines) {
        if (line.startsWith('### ')) {
          business.name = line.replace('### ', '').replace(/^\d+\.\s*/, '');
        } else if (line.includes('**Location(s):**')) {
          business.location = line.split('**Location(s):**')[1].trim();
        } else if (line.includes('**Industry:**')) {
          business.industry = line.split('**Industry:**')[1].trim();
        } else if (line.includes('**Employee Count:**')) {
          business.employeeCount = line.split('**Employee Count:**')[1].trim();
        } else if (line.includes('**Annual Revenue:**')) {
          business.revenue = line.split('**Annual Revenue:**')[1].trim();
        }
      }
      
      if (business.name) {
        businesses.push(business);
      }
    }
  }
  
  return businesses;
}

// Function to create individual business files
async function createBusinessFiles(businesses) {
  await ensureDirectoryExists(CONFIG.outputDir);
  
  for (const business of businesses) {
    const filename = sanitizeFilename(business.name) + '.md';
    const filepath = path.join(CONFIG.outputDir, filename);
    
    const content = `# ${business.name}

**Location(s):** ${business.location}
**Industry:** ${business.industry}
**Employee Count:** ${business.employeeCount}
**Annual Revenue:** ${business.revenue}

## Business Overview

${business.name} is a ${business.industry} company based in ${business.location}. The company has ${business.employeeCount} employees and generates ${business.revenue} in annual revenue.

`;
    
    await fs.writeFile(filepath, content);
    console.log(`Created: ${filename}`);
  }
  
  console.log(`\nCreated ${businesses.length} business files in ${CONFIG.outputDir}/`);
}

// Function to analyze a single business with web search
async function analyzeBusinessWithWebSearch(businessFile) {
  try {
    console.log(`\nAnalyzing: ${path.basename(businessFile)}`);
    
    // Read the business file
    const businessContent = await fs.readFile(businessFile, 'utf8');
    
    // Create the analysis prompt
    const analysisPrompt = `${CONFIG.analysisPrompt}

Business Information:
${businessContent}

Please provide a comprehensive analysis based on current web information.`;

    // Call OpenAI with web search
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: analysisPrompt
        }
      ],
      tools: [
        {
          type: "web_search"
        }
      ],
      max_tokens: 2000
    });

    // Extract the analysis
    const analysis = response.choices[0].message.content;
    
    // Append the analysis to the business file
    await fs.appendFile(businessFile, `\n\n## Market Analysis\n\n${analysis}\n`);
    
    console.log(`✅ Completed analysis for ${path.basename(businessFile)}`);
    
    return analysis;
    
  } catch (error) {
    console.error(`❌ Error analyzing ${path.basename(businessFile)}:`, error.message);
    throw error;
  }
}

// Function to process all business files
async function processAllBusinesses() {
  try {
    const businessFiles = await fs.readdir(CONFIG.outputDir);
    const mdFiles = businessFiles.filter(file => file.endsWith('.md'));
    
    console.log(`\nFound ${mdFiles.length} business files to process...`);
    
    for (let i = 0; i < mdFiles.length; i++) {
      const file = mdFiles[i];
      const filepath = path.join(CONFIG.outputDir, file);
      
      console.log(`\n[${i + 1}/${mdFiles.length}] Processing ${file}...`);
      
      try {
        await analyzeBusinessWithWebSearch(filepath);
        
        // Add delay between requests to avoid rate limits
        if (i < mdFiles.length - 1) {
          console.log(`Waiting ${CONFIG.delayBetweenRequests}ms before next request...`);
          await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenRequests));
        }
        
      } catch (error) {
        console.error(`Failed to process ${file}:`, error.message);
        // Continue with next file even if one fails
      }
    }
    
    console.log(`\n🎉 Completed processing all ${mdFiles.length} business files!`);
    
  } catch (error) {
    console.error('Error processing businesses:', error);
  }
}

// Main execution function
async function main() {
  try {
    console.log('🚀 Starting business analysis process...\n');
    
    // Step 1: Parse and create individual business files
    console.log('Step 1: Parsing business data and creating individual files...');
    const businesses = await parseBusinessData();
    console.log(`Found ${businesses.length} businesses in ${CONFIG.inputFile}`);
    
    await createBusinessFiles(businesses);
    
    // Step 2: Process each business with web search analysis
    console.log('\nStep 2: Processing businesses with web search analysis...');
    await processAllBusinesses();
    
    console.log('\n✨ All done! Check the businesses/ directory for your analyzed files.');
    
  } catch (error) {
    console.error('❌ Error in main process:', error);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  parseBusinessData,
  createBusinessFiles,
  analyzeBusinessWithWebSearch,
  processAllBusinesses
}; 