import { describe, expect, it } from 'vitest';
import type { Task } from '../../domain/models';
import { pollingDelay, taskGateState } from './polling';

const task = (taskId: string, status: Task['status']): Task => ({ taskId, status, stage: 'processing' });

describe('taskGateState', () => {
  it('opens results on first success while other tasks remain active', () => {
    expect(taskGateState([task('1', 'succeeded'), task('2', 'running'), task('3', 'queued')])).toMatchObject({ hasFirstSuccess: true, allTerminal: false, allFailed: false });
  });

  it('distinguishes total failure from partial success', () => {
    expect(taskGateState([task('1', 'failed'), task('2', 'cancelled')]).allFailed).toBe(true);
    expect(taskGateState([task('1', 'succeeded'), task('2', 'failed')]).allFailed).toBe(false);
  });

  it('backs off transient polling errors without exceeding the configured limit', () => {
    expect(pollingDelay(500, 4_000, 0)).toBe(500);
    expect(pollingDelay(500, 4_000, 2)).toBe(2_000);
    expect(pollingDelay(500, 4_000, 9)).toBe(4_000);
  });
});
