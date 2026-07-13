const fs = require('fs');

const path = 'C:\\Users\\USR\\OneDrive\\Desktop\\Sistema_RECSA\\index.html';

try {
    let content = fs.readFileSync(path, 'utf8');

    // 1. Replace the search results background color (from #070707 to white, add box shadow and position absolute)
    content = content.replace(
        `background: #070707; display: none; padding: 4px; z-index: 100;`,
        `background: #ffffff; display: none; padding: 4px; z-index: 100; box-shadow: 0 4px 20px rgba(0,0,0,0.08); position: absolute; left: 0; right: 0;`
    );

    // 2. Replace the selected container style (from dark blue overlay to slate-50 light style)
    content = content.replace(
        `background: rgba(59, 130, 246, 0.03); border: 1px solid var(--gov-border); padding: 14px; border-radius: 8px; margin-bottom: 16px;`,
        `background: #f8fafc; border: 1px solid var(--gov-border); padding: 16px; border-radius: 8px; margin-bottom: 16px;`
    );

    // 3. Replace the selected container label color (from yellow gov-gold to navy)
    content = content.replace(
        `color:var(--gov-gold); font-size:0.75rem; margin-bottom:8px; display:block; font-weight:700;`,
        `color:var(--gov-navy); font-size:0.75rem; margin-bottom:10px; display:block; font-weight:800; text-transform:uppercase; letter-spacing:0.5px;`
    );

    // 4. Replace the search results list item styling
    const oldSearchItem = `            return \`
            <div onclick="selectCrimeForRecord(\${c.article_id})" 
                 onmouseover="this.style.background='rgba(59, 130, 246, 0.15)'" 
                 onmouseout="this.style.background='transparent'" 
                 style="padding: 10px 12px; border-bottom: 1px solid #1a1a1a; cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: all 0.15s; text-align: left;">
                <div style="flex: 1; padding-right: 10px; overflow: hidden;">
                    <span style="font-weight: 700; color: #fff; font-size: 0.85rem;">\${c.article_id}. \${c.name}</span>
                    <div style="font-size: 0.72rem; color: #555; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">\${c.description}</div>
                </div>
                <div style="text-align: right; flex-shrink: 0; display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
                    <span class="badge \${badgeClass}" style="font-size: 0.65rem; padding: 2px 6px;">\${gradeLabel}</span>
                    \${penaltyText ? \`<span style="font-size: 0.72rem; color: #10b981; font-weight: bold;">\${penaltyText}</span>\` : ''}
                </div>
            </div>
            \`;`;

    const newSearchItem = `            return \`
            <div onclick="selectCrimeForRecord(\${c.article_id})" 
                 onmouseover="this.style.background='var(--gov-off)'" 
                 onmouseout="this.style.background='transparent'" 
                 style="padding: 10px 12px; border-bottom: 1px solid var(--gov-border); cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: all 0.15s; text-align: left;">
                <div style="flex: 1; padding-right: 10px; overflow: hidden;">
                    <span style="font-weight: 700; color: var(--gov-navy); font-size: 0.85rem;">\${c.article_id}. \${c.name}</span>
                    <div style="font-size: 0.72rem; color: #64748b; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">\${c.description}</div>
                </div>
                <div style="text-align: right; flex-shrink: 0; display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
                    <span class="badge \${badgeClass}" style="font-size: 0.65rem; padding: 2px 6px;">\${gradeLabel}</span>
                    \${penaltyText ? \`<span style="font-size: 0.72rem; color: #059669; font-weight: bold;">\${penaltyText}</span>\` : ''}
                </div>
            </div>
            \`;`;

    content = content.replace(oldSearchItem, newSearchItem);

    // 5. Replace the selected items card styling
    const oldSelectedCard = `            return \`
            <div style="display:flex; justify-content:space-between; align-items:center; background:#070707; border:1px solid #1a1a1a; padding:10px 12px; border-radius:6px; gap:10px; margin-bottom: 4px;">
                <div style="flex:1; text-align: left;">
                    <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                        <span class="badge \${badgeClass}" style="font-size:0.65rem; padding:1px 5px;">\${gradeLabel}</span>
                        <strong style="font-size:0.825rem; color:#fff;">\${c.article_id}. \${c.name}</strong>
                    </div>
                    <div style="font-size:0.68rem; color:var(--gov-muted); margin-top:3px; line-height:1.3;">\${c.description}</div>
                </div>
                <div style="text-align:right; flex-shrink:0; display:flex; flex-direction:column; align-items:flex-end; gap:4px;">
                    <span style="font-size:0.75rem; color:#10b981; font-weight:bold;">\${penaltyText || 'Sin sanción física'}</span>
                    <button type="button" class="btn btn-ghost btn-xs" onclick="removeSelectedCrime(\${idx})" style="color:var(--status-red); font-size:0.68rem; padding:2px 6px; border:1px solid rgba(239,68,68,0.15); margin:0;"><i class="fa-solid fa-xmark"></i> Quitar</button>
                </div>
            </div>
            \`;`;

    const newSelectedCard = `            return \`
            <div style="display:flex; justify-content:space-between; align-items:center; background:#ffffff; border:1px solid var(--gov-border); padding:12px 14px; border-radius:6px; gap:10px; margin-bottom: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
                <div style="flex:1; text-align: left;">
                    <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                        <span class="badge \${badgeClass}" style="font-size:0.65rem; padding:1px 5px;">\${gradeLabel}</span>
                        <strong style="font-size:0.85rem; color:var(--gov-navy);">\${c.article_id}. \${c.name}</strong>
                    </div>
                    <div style="font-size:0.72rem; color:#475569; margin-top:4px; line-height:1.3;">\${c.description}</div>
                </div>
                <div style="text-align:right; flex-shrink:0; display:flex; flex-direction:column; align-items:flex-end; gap:6px;">
                    <span style="font-size:0.75rem; color:#059669; font-weight:bold;">\${penaltyText || 'Sin sanción física'}</span>
                    <button type="button" class="btn" onclick="removeSelectedCrime(\${idx})" style="background:#fef2f2; border:1px solid #fee2e2; color:#dc2626; font-size:0.68rem; padding:3px 8px; border-radius:4px; margin:0; font-weight:bold; cursor:pointer;"><i class="fa-solid fa-xmark"></i> Quitar</button>
                </div>
            </div>
            \`;`;

    content = content.replace(oldSelectedCard, newSelectedCard);

    fs.writeFileSync(path, content, 'utf8');
    console.log('Styles fixed successfully in index.html!');
} catch (e) {
    console.error('Error fixing styles:', e.message);
}
