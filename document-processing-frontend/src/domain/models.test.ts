import { describe, expect, it } from 'vitest';
import { sourceSelectionSchema } from './models';

describe('sourceSelectionSchema', () => {
  it('validates both client types', () => {
    expect(sourceSelectionSchema.parse({ clientType: 'PMO' })).toEqual({ clientType: 'PMO' });
    expect(sourceSelectionSchema.parse({ clientType: 'PP' })).toEqual({ clientType: 'PP' });
  });

  it('rejects an unknown or missing client type and strips stale fields', () => {
    expect(sourceSelectionSchema.safeParse({ clientType: 'OTHER' }).success).toBe(false);
    expect(sourceSelectionSchema.safeParse({}).success).toBe(false);
    expect(sourceSelectionSchema.parse({ clientType: 'PMO', folderPath: '/data' })).toEqual({ clientType: 'PMO' });
  });
});
