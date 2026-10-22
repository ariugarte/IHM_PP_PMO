import type { ApiRoute, AppConfig } from '../config/schema';
import { buildEndpoint, type QueryValue } from './http';

export function endpoint(
  config: AppConfig,
  backend: keyof AppConfig['backends'],
  routeName: string,
  parameters: Record<string, string | number> = {},
  query: Record<string, QueryValue> = {},
): { url: string; route: ApiRoute } {
  const service = config.backends[backend];
  const route = service.routes[routeName];
  if (!route) throw new Error(`Route inconnue: ${String(backend)}.${routeName}`);
  return { url: buildEndpoint(service.basePath, route, parameters, query), route };
}
