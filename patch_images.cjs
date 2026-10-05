const fs = require('fs');
let content = fs.readFileSync('src/components/ClientView.tsx', 'utf8');

const imageLogic = `  // Use reliable static images for the demo
  const getDestinationImage = (day: number) => {
    const images = [
      'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&q=80&w=1200&h=600', // Safari
      'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?auto=format&fit=crop&q=80&w=1200&h=600', // Cape Town
      'https://images.unsplash.com/photo-1506514389966-5085354924c5?auto=format&fit=crop&q=80&w=1200&h=600', // Winelands
      'https://images.unsplash.com/photo-1614531341773-3bff8b7cb3fc?auto=format&fit=crop&q=80&w=1200&h=600', // Victoria Falls
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1200&h=600', // Beach
    ];
    return images[(day - 1) % images.length];
  };`;

content = content.replace(/\/\/\s*Generate a random image[\s\S]*?return `https:\/\/images\.unsplash\.com.*?`;\n  };/, imageLogic);

fs.writeFileSync('src/components/ClientView.tsx', content, 'utf8');
