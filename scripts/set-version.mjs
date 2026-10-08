// Met la même version dans package.json, tauri.conf.json et Cargo.toml.
// Usage : node scripts/set-version.mjs 0.2.0
import { readFileSync, writeFileSync } from 'node:fs';

const version = process.argv[2];
if (!/^\d+\.\d+\.\d+$/.test(version ?? '')) {
  console.error('Version invalide. Exemple : node scripts/set-version.mjs 0.2.0');
  process.exit(1);
}

const updateJson = (path) => {
  const data = JSON.parse(readFileSync(path, 'utf8'));
  data.version = version;
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
};

updateJson('package.json');
updateJson('src-tauri/tauri.conf.json');

const cargo = readFileSync('src-tauri/Cargo.toml', 'utf8');
writeFileSync('src-tauri/Cargo.toml', cargo.replace(/^version = "[^"]+"/m, `version = "${version}"`));

console.log(`Version ${version} appliquée.`);
