import fs from 'fs';
import path from 'path';

// `as any` cast sayacı — CI'da regresyon tespiti için.
// Kullanım: node scripts/scan-casts.mjs [--threshold N]
// Çıktı: TOTAL: N  |  THRESHOLD: N  |  STATUS: ok | exceeded
// Eşik aşılırsa GitHub Actions ::warning çıktısı basar (build yine de geçer).

const thresholdArg = process.argv.indexOf('--threshold');
const threshold = thresholdArg !== -1 ? parseInt(process.argv[thresholdArg + 1], 10) : 0;

const re = /\bas\s+any\b/;
const out = [];
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (['node_modules', 'dist', 'dev-dist', '.git'].includes(e.name)) continue;
      walk(p);
    } else if (/\.(ts|tsx)$/.test(e.name)) {
      const lines = fs.readFileSync(p, 'utf8').split('\n');
      lines.forEach((line, i) => {
        const trimmed = line.trim();
        if (re.test(trimmed)) {
          out.push(`${p.replaceAll('\\', '/')}:${i + 1}: ${trimmed.slice(0, 140)}`);
        }
      });
    }
  }
}
walk('src');
for (const l of out) console.log(l);
const total = out.length;
console.log(`TOTAL: ${total}`);
console.log(`THRESHOLD: ${threshold}`);
const exceeded = total > threshold;
console.log(`STATUS: ${exceeded ? 'exceeded' : 'ok'}`);
if (exceeded) {
  console.warn(`::warning file=README.md::"as any" cast sayisi ${total} — esik ${threshold}. Temizleyin veya esigi bilincli artirin.`);
  if (total >= 100) {
    console.warn(`::error::"as any" cast sayisi cok yuksek (${total}) — derleme kilitlendi.`);
    process.exit(1);
  }
}