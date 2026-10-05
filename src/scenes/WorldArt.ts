import Phaser from 'phaser';
export function drawSky(scene: Phaser.Scene) {
  const g = scene.add.graphics().setScrollFactor(0).setDepth(-20);
  g.fillGradientStyle(0x14223e, 0x14223e, 0x2e5365, 0x2e5365, 1); g.fillRect(0, 0, 1280, 720);
  // Deterministic stars: no remote assets or random layout changes.
  for (let i = 0; i < 75; i++) { const x = (i * 193 + 47) % 1280; const y = 160 + (i * 71) % 330; g.fillStyle(i % 3 === 0 ? 0xffe3a0 : 0xbad7e7, 0.3 + (i % 4) * 0.15).fillRect(x, y, i % 4 === 0 ? 3 : 2, 2); }
  g.fillStyle(0x8baab3).fillCircle(1080, 245, 68); g.fillStyle(0x6d929f).fillCircle(1104, 232, 15).fillCircle(1058, 264, 22).fillCircle(1063, 213, 9);
  g.lineStyle(1, 0xa4d6d3, 0.22).strokeCircle(1080, 245, 82);
  for (let i = 0; i < 12; i++) {
    const x = i * 135 - 30; const y = 445 + (i % 3) * 21;
    g.fillStyle(0x203b52).fillRect(x, y, 150, 220).fillRect(x + 30, y - 26, 70, 30);
  }
  g.fillStyle(0x28475a).fillRect(0, 544, 1280, 180);
}
export function drawBase(scene: Phaser.Scene, x: number, y: number, width: number) {
  const g = scene.add.graphics().setDepth(-5);
  g.fillStyle(0x304c62).fillRect(x, y, width, 600 - y); g.fillStyle(0x55798a).fillRect(x - 8, y, width + 16, 10);
  for (let i = 22; i < width - 30; i += 62) { g.fillStyle(0x1b344b).fillRect(x + i, y + 35, 43, 38); g.fillStyle(0x6cb3b3, 0.5).fillRect(x + i + 3, y + 38, 37, 6); }
  g.fillStyle(0x89b4b1).fillRect(x + 14, y - 20, 7, 20); g.fillStyle(0xffc777).fillRect(x + 14, y - 27, 7, 7);
}
