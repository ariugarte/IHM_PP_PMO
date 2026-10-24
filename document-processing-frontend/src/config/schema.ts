import { z } from 'zod';

const routeSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  path: z.string().regex(/^\/[A-Za-z0-9_{}./-]*$/, 'Route API relative invalide')
    .refine((path) => !path.includes('..') && !path.includes('//'), 'La route ne peut pas traverser de répertoire'),
});

const backendSchema = z.object({
  basePath: z.string().regex(/^\/backend\/[a-z0-9-]+$/, 'Le chemin doit rester sous /backend'),
  routes: z.record(z.string(), routeSchema),
});

const statusAliasesSchema = z.record(
  z.enum(['queued', 'running', 'succeeded', 'failed', 'cancelled']),
  z.array(z.string().min(1)).min(1),
).superRefine((groups, ctx) => {
  const seen = new Map<string, string>();
  for (const [canonical, aliases] of Object.entries(groups)) {
    for (const alias of aliases) {
      const key = alias.toLowerCase();
      if (seen.has(key) && seen.get(key) !== canonical) {
        ctx.addIssue({ code: 'custom', message: `Alias de statut dupliqué: ${alias}` });
      }
      seen.set(key, canonical);
    }
  }
});

export const appConfigSchema = z.object({
  version: z.literal(1),
  app: z.object({ name: z.string().min(1), defaultLocale: z.enum(['fr', 'en']) }),
  mock: z.object({ enabled: z.boolean(), scenario: z.enum(['happy-path', 'partial-failure', 'slow-processing']) }),
  features: z.object({ chatEnabled: z.boolean(), showConfidence: z.boolean() }),
  polling: z.object({
    intervalMs: z.number().int().min(100),
    maxIntervalMs: z.number().int().min(100),
    maxDurationMs: z.number().int().min(1000),
    concurrency: z.number().int().min(1).max(12).default(4),
  }).refine((value) => value.maxIntervalMs >= value.intervalMs, 'maxIntervalMs doit être >= intervalMs'),
  taskStatus: statusAliasesSchema,
  backends: z.object({
    source: backendSchema,
    catalog: backendSchema,
    processing: backendSchema,
    chat: backendSchema,
  }),
});

export type AppConfig = z.infer<typeof appConfigSchema>;
export type ApiRoute = z.infer<typeof routeSchema>;

const localizedLabelSchema = z.object({ fr: z.string().min(1), en: z.string().min(1) });
const configurableIdSchema = z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]*$/, 'Identifiant invalide');

const documentSearchTypeGroupSchema = z.object({
  id: configurableIdSchema,
  label: localizedLabelSchema,
  types: z.array(z.object({ id: configurableIdSchema, label: localizedLabelSchema })).min(1),
});

export const documentSearchTypesSchema = z.object({
  version: z.literal(1),
  clientTypes: z.object({
    PP: z.object({ groups: z.array(documentSearchTypeGroupSchema).min(1) }),
    PMO: z.object({ groups: z.array(documentSearchTypeGroupSchema).min(1) }),
  }),
}).superRefine((config, ctx) => {
  for (const [clientType, clientConfig] of Object.entries(config.clientTypes)) {
    const groupIds = new Set<string>();
    const typeIds = new Set<string>();
    clientConfig.groups.forEach((group, groupIndex) => {
      if (groupIds.has(group.id)) ctx.addIssue({ code: 'custom', path: ['clientTypes', clientType, 'groups', groupIndex, 'id'], message: `Groupe dupliqué: ${group.id}` });
      groupIds.add(group.id);
      group.types.forEach((type, typeIndex) => {
        if (typeIds.has(type.id)) ctx.addIssue({ code: 'custom', path: ['clientTypes', clientType, 'groups', groupIndex, 'types', typeIndex, 'id'], message: `Type dupliqué: ${type.id}` });
        typeIds.add(type.id);
      });
    });
  }
});

export type DocumentSearchTypesConfig = z.infer<typeof documentSearchTypesSchema>;
export type DocumentSearchTypeGroup = DocumentSearchTypesConfig['clientTypes']['PP']['groups'][number];

export const documentFieldSchema = z.object({
  key: z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]*$/),
  label: localizedLabelSchema,
  dataType: z.enum(['text', 'multiline', 'date', 'number', 'boolean', 'currency']),
  order: z.number().int().default(100),
  priority: z.enum(['primary', 'secondary']).optional(),
  formatter: z.object({ currency: z.string().length(3).optional(), dateStyle: z.enum(['short', 'medium', 'long']).optional() }).optional(),
});

export const documentTypeRegistrySchema = z.object({
  version: z.literal(1),
  types: z.array(z.object({
    code: z.string().regex(/^[A-Z][A-Z0-9_]*$/),
    label: localizedLabelSchema,
    icon: z.string().max(32).optional(),
    fields: z.array(documentFieldSchema).superRefine((fields, ctx) => {
      const keys = new Set<string>();
      fields.forEach((field, index) => {
        if (keys.has(field.key)) ctx.addIssue({ code: 'custom', path: [index, 'key'], message: `Clé dupliquée: ${field.key}` });
        keys.add(field.key);
      });
    }),
  })).min(1).superRefine((types, ctx) => {
    const codes = new Set<string>();
    types.forEach((type, index) => {
      if (codes.has(type.code)) ctx.addIssue({ code: 'custom', path: [index, 'code'], message: `Type dupliqué: ${type.code}` });
      codes.add(type.code);
    });
  }),
});

export type DocumentTypeRegistry = z.infer<typeof documentTypeRegistrySchema>;
export type DocumentTypeDefinition = DocumentTypeRegistry['types'][number];
export type DocumentFieldDefinition = DocumentTypeDefinition['fields'][number];
