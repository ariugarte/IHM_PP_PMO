import type { AppConfig } from '../../config/schema';
import type { Contract, GedContractOption } from '../../domain/models';
import { httpClient } from '../http';
import { endpoint } from '../routes';
import { adaptCatalog, adaptGedContracts } from './adapters';

export async function listGedContracts(config: AppConfig, signal?: AbortSignal): Promise<GedContractOption[]> {
  const { url } = endpoint(config, 'source', 'gedContracts');
  return adaptGedContracts(await httpClient.json(url, { signal }));
}

export async function listContracts(config: AppConfig, workflowId: string, signal?: AbortSignal): Promise<Contract[]> {
  const { url } = endpoint(config, 'catalog', 'listContractsWithDocuments', { workflowId });
  return adaptCatalog(await httpClient.json(url, { signal }));
}
