window.roomData = window.roomData || {};
window.roomData['rm_rank'] = function() {
    this.roomWidth = 960;
    this.roomHeight = 540;
    this.roomMusic = null;
    this.hasExplicitMusic = true;
    this.roomBackground = '#ffffff';
    this.bgFollowCamera = false;
    this.entities.push(
        new TargetDoor_A(465, 255, 32, 32),
        new RankController(0, 0)
    );
};
