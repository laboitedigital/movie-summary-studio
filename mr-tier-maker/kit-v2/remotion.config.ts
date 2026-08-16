import {Config} from '@remotion/cli/config';
Config.setVideoImageFormat('png');   // indispensable pour conserver l alpha
Config.setOverwriteOutput(true);
// Le telechargement du Chrome Headless Shell de Remotion est bloque par la
// politique de sortie reseau ; on pointe sur le Chromium deja installe.
Config.setBrowserExecutable('/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell');
Config.setChromiumOpenGlRenderer('angle-egl');
