import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const REPO_ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const README_PATH = join(REPO_ROOT, 'README.md');

const OWNER = 'loreweld';
const EXCLUDED = new Set(['loreweld', 'remember_eva']);
const START = '<!-- PROJELER-BASLANGIC -->';
const END = '<!-- PROJELER-BITIS -->';

// El ile yazilmis (nitelikli) tablo tanimlari. Yeni bir repo actiginda buraya
// bir satir ekle; geri kalan satirlar (yeni public repolar dahil) otomatiktir.
const CURATED = [
  { name: 'REMEMBER_EVA_AI', desc: 'Modüler AI masaüstü asistanı — PySide6, async Factory, Fast/Slow Path, RAG bellek', private: true },
  { name: 'OGMA', desc: 'Proje Analiz Asistanı — Hibrit AST + LLM mimari analiz', private: false },
  { name: 'AI_HUMAN_DESIGN', desc: 'AI Zihin/Şahsiyet Transferi — 12 katmanlı persona + 5 aşamalı pipeline', private: true },
  { name: 'RAVENART_DEVKIT', desc: 'AI Geliştirme Destek Sistemi — mimari haritalama, teknik borç, kalite', private: false },
  { name: 'Twinigma', desc: 'Benzerlik bazlı casting başvuru platformu — Expo + Supabase', private: true },
  { name: 'Lugh-AI-Forge', desc: 'Model Transformation Studio — GGUF analiz, abliteration, QLoRA, doğrulama', private: true },
];

function cleanDesc(d = '') {
  return d.split(' | Geliştiren')[0].trim();
}

const headers = { Accept: 'application/vnd.github+json', 'User-Agent': OWNER };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

const res = await fetch(`https://api.github.com/users/${OWNER}/repos?per_page=100&sort=pushed`, { headers });
if (!res.ok) {
  console.error(`GitHub API hatasi: ${res.status}`);
  process.exit(1);
}
const repos = await res.json();

const curatedNames = new Set(CURATED.map((r) => r.name));
const extra = [];
for (const r of repos) {
  if (EXCLUDED.has(r.name) || curatedNames.has(r.name) || r.fork) continue;
  extra.push({ name: r.name, desc: cleanDesc(r.description), private: r.private });
}
extra.sort((a, b) => a.name.localeCompare(b.name));

const mark = (private_) => (private_ ? '🗝️' : '🌍');
const rows = [];
for (const r of CURATED) {
  rows.push(`| [**${r.name}**](https://github.com/${OWNER}/${r.name}) | ${r.desc} | ${mark(r.private)} |`);
}
for (const r of extra) {
  rows.push(`| [**${r.name}**](https://github.com/${OWNER}/${r.name}) | ${r.desc || '—'} | ${mark(r.private)} |`);
}

let md = await readFile(README_PATH, 'utf8');
if (!md.includes(START) || !md.includes(END)) {
  console.error('Markör bulunamadı — README değiştirilmedi.');
  process.exit(1);
}
const block = `${START}\n${rows.join('\n')}\n${END}`;
md = md.replace(new RegExp(`${START}\n[\\s\\S]*?\n${END}`), block);
await writeFile(README_PATH, md, 'utf8');
console.log(`Tablo guncellendi: ${rows.length} satir.`);