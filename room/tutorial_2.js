window.roomData = window.roomData || {};
window.roomData['tutorial_2'] = function() {
this.roomWidth = 2000;
this.roomHeight = 1000;
this.entities.push(
    new Platform(192, 544, 576, 64, '#00aa9e66'),
    new TargetDoor_B(416, 512, 32, 32),
    new Door(416, 480, 32, 64, 'B', 'tutorial_1'),
    new Destroyable(672, 480, 32, 32),
);
};