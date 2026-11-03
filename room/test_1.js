window.roomData = window.roomData || {};
window.roomData['test_1'] = function() {
this.roomWidth = 10000;
this.roomHeight = 1200;
this.sRankScore = 10000;
this.roomMusic = 'mu _shitcity.mp3';
this.roomBackground = 'bg_beaker';
this.bgFollowCamera = true;
this.entities.push(
    new Platform(0, 96, 96, 704, '#00aa9e66'),
    new ExitGate(544, 576, 160, 256),
    new Platform(480, 832, 288, 64, '#00aa9e66'),
    new Slope(352, 832, 128, 64, 'left-up'),
    new Slope(768, 832, 128, 64, 'right-up'),
    new TutorialBook(736, 800, 32, 32, "아직 미완성이므로 4 키를 눌러 히트박스를 키세요"),
    new Platform(96, 96, 1312, 288, '#00aa9e66'),
    new TargetDoor_A(608, 800, 32, 32),
    new Destroyable(1568, 736, 64, 96),
    new Platform(1504, 384, 128, 352, '#00aa9e66'),
    new Platform(1408, 832, 224, 160, '#00aa9e66'),
    new Platform(0, 896, 1408, 96, '#00aa9e66'),
    new Slope(1632, 832, 160, 64, 'right-up'),
    new Platform(1408, 96, 1024, 288, '#00aa9e66'),
    new Platform(2656, 736, 448, 160, '#00aa9e66'),
    new Slope(2528, 736, 128, 64, 'left-up'),
    new Platform(2432, 96, 832, 288, '#00aa9e66'),
    new Destroyable(2912, 704, 32, 32),
    new Destroyable(2944, 704, 32, 32),
    new Platform(2912, 384, 96, 320, '#00aa9e66'),
    Object.assign(new Slime(1184, 864, 32, 32), { flipX: true, facingDir: -1 }),
    Object.assign(new Collect(992, 832, 32, 32), { flipX: true }),
    Object.assign(new Collect(1056, 832, 32, 32), { flipX: true }),
    Object.assign(new Collect(1120, 832, 32, 32), { flipX: true }),
    Object.assign(new Platform(2528, 800, 128, 96, '#00aa9e66'), { flipX: true }),
    Object.assign(new Platform(2240, 800, 96, 320, '#00aa9e66'), { flipX: true }),
    Object.assign(new Platform(1632, 896, 608, 96, '#00aa9e66'), { flipX: true }),
    Object.assign(new Platform(2464, 800, 64, 96, '#00aa9e66'), { flipX: true }),
    Object.assign(new OneWayPlatform(2336, 800, 128, 32, '#9e00aa66'), { flipX: true }),
    Object.assign(new Platform(2240, 1120, 960, 64, '#00aa9e66'), { flipX: true }),
    Object.assign(new Platform(2976, 896, 128, 192, '#00aa9e66'), { flipX: true }),
    Object.assign(new Destroyable(3040, 1088, 32, 32), { flipX: true }),
    Object.assign(new Destroyable(3072, 1088, 32, 32), { flipX: true }),
    Object.assign(new Destroyable(3008, 1088, 32, 32), { flipX: true }),
    Object.assign(new Destroyable(2976, 1088, 32, 32), { flipX: true }),
    Object.assign(new Platform(3200, 1120, 672, 64, '#00aa9e66'), { flipX: true }),
    Object.assign(new Platform(3264, 832, 224, 160, '#00aa9e66'), { flipX: true }),
    Object.assign(new OneWayPlatform(3104, 832, 160, 32, '#9e00aa66'), { flipX: true }),
    new Destroyable(3104, 768, 64, 64),
    new Destroyable(3168, 768, 32, 32),
    new Destroyable(3168, 800, 32, 32),
    new Destroyable(3200, 800, 32, 32),
    new Destroyable(3200, 768, 32, 32),
    Object.assign(new Slime(3360, 800, 32, 32), { flipX: true, facingDir: -1 }),
);

};