/**
 * Application de la règle maison : aucun tiret cadratin nulle part.
 *
 * La consigne est donnée aux modèles dans chaque prompt, mais un modèle finit
 * toujours par en glisser un. La règle étant absolue, elle est aussi appliquée
 * par le code sur chaque sortie textuelle, ce qui la rend réellement garantie.
 */

/**
 * Remplace les tirets cadratins et demi-cadratins par la ponctuation autorisée.
 *
 * Un tiret entouré d'espaces sert d'incise : il devient une virgule. Un tiret
 * collé à ses voisins sert de liaison ou d'intervalle : il devient un trait
 * d'union simple.
 */
export function stripEmDashes(text: string): string {
  if (!text) return text;

  return text
    // Incise ouvrante et fermante sur la même ligne : « mot — incise — suite ».
    .replace(/\s+[—–]\s+/g, ", ")
    // Tiret en début de ligne (liste, dialogue) : trait d'union simple.
    .replace(/^[—–]\s*/gm, "- ")
    // Tiret collé, intervalle ou mot composé : « 1971—1980 ».
    .replace(/[—–]/g, "-")
    // Une virgule d'incise peut en avoir doublé une existante.
    .replace(/,\s*,/g, ",")
    .replace(/\s+,/g, ",");
}

/**
 * Nettoie une sortie de modèle destinée à l'affichage ou au rendu : retire les
 * clôtures de bloc de code, les guillemets englobants et les tirets cadratins.
 */
export function cleanModelText(text: string): string {
  if (!text) return "";

  let cleaned = text.trim();

  // Les modèles encadrent volontiers leur réponse d'un bloc de code.
  const fenced = cleaned.match(/^```(?:\w+)?\s*\n([\s\S]*?)\n?```$/);
  if (fenced) cleaned = fenced[1].trim();

  // Guillemets englobant la totalité de la réponse.
  if (cleaned.length > 1 && /^["«“]/.test(cleaned) && /["»”]$/.test(cleaned)) {
    cleaned = cleaned.slice(1, -1).trim();
  }

  return stripEmDashes(cleaned);
}

/** Transforme un titre en identifiant de fichier utilisable. */
export function slugify(text: string): string {
  return (text || "sujet")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "sujet";
}
