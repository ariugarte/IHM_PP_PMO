import { describe, expect, it } from 'vitest';
import { appConfigSchema, documentTypeRegistrySchema } from './schema';
import { testConfig, testRegistry } from '../test/fixtures';

describe('runtime configuration schemas', () => {
  it('accepts a complete same-origin configuration', () => {
    expect(appConfigSchema.parse(testConfig)).toEqual(testConfig);
  });

  it('rejects cross-origin base paths and duplicated status aliases', () => {
    expect(appConfigSchema.safeParse({ ...testConfig, backends: { ...testConfig.backends, source: { ...testConfig.backends.source, basePath: 'https://private/api' } } }).success).toBe(false);
    expect(appConfigSchema.safeParse({ ...testConfig, taskStatus: { ...testConfig.taskStatus, running: ['PENDING'] } }).success).toBe(false);
    expect(appConfigSchema.safeParse({ ...testConfig, backends: { ...testConfig.backends, chat: { ...testConfig.backends.chat, routes: { ask: { method: 'POST', path: '/../private' } } } } }).success).toBe(false);
  });

  it('rejects duplicate type codes and duplicate field keys', () => {
    expect(documentTypeRegistrySchema.safeParse({ version: 1, types: [testRegistry.types[0], testRegistry.types[0]] }).success).toBe(false);
    const duplicatedFields = { ...testRegistry.types[0], fields: [testRegistry.types[0]!.fields[0], testRegistry.types[0]!.fields[0]] };
    expect(documentTypeRegistrySchema.safeParse({ version: 1, types: [duplicatedFields] }).success).toBe(false);
  });
});
