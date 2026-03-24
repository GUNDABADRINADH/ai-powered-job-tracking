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

  // Reduce text contrast in dark mode only
  // Change text-white in dark mode to text-neutral-200
  content = content.replace(/dark:text-white/g, 'dark:text-neutral-200');

  // Fix Navbar background explicitly
  if (file.includes('Navbar.jsx')) {
    content = content.replace(
      /bg-white\/80 dark:bg-white\/5 backdrop-blur-xl border-b border-slate-200 dark:border-white\/10/,
      'bg-white/80 dark:bg-white/4 backdrop-blur-xl border-b border-slate-200 dark:border-white/8'
    );
  }

  fs.writeFileSync(file, content);
});
console.log('Contrast reduction and Navbar update applied successfully.');
