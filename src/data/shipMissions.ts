import type { WorldId } from './worlds';
import { REWARDS } from './worlds';
export interface TaskStep { instruction: string; targetWords: string[]; hint: string; target: string; action: 'use' | 'approach' | 'confirm'; pickup?: string; consume?: string }
export interface ShipMission { id: string; name: string; steps: TaskStep[]; targetWords: string[]; hints: string[]; reward: { stars: number }; minimumReadingLevel: number; allowedWorlds: WorldId[]; feedback: string; implemented: boolean; variants?: { practiceWord: string; step: number; instruction: string; targetWords: string[]; hint: string }[] }
const step = (instruction: string, target: string, targetWords: string[], hint: string, options: Partial<TaskStep> = {}): TaskStep => ({ instruction, target, targetWords, hint, action: 'use', ...options });
const define = (id: string, name: string, feedback: string, steps: TaskStep[], minimumReadingLevel = 1, implemented = true): ShipMission => ({ id, name, feedback, steps, targetWords: [...new Set(steps.flatMap(s => s.targetWords))], hints: steps.map(s => s.hint), reward: { stars: REWARDS.shipMissionStars }, minimumReadingLevel, allowedWorlds: ['earth', 'moon'], implemented });
export const shipMissions: ShipMission[] = [
  define('activate-engine', 'Tarjeta azul', '¡MOTOR ENCENDIDO!', [
    step('Toma la tarjeta azul.', 'card-blue', ['toma', 'tarjeta', 'azul'], 'Busca algo azul.', { pickup: 'card-blue' }),
    step('Pon la tarjeta en la consola.', 'console', ['pon', 'tarjeta', 'consola'], 'La consola está cerca de la ventana.', { consume: 'card-blue' }),
    step('Presiona el botón verde.', 'button-green', ['presiona', 'botón', 'verde'], 'Busca el botón verde.')]),
  { ...define('battery', 'La energía', '¡ENERGÍA RESTAURADA!', [
    step('Busca la batería.', 'battery', ['busca', 'batería'], 'Mira debajo de la consola.', { pickup: 'battery' }),
    step('Lleva la batería al panel.', 'energy-panel', ['lleva', 'batería', 'panel'], 'El panel tiene un lugar vacío.'),
    step('Colócala en su lugar.', 'energy-panel', ['coloca', 'lugar'], 'Usa A junto al panel.', { consume: 'battery' })]), variants: [{ practiceWord: 'debajo', step: 0, instruction: 'Busca la batería debajo de la consola.', targetWords: ['busca', 'batería', 'debajo', 'consola'], hint: 'Mira debajo de la consola.' }] },
  define('cable', 'Cable rojo', '¡CONEXIÓN LISTA!', [
    step('Busca el cable rojo.', 'cable-red', ['busca', 'cable', 'rojo'], 'Busca el cable de color rojo.', { pickup: 'cable-red' }),
    step('Conecta el cable.', 'socket', ['conecta', 'cable'], 'La conexión está junto a los cables.', { consume: 'cable-red' })]),
  define('oxygen', 'Oxígeno', '¡OXÍGENO LISTO!', [
    step('Abre el panel de oxígeno.', 'oxygen-panel', ['abre', 'panel', 'oxígeno'], 'Busca el panel con una burbuja.'),
    step('Presiona el botón azul.', 'button-blue', ['presiona', 'botón', 'azul'], 'Busca el botón azul.'),
    step('Cierra el panel.', 'oxygen-panel', ['cierra', 'panel'], 'Vuelve al panel.')], 2, false),
  define('navigation', 'Navegación', '¡RUTA LISTA!', [
    step('Busca el mapa.', 'nav-screen', ['busca', 'mapa'], 'Busca la pantalla con planetas.'),
    step('Toca {destination}.', 'nav-destination', ['toca', 'mapa'], 'Elige tu destino con A.')], 2, false),
  define('seat', 'Preparar el asiento', '¡TODO LISTO!', [
    step('Ve al asiento.', 'seat', ['ve', 'asiento'], 'El asiento está a la derecha.', { action: 'approach' }),
    step('Presiona A para sentarte.', 'seat', ['presiona', 'asiento'], 'Usa A junto al asiento.'),
    step('Prepárate para despegar.', 'seat', ['prepara', 'despegar'], 'Presiona Enter.', { action: 'confirm' })]),
  define('fuel', 'Combustible', '¡COMBUSTIBLE LISTO!', [
    step('Busca el tanque amarillo.', 'fuel', ['busca', 'tanque', 'amarillo'], 'Busca algo amarillo.', { pickup: 'fuel' }),
    step('Llévalo al motor.', 'engine', ['lleva', 'motor'], 'El motor tiene una luz naranja.'),
    step('Coloca el combustible.', 'engine', ['coloca', 'combustible'], 'Usa A junto al motor.', { consume: 'fuel' })], 2, false),
  define('lights', 'Las luces', '¡LUCES ENCENDIDAS!', [step('Enciende las luces.', 'light-switch', ['enciende', 'luces'], 'Busca el botón con una luz amarilla.')]),
];
export const getShipMission = (id: string) => shipMissions.find(m => m.id === id)!;
export const tripPlans = {
  launch: [['lights']],
  outbound: [['activate-engine', 'seat'], ['battery', 'seat'], ['cable', 'seat'], ['lights', 'seat']],
  return: [['lights'], ['cable'], ['battery']],
};
export function selectShipMissions(kind: keyof typeof tripPlans, completedTrips: number, world: WorldId): string[] {
  const plans = tripPlans[kind]; const plan = plans[completedTrips % plans.length];
  return plan.filter(id => { const m = getShipMission(id); return m.implemented && m.allowedWorlds.includes(world) && m.minimumReadingLevel <= 2; });
}
