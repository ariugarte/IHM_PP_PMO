import { describe, expect, it } from 'vitest';
import { sourceSelectionSchema } from './models';

describe('sourceSelectionSchema', () => {
  it('validates both source-specific payloads', () => {
    expect(sourceSelectionSchema.parse({ source: 'filesystem', folderPath: '/data/contracts' })).toEqual({ source: 'filesystem', folderPath: '/data/contracts' });
    expect(sourceSelectionSchema.parse({ source: 'GED', gedCategory: 'SINISTRES', contractNumbers: ['CTR-1'] })).toEqual({ source: 'GED', gedCategory: 'SINISTRES', contractNumbers: ['CTR-1'] });
  });

  it('rejects missing source fields and strips stale hidden values', () => {
    expect(sourceSelectionSchema.safeParse({ source: 'GED', gedCategory: 'COLLECTIVE', contractNumbers: [] }).success).toBe(false);
    const parsed = sourceSelectionSchema.parse({ source: 'filesystem', folderPath: '/data', gedCategory: 'SINISTRES', contractNumbers: ['STALE'] });
    expect(parsed).toEqual({ source: 'filesystem', folderPath: '/data' });
  });
});
