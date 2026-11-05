window.roomData = window.roomData || {};
window.roomData['SecretPortal_test'] = function() {
this.sRankScore = 10000;
this.roomBackground = 'bg_beaker';
this.bgFollowCamera = true;
this.entities.push(
    new Platform(0, 500, 1000, 50, '#00aa9e66'),
    new SecretPortalExit(64, 384, 64, 64),
    new SecretPortal(864, 384, 64, 64, "demo_hub"),
);

};