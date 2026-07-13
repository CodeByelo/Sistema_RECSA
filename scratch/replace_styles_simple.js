const fs = require('fs');
const path = 'C:\\Users\\USR\\OneDrive\\Desktop\\Sistema_RECSA\\index.html';

try {
    let content = fs.readFileSync(path, 'utf8');

    // 1. Search Results List Item Hover Background
    content = content.replace(
        "onmouseover=\"this.style.background='rgba(59, 130, 246, 0.15)'\"",
        "onmouseover=\"this.style.background='var(--gov-off)'\""
    );

    // 2. Search Results List Item Border Bottom
    content = content.replace(
        "style=\"padding: 10px 12px; border-bottom: 1px solid #1a1a1a;",
        "style=\"padding: 10px 12px; border-bottom: 1px solid var(--gov-border);"
    );

    // 3. Search Results List Item Title Color (from #fff to navy)
    content = content.replace(
        "color: #fff; font-size: 0.85rem;\">${c.article_id}. ${c.name}</span>",
        "color: var(--gov-navy); font-size: 0.85rem;\">${c.article_id}. ${c.name}</span>"
    );

    // 4. Search Results List Item Description Color (from #555 to #64748b)
    content = content.replace(
        "color: #555; text-overflow:",
        "color: #64748b; text-overflow:"
    );

    // 5. Search Results List Item Penalty Text Color (from #10b981 to #059669)
    content = content.replace(
        "color: #10b981; font-weight: bold;\">${penaltyText}</span>",
        "color: #059669; font-weight: bold;\">${penaltyText}</span>"
    );

    // 6. Selected Crimes Box Background & Border (from #070707 & #1a1a1a to white & var(--gov-border))
    content = content.replace(
        "background:#070707; border:1px solid #1a1a1a;",
        "background:#ffffff; border:1px solid var(--gov-border);"
    );

    // 7. Selected Crimes Box Title Color (from #fff to navy)
    content = content.replace(
        "color:#fff;\">${c.article_id}. ${c.name}</strong>",
        "color:var(--gov-navy);\">${c.article_id}. ${c.name}</strong>"
    );

    // 8. Selected Crimes Box Description Color (from var(--gov-muted) to #475569)
    content = content.replace(
        "color:var(--gov-muted); margin-top:3px; line-height:1.3;\">${c.description}</div>",
        "color:#475569; margin-top:4px; line-height:1.3;\">${c.description}</div>"
    );

    // 9. Selected Crimes Box Penalty Color (from #10b981 to #059669)
    content = content.replace(
        "color:#10b981; font-weight:bold;\">${penaltyText || 'Sin sanción física'}</span>",
        "color:#059669; font-weight:bold;\">${penaltyText || 'Sin sanción física'}</span>"
    );

    // 10. Selected Crimes Box Remove Button style
    content = content.replace(
        "button type=\"button\" class=\"btn btn-ghost btn-xs\" onclick=\"removeSelectedCrime(${idx})\" style=\"color:var(--status-red); font-size:0.68rem; padding:2px 6px; border:1px solid rgba(239,68,68,0.15); margin:0;\"",
        "button type=\"button\" class=\"btn btn-xs\" onclick=\"removeSelectedCrime(${idx})\" style=\"background:#fef2f2; border:1px solid #fee2e2; color:#dc2626; font-size:0.68rem; padding:3px 8px; border-radius:4px; margin:0; font-weight:bold; cursor:pointer;\""
    );

    fs.writeFileSync(path, content, 'utf8');
    console.log('Simple styles replacement completed!');
} catch (e) {
    console.error('Error:', e.message);
}
