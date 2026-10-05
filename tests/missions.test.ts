import { describe, expect, it } from 'vitest';
import { MissionManager } from '../src/systems/MissionManager';

describe('six-mission game progression', () => {
  it('requires the right objects, three distinct batteries, delivery, installation and the green button', () => {
    const m = new MissionManager();
    expect(m.interact('box', 'blue')).toBe('wrong'); expect(m.index).toBe(0);
    expect(m.interact('door', 'door')).toBe('locked');
    expect(m.interact('red-box', 'red')).toBe('completed');
    expect(m.interact('button', 'button')).toBe('wrong');
    expect(m.interact('key', 'key')).toBe('completed');
    expect(m.interact('door', 'door')).toBe('completed'); expect(m.doorOpen).toBe(true);
    expect(m.interact('battery', 'b1')).toBe('collected');
    expect(m.interact('battery', 'b1')).toBe('wrong'); expect(m.batteries.size).toBe(1);
    expect(m.interact('battery', 'b2')).toBe('collected');
    expect(m.interact('battery', 'b3')).toBe('completed');
    expect(m.interact('rocket', 'rocket')).toBe('wrong');
    expect(m.interact('engine', 'engine')).toBe('collected'); expect(m.carryingEngine).toBe(true);
    expect(m.interact('rocket', 'rocket')).toBe('completed'); expect(m.index).toBe(5);
    expect(m.interact('button', 'button')).toBe('wrong'); expect(m.won).toBe(false);
    expect(m.interact('rocket', 'rocket')).toBe('installed'); expect(m.carryingEngine).toBe(false);
    expect(m.interact('button', 'button')).toBe('completed'); expect(m.won).toBe(true); expect(m.completedCount).toBe(6);
    expect(m.attempts).toEqual([3, 2, 1, 4, 3, 3]);
  });
  it('round-trips every inventory state, including partial batteries, carrying and installation', () => {
    let m = new MissionManager();
    for (const [kind, id] of [['red-box', 'red'], ['key', 'key'], ['door', 'door'], ['battery', 'b1'], ['battery', 'b2'], ['battery', 'b3'], ['engine', 'engine'], ['rocket', 'rocket'], ['rocket', 'rocket'], ['button', 'button']] as const) {
      m.interact(kind, id); const saved = m.snapshot(); const restored = MissionManager.restore(JSON.parse(JSON.stringify(saved)));
      expect(restored?.snapshot()).toEqual(saved); m = restored!;
    }
    expect(m.won).toBe(true);
  });
  it('does not advance by collecting future mission objects early', () => {
    const m = new MissionManager();
    for (const kind of ['key', 'battery', 'engine', 'rocket', 'button'] as const) expect(m.interact(kind, kind)).toBe('wrong');
    expect(m.completedCount).toBe(0); expect(m.carryingEngine).toBe(false); expect(m.batteries.size).toBe(0);
  });
});
