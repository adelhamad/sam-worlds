import { db, logEvent, type EventRow } from '../../engine/save/db';
import type { SceneEvent } from './RagdollScene';

type Mode = 'stage' | 'free';
interface ActiveRun { id: string; mode: Mode; stage?: number; started: number; firstAction: boolean; cleared: boolean; step: number }
export interface PlaytestRun {
  id: string;
  mode: Mode;
  stage?: number;
  at: number;
  firstAction?: string;
  firstActionMs?: number;
  step: number;
  cleared: boolean;
  clearMs?: number;
  durationMs?: number;
}

const directActions = new Set<SceneEvent['type']>(['kick', 'grab', 'move', 'spawn', 'delete', 'party']);
const elapsed = (since: number) => Math.max(0, Math.round(performance.now() - since));

export class RagdollPlaytest {
  private active?: ActiveRun;

  start(mode: Mode, stage?: number) {
    this.end();
    const id = crypto.randomUUID();
    this.active = { id, mode, stage, started: performance.now(), firstAction: false, cleared: false, step: 0 };
    logEvent('ragdoll.runStart', { id, mode, stage });
  }

  action(event: SceneEvent) {
    const run = this.active;
    if (!run || run.firstAction || !directActions.has(event.type)) return;
    run.firstAction = true;
    logEvent('ragdoll.firstAction', { id: run.id, action: event.type, delayMs: elapsed(run.started) });
  }

  step(step: number, action: SceneEvent['type']) {
    const run = this.active;
    if (!run || run.mode !== 'stage') return;
    run.step = step;
    logEvent('ragdoll.step', { id: run.id, step, action });
  }

  clear() {
    const run = this.active;
    if (!run || run.cleared) return;
    run.cleared = true;
    logEvent('ragdoll.runClear', { id: run.id, durationMs: elapsed(run.started) });
  }

  end() {
    const run = this.active;
    if (!run) return;
    logEvent('ragdoll.runEnd', { id: run.id, durationMs: elapsed(run.started), step: run.step, cleared: run.cleared });
    this.active = undefined;
  }
}

function eventData(row: EventRow): Record<string, unknown> | null {
  try {
    const data: unknown = JSON.parse(row.data);
    return data && typeof data === 'object' && !Array.isArray(data) ? data as Record<string, unknown> : null;
  } catch { return null; }
}

export async function recentPlaytestRuns(): Promise<PlaytestRun[]> {
  const rows = await db.eventLog.where('t').above(Date.now() - 30 * 24 * 60 * 60 * 1000).toArray();
  const runs = new Map<string, PlaytestRun>();
  for (const row of rows) {
    if (!row.type.startsWith('ragdoll.')) continue;
    const data = eventData(row);
    if (!data || typeof data.id !== 'string') continue;
    if (row.type === 'ragdoll.runStart' && (data.mode === 'stage' || data.mode === 'free')) {
      runs.set(data.id, { id: data.id, mode: data.mode, stage: typeof data.stage === 'number' ? data.stage : undefined,
        at: row.t, step: 0, cleared: false });
      continue;
    }
    const run = runs.get(data.id);
    if (!run) continue;
    if (row.type === 'ragdoll.firstAction' && typeof data.action === 'string' && typeof data.delayMs === 'number') {
      run.firstAction = data.action; run.firstActionMs = data.delayMs;
    } else if (row.type === 'ragdoll.step' && typeof data.step === 'number') run.step = data.step;
    else if (row.type === 'ragdoll.runClear' && typeof data.durationMs === 'number') {
      run.cleared = true; run.clearMs = data.durationMs;
    } else if (row.type === 'ragdoll.runEnd' && typeof data.durationMs === 'number') {
      run.durationMs = data.durationMs;
    }
  }
  return [...runs.values()].sort((a, b) => b.at - a.at).slice(0, 8);
}
