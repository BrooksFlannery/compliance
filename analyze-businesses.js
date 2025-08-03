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
  delayBetweenRequests: 2000, // 2 seconds to avoid rate limits
  skipExistingAnalysis: true, // Skip files that already have analysis
  maxTokens: 3000
};

// Function to check if a file already has analysis
async function hasAnalysis(filepath) {
  try {
    const content = await fs.readFile(filepath, 'utf8');
    return content.includes('## Compliance Rules Analysis');
  } catch (error) {
    return false;
  }
}

// Function to analyze a single business with web search
async function analyzeBusinessWithWebSearch(businessFile) {
  try {
    console.log(`\n🔍 Analyzing: ${path.basename(businessFile)}`);
    
    // Read the business file
    const businessContent = await fs.readFile(businessFile, 'utf8');
    
    // Read the prompt template
    const promptTemplate = await fs.readFile(CONFIG.promptFile, 'utf8');
    
    // Create the analysis prompt by replacing the placeholder
    const analysisPrompt = promptTemplate.replace('[Business details will be inserted here]', businessContent);

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
    
    // Append the analysis to the business file
    await fs.appendFile(businessFile, `\n\n## Compliance Rules Analysis\n\n${analysis}\n`);
    
    console.log(`✅ Completed analysis for ${path.basename(businessFile)}`);
    
    return analysis;
    
  } catch (error) {
    console.error(`❌ Error analyzing ${path.basename(businessFile)}:`, error.message);
    throw error;
  }
}

// Function to get list of business files to analyze
async function getBusinessFilesToAnalyze() {
  try {
    const files = await fs.readdir(CONFIG.businessDir);
    const mdFiles = files.filter(file => file.endsWith('.md'));
    
    if (CONFIG.skipExistingAnalysis) {
      const filesToAnalyze = [];
      const filesToSkip = [];
      
      for (const file of mdFiles) {
        const filepath = path.join(CONFIG.businessDir, file);
        const hasExistingAnalysis = await hasAnalysis(filepath);
        
        if (hasExistingAnalysis) {
          filesToSkip.push(file);
        } else {
          filesToAnalyze.push(file);
        }
      }
      
      return { filesToAnalyze, filesToSkip };
    } else {
      return { filesToAnalyze: mdFiles, filesToSkip: [] };
    }
    
  } catch (error) {
    console.error(`Error reading directory ${CONFIG.businessDir}:`, error.message);
    throw error;
  }
}

// Function to process all business files
async function processAllBusinesses() {
  try {
    console.log(`📁 Reading business files from ${CONFIG.businessDir}...`);
    
    const { filesToAnalyze, filesToSkip } = await getBusinessFilesToAnalyze();
    
    console.log(`\n📊 Found ${filesToAnalyze.length} files to analyze`);
    if (filesToSkip.length > 0) {
      console.log(`⏭️  Skipping ${filesToSkip.length} files with existing analysis`);
    }
    
    if (filesToAnalyze.length === 0) {
      console.log('\n✨ All business files already have analysis!');
      return;
    }
    
    console.log('\n🚀 Starting analysis process...');
    
    for (let i = 0; i < filesToAnalyze.length; i++) {
      const file = filesToAnalyze[i];
      const filepath = path.join(CONFIG.businessDir, file);
      
      console.log(`\n[${i + 1}/${filesToAnalyze.length}] Processing ${file}...`);
      
      try {
        await analyzeBusinessWithWebSearch(filepath);
        
        // Add delay between requests to avoid rate limits
        if (i < filesToAnalyze.length - 1) {
          console.log(`⏳ Waiting ${CONFIG.delayBetweenRequests}ms before next request...`);
          await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenRequests));
        }
        
      } catch (error) {
        console.error(`Failed to process ${file}:`, error.message);
        // Continue with next file even if one fails
      }
    }
    
    console.log(`\n🎉 Completed analysis for ${filesToAnalyze.length} business files!`);
    
  } catch (error) {
    console.error('Error processing businesses:', error);
  }
}

// Function to show analysis status
async function showAnalysisStatus() {
  try {
    const { filesToAnalyze, filesToSkip } = await getBusinessFilesToAnalyze();
    
    console.log('\n📋 Analysis Status:');
    console.log(`   ✅ Analyzed: ${filesToSkip.length} files`);
    console.log(`   🔄 Pending: ${filesToAnalyze.length} files`);
    console.log(`   📁 Total: ${filesToAnalyze.length + filesToSkip.length} files`);
    
    if (filesToAnalyze.length > 0) {
      console.log('\n📝 Files pending analysis:');
      filesToAnalyze.forEach(file => console.log(`   - ${file}`));
    }
    
    return { filesToAnalyze, filesToSkip };
  } catch (error) {
    console.error('Error checking status:', error.message);
    return { filesToAnalyze: [], filesToSkip: [] };
  }
}

// Main execution function
async function main() {
  try {
    console.log('🤖 Starting business analysis with OpenAI web search...\n');
    
    // Check if OpenAI API key is set
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY environment variable not set');
      console.log('   Please set it with: export OPENAI_API_KEY="your-key-here"');
      process.exit(1);
    }
    
    // Show current status
    await showAnalysisStatus();
    
    // Process businesses
    await processAllBusinesses();
    
    // Show final status
    console.log('\n📊 Final Status:');
    await showAnalysisStatus();
    
    console.log('\n✨ Analysis complete! Check the businesses/ directory for updated files.');
    
  } catch (error) {
    console.error('❌ Error in main process:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  analyzeBusinessWithWebSearch,
  processAllBusinesses,
  showAnalysisStatus,
  getBusinessFilesToAnalyze
}; 