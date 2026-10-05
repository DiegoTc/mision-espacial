import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProgressManager, STORAGE_KEY, createInitialState } from '../src/systems/ProgressManager';
import { MissionManager, type ObjectKind } from '../src/systems/MissionManager';
import { PLAYER_DISPLAY_NAME, PLAYER_SPOKEN_NAME } from '../src/data/player';
let values: Map<string, string>;
beforeEach(() => {
  values = new Map();
  vi.stubGlobal('localStorage', { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) });
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
function action(p: ProgressManager, rules: MissionManager, kind: ObjectKind, id = kind as string) {
  const index = rules.index; const result = rules.interact(kind, id);
  if (result === 'completed') p.completeMission(index);
  if (result === 'wrong' || result === 'locked') p.wrongInteraction();
  p.checkpoint(4, 730, 570, rules);
  if (rules.won) p.completeLevel(); else p.missionSeen(rules.index);
}
function clearLevel(p: ProgressManager) {
  const r = new MissionManager(); p.missionSeen(0);
  for (const [kind, id] of [['red-box', 'red'], ['key', 'key'], ['door', 'door'], ['battery', 'b1'], ['battery', 'b2'], ['battery', 'b3'], ['engine', 'engine'], ['rocket', 'rocket'], ['rocket', 'rocket'], ['button', 'button']] as [ObjectKind, string][]) action(p, r, kind, id);
}
describe('persistent journey', () => {
  it('keeps fixed display/spoken names and every required word', () => {
    const state = createInitialState(); expect(state.player.displayName).toBe(PLAYER_DISPLAY_NAME); expect(state.player.spokenName).toBe(PLAYER_SPOKEN_NAME);
    expect(Object.keys(state.reading.words)).toEqual(['caja', 'roja', 'llave', 'puerta', 'azul', 'batería', 'motor', 'cohete', 'verde']);
    expect(new ProgressManager().hasProgress).toBe(false);
  });
  it('restores the mission, safe position and help without counting the same instruction twice', () => {
    const p = new ProgressManager(); p.start(); const r = new MissionManager(); p.missionSeen(0); p.missionSeen(0);
    p.help(0); p.help(0); action(p, r, 'box', 'blue'); p.checkpoint(4, 600, 570, r); p.pause();
    const q = new ProgressManager(); q.start(true); q.missionSeen(0);
    expect(q.data.checkpoint?.playerX).toBe(600); expect(q.current?.id).toBe(p.current?.id);
    expect(q.current).toMatchObject({ helpUsed: 2, wrongInteractions: 1 });
    expect(q.data.reading.words.caja).toEqual({ seen: 1, independent: 0, helpUsed: 1 });
    action(q, MissionManager.restore(q.data.checkpoint!.rules)!, 'red-box', 'red');
    expect(q.data.reading.words.caja.independent).toBe(0); expect(q.current?.missionsCompleted).toBe(1);
    expect(new ProgressManager().data.checkpoint?.rules.index).toBe(1);
  });
  it('finishes the session, unlocks Moon and rewards each mission and level without duplicate events, retaining all stats on continue', () => {
    const p = new ProgressManager(); p.start(); p.data.player.coins = 7; clearLevel(p);
    expect(p.current).toMatchObject({ completed: true, missionsCompleted: 6, level: 'rocket-1' });
    expect(p.current?.endedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(p.data.progress.completedLevels).toEqual(['rocket-1']); expect(p.data.progress.unlockedWorlds).toEqual(['earth', 'moon']);
    expect(p.data.player.stars).toBe(6); expect(p.data.reading.words.motor).toEqual({ seen: 2, independent: 2, helpUsed: 0 });
    const q = new ProgressManager(); q.start(true);
    expect(q.data.player).toMatchObject({ coins: 17, stars: 6 }); expect(q.data.sessions).toHaveLength(2);
    clearLevel(q); expect(q.data.player.stars).toBe(12); expect(q.data.reading.words.caja.independent).toBe(2);
    q.newGame(); expect(q.data.player.stars).toBe(0); expect(q.data.player.coins).toBe(0); expect(q.data.sessions).toHaveLength(1);
    expect(q.data.reading.words.caja.seen).toBe(0); expect(q.data.progress.unlockedWorlds).toEqual(['earth']);
  });
  it('keeps active time across reloads and excludes paused and offline time', () => {
    let now = 0; vi.spyOn(performance, 'now').mockImplementation(() => now);
    const p = new ProgressManager(); p.start(); now = 10000; p.pause(); now = 70000;
    const q = new ProgressManager(); q.start(true); now = 75000; q.pause();
    expect(q.current?.totalTimeSeconds).toBe(15);
  });
  it.each(['{invalid', 'null', '{"version":99}', '{"version":1,"reading":{"words":{"caja":{"seen":-5}}},"player":{"coins":"oops"},"sessions":[null,{}],"checkpoint":{"rules":{"index":500}}}'])('handles damaged saved data safely: %s', raw => {
    values.set(STORAGE_KEY, raw); const p = new ProgressManager(); expect(() => p.start(true)).not.toThrow();
    expect(p.data.player.coins).toBe(0); expect(p.data.reading.words.caja.seen).toBe(0); expect(p.data.checkpoint?.rules.index).toBe(0);
  });
  it('migrates legacy history and mute to the single new key', () => {
    values.set('mision-cohete.progress.v1', JSON.stringify({ version: 1, playerName: 'Old', muted: true, sessions: [{ id: 'old', date: '2026-10-04T23:00:00Z', missionsCompleted: 6, helpUsed: 2, totalTimeSeconds: 100, levelCompleted: true }] }));
    const p = new ProgressManager(); expect(p.data.player.displayName).toBe('FsantigoEV'); expect(p.data.sessions[0].helpUsed).toBe(2);
    expect(p.data.progress.unlockedWorlds).toContain('moon'); expect(p.data.settings.muted).toBe(true);
    expect(values.has(STORAGE_KEY)).toBe(true); expect(values.has('mision-cohete.progress.v1')).toBe(false);
  });
  it('starts over LAN HTTP without crypto.randomUUID and survives blocked storage', () => {
    vi.stubGlobal('crypto', {}); const p = new ProgressManager(); p.start(); expect(p.current?.id).toMatch(/^session-/);
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } });
    const q = new ProgressManager(); expect(() => q.start()).not.toThrow(); expect(q.storageAvailable).toBe(false);
  });
  it('rejects impossible inventory checkpoints instead of soft-locking the level', () => {
    const s = createInitialState(); s.checkpoint = { tutorial: 4, playerX: 100, playerY: 570, rules: { ...new MissionManager().snapshot(), index: 5 }, seenMissions: [], helpedMissions: [] };
    values.set(STORAGE_KEY, JSON.stringify(s)); expect(new ProgressManager().data.checkpoint).toBeNull();
  });
});
