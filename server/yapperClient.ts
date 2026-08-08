/**
 * Client REST Yapper (yapper.so), utilisé pour les images et les vidéos du
 * moteur Vox.
 *
 * Une génération Yapper dépense de vrais crédits d'équipe. Le client impose donc
 * deux garde-fous repris de la documentation de l'API :
 *  - toute dépense peut être chiffrée d'abord via dryRun, qui ne facture rien
 *  - tout lancement réel porte une clé d'idempotence, pour qu'un renvoi après
 *    coupure réseau ne facture jamais deux fois la même image
 *
 * L'URL de base et le nom de l'en-tête d'authentification sont configurables :
 * l'API est privée et son schéma d'authentification peut évoluer sans que le
 * code ait besoin d'être repris.
 */

const DEFAULT_BASE_URL = "https://yapper.so/api/v1";

export interface YapperCredits {
  totalCredits: number;
  usedCredits: number;
  availableCredits: number;
  purchaseUrl?: string;
}

export interface YapperDryRun {
  dryRun: true;
  type: string;
  model: string;
  creditsEstimated: number;
  canStart: boolean;
  blockedBy: string | null;
  credits?: { available: number };
  estimatedCompletionSeconds?: number;
}

export type YapperProcessStatus = "queued" | "running" | "completed" | "failed" | string;

export interface YapperProcess {
  id: string;
  status: YapperProcessStatus;
  type?: string;
  model?: string;
  error?: string | null;
  [key: string]: unknown;
}

export class YapperError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly url?: string
  ) {
    super(message);
    this.name = "YapperError";
  }
}

function baseUrl(): string {
  return (process.env.YAPPER_API_URL || DEFAULT_BASE_URL).replace(/\/+$/, "");
}

function apiKey(): string {
  const raw = process.env.YAPPER_API_KEY;
  if (!raw) {
    throw new YapperError(
      "YAPPER_API_KEY n'est pas configurée. Ajoutez votre clé d'API Yapper dans le fichier .env " +
        "(ou dans le panneau Secrets) pour générer les images et les vidéos du moteur Vox.",
      400
    );
  }
  return raw.replace(/^["']|["']$/g, "").trim();
}

/**
 * En-têtes d'authentification. Yapper attend un jeton porteur ; le nom de
 * l'en-tête reste surchargeable pour absorber un changement côté API sans
 * toucher au code.
 */
function authHeaders(): Record<string, string> {
  const key = apiKey();
  const headerName = process.env.YAPPER_AUTH_HEADER || "Authorization";
  const value = headerName.toLowerCase() === "authorization" ? `Bearer ${key}` : key;
  return { [headerName]: value };
}

async function request<T>(
  path: string,
  init: { method?: string; body?: unknown; headers?: Record<string, string> } = {}
): Promise<T> {
  const url = `${baseUrl()}${path}`;
  const response = await fetch(url, {
    method: init.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...(init.headers || {}),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });

  const rawText = await response.text();
  let payload: any = null;
  try {
    payload = rawText ? JSON.parse(rawText) : null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const code = payload?.code || payload?.error?.code;
    const detail = payload?.message || payload?.error?.message || rawText.slice(0, 400);

    // Les deux échecs de facturation sont renvoyés tels quels : ils ne se
    // réessaient pas, seul un rechargement ou un administrateur les débloque.
    if (code === "insufficient_credits") {
      throw new YapperError(
        `Crédits Yapper insuffisants pour lancer cette génération. ${detail || ""} ` +
          "Recharge sur https://yapper.so/account/usage?tab=credits",
        response.status,
        code,
        url
      );
    }
    if (code === "member_credit_limit_reached") {
      throw new YapperError(
        `Le plafond mensuel de crédits de ce membre Yapper est atteint. ${detail || ""} ` +
          "Seul un administrateur de l'équipe peut le relever.",
        response.status,
        code,
        url
      );
    }

    throw new YapperError(
      `Yapper a renvoyé une erreur ${response.status} sur ${path} : ${detail || "réponse vide"}`,
      response.status,
      code,
      url
    );
  }

  return payload as T;
}

/** Solde de crédits de l'équipe connectée. */
export function getCredits(): Promise<YapperCredits> {
  return request<YapperCredits>("/credits");
}

/** Catalogue des modèles disponibles. */
export function listModels(): Promise<{ data: any[] }> {
  return request<{ data: any[] }>("/models");
}

export interface StartProcessInput {
  type: "image-generation" | "video-generation";
  model: string;
  input: Record<string, unknown>;
  dryRun?: boolean;
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Chiffre une génération sans rien dépenser.
 *
 * À appeler avant tout lancement réel : c'est ce montant qui est présenté à
 * l'utilisateur pour validation.
 */
export function estimateProcess(params: Omit<StartProcessInput, "dryRun">): Promise<YapperDryRun> {
  return request<YapperDryRun>("/processes", {
    method: "POST",
    body: { ...params, dryRun: true },
  });
}

/** Lance une génération réelle. Dépense des crédits. */
export function startProcess(params: StartProcessInput): Promise<YapperProcess> {
  const { idempotencyKey, ...body } = params;
  return request<YapperProcess>("/processes", {
    method: "POST",
    body: { ...body, dryRun: false },
    headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {},
  });
}

/** Lit l'état d'une génération. */
export function getProcess(processId: string): Promise<YapperProcess> {
  return request<YapperProcess>(`/processes/${encodeURIComponent(processId)}`);
}

/**
 * Extrait l'URL du média produit par une génération terminée.
 *
 * La forme exacte de la réponse dépend du modèle et du type de sortie, d'où le
 * balayage des emplacements connus plutôt qu'un accès à un champ unique.
 */
export function extractOutputUrl(process: YapperProcess): string | null {
  const candidates: unknown[] = [
    (process as any).outputUrl,
    (process as any).output?.url,
    (process as any).output?.[0]?.url,
    (process as any).outputs?.[0]?.url,
    (process as any).assets?.[0]?.url,
    (process as any).asset?.url,
    (process as any).result?.url,
    (process as any).result?.assets?.[0]?.url,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && /^https?:\/\//.test(candidate)) return candidate;
  }
  return null;
}

/** Vrai quand la génération a atteint un état terminal, réussi ou échoué. */
export function isTerminal(status: YapperProcessStatus): boolean {
  return status === "completed" || status === "failed" || status === "cancelled";
}

/**
 * Interroge une génération jusqu'à son état terminal.
 *
 * Le pas de sondage démarre court puis s'allonge : une image sort en une
 * centaine de secondes, une vidéo en une quinzaine de minutes, et sonder toutes
 * les deux secondes pendant un quart d'heure ne sert qu'à charger l'API.
 */
export async function waitForProcess(
  processId: string,
  options: { timeoutMs?: number; onPoll?: (process: YapperProcess) => void } = {}
): Promise<YapperProcess> {
  const timeoutMs = options.timeoutMs ?? 30 * 60 * 1000;
  const startedAt = Date.now();
  let delay = 3000;

  for (;;) {
    const process = await getProcess(processId);
    options.onPoll?.(process);

    if (isTerminal(process.status)) return process;

    if (Date.now() - startedAt > timeoutMs) {
      throw new YapperError(
        `La génération Yapper ${processId} n'a pas abouti dans le délai imparti (${Math.round(timeoutMs / 60000)} minutes).`,
        504
      );
    }

    await new Promise((resolve) => setTimeout(resolve, delay));
    delay = Math.min(delay * 1.5, 20000);
  }
}

/** Vrai quand une clé d'API Yapper est configurée. */
export function isConfigured(): boolean {
  return !!process.env.YAPPER_API_KEY;
}
