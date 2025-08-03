const fs = require('fs').promises;
const path = require('path');

// Configuration
const CONFIG = {
  inputFile: 'business.md',  // Use the cleaned business file
  outputDir: './businesses',
  overwriteExisting: false  // Set to true if you want to overwrite existing files
};

// Utility function to create directory if it doesn't exist
async function ensureDirectoryExists(dirPath) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
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
  try {
    const content = await fs.readFile(CONFIG.inputFile, 'utf8');
    const businesses = [];
    
    // Split by business sections (looking for ### headers with numbers)
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
  } catch (error) {
    console.error(`Error reading file ${CONFIG.inputFile}:`, error.message);
    throw error;
  }
}

// Function to create individual business files
async function createBusinessFiles(businesses) {
  await ensureDirectoryExists(CONFIG.outputDir);
  
  let createdCount = 0;
  let skippedCount = 0;
  
  for (const business of businesses) {
    const filename = sanitizeFilename(business.name) + '.md';
    const filepath = path.join(CONFIG.outputDir, filename);
    
    // Check if file already exists
    try {
      await fs.access(filepath);
      if (!CONFIG.overwriteExisting) {
        console.log(`⏭️  Skipped (exists): ${filename}`);
        skippedCount++;
        continue;
      }
    } catch {
      // File doesn't exist, proceed to create it
    }
    
    const content = `# ${business.name}

**Location(s):** ${business.location}
**Industry:** ${business.industry}
**Employee Count:** ${business.employeeCount}
**Annual Revenue:** ${business.revenue}

## Business Overview

${business.name} is a ${business.industry} company based in ${business.location}. The company has ${business.employeeCount} employees and generates ${business.revenue} in annual revenue.

`;
    
    try {
      await fs.writeFile(filepath, content);
      console.log(`✅ Created: ${filename}`);
      createdCount++;
    } catch (error) {
      console.error(`❌ Error creating ${filename}:`, error.message);
    }
  }
  
  return { createdCount, skippedCount };
}

// Function to list existing business files
async function listExistingFiles() {
  try {
    const files = await fs.readdir(CONFIG.outputDir);
    const mdFiles = files.filter(file => file.endsWith('.md'));
    
    if (mdFiles.length > 0) {
      console.log(`\n📁 Existing business files (${mdFiles.length}):`);
      mdFiles.forEach(file => console.log(`   - ${file}`));
    } else {
      console.log(`\n📁 No existing business files found in ${CONFIG.outputDir}/`);
    }
    
    return mdFiles.length;
  } catch (error) {
    console.log(`\n📁 Directory ${CONFIG.outputDir}/ doesn't exist yet.`);
    return 0;
  }
}

// Main execution function
async function main() {
  try {
    console.log('🔄 Starting business file splitting process...\n');
    
    // Check existing files
    const existingCount = await listExistingFiles();
    
    // Parse business data
    console.log(`📖 Reading business data from ${CONFIG.inputFile}...`);
    const businesses = await parseBusinessData();
    console.log(`📊 Found ${businesses.length} businesses to process\n`);
    
    // Create individual business files
    console.log('📝 Creating individual business files...');
    const { createdCount, skippedCount } = await createBusinessFiles(businesses);
    
    // Summary
    console.log('\n📋 Summary:');
    console.log(`   ✅ Created: ${createdCount} new files`);
    console.log(`   ⏭️  Skipped: ${skippedCount} existing files`);
    console.log(`   📁 Total: ${existingCount + createdCount} business files`);
    console.log(`   📂 Location: ${CONFIG.outputDir}/`);
    
    if (createdCount > 0) {
      console.log('\n✨ Successfully split businesses into individual files!');
      console.log('   You can now run the analysis script: npm run analyze');
    } else {
      console.log('\nℹ️  No new files were created. All businesses already exist.');
      console.log('   To overwrite existing files, set CONFIG.overwriteExisting = true');
    }
    
  } catch (error) {
    console.error('❌ Error in main process:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  parseBusinessData,
  createBusinessFiles,
  listExistingFiles
}; 