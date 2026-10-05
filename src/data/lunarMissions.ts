export const lunarMissions = [
  { instruction: 'Busca la roca grande.', keyword: 'roca grande', words: ['busca', 'roca', 'grande', 'cerca'], target: 'rock', action: 'use', hint: 'La roca grande está cerca.' },
  { instruction: 'Salta sobre la roca.', keyword: 'sobre la roca', words: ['salta', 'encima', 'roca'], target: 'rock', action: 'cross', hint: 'Presiona S cerca de la roca.' },
  { instruction: 'Busca la batería debajo de la plataforma.', keyword: 'debajo', words: ['busca', 'batería', 'debajo', 'abajo', 'plataforma'], target: 'battery', action: 'use', hint: 'Mira abajo. La batería está bajo la plataforma.' },
  { instruction: 'Lleva la batería al vehículo lunar.', keyword: 'vehículo lunar', words: ['lleva', 'batería', 'vehículo', 'lunar'], target: 'rover', action: 'use', hint: 'El vehículo está a la derecha.' },
  { instruction: 'Sube a la plataforma de arriba.', keyword: 'arriba', words: ['sube', 'plataforma', 'arriba'], target: 'upper', action: 'land', hint: 'Salta desde una plataforma baja.' },
];
