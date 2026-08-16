import {Config} from '@remotion/cli/config';
Config.setVideoImageFormat('png');   // indispensable pour conserver l alpha
Config.setOverwriteOutput(true);
// Le telechargement du Chrome Headless Shell de Remotion est bloque par la
// politique de sortie reseau de la session ; on pointe sur le Chromium deja
// installe. Sur un runner GitHub ce chemin n existe pas et le reseau est
// ouvert : on laisse alors Remotion telecharger le sien.
import {existsSync} from 'fs';
const LOCAL = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const BROWSER = process.env.REMOTION_BROWSER || (existsSync(LOCAL) ? LOCAL : null);
if (BROWSER) Config.setBrowserExecutable(BROWSER);
Config.setChromiumOpenGlRenderer('angle-egl');
