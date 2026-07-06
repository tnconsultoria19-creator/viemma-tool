const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const replacement = `    const script = document.createElement('script');
    script.src = '/app.js';
    script.type = 'text/javascript';
    document.body.appendChild(script);
    
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };`;

content = content.replace(/\(window as any\)\.app = \{[\s\S]*?\};\s*\}, \[\]\);/g, replacement + '\n  }, []);');

fs.writeFileSync('src/App.tsx', content);
