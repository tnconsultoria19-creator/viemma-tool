const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const replacement = ``;

content = content.replace(/    const script = document\.createElement\('script'\);[\s\S]*?\}, \[\]\);/g, '');

fs.writeFileSync('src/App.tsx', content);
