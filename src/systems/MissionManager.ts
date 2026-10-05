export interface MissionSnapshot { index: number; piece: boolean; key: boolean; doorOpen: boolean; batteries: string[]; carryingEngine: boolean; installed: boolean; won: boolean; attempts: number[] }
export type ObjectKind = 'red-box' | 'box' | 'key' | 'door' | 'battery' | 'engine' | 'rocket' | 'button' | 'tutorial-box';
export type ActionResult = 'wrong' | 'collected' | 'completed' | 'installed' | 'locked';
/** Game rules independent from rendering and physics. */
export class MissionManager {
  index = 0;
  piece = false;
  key = false;
  doorOpen = false;
  batteries = new Set<string>();
  carryingEngine = false;
  installed = false;
  won = false;
  attempts = [0, 0, 0, 0, 0, 0];

  snapshot(): MissionSnapshot {
    return { index: this.index, piece: this.piece, key: this.key, doorOpen: this.doorOpen,
      batteries: [...this.batteries], carryingEngine: this.carryingEngine, installed: this.installed,
      won: this.won, attempts: [...this.attempts] };
  }
  static restore(value: unknown): MissionManager | undefined {
    if (!value || typeof value !== 'object') return;
    const s = value as MissionSnapshot;
    if (!Number.isInteger(s.index) || s.index < 0 || s.index > 5 ||
        !['piece', 'key', 'doorOpen', 'carryingEngine', 'installed', 'won'].every(k => typeof (value as Record<string, unknown>)[k] === 'boolean') ||
        !Array.isArray(s.batteries) || s.batteries.some(id => !['b1', 'b2', 'b3'].includes(id)) || new Set(s.batteries).size !== s.batteries.length ||
        !Array.isArray(s.attempts) || s.attempts.length !== 6 || s.attempts.some(n => !Number.isSafeInteger(n) || n < 0) ||
        s.piece !== (s.index >= 1) || s.key !== (s.index >= 2) || s.doorOpen !== (s.index >= 3) ||
        (s.index < 3 && s.batteries.length !== 0) || (s.index === 3 && s.batteries.length >= 3) || (s.index >= 4 && s.batteries.length !== 3) ||
        (s.carryingEngine && s.index < 4) || (s.installed && s.index !== 5) || (s.installed && s.carryingEngine) ||
        (s.index === 5 && !s.installed && !s.carryingEngine) || (s.won && !s.installed)) return;
    const rules = new MissionManager();
    Object.assign(rules, s, { batteries: new Set(s.batteries), attempts: [...s.attempts] }); return rules;
  }

  interact(kind: ObjectKind, id: string): ActionResult {
    if (this.won) return 'wrong';
    this.attempts[this.index]++;
    if (kind === 'door' && !this.key && !this.doorOpen) return 'locked';
    if (this.index === 0 && kind === 'red-box') { this.piece = true; return this.complete(); }
    if (this.index === 1 && kind === 'key') { this.key = true; return this.complete(); }
    if (this.index === 2 && kind === 'door') { this.doorOpen = true; return this.complete(); }
    if (this.index === 3 && kind === 'battery' && !this.batteries.has(id)) {
      this.batteries.add(id);
      return this.batteries.size === 3 ? this.complete() : 'collected';
    }
    if (this.index === 4 && kind === 'engine' && !this.carryingEngine) { this.carryingEngine = true; return 'collected'; }
    if (this.index === 4 && kind === 'rocket' && this.carryingEngine) return this.complete();
    if (this.index === 5 && kind === 'rocket' && this.carryingEngine && !this.installed) {
      this.installed = true; this.carryingEngine = false; return 'installed';
    }
    if (this.index === 5 && kind === 'button' && this.installed) { this.won = true; return 'completed'; }
    return 'wrong';
  }
  private complete(): ActionResult { this.index++; return 'completed'; }
  get completedCount(): number { return this.won ? 6 : this.index; }
}
