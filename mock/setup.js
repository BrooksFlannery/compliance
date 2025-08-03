#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

async function checkEnvironment() {
  console.log('🔍 Checking environment...\n');
  
  // Check if OpenAI API key is set
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.log('❌ OPENAI_API_KEY environment variable not set');
    console.log('   Please set it with: export OPENAI_API_KEY="your-key-here"');
    console.log('   Or add it to your .env file\n');
  } else {
    console.log('✅ OPENAI_API_KEY is set');
  }
  
  // Check if input file exists
  try {
    await fs.access('buisness.md');
    console.log('✅ Input file buisness.md found');
  } catch {
    console.log('❌ Input file buisness.md not found');
    console.log('   Please ensure your business data file is named buisness.md\n');
  }
  
  // Check Node.js version
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  if (majorVersion >= 16) {
    console.log(`✅ Node.js version ${nodeVersion} is compatible`);
  } else {
    console.log(`❌ Node.js version ${nodeVersion} is too old`);
    console.log('   Please upgrade to Node.js 16 or higher\n');
  }
  
  // Check if package.json exists
  try {
    await fs.access('package.json');
    console.log('✅ package.json found');
  } catch {
    console.log('❌ package.json not found');
    console.log('   Please run: npm install\n');
  }
  
  console.log('\n📋 Setup Checklist:');
  console.log('   □ Set OPENAI_API_KEY environment variable');
  console.log('   □ Ensure buisness.md file exists');
  console.log('   □ Run npm install');
  console.log('   □ Run npm start to begin analysis\n');
}

async function createEnvFile() {
  try {
    await fs.access('.env');
    console.log('✅ .env file already exists');
  } catch {
    const envContent = `# OpenAI API Configuration
OPENAI_API_KEY=your-openai-api-key-here

# Optional: Customize processing
DELAY_BETWEEN_REQUESTS=2000
OUTPUT_DIRECTORY=./businesses
`;
    
    await fs.writeFile('.env', envContent);
    console.log('✅ Created .env file');
    console.log('   Please edit .env and add your OpenAI API key\n');
  }
}

async function main() {
  console.log('🚀 Business Analyzer Setup\n');
  
  await checkEnvironment();
  await createEnvFile();
  
  console.log('💡 Next Steps:');
  console.log('   1. Get your OpenAI API key from https://platform.openai.com/api-keys');
  console.log('   2. Set the API key: export OPENAI_API_KEY="your-key-here"');
  console.log('   3. Install dependencies: npm install');
  console.log('   4. Run the analyzer: npm start\n');
  
  console.log('📚 For more information, see README.md');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { checkEnvironment, createEnvFile }; 