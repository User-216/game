window.roomData = window.roomData || {};
window.roomData['test_1'] = function() {
this.roomWidth = 10000;
this.roomHeight = 1000;
this.sRankScore = 10000;
this.roomMusic = 'mu _shitcity.mp3';
this.roomBackground = 'bg_beaker';
this.bgFollowCamera = true;
this.entities.push(
    new Platform(0, 896, 1120, 96, '#00aa9e66'),
    new Platform(0, 0, 960, 96, '#00aa9e66'),
    new Platform(0, 96, 96, 704, '#00aa9e66'),
    new ExitGate(544, 576, 160, 256),
    new Platform(480, 832, 288, 64, '#00aa9e66'),
    new Slope(352, 832, 128, 64, 'left-up'),
    new Slope(768, 832, 128, 64, 'right-up'),
    new TutorialBook(736, 800, 32, 32, "아직 미완성이므로 4 키를 눌러 히트박스를 키세요"),
    new Platform(1120, 896, 256, 96, '#00aa9e66'),
    new Slope(1216, 832, 160, 64, 'left-up'),
    new Platform(1376, 832, 480, 160, '#00aa9e66'),
    new Platform(96, 96, 1312, 288, '#00aa9e66'),
    new TargetDoor_A(608, 800, 32, 32),
);

};