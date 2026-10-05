import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { ProgressManager, STORAGE_KEY } from '../src/systems/ProgressManager';
import { worlds, nextAvailableWorld, worldStatus } from '../src/data/worlds';
import { shipMissions, selectShipMissions, getShipMission } from '../src/data/shipMissions';
let storage: Map<string, string>;
beforeEach(() => { storage = new Map(); vi.stubGlobal('localStorage', { getItem: (k: string) => storage.get(k) ?? null, setItem: (k: string, v: string) => storage.set(k, v) }); });
afterEach(() => vi.unstubAllGlobals());
it('keeps the full configured order while unimplemented destinations stay locked', () => {
  expect(worlds.map(w => w.id)).toEqual(['earth', 'moon', 'mercury', 'venus', 'mars', 'asteroids', 'jupiter', 'saturn', 'uranus', 'neptune', 'sun']);
  expect(nextAvailableWorld('earth')).toBe('moon'); expect(nextAvailableWorld('moon')).toBeUndefined();
  expect(worlds.find(w => w.id === 'mercury')?.unlockRequirement).toBe('moon');
  expect(worldStatus('mars', ['earth', 'moon'], ['earth', 'moon'])).toBe('locked');
});
it('resumes a ship step, inventory, help and rewards after a real serialization roundtrip', () => {
  const p = new ProgressManager(); p.start(); p.completeLevel(); p.beginTrip('earth', 'moon', 'outbound');
  const t = p.data.currentTrip!; expect(t.missionIds).toEqual(['activate-engine', 'seat']);
  p.taskSeen(`${t.id}:card`, ['tarjeta', 'azul']); p.taskHelp(`${t.id}:card`); p.taskHelp(`${t.id}:card`); p.audioUsed(`${t.id}:card`); p.taskAttempt(`${t.id}:card`, true);
  t.step = 1; t.inventory.push('card-blue'); p.reward(`${t.id}:card`, 1); p.pause();
  const q = new ProgressManager(); expect(q.continueCampaign()).toBe('Ship');
  expect(q.data.currentTrip).toMatchObject({ step: 1, inventory: ['card-blue'] });
  expect(q.current?.helpUsed).toBe(2); expect(q.data.reading.tasks[`${t.id}:card`]).toMatchObject({ helpUsed: 2, audioUsed: 1, completed: true });
  expect(q.data.reading.words.tarjeta).toEqual({ seen: 1, independent: 0, helpUsed: 1 });
  q.reward(`${t.id}:card`, 1); expect(q.data.player.stars).toBe(1);
  q.data.currentTrip!.stage = 'flying'; q.save(); expect(new ProgressManager().continueCampaign()).toBe('Travel');
});
it('completes Moon and returns to the map with coins and future worlds locked', () => {
  const p = new ProgressManager(); p.start(); p.completeLevel(); p.beginTrip('earth', 'moon', 'outbound'); p.finishTrip();
  expect(p.data.scene).toBe('Moon'); expect(p.data.progress.currentWorld).toBe('moon');
  p.data.moonCheckpoint!.index = 3; p.data.moonCheckpoint!.carrying = true; p.save();
  const q = new ProgressManager(); expect(q.continueCampaign()).toBe('Moon'); expect(q.data.moonCheckpoint?.carrying).toBe(true);
  q.completeLevel('moon'); q.completeLevel('moon'); q.beginTrip('moon', 'earth', 'return'); q.finishTrip();
  const r = new ProgressManager(); expect(r.continueCampaign()).toBe('SolarSystem');
  expect(r.data.player.coins).toBe(20); expect(r.data.progress.completedWorlds).toEqual(['earth', 'moon']); expect(r.data.progress.unlockedWorlds).toEqual(['earth', 'moon']);
});
it('offers at least four working missions through deterministic trips and defines all eight', () => {
  expect(shipMissions).toHaveLength(8);
  const available = new Set(Array.from({ length: 4 }, (_, n) => selectShipMissions('outbound', n, 'earth')).flat());
  for (const id of ['activate-engine', 'battery', 'cable', 'lights']) expect(available.has(id)).toBe(true);
  for (const id of available) expect(getShipMission(id).steps.every(s => s.instruction && s.hint && s.target)).toBe(true);
});
it('rejects malformed travel data without breaking continue', () => {
  const p = new ProgressManager(); p.start(); const data = JSON.parse(storage.get(STORAGE_KEY)!); data.currentTrip = { id: 'bad', missionIds: ['unknown'], kind: 'outbound' }; storage.set(STORAGE_KEY, JSON.stringify(data));
  const q = new ProgressManager(); expect(q.data.currentTrip).toBeNull(); expect(() => q.continueCampaign()).not.toThrow();
});
it('restores a completed final step whose consumed inventory is already empty', () => {
  const p = new ProgressManager(); p.start(); p.beginTrip('earth', 'moon', 'outbound');
  const t = p.data.currentTrip!; t.missionIds = ['cable']; t.step = 1; t.inventory = [];
  const id = `${t.id}:cable:1`; p.taskSeen(id, ['conecta', 'cable']); p.taskAttempt(id, true); p.reward(`${t.id}:cable`, 1); p.save();
  const q = new ProgressManager(); q.continueCampaign(); expect(q.data.reading.tasks[id].completed).toBe(true); expect(q.data.currentTrip?.inventory).toEqual([]);
  q.reward(`${t.id}:cable`, 1); expect(q.data.player.stars).toBe(1);
});
