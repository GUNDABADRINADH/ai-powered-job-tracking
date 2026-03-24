const fs = require('fs');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.jsx')) results.push(file);
    }
  });
  return results;
}

const files = walk('./src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Fix 1
  content = content.replace(/hover:bg-black dark:bg-white hover: /g, 'hover:bg-neutral-800 dark:hover:bg-neutral-200 ');
  
  // Fix 2
  content = content.replace(/bg-gradient-to-[a-z]+ bg-black dark:bg-white/g, 'bg-black dark:bg-white');
  
  // Fix 3
  let regex = /className="([^"]*bg-black dark:bg-white[^"]*text-white[^"]*)"/g;
  content = content.replace(regex, (match, p1) => {
    if (p1.includes('dark:text-black')) return match;
    let newClass = p1.replace(/\btext-white\b/, 'text-white dark:text-black');
    return `className="${newClass}"`;
  });

  // Fix 4 (ChatBubble strange class)
  content = content.replace(/bg-black dark:bg-white dark:bg-black dark:bg-white\/20 dark:\/20/g, 'bg-black dark:bg-white/10 text-white dark:text-black');

  content = content.replace(/ {2,}/g, ' ');

  fs.writeFileSync(file, content);
});
console.log('Cleanup script finished.');
