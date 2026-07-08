const fs = require('fs');

let css = fs.readFileSync('src/index.css', 'utf8');
css = css.replace(
  "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;1,400;1,600&family=JetBrains+Mono:wght@300;400;500&display=swap');",
  "@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500&display=swap');"
);

css = css.replace(
  '--font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;',
  '--font-sans: "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif;'
);

css = css.replace(
  '--font-serif: "Playfair Display", ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;',
  '--font-serif: "Outfit", ui-sans-serif, system-ui, sans-serif;'
);

css = css.replace(
  'font-family: var(--font-sans);',
  'font-family: var(--font-sans);'
);

fs.writeFileSync('src/index.css', css);
