window.roomData = window.roomData || {};
window.roomData['demo_hub'] = function() {
this.roomWidth = 1800;
this.roomHeight = 500;
this.sRankScore = 10000;
this.roomBackground = 'bg_tutorial';
this.bgFollowCamera = true;
this.bgSecret = true;
this.entities.push(
    new Platform(0, 0, 96, 512, '#00aa9e66'),
    new Platform(96, 0, 832, 64, '#00aa9e66'),
    new Platform(96, 448, 832, 64, '#00aa9e66'),
    new Platform(928, 448, 608, 64, '#00aa9e66'),
    new Platform(928, 0, 608, 64, '#00aa9e66'),
    new Platform(1536, 0, 96, 512, '#00aa9e66'),
    new TargetDoor_A(192, 416, 32, 32),
    new PaletteDresser(448, 384, 64, 64),
    new OnlineComputer(608, 384, 64, 64),
);

};