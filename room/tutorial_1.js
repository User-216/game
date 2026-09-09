window.roomData = window.roomData || {};
window.roomData['tutorial_1'] = function() {
this.roomWidth = 2000;
this.roomHeight = 10;
this.entities.push(
    new TargetDoor_A(480, 576, 32, 32),
    new Platform(192, 224, 96, 384, '#00aa9e66'),
    new TutorialBook(896, 576, 32, 32, "Press  [J] to Jump!"),
    new Platform(672, 288, 128, 64, '#00aa9e66'),
    new Platform(288, 224, 512, 64, '#00aa9e66'),
    new TutorialBook(1216, 512, 32, 32, "Press  [D] and  [L][R] to crawl!"),
    new Platform(1056, 544, 352, 64, '#00aa9e66'),
    new Platform(192, 608, 1216, 96, '#00aa9e66'),
    new Platform(1312, 224, 96, 288, '#00aa9e66'),
    new Platform(672, 96, 736, 128, '#00aa9e66'),
    new Platform(1312, 704, 448, 64, '#00aa9e66'),
    new Platform(1760, 448, 64, 320, '#00aa9e66'),
    new Platform(1408, 384, 416, 64, '#00aa9e66'),
    new TargetDoor_B(1632, 672, 32, 32),
    new Door(1632, 640, 32, 64, 'B', 'tutorial_2'),
    new Tile(288, 576, 128, 320, 64, 32, 'pmo_beaker.png', 128, 320),
    new Tile(416, 576, 128, 320, 64, 32, 'pmo_beaker.png', 128, 320),
    new Tile(544, 576, 128, 320, 64, 32, 'pmo_beaker.png', 128, 320),
    new Tile(672, 576, 128, 320, 64, 32, 'pmo_beaker.png', 128, 320),
    new Tile(800, 576, 128, 320, 64, 32, 'pmo_beaker.png', 128, 320),
    new Tile(928, 576, 128, 320, 64, 32, 'pmo_beaker.png', 128, 320),
    new Tile(1088, 512, 128, 320, 64, 32, 'pmo_beaker.png', 128, 320),
    new Tile(1216, 512, 128, 320, 64, 32, 'pmo_beaker.png', 128, 320),
    new Tile(1344, 512, 96, 256, 160, 32, 'pmo_beaker.png', 96, 256),
    new Tile(1024, 512, 64, 128, 0, 32, 'pmo_beaker.png', 64, 128),
    new Tile(352, 544, 160, 64, 0, 1120, 'pmo_beaker.png', 160, 64),
);
};