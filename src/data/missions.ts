export interface Mission { instruction: string; keyword: string; shortName: string; words: string[] }
export const missions: Mission[] = [
  { instruction: 'Busca la caja roja.', keyword: 'caja roja', shortName: 'La pieza', words: ['caja', 'roja'] },
  { instruction: 'Toma la llave.', keyword: 'llave', shortName: 'La llave', words: ['llave'] },
  { instruction: 'Abre la puerta azul.', keyword: 'puerta azul', shortName: 'La puerta', words: ['puerta', 'azul'] },
  { instruction: 'Busca tres baterías.', keyword: 'tres baterías', shortName: 'La energía', words: ['batería'] },
  { instruction: 'Lleva el motor al cohete.', keyword: 'motor al cohete', shortName: 'El motor', words: ['motor', 'cohete'] },
  { instruction: 'Coloca el motor y presiona el botón verde.', keyword: 'motor y presiona el botón verde', shortName: 'El despegue', words: ['motor', 'verde'] },
];
