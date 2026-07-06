const fs = require('fs');

let html = fs.readFileSync('src/App.tsx', 'utf8');

// We extract the HTML string from dangerouslySetInnerHTML
const match = html.match(/dangerouslySetInnerHTML=\{\{\s*__html:\s*`([\s\S]*?)`\s*\}\}\s*\/>/);
if (!match) {
  console.log("No match found");
  process.exit(1);
}

let jsx = match[1];

// 1. Unescape $
jsx = jsx.replace(/\\\$/g, '$');
// 2. Unescape backticks
jsx = jsx.replace(/\\`/g, '`');

// 3. Convert class to className
jsx = jsx.replace(/\bclass="/g, 'className="');
// 4. Convert for to htmlFor
jsx = jsx.replace(/\bfor="/g, 'htmlFor="');

// 5. Close unclosed tags (input, hr, img, br, link, meta)
jsx = jsx.replace(/<(input|hr|img|br|link|meta)([^>]*?)(?<!\/)>/g, '<$1$2 />');

// 6. Convert inline event handlers
jsx = jsx.replace(/onclick="app\.([^"]+)"/g, (m, p1) => {
  // Extract arguments if any
  return `onClick={(e) => { if (window.app) window.app.${p1.replace('this', 'e.target').replace('event', 'e')}; }}`;
});
jsx = jsx.replace(/onchange="app\.([^"]+)"/g, (m, p1) => {
  return `onChange={(e) => { if (window.app) window.app.${p1.replace('this', 'e.target').replace('this.value', 'e.target.value')}; }}`;
});
jsx = jsx.replace(/onkeyup="app\.([^"]+)"/g, (m, p1) => {
  return `onKeyUp={(e) => { if (window.app) window.app.${p1.replace('this', 'e.target').replace('this.value', 'e.target.value')}; }}`;
});
jsx = jsx.replace(/onkeyup="window\.app\.([^"]+)"/g, (m, p1) => {
  return `onKeyUp={(e) => { if (window.app) window.app.${p1}; }}`;
});

// 7. Comments <!-- ... --> to {/* ... */}
jsx = jsx.replace(/<!--([\s\S]*?)-->/g, '{/*$1*/}');

const newApp = `
import { useEffect, useRef } from 'react';
import './style.css';

export default function App() {
  return (
    <div className="h-screen overflow-hidden flex flex-col">
      ${jsx}
    </div>
  );
}
`;

fs.writeFileSync('src/App.tsx', newApp);
console.log("Converted successfully");
