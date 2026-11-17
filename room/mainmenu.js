window.roomData = window.roomData || {};
window.roomData['mainmenu'] = function() {
this.roomWidth = 960;
this.roomHeight = 540;
this.sRankScore = 10000;
this.roomBackground = 'bg_mainmenu';
this.bgFollowCamera = true;
this.entities.push(
    Object.assign(new Platform(-192, 0, 32, 64, '#00aa9e66'), { flipX: true }),
    Object.assign(new Platform(-224, 64, 160, 64, '#00aa9e66'), { flipX: true }),
    Object.assign(new Platform(-96, 0, 32, 64, '#00aa9e66'), { flipX: true }),
    Object.assign(new Platform(-192, -32, 128, 32, '#00aa9e66'), { flipX: true }),
    Object.assign(new TargetDoor_A(-128, 32, 32, 32), { flipX: true }),
    new obj_mainmenu(0, 0)
);

};
