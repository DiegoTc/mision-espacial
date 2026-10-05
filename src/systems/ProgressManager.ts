import { worlds, nextAvailableWorld, REWARDS, type WorldId } from '../data/worlds';
import { selectShipMissions, getShipMission } from '../data/shipMissions';
import { PLAYER_DISPLAY_NAME, PLAYER_SPOKEN_NAME } from '../data/player';
import { missions } from '../data/missions';
import { MissionManager, type MissionSnapshot } from './MissionManager';
export const STORAGE_KEY = 'reading-space-game-v1';
const LEGACY_KEY = 'mision-cohete.progress.v1';
const WORDS = ['caja', 'roja', 'llave', 'puerta', 'azul', 'batería', 'motor', 'cohete', 'verde'];
export interface Session {
  id: string; startedAt: string; endedAt: string | null; level: string; completed: boolean;
  missionsCompleted: number; totalTimeSeconds: number; helpUsed: number; wrongInteractions: number; audioUsed: number; attemptsPerMission: number[];
}
export interface Checkpoint { tutorial: number; playerX: number; playerY: number; rules: MissionSnapshot; seenMissions: number[]; helpedMissions: number[] }
export interface ReadingTask { words: string[]; helpUsed: number; audioUsed: number; attempts: number; completed: boolean }
export interface Trip { id: string; from: WorldId; to: WorldId; kind: 'launch' | 'outbound' | 'return'; missionIds: string[]; missionIndex: number; step: number; inventory: string[]; stage: 'tasks' | 'flying'; completed: boolean }
export interface MoonCheckpoint { index: number; carrying: boolean; x: number; y: number }
export interface GameProgress {
  version: 1;
  player: { displayName: string; spokenName: string; grade: 2; coins: number; stars: number };
  progress: { currentWorld: WorldId; currentLevel: string; completedLevels: string[]; unlockedWorlds: string[]; completedWorlds: string[] };
  reading: { words: Record<string, { seen: number; independent: number; helpUsed: number }>; tasks: Record<string, ReadingTask> };
  scene: string; trips: Trip[]; currentTrip: Trip | null; moonCheckpoint: MoonCheckpoint | null; completedShipMissions: string[]; rewardClaims: string[];
  sessions: Session[]; settings: { muted: boolean }; activeSessionId: string | null; checkpoint: Checkpoint | null;
}
export function createInitialState(): GameProgress {
  return { version: 1, player: { displayName: PLAYER_DISPLAY_NAME, spokenName: PLAYER_SPOKEN_NAME, grade: 2, coins: 0, stars: 0 },
    progress: { currentWorld: 'earth', currentLevel: 'rocket-1', completedLevels: [], unlockedWorlds: ['earth'], completedWorlds: [] },
    scene: 'Game', trips: [], currentTrip: null, moonCheckpoint: null, completedShipMissions: [], rewardClaims: [],
    reading: { tasks: {}, words: Object.fromEntries(WORDS.map(word => [word, { seen: 0, independent: 0, helpUsed: 0 }])) },
    sessions: [], settings: { muted: false }, activeSessionId: null, checkpoint: null };
}
const record = (v: unknown): Record<string, unknown> => v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : {};
const count = (v: unknown) => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0 ? v : 0;
const date = (v: unknown) => typeof v === 'string' && Number.isFinite(Date.parse(v)) ? v : null;
const indices = (v: unknown): number[] => Array.isArray(v) ? [...new Set(v.filter(n => Number.isInteger(n) && n >= 0 && n < 6))] : [];
function readSession(value: unknown, legacy = false): Session | undefined {
  const s = record(value); const startedAt = date(legacy ? s.date : s.startedAt);
  if (!startedAt || typeof s.id !== 'string') return;
  return { id: s.id, startedAt, endedAt: date(s.endedAt), level: typeof s.level === 'string' ? s.level : 'rocket-1', completed: (legacy ? s.levelCompleted : s.completed) === true,
    missionsCompleted: Math.min(6, count(s.missionsCompleted)), totalTimeSeconds: count(s.totalTimeSeconds), helpUsed: count(s.helpUsed), wrongInteractions: count(s.wrongInteractions), audioUsed: count(s.audioUsed),
    attemptsPerMission: Array.from({ length: 6 }, (_, i) => count(Array.isArray(s.attemptsPerMission) ? s.attemptsPerMission[i] : 0)) };
}
function readState(value: unknown): GameProgress | undefined {
  const s = record(value); if (s.version !== 1) return;
  const state = createInitialState(); const p = record(s.player); const journey = record(s.progress);
  state.player.coins = count(p.coins); state.player.stars = count(p.stars);
  state.settings.muted = record(s.settings).muted === true;
  if (Array.isArray(journey.completedLevels) && journey.completedLevels.includes('rocket-1')) state.progress.completedLevels = ['rocket-1'];
  if (Array.isArray(journey.unlockedWorlds) && journey.unlockedWorlds.includes('moon')) state.progress.unlockedWorlds.push('moon');
  const words = record(record(s.reading).words);
  for (const word of new Set([...WORDS, ...Object.keys(words)])) { const w = record(words[word]); state.reading.words[word] = { seen: count(w.seen), independent: count(w.independent), helpUsed: count(w.helpUsed) }; }
  if (Array.isArray(s.sessions)) state.sessions = s.sessions.map(v => readSession(v)).filter((v): v is Session => !!v);
  const cp = record(s.checkpoint); const rules = MissionManager.restore(cp.rules);
  if (rules && Number.isInteger(cp.tutorial) && Number(cp.tutorial) >= 0 && Number(cp.tutorial) <= 4 &&
      typeof cp.playerX === 'number' && Number.isFinite(cp.playerX) && cp.playerX >= 25 && cp.playerX <= 3450 &&
      typeof cp.playerY === 'number' && Number.isFinite(cp.playerY) && cp.playerY >= 330 && cp.playerY <= 571 &&
      (cp.tutorial === 4 || rules.index === 0) && !rules.won) {
    state.checkpoint = { tutorial: Number(cp.tutorial), playerX: cp.playerX, playerY: cp.playerY, rules: rules.snapshot(), seenMissions: indices(cp.seenMissions), helpedMissions: indices(cp.helpedMissions) };
  }
  state.progress.completedLevels = Array.isArray(journey.completedLevels) ? journey.completedLevels.filter((v): v is string => v === 'rocket-1' || v === 'moon-1') : [];
  state.progress.completedWorlds = worlds.filter(w => state.progress.completedLevels.includes(w.levels[0])).map(w => w.id);
  if (state.progress.completedWorlds.includes('earth')) state.progress.unlockedWorlds = ['earth', 'moon'];
  if (journey.currentWorld === 'moon') { state.progress.currentWorld = 'moon'; state.progress.currentLevel = 'moon-1'; }
  const mc = record(s.moonCheckpoint);
  if (Number.isInteger(mc.index) && Number(mc.index) >= 0 && Number(mc.index) < 5 && typeof mc.x === 'number' && mc.x >= 25 && mc.x <= 1570 && typeof mc.y === 'number' && mc.y >= 300 && mc.y <= 571) state.moonCheckpoint = { index: Number(mc.index), carrying: mc.carrying === true, x: mc.x, y: mc.y };
  const parseTrip = (v: unknown): Trip | undefined => {
    const t = record(v);
    if (typeof t.id !== 'string' || !['launch', 'outbound', 'return'].includes(String(t.kind)) || !worlds.some(w => w.id === t.from) || !worlds.some(w => w.id === t.to) || !Array.isArray(t.missionIds) || !t.missionIds.length || t.missionIds.length > 2 || !t.missionIds.every(id => typeof id === 'string' && getShipMission(id)?.implemented) || !Number.isInteger(t.missionIndex) || Number(t.missionIndex) < 0 || Number(t.missionIndex) >= t.missionIds.length) return;
    const definition = getShipMission(t.missionIds[Number(t.missionIndex)]);
    if (!Number.isInteger(t.step) || Number(t.step) < 0 || Number(t.step) >= definition.steps.length) return;
    return { id: t.id, from: t.from as WorldId, to: t.to as WorldId, kind: t.kind as Trip['kind'], missionIds: t.missionIds, missionIndex: Number(t.missionIndex), step: Number(t.step), inventory: Array.isArray(t.inventory) ? t.inventory.filter((x): x is string => typeof x === 'string') : [], stage: t.stage === 'flying' ? 'flying' : 'tasks', completed: t.completed === true };
  };
  state.trips = Array.isArray(s.trips) ? s.trips.map(parseTrip).filter((t): t is Trip => !!t) : [];
  const trip = parseTrip(s.currentTrip);
  state.currentTrip = trip && !trip.completed ? (state.trips.find(t => t.id === trip.id) ?? trip) : null;
  state.completedShipMissions = Array.isArray(s.completedShipMissions) ? s.completedShipMissions.filter((x): x is string => typeof x === 'string' && !!getShipMission(x)) : [];
  state.rewardClaims = Array.isArray(s.rewardClaims) ? s.rewardClaims.filter((x): x is string => typeof x === 'string') : [];
  for (const [id, value] of Object.entries(record(record(s.reading).tasks))) { const t = record(value); if (Array.isArray(t.words)) state.reading.tasks[id] = { words: t.words.filter((x): x is string => typeof x === 'string'), helpUsed: count(t.helpUsed), audioUsed: count(t.audioUsed), attempts: count(t.attempts), completed: t.completed === true }; }
  state.scene = state.currentTrip ? (state.currentTrip.stage === 'flying' ? 'Travel' : 'Ship') : state.moonCheckpoint ? 'Moon' : state.checkpoint ? 'Game' : state.progress.completedWorlds.length ? 'SolarSystem' : 'Game';
  const active = state.sessions.find(session => session.id === s.activeSessionId && !session.completed && !session.endedAt);
  if (active && (state.checkpoint || state.currentTrip || state.moonCheckpoint)) state.activeSessionId = active.id;
  else { state.checkpoint = null; state.moonCheckpoint = null; }
  return state;
}
export class ProgressManager {
  data = createInitialState(); current?: Session;
  hasProgress = false; storageAvailable = true;
  private activeSince: number | null = null;
  private elapsed = 0;
  constructor() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw !== null) { const loaded = readState(JSON.parse(raw)); if (loaded) { this.data = loaded; this.hasProgress = true; } }
      else this.migrateLegacy();
    } catch { /* Invalid JSON starts clean; the next game event replaces it. */ }
  }
  private migrateLegacy() {
    const raw = localStorage.getItem(LEGACY_KEY); if (!raw) return;
    const old = record(JSON.parse(raw)); if (old.version !== 1 || !Array.isArray(old.sessions)) return;
    this.data.sessions = old.sessions.map(v => readSession(v, true)).filter((v): v is Session => !!v);
    this.data.settings.muted = old.muted === true;
    if (this.data.sessions.some(s => s.completed)) { this.data.progress.completedLevels = ['rocket-1']; this.data.progress.completedWorlds = ['earth']; this.data.scene = 'SolarSystem'; this.data.progress.unlockedWorlds.push('moon'); }
    this.hasProgress = true; this.save();
    if (this.storageAvailable) localStorage.removeItem(LEGACY_KEY);
  }
  start(continueJourney = false) {
    this.data.scene = 'Game'; this.data.progress.currentWorld = 'earth'; this.data.progress.currentLevel = 'rocket-1';
    this.pause();
    if (continueJourney && this.data.activeSessionId && this.data.checkpoint) {
      this.current = this.data.sessions.find(s => s.id === this.data.activeSessionId);
      if (this.current) { this.elapsed = this.current.totalTimeSeconds * 1000; this.resume(); this.save(); return; }
    }
    if (this.current && !this.current.endedAt) this.current.endedAt = new Date().toISOString();
    this.current = { id: globalThis.crypto?.randomUUID?.() ?? `session-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      startedAt: new Date().toISOString(), endedAt: null, level: 'rocket-1', completed: false, missionsCompleted: 0,
      totalTimeSeconds: 0, helpUsed: 0, wrongInteractions: 0, audioUsed: 0, attemptsPerMission: [0, 0, 0, 0, 0, 0] };
    this.data.sessions.push(this.current); this.data.activeSessionId = this.current.id;
    this.data.checkpoint = { tutorial: 0, playerX: 150, playerY: 570, rules: new MissionManager().snapshot(), seenMissions: [], helpedMissions: [] };
    this.elapsed = 0; this.resume(); this.hasProgress = true; this.save();
  }
  newGame() { this.pause(); this.data = createInitialState(); this.current = undefined; this.elapsed = 0; this.hasProgress = false; this.start(); }
  pause() { if (this.activeSince !== null) { this.elapsed += performance.now() - this.activeSince; this.activeSince = null; } this.save(); }
  resume() { if (this.activeSince === null && this.current && !this.current.completed) this.activeSince = performance.now(); }
  checkpoint(tutorial: number, x: number, y: number, rules: MissionManager) {
    const cp = this.data.checkpoint; if (!cp || !this.current || this.current.completed) return;
    cp.tutorial = tutorial; cp.playerX = x; cp.playerY = y; cp.rules = rules.snapshot();
    this.current.missionsCompleted = rules.completedCount; this.current.attemptsPerMission = [...rules.attempts]; this.save();
  }
  missionSeen(index: number) {
    const cp = this.data.checkpoint; if (!cp || cp.seenMissions.includes(index)) return;
    cp.seenMissions.push(index); for (const word of missions[index].words) this.data.reading.words[word].seen++; this.save();
  }
  help(index?: number) {
    if (!this.current) return; this.current.helpUsed++;
    const cp = this.data.checkpoint;
    if (index !== undefined && cp && !cp.helpedMissions.includes(index)) {
      cp.helpedMissions.push(index); for (const word of missions[index].words) this.data.reading.words[word].helpUsed++;
    }
    this.save();
  }
  wrongInteraction() { if (this.current) { this.current.wrongInteractions++; this.save(); } }
  completeMission(index: number) {
    if (!this.current || this.current.missionsCompleted > index) return;
    const cp = this.data.checkpoint;
    if (cp && !cp.helpedMissions.includes(index)) for (const word of missions[index].words) this.data.reading.words[word].independent++;
    this.current.missionsCompleted = index + 1; this.reward(`${this.current.id}:earth:${index}`, REWARDS.mainMissionStars); this.save();
  }
  unlockWorld(world: 'earth' | 'moon') {
    if (!this.data.progress.unlockedWorlds.includes(world)) { this.data.progress.unlockedWorlds.push(world); this.save(); }
  }
  completeLevel(world: WorldId = 'earth') {
    if (!this.current || this.current.completed) return;
    this.pause(); this.current.completed = true; this.current.endedAt = new Date().toISOString();
    this.current.missionsCompleted = world === 'earth' ? 6 : 5;
    const level = world === 'earth' ? 'rocket-1' : 'moon-1';
    if (!this.data.progress.completedLevels.includes(level)) this.data.progress.completedLevels.push(level);
    if (!this.data.progress.completedWorlds.includes(world)) this.data.progress.completedWorlds.push(world);
    this.reward(`${this.current.id}:level`, 0, REWARDS.levelCoins);
    this.data.activeSessionId = null; this.data.checkpoint = null; this.data.moonCheckpoint = null;
    const next = nextAvailableWorld(world); if (next) this.unlockWorld(next as 'moon');
    this.data.scene = 'Win'; this.save();
  }
  reward(id: string, stars: number, coins = 0) {
    if (this.data.rewardClaims.includes(id)) return;
    this.data.rewardClaims.push(id); this.data.player.stars += stars; this.data.player.coins += coins; this.save();
  }
  continueCampaign() {
    this.current = this.data.sessions.find(s => s.id === this.data.activeSessionId);
    if (this.current) { this.elapsed = this.current.totalTimeSeconds * 1000; this.resume(); }
    if (this.data.scene === 'Game') this.start(true);
    return this.data.scene;
  }
  private session(level: string) {
    this.pause(); if (this.current && !this.current.endedAt) this.current.endedAt = new Date().toISOString();
    this.current = { id: globalThis.crypto?.randomUUID?.() ?? `session-${Date.now()}-${Math.random().toString(36).slice(2)}`, startedAt: new Date().toISOString(), endedAt: null, level, completed: false, missionsCompleted: 0, totalTimeSeconds: 0, helpUsed: 0, wrongInteractions: 0, audioUsed: 0, attemptsPerMission: [] };
    this.data.sessions.push(this.current); this.data.activeSessionId = this.current.id; this.elapsed = 0; this.resume();
  }
  startMoon() {
    this.session('moon-1'); this.data.progress.currentWorld = 'moon'; this.data.progress.currentLevel = 'moon-1';
    this.data.moonCheckpoint = { index: 0, carrying: false, x: 100, y: 570 }; this.data.scene = 'Moon'; this.save();
  }
  beginTrip(from: WorldId, to: WorldId, kind: Trip['kind']) {
    this.session(`ship-${kind}`);
    const completed = this.data.trips.filter(t => t.kind === kind && t.completed).length;
    const trip: Trip = { id: this.current!.id, from, to, kind, missionIds: selectShipMissions(kind, completed, from), missionIndex: 0, step: 0, inventory: [], stage: 'tasks', completed: false };
    this.data.trips.push(trip); this.data.currentTrip = trip; this.data.scene = 'Ship'; this.save();
  }
  finishTrip() {
    const trip = this.data.currentTrip; if (!trip) return 'SolarSystem';
    trip.completed = true; this.pause(); if (this.current) { this.current.completed = true; this.current.endedAt = new Date().toISOString(); }
    this.data.activeSessionId = null; this.data.currentTrip = null;
    if (trip.kind === 'outbound') this.startMoon();
    else this.data.scene = trip.kind === 'launch' ? 'Win' : 'SolarSystem';
    this.save(); return this.data.scene;
  }
  taskSeen(id: string, words: string[]) {
    if (this.data.reading.tasks[id]) return;
    this.data.reading.tasks[id] = { words, helpUsed: 0, audioUsed: 0, attempts: 0, completed: false };
    for (const word of words) { const w = this.data.reading.words[word] ??= { seen: 0, independent: 0, helpUsed: 0 }; w.seen++; } this.save();
  }
  taskHelp(id: string) {
    const task = this.data.reading.tasks[id]; if (!task) return 0;
    task.helpUsed++; if (this.current) this.current.helpUsed++;
    if (task.helpUsed === 1) for (const word of task.words) this.data.reading.words[word].helpUsed++;
    this.save(); return task.helpUsed;
  }
  audioUsed(taskId?: string) {
    if (this.current) this.current.audioUsed++;
    if (taskId && this.data.reading.tasks[taskId]) this.data.reading.tasks[taskId].audioUsed++;
    this.save();
  }
  taskAttempt(id: string, correct: boolean) {
    const task = this.data.reading.tasks[id]; if (!task || task.completed) return;
    task.attempts++;
    if (this.current) { const index = this.data.currentTrip?.missionIndex ?? this.data.moonCheckpoint?.index ?? 0; this.current.attemptsPerMission[index] = (this.current.attemptsPerMission[index] ?? 0) + 1; }
    if (!correct) this.wrongInteraction();
    else { task.completed = true; if (!task.helpUsed) for (const word of task.words) this.data.reading.words[word].independent++; }
    this.save();
  }
  get completionCount() { return this.data.sessions.reduce((sum, s) => sum + s.missionsCompleted, 0); }
  save() {
    if (this.current) this.current.totalTimeSeconds = Math.floor((this.elapsed + (this.activeSince !== null ? performance.now() - this.activeSince : 0)) / 1000);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data)); this.storageAvailable = true; } catch { this.storageAvailable = false; }
  }
}
export const progress = new ProgressManager();
