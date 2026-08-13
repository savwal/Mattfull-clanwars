const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('dist') && !file.includes('.git') && !file.includes('.agents')) {
        results = results.concat(walk(file));
      }
    } else {
      if (file.endsWith('.html')) results.push(file);
    }
  });
  return results;
}

const htmlFiles = walk('.');
htmlFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // 1. Inject old-design.css
  if (!content.includes('old-design.css')) {
    content = content.replace(/(<link rel="stylesheet" href="([^"]+)nav\.css">)/, "$1\n<link rel=\"stylesheet\" href=\"$2old-design.css\">");
  }

  // 2. Remove dark-mode class from body
  content = content.replace(/<body class="dark-mode">/g, "<body>");

  // 3. Register sticker
  if (file.includes('register.html') && !content.includes('Redlös 2.0 är här')) {
    const sticker = `</div>\n\n  <div style="background: linear-gradient(135deg, #FFCC00, #FFD700); color: #2C3E50; padding: 12px 20px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 4px 12px rgba(44, 62, 80, 0.15); font-weight: bold; text-align: center; max-width: 400px; width: 100%; box-sizing: border-box; border: 1px solid rgba(44,62,80,0.1);">\n    <span style="font-size: 1.2em; display: block; margin-bottom: 4px;">🎉 Redlös 2.0 är här!</span>\n    <span style="font-size: 0.9em;">En ny design har släppts. Om du föredrar den gamla, kan du byta tillbaka under inställningar i din profil!</span>\n  </div>\n\n  <div class="card">\n    <h2>Ny Krigare</h2>`;
    content = content.replace(/<\/div>\s*<div class="card">\s*<h2>Ny Krigare<\/h2>/, sticker);
  }

  fs.writeFileSync(file, content, 'utf8');
});
console.log('Done!');
