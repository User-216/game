window.roomData = window.roomData || {};
window.roomData['cider_secret_1'] = function() {
this.roomWidth = 4500;
this.roomHeight = 3000;
this.sRankScore = 10000;
this.roomBackground = 'bg_tutorial';
this.bgFollowCamera = true;
this.bgSecret = true;
this.entities.push(
    new Platform(832, 2496, 480, 96, '#00aa9e66'),
    new Slope(1312, 2432, 128, 64, 'left-up'),
    new Platform(1440, 2432, 224, 64, '#00aa9e66'),
    new Platform(1312, 2496, 352, 96, '#00aa9e66'),
    new Platform(1664, 2432, 128, 160, '#00aa9e66'),
    new Platform(1696, 2592, 96, 96, '#00aa9e66'),
    new Platform(2208, 2368, 608, 160, '#00aa9e66'),
    new Platform(1440, 2592, 256, 96, '#00aa9e66'),
    new Platform(3104, 1760, 128, 704, '#00aa9e66'),
    new Destroyable(2208, 2304, 64, 64),
    new Destroyable(2208, 2240, 64, 64),
    new Platform(2112, 2016, 416, 96, '#00aa9e66'),
    new Platform(2208, 2112, 160, 128, '#00aa9e66'),
    new Platform(1728, 1952, 128, 160, '#00aa9e66'),
    new OneWayPlatform(2528, 2016, 256, 32, '#9e00aa66'),
    new Collect(2560, 2304, 32, 32),
    new Collect(2592, 2272, 32, 32),
    new Collect(2624, 2304, 32, 32),
    new Collect(2656, 2272, 32, 32),
    new BigCollect(2720, 2272, 64, 64),
    new Platform(1856, 2016, 256, 96, '#00aa9e66'),
    new Platform(1728, 1472, 128, 480, '#00aa9e66'),
    new Platform(2464, 1248, 128, 352, '#00aa9e66'),
    new SecretPortal(2336, 1376, 64, 64, "cider_3"),
    new Platform(2208, 1472, 256, 128, '#00aa9e66'),
    new Platform(1472, 1472, 256, 96, '#00aa9e66'),
    new BigCollect(2144, 1920, 64, 64),
    new Collect(2240, 1952, 32, 32),
    new Collect(2272, 1920, 32, 32),
    new Collect(2304, 1952, 32, 32),
    new Collect(2336, 1920, 32, 32),
    new Platform(2272, 1056, 320, 192, '#00aa9e66'),
    new Platform(2240, 1056, 32, 192, '#00aa9e66'),
    new Platform(1312, 1472, 160, 96, '#00aa9e66'),
    new Platform(1312, 1568, 416, 544, '#00aa9e66'),
    new Platform(832, 2592, 608, 96, '#00aa9e66'),
    new SecretPortalExit(992, 2336, 64, 64),
    new Platform(1152, 1472, 160, 640, '#00aa9e66'),
    new Slope(1408, 1408, 160, 64, 'right-up'),
    new Platform(1152, 1408, 256, 64, '#00aa9e66'),
    new Platform(1024, 1280, 128, 832, '#00aa9e66'),
    new Collect(1728, 1408, 32, 32),
    new Collect(1696, 1376, 32, 32),
    new Collect(1664, 1408, 32, 32),
    new Collect(1632, 1376, 32, 32),
    new PizzaSon(1248, 1344, 64, 64),
);

};