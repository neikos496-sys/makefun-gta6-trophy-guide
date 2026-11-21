// Hands this Leonida trophy guide to make.fun (Node 22, standard library only).
// The guide itself is plain static files in app/ — index.html, its stylesheet and
// script, and app/data/trophies.json — with no build step and nothing fetched over
// the network. This program copies app/ and screenshots/ next to this file into
// the output directory and writes dossier.json there, the summary the judge reads:
// the screenshots, the files of the first load, and the guide's own source.
//
// Run it outside the grader with MAKEFUN_OUTPUT_DIR standing in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// It writes the same bytes every time it runs. Leave vendor/makefun-frontend.ts
// alone: the scorer rebuilds dossier.json with its own copy of that library and
// compares the two byte for byte.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

// The folder this file lives in, and where the entry goes.
const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The scorer's own caps for this bounty (see the kit's reference/gate.json):
// at most 160 KiB of source text in the dossier, 4 screenshots of at most
// 256 KiB each, and app/ at most 993 files and directories and 48 MiB in all.
const dossierLimits = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
};

function copyTree(from, to) {
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
}

mkdirSync(outputDir, { recursive: true });
copyTree(join(repoRoot, 'app'), join(outputDir, 'app'));
if (existsSync(join(repoRoot, 'screenshots'))) {
  copyTree(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'));
}

writeFileSync(join(outputDir, 'dossier.json'), buildDossier(outputDir, dossierLimits));
