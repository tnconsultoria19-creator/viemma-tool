const fs = require('fs');
let html = fs.readFileSync('src/App.tsx', 'utf8');

// replace class= with className=
html = html.replace(/ class="/g, ' className="');

// replace on...="..." with React equivalents
// It's tricky to do it perfectly with regex for a full React component if it's currently a string literal inside dangerouslySetInnerHTML.
// Wait, if it's currently dangerouslySetInnerHTML, we can just use a useEffect to attach event listeners to everything!
// That's much easier than fully converting to React!
