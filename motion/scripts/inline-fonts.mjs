/**
 * Genere src/fonts-inline.ts a partir des .woff2 de public/fonts.
 *
 * Pourquoi : servir les polices via staticFile() declenche une requete HTTP
 * vers le serveur de fichiers de Remotion. Sur un rendu long, les pages
 * creees en cours de route voyaient cette requete se bloquer, et le
 * delayRender() associe expirait (rendu interrompu vers la frame 760).
 * En data URI il n'y a plus aucune requete : le chargement est instantane
 * et le rendu ne peut plus caler dessus.
 *
 * Usage : npm run fonts
 */
import {readFileSync, writeFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

const FACES = [
  {constName: 'POPPINS_600', file: 'Poppins-600.woff2'},
  {constName: 'POPPINS_800', file: 'Poppins-800.woff2'},
  {constName: 'CAVEAT_700', file: 'Caveat-700.woff2'},
];

const parts = FACES.map(({constName, file}) => {
  const b64 = readFileSync(resolve(root, 'public/fonts', file)).toString('base64');
  return `export const ${constName} =\n  'data:font/woff2;base64,${b64}';`;
});

const out = `// Fichier genere par scripts/inline-fonts.mjs — ne pas editer a la main.
// Regenerer avec : npm run fonts
/* eslint-disable */

${parts.join('\n\n')}
`;

writeFileSync(resolve(root, 'src/fonts-inline.ts'), out);
console.log(`src/fonts-inline.ts genere (${FACES.length} polices).`);
