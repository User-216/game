window.roomData = window.roomData || {};
window.roomData['cider_3'] = function() {
this.roomWidth = 10000;
this.roomHeight = 1000;
this.sRankScore = 10000;
this.roomBackground = 'bg_cidersewer';
this.bgFollowCamera = true;
this.screenFilterColor = '#ffc38f';
this.screenFilterAlpha = 0.3;
this.screenFilterBlend = 'multiply';
this.entities.push(
    new Platform(0, 832, 160, 352, '#00aa9e66'),
    new HallwayVertical(160, 1120, 256, 64, 'cider_2', 'A', 'down'),
    new Platform(416, 832, 224, 352, '#00aa9e66'),
    new TargetDoor_A(288, 992, 32, 32),
    new Platform(640, 768, 96, 64, '#00aa9e66'),
    new Slope(544, 768, 96, 64, 'left-up'),
    new Platform(640, 832, 640, 96, '#00aa9e66'),
    new Platform(928, 576, 160, 256, '#00aa9e66'),
    new Destroyable(864, 704, 64, 64),
    new Destroyable(800, 704, 64, 64),
    new Platform(0, 576, 160, 256, '#00aa9e66'),
    new Platform(0, 352, 32, 224, '#00aa9e66'),
    new Platform(32, 192, 128, 256, '#00aa9e66'),
    new OneWayPlatform(640, 576, 288, 32, '#9e00aa66'),
    new SecretMetalBlock(32, 448, 128, 128),
    new Platform(1088, 576, 256, 96, '#00aa9e66'),
    new Slope(1344, 576, 192, 96, 'right-up'),
    new Platform(1184, 672, 800, 96, '#00aa9e66'),
    new Platform(2464, 352, 128, 320, '#00aa9e66'),
    new Destroyable(2368, 512, 64, 64),
    new Platform(2272, 576, 192, 96, '#00aa9e66'),
    new Platform(2272, 224, 320, 128, '#00aa9e66'),
    new Platform(2272, 160, 320, 64, '#00aa9e66'),
    new Platform(32, 32, 128, 160, '#00aa9e66'),
    new Platform(160, 32, 2432, 128, '#00aa9e66'),
    new Platform(1920, 768, 64, 128, '#00aa9e66'),
    new Platform(1920, 896, 672, 64, '#00aa9e66'),
    new Platform(2496, 832, 96, 64, '#00aa9e66'),
    new Destroyable(2528, 768, 64, 64),
    new Destroyable(2528, 704, 64, 64),
    new Platform(2496, 672, 96, 32, '#00aa9e66'),
    new Slope(1984, 768, 64, 64, 'right-up'),
    new Slope(2048, 832, 128, 64, 'right-up'),
    new Platform(2592, 896, 640, 64, '#00aa9e66'),
    new BigCollect(2368, 512, 64, 64),
    new Collect(1664, 608, 32, 32),
    new Collect(1728, 608, 32, 32),
    new Collect(1792, 608, 32, 32),
    new Destroyable(1248, 512, 64, 64),
    new Destroyable(1248, 448, 64, 64),
    Object.assign(new Slime(1088, 544, 32, 32), { flipX: true, facingDir: -1 }),
    Object.assign(new Platform(736, 768, 192, 64, '#00aa9e66'), { flipX: true }),
    Object.assign(new Platform(1184, 384, 128, 64, '#00aa9e66'), { flipX: true }),
    Object.assign(new Platform(992, 160, 320, 224, '#00aa9e66'), { flipX: true }),
    Object.assign(new Platform(1312, 160, 928, 64, '#00aa9e66'), { flipX: true }),
    Object.assign(new Platform(2240, 160, 32, 64, '#00aa9e66'), { flipX: true }),
    new BigCollect(864, 704, 64, 64),
    new SecretPortal(64, 480, 64, 64, "cider_secret_1"),
);

};