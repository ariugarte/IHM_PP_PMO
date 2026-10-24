import { describe, expect, it } from 'vitest';
import { adaptIntakeStart } from './adapters';
import { testConfig } from '../../test/fixtures';

describe('intake adapters', () => {
  it('preserves an immediately completed filesystem workflow', () => {
    expect(adaptIntakeStart({
      taskId: 'FS-INTAKE-DATA',
      status: 'succeeded',
      workflowId: 'FS-DATA',
      progress: 100,
    }, testConfig)).toEqual({
      taskId: 'FS-INTAKE-DATA',
      status: 'succeeded',
      stage: 'intake',
      workflowId: 'FS-DATA',
      progress: 100,
    });
  });
});
