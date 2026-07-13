const fs = require('fs');
const lines = fs.readFileSync('C:\\Users\\USR\\OneDrive\\Desktop\\Sistema_RECSA\\index.html', 'utf8').split('\n');
lines.forEach((line, idx) => {
    if (line.includes('🔍')) {
        console.log(`Line ${idx + 1}: ${line}`);
    }
});
