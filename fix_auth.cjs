const fs = require('fs');
let code = fs.readFileSync('src/components/Auth.tsx', 'utf8');

code = code.replace(
  '      <div className="hidden lg:flex lg:w-1/2 bg-slate-50 relative overflow-hidden flex-col justify-between p-16">',
  '      <div className="hidden lg:flex lg:w-1/2 bg-slate-50 relative overflow-hidden flex-col justify-center p-16">'
);

code = code.replace(
  '        <div className="relative z-10 flex items-center gap-4">',
  '        <div className="relative z-10 flex items-center gap-4 mb-16">'
);

fs.writeFileSync('src/components/Auth.tsx', code);
