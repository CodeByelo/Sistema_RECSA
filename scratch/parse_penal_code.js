const fs = require('fs');

const txtPath = 'C:\\Users\\USR\\.gemini\\antigravity-ide\\brain\\3f7909e5-e843-4982-882e-60cac8a021bc\\.system_generated\\steps\\1552\\content.md';
const jsonOutputPath = 'C:\\Users\\USR\\OneDrive\\Desktop\\Sistema_RECSA\\scratch\\crimes.json';

try {
    const rawText = fs.readFileSync(txtPath, 'utf8');
    const lines = rawText.split('\n');
    
    const crimes = [];
    let currentCrime = null;
    
    // We will parse line by line
    for (let idx = 0; idx < lines.length; idx++) {
        const line = lines[idx].trim();
        if (!line) continue;
        
        // Match article headers like: "2104. Homicidio voluntario (G)."
        // or "2101. Asesinato capital (G)."
        // or "1001. Traición (G)."
        const headerMatch = line.match(/^(\d{4})\.\s+([^(\n]+?)\s*\(([IMG])\)/i);
        if (headerMatch) {
            if (currentCrime) {
                crimes.push(currentCrime);
            }
            
            const articleId = headerMatch[1];
            const name = headerMatch[2].trim();
            const grade = headerMatch[3].toUpperCase(); // I, M, G
            
            currentCrime = {
                article_id: parseInt(articleId),
                name: name,
                grade: grade,
                description: line,
                jail_time: 0,
                fine_min: 0,
                fine_max: 0,
                fianza: 'SÍ'
            };
            continue;
        }
        
        if (currentCrime) {
            // Check for prison sentence minutes, e.g. "mínimo de (20 minutos)" or "(15 minutos) de prisión"
            const jailMatch = line.match(/\((\d+)\s+minutos?\)/i);
            if (jailMatch) {
                currentCrime.jail_time = parseInt(jailMatch[1]);
            }
            
            // Check for fianza
            if (line.toUpperCase().includes('FIANZA: NO')) {
                currentCrime.fianza = 'NO';
            }
            
            // Check for fines, e.g. "MULTA: Entre $50.000 y $100.000."
            // or "MULTA: Entre $5.000 y $20.000."
            const fineRangeMatch = line.match(/MULTA:\s*Entre\s*\$(\d+[\d.,]*)\s+y\s+\$(\d+[\d.,]*)/i);
            if (fineRangeMatch) {
                currentCrime.fine_min = parseInt(fineRangeMatch[1].replace(/[.,]/g, ''));
                currentCrime.fine_max = parseInt(fineRangeMatch[2].replace(/[.,]/g, ''));
            } else {
                const fineSingleMatch = line.match(/MULTA:\s*\$(\d+[\d.,]*)/i);
                if (fineSingleMatch) {
                    const val = parseInt(fineSingleMatch[1].replace(/[.,]/g, ''));
                    currentCrime.fine_min = val;
                    currentCrime.fine_max = val;
                }
            }
            
            // Append line to description
            if (!line.startsWith('FIANZA:') && !line.startsWith('MULTA:') && !line.startsWith('((')) {
                currentCrime.description += ' ' + line;
            }
        }
    }
    
    if (currentCrime) {
        crimes.push(currentCrime);
    }
    
    // Write out crimes list
    fs.writeFileSync(jsonOutputPath, JSON.stringify(crimes, null, 2), 'utf8');
    console.log(`Parsed ${crimes.length} crimes successfully.`);
} catch (e) {
    console.error('Error parsing:', e.message);
}
