import { setupWorker } from 'msw/browser';
import type { AppConfig } from '../config/schema';
import { createHandlers } from './handlers';

export function createMockWorker(scenario: AppConfig['mock']['scenario']) {
  return setupWorker(...createHandlers(scenario));
}
