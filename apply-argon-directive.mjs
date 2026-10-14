#!/usr/bin/env node
/**
 * VIEMMA TOURS — AUTOMATED INSTALLER, PDF CSS PATCHER & REPOSITORY UPDATER
 * Target Repository: tnconsultoria19-creator/viemma-tool
 * Base Commit Reference: c1dc8322ff68df14f270329f45d492c0720e8b97
 *
 * Usage:
 *   node apply-argon-directive.mjs
 */

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const BACKUP_DIR = path.join(ROOT, '.argon-backup-' + Date.now());

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function backupFile(relPath) {
  const fullPath = path.join(ROOT, relPath);
  if (fs.existsSync(fullPath)) {
    ensureDir(path.dirname(path.join(BACKUP_DIR, relPath)));
    fs.copyFileSync(fullPath, path.join(BACKUP_DIR, relPath));
    console.log(`[BACKUP] Saved ${relPath} -> ${path.relative(ROOT, path.join(BACKUP_DIR, relPath))}`);
  }
}

console.log('====================================================================');
console.log(' VIEMMA TOURS — FULL INSPECTION, PDF ENGINE & EDITORIAL UI PATCHER');
console.log('====================================================================');

if (!fs.existsSync(path.join(ROOT, 'package.json'))) {
  console.error('ERROR: package.json not found in current directory. Run this script from the root of viemma-tool.');
  process.exit(1);
}

// 1. Wire Argon & PDF Engine exports into src/types.ts
const typesPath = path.join(ROOT, 'src/types.ts');
if (fs.existsSync(typesPath)) {
  backupFile('src/types.ts');
  let existingTypes = fs.readFileSync(typesPath, 'utf8');
  if (!existingTypes.includes('ARGON_DIRECTIVE_TYPES')) {
    existingTypes += `\n\n// --- ARGON_DIRECTIVE_TYPES ---\nexport * from './utils/argonDomainModel';\nexport * from './utils/pdfExportEngine';\n`;
    fs.writeFileSync(typesPath, existingTypes, 'utf8');
    console.log('[PATCH]  Appended Argon Domain Model & PDF Engine exports to src/types.ts');
  }
}

// 2. Patch src/index.css with deterministic multi-page A4 print & PDF rules
const cssPath = path.join(ROOT, 'src/index.css');
if (fs.existsSync(cssPath)) {
  backupFile('src/index.css');
  let existingCss = fs.readFileSync(cssPath, 'utf8');
  if (!existingCss.includes('VIEMMA_DETERMINISTIC_PDF_RULES')) {
    const printCssPatch = `

/* --- VIEMMA_DETERMINISTIC_PDF_RULES --- */
@media print {
  @page {
    size: A4 portrait;
    margin: 0mm;
  }
  html, body, #root {
    height: auto !important;
    min-height: 0 !important;
    overflow: visible !important;
    background: #ffffff !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .no-print {
    display: none !important;
  }
  .viemma-pdf-page {
    width: 210mm !important;
    min-height: 297mm !important;
    max-height: 297mm !important;
    padding: 16mm 18mm !important;
    margin: 0 auto !important;
    page-break-after: always !important;
    break-after: page !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
    box-shadow: none !important;
    border: none !important;
    overflow: hidden !important;
  }
  .viemma-pdf-page:last-child {
    page-break-after: auto !important;
    break-after: auto !important;
  }
}
`;
    fs.writeFileSync(cssPath, existingCss + printCssPatch, 'utf8');
    console.log('[PATCH]  Appended deterministic multi-page A4 print rules to src/index.css');
  }
}

console.log('\n====================================================================');
console.log(' All modules and print rules wired. Run "npm run build" to verify.');
console.log('====================================================================');
