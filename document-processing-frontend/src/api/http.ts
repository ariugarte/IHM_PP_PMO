import type { ApiRoute } from '../config/schema';

export type QueryValue = string | number | boolean | null | undefined | Array<string | number | boolean>;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly code?: string,
    public readonly correlationId?: string,
    public readonly retryable = false,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function buildEndpoint(
  basePath: string,
  route: ApiRoute,
  parameters: Record<string, string | number> = {},
  query: Record<string, QueryValue> = {},
): string {
  if (!/^\/backend\/[a-z0-9-]+$/.test(basePath)) throw new Error(`Base API non autorisée: ${basePath}`);
  const placeholders = [...route.path.matchAll(/\{([^}]+)\}/g)].map((match) => match[1] as string);
  const missing = placeholders.filter((name) => parameters[name] === undefined);
  const unknown = Object.keys(parameters).filter((name) => !placeholders.includes(name));
  if (missing.length) throw new Error(`Paramètres de route manquants: ${missing.join(', ')}`);
  if (unknown.length) throw new Error(`Paramètres de route inconnus: ${unknown.join(', ')}`);
  let path = route.path;
  for (const name of placeholders) path = path.replace(`{${name}}`, encodeURIComponent(String(parameters[name])));
  if (path.includes('{') || path.includes('}')) throw new Error(`Route non résolue: ${path}`);
  const search = new URLSearchParams();
  Object.entries(query).forEach(([key, raw]) => {
    if (raw === undefined || raw === null) return;
    const values = Array.isArray(raw) ? raw : [raw];
    values.forEach((value) => search.append(key, String(value)));
  });
  return `${basePath}${path}${search.size ? `?${search.toString()}` : ''}`;
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  signal?: AbortSignal;
  timeoutMs?: number;
  headers?: Record<string, string>;
};

const statusMessages: Record<number, string> = {
  401: 'Authentification requise',
  403: 'Accès interdit',
  404: 'Ressource introuvable',
  409: 'Conflit avec l’état courant',
  422: 'Données refusées par le service',
  429: 'Trop de requêtes',
  500: 'Erreur interne du service',
};

function backoff(attempt: number) {
  return Math.min(250 * 2 ** attempt, 1500);
}

function delay(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => { window.clearTimeout(timeout); reject(signal.reason); }, { once: true });
  });
}

export class HttpClient {
  constructor(private readonly defaultTimeoutMs = 15_000, private readonly maxGetRetries = 2) {}

  private async request(url: string, options: RequestOptions = {}): Promise<Response> {
    if (!url.startsWith('/backend/')) throw new ApiError('Les appels API doivent rester same-origin sous /backend');
    const method = options.method ?? 'GET';
    const attempts = method === 'GET' ? this.maxGetRetries + 1 : 1;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const timeoutController = new AbortController();
      const timeout = window.setTimeout(() => timeoutController.abort(new DOMException('Délai dépassé', 'TimeoutError')), options.timeoutMs ?? this.defaultTimeoutMs);
      const signal = options.signal ? AbortSignal.any([options.signal, timeoutController.signal]) : timeoutController.signal;
      try {
        const response = await fetch(url, {
          method,
          signal,
          credentials: 'same-origin',
          headers: {
            Accept: 'application/json',
            ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
            ...options.headers,
          },
          body: options.body === undefined ? undefined : JSON.stringify(options.body),
        });
        window.clearTimeout(timeout);
        if (response.ok) return response;
        const correlationId = response.headers.get('x-correlation-id') ?? undefined;
        const errorBody = await response.clone().json().catch(() => null) as { message?: string; code?: string } | null;
        const retryable = response.status === 429 || response.status >= 500;
        if (retryable && attempt < attempts - 1) {
          const retryAfter = Number(response.headers.get('retry-after')) * 1000;
          await delay(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : backoff(attempt), options.signal);
          continue;
        }
        throw new ApiError(errorBody?.message ?? statusMessages[response.status] ?? `Erreur HTTP ${response.status}`, response.status, errorBody?.code, correlationId, retryable);
      } catch (error) {
        window.clearTimeout(timeout);
        if (error instanceof ApiError) throw error;
        if (options.signal?.aborted) throw error;
        if (attempt < attempts - 1) {
          await delay(backoff(attempt), options.signal);
          continue;
        }
        const isTimeout = error instanceof DOMException && error.name === 'TimeoutError';
        throw new ApiError(isTimeout ? 'Délai de réponse dépassé' : 'Service momentanément inaccessible', undefined, isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR', undefined, true);
      }
    }
    throw new ApiError('Requête impossible');
  }

  async json<T>(url: string, options?: RequestOptions): Promise<T> {
    const response = await this.request(url, options);
    return response.json() as Promise<T>;
  }

  async text(url: string, options?: RequestOptions): Promise<string> {
    return (await this.request(url, options)).text();
  }

  async blob(url: string, options?: RequestOptions): Promise<Blob> {
    return (await this.request(url, { ...options, headers: { Accept: 'application/pdf', ...options?.headers } })).blob();
  }
}

export const httpClient = new HttpClient();
