const fs = require('fs');
const path = require('path');

function fix(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let orig = content;
  
  // Fix hover:bg-slate-800 context
  content = content.replace(/bg-slate-50 hover:bg-slate-800 text-slate-900/g, 'bg-slate-900 hover:bg-slate-800 text-white');
  content = content.replace(/bg-slate-50 text-slate-900 rounded-xl text-sm font-medium hover:bg-slate-800/g, 'bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800');
  content = content.replace(/bg-slate-50 text-slate-900 font-medium px-4 py-2 rounded-xl hover:bg-slate-800/g, 'bg-slate-900 text-white font-medium px-4 py-2 rounded-xl hover:bg-slate-800');
  content = content.replace(/bg-slate-50 text-slate-900 rounded-full flex items-center justify-center shadow-lg hover:bg-slate-800/g, 'bg-slate-900 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-slate-800');
  
  if (content !== orig) {
    fs.writeFileSync(filePath, content);
    console.log('Fixed', filePath);
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      walk(filePath);
    } else if (filePath.endsWith('.tsx')) {
      fix(filePath);
    }
  }
}

walk('./src');
