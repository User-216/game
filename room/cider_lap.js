window.roomData = window.roomData || {};
window.roomData['cider_lap'] = function() {
this.roomWidth = 1500;
this.roomHeight = 900;
this.sRankScore = 10000;
this.roomBackground = 'bg_cidersewer';
this.bgFollowCamera = true;
this.screenFilterColor = '#ffc38f';
this.screenFilterAlpha = 0.3;
this.screenFilterBlend = 'multiply';
this.entities.push(
    new Platform(0, 0, 992, 96, '#00aa9e66'),
    new Platform(0, 96, 128, 512, '#00aa9e66'),
    new Platform(992, 0, 576, 96, '#00aa9e66'),
    new Platform(1440, 96, 352, 384, '#00aa9e66'),
    new Platform(1376, 608, 384, 64, '#00aa9e66'),
    new Platform(1248, 608, 128, 256, '#00aa9e66'),
    new Platform(512, 768, 736, 96, '#00aa9e66'),
    new Platform(0, 608, 480, 160, '#00aa9e66'),
    new Platform(0, 768, 512, 96, '#00aa9e66'),
    new OneWayPlatform(736, 608, 224, 32, '#9e00aa66'),
    new Platform(1344, 96, 96, 384, '#00aa9e66'),
    new Hallway(1664, 480, 64, 128, 'cider_1', 'B'),
    new TargetDoor_B(1504, 576, 32, 32),
);

};