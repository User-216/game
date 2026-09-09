window.roomData = window.roomData || {};
window.roomData['tutorial_2'] = function() {
this.roomWidth = 4000;
this.roomHeight = 2000;
this.entities.push(
    new TargetDoor_B(416, 512, 32, 32),
    new Door(416, 480, 32, 64, 'B', 'tutorial_1'),
    new Slope(768, 480, 128, 64, 'left-up'),
    new Platform(256, 544, 896, 96, '#00aa9e66'),
    new Destroyable(992, 416, 64, 64),
    new Destroyable(1056, 416, 64, 64),
    new Platform(928, 256, 192, 160, '#00aa9e66'),
    new Platform(256, 256, 64, 288, '#00aa9e66'),
    new Platform(256, 160, 864, 96, '#00aa9e66'),
    new Platform(896, 480, 448, 64, '#00aa9e66'),
    new Platform(1344, 704, 96, 64, '#00aa9e66'),
    new Platform(1280, 544, 64, 224, '#00aa9e66'),
    new Destroyable(1440, 704, 64, 64),
    new Platform(1504, 480, 256, 288, '#00aa9e66'),
    new Platform(1056, 96, 704, 64, '#00aa9e66'),
    new Platform(1760, 96, 96, 672, '#00aa9e66'),
    new TutorialBook(1600, 448, 32, 32, "Press the  [D] Key in Midair to Perform a Ground Pound!"),
);
};