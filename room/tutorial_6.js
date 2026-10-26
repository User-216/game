window.roomData = window.roomData || {};
window.roomData['tutorial_6'] = function() {
this.roomWidth = 2800;
this.roomHeight = 1000;
this.sRankScore = 10000;
this.roomBackground = 'bg_tutorial';
this.bgFollowCamera = true;
this.bgSecret = true;
this.bgWave = true;
this.tileWave = true;
this.entities.push(
    new Platform(0, 128, 96, 608, '#00aa9e66'),
    new Platform(96, 128, 1824, 64, '#00aa9e66'),
    new Platform(0, 736, 384, 256, '#00aa9e66'),
    new Door(160, 672, 32, 64, 'A', 'tutorial_5'),
    new TargetDoor_A(160, 704, 32, 32),
    new Collect(736, 605.7277077299649, 32, 32),
    new Collect(672, 662.4039671624358, 32, 32),
    new Collect(608, 684.8372310688266, 32, 32),
    new BigCollect(800, 577.504193877035, 64, 64),
    new Platform(768, 672, 384, 64, '#00aa9e66'),
    new Slope(1152, 672, 128, 64, 'right-up'),
    new Platform(512, 736, 1024, 256, '#00aa9e66'),
    new Platform(1920, 128, 608, 64, '#00aa9e66'),
    new Platform(2528, 128, 128, 64, '#00aa9e66'),
    Object.assign(new Platform(2528, 448, 128, 128, '#00aa9e66'), { flipX: true }),
    Object.assign(new Platform(1440, 192, 1216, 192, '#00aa9e66'), { flipX: true }),
    Object.assign(new Platform(1440, 384, 1216, 64, '#00aa9e66'), { flipX: true }),
    Object.assign(new Platform(1536, 832, 1280, 96, '#00aa9e66'), { flipX: true }),
    Object.assign(new Platform(2656, 128, 160, 704, '#00aa9e66'), { flipX: true }),
    Object.assign(new Platform(2528, 576, 128, 32, '#00aa9e66'), { flipX: true }),
    Object.assign(new Pillar(2528, 608, 128, 224), { flipX: true }),
);

};