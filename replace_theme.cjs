const fs = require('fs');
const path = require('path');

const replacements = {
  'bg-executive-navy-mid': 'bg-white',
  'bg-executive-navy-light': 'bg-slate-50',
  'bg-executive-navy': 'bg-slate-50',
  'text-white': 'text-slate-900',
  'text-slate-100': 'text-slate-800',
  'text-slate-200': 'text-slate-700',
  'text-slate-300': 'text-slate-600',
  'text-slate-400': 'text-slate-500',
  'bg-white/5': 'bg-white',
  'bg-white/10': 'bg-slate-50',
  'bg-white/20': 'bg-slate-100',
  'border-white/10': 'border-slate-200',
  'border-white/5': 'border-slate-100',
  'border-white/20': 'border-slate-300',
  'bg-black/20': 'bg-slate-50',
  'bg-black/40': 'bg-slate-100',
  'bg-slate-900': 'bg-slate-50',
  'shadow-\\[0_0_15px_rgba\\(255,255,255,0.1\\)\\]': 'shadow-sm',
  'shadow-\\[0_0_50px_rgba\\(255,255,255,0.2\\)\\]': 'drop-shadow-sm',
  'hover:bg-white/5': 'hover:bg-slate-50',
  'hover:bg-white/10': 'hover:bg-slate-100',
  'hover:bg-white/20': 'hover:bg-slate-200',
  'hover:border-white/20': 'hover:border-slate-300',
  'hover:text-white': 'hover:text-slate-900',
  'from-executive-navy-light': 'from-white',
  'to-executive-navy-mid': 'to-slate-50',
  'from-slate-900': 'from-white',
  'via-slate-900/60': 'via-white/60',
  'to-slate-900/90': 'to-white/90',
  'border-white/10': 'border-slate-200'
};

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  
  for (const [key, value] of Object.entries(replacements)) {
    const regex = new RegExp(`(?<=[\\s"'\\\`])` + key + `(?=[\\s"'\\\`])`, 'g');
    content = content.replace(regex, value);
  }
  
  if (original !== content) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${filePath}`);
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      walk(filePath);
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      processFile(filePath);
    }
  }
}

walk('./src');
