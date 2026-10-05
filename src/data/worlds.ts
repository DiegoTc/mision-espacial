export type WorldId = 'earth' | 'moon' | 'mercury' | 'venus' | 'mars' | 'asteroids' | 'jupiter' | 'saturn' | 'uranus' | 'neptune' | 'sun';
export const REWARDS = { mainMissionStars: 1, shipMissionStars: 1, levelCoins: 10 };
export interface WorldDefinition {
  id: WorldId; name: string; icon: string; order: number; readingFocus: string;
  levels: string[]; reward: { coins: number }; unlockRequirement: WorldId | null; implemented: boolean; color: number;
}
export const worlds: WorldDefinition[] = [
  { id: 'earth', name: 'Tierra', icon: '🌍', order: 0, readingFocus: 'Palabras y frases simples', levels: ['rocket-1'], reward: { coins: REWARDS.levelCoins }, unlockRequirement: null, implemented: true, color: 0x68cbb1 },
  { id: 'moon', name: 'Luna', icon: '🌙', order: 1, readingFocus: 'Arriba, abajo, debajo, encima y cerca', levels: ['moon-1'], reward: { coins: REWARDS.levelCoins }, unlockRequirement: 'earth', implemented: true, color: 0xb9d0d3 },
  { id: 'mercury', name: 'Mercurio', icon: '🪨', order: 2, readingFocus: 'Verbos de acción', levels: ['mercury-1'], reward: { coins: REWARDS.levelCoins }, unlockRequirement: 'moon', implemented: false, color: 0xbda99c },
  { id: 'venus', name: 'Venus', icon: '🟡', order: 3, readingFocus: 'Objetos, colores y descripciones', levels: ['venus-1'], reward: { coins: REWARDS.levelCoins }, unlockRequirement: 'mercury', implemented: false, color: 0xe9b96d },
  { id: 'mars', name: 'Marte', icon: '🔴', order: 4, readingFocus: 'Junto a, detrás, delante y entre', levels: ['mars-1'], reward: { coins: REWARDS.levelCoins }, unlockRequirement: 'venus', implemented: false, color: 0xe48377 },
  { id: 'asteroids', name: 'Asteroides', icon: '☄️', order: 5, readingFocus: 'Instrucciones de dos pasos', levels: ['asteroids-1'], reward: { coins: REWARDS.levelCoins }, unlockRequirement: 'mars', implemented: false, color: 0x92a7bc },
  { id: 'jupiter', name: 'Júpiter', icon: '🟠', order: 6, readingFocus: 'Frases un poco más largas', levels: ['jupiter-1'], reward: { coins: REWARDS.levelCoins }, unlockRequirement: 'asteroids', implemented: false, color: 0xd9b38e },
  { id: 'saturn', name: 'Saturno', icon: '🪐', order: 7, readingFocus: 'Primero, después, luego y al final', levels: ['saturn-1'], reward: { coins: REWARDS.levelCoins }, unlockRequirement: 'jupiter', implemented: false, color: 0xe5ca8f },
  { id: 'uranus', name: 'Urano', icon: '🔵', order: 8, readingFocus: 'Pequeñas situaciones de comprensión', levels: ['uranus-1'], reward: { coins: REWARDS.levelCoins }, unlockRequirement: 'saturn', implemented: false, color: 0x8fd5d8 },
  { id: 'neptune', name: 'Neptuno', icon: '🔵', order: 9, readingFocus: 'Decisiones basadas en lectura', levels: ['neptune-1'], reward: { coins: REWARDS.levelCoins }, unlockRequirement: 'uranus', implemented: false, color: 0x699ade },
  { id: 'sun', name: 'Sol', icon: '☀️', order: 10, readingFocus: 'Combina todas tus habilidades', levels: ['sun-final'], reward: { coins: REWARDS.levelCoins }, unlockRequirement: 'neptune', implemented: false, color: 0xffcc74 },
];
export const getWorld = (id: string) => worlds.find(w => w.id === id);
export function worldStatus(id: WorldId, completed: string[], unlocked: string[]) {
  if (completed.includes(id)) return 'completed';
  return getWorld(id)?.implemented && unlocked.includes(id) ? 'available' : 'locked';
}
export function nextAvailableWorld(completed: WorldId): WorldId | undefined {
  const next = worlds.find(w => w.unlockRequirement === completed);
  // Keep expansion worlds locked until their level is implemented, even if their prerequisite is met.
  return next?.implemented ? next.id : undefined;
}
