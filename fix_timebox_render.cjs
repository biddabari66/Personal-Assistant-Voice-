const fs = require('fs');
let content = fs.readFileSync('src/components/Timebox.tsx', 'utf8');

const replacement = `
          {blocks.map((block) => (
            <div 
              key={block.id} 
              className={\`flex flex-col bg-white rounded-3xl border overflow-hidden transition-all duration-300 hover:bg-slate-100 \${activeBlock?.id === block.id ? 'border-executive-gold shadow-[0_0_20px_rgba(197,160,89,0.2)] transform scale-[1.03] ring-1 ring-executive-gold' : 'border-slate-200 hover:border-slate-300'}\`}
            >
              {editingBlockId === block.id ? (
                <div className="p-4 space-y-3">
                  <div className="flex items-center space-x-2">
                     <input type="time" value={editStartTime} onChange={e => setEditStartTime(e.target.value)} className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm font-mono w-full" />
                     <span>-</span>
                     <input type="time" value={editEndTime} onChange={e => setEditEndTime(e.target.value)} className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm font-mono w-full" />
                  </div>
                  <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-2 text-sm" />
                  <div className="flex justify-end space-x-2 pt-2">
                    <button onClick={() => setEditingBlockId(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded bg-slate-100"><X size={16}/></button>
                    <button onClick={() => saveBlockEdit(block.id)} className="p-1.5 text-white bg-slate-900 rounded hover:bg-slate-800"><Check size={16}/></button>
                  </div>
                </div>
              ) : (
                <>
                  <div className={\`w-full flex justify-between items-center py-4 px-6 border-b border-slate-100 \${block.type === 'EVENT' ? 'bg-amber-900/20' : block.type === 'FREE' ? 'bg-transparent text-slate-500' : 'bg-white'}\`}>
                    <div className="flex items-center space-x-3">
                      <Clock size={16} className={block.type === 'EVENT' ? 'text-amber-400' : block.type === 'TASK' ? 'text-blue-400' : 'text-slate-500'} />
                      <span className="text-sm font-mono font-bold text-slate-900">{formatClockTime(block.startTime)}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                       <span className="text-xs font-mono text-slate-500">{formatClockTime(block.endTime)}</span>
                       <button onClick={() => handleEditClick(block)} className="text-slate-400 hover:text-executive-gold transition-colors"><Edit2 size={14}/></button>
                    </div>
                  </div>
                  <div className="flex-1 p-6 flex flex-col justify-between">
                    <div>
                      <span className={\`text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-lg mb-4 inline-block border \${
                        block.type === 'EVENT' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        block.type === 'TASK' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        'bg-white text-slate-500 border-slate-200'
                      }\`}>
                        {block.type}
                      </span>
                      <p className={\`text-xl font-medium tracking-wide mb-4 \${block.type === 'FREE' ? 'text-slate-500 italic' : 'text-slate-700'}\`}>{block.title}</p>
                    </div>
                    <div className="mt-4 flex justify-end">
                      {block.type !== 'FREE' && activeBlock?.id !== block.id && (
                        <button 
                          onClick={() => startBlock(block)}
                          className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-executive-gold hover:text-executive-navy hover:border-executive-gold transition-all transform hover:scale-110 shadow-sm"
                        >
                          <Play size={22} className="ml-1" />
                        </button>
                      )}
                      {activeBlock?.id === block.id && (
                        <div className="flex items-center text-executive-gold font-bold text-sm tracking-widest uppercase bg-executive-gold/10 px-5 py-3 rounded-xl border border-executive-gold/20">
                          <div className="w-2 h-2 rounded-full bg-executive-gold animate-ping mr-3"></div>
                          Active
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
`;

const lines = content.split('\n');
let newLines = [];
let skip = false;
for (let i=0; i<lines.length; i++) {
  if (lines[i].includes('{blocks.map((block) => (')) {
    skip = true;
    newLines.push(replacement);
  }
  
  if (skip && lines[i].includes('))}')) {
    // Also skip the '          ))} '
    skip = false;
    continue;
  }
  
  if (!skip) {
    newLines.push(lines[i]);
  }
}

fs.writeFileSync('src/components/Timebox.tsx', newLines.join('\n'));
