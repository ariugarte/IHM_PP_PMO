import { appConfigSchema, documentTypeRegistrySchema, type AppConfig, type DocumentTypeRegistry } from './schema';

export class ConfigurationError extends Error {
  constructor(public readonly resource: string, public readonly details: string) {
    super(`Configuration invalide (${resource}): ${details}`);
    this.name = 'ConfigurationError';
  }
}

async function loadJson<T>(url: string, parse: (value: unknown) => { success: boolean; data?: T; error?: { message: string } }): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, { cache: 'no-store', headers: { Accept: 'application/json' } });
  } catch (error) {
    throw new ConfigurationError(url, error instanceof Error ? error.message : 'Erreur réseau');
  }
  if (!response.ok) throw new ConfigurationError(url, `HTTP ${response.status}`);
  const raw: unknown = await response.json().catch(() => { throw new ConfigurationError(url, 'JSON illisible'); });
  const result = parse(raw);
  if (!result.success || !result.data) throw new ConfigurationError(url, result.error?.message ?? 'Format inconnu');
  return result.data;
}

export async function loadRuntimeConfiguration(): Promise<{ appConfig: AppConfig; documentTypes: DocumentTypeRegistry }> {
  const [appConfig, documentTypes] = await Promise.all([
    loadJson('/config/app-config.json', (value) => appConfigSchema.safeParse(value)),
    loadJson('/config/document-types.json', (value) => documentTypeRegistrySchema.safeParse(value)),
  ]);
  return { appConfig, documentTypes };
}
