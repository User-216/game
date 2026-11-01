window.roomData = window.roomData || {};
window.roomData['rm_rank'] = function() {
    this.roomWidth = 960;
    this.roomHeight = 540;
    this.roomMusic = null;
    this.hasExplicitMusic = true;
    this.roomBackground = '#ffffff';
    this.bgFollowCamera = false;
    this.entities.push(
        new Platform(0, 293, 960, 64, '#ffffff'),
        new TargetDoor_A(464, 248, 32, 32),
        new RankController(0, 0)
    );
};
