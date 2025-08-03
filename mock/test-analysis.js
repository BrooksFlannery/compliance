const fs = require('fs').promises;
const path = require('path');
require('dotenv').config(); // Load .env file
const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Configuration
const CONFIG = {
  businessDir: './businesses',
  promptFile: './compliance-prompt.md',
  maxTokens: 3000
};

// Function to analyze a single business with web search
async function analyzeBusinessWithWebSearch(businessFile) {
  try {
    console.log(`\n🔍 Analyzing: ${path.basename(businessFile)}`);
    
    // Read the business file
    const businessContent = await fs.readFile(businessFile, 'utf8');
    
    console.log('\n📄 Business Information:');
    console.log('─'.repeat(50));
    console.log(businessContent);
    console.log('─'.repeat(50));
    
    // Read the prompt template
    const promptTemplate = await fs.readFile(CONFIG.promptFile, 'utf8');
    
    // Create the analysis prompt by replacing the placeholder
    const analysisPrompt = promptTemplate.replace('[Business details will be inserted here]', businessContent);

    console.log('\n🤖 Calling OpenAI for compliance analysis...');
    console.log('\n📤 Full prompt being sent to OpenAI:');
    console.log('─'.repeat(80));
    console.log(analysisPrompt);
    console.log('─'.repeat(80));
    
    // Call OpenAI for compliance analysis
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: analysisPrompt
        }
      ],
      max_tokens: CONFIG.maxTokens
    });

    // Extract the analysis
    const analysis = response.choices[0].message.content;
    
    console.log('\n✅ Analysis completed!');
    console.log('\n📋 Compliance Rules Analysis:');
    console.log('─'.repeat(50));
    console.log(analysis);
    console.log('─'.repeat(50));
    
    // Ask user if they want to save the analysis
    console.log('\n💾 Would you like to save this analysis to the business file? (y/n)');
    
    // For now, we'll just show the analysis without saving
    // In a real implementation, you'd want to handle user input
    
    return analysis;
    
  } catch (error) {
    console.error(`❌ Error analyzing ${path.basename(businessFile)}:`, error.message);
    throw error;
  }
}

// Function to get the first business file
async function getFirstBusinessFile() {
  try {
    const files = await fs.readdir(CONFIG.businessDir);
    const mdFiles = files.filter(file => file.endsWith('.md'));
    
    if (mdFiles.length === 0) {
      throw new Error('No business files found. Run "npm run split" first.');
    }
    
    // Sort files to get the first one consistently
    mdFiles.sort();
    const firstFile = mdFiles[0];
    const filepath = path.join(CONFIG.businessDir, firstFile);
    
    return filepath;
  } catch (error) {
    console.error(`Error reading directory ${CONFIG.businessDir}:`, error.message);
    throw error;
  }
}

// Main execution function
async function main() {
  try {
    console.log('🧪 Testing OpenAI Analysis on First Business\n');
    
    // Check if OpenAI API key is set
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY not found in .env file');
      console.log('   Please add your OpenAI API key to the .env file');
      process.exit(1);
    }
    
    console.log('✅ OpenAI API key found');
    
    // Get the first business file
    const firstBusinessFile = await getFirstBusinessFile();
    console.log(`📁 Testing with: ${path.basename(firstBusinessFile)}`);
    
    // Analyze the first business
    await analyzeBusinessWithWebSearch(firstBusinessFile);
    
    console.log('\n✨ Test completed successfully!');
    console.log('   If the analysis looks good, you can run "npm run analyze" to process all businesses.');
    
  } catch (error) {
    console.error('❌ Error in test process:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { analyzeBusinessWithWebSearch, getFirstBusinessFile }; 