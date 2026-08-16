/** Reperes sonores. Aucun audio n est embarque dans les rendus : chaque
 *  composition declare ses evenements, le montage ffmpeg pose les bruitages. */
export type Marker = {name: string; frame: number; timeSec: number};

export const marker = (name: string, frame: number, fps: number): Marker => ({
  name, frame, timeSec: +(frame / fps).toFixed(4),
});

export const emitMarkers = (list: Marker[]) => {
  // Recuperable depuis le rendu via --log=verbose, ou via le fichier ecrit par render.sh
  if (typeof window !== 'undefined') (window as any).__markers = list;
  return list;
};
