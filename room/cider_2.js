window.roomData = window.roomData || {};
window.roomData['cider_2'] = function() {
this.roomWidth = 5000;
this.roomHeight = 2000;
this.sRankScore = 10000;
this.roomBackground = 'bg_cidersewer';
this.bgFollowCamera = true;
this.screenFilterColor = '#ff8822';
this.screenFilterAlpha = 0.17;
this.screenFilterBlend = 'multiply';
this.entities.push(
    new Platform(-224, 0, 544, 384, '#00aa9e66'),
    new Hallway(-224, 384, 64, 224, 'cider_1', 'C'),
    new Platform(-224, 608, 800, 96, '#00aa9e66'),
    new TargetDoor_C(-64, 576, 32, 32),
    new Platform(576, 544, 192, 160, '#00aa9e66'),
    new Slope(480, 544, 96, 64, 'left-up'),
    new Platform(672, 704, 96, 128, '#00aa9e66'),
    new OneWayPlatform(768, 672, 192, 32, '#9e00aa66'),
    new Destroyable(768, 608, 64, 64),
    new Destroyable(832, 608, 32, 32),
    new Destroyable(832, 640, 32, 32),
    new Destroyable(864, 640, 32, 32),
    new Destroyable(864, 608, 32, 32),
    new Platform(960, 672, 224, 64, '#00aa9e66'),
    new Platform(672, 832, 96, 160, '#00aa9e66'),
    new Collect(160, 544, 32, 32),
    new Collect(224, 544, 32, 32),
    new Collect(288, 544, 32, 32),
    new Destroyable(1216, 832, 64, 64),
    new Destroyable(1216, 896, 64, 64),
    new Platform(1184, 672, 96, 160, '#00aa9e66'),
    new Platform(672, 960, 768, 96, '#00aa9e66'),
    new Platform(1440, 960, 320, 96, '#00aa9e66'),
    new Platform(2080, 896, 480, 160, '#00aa9e66'),
    new OneWayPlatform(1280, 672, 160, 32, '#9e00aa66'),
    new OneWayPlatform(1600, 800, 160, 32, '#9e00aa66'),
    new Platform(1760, 800, 320, 256, '#00aa9e66'),
    new Slope(2080, 800, 192, 96, 'right-up'),
);

};