const fs = require('fs');
const path = require('path');

const dirs = [
  { name: 'user', dir: 'user/dist/assets' },
  { name: 'admin', dir: 'admin/dist/assets' },
  { name: 'entity', dir: 'entity/dist/assets' },
];

console.log('--- Scanning compiled production bundles for localhost/127.0.0.1 leaks ---');

let totalLeaks = 0;

dirs.forEach(({ name, dir }) => {
  if (!fs.existsSync(dir)) {
    console.log(`[WARN] Directory ${dir} does not exist`);
    return;
  }
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
  files.forEach(f => {
    const fp = path.join(dir, f);
    const content = fs.readFileSync(fp, 'utf8');

    // Look for localhost or 127.0.0.1 not part of localhost detection logic
    // In our axios.js, we have fallback strings like 'http://127.0.0.1:8000/api'
    // Let's check occurrences and context
    const matches = [];
    const regex = /(https?:\/\/(?:localhost|127\.0\.0\.1)[^\s"';]*)/gi;
    let m;
    while ((m = regex.exec(content)) !== null) {
      matches.push(m[1]);
    }

    if (matches.length > 0) {
      console.log(`[${name}] ${f} has ${matches.length} matches:`, [...new Set(matches)]);
    } else {
      console.log(`[${name}] ${f} has NO localhost URLs.`);
    }
  });
});
