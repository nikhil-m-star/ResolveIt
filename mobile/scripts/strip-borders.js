const fs = require('fs');
const path = require('path');

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory() && e.name !== 'node_modules') walk(p, acc);
    else if (/\.(tsx|ts|js)$/.test(e.name)) acc.push(p);
  }
  return acc;
}

const borderLine =
  /^\s*border(?!(Radius|TopLeftRadius|TopRightRadius|BottomLeftRadius|BottomRightRadius))(?:Width|Color|Style|BottomWidth|BottomColor|TopWidth|TopColor|LeftWidth|LeftColor|RightWidth|RightColor):\s*[^,\n]+,?\s*\n/gm;

const inlineBorderColor = /borderColor:\s*['"][^'"]+['"],?\s*/g;

const paletteBorder =
  /Palette\.(?:borderSubtle|border|accentBorder|dangerBorder)/g;

let changed = 0;
for (const f of walk(path.join(__dirname, '../src'))) {
  let c = fs.readFileSync(f, 'utf8');
  const orig = c;
  c = c.replace(borderLine, '');
  c = c.replace(inlineBorderColor, '');
  c = c.replace(paletteBorder, 'transparent');
  c = c.replace(/,(\s*,)+/g, ',');
  c = c.replace(/,\s*(\})/g, '$1');
  if (c !== orig) {
    fs.writeFileSync(f, c);
    changed++;
  }
}
console.log('Updated', changed, 'files');
