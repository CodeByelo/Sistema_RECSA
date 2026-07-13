const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\USR\\OneDrive\\Desktop\\Sistema_RECSA\\index.html', 'utf8');

// Find the style blocks
const styles = content.match(/<style>([\s\S]*?)<\/style>/i);
if (styles) {
    const rootBlock = styles[1].match(/:root\s*\{([\s\S]*?)\}/i);
    if (rootBlock) {
        console.log('ROOT CSS VARIABLES:', rootBlock[1].trim());
    } else {
        console.log('No :root block found in style.');
    }
} else {
    console.log('No style tag found.');
}
