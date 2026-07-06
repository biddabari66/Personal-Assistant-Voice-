const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  content = content.replace(/bg-executive-navy-mid\/30/g, 'bg-slate-50 border-slate-200');
  content = content.replace(/bg-executive-navy-mid\/40/g, 'bg-white shadow-sm');
  content = content.replace(/bg-executive-navy-mid\/50/g, 'bg-slate-100');
  content = content.replace(/bg-executive-navy-mid\/80/g, 'bg-slate-100');
  content = content.replace(/bg-executive-navy-mid\/20/g, 'bg-white');
  content = content.replace(/bg-executive-navy-mid/g, 'bg-white');
  
  content = content.replace(/border-executive-navy-mid\/50/g, 'border-slate-100');
  content = content.replace(/border-executive-navy-mid/g, 'border-slate-200');
  content = content.replace(/border-executive-navy\/50/g, 'border-slate-200');
  content = content.replace(/border-executive-navy/g, 'border-slate-200');

  content = content.replace(/bg-executive-navy/g, 'bg-slate-50');
  
  content = content.replace(/text-executive-gold/g, 'text-blue-600');
  content = content.replace(/bg-executive-gold\/20/g, 'bg-blue-100');
  content = content.replace(/bg-executive-gold\/30/g, 'bg-blue-100');
  content = content.replace(/bg-executive-gold/g, 'bg-blue-600');
  content = content.replace(/border-executive-gold\/50/g, 'border-blue-300');
  content = content.replace(/border-executive-gold\/30/g, 'border-blue-200');
  content = content.replace(/border-executive-gold/g, 'border-blue-600');
  
  content = content.replace(/text-executive-navy/g, 'TEXT_WHITE_PLACEHOLDER');
  content = content.replace(/text-white/g, 'text-slate-900');
  content = content.replace(/TEXT_WHITE_PLACEHOLDER/g, 'text-white');
  
  content = content.replace(/text-gray-200/g, 'text-slate-700');
  content = content.replace(/text-gray-300/g, 'text-slate-600');
  content = content.replace(/text-gray-400/g, 'text-slate-500');
  content = content.replace(/text-gray-500/g, 'text-slate-400');
  
  content = content.replace(/hover:bg-executive-gold\/90/g, 'hover:bg-blue-700');
  content = content.replace(/hover:border-executive-gold\/50/g, 'hover:border-blue-300');
  content = content.replace(/hover:border-executive-gold\/30/g, 'hover:border-blue-200');
  content = content.replace(/hover:bg-executive-navy-mid\/80/g, 'hover:bg-slate-50');
  
  content = content.replace(/bg-executive-danger\/20/g, 'bg-red-100');
  content = content.replace(/bg-executive-danger/g, 'bg-red-500');
  content = content.replace(/text-executive-danger/g, 'text-red-600');
  content = content.replace(/border-executive-danger\/30/g, 'border-red-200');
  content = content.replace(/border-executive-danger/g, 'border-red-500');
  
  content = content.replace(/bg-executive-success\/20/g, 'bg-green-100');
  content = content.replace(/bg-executive-success/g, 'bg-green-500');
  content = content.replace(/text-executive-success/g, 'text-green-600');
  
  content = content.replace(/bg-executive-warning\/20/g, 'bg-amber-100');
  content = content.replace(/bg-executive-warning/g, 'bg-amber-500');
  content = content.replace(/text-executive-warning/g, 'text-amber-600');
  
  content = content.replace(/rgba\(201,168,76,0.15\)/g, 'rgba(37,99,235,0.15)');
  
  content = content.replace(/'bg-red-500 text-slate-900/g, "'bg-red-500 text-white");

  fs.writeFileSync(filePath, content);
}

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      replaceInFile(fullPath);
    }
  }
}

processDir('./src');
console.log('Successfully replaced themes!');
