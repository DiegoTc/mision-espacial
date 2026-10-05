import Phaser from 'phaser';
export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  create() {
    const g = this.make.graphics({ x: 0, y: 0 });
    const texture = (name: string, w: number, h: number, draw: () => void) => { g.clear(); draw(); g.generateTexture(name, w, h); };
    texture('ground', 48, 48, () => { g.fillStyle(0x354766).fillRect(0, 0, 48, 48); g.fillStyle(0x283950).fillRect(2, 14, 44, 32); g.fillStyle(0x617b92).fillRect(0, 0, 48, 8); g.fillStyle(0x86a8a0).fillRect(0, 0, 48, 3); g.fillStyle(0x405570).fillRect(6, 20, 12, 6).fillRect(29, 34, 10, 5); });
    texture('platform', 48, 24, () => { g.fillStyle(0x344c68).fillRect(0, 0, 48, 24); g.fillStyle(0x8cbbad).fillRect(0, 0, 48, 5); g.fillStyle(0x4c6a85).fillRect(4, 10, 40, 10); });
    texture('player', 40, 58, () => {
      g.fillStyle(0x20384f).fillRect(1, 28, 9, 22); g.fillStyle(0xefba59).fillRect(4, 30, 5, 15);
      g.fillStyle(0xecf2e8).fillRect(9, 25, 25, 24).fillRect(11, 46, 9, 10).fillRect(26, 46, 9, 10);
      g.fillStyle(0x92bcb8).fillRect(9, 40, 25, 6); g.fillStyle(0xf5c660).fillRect(20, 30, 8, 6);
      g.fillStyle(0x30485f).fillRect(9, 53, 13, 5).fillRect(25, 53, 13, 5);
      g.fillStyle(0xfffbdf).fillRect(6, 5, 31, 25).fillRect(11, 0, 21, 5);
      g.fillStyle(0x3a6678).fillRect(11, 9, 27, 15); g.fillStyle(0x89d8db).fillRect(14, 11, 21, 9); g.fillStyle(0xd2ffff).fillRect(16, 11, 8, 3);
      g.fillStyle(0xffffff).fillRect(32, 30, 7, 13); g.fillStyle(0xe4b25b).fillRect(34, 40, 6, 6);
    });
    const colors = { red: 0xee6977, blue: 0x649eea, yellow: 0xedbd60 };
    for (const [name, color] of Object.entries(colors)) texture(`box-${name}`, 48, 44, () => {
      g.fillStyle(0x25354e).fillRect(0, 0, 48, 44); g.fillStyle(color).fillRect(3, 3, 42, 38); g.fillStyle(0xffffff, 0.24).fillRect(6, 5, 36, 5);
      g.fillStyle(0x23364b, 0.3).fillRect(6, 32, 36, 7); g.fillStyle(0xffeed3).fillRect(20, 17, 8, 10);
    });
    texture('key', 42, 24, () => { g.fillStyle(0x926837).fillRect(0, 3, 19, 19).fillRect(14, 10, 27, 8); g.fillStyle(0xffdc77).fillRect(2, 1, 16, 16).fillRect(14, 7, 28, 7).fillRect(31, 12, 5, 9).fillRect(39, 11, 3, 6); g.fillStyle(0x26364f).fillRect(6, 5, 7, 7); });
    texture('battery', 25, 38, () => { g.fillStyle(0xb0ddd7).fillRect(8, 0, 10, 4); g.fillStyle(0x233950).fillRect(0, 4, 25, 34); g.fillStyle(0x74e7b6).fillRect(3, 7, 19, 28); g.fillStyle(0xf4ffe6).fillRect(11, 11, 4, 9).fillRect(7, 18, 10, 4).fillRect(9, 21, 4, 9); });
    texture('engine', 62, 44, () => { g.fillStyle(0x293950).fillRect(2, 8, 58, 30); g.fillStyle(0xbed1d8).fillRect(9, 3, 42, 36); g.fillStyle(0x6d8ca1).fillRect(0, 12, 12, 26).fillRect(50, 12, 12, 26); g.fillStyle(0xefb761).fillRect(18, 8, 24, 25); g.fillStyle(0x354c65).fillRect(23, 12, 14, 18); g.fillStyle(0x91f0d1).fillRect(27, 16, 6, 10); });
    texture('door', 70, 158, () => { g.fillStyle(0x25364d).fillRect(0, 0, 70, 158); g.fillStyle(0x7da0bc).fillRect(3, 0, 64, 6).fillRect(3, 6, 6, 152).fillRect(61, 6, 6, 152); g.fillStyle(0x3977b0).fillRect(10, 8, 50, 150); g.fillStyle(0x62ade3).fillRect(14, 13, 41, 5); g.fillStyle(0x234b75).fillRect(33, 24, 3, 124); g.fillStyle(0xefd685).fillRect(47, 81, 7, 10); });
    texture('stone', 64, 76, () => { g.fillStyle(0x4d6278).fillRect(0, 10, 64, 66).fillRect(10, 0, 43, 10); g.fillStyle(0x8295a4).fillRect(10, 3, 43, 8); g.fillStyle(0x60768b).fillRect(4, 16, 55, 20); g.fillStyle(0x3e526c).fillRect(36, 40, 20, 28); });
    texture('rocket', 112, 202, () => {
      g.fillStyle(0x34415c).fillRect(29, 53, 55, 130); g.fillStyle(0xfff1d5).fillRect(31, 44, 50, 126).fillRect(40, 26, 32, 18).fillRect(49, 10, 14, 16);
      g.fillStyle(0xf58079).fillRect(49, 0, 14, 13).fillRect(40, 13, 32, 14).fillRect(31, 27, 50, 17);
      g.fillStyle(0xd5c8b4).fillRect(72, 46, 9, 124); g.fillStyle(0x548398).fillRect(39, 59, 35, 35); g.fillStyle(0x93e2e5).fillRect(44, 64, 25, 25); g.fillStyle(0xd7ffff).fillRect(47, 67, 10, 5);
      g.fillStyle(0xf58079).fillRect(16, 124, 15, 55).fillRect(7, 148, 10, 40).fillRect(81, 124, 15, 55).fillRect(95, 148, 10, 40);
      g.fillStyle(0x2a354e).fillRect(38, 126, 36, 28); g.fillStyle(0x7c8798).fillRect(34, 169, 44, 15); g.fillStyle(0x34415c).fillRect(39, 184, 34, 12);
    });
    texture('button', 38, 52, () => { g.fillStyle(0x94a7b3).fillRect(15, 17, 8, 35).fillRect(3, 45, 32, 7); g.fillStyle(0x2a4951).fillRect(0, 0, 38, 25); g.fillStyle(0x78f0a7).fillRect(5, 4, 28, 15); g.fillStyle(0xd6ffe7).fillRect(8, 5, 19, 4); });
    for (const [name, color] of Object.entries({ blue: 0x63b4ff, red: 0xff6c7d, yellow: 0xffd469 })) {
      texture(`card-${name}`, 42, 28, () => { g.fillStyle(0x172b43).fillRect(0, 0, 42, 28); g.fillStyle(color).fillRect(3, 3, 36, 22); g.fillStyle(0xeef8ff).fillRect(7, 8, 9, 12); g.fillStyle(0x233f60).fillRect(21, 9, 12, 3).fillRect(21, 16, 8, 3); });
      texture(`cable-${name}`, 50, 24, () => { g.fillStyle(color).fillRect(5, 5, 35, 6).fillRect(34, 5, 6, 16).fillRect(12, 15, 27, 6); g.fillStyle(0xdce7e7).fillRect(0, 3, 9, 10).fillRect(8, 13, 9, 10); });
      texture(`switch-${name}`, 38, 52, () => { g.fillStyle(0x94a7b3).fillRect(15, 17, 8, 35).fillRect(3, 45, 32, 7); g.fillStyle(0x23374d).fillRect(0, 0, 38, 25); g.fillStyle(color).fillRect(5, 4, 28, 15); g.fillStyle(0xffffff, 0.6).fillRect(8, 5, 19, 4); });
    }
    texture('seat', 62, 75, () => { g.fillStyle(0x8baec2).fillRect(10, 0, 41, 47); g.fillStyle(0x44718d).fillRect(16, 6, 29, 35); g.fillStyle(0xafd9dc).fillRect(2, 42, 58, 15); g.fillStyle(0x475f78).fillRect(13, 55, 8, 20).fillRect(43, 55, 8, 20); });
    texture('console', 88, 75, () => { g.fillStyle(0x89a9ba).fillRect(0, 0, 88, 75); g.fillStyle(0x182f49).fillRect(7, 6, 74, 35); g.fillStyle(0x7dd9cf).fillRect(13, 12, 43, 5).fillRect(13, 24, 23, 5); g.fillStyle(0x63b4ff).fillRect(9, 49, 32, 8); g.fillStyle(0x203749).fillRect(52, 48, 28, 12); });
    texture('energy-panel', 70, 75, () => { g.fillStyle(0x9dafa8).fillRect(0, 0, 70, 75); g.fillStyle(0x203649).fillRect(21, 17, 29, 42); g.fillStyle(0xf0c966).fillRect(8, 7, 8, 8).fillRect(27, 7, 8, 8).fillRect(46, 7, 8, 8); });
    texture('spark', 6, 6, () => { g.fillStyle(0xffffff).fillRect(0, 0, 6, 6); });
    g.destroy(); this.scene.start('Name');
  }
}
