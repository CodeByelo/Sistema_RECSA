const fs = require('fs');
const path = require('path');

const crimesJsonPath = 'C:\\Users\\USR\\OneDrive\\Desktop\\Sistema_RECSA\\scratch\\crimes.json';
const indexPath = 'C:\\Users\\USR\\OneDrive\\Desktop\\Sistema_RECSA\\index.html';

try {
    const crimesData = fs.readFileSync(crimesJsonPath, 'utf8');
    let indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // Find target insertion spot
    const targetText = '    let SYSTEM_USERS = [];';
    const insertion = `\n    // Parsed Penal Code Crimes List\n    const PENAL_CODE_CRIMES = ${crimesData.trim()};\n`;
    
    if (indexContent.includes('const PENAL_CODE_CRIMES =')) {
        console.log('PENAL_CODE_CRIMES already exists in index.html, updating it...');
        // Replace existing one using regex
        indexContent = indexContent.replace(/\/\/ Parsed Penal Code Crimes List[\s\S]*?const PENAL_CODE_CRIMES = \[[\s\S]*?\];/, `// Parsed Penal Code Crimes List\n    const PENAL_CODE_CRIMES = ${crimesData.trim()};`);
    } else {
        console.log('Inserting PENAL_CODE_CRIMES into index.html...');
        indexContent = indexContent.replace(targetText, targetText + insertion);
    }
    
    fs.writeFileSync(indexPath, indexContent, 'utf8');
    console.log('Successfully inserted penal code database into index.html!');
} catch (e) {
    console.error('Error inserting:', e.message);
}
