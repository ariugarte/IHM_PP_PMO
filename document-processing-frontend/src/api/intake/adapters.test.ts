import { describe, expect, it } from 'vitest';
import { adaptIntakeStart, toIntakeRequest } from './adapters';
import { testConfig } from '../../test/fixtures';

describe('intake adapters', () => {
  it('sends only the selected client type', () => {
    expect(toIntakeRequest({ clientType: 'PMO' })).toEqual({ clientType: 'PMO' });
  });

  it('preserves an immediately completed client workflow', () => {
    expect(adaptIntakeStart({
      taskId: 'FS-INTAKE-PMO',
      status: 'succeeded',
      workflowId: 'FS-PMO',
      progress: 100,
    }, testConfig)).toEqual({
      taskId: 'FS-INTAKE-PMO',
      status: 'succeeded',
      stage: 'intake',
      workflowId: 'FS-PMO',
      progress: 100,
    });
  });
});
