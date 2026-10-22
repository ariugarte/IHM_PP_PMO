import { describe, expect, it } from 'vitest';
import { normalizeTaskStatus, UnknownTaskStatusError } from './status';
import { testConfig } from '../test/fixtures';

describe('normalizeTaskStatus', () => {
  it('maps case-insensitive Python aliases to canonical statuses', () => {
    expect(normalizeTaskStatus('pending', testConfig.taskStatus)).toBe('queued');
    expect(normalizeTaskStatus('STARTED', testConfig.taskStatus)).toBe('running');
    expect(normalizeTaskStatus('success', testConfig.taskStatus)).toBe('succeeded');
  });

  it('fails closed for unknown backend states', () => {
    expect(() => normalizeTaskStatus('mystery', testConfig.taskStatus)).toThrow(UnknownTaskStatusError);
  });
});
