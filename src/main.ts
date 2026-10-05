import { SolarSystemScene } from './scenes/SolarSystemScene';
import { ShipInteriorScene } from './scenes/ShipInteriorScene';
import { MoonScene } from './scenes/MoonScene';
import { TravelScene } from './scenes/TravelScene';
import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { NameScene } from './scenes/NameScene';
import { GameScene } from './scenes/GameScene';
import { WinScene } from './scenes/WinScene';
import './style.css';
new Phaser.Game({
  type: Phaser.AUTO, parent: 'game', width: 1280, height: 720, backgroundColor: '#14223e', pixelArt: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 850 }, debug: false } },
  scene: [BootScene, NameScene, GameScene, WinScene, SolarSystemScene, ShipInteriorScene, MoonScene, TravelScene],
});
