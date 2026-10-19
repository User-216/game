const i18n = {
    en: {
        'ui.speed': 'SPEED', 'ui.climb': 'CLIMB', 'ui.state': 'STATE', 'ui.room': 'ROOM',
        'tut.move': 'Move', 'tut.jump': 'Jump', 'tut.run': 'Run', 'tut.editor': 'Design Mode',
        'tut.hint': 'Wall jump is possible / Break destroyable blocks!',
        'menu.paused': 'PAUSED', 'menu.resume': 'Resume', 'menu.options': 'Options',
        'menu.restart': 'Restart Level', 'menu.exit': 'Exit to Title',
        'opt.title': 'OPTIONS', 'opt.game': 'Game', 'opt.audio': 'Audio', 'opt.video': 'Video',
        'opt.control': 'Control', 'opt.master_vol': 'Master Volume', 'opt.music_vol': 'Music Volume',
        'opt.sfx_vol': 'SFX Volume', 'opt.unfocused_mute': 'Unfocused Mute', 'opt.resolution': 'Resolution',
        'opt.window': 'Window Size', 'opt.fullscreen': 'Toggle Fullscreen', 'opt.language': 'Language',
        'opt.vsync': 'VSync', 'opt.texture': 'Texture Filtering', 'opt.screenshake': 'Screen Shake',
        'opt.camera_speed': 'Camera Speed',
        'opt.back': 'Back', 'bind.press': 'Press any key...', 'bind.cancel': '(Wait 3s to cancel)',
        'state.idle': 'IDLE', 'state.climbing': 'CLIMBING', 'state.running': 'RUNNING',
        'state.grounded': 'GROUNDED', 'state.airborne': 'AIRBORNE', 'state.groundpound': 'GROUNDPOUND',
        'state.groundpoundland': 'GROUNDPOUNDLAND',
        'state.drifting': 'DRIFTING', 'state.mach': 'MACH', 'title.press': '- Press Z to Start -'
    },
    ko: {
        'ui.speed': '속도', 'ui.climb': '등반', 'ui.state': '상태', 'ui.room': '방',
        'tut.move': '이동', 'tut.jump': '점프', 'tut.run': '달리기', 'tut.editor': '디자인 모드',
        'tut.hint': '벽에서 점프 가능 / 파괴 가능한 블록을 부수세요!',
        'menu.paused': '일시정지', 'menu.resume': '계속하기', 'menu.options': '설정',
        'menu.restart': '재시작', 'menu.exit': '타이틀로',
        'opt.title': '설정', 'opt.game': '게임', 'opt.audio': '오디오', 'opt.video': '비디오',
        'opt.control': '조작', 'opt.master_vol': '마스터 음량', 'opt.music_vol': '음악 음량',
        'opt.sfx_vol': '효과음 음량', 'opt.unfocused_mute': '비활성 시 음소거', 'opt.resolution': '해상도',
        'opt.window': '창 모드', 'opt.fullscreen': '전체화면 전환', 'opt.language': '언어',
        'opt.vsync': '수직 동기화(VSync)', 'opt.texture': '텍스처 필터링', 'opt.screenshake': '화면 흔들림',
        'opt.camera_speed': '카메라 이동 속도',
        'opt.back': '뒤로', 'bind.press': '아무 키나 누르세요...', 'bind.cancel': '(3초 대기 시 취소)',
        'state.idle': '대기', 'state.climbing': '등반중', 'state.running': '달리는중',
        'state.grounded': '지상', 'state.airborne': '공중', 'state.groundpound': '찍기',
        'state.groundpoundland': '찍기착지',
        'state.drifting': '드리프트', 'state.mach': '마하', 'title.press': '- Z를 눌러 시작 -'
    }
};

window.lang_get_value = function(key) {
    if (!key) return "";
    const lang = (window.gameInstance && window.gameInstance.settings && window.gameInstance.settings.language) || (window.game && window.game.settings && window.game.settings.language) || 'en';
    if (lang === 'ko' && window.langData_ko && window.langData_ko[key] !== undefined) {
        return window.langData_ko[key];
    }
    if (window.langData && window.langData[key] !== undefined) {
        return window.langData[key];
    }
    if (window.langData_ko && window.langData_ko[key] !== undefined) {
        return window.langData_ko[key];
    }
    return key;
};

try {
    Object.defineProperty(window, 'escape', {
        configurable: true,
        get() {
            if (window.gameInstance) return window.gameInstance.escape;
            return window._globalEscape || false;
        },
        set(val) {
            window._globalEscape = !!val;
            if (window.gameInstance) {
                window.gameInstance.escape = !!val;
            }
        }
    });
} catch (e) {}

class Game {
    get escape() {
        return this._escape || false;
    }
    set escape(val) {
        const prev = this._escape || false;
        this._escape = !!val;
        if (this._escape && !prev) {
            // Escape mode activated! Play Breaking News escape theme immediately!
            if (this.audio) {
                this.audio.playMusic('mu_escape.wav');
            }
        } else if (!this._escape && prev) {
            // Escape mode deactivated! Revert to room music
            if (this.audio) {
                this.audio.playMusic(this.roomMusic || null);
            }
        }
    }

    isKeyPressed(k) {
        if (!k) return false;
        return !!(this.keys[k] || this.keys[k.toLowerCase()] || this.keys[k.toUpperCase()]);
    }
    
    isActionPressed(action) {
        if (!this.settings || !this.settings.bindings) return false;
        const k1 = this.settings.bindings[action];
        const k2 = this.settings.bindings_2 ? this.settings.bindings_2[action] : null;
        return this.isKeyPressed(k1) || this.isKeyPressed(k2);
    }
    
    clearActionKey(action) {
        if (!this.settings || !this.settings.bindings) return;
        const k1 = this.settings.bindings[action];
        const k2 = this.settings.bindings_2 ? this.settings.bindings_2[action] : null;
        if (k1) { this.keys[k1] = false; this.keys[k1.toLowerCase()] = false; this.keys[k1.toUpperCase()] = false; }
        if (k2) { this.keys[k2] = false; this.keys[k2.toLowerCase()] = false; this.keys[k2.toUpperCase()] = false; }
    }

    constructor() {
        window.gameInstance = this;
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.speedMeter = document.getElementById('speed-meter');
        this.climbMeter = document.getElementById('climb-speed-meter');
        this.posInfo = document.getElementById('pos-info');
        this.stateInfo = document.getElementById('state-info');
        this.uiOverlay = document.getElementById('ui-overlay');
        
        this.lastTime = performance.now();
        this.accumulator = 0;
        
        this.pauseMenuOptions = ['RESUME', 'OPTIONS', 'PALETTE', 'RESTART', 'EXIT LEVEL'];
        this.pauseMenuIndex = 0;
        this.pauseBubbles = [];
        
        // Chat System
        this.chatMessages = []; // { sender, text, timer }
        this.isTyping = false;
        this.chatInput = document.createElement('input');
        this.chatInput.type = 'text';
        this.chatInput.style.position = 'absolute';
        this.chatInput.style.left = '10px';
        this.chatInput.style.bottom = '10px';
        this.chatInput.style.width = '300px';
        this.chatInput.style.padding = '5px';
        this.chatInput.style.background = 'rgba(0,0,0,0.7)';
        this.chatInput.style.color = 'white';
        this.chatInput.style.border = '1px solid white';
        this.chatInput.style.fontFamily = 'monospace';
        this.chatInput.style.display = 'none';
        this.chatInput.style.zIndex = '9999';
        this.chatInput.maxLength = 50;
        document.body.appendChild(this.chatInput);
        
        this.chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.stopPropagation(); // Prevent bubbling up to window
                if (this.isOnline()) {
                    this.sendChatMessage(this.chatInput.value);
                }
                this.chatInput.value = '';
                this.chatInput.style.display = 'none';
                this.isTyping = false;
                this.canvas.focus();
            } else if (e.key === 'Escape') {
                e.stopPropagation();
                this.chatInput.value = '';
                this.chatInput.style.display = 'none';
                this.isTyping = false;
                this.canvas.focus();
            }
        });
        
        this.optionsMenuOptions = ['AUDIO', 'VIDEO', 'GAME', 'CONTROLS', 'LANGUAGE'];
        this.optionsMenuIndex = 0;
        this.optionsMenuLevel = 'MAIN'; // MAIN, AUDIO, VIDEO, GAME, CONTROLS, LANGUAGE
        this.optionsScrollX = 0;
        this.optionsScrollY = 0;
        this.bindingsScrollY = 0;
        
        try {
            const fontPixel = new FontFace('NeoDunggeunmo', 'url(lang/korean/NeoDunggeunmo.woff)');
            fontPixel.load().then(f => document.fonts.add(f));
            const font1 = new FontFace('Custom_Jejudoldam', 'url(lang/korean/Custom_Jejudoldam.ttf)');
            font1.load().then(f => document.fonts.add(f));
            const font2 = new FontFace('Custom_KyoboHandwriting2019', 'url(lang/korean/Custom_KyoboHandwriting2019.ttf)');
            font2.load().then(f => document.fonts.add(f));
        } catch(e) {}
        
        this.optionsBGImages = [];
        this.optionsBGLoaded = false;
        let bgLoadedCount = 0;
        for (let i = 0; i < 5; i++) {
            let img = new Image();
            img.src = `spr_optionsBG/spr_optionsBG_${i}.png`;
            img.onload = () => {
                bgLoadedCount++;
                if (bgLoadedCount === 5) this.optionsBGLoaded = true;
            };
            this.optionsBGImages.push(img);
        }

        this.bigFontImages = [];
        this.bigFontLoaded = false;
        let loadedCount = 0;
        for(let i = 0; i < 67; i++) {
            let img = new Image();
            img.src = `font/spr_bigfont/spr_bigfont_${i}.png`;
            const checkLoad = () => {
                loadedCount++;
                if (loadedCount === 67) this.bigFontLoaded = true;
            };
            img.onload = checkLoad;
            img.onerror = checkLoad;
            this.bigFontImages.push(img);
        }
        
        this.controlIcons = {};
        const iconsToLoad = ['up', 'down', 'left', 'right', 'jump', 'grab', 'dash', 'superjump', 'groundpound', 'taunt', 'pause'];
        iconsToLoad.forEach(iconName => {
            let img = new Image();
            img.src = `spr_controlicons/spr_controlicons_${iconName}.png`;
            this.controlIcons[iconName] = img;
        });

        let savedLang = 'ko';
        try {
            savedLang = localStorage.getItem('gameLanguage') || 'ko';
        } catch(e) {}

        let savedSettings = {};
        try {
            const raw = localStorage.getItem('gameSettings');
            if (raw) savedSettings = JSON.parse(raw);
        } catch(e) {}

        this.settings = {
            language: savedLang,
            masterVolume: savedSettings.masterVolume !== undefined ? savedSettings.masterVolume : 100,
            musicVolume: savedSettings.musicVolume !== undefined ? savedSettings.musicVolume : 80,
            sfxVolume: savedSettings.sfxVolume !== undefined ? savedSettings.sfxVolume : 100,
            shakeIntens: savedSettings.shakeIntens !== undefined ? savedSettings.shakeIntens : 100,
            screenShake: savedSettings.shakeIntens !== undefined ? (savedSettings.shakeIntens > 0) : true,
            unfocusedMute: savedSettings.unfocusedMute !== undefined ? savedSettings.unfocusedMute : true,
            isFocused: true,
            resolution: 'native',
            vsync: savedSettings.vsync !== undefined ? savedSettings.vsync : true,
            textureFiltering: savedSettings.textureFiltering !== undefined ? savedSettings.textureFiltering : false,
            cameraSpeed: 100,
            showHitboxes: false,
            resolutions: ['960 X 540', '1280 X 720', '1920 X 1080'],
            resolutionIndex: savedSettings.resolutionIndex !== undefined ? savedSettings.resolutionIndex : 0,
            windowMode: savedSettings.windowMode || 'WINDOWED',
            hideHud: savedSettings.hideHud !== undefined ? savedSettings.hideHud : false,
            timer: savedSettings.timer !== undefined ? savedSettings.timer : false,
            dirSuperjump: savedSettings.dirSuperjump !== undefined ? savedSettings.dirSuperjump : true,
            dirGroundpound: savedSettings.dirGroundpound !== undefined ? savedSettings.dirGroundpound : true,
            bindings: savedSettings.bindings || {
                left: 'ArrowLeft',
                right: 'ArrowRight',
                up: 'ArrowUp',
                down: 'ArrowDown',
                jump: 'z',
                run: 'Shift',
                grab: 'x',
                dash: 'Shift',
                superjump: 'ArrowUp',
                groundpound: 'ArrowDown',
                taunt: 'c',
                pause: 'Escape',
                menu_left: 'ArrowLeft',
                menu_right: 'ArrowRight',
                menu_up: 'ArrowUp',
                menu_down: 'ArrowDown',
                menu_confirm: 'z',
                menu_back: 'x',
                menu_clear: 'c'
            },
            bindings_2: savedSettings.bindings_2 || {}
        };
        this.bindingKeyFor = null;
        this.audio = new AudioManager(this.settings);

        this.resize();
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('blur', () => {
            this.settings.isFocused = false;
            if (this.audio && this.audio.updateMusicVolume) this.audio.updateMusicVolume();
        });
        window.addEventListener('focus', () => {
            this.settings.isFocused = true;
            if (this.audio) {
                if (this.audio.unlockAudio) this.audio.unlockAudio();
                if (this.audio.updateMusicVolume) this.audio.updateMusicVolume();
            }
        });
        this.settings.isFocused = true;

        this.loadingScreenImages = [];
        this.introVideo = document.createElement('video');
        this.introVideo.src = 'gamedata/intro.mp4';
        this.introVideo.playsInline = true;
        this.transitionImages = [];
        this.transitionFrameCount = 28;
        for (let i = 0; i < this.transitionFrameCount; i++) {
            let img = new Image();
            img.src = `spr_cooltransition/spr_cooltransition_${i}.png`;
            this.transitionImages.push(img);
        }
        this.loadingScreenLoaded = false;
        this.loadingBounds = { minX: 226, maxX: 476 };
        let lsLoadedCount = 0;
        for (let i = 0; i < 2; i++) {
            let img = new Image();
            img.src = `이미지/spr_loadingscreen/spr_loadingscreen_${i}.png`;
            img.onload = () => {
                lsLoadedCount++;
                if (lsLoadedCount === 2) {
                    this.computeLoadingScreenBounds();
                    this.loadingScreenLoaded = true;
                }
            };
            this.loadingScreenImages.push(img);
        }
        this.gameState = 'BOOT_LOADING';
        this.bootLoadTimer = 0;
        this.bootLoadDuration = 120; // 2 seconds at 60fps

        this.player = new Player(100, 300);
        this.entities = [];
        this.keys = {};
        this.camera = { x: 0, y: 0 };
        this.cameraShake = 0;
        this.cameraSpeedOffset = 0;
        
        // Transitions
        this.transitionState = 'NONE';
        this.transitionAlpha = 0;
        this.transitionDuration = 12; // 12 frames (approx. 0.2s)
        this.transitionTimer = 0;
        this.pendingRoom = null;
        this.pendingDoor = null;
        
        this.bgManager = typeof BackgroundManager !== 'undefined' ? new BackgroundManager(this) : null;
        this.roomBackground = 'bg_beaker';
        this.roomMusic = null;
        this.hasExplicitMusic = false;
        this._escape = false;
        this.bgFollowCamera = true;
        this.bgSpeed = 1.0;
        this.bgSecret = false;
        this.bgWave = false;
        this.bgWaveAmp = 8;
        this.bgWaveSpeed = 1.0;

        this.tileWave = false;
        this.tileWaveAmp = 3.5;
        this.tileWaveSpeed = 1.0;
        this.tileWaveFreq = 0.025;
        this.tileWaveTimer = 0;
        this.tileOffscreenCanvas = null;
        this.tileOffscreenCtx = null;

        this.initRooms();
        this.bootRoomLoaded = false;
        
        // Clear any old saved_room_ cache from localStorage so files always take priority
        try {
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('saved_room_')) {
                    localStorage.removeItem(key);
                }
            });
        } catch(e) {}

        // Preload rooms and load initial room during boot loading
        const roomsToPreload = ['tutorial_1'];
        let preloadedCount = 0;
        roomsToPreload.forEach(rName => {
            const script = document.createElement('script');
            script.src = `room/${rName}.js?t=${new Date().getTime()}`;
            script.onload = () => {
                if (window.roomData && window.roomData[rName]) {
                    this.rooms[rName] = window.roomData[rName];
                }
                preloadedCount++;
                if (preloadedCount === roomsToPreload.length) {
                    this.loadRoom('tutorial_1').then(() => {
                        this.bootRoomLoaded = true;
                    });
                }
            };
            script.onerror = () => {
                preloadedCount++;
                if (preloadedCount === roomsToPreload.length) {
                    this.loadRoom('tutorial_1').then(() => {
                        this.bootRoomLoaded = true;
                    });
                }
            };
            document.body.appendChild(script);
        });
        
        this.isEditorMode = false;
        this.selectedType = 'platform';
        this.selectedTileX = 0;
        this.selectedTileY = 0;
        this.selectedTileW = 32;
        this.selectedTileH = 32;
        this.currentTilesetName = 'tile_tutorial.png';
        this.initTilesetPalette();
        this.gridSize = 32;
        this.dragStart = null;
        this.rightDragStart = null;
        this.justExecutedRightDrag = false;
        this.mousePos = { x: 0, y: 0 };
        this.showCollisions = false;
        this.collisionToggleTimer = 0;
        this.tileFlipX = false;
        this.tileFlipY = false;
        this.flipToastTimer = 0;
        this.flipToastMsg = '';
        
        // Load tutorial bubble and border texture
        this.tutorialBorderImage = new Image();
        this.tutorialBorderImage.src = 'tutorial/spr_tutorialbubble/spr_tutorialbubble_1.png';
        
        this.tutorialMaskImage = new Image();
        this.tutorialMaskImage.src = 'tutorial/spr_tutorialbubble/spr_tutorialbubble_0.png';
        
        this.tutorialPatternImage = new Image();
        this.tutorialPatternImage.src = 'tutorial/spr_pizzagrannytexture.png';
        
        this.tutorialRopeImage = new Image();
        this.tutorialRopeImage.src = 'tutorial/spr_tutorialbubble_rope.png';
        
        // Load tutorial sprite font and tint to black
        this.tutorialFontImages = [];
        this.tutorialFontLoadedCount = 0;
        this.tutorialFontTotal = 118;
        for (let i = 0; i < this.tutorialFontTotal; i++) {
            const img = new Image();
            img.src = `tutorial/spr_tutorialfont/spr_tutorialfont_${i}.png`;
            img.onload = () => { 
                const tempC = document.createElement('canvas');
                tempC.width = img.width || 32;
                tempC.height = img.height || 32;
                if (img.width > 0) {
                    const tempCtx = tempC.getContext('2d');
                    tempCtx.drawImage(img, 0, 0);
                    tempCtx.globalCompositeOperation = 'source-in';
                    tempCtx.fillStyle = '#000000';
                    tempCtx.fillRect(0, 0, tempC.width, tempC.height);
                }
                this.tutorialFontImages[i] = tempC;
                this.tutorialFontLoadedCount++; 
            };
            this.tutorialFontImages.push(img);
        }

        // Load credits font
        this.creditsFontImages = [];
        const creditsFontIndices = [
            0,1,2,3,5,6,4,7,8,9,10,11,12,13,15,16,17,18,19,20,21,22,23,24,25,26,
            27,28,29,30,31,32,33,34,35,36,37,38,39,40,42,43,44,45,46,47,48,49,50,
            51,52,53,54,55,56,58,59,60,61,62,63,64,65,66,67,68,69,70
        ];
        this.creditsFontMap = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.:!0123456789?'\"";
        
        for (let i = 0; i < creditsFontIndices.length; i++) {
            let img = new Image();
            img.src = 'font/spr_creditsfont/spr_creditsfont_' + creditsFontIndices[i] + '.png';
            this.creditsFontImages.push(img);
        }

        // Load blank key
        this.tutorialBlankKeyImage = new Image();
        this.tutorialBlankKeyImage.src = 'tutorial/spr_tutorialkey.png';
        this.tutorialBlankKeyLoaded = false;
        this.tutorialBlankKeyImage.onload = () => { this.tutorialBlankKeyLoaded = true; };
        
        // Special key images (if any)
        this.tutorialKeyImages = {};
        this.getKeyImage = (keyName) => {
            if (this.tutorialKeyImages[keyName]) return this.tutorialKeyImages[keyName];
            
            let specialIdx = -1;
            if (keyName === 'SHIFT') specialIdx = 0;
            if (keyName === 'CONTROL' || keyName === 'CTRL') specialIdx = 1;
            if (keyName === 'SPACE') specialIdx = 2;
            if (keyName === 'UP') specialIdx = 3;
            if (keyName === 'DOWN') specialIdx = 4;
            if (keyName === 'RIGHT') specialIdx = 5;
            if (keyName === 'LEFT') specialIdx = 6;
            if (keyName === 'ESCAPE' || keyName === 'ESC') specialIdx = 7;
            // Also support direct index for the bindings menu
            if (keyName.startsWith('spr_tutorialkeyspecial_')) {
                specialIdx = parseInt(keyName.split('_')[2]);
            }
            
            const img = new Image();
            if (specialIdx !== -1) {
                img.src = `tutorial/spr_tutorialkeyspecial/spr_tutorialkeyspecial_${specialIdx}.png`;
            } else {
                img.src = `tutorial/spr_tutorialkeyspecial/${keyName}.png`; // fallback
            }
            img.loaded = false;
            img.error = false;
            img.onload = () => { img.loaded = true; };
            img.onerror = () => { img.error = true; };
            this.tutorialKeyImages[keyName] = img;
            return img;
        };

        this.sliderTrackImg = new Image();
        this.sliderTrackImg.src = 'spr_slider.png';
        this.sliderTrackImg.loaded = false;
        this.sliderTrackImg.onload = () => { this.sliderTrackImg.loaded = true; };

        this.sliderThumbImg = new Image();
        this.sliderThumbImg.src = 'spr_slidericon2.png';
        this.sliderThumbImg.loaded = false;
        this.sliderThumbImg.onload = () => { this.sliderThumbImg.loaded = true; };

        this.tutorialTexX = 0;
        this.tutorialWaveTimer = 0;
        this.currentTutorialText = null;
        this.currentTutorialBook = null;

        this.setupInputs();
        this.setupEditorUI();
        this.setupMenuUI();
        this.translateUI();
        this.loadLangFile();

        this.loop(performance.now());
    }

    translateUI() {
        const lang = this.settings.language || 'ko';
        const dict = i18n[lang];
        if (!dict) return;

        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (dict[key]) {
                el.innerText = dict[key];
            }
        });
    }

    resize() {
        this.canvas.width = 960;
        this.canvas.height = 540;
        this.canvas.style.width = '100vw';
        this.canvas.style.height = '100vh';
        this.canvas.style.objectFit = 'contain';
    }

    computeLoadingScreenBounds() {
        try {
            const img1 = this.loadingScreenImages[1];
            if (!img1 || !img1.width || !img1.height) return;
            if (img1.width === 718 && img1.height === 259) {
                this.loadingBounds = { minX: 226, maxX: 476 };
            }
            const canvas = document.createElement('canvas');
            canvas.width = img1.width;
            canvas.height = img1.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img1, 0, 0);
            const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
            let minX = canvas.width, maxX = 0;
            for (let y = 0; y < canvas.height; y++) {
                const rowOffset = y * canvas.width * 4;
                for (let x = 0; x < canvas.width; x++) {
                    if (data[rowOffset + x * 4 + 3] > 10) {
                        if (x < minX) minX = x;
                        if (x > maxX) maxX = x;
                    }
                }
            }
            if (maxX >= minX) {
                this.loadingBounds = { minX, maxX };
            }
        } catch (e) {
            // Keep existing fallback
        }
    }

    renderLoadingScreen(progress) {
        if (!this.loadingScreenLoaded || !this.loadingScreenImages || this.loadingScreenImages.length < 2) return;
        const img0 = this.loadingScreenImages[0];
        const img1 = this.loadingScreenImages[1];
        if (!img0.complete || !img1.complete) return;
        
        const scale = Math.min(
            this.canvas.width / img0.width,
            this.canvas.height / img0.height
        ) * 0.8; 
        
        const w0 = img0.width * scale;
        const h0 = img0.height * scale;
        const centerX = this.canvas.width / 2 - w0 / 2;
        const centerY = this.canvas.height / 2 - h0 / 2;
        
        // Draw silhouette
        this.ctx.drawImage(img0, centerX, centerY, w0, h0);
        
        // Draw colored image revealed from left to right based on character content bounds
        let clampedProgress = Math.max(0, Math.min(1, progress));
        
        const minX = (this.loadingBounds && this.loadingBounds.minX !== undefined) ? this.loadingBounds.minX : 0;
        const maxX = (this.loadingBounds && this.loadingBounds.maxX !== undefined) ? this.loadingBounds.maxX : img1.width;
        const charWidth = Math.max(1, maxX - minX);
        
        // Map progress (0 -> 1) across the actual visible character bounds (minX -> maxX)
        const revealX = minX + charWidth * clampedProgress;
        const revealWidthSrc = Math.min(img1.width, revealX);
        const revealWidthDest = revealWidthSrc * scale;
        
        if (revealWidthSrc > 0) {
            this.ctx.drawImage(
                img1,
                0, 0, revealWidthSrc, img1.height,
                centerX, centerY, revealWidthDest, h0
            );
        }
    }

    getPixelatedTextCanvas(text, fontName = 'Custom_Jejudoldam', fontSize = 32, strokeWidth = 2, isSolidColor = false, color = '#000000') {
        if (!this.pixelTextCache) this.pixelTextCache = new Map();
        const cacheKey = `${text}_${fontName}_${fontSize}_${strokeWidth}_${isSolidColor}_${color}`;
        if (this.pixelTextCache.has(cacheKey)) {
            return this.pixelTextCache.get(cacheKey);
        }

        const measureCanvas = document.createElement('canvas');
        const measureCtx = measureCanvas.getContext('2d');
        measureCtx.font = `bold ${fontSize}px "${fontName}", sans-serif`;
        const metrics = measureCtx.measureText(text);
        const padding = Math.max(4, strokeWidth * 2 + 6);
        const textWidth = Math.ceil(metrics.width);
        const textHeight = Math.ceil(fontSize * 1.3);
        const w = Math.max(1, textWidth + padding * 2);
        const h = Math.max(1, textHeight + padding * 2);

        const offCanvas = document.createElement('canvas');
        offCanvas.width = w;
        offCanvas.height = h;
        const offCtx = offCanvas.getContext('2d');

        offCtx.font = `bold ${fontSize}px "${fontName}", sans-serif`;
        offCtx.textBaseline = 'top';
        offCtx.textAlign = 'left';

        if (isSolidColor) {
            // Pure solid colored text (e.g. pure black ink for tutorial book)
            offCtx.fillStyle = color;
            offCtx.fillText(text, padding, padding);

            try {
                const imgData = offCtx.getImageData(0, 0, w, h);
                const data = imgData.data;
                for (let i = 0; i < data.length; i += 4) {
                    const alpha = data[i + 3];
                    if (alpha < 70) {
                        data[i + 3] = 0;
                    } else {
                        data[i] = 0;
                        data[i + 1] = 0;
                        data[i + 2] = 0;
                        data[i + 3] = 255;
                    }
                }
                offCtx.putImageData(imgData, 0, 0);
            } catch (e) {}
        } else {
            // Draw crisp outline
            if (strokeWidth <= 1) {
                offCtx.fillStyle = '#000000';
                offCtx.fillText(text, padding - 1, padding);
                offCtx.fillText(text, padding + 1, padding);
                offCtx.fillText(text, padding, padding - 1);
                offCtx.fillText(text, padding, padding + 1);
            } else {
                offCtx.lineWidth = strokeWidth * 2;
                offCtx.strokeStyle = '#000000';
                offCtx.lineJoin = 'round';
                offCtx.strokeText(text, padding, padding);
            }

            // Draw fill
            offCtx.fillStyle = '#FFFFFF';
            offCtx.fillText(text, padding, padding);

            // Remove vector anti-aliased semi-transparent sub-pixels (pixelate / binarize)
            try {
                const imgData = offCtx.getImageData(0, 0, w, h);
                const data = imgData.data;
                for (let i = 0; i < data.length; i += 4) {
                    const alpha = data[i + 3];
                    if (alpha < 60) {
                        data[i + 3] = 0;
                    } else {
                        const r = data[i];
                        const g = data[i + 1];
                        const b = data[i + 2];
                        const brightness = (r + g + b) / 3;
                        if (brightness > 85) {
                            data[i] = 255;
                            data[i + 1] = 255;
                            data[i + 2] = 255;
                            data[i + 3] = 255;
                        } else {
                            data[i] = 0;
                            data[i + 1] = 0;
                            data[i + 2] = 0;
                            data[i + 3] = 255;
                        }
                    }
                }
                offCtx.putImageData(imgData, 0, 0);
            } catch (e) {}
        }

        const result = {
            canvas: offCanvas,
            width: w,
            height: h,
            padding: padding,
            textWidth: textWidth
        };
        this.pixelTextCache.set(cacheKey, result);
        return result;
    }

    layoutTutorialText(processedText, maxTextWidth) {
        const charset = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZabcdefghijklmnñopqrstuvwxyz!¡,.:0123456789?¿-"`';
        
        const formatKey = (key) => {
            if (!key) return "NONE";
            if (key.startsWith("Arrow")) return key.replace("Arrow", "").toUpperCase();
            if (key === " ") return "SPACE";
            return key.toUpperCase();
        };
        
        const macros = {
            '[J]': formatKey(this.settings.bindings.jump),
            '[S]': formatKey(this.settings.bindings.run || this.settings.bindings.dash),
            '[Q]': formatKey(this.settings.bindings.run || this.settings.bindings.dash),
            '[L]': formatKey(this.settings.bindings.left),
            '[R]': formatKey(this.settings.bindings.right),
            '[U]': formatKey(this.settings.bindings.up),
            '[D]': formatKey(this.settings.bindings.down),
            '[G]': formatKey(this.settings.bindings.grab),
            '[T]': formatKey(this.settings.bindings.taunt)
        };

        const getKeyWidth = (keyName) => {
            const img = this.getKeyImage(keyName);
            if (img && img.loaded && !img.error && img.width > 0) {
                return img.width + 4;
            } else if (this.tutorialBlankKeyLoaded && this.tutorialBlankKeyImage && this.tutorialBlankKeyImage.width > 0) {
                return this.tutorialBlankKeyImage.width + 4;
            }
            return 36;
        };

        const getCharWidth = (char) => {
            if (char === ' ') return 16;
            const charIdx = charset.indexOf(char);
            const isKoreanChar = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(char);
            if (charIdx !== -1 && !isKoreanChar && this.settings.language !== 'ko' && this.tutorialFontImages && this.tutorialFontImages[charIdx]) {
                return Math.max(8, this.tutorialFontImages[charIdx].width - 12);
            } else {
                const pixelated = this.getPixelatedTextCanvas(char, 'Custom_KyoboHandwriting2019', 26, 0, true, '#000000');
                return Math.max(14, (pixelated ? pixelated.textWidth : 16) + 1);
            }
        };

        // 1. Build atoms
        const atoms = [];
        for (let i = 0; i < processedText.length; i++) {
            let matched = false;
            for (let m in macros) {
                if (processedText.substring(i, i + m.length) === m) {
                    const keyName = macros[m];
                    atoms.push({ type: 'key', val: keyName, width: getKeyWidth(keyName) });
                    i += m.length - 1;
                    matched = true;
                    break;
                }
            }
            if (!matched) {
                const c = processedText[i];
                if (c === '\n') {
                    atoms.push({ type: 'newline' });
                } else if (c === ' ') {
                    atoms.push({ type: 'space', width: 16 });
                } else {
                    atoms.push({ type: 'char', char: c, width: getCharWidth(c) });
                }
            }
        }

        // 2. Group into layout elements (Word, Space, Newline)
        const elements = [];
        let currentWordItems = [];
        let currentWordWidth = 0;

        const flushWord = () => {
            if (currentWordItems.length > 0) {
                elements.push({
                    type: 'word',
                    items: currentWordItems,
                    totalWidth: currentWordWidth
                });
                currentWordItems = [];
                currentWordWidth = 0;
            }
        };

        for (let i = 0; i < atoms.length; i++) {
            const atom = atoms[i];
            if (atom.type === 'newline') {
                flushWord();
                elements.push({ type: 'newline' });
            } else if (atom.type === 'space') {
                flushWord();
                elements.push({ type: 'space', width: atom.width });
            } else {
                currentWordItems.push(atom);
                currentWordWidth += atom.width;
            }
        }
        flushWord();

        // 3. Wrap elements into lines fitting within maxTextWidth
        const lines = [];
        let currentLine = [];
        let currentLineWidth = 0;
        let pendingSpace = false;

        const pushLine = () => {
            lines.push(currentLine);
            currentLine = [];
            currentLineWidth = 0;
            pendingSpace = false;
        };

        for (let i = 0; i < elements.length; i++) {
            const el = elements[i];
            if (el.type === 'newline') {
                pushLine();
            } else if (el.type === 'space') {
                if (pendingSpace && currentLineWidth > 0) {
                    currentLine.push({ type: 'space', width: 16 });
                    currentLineWidth += 16;
                }
                if (currentLine.length > 0) {
                    pendingSpace = true;
                }
            } else if (el.type === 'word') {
                const spaceW = pendingSpace ? 16 : 0;
                if (currentLineWidth + spaceW + el.totalWidth <= maxTextWidth) {
                    if (pendingSpace) {
                        currentLine.push({ type: 'space', width: 16 });
                        currentLineWidth += 16;
                        pendingSpace = false;
                    }
                    for (let j = 0; j < el.items.length; j++) {
                        currentLine.push(el.items[j]);
                    }
                    currentLineWidth += el.totalWidth;
                } else {
                    if (currentLine.length > 0) {
                        pushLine();
                    }
                    if (el.totalWidth <= maxTextWidth) {
                        for (let j = 0; j < el.items.length; j++) {
                            currentLine.push(el.items[j]);
                        }
                        currentLineWidth = el.totalWidth;
                    } else {
                        // Word itself is wider than a line: break item-by-item
                        for (let j = 0; j < el.items.length; j++) {
                            const itm = el.items[j];
                            if (currentLineWidth + itm.width > maxTextWidth && currentLine.length > 0) {
                                pushLine();
                            }
                            currentLine.push(itm);
                            currentLineWidth += itm.width;
                        }
                    }
                }
            }
        }
        if (currentLine.length > 0 || lines.length === 0) {
            lines.push(currentLine);
        }

        return lines;
    }

    getMenuLabel(text) {
        if (!text || typeof text !== 'string') return text;
        const lang = (this.settings && this.settings.language) || 'ko';
        if (lang !== 'ko') {
            return text;
        }

        const map = {
            'RESUME': 'pause_resume',
            'OPTIONS': 'pause_options',
            'PALETTE': 'pause_palette',
            'RESTART': 'pause_restart',
            'EXIT LEVEL': 'pause_exit',
            'MAIN MENU': 'pause_exit_title',
            'AUDIO': 'option_audio',
            'VIDEO': 'option_video',
            'GAME': 'option_game',
            'CONTROLS': 'option_controls',
            'LANGUAGE': 'option_lang',
            'BACK': 'option_back',
            'MASTER': 'option_master',
            'MUSIC': 'option_music',
            'SFX': 'option_sfx',
            'UNFOCUS MUTE': 'option_unfocus',
            'WINDOW MODE': 'option_window_mode',
            'RESOLUTION': 'option_resolution',
            'VSYNC': 'option_vsync',
            'TEXTURE FILTERING': 'option_texfilter',
            'HIDE HUD': 'option_hud',
            'SHOW HUD': 'option_hud',
            'SHAKE INTENS': 'option_screenshake',
            'TIMER': 'option_timer',
            'KEYBOARD': 'option_keyboard',
            'CONTROLLER': 'option_controller',
            'RESET CONFIG': 'option_reset_config',
            'MOBILE LAYOUT': 'option_mobile_layout',
            'BINDINGS': 'option_controller_binds',
            'DIR SUPERJUMP': 'option_keyboard_superjump',
            'DIR GROUNDPOUND': 'option_keyboard_groundpound',
            'WINDOWED': 'option_windowed',
            'FULLSCREEN': 'option_fullscreen',
            'BORDERLESS': 'option_borderless',
            'ON': 'option_on',
            'OFF': 'option_off',
            'YES': 'option_yes',
            'NO': 'option_no',
            'NONE': 'option_none',
            'PRESS ANY KEY': 'option_press_key',
            'MENU LEFT': 'control_menu_left',
            'MENU RIGHT': 'control_menu_right',
            'MENU UP': 'control_menu_up',
            'MENU DOWN': 'control_menu_down',
            'MENU CONFIRM': 'control_menu_confirm',
            'MENU BACK': 'control_menu_back',
            'MENU CLEAR': 'control_menu_delete'
        };

        const direct = {
            'PALETTE': '팔레트',
            'MOBILE LAYOUT': '모바일 레이아웃',
            'UP': '위',
            'DOWN': '아래',
            'LEFT': '왼쪽',
            'RIGHT': '오른쪽',
            'JUMP': '점프',
            'GRAB': '잡기',
            'DASH': '달리기',
            'SUPERJUMP': '슈퍼점프',
            'GROUNDPOUND': '찍기',
            'TAUNT': '도발',
            'PAUSE': '일시정지',
            'RESET BINDS': '키 초기화',
            'ADD BIND': '키 등록',
            'CLEAR BINDS': '키 삭제'
        };

        const key = map[text];
        if (key && window.langData_ko && window.langData_ko[key]) {
            return window.langData_ko[key];
        }
        if (direct[text]) {
            return direct[text];
        }
        return text;
    }

    enableLayoutEditMode(enable) {
        const mc = document.getElementById('mobile-controls');
        if (mc) mc.style.display = enable ? 'block' : '';
        
        const elements = ['joystick-zone', 'mbtn-run', 'mbtn-grab', 'mbtn-jump', 'mbtn-pause'];
        
        elements.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            
            if (enable) {
                el._origBorder = el.style.border; el.style.border = '2px dashed red';
                
                el._dragStart = (e) => {
                    e.preventDefault();
                    el._dragging = true;
                    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                    el._startX = clientX - el.offsetLeft;
                    el._startY = clientY - el.offsetTop;
                };
                el._dragMove = (e) => {
                    e.preventDefault();
                    if (!el._dragging) return;
                    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                    el.style.left = (clientX - el._startX) + 'px';
                    el.style.top = (clientY - el._startY) + 'px';
                    el.style.bottom = 'auto';
                    el.style.right = 'auto';
                };
                el._dragEnd = (e) => {
                    if (!el._dragging) return;
                    el._dragging = false;
                    let layout = {};
                    try { layout = JSON.parse(localStorage.getItem('mobileLayout') || '{}'); } catch(err) {}
                    layout[id] = { left: el.style.left, top: el.style.top };
                    localStorage.setItem('mobileLayout', JSON.stringify(layout));
                };
                
                el.addEventListener('touchstart', el._dragStart, {passive: false});
                el.addEventListener('mousedown', el._dragStart, {passive: false});
                document.addEventListener('touchmove', el._dragMove, {passive: false});
                document.addEventListener('mousemove', el._dragMove, {passive: false});
                document.addEventListener('touchend', el._dragEnd, {passive: false});
                document.addEventListener('mouseup', el._dragEnd, {passive: false});
            } else {
                el.style.border = el._origBorder || '';
                if (el._dragStart) {
                    el.removeEventListener('touchstart', el._dragStart);
                    el.removeEventListener('mousedown', el._dragStart);
                    document.removeEventListener('touchmove', el._dragMove);
                    document.removeEventListener('mousemove', el._dragMove);
                    document.removeEventListener('touchend', el._dragEnd);
                    document.removeEventListener('mouseup', el._dragEnd);
                }
            }
        });
    }

    loadMobileLayout() {
        try {
            const layout = JSON.parse(localStorage.getItem('mobileLayout') || '{}');
            for (let id in layout) {
                const el = document.getElementById(id);
                if (el) {
                    el.style.left = layout[id].left;
                    el.style.top = layout[id].top;
                    el.style.bottom = 'auto';
                    el.style.right = 'auto';
                }
            }
        } catch(e) {}
    }
    setupInputs() {
        this.loadMobileLayout();
        const tCanv = document.getElementById('transitionCanvas');
        if (tCanv) {
            tCanv.style.width = '100vw';
            tCanv.style.height = '100vh';
            tCanv.style.objectFit = 'contain';
        }
        const tVid = document.getElementById('transitionVideo');
        if (tVid) {
            tVid.style.width = '100vw';
            tVid.style.height = '100vh';
            tVid.style.objectFit = 'contain';
        }
        this.mouseClicked = false;
        window.addEventListener('mousedown', () => { 
            this.mouseClicked = true; 
            this.settings.isFocused = true;
            if (this.audio && this.audio.unlockAudio) this.audio.unlockAudio();
        });
        window.addEventListener('touchstart', () => { 
            this.mouseClicked = true; 
            this.settings.isFocused = true;
            if (this.audio && this.audio.unlockAudio) this.audio.unlockAudio();
        }, {passive: true});
        window.addEventListener('keydown', (e) => {
            this.settings.isFocused = true;
            if (this.audio && this.audio.unlockAudio) this.audio.unlockAudio();
            if (this.isTyping) return; // Ignore keys for game if typing
            
            if (e.key === 'Enter' && this.gameState === 'PLAYING') {
                if (this.isOnline()) {
                    this.isTyping = true;
                    this.keys = {}; // Clear all keys so player stops moving
                    this.chatInput.style.display = 'block';
                    this.chatInput.focus();
                    e.preventDefault();
                    return;
                }
            }

            if (this.bindingKeyFor) {
                e.preventDefault();
                const key = e.key === ' ' ? 'Space' : e.key;
                if (this.bindingColFor === 1) {
                    if (!this.settings.bindings_2) this.settings.bindings_2 = {};
                    this.settings.bindings_2[this.bindingKeyFor] = key;
                } else {
                    this.settings.bindings[this.bindingKeyFor] = key;
                }
                this.bindingKeyFor = null;
                document.getElementById('bind-overlay').classList.add('hidden');
                if (this.refreshControlList) this.refreshControlList();
                this.saveSettings();
                return;
            }

            const key = e.key === ' ' ? 'Space' : e.key;
            this.keys[key] = true;
            this.keys[key.toLowerCase()] = true;
            this.keys[key.toUpperCase()] = true;

            let k1 = this.settings.bindings.pause;
            let k2 = this.settings.bindings_2 ? this.settings.bindings_2.pause : null;
            let isPauseKey = false;
            if (k1 && (key === k1 || key === k1.toLowerCase() || key === k1.toUpperCase())) isPauseKey = true;
            if (k2 && (key === k2 || key === k2.toLowerCase() || key === k2.toUpperCase())) isPauseKey = true;
            
            if (isPauseKey && this.gameState !== 'OPTIONS') {
                this.togglePause();
            }

            if (e.key === 'e' || e.key === 'E') {
                this.toggleEditorMode();
            }
            if (this.isEditorMode) {
                const activeTag = document.activeElement ? document.activeElement.tagName : '';
                if (activeTag !== 'INPUT' && activeTag !== 'TEXTAREA') {
                    if (e.key === 'x' || e.key === 'X' || e.key === 'f' || e.key === 'F') {
                        this.flipSelectedTool(false);
                    } else if (e.key === 'y' || e.key === 'Y') {
                        this.flipSelectedTool(true);
                    }
                }
            }
            if (!this.bindingKeyFor && (e.key === '4' || e.code === 'Digit4' || e.code === 'Numpad4')) {
                const activeTag = document.activeElement ? document.activeElement.tagName : '';
                if (activeTag !== 'INPUT' && activeTag !== 'TEXTAREA') {
                    this.toggleCollisions();
                }
            }
        });
        window.addEventListener('keyup', (e) => {
            if (e.key === 'Escape') this.keys['Escape'] = false;
            const key = e.key === ' ' ? 'Space' : e.key;
            this.keys[key] = false;
            this.keys[key.toLowerCase()] = false;
            this.keys[key.toUpperCase()] = false;
        });

        // Mobile touch controls
        const addTouch = (id, keyName) => {
            const btn = document.getElementById(id);
            if (!btn) return;
            const press = (e) => {
                e.preventDefault();
                btn.classList.add('active');
                this.keys[this.settings.bindings[keyName]] = true;
                if (this.gameState === 'TITLE' && keyName === 'jump') {
                    // Start game on title screen with jump button
                    this.keys['z'] = true;
                }
            };
            const release = (e) => {
                e.preventDefault();
                btn.classList.remove('active');
                this.keys[this.settings.bindings[keyName]] = false;
            };
            btn.addEventListener('touchstart', press, { passive: false });
            btn.addEventListener('touchend', release, { passive: false });
            btn.addEventListener('touchcancel', release, { passive: false });
        };

        const joyZone = document.getElementById('joystick-zone');
        const joyKnob = document.getElementById('joystick-knob');
        if (joyZone && joyKnob) {
            let joyActive = false;
            let joyBaseX = 0;
            let joyBaseY = 0;
            let joyId = null;

            const updateJoy = (clientX, clientY) => {
                let dx = clientX - joyBaseX;
                let dy = clientY - joyBaseY;
                const dist = Math.sqrt(dx*dx + dy*dy);
                const maxDist = 50; 
                
                if (dist > maxDist) {
                    dx = (dx / dist) * maxDist;
                    dy = (dy / dist) * maxDist;
                }
                joyKnob.style.transform = `translate(${dx}px, ${dy}px)`;

                const threshold = 15;
                if (dx < -threshold) { this.keys[this.settings.bindings['left']] = true; this.keys[this.settings.bindings['right']] = false; }
                else if (dx > threshold) { this.keys[this.settings.bindings['right']] = true; this.keys[this.settings.bindings['left']] = false; }
                else { this.keys[this.settings.bindings['left']] = false; this.keys[this.settings.bindings['right']] = false; }
                
                if (dy < -threshold) { this.keys[this.settings.bindings['up']] = true; this.keys[this.settings.bindings['down']] = false; }
                else if (dy > threshold) { this.keys[this.settings.bindings['down']] = true; this.keys[this.settings.bindings['up']] = false; }
                else { this.keys[this.settings.bindings['up']] = false; this.keys[this.settings.bindings['down']] = false; }
            };

            const resetJoy = () => {
                joyActive = false;
                joyId = null;
                joyKnob.style.transform = `translate(0px, 0px)`;
                this.keys[this.settings.bindings['left']] = false;
                this.keys[this.settings.bindings['right']] = false;
                this.keys[this.settings.bindings['up']] = false;
                this.keys[this.settings.bindings['down']] = false;
            };

            joyZone.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (joyActive) return;
                const touch = e.changedTouches[0];
                joyActive = true;
                joyId = touch.identifier;
                
                const rect = joyZone.getBoundingClientRect();
                joyBaseX = rect.left + rect.width / 2;
                joyBaseY = rect.top + rect.height / 2;
                
                updateJoy(touch.clientX, touch.clientY);
            }, { passive: false });

            joyZone.addEventListener('touchmove', (e) => {
                e.preventDefault();
                if (!joyActive) return;
                for (let i = 0; i < e.changedTouches.length; i++) {
                    if (e.changedTouches[i].identifier === joyId) {
                        updateJoy(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
                        break;
                    }
                }
            }, { passive: false });

            const endJoy = (e) => {
                if (!joyActive) return;
                for (let i = 0; i < e.changedTouches.length; i++) {
                    if (e.changedTouches[i].identifier === joyId) {
                        resetJoy();
                        break;
                    }
                }
            };

            joyZone.addEventListener('touchend', endJoy, { passive: false });
            joyZone.addEventListener('touchcancel', endJoy, { passive: false });
        }
        addTouch('mbtn-jump', 'jump');
        addTouch('mbtn-run', 'run');
        addTouch('mbtn-grab', 'grab');

        const btnPause = document.getElementById('mbtn-pause');
        if (btnPause) {
            btnPause.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.togglePause();
            }, { passive: false });
        }

        // Mouse Events for Editor
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        window.addEventListener('mouseup', (e) => {
            if (this.dragStart || this.rightDragStart) {
                this.handleMouseUp(e);
            }
        });
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.handleRightClick(e);
        });
    }

    initTilesetPalette() {
        const img = document.getElementById('tileset-image');
        if (!img) return;
        
        const changeBtn = document.getElementById('change-tileset-btn');
        if (changeBtn) {
            changeBtn.addEventListener('click', () => {
                let tName = prompt("Enter tileset image filename (inside Tileset folder):", this.currentTilesetName);
                if (tName) {
                    this.currentTilesetName = tName;
                    img.src = `Tileset/${tName}`;
                }
            });
        }

        let isDraggingPalette = false;
        let startX = 0;
        let startY = 0;

        const updateCursor = () => {
            const cursor = document.getElementById('tileset-cursor');
            if (cursor && img.naturalWidth > 0 && img.naturalHeight > 0) {
                cursor.style.left = (this.selectedTileX / img.naturalWidth * 100) + '%';
                cursor.style.top = (this.selectedTileY / img.naturalHeight * 100) + '%';
                cursor.style.width = (this.selectedTileW / img.naturalWidth * 100) + '%';
                cursor.style.height = (this.selectedTileH / img.naturalHeight * 100) + '%';
            }
        };

        img.onload = updateCursor;
        
        img.addEventListener('mousedown', (e) => {
            isDraggingPalette = true;
            const rect = img.getBoundingClientRect();
            if (rect.width === 0) return;
            const scaleX = img.naturalWidth / rect.width;
            const scaleY = img.naturalHeight / rect.height;
            const px = (e.clientX - rect.left) * scaleX;
            const py = (e.clientY - rect.top) * scaleY;
            
            startX = Math.floor((px + 0.1) / 32) * 32;
            startY = Math.floor((py + 0.1) / 32) * 32;
            
            this.selectedTileX = startX;
            this.selectedTileY = startY;
            this.selectedTileW = 32;
            this.selectedTileH = 32;
            
            updateCursor();
            e.preventDefault();
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDraggingPalette) return;
            const rect = img.getBoundingClientRect();
            const scaleX = img.naturalWidth / rect.width;
            const scaleY = img.naturalHeight / rect.height;
            let px = (e.clientX - rect.left) * scaleX;
            let py = (e.clientY - rect.top) * scaleY;
            
            px = Math.max(0, Math.min(img.naturalWidth - 1, px));
            py = Math.max(0, Math.min(img.naturalHeight - 1, py));
            
            const currentX = Math.floor((px + 0.1) / 32) * 32;
            const currentY = Math.floor((py + 0.1) / 32) * 32;
            
            this.selectedTileX = Math.min(startX, currentX);
            this.selectedTileY = Math.min(startY, currentY);
            this.selectedTileW = Math.abs(currentX - startX) + 32;
            this.selectedTileH = Math.abs(currentY - startY) + 32;
            
            updateCursor();
        });

        window.addEventListener('mouseup', () => {
            isDraggingPalette = false;
        });
    }

    setupEditorUI() {
        // Toolbar dragging logic
        const toolbar = document.getElementById('editor-toolbar');
        const title = toolbar.querySelector('.editor-topbar') || toolbar;
        let isDraggingToolbar = false;
        let toolbarOffsetX = 0;
        let toolbarOffsetY = 0;

        title.addEventListener('mousedown', (e) => {
            isDraggingToolbar = true;
            const rect = toolbar.getBoundingClientRect();
            toolbarOffsetX = e.clientX - rect.left;
            toolbarOffsetY = e.clientY - rect.top;
            e.preventDefault();
        });

        window.addEventListener('mousemove', (e) => {
            if (isDraggingToolbar) {
                toolbar.style.left = (e.clientX - toolbarOffsetX) + 'px';
                toolbar.style.top = (e.clientY - toolbarOffsetY) + 'px';
                toolbar.style.bottom = 'auto'; // Override previous CSS
                toolbar.style.transform = 'none'; // Override previous CSS
            }
        });

        window.addEventListener('mouseup', () => {
            isDraggingToolbar = false;
        });

        // Palette buttons
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.id === 'tile-wave-btn') return;
                if (btn.dataset.type) {
                    this.selectTool(btn.dataset.type);
                }
            });
        });

        // Quick Tile Wave Toggle button
        const tileWaveBtn = document.getElementById('tile-wave-btn');
        if (tileWaveBtn) {
            tileWaveBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.tileWave = !this.tileWave;
                this.updateTileWaveUI();
            });
        }

        // Export button
        const exportBtn = document.getElementById('export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportLevel());
        }

        // Reset Room button (Revert to file version)
        const resetRoomBtn = document.getElementById('reset-room-btn');
        if (resetRoomBtn) {
            resetRoomBtn.addEventListener('click', () => {
                if (confirm('현재 방의 변경사항을 취소하고 파일 원본으로 다시 불러올까요?')) {
                    if (this.currentRoom) {
                        try {
                            localStorage.removeItem('saved_room_' + this.currentRoom);
                        } catch(e) {}
                        delete this.rooms[this.currentRoom];
                        if (window.roomData) delete window.roomData[this.currentRoom];
                        this.loadRoom(this.currentRoom);
                    }
                }
            });
        }

        // Add Room button
        const addRoomBtn = document.getElementById('add-room-btn');
        if (addRoomBtn) {
            addRoomBtn.addEventListener('click', () => {
                let newRoomName = prompt("Enter new room name:");
                if (newRoomName && newRoomName.trim() !== '') {
                    newRoomName = newRoomName.trim();
                    if (!this.rooms[newRoomName]) {
                        this.rooms[newRoomName] = () => {
                            // Empty room gets a basic floor by default
                            this.entities.push(new Platform(0, 500, 1000, 50));
                        };
                    }
                    this.loadRoom(newRoomName);
                }
            });
        }

        // Load Room button
        const loadRoomBtn = document.getElementById('load-room-btn');
        const loadRoomInput = document.getElementById('load-room-input');
        if (loadRoomBtn && loadRoomInput) {
            loadRoomBtn.addEventListener('click', () => {
                loadRoomInput.click();
            });
            loadRoomInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const text = ev.target.result;
                    try {
                        // Extract room name using regex
                        const match = text.match(/window\.roomData\['([^']+)'\]/);
                        if (!match) {
                            alert("Could not parse room name from file. Make sure it's a valid room.js file.");
                            return;
                        }
                        const roomName = match[1];
                        
                        // Execute the room script to define it
                        const fn = new Function(text);
                        fn();
                        
                        // Register and load
                        if (window.roomData && window.roomData[roomName]) {
                            this.rooms[roomName] = window.roomData[roomName];
                            this.loadRoom(roomName);
                            // Clear input so we can load same file again if needed
                            loadRoomInput.value = '';
                        }
                    } catch(err) {
                        alert("Error loading room: " + err.message);
                    }
                };
                reader.readAsText(file);
            });
        }

        // Set Room Size button
        const setSizeBtn = document.getElementById('set-size-btn');
        if (setSizeBtn) {
            setSizeBtn.addEventListener('click', () => {
                let w = prompt("Enter Room Width (e.g., 2000) or 0 / Cancel for infinite:", this.roomWidth || "");
                if (w !== null) {
                    let h = prompt("Enter Room Height (e.g., 1000) or 0 / Cancel for infinite:", this.roomHeight || "");
                    if (h !== null) {
                        this.roomWidth = parseInt(w) || 0;
                        this.roomHeight = parseInt(h) || 0;
                        this.saveCurrentRoomToMemory();
                        this.showFlipToast(`ROOM SIZE: ${this.roomWidth || '∞'} x ${this.roomHeight || '∞'}`);
                    }
                }
            });
        }

        // Set Music button
        const setMusicBtn = document.getElementById('set-music-btn');
        if (setMusicBtn) {
            setMusicBtn.addEventListener('click', () => {
                let m = prompt("Enter music file name (e.g., mu_oldlevel.wav, mu_escape.wav), 'escape' for escape mode, 'none'/'stop' to stop music, or leave blank to continue current music:", this.hasExplicitMusic ? (this.roomMusic || "") : "");
                if (m !== null) {
                    const trimmed = m.trim();
                    if (trimmed === "" || trimmed.toLowerCase() === "inherit") {
                        this.roomMusic = (this.audio && this.audio.currentMusicName) ? this.audio.currentMusicName : null;
                        this.hasExplicitMusic = false;
                    } else if (trimmed.toLowerCase() === "none" || trimmed.toLowerCase() === "stop") {
                        this.roomMusic = null;
                        this.hasExplicitMusic = true;
                        this.escape = false;
                        if (this.audio) this.audio.playMusic(null);
                    } else if (trimmed.toLowerCase() === "escape" || trimmed.toLowerCase() === "escape=true" || trimmed.toLowerCase() === "breaking") {
                        this.escape = true;
                        this.roomMusic = 'mu_escape.wav';
                        this.hasExplicitMusic = true;
                        if (this.audio) this.audio.playMusic(this.roomMusic);
                    } else {
                        this.roomMusic = trimmed;
                        this.hasExplicitMusic = true;
                        if (this.audio) this.audio.playMusic(this.roomMusic);
                    }
                }
            });
        }

        // Set Background button & Modal
        const setBgBtn = document.getElementById('set-bg-btn');
        const bgOverlay = document.getElementById('bg-settings-overlay');
        const bgNameInput = document.getElementById('bg-name-input');
        const bgFollowCamChk = document.getElementById('bg-follow-cam-chk');
        const bgSecretChk = document.getElementById('bg-secret-chk');
        const bgWaveChk = document.getElementById('bg-wave-chk');
        const bgSpeedInput = document.getElementById('bg-speed-input');
        const bgWaveSpeedInput = document.getElementById('bg-wave-speed-input');
        const tileWaveChk = document.getElementById('tile-wave-chk');
        const tileWaveSpeedInput = document.getElementById('tile-wave-speed-input');
        const tileWaveAmpInput = document.getElementById('tile-wave-amp-input');
        const bgQuickBeaker = document.getElementById('bg-quick-beaker');
        const bgQuickTutorial = document.getElementById('bg-quick-tutorial');
        const bgQuickNone = document.getElementById('bg-quick-none');
        const bgApplyBtn = document.getElementById('bg-apply-btn');
        const bgCancelBtn = document.getElementById('bg-cancel-btn');

        if (setBgBtn) {
            setBgBtn.addEventListener('click', () => {
                if (bgOverlay) {
                    if (bgNameInput) bgNameInput.value = this.roomBackground || "bg_beaker";
                    if (bgFollowCamChk) bgFollowCamChk.checked = this.bgFollowCamera !== false;
                    if (bgSecretChk) bgSecretChk.checked = !!this.bgSecret;
                    if (bgWaveChk) bgWaveChk.checked = !!this.bgWave;
                    if (bgSpeedInput) bgSpeedInput.value = this.bgSpeed !== undefined ? this.bgSpeed : 1.0;
                    if (bgWaveSpeedInput) bgWaveSpeedInput.value = this.bgWaveSpeed !== undefined ? this.bgWaveSpeed : 1.0;
                    if (tileWaveChk) tileWaveChk.checked = !!this.tileWave;
                    if (tileWaveSpeedInput) tileWaveSpeedInput.value = this.tileWaveSpeed !== undefined ? this.tileWaveSpeed : 1.0;
                    if (tileWaveAmpInput) tileWaveAmpInput.value = this.tileWaveAmp !== undefined ? this.tileWaveAmp : 3.5;

                    bgOverlay.classList.remove('hidden');
                    bgOverlay.style.display = 'flex';
                }
            });
        }

        if (bgQuickBeaker && bgNameInput) {
            bgQuickBeaker.addEventListener('click', () => { bgNameInput.value = 'bg_beaker'; });
        }
        if (bgQuickTutorial && bgNameInput) {
            bgQuickTutorial.addEventListener('click', () => { bgNameInput.value = 'bg_tutorial'; });
        }
        if (bgQuickNone && bgNameInput) {
            bgQuickNone.addEventListener('click', () => { bgNameInput.value = 'none'; });
        }
        if (bgCancelBtn && bgOverlay) {
            bgCancelBtn.addEventListener('click', () => {
                bgOverlay.classList.add('hidden');
                bgOverlay.style.display = 'none';
            });
        }
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && bgOverlay && !bgOverlay.classList.contains('hidden') && bgOverlay.style.display !== 'none') {
                bgOverlay.classList.add('hidden');
                bgOverlay.style.display = 'none';
            }
        });
        if (bgApplyBtn && bgOverlay) {
            bgApplyBtn.addEventListener('click', () => {
                const rawName = bgNameInput ? bgNameInput.value.trim() : "";
                this.roomBackground = (rawName === "none" || rawName === "") ? null : rawName;
                this.bgFollowCamera = bgFollowCamChk ? bgFollowCamChk.checked : true;
                this.bgSecret = bgSecretChk ? bgSecretChk.checked : false;
                this.bgWave = bgWaveChk ? bgWaveChk.checked : false;
                const spd = bgSpeedInput ? parseFloat(bgSpeedInput.value) : 1.0;
                this.bgSpeed = (!isNaN(spd) && spd >= 0) ? spd : 1.0;
                const waveSpd = bgWaveSpeedInput ? parseFloat(bgWaveSpeedInput.value) : 1.0;
                this.bgWaveSpeed = (!isNaN(waveSpd) && waveSpd >= 0) ? waveSpd : 1.0;

                this.tileWave = tileWaveChk ? tileWaveChk.checked : false;
                const tileWaveSpd = tileWaveSpeedInput ? parseFloat(tileWaveSpeedInput.value) : 1.0;
                this.tileWaveSpeed = (!isNaN(tileWaveSpd) && tileWaveSpd >= 0) ? tileWaveSpd : 1.0;
                const tileWaveAmpVal = tileWaveAmpInput ? parseFloat(tileWaveAmpInput.value) : 3.5;
                this.tileWaveAmp = (!isNaN(tileWaveAmpVal) && tileWaveAmpVal >= 0) ? tileWaveAmpVal : 3.5;

                if (this.bgManager) {
                    this.bgManager.setBackground(this.roomBackground, this.bgFollowCamera, this.bgSpeed, this.bgSecret, this.bgWave, this.bgWaveAmp || 8, this.bgWaveSpeed);
                }
                this.updateTileWaveUI();
                bgOverlay.classList.add('hidden');
                bgOverlay.style.display = 'none';
            });
        }
        // Toggle Collisions button in topbar
        const toggleColBtn = document.getElementById('toggle-collision-btn');
        if (toggleColBtn) {
            toggleColBtn.addEventListener('click', () => {
                this.toggleCollisions();
            });
        }
    }

    toggleCollisions() {
        this.showCollisions = !this.showCollisions;
        this.collisionToggleTimer = 1.5;
        const colBtn = document.getElementById('toggle-collision-btn');
        if (colBtn) {
            if (this.showCollisions) {
                colBtn.style.color = '#00ffcc';
                colBtn.style.borderColor = '#00ffcc';
            } else {
                colBtn.style.color = '#888';
                colBtn.style.borderColor = 'rgba(255, 255, 255, 0.15)';
            }
        }
    }

    isCollisionEntity(e) {
        if (!e) return false;
        if (e instanceof Tile || e.type === 'tile') return false;
        const type = e.type;
        if (type === 'platform' || e instanceof Platform) return true;
        if (type === 'oneway' || e instanceof OneWayPlatform) return true;
        if (type === 'ladder' || e instanceof Ladder) return true;
        if (type === 'slope' || type === 'left-up' || type === 'right-up' || e instanceof Slope) return true;
        if (type === 'door' || e instanceof Door) return true;
        if ((type && type.startsWith('targetDoor')) || e instanceof TargetDoorBase) return true;
        return false;
    }

    updateTileWaveUI() {
        const tileWaveBtn = document.getElementById('tile-wave-btn');
        if (tileWaveBtn) {
            if (this.tileWave) {
                tileWaveBtn.innerText = 'WAVE: ON';
                tileWaveBtn.style.background = '#00ffcc';
                tileWaveBtn.style.color = '#000';
                tileWaveBtn.style.fontWeight = 'bold';
            } else {
                tileWaveBtn.innerText = 'WAVE: OFF';
                tileWaveBtn.style.background = '#444';
                tileWaveBtn.style.color = '#aaa';
                tileWaveBtn.style.fontWeight = 'normal';
            }
        }
        const tileWaveChk = document.getElementById('tile-wave-chk');
        if (tileWaveChk) {
            tileWaveChk.checked = !!this.tileWave;
        }
        const tileWaveSpeedInput = document.getElementById('tile-wave-speed-input');
        if (tileWaveSpeedInput) {
            tileWaveSpeedInput.value = this.tileWaveSpeed !== undefined ? this.tileWaveSpeed : 1.0;
        }
        const tileWaveAmpInput = document.getElementById('tile-wave-amp-input');
        if (tileWaveAmpInput) {
            tileWaveAmpInput.value = this.tileWaveAmp !== undefined ? this.tileWaveAmp : 3.5;
        }
    }

    toggleOnlineMenu() {
        if (this.gameState === 'PLAYING') {
            this.gameState = 'ONLINE_MENU';
            this.onlineMenuIndex = 0;
            if (this.audio) this.audio.playFile('sfx_pausestart', true);
            
            if (!this.myUsername) this.myUsername = "Guest" + Math.floor(1000 + Math.random() * 9000);
            
            if (this.peer && !this.peer.destroyed) {
                this.onlineMenuLevel = 'CONNECTED_MAIN';
                this.onlineMenuOptions = {
                    CONNECTED_MAIN: ['EXIT MENU', 'DISCONNECT', 'CHANGE USERNAME', this.myUsername]
                };
            } else {
                this.onlineMenuLevel = 'MAIN';
                this.onlineMenuOptions = {
                    MAIN: ['EXIT MENU', 'CREATE', 'JOIN'],
                    CREATE: ['BACK', 'CREATE SVR'],
                    JOIN: ['BACK', 'JOIN SVR']
                };
            }
        } else if (this.gameState === 'ONLINE_MENU') {
            this.gameState = 'PLAYING';
            if (this.audio) this.audio.playFile('sfx_step', true);
        }
    }

    isOnline() {
        if (!this.peer || this.peer.destroyed) return false;
        if (this.isHost) {
            return !!this.myOnlineId;
        } else {
            return !!(this.networkConns && this.networkConns.length > 0 && this.networkConns.some(c => c && c.open));
        }
    }

    sendChatMessage(text) {
        if (!this.isOnline()) return;
        if (!text || text.trim() === '') return;
        text = text.trim();
        const sender = this.myUsername || "You";
        this.addChatMessage(sender, text);
        
        if (this.networkConns && this.networkConns.length > 0 && this.myOnlineId) {
            for (let conn of this.networkConns) {
                if (conn.open) {
                    conn.send({ type: 'chat', id: this.myOnlineId, name: this.myUsername, msg: text });
                }
            }
        }
    }
    
    addChatMessage(sender, text) {
        this.chatMessages.push({ sender: sender, text: text, timer: 300 }); // 300 frames = ~5 seconds
        if (this.chatMessages.length > 5) {
            this.chatMessages.shift(); // Keep max 5 lines
        }
    }

    connectMultiplayer(isCreate = false) {
        if (this.peer) {
            this.peer.destroy();
        }
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        
        this.otherPlayers = {};
        this.networkConns = [];
        this.isHost = isCreate;
        
        console.log("Starting PeerJS connection...");
        
        try {
            if (isCreate) {
                // We are HOST
                const customId = prompt("Enter a custom ROOM CODE (e.g. apple123) or leave blank for a random code:");
                
                if (customId && customId.trim().length > 0) {
                    this.peer = new Peer(customId.trim());
                } else {
                    this.peer = new Peer();
                }
                
                this.peer.on('open', (id) => {
                    this.myOnlineId = id;
                    console.log("My Peer ID is: " + id);
                    
                    // Show prompt so user can easily copy it
                    prompt("Room created! Copy this ROOM CODE and give it to your friend:", id);
                    this.addChatMessage("SERVER", "Room created! Code: " + id);
                    this.addChatMessage("SERVER", "Press ENTER to chat!");
                    
                    let b = {
                        x: (this.camera ? this.camera.x : 0) + this.canvas.width / 2,
                        y: (this.camera ? this.camera.y : 0) + this.canvas.height / 2,
                        text: "ROOM CREATED!", vy: -1, alpha: 2.0
                    };
                    if (!this.floatingTexts) this.floatingTexts = [];
                    this.floatingTexts.push(b);
                });
                
                this.peer.on('connection', (conn) => {
                    this.networkConns.push(conn);
                    console.log("Client connected: " + conn.peer);
                    this.addChatMessage("SERVER", "Player " + conn.peer.substring(0, 4) + " joined.");
                    
                    conn.on('data', (data) => {
                        this.handleNetworkData(data, conn.peer);
                    });
                    
                    conn.on('close', () => {
                        delete this.otherPlayers[conn.peer];
                        this.networkConns = this.networkConns.filter(c => c !== conn);
                        this.addChatMessage("SERVER", "Player " + conn.peer.substring(0, 4) + " disconnected.");
                        
                        // Tell other clients that this player left
                        for (let otherConn of this.networkConns) {
                            if (otherConn.open) {
                                otherConn.send({ type: 'remove', id: conn.peer });
                            }
                        }
                    });
                });
                
            } else {
                // We are CLIENT, we need to ask for Room ID
                const targetId = prompt("Enter the ROOM CODE (Peer ID) of the host:");
                if (!targetId) return;
                
                this.peer = new Peer();
                this.peer.on('open', (id) => {
                    this.myOnlineId = id;
                    console.log("My Peer ID is: " + id + ", connecting to " + targetId);
                    
                    const conn = this.peer.connect(targetId);
                    
                    conn.on('open', () => {
                        console.log("Connected to HOST!");
                        this.networkConns.push(conn);
                        this.addChatMessage("SERVER", "Connected! Press ENTER to chat!");
                        let b = {
                            x: (this.camera ? this.camera.x : 0) + this.canvas.width / 2,
                            y: (this.camera ? this.camera.y : 0) + this.canvas.height / 2,
                            text: "CONNECTED!", vy: -2, alpha: 2.0
                        };
                        if (!this.floatingTexts) this.floatingTexts = [];
                        this.floatingTexts.push(b);
                    });
                    
                    conn.on('data', (data) => {
                        this.handleNetworkData(data, targetId);
                    });
                    
                    conn.on('close', () => {
                        console.log("Disconnected from HOST.");
                        this.addChatMessage("SERVER", "Disconnected from server.");
                        delete this.otherPlayers[targetId];
                        // If host closes, clear everyone since host was relay
                        this.otherPlayers = {};
                        this.networkConns = this.networkConns.filter(c => c !== conn);
                        if (this.chatInput) {
                            this.chatInput.value = '';
                            this.chatInput.style.display = 'none';
                            this.isTyping = false;
                        }
                    });
                });
            }
            
            this.peer.on('error', (err) => {
                console.error("PeerJS Error:", err);
                let b = {
                    x: (this.camera ? this.camera.x : 0) + this.canvas.width / 2,
                    y: (this.camera ? this.camera.y : 0) + this.canvas.height / 2,
                    text: "CONNECTION FAILED!", vy: -2, alpha: 2.0
                };
                if (!this.floatingTexts) this.floatingTexts = [];
                this.floatingTexts.push(b);
            });
            
        } catch(e) {
            console.error("Could not create PeerJS:", e);
        }
    }

    handleNetworkData(data, senderId) {
        try {
            if (data.type === 'update') {
                this.otherPlayers[senderId] = data.payload;
                
                // If we are host, relay this client's position to ALL OTHER clients!
                if (this.isHost) {
                    for (let conn of this.networkConns) {
                        if (conn.open && conn.peer !== senderId) {
                            conn.send({ type: 'relay_update', payload: data.payload, originalId: senderId });
                        }
                    }
                }
            } else if (data.type === 'relay_update') {
                // Client receiving data about ANOTHER client from the host
                this.otherPlayers[data.originalId] = data.payload;
            } else if (data.type === 'remove') {
                // Client receiving remove event about another client from the host
                this.addChatMessage("SERVER", "Player " + data.id.substring(0, 4) + " disconnected.");
                delete this.otherPlayers[data.id];
            } else if (data.type === 'chat') {
                const senderName = data.name || ("Player " + data.id.substring(0, 4));
                this.addChatMessage(senderName, data.msg);
                
                // If we are host, relay chat to others
                if (this.isHost) {
                    for (let conn of this.networkConns) {
                        if (conn.open && conn.peer !== senderId) {
                            conn.send({ type: 'chat', id: data.id, name: senderName, msg: data.msg });
                        }
                    }
                }
            }
        } catch(e) {}
    }

    togglePause() {
        if (this.gameState === 'PLAYING') {
            this.gameState = 'PAUSED';
            this.cameraShake = 0;
            if (this.player) this.player.requestScreenShake = 0;
            this.pauseMenuIndex = 0;
            this.pauseBubbles = [];
            for (let i = 0; i < 30; i++) {
                this.pauseBubbles.push({
                    x: this.canvas.width / 2 + Math.random() * this.canvas.width / 2,
                    y: Math.random() * this.canvas.height,
                    r: Math.random() * 50 + 20,
                    vx: (Math.random() - 0.5) * 2,
                    vy: (Math.random() - 0.5) * 2
                });
            }
            if (this.audio) {
                this.audio.pauseAll();
                this.audio.playFile('sfx_pausestart', true);
            }
            document.getElementById('pause-overlay').style.display = 'none'; // Ensure DOM overlay is hidden
            document.getElementById('pause-overlay').classList.add('hidden');
        } else if (this.gameState === 'PAUSED' || this.gameState === 'OPTIONS') {
            this.gameState = 'PLAYING';
            this.cameraShake = 0;
            if (this.player) this.player.requestScreenShake = 0;
            if (this.audio) {
                this.audio.resumeAll();
                this.audio.playFile('sfx_pausestart', true);
            }
            document.getElementById('pause-overlay').style.display = 'none';
            document.getElementById('pause-overlay').classList.add('hidden');
            document.getElementById('options-overlay').style.display = 'none';
            document.getElementById('options-overlay').classList.add('hidden');
        }
    }

    saveSettings() {
        try {
            localStorage.setItem('gameSettings', JSON.stringify({
                masterVolume: this.settings.masterVolume,
                musicVolume: this.settings.musicVolume,
                sfxVolume: this.settings.sfxVolume,
                shakeIntens: this.settings.shakeIntens,
                unfocusedMute: this.settings.unfocusedMute,
                vsync: this.settings.vsync,
                textureFiltering: this.settings.textureFiltering,
                hideHud: this.settings.hideHud,
                timer: this.settings.timer,
                dirSuperjump: this.settings.dirSuperjump,
                dirGroundpound: this.settings.dirGroundpound,
                windowMode: this.settings.windowMode,
                resolutionIndex: this.settings.resolutionIndex,
                bindings: this.settings.bindings,
                bindings_2: this.settings.bindings_2
            }));
        } catch(e) {
            console.warn('Failed to save settings to localStorage:', e);
        }
    }

    loadLangFile() {
        const lang = (this.settings && this.settings.language) || 'ko';
        try {
            localStorage.setItem('gameLanguage', lang);
        } catch(e) {}
        if (lang === 'ko' && window.langData_ko) {
            this.langData = window.langData_ko;
        } else if (window.langData) {
            this.langData = window.langData;
        } else {
            this.langData = {};
        }
    }

    drawCreditsText(ctx, textStr, x, y, center = true, scale = 1) {
        if (!textStr) return;
        const kerning = -16 * scale;
        let totalW = 0;
        let charImages = [];
        for (let i = 0; i < textStr.length; i++) {
            if (textStr[i] === ' ') {
                charImages.push('space');
                totalW += 30 * scale + kerning;
                continue;
            }
            const charIdx = this.creditsFontMap.indexOf(textStr[i]);
            if (charIdx !== -1 && this.creditsFontImages[charIdx]) {
                const img = this.creditsFontImages[charIdx];
                charImages.push(img);
                totalW += (img.width || 30) * scale + kerning; 
            } else {
                charImages.push(null);
                totalW += 30 * scale + kerning;
            }
        }
        
        let cx = center ? x - totalW / 2 : x;
        for (let i = 0; i < charImages.length; i++) {
            if (charImages[i] === 'space') {
                cx += 30 * scale + kerning;
                continue;
            }
            const img = charImages[i];
            if (img && img.complete && img.naturalWidth > 0) {
                if (scale !== 1) {
                    ctx.drawImage(img, cx, y, img.naturalWidth * scale, img.naturalHeight * scale);
                } else {
                    ctx.drawImage(img, cx, y);
                }
                cx += (img.width || 30) * scale + kerning;
            } else {
                cx += 30 * scale + kerning;
            }
        }
    }

    setupMenuUI() {
        const pauseOverlay = document.getElementById('pause-overlay');
        const optionsOverlay = document.getElementById('options-overlay');
        
        // Pause Menu Buttons
        document.getElementById('btn-resume').addEventListener('click', () => this.togglePause());
        document.getElementById('btn-options').addEventListener('click', () => {
            pauseOverlay.style.display = 'none';
            pauseOverlay.classList.add('hidden');
            optionsOverlay.style.display = 'flex';
            optionsOverlay.classList.remove('hidden');
            this.gameState = 'OPTIONS';
        });
        document.getElementById('btn-restart').addEventListener('click', () => {
            this.togglePause();
            this.loadRoom(this.currentRoom);
        });
        document.getElementById('btn-exit').addEventListener('click', () => {
            this.togglePause();
            this.gameState = 'TITLE';
            if (this.uiOverlay) this.uiOverlay.style.display = 'none';
        });

        // Options Menu Back
        document.getElementById('btn-options-back').addEventListener('click', () => {
            optionsOverlay.style.display = 'none';
            optionsOverlay.classList.add('hidden');
            pauseOverlay.style.display = 'flex';
            pauseOverlay.classList.remove('hidden');
            this.gameState = 'PAUSED';
        });

        // Edit Mobile Layout
        const btnEditLayout = document.getElementById('btn-edit-layout');
        if (btnEditLayout) {
            btnEditLayout.addEventListener('click', () => {
                document.getElementById('options-overlay').style.display = 'none';
                this.editLayoutReturnState = 'PAUSED';
                this.gameState = 'EDIT_LAYOUT';
                
                let doneBtn = document.getElementById('btn-finish-layout');
                if (!doneBtn) {
                    doneBtn = document.createElement('button');
                    doneBtn.id = 'btn-finish-layout';
                    doneBtn.innerText = 'DONE EDITING';
                    doneBtn.style.position = 'fixed';
                    doneBtn.style.top = '20px';
                    doneBtn.style.left = '50%';
                    doneBtn.style.transform = 'translateX(-50%)';
                    doneBtn.style.zIndex = '9999';
                    doneBtn.style.padding = '10px 20px';
                    doneBtn.style.fontSize = '1.2rem';
                    doneBtn.style.background = '#e74c3c';
                    doneBtn.style.color = 'white';
                    doneBtn.style.border = '2px solid white';
                    doneBtn.style.borderRadius = '10px';
                    document.body.appendChild(doneBtn);
                    
                    doneBtn.addEventListener('click', () => {
                        doneBtn.style.display = 'none';
                        this.gameState = this.editLayoutReturnState || 'PAUSED';
                        if (this.gameState === 'PAUSED') {
                            document.getElementById('options-overlay').style.display = 'flex';
                        }
                        this.enableLayoutEditMode(false);
                    });
                }
                doneBtn.style.display = 'block';
                this.enableLayoutEditMode(true);
            });
        }
        // Tabs
        const tabs = ['audio', 'video', 'game', 'control'];
        tabs.forEach(tab => {
            document.getElementById(`tab-${tab}`).addEventListener('click', (e) => {
                tabs.forEach(t => {
                    document.getElementById(`tab-${t}`).classList.remove('active');
                    document.getElementById(`panel-${t}`).classList.add('hidden');
                });
                e.target.classList.add('active');
                document.getElementById(`panel-${tab}`).classList.remove('hidden');
            });
        });

        // Game
        const langSelect = document.getElementById('language-select');
        langSelect.value = this.settings.language;
        langSelect.addEventListener('change', (e) => {
            this.settings.language = e.target.value;
            this.translateUI();
        });

        const cameraSlider = document.getElementById('camera-speed-slider');
        if (cameraSlider) {
            cameraSlider.value = this.settings.cameraSpeed;
            cameraSlider.addEventListener('input', (e) => {
                this.settings.cameraSpeed = parseInt(e.target.value) || 20;
            });
        }

        // Audio
        const updateAudio = () => {
            if (this.audio && this.audio.updateMusicVolume) {
                this.audio.updateMusicVolume();
            }
        };

        const masterSlider = document.getElementById('master-vol-slider');
        masterSlider.value = this.settings.masterVolume;
        masterSlider.addEventListener('input', (e) => {
            this.settings.masterVolume = e.target.value;
            updateAudio();
        });

        const musicSlider = document.getElementById('music-vol-slider');
        musicSlider.value = this.settings.musicVolume;
        musicSlider.addEventListener('input', (e) => {
            this.settings.musicVolume = e.target.value;
            updateAudio();
        });

        const sfxSlider = document.getElementById('sfx-vol-slider');
        sfxSlider.value = this.settings.sfxVolume;
        sfxSlider.addEventListener('input', (e) => {
            this.settings.sfxVolume = e.target.value;
            // SFX vol is checked on play, so no immediate update needed for most
        });

        const unfocusedMuteSelect = document.getElementById('unfocused-mute-select');
        unfocusedMuteSelect.value = this.settings.unfocusedMute ? "on" : "off";
        unfocusedMuteSelect.addEventListener('change', (e) => {
            this.settings.unfocusedMute = (e.target.value === "on");
            updateAudio();
        });

        // Video
        
        const vsyncSelect = document.getElementById('vsync-select');
        vsyncSelect.value = this.settings.vsync ? "on" : "off";
        vsyncSelect.addEventListener('change', (e) => {
            this.settings.vsync = (e.target.value === "on");
        });

        const textureSelect = document.getElementById('texture-select');
        textureSelect.value = this.settings.textureFiltering ? "on" : "off";
        textureSelect.addEventListener('change', (e) => {
            this.settings.textureFiltering = (e.target.value === "on");
        });

        const screenShakeSelect = document.getElementById('screenshake-select');
        screenShakeSelect.value = this.settings.screenShake ? "on" : "off";
        screenShakeSelect.addEventListener('change', (e) => {
            this.settings.screenShake = (e.target.value === "on");
            if (!this.settings.screenShake) {
                this.settings.shakeIntens = 0;
                this.cameraShake = 0;
            } else if (this.settings.shakeIntens === 0) {
                this.settings.shakeIntens = 100;
            }
            this.saveSettings();
        });

        document.getElementById('btn-fullscreen').addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                }
            }
        });

        // Control binds
        this.refreshControlList();
    }

    refreshControlList() {
        const list = document.getElementById('control-list');
        list.innerHTML = '';
        Object.keys(this.settings.bindings).forEach(action => {
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.justifyContent = 'space-between';
            row.style.alignItems = 'center';
            row.style.padding = '0.5rem';
            row.style.background = 'rgba(255,255,255,0.05)';
            row.style.borderRadius = '8px';
            
            const label = document.createElement('span');
            label.innerText = action.toUpperCase();
            label.style.fontWeight = '700';
            
            const btn = document.createElement('button');
            btn.className = 'tool-btn';
            btn.innerText = this.settings.bindings[action];
            btn.addEventListener('click', () => {
                this.bindingKeyFor = action;
                document.getElementById('bind-overlay').classList.remove('hidden');
            });

            row.appendChild(label);
            row.appendChild(btn);
            list.appendChild(row);
        });
    }

    toggleEditorMode() {
        this.isEditorMode = !this.isEditorMode;
        const toolbar = document.getElementById('editor-toolbar');
        const palette = document.getElementById('tileset-palette');
        if (this.isEditorMode) {
            toolbar.classList.remove('hidden');
            this.player.isNoClip = true; // Auto-noclip for building
            if (palette && this.isTileType(this.selectedType)) palette.classList.remove('hidden');
        } else {
            toolbar.classList.add('hidden');
            this.player.isNoClip = false;
            if (palette) palette.classList.add('hidden');
        }
    }

    isTileType(type) {
        return type === 'tile' || type === 'tile1' || type === 'tile2' || type === 'tile3';
    }

    getTileLayerFromType(type) {
        if (type === 'tile2') return 2;
        if (type === 'tile3') return 3;
        return 1;
    }

    selectTool(type) {
        if (!type) return;
        this.selectedType = type;
        document.querySelectorAll('.tool-btn').forEach(btn => {
            if (btn.id === 'tile-wave-btn') return;
            if (btn.dataset.type === type) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        const palette = document.getElementById('tileset-palette');
        if (palette) {
            if (this.isTileType(type)) {
                palette.classList.remove('hidden');
                const titleElem = palette.querySelector('h4');
                if (titleElem) {
                    const layerName = type === 'tile2' ? 'Layer 2 (Front/앞)' : (type === 'tile3' ? 'Layer 3 (Back/뒤)' : 'Layer 1 (Main)');
                    titleElem.innerText = `Tileset - ${layerName}`;
                }
            } else {
                palette.classList.add('hidden');
            }
        }
    }

    flipSelectedTool(isVertical = false) {
        if (!isVertical) {
            if (this.selectedType === 'slope-left') {
                this.selectTool('slope-right');
                return;
            } else if (this.selectedType === 'slope-right') {
                this.selectTool('slope-left');
                return;
            }
        }

        // Check if mouse is hovering over an existing placed tile
        const snapX = this.snapToGrid(this.mousePos.x);
        const snapY = this.snapToGrid(this.mousePos.y);
        const targetLayer = this.getTileLayerFromType(this.selectedType);
        let hoveredTile = null;
        for (let i = this.entities.length - 1; i >= 0; i--) {
            const ent = this.entities[i];
            if (ent instanceof Tile && ent.x === snapX && ent.y === snapY) {
                if ((ent.layer || 1) === targetLayer) {
                    hoveredTile = ent;
                    break;
                } else if (!hoveredTile) {
                    hoveredTile = ent;
                }
            }
        }

        if (isVertical) {
            if (hoveredTile) {
                hoveredTile.flipY = !hoveredTile.flipY;
                this.tileFlipY = hoveredTile.flipY;
                this.saveCurrentRoomToMemory();
                this.showFlipToast(hoveredTile.flipY ? 'TILE VERT-FLIP: ON [Y]' : 'TILE VERT-FLIP: OFF [Y]');
            } else {
                this.tileFlipY = !this.tileFlipY;
                this.showFlipToast(this.tileFlipY ? 'TILE VERT-FLIP: ON [Y]' : 'TILE VERT-FLIP: OFF [Y]');
            }
        } else {
            if (hoveredTile) {
                hoveredTile.flipX = !hoveredTile.flipX;
                this.tileFlipX = hoveredTile.flipX;
                this.saveCurrentRoomToMemory();
                this.showFlipToast(hoveredTile.flipX ? 'TILE FLIP: ON [X]' : 'TILE FLIP: OFF [X]');
            } else {
                this.tileFlipX = !this.tileFlipX;
                this.showFlipToast(this.tileFlipX ? 'TILE FLIP: ON [X]' : 'TILE FLIP: OFF [X]');
            }
        }
    }

    showFlipToast(msg) {
        this.flipToastMsg = msg;
        this.flipToastTimer = 1.2;
    }

    getMouseInWorld(e) {
        const rect = this.canvas.getBoundingClientRect();
        
        // CSS display size
        const cssWidth = rect.width;
        const cssHeight = rect.height;
        
        // Map CSS pixel to logical internal resolution
        const scaleX = this.canvas.width / cssWidth;
        const scaleY = this.canvas.height / cssHeight;
        
        const canvasX = (e.clientX - rect.left) * scaleX;
        const canvasY = (e.clientY - rect.top) * scaleY;
        
        return {
            x: canvasX + this.camera.x,
            y: canvasY + this.camera.y
        };
    }

    snapToGrid(pos) {
        return Math.floor(pos / this.gridSize) * this.gridSize;
    }


    paintTile(wx, wy) {
        const startX = this.snapToGrid(wx);
        const startY = this.snapToGrid(wy);
        const totalW = this.selectedTileW || 32;
        const totalH = this.selectedTileH || 32;
        const tileSize = 32;
        const targetLayer = this.getTileLayerFromType(this.selectedType);
        
        let changed = false;
        for (let ox = 0; ox < totalW; ox += tileSize) {
            for (let oy = 0; oy < totalH; oy += tileSize) {
                const cellX = startX + ox;
                const cellY = startY + oy;
                const srcOx = this.tileFlipX ? (totalW - tileSize - ox) : ox;
                const srcOy = this.tileFlipY ? (totalH - tileSize - oy) : oy;
                const srcX = (this.selectedTileX || 0) + srcOx;
                const srcY = (this.selectedTileY || 0) + srcOy;

                let existing = null;
                for (let i = this.entities.length - 1; i >= 0; i--) {
                    let ent = this.entities[i];
                    if (ent instanceof Tile && (ent.layer || 1) === targetLayer) {
                        if (ent.x === cellX && ent.y === cellY && ent.width === tileSize && ent.height === tileSize) {
                            existing = ent;
                            break;
                        } else if (cellX >= ent.x && cellX < ent.x + ent.width && cellY >= ent.y && cellY < ent.y + ent.height) {
                            this.entities.splice(i, 1);
                            changed = true;
                        }
                    }
                }

                const flipX = !!this.tileFlipX;
                const flipY = !!this.tileFlipY;

                if (existing) {
                    if (existing.tx !== srcX || existing.ty !== srcY || existing.tileImageName !== this.currentTilesetName || existing.flipX !== flipX || existing.flipY !== flipY) {
                        existing.tx = srcX;
                        existing.ty = srcY;
                        existing.sw = tileSize;
                        existing.sh = tileSize;
                        existing.tileImageName = this.currentTilesetName;
                        existing.flipX = flipX;
                        existing.flipY = flipY;
                        changed = true;
                    }
                } else {
                    const newTile = (targetLayer === 2)
                        ? new Tile2(cellX, cellY, tileSize, tileSize, srcX, srcY, this.currentTilesetName, tileSize, tileSize, flipX, flipY)
                        : ((targetLayer === 3)
                            ? new Tile3(cellX, cellY, tileSize, tileSize, srcX, srcY, this.currentTilesetName, tileSize, tileSize, flipX, flipY)
                            : new Tile(cellX, cellY, tileSize, tileSize, srcX, srcY, this.currentTilesetName, tileSize, tileSize, flipX, flipY));
                    this.entities.push(newTile);
                    changed = true;
                }
            }
        }
        if (changed) {
            this.saveCurrentRoomToMemory();
        }
    }

    executeRightDragDelete(worldPos) {
        if (!this.rightDragStart) return false;
        const endX = this.snapToGrid(worldPos.x);
        const endY = this.snapToGrid(worldPos.y);
        const minX = Math.min(this.rightDragStart.x, endX);
        const minY = Math.min(this.rightDragStart.y, endY);
        const maxX = Math.max(this.rightDragStart.x, endX) + this.gridSize;
        const maxY = Math.max(this.rightDragStart.y, endY) + this.gridSize;

        const isTile = this.isTileType(this.selectedType);
        const targetLayer = isTile ? this.getTileLayerFromType(this.selectedType) : null;

        for (let i = this.entities.length - 1; i >= 0; i--) {
            const ent = this.entities[i];
            if (isTile) {
                if (!(ent instanceof Tile || ent.type === 'tile')) continue;
                if ((ent.layer || 1) !== targetLayer) continue;
            } else if (this.selectedType === 'erase') {
                if (!(ent instanceof Tile || ent.type === 'tile')) continue;
            }
            if (ent.x < maxX && ent.x + ent.width > minX &&
                ent.y < maxY && ent.y + ent.height > minY) {
                this.entities.splice(i, 1);
            }
        }
        this.rightDragStart = null;
        this.justExecutedRightDrag = true;
        this.saveCurrentRoomToMemory();
        return true;
    }

    handleMouseDown(e) {
        if (!this.isEditorMode) return;
        if (e.target.closest('#tileset-palette') || e.target.closest('#editor-toolbar')) return;

        const worldPos = this.getMouseInWorld(e);
        this.justExecutedRightDrag = false;

        // Right-Click (e.button === 2): Start drag area delete
        if (e.button === 2) {
            this.rightDragStart = {
                x: this.snapToGrid(worldPos.x),
                y: this.snapToGrid(worldPos.y)
            };
            return;
        }

        if (e.button !== 0) return;
        
        if (this.isTileType(this.selectedType)) {
            if (e.shiftKey) {
                this.dragStart = {
                    x: this.snapToGrid(worldPos.x),
                    y: this.snapToGrid(worldPos.y)
                };
                return;
            }
            this.isPaintingTile = true;
            this.paintTile(worldPos.x, worldPos.y);
            return;
        }

        if (this.selectedType === 'erase') {
            this.dragStart = {
                x: this.snapToGrid(worldPos.x),
                y: this.snapToGrid(worldPos.y)
            };
            return;
        }

        this.dragStart = {
            x: this.snapToGrid(worldPos.x),
            y: this.snapToGrid(worldPos.y)
        };
    }

    handleMouseMove(e) {
        const worldPos = this.getMouseInWorld(e);
        this.mousePos = worldPos;
        
        if (this.isEditorMode && this.isPaintingTile && e.buttons === 1) {
            this.paintTile(worldPos.x, worldPos.y);
        }
    }

    handleMouseUp(e) {
        if (e.button === 2) {
            if (this.rightDragStart) {
                const worldPos = this.getMouseInWorld(e);
                this.executeRightDragDelete(worldPos);
            }
            return;
        }

        if (this.isPaintingTile) {
            this.isPaintingTile = false;
            return;
        }
        if (!this.isEditorMode || !this.dragStart || e.button !== 0) return;
        
        const worldPos = this.getMouseInWorld(e);
        const endX = this.snapToGrid(worldPos.x);
        const endY = this.snapToGrid(worldPos.y);

        const minX = Math.min(this.dragStart.x, endX);
        const minY = Math.min(this.dragStart.y, endY);
        const maxX = Math.max(this.dragStart.x, endX) + this.gridSize;
        const maxY = Math.max(this.dragStart.y, endY) + this.gridSize;

        if (this.selectedType === 'erase') {
            for (let i = this.entities.length - 1; i >= 0; i--) {
                const ent = this.entities[i];
                if (!(ent instanceof Tile || ent.type === 'tile')) {
                    continue;
                }
                if (ent.x < maxX && ent.x + ent.width > minX &&
                    ent.y < maxY && ent.y + ent.height > minY) {
                    this.entities.splice(i, 1);
                }
            }
            this.dragStart = null;
            return;
        }

        const x = minX;
        const y = minY;
        let w = Math.abs(this.dragStart.x - endX);
        let h = Math.abs(this.dragStart.y - endY);

        // Minimum / default size
        if (w === 0 && h === 0) {
            if (this.selectedType === 'destroyable-small') {
                w = 32;
                h = 32;
            } else if (this.selectedType === 'pillar') {
                w = 128;
                h = 224;
            } else if (this.selectedType === 'destroyable' || this.selectedType === 'metal') {
                w = 64;
                h = 64;
            } else {
                w = this.gridSize;
                h = this.gridSize;
            }
        } else {
            if (w < this.gridSize) w = this.gridSize;
            if (h < this.gridSize) h = this.gridSize;
        }

        // Create entity
        let entity;
        switch(this.selectedType) {
            case 'platform': entity = new Platform(x, y, w, h); break;
            case 'oneway': entity = new OneWayPlatform(x, y, w, h); break;
            case 'ladder': entity = new Ladder(x, y, w, h); break;
            case 'slope-left': entity = new Slope(x, y, w, h, 'left-up'); break;
            case 'slope-right': entity = new Slope(x, y, w, h, 'right-up'); break;
            case 'destroyable-small': entity = new Destroyable(x, y, w, h); break;
            case 'destroyable': entity = new Destroyable(x, y, w, h); break;
            case 'metal': entity = new Metal(x, y, w, h); break;
            case 'pillar': entity = new Pillar(x, y, w, h); break;
            case 'tile':
            case 'tile1':
            case 'tile2':
            case 'tile3': {
                const targetLayer = this.getTileLayerFromType(this.selectedType);
                const tileSize = 32;
                const patW = this.selectedTileW || 32;
                const patH = this.selectedTileH || 32;
                let changed = false;
                for (let cx = x; cx < x + w; cx += tileSize) {
                    for (let cy = y; cy < y + h; cy += tileSize) {
                        const relX = (cx - x) % patW;
                        const relY = (cy - y) % patH;
                        const srcOx = this.tileFlipX ? (patW - tileSize - relX) : relX;
                        const srcOy = this.tileFlipY ? (patH - tileSize - relY) : relY;
                        const srcX = (this.selectedTileX || 0) + srcOx;
                        const srcY = (this.selectedTileY || 0) + srcOy;
                        
                        // Replace existing tile at this cell on the SAME layer
                        for (let i = this.entities.length - 1; i >= 0; i--) {
                            const ent = this.entities[i];
                            if (ent instanceof Tile && (ent.layer || 1) === targetLayer && cx >= ent.x && cx < ent.x + ent.width && cy >= ent.y && cy < ent.y + ent.height) {
                                this.entities.splice(i, 1);
                            }
                        }
                        const newTile = (targetLayer === 2)
                            ? new Tile2(cx, cy, tileSize, tileSize, srcX, srcY, this.currentTilesetName, tileSize, tileSize, !!this.tileFlipX, !!this.tileFlipY)
                            : ((targetLayer === 3)
                                ? new Tile3(cx, cy, tileSize, tileSize, srcX, srcY, this.currentTilesetName, tileSize, tileSize, !!this.tileFlipX, !!this.tileFlipY)
                                : new Tile(cx, cy, tileSize, tileSize, srcX, srcY, this.currentTilesetName, tileSize, tileSize, !!this.tileFlipX, !!this.tileFlipY));
                        this.entities.push(newTile);
                        changed = true;
                    }
                }
                if (changed) {
                    this.saveCurrentRoomToMemory();
                }
                break;
            }
            case 'hallway': 
                let tRoom = prompt("Target Room (e.g., A, B, C) (Cancel for none):", "A");
                let tDoor = prompt("Target Door (A, B, C, D, E) (Cancel for none):", "A");
                entity = new Hallway(x, y, w, h, tRoom, tDoor); 
                break;
            case 'door': 
                let dRoom = prompt("Target Room (e.g., A, B, C) (Cancel for none):", "A");
                if (dRoom === null) break;
                let dDoor = prompt("Target Door (A, B, C, D, E) (Cancel for none):", "A");
                if (dDoor === null) break;
                entity = new Door(x, y, w, h, dDoor, dRoom); 
                break;
            case 'targetDoor': 
                let doorId = prompt("Target Door ID (A, B, C, D, E):", "A");
                if (doorId === 'A') entity = new TargetDoor_A(x, y, w, h);
                else if (doorId === 'B') entity = new TargetDoor_B(x, y, w, h);
                else if (doorId === 'C') entity = new TargetDoor_C(x, y, w, h);
                else if (doorId === 'D') entity = new TargetDoor_D(x, y, w, h);
                else if (doorId === 'E') entity = new TargetDoor_E(x, y, w, h);
                break;
            case 'tutorialbook':
                let tutText = prompt("Enter tutorial text (use \\n for newlines, [J] for jump, etc):", "Tutorial Message");
                if (tutText !== null) {
                    entity = new TutorialBook(x, y, w, h, tutText);
                }
                break;
            case 'obj_palettedresser':
                entity = new PaletteDresser(x, y, w, h);
                break;
            case 'obj_computer':
                entity = new OnlineComputer(x, y, w, h);
                break;
            case 'obj_collect':
                entity = new Collect(x, y, w, h);
                break;
            case 'obj_bigcollect':
                entity = new BigCollect(x, y, w, h);
                break;
            case 'obj_slime':
                entity = new Slime(x, y, w, h);
                break;
            case 'obj_baddiespawner':
                entity = new BaddieSpawner(x, y, w, h);
                break;
        }

        if (entity) {
            this.entities.push(entity);
        }

        this.dragStart = null;
    }

    handleRightClick(e) {
        if (!this.isEditorMode) return;
        const worldPos = this.getMouseInWorld(e);
        
        if (this.justExecutedRightDrag) {
            this.justExecutedRightDrag = false;
            return;
        }

        if (this.rightDragStart) {
            this.executeRightDragDelete(worldPos);
            return;
        }
        
        // Find and remove entity at this position
        const snapX = this.snapToGrid(worldPos.x);
        const snapY = this.snapToGrid(worldPos.y);
        const maxX = snapX + this.gridSize;
        const maxY = snapY + this.gridSize;
        const isTile = this.isTileType(this.selectedType);
        const targetLayer = isTile ? this.getTileLayerFromType(this.selectedType) : null;
        for (let i = this.entities.length - 1; i >= 0; i--) {
            const ent = this.entities[i];
            if (isTile) {
                if (!(ent instanceof Tile || ent.type === 'tile')) continue;
                if ((ent.layer || 1) !== targetLayer) continue;
            } else if (this.selectedType === 'erase') {
                if (!(ent instanceof Tile || ent.type === 'tile')) continue;
            }
            if (ent.x < maxX && ent.x + ent.width > snapX &&
                ent.y < maxY && ent.y + ent.height > snapY) {
                this.entities.splice(i, 1);
                this.saveCurrentRoomToMemory();
                break;
            }
        }
    }

    getLevelCode() {
        let code = ``;
        if (this.roomWidth || this.roomHeight) {
            code += `this.roomWidth = ${this.roomWidth || 0};\n`;
            code += `this.roomHeight = ${this.roomHeight || 0};\n`;
        }
        if (this.escape) {
            code += `this.escape = true;\n`;
        }
        if (this.hasExplicitMusic && this.roomMusic) {
            code += `this.roomMusic = '${this.roomMusic}';\n`;
        }
        if (this.roomBackground) {
            code += `this.roomBackground = '${this.roomBackground}';\n`;
            code += `this.bgFollowCamera = ${this.bgFollowCamera !== false};\n`;
            if (this.bgSpeed !== undefined && this.bgSpeed !== 1.0) {
                code += `this.bgSpeed = ${this.bgSpeed};\n`;
            }
            if (this.bgSecret) {
                code += `this.bgSecret = true;\n`;
            }
            if (this.bgWave) {
                code += `this.bgWave = true;\n`;
                if (this.bgWaveSpeed !== undefined && this.bgWaveSpeed !== 1.0) {
                    code += `this.bgWaveSpeed = ${this.bgWaveSpeed};\n`;
                }
                if (this.bgWaveAmp !== undefined && this.bgWaveAmp !== 8) {
                    code += `this.bgWaveAmp = ${this.bgWaveAmp};\n`;
                }
            }
        }
        if (this.tileWave) {
            code += `this.tileWave = true;\n`;
            if (this.tileWaveSpeed !== undefined && this.tileWaveSpeed !== 1.0) {
                code += `this.tileWaveSpeed = ${this.tileWaveSpeed};\n`;
            }
            if (this.tileWaveAmp !== undefined && this.tileWaveAmp !== 3.5) {
                code += `this.tileWaveAmp = ${this.tileWaveAmp};\n`;
            }
        }
        code += `this.entities.push(\n`;
        this.entities.forEach(ent => {
            let line = `    `;
            if (ent instanceof OneWayPlatform) line += `new OneWayPlatform(${ent.x}, ${ent.y}, ${ent.width}, ${ent.height}, '${ent.color}')`;
            else if (ent instanceof Ladder) line += `new Ladder(${ent.x}, ${ent.y}, ${ent.width}, ${ent.height}, '${ent.color}')`;
            else if (ent instanceof Tile) {
                const className = (ent.layer === 2 || ent instanceof Tile2) ? 'Tile2' : ((ent.layer === 3 || ent instanceof Tile3) ? 'Tile3' : 'Tile');
                if (ent.flipX || ent.flipY) {
                    line += `new ${className}(${ent.x}, ${ent.y}, ${ent.width}, ${ent.height}, ${ent.tx}, ${ent.ty}, '${ent.tileImageName}', ${ent.sw || 32}, ${ent.sh || 32}, ${!!ent.flipX}, ${!!ent.flipY})`;
                } else {
                    line += `new ${className}(${ent.x}, ${ent.y}, ${ent.width}, ${ent.height}, ${ent.tx}, ${ent.ty}, '${ent.tileImageName}', ${ent.sw || 32}, ${ent.sh || 32})`;
                }
            }
            else if (ent instanceof Platform) line += `new Platform(${ent.x}, ${ent.y}, ${ent.width}, ${ent.height}, '${ent.color}')`;
            else if (ent instanceof Slope) line += `new Slope(${ent.x}, ${ent.y}, ${ent.width}, ${ent.height}, '${ent.type}')`;
            else if (ent instanceof Pillar) line += `new Pillar(${ent.x}, ${ent.y}, ${ent.width}, ${ent.height})`;
            else if (ent instanceof Metal) line += `new Metal(${ent.x}, ${ent.y}, ${ent.width}, ${ent.height})`;
            else if (ent instanceof Destroyable) line += `new Destroyable(${ent.x}, ${ent.y}, ${ent.width}, ${ent.height})`;
            else if (ent instanceof Hallway) line += `new Hallway(${ent.x}, ${ent.y}, ${ent.width}, ${ent.height}, ${ent.targetRoom ? `'${ent.targetRoom}'` : 'null'}, ${ent.targetDoor ? `'${ent.targetDoor}'` : 'null'})`;
            else if (ent instanceof Door) line += `new Door(${ent.x}, ${ent.y}, ${ent.width}, ${ent.height}, '${ent.label}', '${ent.targetRoom}')`;
            else if (ent instanceof TargetDoorBase) line += `new TargetDoor_${ent.doorId}(${ent.x}, ${ent.y}, ${ent.width}, ${ent.height})`;
            else if (ent instanceof TutorialBook) line += `new TutorialBook(${ent.x}, ${ent.y}, ${ent.width}, ${ent.height}, ${JSON.stringify(ent.text)})`;
            else if (ent instanceof PaletteDresser) line += `new PaletteDresser(${ent.x}, ${ent.y}, ${ent.width}, ${ent.height})`;
            else if (ent instanceof OnlineComputer) line += `new OnlineComputer(${ent.x}, ${ent.y}, ${ent.width}, ${ent.height})`;
            else if (ent instanceof Slime) line += `new Slime(${ent.x}, ${ent.y}, ${ent.width}, ${ent.height})`;
            else if (ent instanceof BaddieSpawner) line += `new BaddieSpawner(${ent.x}, ${ent.y}, ${ent.width}, ${ent.height})`;
            else if (ent instanceof BigCollect) line += `new BigCollect(${ent.x}, ${ent.y}, ${ent.width}, ${ent.height})`;
            else if (ent instanceof Collect) line += `new Collect(${ent.x}, ${ent.y}, ${ent.width}, ${ent.height})`;
            code += line + `,\n`;
        });
        code += `);\n`;
        return code;
    }

    saveRoomToLocalStorage(roomName) {
        if (!roomName) return;
        try {
            const code = this.getLevelCode();
            const finalCode = `window.roomData = window.roomData || {};\nwindow.roomData['${roomName}'] = function() {\n${code}\n};`;
            localStorage.setItem('saved_room_' + roomName, finalCode);
            new Function(finalCode)();
            if (window.roomData && window.roomData[roomName]) {
                this.rooms[roomName] = window.roomData[roomName];
            }
            this.showSaveIcon();
        } catch(e) {
            console.warn('Failed to save room to localStorage:', e);
        }
    }

    saveCurrentRoomToMemory() {
        if (!this.currentRoom) return;
        this.saveRoomToLocalStorage(this.currentRoom);
    }

    exportLevel() {
        const code = this.getLevelCode();
        let defaultName = this.currentRoom || "tutorial_1";
        let roomName = prompt("방 이름을 입력하세요 (예: tutorial_1):", defaultName);
        if (!roomName) return;
        
        let finalCode = `window.roomData = window.roomData || {};\nwindow.roomData['${roomName}'] = function() {\n${code}\n};`;
        
        const blob = new Blob([finalCode], {type: 'text/javascript'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${roomName}.js`;
        a.click();
        URL.revokeObjectURL(url);
        
        alert(`다운로드된 ${roomName}.js 파일을 프로젝트의 'room' 폴더에 덮어써주시면 영구 보존됩니다.`);
    }

    initRooms() {
        this.rooms = {
            'titlescreen': () => {
                // Initial room
                this.entities.push(new Platform(0, 500, 1000, 50));
                this.entities.push(new Door(400, 420, 50, 80, 'START', 'tutorial_1'));
            },
            'tutorial_1': () => {
this.roomWidth = 2000;
this.roomHeight = 1000;
this.roomMusic = 'mu_tutorial_chill.wav';
this.roomBackground = 'bg_beaker';
this.bgFollowCamera = true;
this.entities.push(
    new TargetDoor_A(480, 576, 32, 32),
    new Platform(192, 224, 96, 384, '#00aa9e66'),
    new TutorialBook(896, 576, 32, 32, "Press [J] to Jump!"),
    new Platform(672, 288, 128, 64, '#00aa9e66'),
    new Platform(288, 224, 512, 64, '#00aa9e66'),
    new TutorialBook(1216, 512, 32, 32, "Press [D] and [L][R] to crawl!"),
    new Platform(1056, 544, 352, 64, '#00aa9e66'),
    new Platform(192, 608, 1216, 96, '#00aa9e66'),
    new Platform(1312, 224, 96, 288, '#00aa9e66'),
    new Platform(672, 96, 736, 128, '#00aa9e66'),
    new Platform(1312, 704, 448, 64, '#00aa9e66'),
    new Platform(1760, 448, 64, 320, '#00aa9e66'),
    new Platform(1408, 384, 416, 64, '#00aa9e66'),
    new TargetDoor_B(1632, 672, 32, 32),
    new Door(1632, 640, 32, 64, 'B', 'tutorial_2'),
);
            },
            'A': () => {
                // Room A: Central Hub
                this.entities.push(new Platform(0, 500, 1000, 50)); // Floor
                this.entities.push(new Hallway(0, 300, 1000, 200));
                
                this.entities.push(new Door(200, 420, 40, 80, 'A', 'B')); // To Room B
                this.entities.push(new Door(500, 420, 50, 80, 'B', 'C')); // To Room C
                this.entities.push(new Door(800, 420, 50, 80, 'C', 'A')); // Self loop test
                
                this.entities.push(new Platform(300, 400, 100, 20)); // Little ledge
            },
            'B': () => {
                // Room B: Challenge (Climbing & Precision)
                this.entities.push(new Platform(0, 500, 2000, 50));
                this.entities.push(new Platform(400, 100, 50, 400)); // Tall wall for climbing
                this.entities.push(new Platform(400, 100, 400, 20)); // Ledge
                
                this.entities.push(new Door(100, 420, 50, 80, 'BACK', 'A')); // Back to Hub
                
                // Platforms leading upward
                this.entities.push(new Platform(600, 300, 150, 20));
                this.entities.push(new Platform(800, 200, 150, 20));
                
                // Destroyables
                for(let i = 0; i < 3; i++) {
                    this.entities.push(new Destroyable(1000 + i * 100, 450, 40, 40));
                }
            },
            'C': () => {
                // Room C: Speed (Long corridor with slopes)
                this.entities.push(new Platform(0, 500, 5000, 50));
                this.entities.push(new Door(100, 420, 50, 80, 'HUB', 'A'));
                
                // Speed corridor
                this.entities.push(new Hallway(200, 300, 4000, 200));
                this.entities.push(new Platform(200, 300, 4000, 20)); // Ceiling
                
                // Slopes for fun
                this.entities.push(new Slope(1000, 400, 300, 100, 'left-up'));
                this.entities.push(new Platform(1300, 400, 1000, 100));
                this.entities.push(new Slope(2300, 400, 300, 100, 'right-up'));
                
                // End of track door
                this.entities.push(new Door(4500, 420, 50, 80, 'FINISH', 'A'));
            }
        };
    }

    showSaveIcon() {
        const icon = document.getElementById('save-icon');
        if (icon) {
            icon.style.display = 'block';
            if (this.saveIconTimeout) clearTimeout(this.saveIconTimeout);
            this.saveIconTimeout = setTimeout(() => {
                icon.style.display = 'none';
            }, 2000); // Hide after 2 seconds
        }
    }

    async loadRoom(roomName, targetDoorId = 'A', preserveVelocity = false) {
        if (!targetDoorId) targetDoorId = 'A'; // Override null to 'A'
        this.lastTargetDoorId = targetDoorId;
        
        // Save current room state to memory before switching
        if (this.currentRoom && this.rooms[this.currentRoom] && this.entities.length > 0) {
            const currentEntities = [...this.entities];
            const currentW = this.roomWidth;
            const currentH = this.roomHeight;
            const currentMusic = this.roomMusic;
            const currentHasExplicitMusic = this.hasExplicitMusic;
            const currentEscape = this.escape;
            const currentBg = this.roomBackground;
            const currentBgFollow = this.bgFollowCamera;
            const currentBgSpeed = this.bgSpeed;
            const currentBgSecret = this.bgSecret;
            const currentBgWave = this.bgWave;
            const currentBgWaveAmp = this.bgWaveAmp;
            const currentBgWaveSpeed = this.bgWaveSpeed;
            const currentTileWave = this.tileWave;
            const currentTileWaveAmp = this.tileWaveAmp;
            const currentTileWaveSpeed = this.tileWaveSpeed;
            this.rooms[this.currentRoom] = () => {
                this.roomWidth = currentW;
                this.roomHeight = currentH;
                if (currentEscape) {
                    this.escape = true;
                }
                if (currentHasExplicitMusic) {
                    this.roomMusic = currentMusic;
                }
                this.roomBackground = currentBg;
                this.bgFollowCamera = currentBgFollow;
                this.bgSpeed = currentBgSpeed;
                this.bgSecret = currentBgSecret;
                this.bgWave = currentBgWave;
                this.bgWaveAmp = currentBgWaveAmp;
                this.bgWaveSpeed = currentBgWaveSpeed;
                this.tileWave = currentTileWave;
                this.tileWaveAmp = currentTileWaveAmp;
                this.tileWaveSpeed = currentTileWaveSpeed;
                currentEntities.forEach(ent => this.entities.push(ent));
            };
        }

        return new Promise((resolve) => {
            const finishLoading = () => {
                if (!this.rooms[roomName]) {
                    console.error(`Room ${roomName} not found`);
                    resolve();
                    return;
                }
                
                console.log(`Loading Room: ${roomName}`);
                const previousMusic = (this.audio && this.audio.currentMusicName) ? this.audio.currentMusicName : (this.roomMusic || null);
                this.entities = [];
                this.roomWidth = 0;
                this.roomHeight = 0;
                this.roomMusic = undefined;
                this.hasExplicitMusic = false;
                this.roomBackground = 'bg_beaker';
                this.bgFollowCamera = true;
                this.bgSpeed = 1.0;
                this.bgSecret = false;
                this.bgWave = false;
                this.bgWaveAmp = 8;
                this.bgWaveSpeed = 1.0;
                this.tileWave = false;
                this.tileWaveAmp = 3.5;
                this.tileWaveSpeed = 1.0;
                this.rooms[roomName].call(this);

                if (this.escape) {
                    // Escape sequence is active! Force Breaking News escape theme across all rooms!
                    this.roomMusic = 'mu_escape.wav';
                    this.hasExplicitMusic = true;
                } else if (typeof this.roomMusic === 'string' && this.roomMusic.trim() !== '') {
                    const trimmed = this.roomMusic.trim();
                    if (trimmed.toLowerCase() === 'none' || trimmed.toLowerCase() === 'stop') {
                        this.roomMusic = null;
                        this.hasExplicitMusic = true;
                    } else {
                        this.roomMusic = trimmed;
                        this.hasExplicitMusic = true;
                    }
                } else {
                    // Blank / empty string / undefined / null -> inherit currently playing music!
                    this.roomMusic = previousMusic || null;
                    this.hasExplicitMusic = false;
                }

                if (this.bgManager) {
                    this.bgManager.setBackground(this.roomBackground, this.bgFollowCamera, this.bgSpeed, this.bgSecret, this.bgWave, this.bgWaveAmp, this.bgWaveSpeed);
                }
                this.updateTileWaveUI();
                
                if (this.audio) {
                    this.audio.playMusic(this.roomMusic);
                }
                
                let startX = 100;
                let startY = 300;
                
                if (targetDoorId && targetDoorId !== 'null') {
                    const doorObj = this.entities.find(e => e.type === `targetDoor_${targetDoorId}`);
                    if (doorObj) {
                        startX = doorObj.x + doorObj.width/2 - this.player.width/2;
                        startY = doorObj.y + doorObj.height - this.player.height;
                    }
                }
                
                this.player.x = startX;
                this.player.y = startY;
                if (!preserveVelocity) {
                    this.player.vx = 0;
                    this.player.vy = 0;
                }
                this.player.targetDoorX = null;
                
                let targetCamX = this.player.x - this.canvas.width / 2 + this.player.width / 2;
                let playerBottom = this.player.y + this.player.height;
                let targetCamY = playerBottom - 22.5 - this.canvas.height / 2;
                if (!this.isEditorMode) {
                    if (this.roomWidth > 0) {
                        const maxX = Math.max(0, this.roomWidth - this.canvas.width);
                        if (targetCamX < 0) targetCamX = 0;
                        if (targetCamX > maxX) targetCamX = maxX;
                    }
                    if (this.roomHeight > 0) {
                        const maxY = Math.max(0, this.roomHeight - this.canvas.height);
                        if (targetCamY < 0) targetCamY = 0;
                        if (targetCamY > maxY) targetCamY = maxY;
                    }
                }
                this.camera.x = targetCamX;
                this.camera.y = targetCamY;
                this.cameraSpeedOffset = 0;
                
                this.currentRoom = roomName;
                resolve();
            };

            // Inject script to bypass CORS and always load latest file changes from disk
            let roomScript = document.getElementById('dynamic-room-script');
            if (roomScript) roomScript.remove();
            
            roomScript = document.createElement('script');
            roomScript.id = 'dynamic-room-script';
            roomScript.src = `room/${roomName}.js?t=${new Date().getTime()}`;
            roomScript.onload = () => {
                if (window.roomData && window.roomData[roomName]) {
                    this.rooms[roomName] = window.roomData[roomName];
                }
                finishLoading();
            };
            roomScript.onerror = () => {
                // If room file does not exist on disk (e.g. titlescreen or custom room), fallback to in-memory
                finishLoading();
            };
            document.body.appendChild(roomScript);
        });
    }

    respawnPlayer() {
        const targetDoorId = this.lastTargetDoorId || 'A';
        const doorObj = this.entities.find(e => e.type === `targetDoor_${targetDoorId}`);
        if (doorObj) {
            this.player.x = doorObj.x + doorObj.width/2 - this.player.width/2;
            this.player.y = doorObj.y + doorObj.height - this.player.height;
        } else {
            this.player.x = 100;
            this.player.y = 300;
        }
        this.player.vx = 0;
        this.player.vy = 0;
        
        // Instant camera snap
        let targetX = this.player.x - this.canvas.width / 2 + this.player.width / 2;
        let playerBottom = this.player.y + this.player.height;
        let targetY = playerBottom - 22.5 - this.canvas.height / 2;
        let maxX = this.roomWidth ? this.roomWidth - this.canvas.width : Infinity;
        let maxY = this.roomHeight ? this.roomHeight - this.canvas.height : Infinity;
        if (!this.isEditorMode) {
            if (targetX < 0) targetX = 0;
            if (targetY < 0) targetY = 0;
            if (targetX > maxX) targetX = maxX;
            if (targetY > Math.max(0, maxY)) targetY = Math.max(0, maxY);
        }
        
        this.camera.x = targetX;
        this.camera.y = targetY;
    }

    triggerRoomTransition(roomName, targetDoorId = 'A', preserveVelocity = false) {
        if (!targetDoorId) targetDoorId = 'A'; // Override null to 'A'
        this.lastTargetDoorId = targetDoorId;
        if (this.transitionState !== 'NONE') return;
        this.transitionState = 'FADE_OUT';
        this.transitionTimer = 0;
        this.pendingRoom = roomName;
        this.pendingDoor = targetDoorId;
        this.pendingPreserveVelocity = preserveVelocity;
    }

    update() {
        if (this.bgManager) {
            this.bgManager.update(1);
        }
        if (this.tileWave) {
            this.tileWaveTimer = (this.tileWaveTimer || 0) + 0.018 * (this.tileWaveSpeed || 1.0);
        }

        if (navigator.getGamepads) {
            const gps = navigator.getGamepads();
            const gp = gps[0] || gps[1] || gps[2] || gps[3];
            if (gp) {
                if (!this.prevGamepadState) this.prevGamepadState = {};
                const deadzone = 0.5;
                const gpState = {
                    jump: gp.buttons[0]?.pressed, // B button
                    run: gp.buttons[5]?.pressed || gp.buttons[7]?.pressed, // R or ZR
                    grab: gp.buttons[2]?.pressed, // Y button
                    taunt: gp.buttons[3]?.pressed, // X button
                    pause: gp.buttons[9]?.pressed || gp.buttons[8]?.pressed, // Start/+ or Select/-
                    up: gp.buttons[12]?.pressed || (gp.axes[1] && gp.axes[1] < -deadzone),
                    down: gp.buttons[13]?.pressed || (gp.axes[1] && gp.axes[1] > deadzone),
                    left: gp.buttons[14]?.pressed || (gp.axes[0] && gp.axes[0] < -deadzone),
                    right: gp.buttons[15]?.pressed || (gp.axes[0] && gp.axes[0] > deadzone)
                };

                const updateActionKey = (action, isPressed) => {
                    const k1 = this.settings.bindings[action];
                    const k2 = this.settings.bindings_2 ? this.settings.bindings_2[action] : null;
                    if (isPressed) {
                        if (k1) this.keys[k1] = true;
                        if (k2) this.keys[k2] = true;
                        this.keys[k1?.toLowerCase()] = true;
                        this.keys[k1?.toUpperCase()] = true;
                    } else if (this.prevGamepadState[action] && !isPressed) {
                        if (k1) this.keys[k1] = false;
                        if (k2) this.keys[k2] = false;
                        this.keys[k1?.toLowerCase()] = false;
                        this.keys[k1?.toUpperCase()] = false;
                    }
                    this.prevGamepadState[action] = isPressed;
                };

                if (gpState.pause && !this.prevGamepadState.pause && this.gameState !== 'OPTIONS' && this.gameState !== 'BOOT_LOADING' && this.gameState !== 'TITLE') {
                    this.togglePause();
                }

                if (gpState.jump && !this.prevGamepadState.jump && this.gameState === 'TITLE') {
                    this.keys['z'] = true;
                } else if (!gpState.jump && this.prevGamepadState.jump && this.gameState === 'TITLE') {
                    this.keys['z'] = false;
                }
                
                if (gpState.jump && this.gameState === 'PAUSED') this.keys['z'] = true;
                if (!gpState.jump && this.gameState === 'PAUSED' && this.prevGamepadState.jump) this.keys['z'] = false;

                updateActionKey('jump', gpState.jump);
                updateActionKey('run', gpState.run);
                updateActionKey('grab', gpState.grab);
                updateActionKey('taunt', gpState.taunt);
                updateActionKey('up', gpState.up);
                updateActionKey('down', gpState.down);
                updateActionKey('left', gpState.left);
                updateActionKey('right', gpState.right);
                updateActionKey('menu_up', gpState.up);
                updateActionKey('menu_down', gpState.down);
                updateActionKey('menu_left', gpState.left);
                updateActionKey('menu_right', gpState.right);
                updateActionKey('menu_confirm', gpState.jump);
                
                let bBack = gp.buttons[1]?.pressed;
                updateActionKey('menu_back', bBack);
                if (bBack) this.keys['Escape'] = true;
                else if (this.prevGamepadState.bBack && !bBack) this.keys['Escape'] = false;
                this.prevGamepadState.bBack = bBack;

                updateActionKey('menu_clear', gp.buttons[3]?.pressed);
                
                this.prevGamepadState.pause = gpState.pause;
                this.prevGamepadState.jump = gpState.jump;
            }
        }

        if (this.gameState === 'BOOT_LOADING') {
            if (this.loadingScreenLoaded) {
                let allReady = true;
                let readyCount = 0;
                let totalAssets = window.globalAssets ? window.globalAssets.length : 0;
                
                if (totalAssets > 0) {
                    for (let i = 0; i < totalAssets; i++) {
                        let asset = window.globalAssets[i];
                        if (asset instanceof HTMLImageElement) {
                            if (asset.src && !asset.complete && !asset._hasError) {
                                allReady = false;
                            } else if (asset.src) {
                                readyCount++;
                            }
                        } else if (asset instanceof HTMLAudioElement) {
                            if (asset.src && asset.readyState < 3 && !asset._hasError) {
                                allReady = false;
                            } else if (asset.src) {
                                readyCount++;
                            }
                        } else {
                            readyCount++;
                        }
                    }
                }
                
                // Also wait for room loading to finish
                totalAssets += 1;
                if (this.bootRoomLoaded) {
                    readyCount += 1;
                } else {
                    allReady = false;
                }
                
                let progress = totalAssets > 0 ? readyCount / totalAssets : 1;
                
                // Force minimum 1.5 second loading screen so it doesn't flash
                this.minBootTimer = (this.minBootTimer || 0) + 1;
                
                // Smooth visual progress
                let targetTimer = progress * this.bootLoadDuration;
                if (this.bootLoadTimer < targetTimer) {
                    this.bootLoadTimer += Math.max(1, (targetTimer - this.bootLoadTimer) * 0.1);
                }
                
                if (allReady && this.bootLoadTimer >= this.bootLoadDuration - 2 && this.minBootTimer >= 90) {
                    this.bootLoadTimer = this.bootLoadDuration;
                    this.gameState = 'CLICK_TO_START';
                    this.mouseClicked = false;
                }
            }
            return;
        }
        
        if (this.gameState === 'CLICK_TO_START') {
            const isAnyKeyPressed = Object.values(this.keys).some(v => v);
            let gpJump = false;
            if (navigator.getGamepads) {
                const gps = navigator.getGamepads();
                const gp = gps[0] || gps[1] || gps[2] || gps[3];
                if (gp && gp.buttons[0] && gp.buttons[0].pressed) gpJump = true;
            }
            
            if (isAnyKeyPressed || this.mouseClicked || gpJump) {
                this.gameState = 'LOGO';
                this.introVideo.currentTime = 0;
                this.introVideo.muted = false; // We have interaction now! Sound will work.
                let playPromise = this.introVideo.play();
                if (playPromise !== undefined) {
                    playPromise.catch(e => {
                        console.warn("Autoplay prevented despite interaction:", e);
                        this.introVideo.muted = true;
                        this.introVideo.play().catch(e2 => {
                            this.gameState = 'TITLE';
                        });
                    });
                }
                
                // Reset keys to prevent instant skipping of the video
                for (let k in this.keys) this.keys[k] = false;
                this.mouseClicked = false;
                this.prevIntroZ = false;
            }
            return;
        }
        
        if (this.gameState === 'LOGO') {
            if (this.introVideo.ended || this.introVideo.error) {
                this.gameState = 'TITLE';
                this.introSkipPrompt = false;
            }
            
            if (this.introSkipPrompt) {
                this.introSkipTimer--;
                if (this.introSkipTimer <= 0) {
                    this.introSkipPrompt = false;
                }
            }
            
            // Allow skipping video with Z key
            const isZPressed = this.keys['z'] || this.keys['Z'];
            if (isZPressed && !this.prevIntroZ) {
                if (!this.introSkipPrompt) {
                    this.introSkipPrompt = true;
                    this.introSkipTimer = 120; // 2 seconds at 60fps
                } else {
                    this.introVideo.pause();
                    this.gameState = 'TITLE';
                    this.introSkipPrompt = false;
                    this.keys['z'] = false; // Prevent auto-starting the game
                    this.keys['Z'] = false;
                }
            }
            this.prevIntroZ = isZPressed;
            
            return;
        }

        if (this.gameState === 'TITLE') {
            if (this.uiOverlay && this.uiOverlay.style.display !== 'none') {
                this.uiOverlay.style.display = 'none';
            }
            if (this.keys['z'] || this.keys['Z']) {
                this.gameState = 'PLAYING';
                if (this.uiOverlay) this.uiOverlay.style.display = 'block';
                this.keys['z'] = false;
                this.keys['Z'] = false;
                if (this.audio) {
                    this.audio.unlockAudio();
                    if (this.roomMusic) {
                        this.audio.playMusic(this.roomMusic);
                    }
                }
            }
            return;
        }

        if (this.gameState === 'PAUSED' || this.gameState === 'OPTIONS') {
            if (this.gameState === 'PAUSED') {
                if (!this.pauseMenuLevel) this.pauseMenuLevel = 'MAIN';

                if (this.pauseMenuLevel === 'PALETTE') {
                    if (this.isActionPressed('menu_left') && !this.prevKeysLeft) {
                        this.previewPalette = this.previewPalette - 1;
                        if (this.previewPalette < 1) this.previewPalette = 16;
                        if (this.player && this.player.paletteManager) this.player.paletteManager.setPalette(this.previewPalette);
                        if (this.audio) this.audio.playFile('sfx_switch', true);
                    }
                    if (this.isActionPressed('menu_right') && !this.prevKeysRight) {
                        this.previewPalette = this.previewPalette + 1;
                        if (this.previewPalette > 16) this.previewPalette = 1;
                        if (this.player && this.player.paletteManager) this.player.paletteManager.setPalette(this.previewPalette);
                        if (this.audio) this.audio.playFile('sfx_switch', true);
                    }
                    if (this.isActionPressed('menu_confirm') && !this.prevKeysZ) {
                        this.appliedPalette = this.previewPalette;
                        this.pauseMenuLevel = 'MAIN';
                        if (this.audio) this.audio.playFile('sfx_step', true);
                    }
                    if ((this.isActionPressed('menu_back') || this.keys['Escape']) && !this.prevMenuBackKey) {
                        if (this.player && this.player.paletteManager) this.player.paletteManager.setPalette(this.appliedPalette);
                        this.pauseMenuLevel = 'MAIN';
                        if (this.audio) this.audio.playFile('sfx_step', true);
                    }
                } else {
                if (this.isActionPressed('menu_up') && !this.prevKeysUp) {
                    this.pauseMenuIndex = (this.pauseMenuIndex - 1 + this.pauseMenuOptions.length) % this.pauseMenuOptions.length;
                    if (this.audio) this.audio.playFile('sfx_step', true); 
                }
                if (this.isActionPressed('menu_down') && !this.prevKeysDown) {
                    this.pauseMenuIndex = (this.pauseMenuIndex + 1) % this.pauseMenuOptions.length;
                    if (this.audio) this.audio.playFile('sfx_step', true); 
                }
                const sel = this.pauseMenuOptions[this.pauseMenuIndex];
                if (this.isActionPressed('menu_confirm') && !this.prevKeysZ) {
                    if (sel === 'RESUME') {
                        this.togglePause();
                    } else if (sel === 'PALETTE') {
                        this.pauseMenuLevel = 'PALETTE';
                        if (this.player && this.player.paletteManager) {
                            this.appliedPalette = this.player.paletteManager.currentPalette;
                            this.previewPalette = this.player.paletteManager.currentPalette;
                        } else {
                            this.appliedPalette = 0;
                            this.previewPalette = 0;
                        }
                        if (this.audio) this.audio.playFile('sfx_step', true);
                    } else if (sel === 'OPTIONS') {
                        this.gameState = 'OPTIONS';
                        this.cameraShake = 0;
                        if (this.player) this.player.requestScreenShake = 0;
                        this.optionsMenuIndex = 0;
                        this.optionsMenuLevel = 'MAIN';
                        document.getElementById('options-overlay').style.display = 'none'; // just in case
                    } else if (sel === 'RESTART') {
                        this.escape = false;
                        this.togglePause();
                        this.loadRoom(this.currentRoom);
                    } else if (sel === 'EXIT LEVEL') {
                        this.escape = false;
                        this.togglePause();
                        this.gameState = 'TITLE';
                        if (this.audio) this.audio.playMusic(null);
                        if (this.uiOverlay) this.uiOverlay.style.display = 'none';
                    }
                }
                } // end else MAIN
                
                this.prevKeysUp = this.isActionPressed('menu_up');
                this.prevKeysDown = this.isActionPressed('menu_down');
                this.prevKeysZ = this.isActionPressed('menu_confirm');
                this.prevKeysLeft = this.isActionPressed('menu_left');
                this.prevKeysRight = this.isActionPressed('menu_right');
                this.prevMenuBackKey = this.isActionPressed('menu_back') || this.keys['Escape'];

                // Update bubbles
                if (this.pauseBubbles) {
                    this.pauseBubbles.forEach(b => {
                        b.x += b.vx;
                        b.y += b.vy;
                        if (b.x < this.canvas.width/2 - 100) b.x = this.canvas.width/2 - 100;
                        if (b.x > this.canvas.width + b.r) b.x = this.canvas.width/2 - 100;
                        if (b.y < -b.r) b.y = this.canvas.height + b.r;
                        if (b.y > this.canvas.height + b.r) b.y = -b.r;
                    });
                }
            } else if (this.gameState === 'EDIT_LAYOUT') return;

            if (this.gameState === 'OPTIONS') {
                this.optionsScrollX -= 0.5;
                this.optionsScrollY -= 0.5;
                if (this.bindingKeyFor) {
                    if (performance.now() - this.bindingLastTime >= 1000) {
                        this.bindingTimeout--;
                        this.bindingLastTime = performance.now();
                        if (this.bindingTimeout <= 0) this.bindingKeyFor = null;
                    }
                    this.prevKeysZ = this.keys['z'] || this.keys['Z'] || this.keys['Enter'];
                    this.prevKeysX = this.keys['x'] || this.keys['X'] || this.keys['Escape'];
                    this.prevKeysC = this.keys['c'] || this.keys['C'];
                    return;
                }

                let currentOptions = [];
                if (this.optionsMenuLevel === 'MAIN') currentOptions = this.optionsMenuOptions;
                else if (this.optionsMenuLevel === 'AUDIO') currentOptions = ['BACK', 'MASTER', 'MUSIC', 'SFX', 'UNFOCUS MUTE'];
                else if (this.optionsMenuLevel === 'VIDEO') currentOptions = ['BACK', 'WINDOW MODE', 'RESOLUTION', 'VSYNC', 'TEXTURE FILTERING', 'HIDE HUD'];
                else if (this.optionsMenuLevel === 'GAME') currentOptions = ['BACK', 'SHAKE INTENS', 'TIMER'];
                else if (this.optionsMenuLevel === 'CONTROLS') currentOptions = ['BACK', 'KEYBOARD', 'CONTROLLER', 'RESET CONFIG'];
                else if (this.optionsMenuLevel === 'KEYBOARD') currentOptions = ['BACK', (('ontouchstart' in window) || navigator.maxTouchPoints > 0) ? 'MOBILE LAYOUT' : 'BINDINGS', 'DIR SUPERJUMP', 'DIR GROUNDPOUND'];
                else if (this.optionsMenuLevel === 'BINDINGS') currentOptions = ['BACK', 'UP', 'DOWN', 'LEFT', 'RIGHT', 'JUMP', 'GRAB', 'DASH', 'SUPERJUMP', 'GROUNDPOUND', 'TAUNT', 'PAUSE', 'MENU LEFT', 'MENU RIGHT', 'MENU UP', 'MENU DOWN', 'MENU CONFIRM', 'MENU BACK', 'MENU CLEAR'];
                else if (this.optionsMenuLevel === 'WINDOW MODE') currentOptions = ['BACK', 'WINDOWED', 'FULLSCREEN', 'BORDERLESS'];
                else if (this.optionsMenuLevel === 'LANGUAGE') currentOptions = ['BACK', this.settings.language === 'ko' ? '<- 한국어 ->' : '<- ENGLISH ->'];
                
                if (this.isActionPressed('menu_up') && !this.prevKeysUp) {
                    this.optionsMenuIndex = (this.optionsMenuIndex - 1 + currentOptions.length) % currentOptions.length;
                    if (this.audio) this.audio.playFile('sfx_step', true);
                }
                if (this.isActionPressed('menu_down') && !this.prevKeysDown) {
                    this.optionsMenuIndex = (this.optionsMenuIndex + 1) % currentOptions.length;
                    if (this.audio) this.audio.playFile('sfx_step', true);
                }
                if (this.optionsMenuLevel === 'BINDINGS' && currentOptions[this.optionsMenuIndex] !== 'BACK') {
                    if (this.isActionPressed('menu_left') && !this.prevKeysLeft) {
                        this.optionsMenuCol = 0;
                        if (this.audio) this.audio.playFile('sfx_step', true);
                    }
                    if (this.isActionPressed('menu_right') && !this.prevKeysRight) {
                        this.optionsMenuCol = 1;
                        if (this.audio) this.audio.playFile('sfx_step', true);
                    }
                } else {
                    this.optionsMenuCol = 0;
                }
                
                // Settings adjust logic
                const sel = currentOptions[this.optionsMenuIndex];
                
                // Initialize default custom properties if missing
                if (this.settings.resolutions === undefined) this.settings.resolutions = ['960 X 540', '1280 X 720', '1920 X 1080'];
                if (this.settings.resolutionIndex === undefined) this.settings.resolutionIndex = 0;
                if (this.settings.windowMode === undefined) this.settings.windowMode = 'WINDOWED';
                if (this.settings.hideHud === undefined) this.settings.hideHud = false;
                if (this.settings.shakeIntens === undefined) this.settings.shakeIntens = 100;
                if (this.settings.timer === undefined) this.settings.timer = false;
                if (this.settings.dirSuperjump === undefined) this.settings.dirSuperjump = true;
                if (this.settings.dirGroundpound === undefined) this.settings.dirGroundpound = true;
                
                if (this.keys['ArrowLeft']) {
                    // Continuous sliders (change by 1 every frame while held)
                    if (sel === 'MASTER') this.settings.masterVolume = Math.max(0, this.settings.masterVolume - 1);
                    if (sel === 'MUSIC') this.settings.musicVolume = Math.max(0, this.settings.musicVolume - 1);
                    if (sel === 'SFX') this.settings.sfxVolume = Math.max(0, this.settings.sfxVolume - 1);
                    if (sel === 'SHAKE INTENS') {
                        this.settings.shakeIntens = Math.max(0, this.settings.shakeIntens - 1);
                        this.settings.screenShake = this.settings.shakeIntens > 0;
                        if (this.settings.shakeIntens === 0) this.cameraShake = 0;
                    }

                    // Discrete toggles (change only once per press)
                    if (!this.prevKeysLeft) {
                        if (this.optionsMenuLevel === 'LANGUAGE' && this.optionsMenuIndex === 1) {
                            this.settings.language = (this.settings.language === 'en') ? 'ko' : 'en';
                            this.loadLangFile();
                            this.translateUI();
                        }
                        if (this.optionsMenuLevel === 'MAIN' && sel === 'LANGUAGE') {
                            this.settings.language = (this.settings.language === 'en') ? 'ko' : 'en';
                            this.loadLangFile();
                            this.translateUI();
                        }
                        if (sel === 'UNFOCUS MUTE') this.settings.unfocusedMute = !this.settings.unfocusedMute;
                        if (sel === 'RESOLUTION') this.settings.resolutionIndex = Math.max(0, this.settings.resolutionIndex - 1);
                        if (sel === 'VSYNC') this.settings.vsync = !this.settings.vsync;
                        if (sel === 'TEXTURE FILTERING') this.settings.textureFiltering = !this.settings.textureFiltering;
                        if (sel === 'HIDE HUD') this.settings.hideHud = !this.settings.hideHud;
                        if (sel === 'TIMER') this.settings.timer = !this.settings.timer;
                        if (sel === 'DIR SUPERJUMP') this.settings.dirSuperjump = !this.settings.dirSuperjump;
                        if (sel === 'DIR GROUNDPOUND') this.settings.dirGroundpound = !this.settings.dirGroundpound;
                        if (this.audio && sel !== 'BACK') this.audio.playFile('sfx_step', true);
                        this.saveSettings();
                    }
                }
                
                if (this.keys['ArrowRight']) {
                    // Continuous sliders (change by 1 every frame while held)
                    if (sel === 'MASTER') this.settings.masterVolume = Math.min(100, this.settings.masterVolume + 1);
                    if (sel === 'MUSIC') this.settings.musicVolume = Math.min(100, this.settings.musicVolume + 1);
                    if (sel === 'SFX') this.settings.sfxVolume = Math.min(100, this.settings.sfxVolume + 1);
                    if (sel === 'SHAKE INTENS') {
                        this.settings.shakeIntens = Math.min(100, this.settings.shakeIntens + 1);
                        this.settings.screenShake = this.settings.shakeIntens > 0;
                    }

                    // Discrete toggles (change only once per press)
                    if (!this.prevKeysRight) {
                        if (this.optionsMenuLevel === 'LANGUAGE' && this.optionsMenuIndex === 1) {
                            this.settings.language = (this.settings.language === 'en') ? 'ko' : 'en';
                            this.loadLangFile();
                            this.translateUI();
                        }
                        if (this.optionsMenuLevel === 'MAIN' && sel === 'LANGUAGE') {
                            this.settings.language = (this.settings.language === 'en') ? 'ko' : 'en';
                            this.loadLangFile();
                            this.translateUI();
                        }
                        if (sel === 'UNFOCUS MUTE') this.settings.unfocusedMute = !this.settings.unfocusedMute;
                        if (sel === 'RESOLUTION') this.settings.resolutionIndex = Math.min(this.settings.resolutions.length - 1, this.settings.resolutionIndex + 1);
                        if (sel === 'VSYNC') this.settings.vsync = !this.settings.vsync;
                        if (sel === 'TEXTURE FILTERING') this.settings.textureFiltering = !this.settings.textureFiltering;
                        if (sel === 'HIDE HUD') this.settings.hideHud = !this.settings.hideHud;
                        if (sel === 'TIMER') this.settings.timer = !this.settings.timer;
                        if (sel === 'DIR SUPERJUMP') this.settings.dirSuperjump = !this.settings.dirSuperjump;
                        if (sel === 'DIR GROUNDPOUND') this.settings.dirGroundpound = !this.settings.dirGroundpound;
                        if (this.audio && sel !== 'BACK') this.audio.playFile('sfx_step', true);
                        this.saveSettings();
                    }
                }

                if ((this.prevKeysLeft && !this.keys['ArrowLeft']) || (this.prevKeysRight && !this.keys['ArrowRight'])) {
                    this.saveSettings();
                }


                if (this.optionsMenuLevel === 'BINDINGS' && currentOptions[this.optionsMenuIndex] !== 'BACK') {
                    if (this.keys['1'] && !this.prevKeys1) {
                        this.settings.bindings = {
                            left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown',
                            jump: 'z', run: 'Shift', grab: 'x', dash: 'Shift', superjump: 'ArrowUp',
                            groundpound: 'ArrowDown', taunt: 'c', pause: 'Escape', menu_left: 'ArrowLeft', menu_right: 'ArrowRight',
                            menu_up: 'ArrowUp', menu_down: 'ArrowDown', menu_confirm: 'z', menu_back: 'x', menu_clear: 'c'
                        };
                        if (this.audio) this.audio.playFile('sfx_step', true);
                    }
                    if (this.isActionPressed('menu_clear') && !this.prevKeysC) {
                        let optStr = currentOptions[this.optionsMenuIndex].toLowerCase().replace(' ', '_');
                        if (this.optionsMenuCol === 1) {
                            if (!this.settings.bindings_2) this.settings.bindings_2 = {};
                            this.settings.bindings_2[optStr] = '';
                        } else {
                            this.settings.bindings[optStr] = '';
                        }
                        if (this.audio) this.audio.playFile('sfx_step', true);
                    }
                    if (this.isActionPressed('menu_confirm') && !this.prevKeysZ) {
                        let optStr = currentOptions[this.optionsMenuIndex].toLowerCase().replace(' ', '_');
                        this.bindingKeyFor = optStr;
                        this.bindingColFor = this.optionsMenuCol || 0;
                        this.bindingTimeout = 3;
                        this.bindingLastTime = performance.now();
                        if (this.audio) this.audio.playFile('sfx_step', true);
                    }
                } else if (this.isActionPressed('menu_confirm') && !this.prevKeysZ) {
                    if (this.optionsMenuLevel === 'MAIN') {
                        this.optionsMenuLevel = currentOptions[this.optionsMenuIndex];
                        this.optionsMenuIndex = 0;
                    } else if (currentOptions[this.optionsMenuIndex] === 'BACK') {
                        this.saveSettings();
                        if (this.optionsMenuLevel === 'KEYBOARD') {
                            this.optionsMenuLevel = 'CONTROLS';
                        } else if (this.optionsMenuLevel === 'BINDINGS') {
                            this.optionsMenuLevel = 'KEYBOARD';
                        } else if (this.optionsMenuLevel === 'WINDOW MODE') {
                            this.optionsMenuLevel = 'VIDEO';
                            this.optionsMenuIndex = 1;
                        } else if (this.optionsMenuLevel === 'LANGUAGE') {
                            this.optionsMenuLevel = 'MAIN';
                            this.optionsMenuIndex = 4;
                            if (this.audio) this.audio.playFile('sfx_step', true);
                            return;
                        } else {
                            this.optionsMenuLevel = 'MAIN';
                        }
                        this.optionsMenuIndex = 0;
                    } else if (this.optionsMenuLevel === 'LANGUAGE') {
                        if (this.optionsMenuIndex === 1) {
                            this.settings.language = (this.settings.language === 'en') ? 'ko' : 'en';
                            this.loadLangFile();
                            this.translateUI();
                            this.saveSettings();
                        }
                        if (this.audio) this.audio.playFile('sfx_step', true);
                    } else if (this.optionsMenuLevel === 'CONTROLS' && currentOptions[this.optionsMenuIndex] === 'RESET CONFIG') {
                        // Reset Keyboard Bindings
                        this.settings.bindings = {
                            left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown',
                            jump: 'z', run: 'Shift', grab: 'x', dash: 'Shift', superjump: 'ArrowUp',
                            groundpound: 'ArrowDown', taunt: 'c', pause: 'Escape', menu_left: 'ArrowLeft', menu_right: 'ArrowRight',
                            menu_up: 'ArrowUp', menu_down: 'ArrowDown', menu_confirm: 'z', menu_back: 'x', menu_clear: 'Delete'
                        };
                        this.saveSettings();
                        
                        // Reset Mobile Layout
                        localStorage.removeItem('mobileLayout');
                        const defaults = {
                            'mbtn-pause': { top: '20px', right: '20px', bottom: 'auto', left: 'auto' },
                            'joystick-zone': { bottom: '40px', left: '40px', top: 'auto', right: 'auto' },
                            'mbtn-jump': { bottom: '40px', right: '40px', top: 'auto', left: 'auto' },
                            'mbtn-run': { bottom: '40px', right: '120px', top: 'auto', left: 'auto' },
                            'mbtn-grab': { bottom: '120px', right: '80px', top: 'auto', left: 'auto' }
                        };
                        for (let id in defaults) {
                            const el = document.getElementById(id);
                            if (el) {
                                el.style.top = defaults[id].top;
                                el.style.bottom = defaults[id].bottom;
                                el.style.left = defaults[id].left;
                                el.style.right = defaults[id].right;
                            }
                        }
                        
                        // Small feedback sound
                        if (this.audio) this.audio.playFile('sfx_break', true); // Just any sound or beep
                    } else if (this.optionsMenuLevel === 'CONTROLS' && currentOptions[this.optionsMenuIndex] === 'KEYBOARD') {
                        this.optionsMenuLevel = 'KEYBOARD';
                        this.optionsMenuIndex = 0;
                    } else if (this.optionsMenuLevel === 'KEYBOARD' && currentOptions[this.optionsMenuIndex] === 'BINDINGS') {
                        this.optionsMenuLevel = 'BINDINGS';
                        this.optionsMenuIndex = 0;
                    } else if (this.optionsMenuLevel === 'KEYBOARD' && currentOptions[this.optionsMenuIndex] === 'MOBILE LAYOUT') {
                        this.editLayoutReturnState = this.gameState;
                        this.gameState = 'EDIT_LAYOUT';
                        this.enableLayoutEditMode(true);
                        
                        let doneBtn = document.getElementById('btn-finish-layout');
                        if (!doneBtn) {
                            doneBtn = document.createElement('button');
                            doneBtn.id = 'btn-finish-layout';
                            doneBtn.innerText = 'DONE EDITING';
                            doneBtn.style.position = 'fixed';
                            doneBtn.style.top = '20px';
                            doneBtn.style.left = '50%';
                            doneBtn.style.transform = 'translateX(-50%)';
                            doneBtn.style.zIndex = '9999';
                            doneBtn.style.padding = '10px 20px';
                            doneBtn.style.fontSize = '1.2rem';
                            doneBtn.style.background = '#e74c3c';
                            doneBtn.style.color = 'white';
                            doneBtn.style.border = '2px solid white';
                            doneBtn.style.borderRadius = '10px';
                            document.body.appendChild(doneBtn);
                            
                            doneBtn.addEventListener('click', () => {
                                doneBtn.style.display = 'none';
                                this.gameState = this.editLayoutReturnState || 'PAUSED';
                                if (this.gameState === 'PAUSED') {
                                    document.getElementById('options-overlay').style.display = 'flex';
                                }
                                this.enableLayoutEditMode(false);
                            });
                        }
                        doneBtn.style.display = 'block';
                    } else if (this.optionsMenuLevel === 'VIDEO' && currentOptions[this.optionsMenuIndex] === 'WINDOW MODE') {
                        this.optionsMenuLevel = 'WINDOW MODE';
                        this.optionsMenuIndex = 0;
                    } else if (this.optionsMenuLevel === 'WINDOW MODE') {
                        this.settings.windowMode = currentOptions[this.optionsMenuIndex];
                        this.optionsMenuLevel = 'VIDEO';
                        this.optionsMenuIndex = 1;
                        
                        // Apply Window Mode
                        if (this.settings.windowMode === 'FULLSCREEN' || this.settings.windowMode === 'BORDERLESS') {
                            if (!document.fullscreenElement) {
                                document.documentElement.requestFullscreen().catch(err => {
                                    console.log("Error attempting to enable fullscreen:", err);
                                });
                            }
                        } else if (this.settings.windowMode === 'WINDOWED') {
                            if (document.fullscreenElement) {
                                document.exitFullscreen().catch(err => {
                                    console.log("Error attempting to exit fullscreen:", err);
                                });
                            }
                        }
                    }
                    if (this.audio) this.audio.playFile('sfx_step', true);
                }

                const isBackPress = (this.isActionPressed('menu_back') || this.keys['Escape']) && !this.prevMenuBackKey;
                
                if (isBackPress && !this.bindingKeyFor) {
                    this.saveSettings();
                    if (this.optionsMenuLevel !== 'MAIN') {
                        if (this.optionsMenuLevel === 'KEYBOARD') {
                            this.optionsMenuLevel = 'CONTROLS';
                        } else if (this.optionsMenuLevel === 'BINDINGS') {
                            this.optionsMenuLevel = 'KEYBOARD';
                        } else if (this.optionsMenuLevel === 'WINDOW MODE') {
                            this.optionsMenuLevel = 'VIDEO';
                            this.optionsMenuIndex = 1;
                        } else if (this.optionsMenuLevel === 'LANGUAGE') {
                            this.optionsMenuLevel = 'MAIN';
                            this.optionsMenuIndex = 4;
                        } else {
                            this.optionsMenuLevel = 'MAIN';
                            this.optionsMenuIndex = 0;
                        }
                    } else {
                        // In MAIN, go back to PAUSED
                        this.gameState = 'PAUSED';
                        this.optionsMenuIndex = 0;
                    }
                    if (this.audio) this.audio.playFile('sfx_step', true);
                }

                this.prevKeysUp = this.isActionPressed('menu_up');
                this.prevKeysDown = this.isActionPressed('menu_down');
                this.prevKeysLeft = this.isActionPressed('menu_left');
                this.prevKeysRight = this.isActionPressed('menu_right');
                this.prevKeysEsc = this.keys['Escape'];
                this.prevKeysZ = this.isActionPressed('menu_confirm');
                this.prevKeys1 = this.keys['1'];
                this.prevKeysC = this.isActionPressed('menu_clear');
                
                this.prevMenuBackKey = this.isActionPressed('menu_back') || this.keys['Escape'];
            }
            return;
        }

        if (this.transitionState === 'FADE_OUT') {
            this.transitionTimer++;
            this.transitionAlpha = this.transitionTimer / this.transitionDuration;
            if (this.transitionTimer >= this.transitionDuration) {
                this.transitionAlpha = 1;
                this.transitionState = 'LOADING_ROOM';
                this.loadRoom(this.pendingRoom, this.pendingDoor, this.pendingPreserveVelocity).then(() => {
                    this.transitionState = 'FADE_IN';
                    this.transitionTimer = 0;
                    if (this.player && (this.player.state === 'walkfront' || this.player.state === 'enterdoor')) {
                        this.player.state = 'walkfront';
                        this.player.isEnteringDoor = false;
                        this.player.sprite_index = 'spr_player_walkfront';
                        this.player.image_index = 0;
                        this.player.image_speed = 0.45;
                        this.player.targetDoorX = null;
                        this.player.vx = 0;
                        this.player.vy = 0;
                    }
                });
            }
        } else if (this.transitionState === 'LOADING_ROOM') {
            // do nothing while waiting for the promise
        } else if (this.transitionState === 'FADE_IN') {
            this.transitionTimer++;
            this.transitionAlpha = 1 - (this.transitionTimer / this.transitionDuration);
            if (this.transitionTimer >= this.transitionDuration) {
                this.transitionAlpha = 0;
                this.transitionState = 'NONE';
                this.pendingRoom = null;
                this.pendingDoor = null;
                if (this.player) {
                    this.player.targetDoorX = null;
                    if (this.player.state === 'enterdoor') {
                        this.player.state = 'normal';
                        this.player.sprite_index = 'spr_player_idle';
                        this.player.image_index = 0;
                    }
                }
            }
        }

        if (this.gameState === 'TITLE') {
            if (this.uiOverlay && this.uiOverlay.style.display !== 'none') {
                this.uiOverlay.style.display = 'none';
            }
            if (this.keys['z'] || this.keys['Z']) {
                this.gameState = 'PLAYING';
                if (this.uiOverlay) this.uiOverlay.style.display = 'block';
                this.keys['z'] = false;
                this.keys['Z'] = false;
            }
            return;
        }

        if (this.gameState === 'ONLINE_MENU') {
            const opts = this.onlineMenuOptions[this.onlineMenuLevel];
            if (this.isActionPressed('menu_up') && !this.prevKeysUp) {
                this.onlineMenuIndex = (this.onlineMenuIndex - 1 + opts.length) % opts.length;
                if (this.audio) this.audio.playFile('sfx_step', true);
            }
            if (this.isActionPressed('menu_down') && !this.prevKeysDown) {
                this.onlineMenuIndex = (this.onlineMenuIndex + 1) % opts.length;
                if (this.audio) this.audio.playFile('sfx_step', true);
            }
            if (this.isActionPressed('menu_confirm') && !this.prevKeysZ) {
                const sel = opts[this.onlineMenuIndex];
                if (sel === 'EXIT MENU') {
                    this.toggleOnlineMenu();
                } else if (sel === 'CREATE') {
                    this.onlineMenuLevel = 'CREATE';
                    this.onlineMenuIndex = 0;
                } else if (sel === 'JOIN') {
                    this.onlineMenuLevel = 'JOIN';
                    this.onlineMenuIndex = 0;
                } else if (sel === 'BACK') {
                    this.onlineMenuLevel = 'MAIN';
                    this.onlineMenuIndex = 0;
                } else if (sel === 'CREATE SVR' || sel === 'JOIN SVR') {
                    this.connectMultiplayer(sel === 'CREATE SVR');
                    this.toggleOnlineMenu();
                } else if (sel === 'DISCONNECT') {
                    if (this.peer) this.peer.destroy();
                    this.peer = null;
                    this.networkConns = [];
                    this.otherPlayers = {};
                    if (this.chatInput) {
                        this.chatInput.value = '';
                        this.chatInput.style.display = 'none';
                        this.isTyping = false;
                    }
                    this.toggleOnlineMenu();
                    this.addChatMessage("SERVER", "Disconnected.");
                } else if (sel === 'CHANGE USERNAME' || sel === this.myUsername) {
                    const newName = prompt("Enter new username:", this.myUsername);
                    if (newName && newName.trim().length > 0) {
                        this.myUsername = newName.trim().substring(0, 15).toUpperCase();
                        opts[3] = this.myUsername; // Update the display text in the menu
                    }
                } else {
                    console.log("Selected:", sel);
                }
                if (this.audio) this.audio.playFile('sfx_step', true);
            }
            this.prevKeysUp = this.isActionPressed('menu_up');
            this.prevKeysDown = this.isActionPressed('menu_down');
            this.prevKeysZ = this.isActionPressed('menu_confirm');
            return;
        }

        if (this.gameState === 'PAUSED' || this.gameState === 'OPTIONS' || this.gameState === 'ONLINE_MENU') {
            return;
        }

        if (this.transitionState !== 'NONE') {
            this.keys.actionLeft = false;
            this.keys.actionRight = false;
            this.keys.actionUp = false;
            this.keys.actionDown = false;
            this.keys.actionJump = false;
            this.keys.actionRun = false;
        } else {
            this.keys.actionLeft = this.isActionPressed('left');
            this.keys.actionRight = this.isActionPressed('right');
            this.keys.actionUp = this.isActionPressed('up');
            this.keys.actionDown = this.isActionPressed('down');
            this.keys.actionJump = this.isActionPressed('jump');
            this.keys.actionRun = this.isActionPressed('run');
            this.keys.actionGrab = this.isActionPressed('grab');
            this.keys.actionTaunt = this.isActionPressed('taunt');
        }

        this.player.update(this.keys, this.entities, this.audio);
        
        // Send multiplayer data
        if (this.networkConns && this.networkConns.length > 0 && this.myOnlineId) {
            const payload = {
                x: this.player.x,
                y: this.player.y,
                sprite: this.player.sprite_index,
                image: Math.floor(this.player.image_index),
                dir: this.player.facingDir || 1, // Fix: Use facingDir instead of dir
                palette: this.player.paletteManager ? this.player.paletteManager.currentPalette : 1,
                name: this.myUsername
            };
            
            for (let conn of this.networkConns) {
                if (conn.open) {
                    conn.send({ type: 'update', payload: payload });
                }
            }
        }

        // Chat Timers
        for (let i = this.chatMessages.length - 1; i >= 0; i--) {
            this.chatMessages[i].timer--;
            if (this.chatMessages[i].timer <= 0) {
                this.chatMessages.splice(i, 1);
            }
        }

        // Combo Timer Logic
        if (this.comboTimer > 0) {
            this.comboTimer -= 0.2;
            if (this.comboTimer <= 0) {
                this.combo = 0;
            }
        }
        
        for (let i = this.entities.length - 1; i >= 0; i--) {
            let ent = this.entities[i];
            if (ent.update) {
                ent.update(this);
            }
            if (ent.markedForDeletion) {
                this.entities.splice(i, 1);
            }
        }

        if (this.floatingTexts) {
            for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
                let ft = this.floatingTexts[i];
                ft.y += ft.vy;
                ft.alpha -= 0.02;
                if (ft.alpha <= 0) {
                    this.floatingTexts.splice(i, 1);
                }
            }
        }

        // Out of bounds respawn (only active in play mode, never in editor mode)
        const boundsBottom = Math.max(this.roomHeight || 600, this.canvas.height) + 200;
        if (!this.isEditorMode && this.player.y > boundsBottom && !this.isPlayingTransition) {
            this.isPlayingTransition = true;
            this.transitionFrameIndex = 0;
            this.transitionTimer = 0;
            this.hasRespawned = false;
            this.player.vx = 0;
            this.player.vy = 0;
            
            const video = document.getElementById('transitionVideo');
            if (video) {
                video.currentTime = 0;
                video.muted = false;
                video.play().catch(() => { video.muted = true; video.play().catch(() => {}); });
            }
        }
        
        // Handle screen shake requests
        if (this.player.requestScreenShake > 0) {
            const shakeMult = (this.settings.screenShake && this.settings.shakeIntens !== undefined) ? (this.settings.shakeIntens / 100) : (this.settings.screenShake ? 1 : 0);
            if (shakeMult > 0) {
                this.cameraShake = this.player.requestScreenShake;
            } else {
                this.cameraShake = 0;
            }
            this.player.requestScreenShake = 0;
        }

        if (this.cameraShake > 0) {
            this.cameraShake *= 0.8; // Decay
            if (this.cameraShake < 0.5) this.cameraShake = 0;
        }
        
        // Camera Follow (Lerp)
        let targetX = this.player.x - this.canvas.width / 2 + this.player.width / 2;
        // 웅크릴 때 높이가 변해도 카메라가 흔들리지 않도록 발밑(bottom) 기준으로 중앙을 계산 (기본 높이 45의 절반인 22.5 사용)
        let playerBottom = this.player.y + this.player.height;
        
        let targetY = playerBottom - 22.5 - this.canvas.height / 2;

        if (!this.isEditorMode) {
            // 카메라가 빈 공간(void)으로 한없이 떨어지지 않게 직접 Y좌표 제한 (플레이 모드에서만 동작)
            let lowestEntityY = 0;
            for (let e of this.entities) {
                if (e.y + e.height > lowestEntityY) lowestEntityY = e.y + e.height;
            }
            // 화면 하단(targetY + height)이 가장 낮은 엔티티보다 약간(100px)만 더 내려가게 제한
            let maxTargetY = lowestEntityY + 100 - this.canvas.height;
            if (targetY > maxTargetY) {
                targetY = maxTargetY;
            }
        }
        
        // Speed-based camera offset (look ahead in direction of movement when speed > 7)
        const playerSpeed = Math.abs(this.player.vx);
        let targetSpeedOffset = 0;
        if (playerSpeed > 7) {
            const excessSpeed = playerSpeed - 7;
            const direction = Math.sign(this.player.vx);
            targetSpeedOffset = direction * (excessSpeed * 15);
        }
        this.cameraSpeedOffset += (targetSpeedOffset - this.cameraSpeedOffset) * 0.02;
        targetX += this.cameraSpeedOffset;
        
        if (!this.isEditorMode) {
            if (this.roomWidth > 0) {
                const maxX = Math.max(0, this.roomWidth - this.canvas.width);
                if (targetX < 0) targetX = 0;
                if (targetX > maxX) targetX = maxX;
            }
            if (this.roomHeight > 0) {
                const maxY = Math.max(0, this.roomHeight - this.canvas.height);
                if (targetY < 0) targetY = 0;
                if (targetY > maxY) targetY = maxY;
            }
        }

        const lerpFactor = (this.settings.cameraSpeed || 20) / 100;
        this.camera.x += (targetX - this.camera.x) * lerpFactor;
        this.camera.y += (targetY - this.camera.y) * lerpFactor;
        
        if (this.isPlayingTransition) {
            this.transitionTimer += (28 / 60); // 28 fps
            if (this.transitionTimer >= 1.0) {
                this.transitionTimer -= 1.0;
                this.transitionFrameIndex++;
            }
            
            if (!this.hasRespawned && this.transitionFrameIndex >= this.transitionFrameCount / 2) {
                this.respawnPlayer();
                this.hasRespawned = true;
            }
            
            if (this.transitionFrameIndex >= this.transitionFrameCount) {
                this.isPlayingTransition = false;
                if (!this.hasRespawned) this.respawnPlayer();
            }
        }

        // Update speed meters UI
        const lang = this.settings.language || 'ko';
        const dict = i18n[lang];
        const hSpeed = Math.round(Math.abs(this.player.vx) * 10);
        const vSpeed = Math.round(Math.abs(this.player.vy) * 10);
        this.speedMeter.innerText = `${dict['ui.speed']}: ${hSpeed}`;
        this.climbMeter.innerText = `${dict['ui.climb']}: ${vSpeed}`;
        if (this.posInfo) {
            this.posInfo.innerText = `X: ${Math.round(this.player.x)}, Y: ${Math.round(this.player.y)}`;
        }

        // Update state info UI
        let currentStates = [];
        if (this.player.state === 'enterdoor') currentStates.push('enterdoor');
        else if (this.player.state === 'walkfront') currentStates.push('walkfront');
        else if (this.player.isClimbing) currentStates.push(dict['state.climbing']);
        else if (this.player.isGroundPoundLand) currentStates.push(dict['state.groundpoundland']);
        else if (!this.player.isGrounded) currentStates.push(dict['state.airborne']);
        else if (this.player.isRunning) currentStates.push(dict['state.running']);
        else currentStates.push(dict['state.grounded']);

        if (this.player.isWalled && !this.player.isClimbing) currentStates.push(dict['state.climbing']);
        if (this.player.isGroundPounding) currentStates.push(dict['state.groundpound']);
        if (this.player.isDrifting) currentStates.push(dict['state.drifting']);
        if (this.player.isDrifting1) currentStates.push(dict['state.drifting']);
        if (Math.abs(this.player.vx) >= this.player.machThreshold) currentStates.push(dict['state.mach']);

        // Door Interaction Check
        const overlappingDoor = this.entities.find(e => 
            e.type === 'door' && 
            this.player.x < e.x + e.width &&
            this.player.x + this.player.width > e.x &&
            this.player.y < e.y + e.height &&
            this.player.y + this.player.height > e.y
        );

        if (overlappingDoor && this.keys.actionUp && this.player.isGrounded && this.player.state !== 'enterdoor' && this.player.state !== 'walkfront' && this.transitionState === 'NONE') {
            this.player.state = 'enterdoor';
            this.player.isEnteringDoor = true;
            this.player.vx = 0;
            this.player.vy = 0;
            this.player.isRunning = false;
            this.player.targetDoorX = overlappingDoor.x + overlappingDoor.width / 2 - this.player.width / 2;
            this.player.sprite_index = 'spr_player_lookdoor';
            this.player.image_index = 0;
            this.player.image_speed = 0.45;
            this.triggerRoomTransition(overlappingDoor.targetRoom, overlappingDoor.label);
            this.clearActionKey('up'); // Prevent immediate multi-entry
            this.keys.actionUp = false;
        }

        // Hallway Transition Check
        if (!this.player.isNoClip) {
            const overlappingHallway = this.entities.find(e => 
                e.type === 'hallway' && e.targetRoom && e.targetDoor && e.targetRoom !== 'null' && e.targetDoor !== 'null' &&
                this.player.x < e.x + e.width &&
                this.player.x + this.player.width > e.x &&
                this.player.y < e.y + e.height &&
                this.player.y + this.player.height > e.y
            );
            
            if (overlappingHallway) {
                if (!this.player.insideHallway) {
                    this.triggerRoomTransition(overlappingHallway.targetRoom, overlappingHallway.targetDoor, true);
                }
            } else {
                this.player.insideHallway = false; // Left hallway, can transition again instantly
            }
        }

        this.stateInfo.innerText = `${dict['ui.state']}: ${currentStates.join(" / ")} | ${dict['ui.room']}: ${this.currentRoom}`;

        // Tutorial Book Interaction Check
        let touchingBook = false;
        let bookText = null;
        for (let i = 0; i < this.entities.length; i++) {
            const e = this.entities[i];
            if (e.type === 'tutorialbook' && !e.isDestroyed) {
                // Check distance
                const dx = (this.player.x + this.player.width/2) - (e.x + e.width/2);
                const dy = (this.player.y + this.player.height/2) - (e.y + e.height/2);
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < 150) { // proximity radius
                    touchingBook = true;
                    bookText = (typeof e.getText === 'function') ? e.getText() : e.text;
                    this.currentTutorialBook = e;
                    break;
                }
            }
        }
        
        if (touchingBook) {
            let activeText = bookText;
            if (typeof activeText === 'string') {
                const match = activeText.trim().match(/^lang_get_value\(\s*["']?([^"'\s\)]+)["']?\s*\)$/i);
                if (match && typeof window.lang_get_value === 'function') {
                    activeText = window.lang_get_value(match[1]);
                }
            }
            if (this.settings.language === 'ko') {
                const koMap = {
                    "Press  [J] to Jump!": "[J]를 눌러 점프하세요!",
                    "Press  [D] and  [L][R] to crawl!": "[D]와 [L][R]을 눌러 기어가세요!",
                    "Press [D] in midair to perform a Ground Pound!\\nCrash down with force and break the metal blocks!": "공중에서 [D]를 눌러 파운드 공격을 하세요!\\n강하게 내리찍어 블록을 파괴하세요!",
                    "Press [G] to grab objects and break blocks!": "[G]를 눌러 물건을 잡고 블록을 파괴하세요!",
                    "Press [S] to run! You can smash through blocks,\\nand if you run fast enough, you can even break steel blocks!": "[S]를 눌러 달리세요! 블록을 부수며 돌진할 수 있고,\\n충분히 빠르면 강철 블록도 파괴할 수 있습니다!",
                    "You can jump while running, and when you're against a wall\\nyou can wall-run! Press [J] to perform a wall jump!": "달리면서 점프할 수 있고, 벽에 닿았을 때\\n벽타기를 할 수 있습니다! [J]를 눌러 벽점프를 하세요!"
                };
                if (koMap[activeText]) activeText = koMap[activeText];
            }
            if (this.currentTutorialText !== activeText) {
                this.currentTutorialText = activeText;
                this.tutorialTextProgress = 0;
            }
            this.tutorialWaveTimer += 0.05;
            this.tutorialTexX -= 0.5; // scroll texture
            if (this.tutorialPatternImage.complete && this.tutorialPatternImage.width > 0) {
                // Keep negative offset within bounds of image for smooth scrolling
                if (this.tutorialTexX <= -this.tutorialPatternImage.width) {
                    this.tutorialTexX += this.tutorialPatternImage.width;
                }
            }
            this.tutorialTextProgress += 0.5; // Typing speed
        } else {
            this.currentTutorialText = null;
            this.currentTutorialBook = null;
            this.tutorialTextProgress = 0;
        }

    }

    render() {
        this.ctx.imageSmoothingEnabled = this.settings.textureFiltering;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.gameState === 'CLICK_TO_START') {
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = 'white';
            this.ctx.font = '30px "Outfit", sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            // Blinking effect
            if (Math.floor(Date.now() / 500) % 2 === 0) {
                this.ctx.fillText("Click or Press Any Key to Start", this.canvas.width / 2, this.canvas.height / 2);
            }
            return;
        }

        if (this.gameState === 'LOGO') {
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            if (this.introVideo.readyState >= 2) {
                const scale = Math.min(
                    this.canvas.width / this.introVideo.videoWidth,
                    this.canvas.height / this.introVideo.videoHeight
                );
                const w = this.introVideo.videoWidth * scale;
                const h = this.introVideo.videoHeight * scale;
                this.ctx.drawImage(this.introVideo, (this.canvas.width - w) / 2, (this.canvas.height - h) / 2, w, h);
            }
            
            if (this.introSkipPrompt) {
                const btnX = 20;
                const btnY = this.canvas.height - 50;
                const btnW = 30;
                const btnH = 30;
                const radius = 6;
                
                // Draw Z button background
                this.ctx.fillStyle = 'white';
                this.ctx.strokeStyle = 'black';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.roundRect(btnX, btnY, btnW, btnH, radius);
                this.ctx.fill();
                this.ctx.stroke();
                
                // Draw Z letter
                this.ctx.fillStyle = 'black';
                this.ctx.font = 'bold 20px "Outfit", sans-serif';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText("Z", btnX + btnW / 2, btnY + btnH / 2 + 2);
                
                // Draw Skip text
                this.ctx.fillStyle = 'white';
                this.ctx.font = 'bold 24px "Outfit", sans-serif';
                this.ctx.textAlign = 'left';
                
                // Black outline/shadow for Skip
                this.ctx.strokeStyle = 'black';
                this.ctx.lineWidth = 4;
                this.ctx.lineJoin = 'round';
                this.ctx.strokeText("Skip", btnX + btnW + 10, btnY + btnH / 2 + 2);
                this.ctx.fillText("Skip", btnX + btnW + 10, btnY + btnH / 2 + 2);
            }
            
            return;
        }

        if (this.gameState === 'BOOT_LOADING') {
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            if (this.loadingScreenLoaded) {
                let progress = this.bootLoadTimer / this.bootLoadDuration;
                this.renderLoadingScreen(progress);
            }
            return;
        }

        this.ctx.save();
        
        let shakeX = 0;
        let shakeY = 0;
        const shakeMult = (this.settings.screenShake && this.settings.shakeIntens !== undefined) ? (this.settings.shakeIntens / 100) : (this.settings.screenShake ? 1 : 0);
        if (this.gameState === 'PLAYING' && shakeMult > 0 && this.cameraShake > 0) {
            shakeX = (Math.random() - 0.5) * this.cameraShake * shakeMult;
            shakeY = (Math.random() - 0.5) * this.cameraShake * shakeMult;
        }
        
        // Render Background (Parallax layers)
        if (this.bgManager) {
            this.bgManager.render(this.ctx, this.camera, shakeX, shakeY);
        }
        
        // 카메라 위치를 반올림(Math.round)하여 소수점 픽셀로 인한 화면 전체 흐려짐(Sub-pixel blur) 방지
        this.ctx.translate(Math.round(-this.camera.x + shakeX), Math.round(-this.camera.y + shakeY));
        
        // Optimization: Pre-calculate view bounds for culling
        const viewLeft = this.camera.x - 100;
        const viewRight = this.camera.x + this.canvas.width + 100;
        const viewTop = this.camera.y - 100;
        const viewBottom = this.camera.y + this.canvas.height + 100;

        // Render in two passes to maintain layering without using .filter()
        // 1. Backgrounds (Hallways)
        for (let i = 0; i < this.entities.length; i++) {
            const e = this.entities[i];
            if (e.type === 'hallway') {
                // Frustum culling: check if entity is in view
                if (e.x + e.width > viewLeft && e.x < viewRight && 
                    e.y + e.height > viewTop && e.y < viewBottom) {
                    e.render(this.ctx);
                }
            }
        }
        
        // 1.5. Tile Layer 3 (Background Tiles - behind Tile 1)
        if (this.tileWave) {
            this.renderTileWave(viewLeft, viewRight, viewTop, viewBottom, shakeX, shakeY, 3);
        } else {
            for (let i = 0; i < this.entities.length; i++) {
                const e = this.entities[i];
                if ((e.type === 'tile' || e instanceof Tile) && e.layer === 3) {
                    if (e.x + e.width > viewLeft && e.x < viewRight && 
                        e.y + e.height > viewTop && e.y < viewBottom) {
                        e.render(this.ctx);
                    }
                }
            }
        }
        
        // 2. Tile Layer 1 (Main Tiles) & Foreground objects (Platforms, slopes, etc.)
        if (this.tileWave) {
            this.renderTileWave(viewLeft, viewRight, viewTop, viewBottom, shakeX, shakeY, 1);
            for (let i = 0; i < this.entities.length; i++) {
                const e = this.entities[i];
                if (e.type !== 'hallway' && e.type !== 'obj_debris' && e.type !== 'tile' && !(e instanceof Tile)) {
                    if (!this.showCollisions && this.isCollisionEntity(e)) continue;
                    if (e.x + e.width > viewLeft && e.x < viewRight && 
                        e.y + e.height > viewTop && e.y < viewBottom) {
                        e.render(this.ctx);
                    }
                }
            }
        } else {
            for (let i = 0; i < this.entities.length; i++) {
                const e = this.entities[i];
                if (e.type !== 'hallway' && e.type !== 'obj_debris') {
                    if (e.type === 'tile' || e instanceof Tile) {
                        if (e.layer === 2 || e.layer === 3) continue;
                    }
                    if (!this.showCollisions && this.isCollisionEntity(e)) continue;
                    if (e.x + e.width > viewLeft && e.x < viewRight && 
                        e.y + e.height > viewTop && e.y < viewBottom) {
                        e.render(this.ctx);
                    }
                }
            }
        }
        
        this.player.render(this.ctx);
        
        // Render other online players
        if (this.otherPlayers && this.player.sprites) {
            for (let id in this.otherPlayers) {
                const p = this.otherPlayers[id];
                const frames = this.player.sprites[p.sprite];
                if (frames && frames.length > 0) {
                    let frameIndex = Math.floor(p.image) % frames.length;
                    const img = frames[frameIndex];
                    
                    if (img && img.complete && img.naturalWidth > 0) {
                        this.ctx.save();
                        this.ctx.translate(p.x + this.player.width / 2, p.y + this.player.height / 2);
                        const safeDir = p.dir || 1;
                        this.ctx.scale(safeDir, 1);
                        
                        let imgToDraw = img;
                        if (this.player.paletteManager && p.palette !== 1) {
                            // Try to get original src from the loaded image object
                            const originalSrc = img.src || `Sprites/Player/${p.sprite}_${frameIndex}.png`;
                            imgToDraw = this.player.paletteManager.getTintedFrame(imgToDraw, originalSrc, p.palette);
                        }
                        
                        // Default size in player.js is -51 offset, 100x100
                        const isCrouched = (p.sprite === 'spr_player_crouch' || p.sprite === 'spr_player_tumble' || p.sprite === 'spr_player_roll');
                        const offsetY = isCrouched ? -68.5 : -57.5; // from player.js
                        if (p.sprite === 'spr_player_walkfront') {
                            const maxF = (frames && frames.length > 0) ? frames.length : 15;
                            const prog = Math.min(1.0, Math.max(0, p.image / (maxF * 0.75)));
                            const bPct = Math.round(prog * 100);
                            if (bPct < 100) this.ctx.filter = `brightness(${bPct}%)`;
                            this.ctx.drawImage(imgToDraw, -51, offsetY, 100, 100);
                            if (bPct < 100) this.ctx.filter = 'none';
                        } else {
                            this.ctx.drawImage(imgToDraw, -51, offsetY, 100, 100);
                        }
                        
                        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                        this.ctx.font = '10px Arial';
                        this.ctx.textAlign = 'center';
                        // Flip text back
                        this.ctx.scale(safeDir, 1);
                        this.ctx.fillText(p.name || ("Player " + id.substring(0, 4)), 0, -40);
                        
                        this.ctx.restore();
                    }
                }
            }
        }
        
        // 2.5. Tile Layer 2 (Foreground Tiles - in front of Tile 1 & Player)
        if (this.tileWave) {
            this.renderTileWave(viewLeft, viewRight, viewTop, viewBottom, shakeX, shakeY, 2);
        } else {
            for (let i = 0; i < this.entities.length; i++) {
                const e = this.entities[i];
                if ((e.type === 'tile' || e instanceof Tile) && e.layer === 2) {
                    if (e.x + e.width > viewLeft && e.x < viewRight && 
                        e.y + e.height > viewTop && e.y < viewBottom) {
                        e.render(this.ctx);
                    }
                }
            }
        }
        
        // 3. Particles/Effects (Debris in front of player)
        for (let i = 0; i < this.entities.length; i++) {
            const e = this.entities[i];
            if (e.type === 'obj_debris') {
                if (e.x + e.width > viewLeft && e.x < viewRight && 
                    e.y + e.height > viewTop && e.y < viewBottom) {
                    e.render(this.ctx);
                }
            }
        }

        // Render Editor Overlays
        if (this.isEditorMode) {
            this.renderEditorGuides();
        }
        
        this.ctx.restore();

        // Collision Toggle Toast Notification
        if (this.collisionToggleTimer > 0) {
            this.collisionToggleTimer -= 1 / 60;
            this.ctx.save();
            const alpha = Math.min(1.0, this.collisionToggleTimer * 2);
            this.ctx.globalAlpha = alpha;
            const text = this.showCollisions ? 'COLLISION: VISIBLE [4]' : 'COLLISION: HIDDEN [4]';
            this.ctx.font = 'bold 15px "Outfit", sans-serif';
            const metrics = this.ctx.measureText(text);
            const boxW = metrics.width + 28;
            const boxH = 32;
            const boxX = this.canvas.width / 2 - boxW / 2;
            const boxY = 24;

            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
            this.ctx.strokeStyle = this.showCollisions ? '#00ffcc' : '#ff4444';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            if (this.ctx.roundRect) {
                this.ctx.roundRect(boxX, boxY, boxW, boxH, 8);
            } else {
                this.ctx.rect(boxX, boxY, boxW, boxH);
            }
            this.ctx.fill();
            this.ctx.stroke();

            this.ctx.fillStyle = this.showCollisions ? '#00ffcc' : '#ff8888';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(text, this.canvas.width / 2, boxY + boxH / 2);
            this.ctx.restore();
        }

        // Flip Tile Toast Notification
        if (this.flipToastTimer > 0) {
            this.flipToastTimer -= 1 / 60;
            this.ctx.save();
            const alpha = Math.min(1.0, this.flipToastTimer * 2);
            this.ctx.globalAlpha = alpha;
            const text = this.flipToastMsg || 'TILE FLIPPED';
            this.ctx.font = 'bold 15px "Outfit", sans-serif';
            const metrics = this.ctx.measureText(text);
            const boxW = metrics.width + 28;
            const boxH = 32;
            const boxX = this.canvas.width / 2 - boxW / 2;
            const boxY = this.collisionToggleTimer > 0 ? 64 : 24;

            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
            this.ctx.strokeStyle = '#00e5ff';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            if (this.ctx.roundRect) {
                this.ctx.roundRect(boxX, boxY, boxW, boxH, 8);
            } else {
                this.ctx.rect(boxX, boxY, boxW, boxH);
            }
            this.ctx.fill();
            this.ctx.stroke();

            this.ctx.fillStyle = '#00e5ff';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(text, this.canvas.width / 2, boxY + boxH / 2);
            this.ctx.restore();
        }

        // Update Palette UI Alpha
        if (this.paletteUIActive) {
            this.paletteUIAlpha = Math.min(1, (this.paletteUIAlpha || 0) + 0.15);
        } else {
            this.paletteUIAlpha = Math.max(0, (this.paletteUIAlpha || 0) - 0.15);
        }
        this.paletteUIActive = false; // Reset for next frame

        // Draw HUD Elements
        if (this.paletteUIAlpha > 0) {
            this.ctx.save();
            this.ctx.globalAlpha = this.paletteUIAlpha;
            const cx = this.canvas.width / 2;
            const cy = 100;
            if (this.paletteUIDesc) {
                this.drawCreditsText(this.ctx, this.paletteUIDesc, cx, cy, true, 1.0);
            }
            if (this.paletteUIName) {
                this.drawCreditsText(this.ctx, this.paletteUIName, cx, cy + 40, true, 1.0);
            }
            this.ctx.restore();
        }

        // Draw Chat Messages
        if (this.chatMessages && this.chatMessages.length > 0 && (this.isOnline() || this.chatMessages.some(m => m.sender === 'SERVER'))) {
            this.ctx.save();
            this.ctx.textAlign = 'left';
            
            // Background box for chat
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(5, this.canvas.height - 100, 300, 90);
            
            let cy = this.canvas.height - 85;
            for (let i = 0; i < this.chatMessages.length; i++) {
                const msg = this.chatMessages[i];
                const alpha = Math.min(1.0, msg.timer / 30);
                this.ctx.globalAlpha = alpha;
                
                // Draw sender name
                this.ctx.fillStyle = msg.sender === 'SERVER' ? '#FFFF00' : '#00FFFF';
                this.ctx.font = 'bold 12px Arial';
                this.ctx.fillText(msg.sender + ":", 10, cy);
                
                // Draw message
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.font = '12px Arial';
                this.ctx.fillText(msg.text, 10 + this.ctx.measureText(msg.sender + ": ").width, cy);
                
                cy += 16;
            }
            this.ctx.restore();
        }

        if (this.gameState === 'ONLINE_MENU') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Draw "ONLINE" scrolling background text
            this.ctx.globalAlpha = 0.2;
            const scroll = (performance.now() / 20) % 300;
            for (let i = -1; i < 5; i++) {
                for (let j = -1; j < 5; j++) {
                    this.drawCreditsText(this.ctx, "ONLINE", i * 300 - scroll, j * 150 + scroll, false, 1.5);
                }
            }
            this.ctx.globalAlpha = 1.0;
            
            const opts = this.onlineMenuOptions[this.onlineMenuLevel];
            for (let i = 0; i < opts.length; i++) {
                const y = this.canvas.height / 2 - (opts.length * 60) / 2 + i * 60;
                if (i === this.onlineMenuIndex) {
                    this.drawCreditsText(this.ctx, opts[i], this.canvas.width / 2, y, true, 1.2);
                } else {
                    this.ctx.globalAlpha = 0.5;
                    this.drawCreditsText(this.ctx, opts[i], this.canvas.width / 2, y, true, 1.0);
                    this.ctx.globalAlpha = 1.0;
                }
            }
        }

        if (this.gameState === 'PAUSED' && this.bigFontLoaded) {
            // Post-processing: Wave + Color Bleed + Darken
            if (!this.pauseCanvas) {
                this.pauseCanvas = document.createElement('canvas');
                this.pauseCanvas.width = this.canvas.width;
                this.pauseCanvas.height = this.canvas.height;
                this.pauseCtx = this.pauseCanvas.getContext('2d');
            }
            this.pauseCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.pauseCtx.drawImage(this.canvas, 0, 0);

            // Clear main canvas to black
            this.ctx.fillStyle = 'black';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            const time = Date.now() / 1200; // Slower wave speed
            const stripHeight = 4;
            
            // Pass 1: Base wave
            this.ctx.globalAlpha = 1.0;
            for (let y = 0; y < this.canvas.height; y += stripHeight) {
                const waveX = Math.sin(y * 0.015 + time) * 8;
                this.ctx.drawImage(this.pauseCanvas, 0, y, this.canvas.width, stripHeight, waveX, y, this.canvas.width, stripHeight);
            }
            
            // Pass 2: Glitch / Bleed (Shifted horizontally)
            this.ctx.globalCompositeOperation = 'lighter';
            this.ctx.globalAlpha = 0.4;
            for (let y = 0; y < this.canvas.height; y += stripHeight) {
                const waveX = Math.sin(y * 0.015 + time) * 8;
                this.ctx.drawImage(this.pauseCanvas, 0, y, this.canvas.width, stripHeight, waveX - 6, y, this.canvas.width, stripHeight);
                this.ctx.drawImage(this.pauseCanvas, 0, y, this.canvas.width, stripHeight, waveX + 6, y, this.canvas.width, stripHeight);
            }
            
            // Restore context state and Darken
            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.globalAlpha = 1.0;
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; // Darken overlay
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            // Dark background mask and bubbles removed as requested by user

            const drawText = (text, x, y, scale = 1, alpha = 1, center = true) => {
                let cursorX = x;
                if (typeof text !== 'string') text = String(text);
                this.ctx.globalAlpha = alpha;
                
                // If text contains Korean characters, use pixelated Custom_Jejudoldam font
                const hasKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(text);
                if (hasKorean) {
                    const fontSize = Math.round(42 * scale);
                    const strokeWidth = 2;
                    const pixelated = this.getPixelatedTextCanvas(text, 'Custom_Jejudoldam', fontSize, strokeWidth);
                    const drawX = center ? (cursorX - pixelated.textWidth / 2 - pixelated.padding) : (cursorX - pixelated.padding);
                    const drawY = y - pixelated.padding - Math.round(2 * scale);
                    this.ctx.save();
                    this.ctx.imageSmoothingEnabled = false;
                    this.ctx.drawImage(pixelated.canvas, Math.round(drawX), Math.round(drawY));
                    this.ctx.restore();
                    this.ctx.globalAlpha = 1;
                    return;
                }
                text = text.toUpperCase();
                
                // Calculate width for centering
                if (center) {
                    let totalWidth = 0;
                    for (let i = 0; i < text.length; i++) {
                        const char = text[i];
                        if (char === ' ') totalWidth += 10 * scale;
                        else {
                            const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ!¡¿?.1234567890:+";
                            const charCode = charset.indexOf(char);
                            
                            if (charCode >= 0 && charCode < 67 && this.bigFontImages[charCode] && this.bigFontImages[charCode].complete) {
                                totalWidth += (this.bigFontImages[charCode].naturalWidth - 8) * scale;
                            }
                        }
                    }
                    cursorX -= totalWidth / 2;
                }

                for (let i = 0; i < text.length; i++) {
                    const char = text[i];
                    if (char === ' ') {
                        cursorX += 10 * scale;
                        continue;
                    }
                    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ!¡¿?.1234567890:+";
                    const charCode = charset.indexOf(char);

                    if (charCode >= 0 && charCode < 67 && this.bigFontImages[charCode] && this.bigFontImages[charCode].complete) {
                        const img = this.bigFontImages[charCode];
                        if (img.naturalWidth > 0) {
                            this.ctx.drawImage(img, cursorX, y, img.naturalWidth * scale, img.naturalHeight * scale);
                            cursorX += (img.naturalWidth - 8) * scale;
                        }
                    }
                }
                this.ctx.globalAlpha = 1;
            };

            if (this.pauseMenuLevel === 'PALETTE') {
                const startX = this.canvas.width / 2 + 150;
                const startY = this.canvas.height / 2;
                let opt = (this.settings.language === 'ko' ? '팔레트 ' : 'PALETTE ') + (this.previewPalette || 0) + '/16';
                drawText(opt, startX, startY, 1, 1);
            } else {
            const startX = this.canvas.width / 2 + 150;
            const startY = this.canvas.height / 2 - 120;
            const lineSpace = 60;

            for (let i = 0; i < this.pauseMenuOptions.length; i++) {
                let opt = this.pauseMenuOptions[i];
                const y = startY + i * lineSpace;
                const isSelected = i === this.pauseMenuIndex;
                const displayText = this.getMenuLabel(opt);
                
                // Draw text
                if (isSelected) {
                    drawText(displayText, startX + 20, y, 1, 1);
                    // Draw arrow manually
                    this.ctx.fillStyle = 'white';
                    this.ctx.beginPath();
                    this.ctx.moveTo(startX, y + 25);
                    this.ctx.lineTo(startX + 15, y + 25);
                    this.ctx.lineTo(startX + 15, y + 15);
                    this.ctx.lineTo(startX + 25, y + 30);
                    this.ctx.lineTo(startX + 15, y + 45);
                    this.ctx.lineTo(startX + 15, y + 35);
                    this.ctx.lineTo(startX, y + 35);
                    this.ctx.closePath();
                    this.ctx.fill();
                } else {
                    drawText(displayText, startX + 20, y, 1, 0.5);
                }
            }
            }
        } else if (this.gameState === 'OPTIONS' && this.bigFontLoaded) {
            if (this.optionsBGLoaded) {
                let bgIndex = 0;
                if (this.optionsMenuLevel === 'AUDIO') bgIndex = 1;
                else if (this.optionsMenuLevel === 'VIDEO') bgIndex = 2;
                else if (this.optionsMenuLevel === 'GAME') bgIndex = 3;
                else if (this.optionsMenuLevel === 'CONTROLS') bgIndex = 4;
                else if (this.optionsMenuLevel === 'KEYBOARD' || this.optionsMenuLevel === 'BINDINGS') bgIndex = 4; // Use CONTROLS background
                else if (this.optionsMenuLevel === 'LANGUAGE') bgIndex = 0; // Use main options background

                const baseBg = this.optionsBGImages[bgIndex];
                if (baseBg && baseBg.complete && baseBg.naturalWidth > 0) {
                    const w = baseBg.naturalWidth;
                    const h = baseBg.naturalHeight;
                    
                    let offsetX = this.optionsScrollX % w;
                    let offsetY = this.optionsScrollY % h;
                    if (offsetX > 0) offsetX -= w;
                    if (offsetY > 0) offsetY -= h;
                    
                    for (let x = offsetX - w; x < this.canvas.width; x += w) {
                        for (let y = offsetY - h; y < this.canvas.height; y += h) {
                            this.ctx.drawImage(baseBg, x, y, w, h);
                        }
                    }
                } else {
                    this.ctx.fillStyle = '#657b54'; 
                    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                }
            } else {
                this.ctx.fillStyle = '#657b54';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            }

            const drawText = (text, x, y, scale = 1, alpha = 1, center = true) => {
                let cursorX = x;
                if (typeof text !== 'string') text = String(text);
                this.ctx.globalAlpha = alpha;
                
                // If text contains Korean characters, use pixelated Custom_Jejudoldam font
                const hasKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(text);
                if (hasKorean) {
                    const fontSize = Math.round(42 * scale);
                    const strokeWidth = 2;
                    const pixelated = this.getPixelatedTextCanvas(text, 'Custom_Jejudoldam', fontSize, strokeWidth);
                    const drawX = center ? (cursorX - pixelated.textWidth / 2 - pixelated.padding) : (cursorX - pixelated.padding);
                    const drawY = y - pixelated.padding - Math.round(2 * scale);
                    this.ctx.save();
                    this.ctx.imageSmoothingEnabled = false;
                    this.ctx.drawImage(pixelated.canvas, Math.round(drawX), Math.round(drawY));
                    this.ctx.restore();
                    this.ctx.globalAlpha = 1;
                    return;
                }
                const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ!¡¿?.1234567890:+";

                if (center) {
                    let totalWidth = 0;
                    for (let i = 0; i < text.length; i++) {
                        const char = text[i];
                        if (char === ' ') totalWidth += 10 * scale;
                        else {
                            const charCode = charset.indexOf(char);
                            if (charCode >= 0 && charCode < 67 && this.bigFontImages[charCode] && this.bigFontImages[charCode].complete && this.bigFontImages[charCode].naturalWidth > 0) {
                                totalWidth += (this.bigFontImages[charCode].naturalWidth - 8) * scale;
                            } else {
                                const fontSize = Math.round(28 * scale);
                                const pixelated = this.getPixelatedTextCanvas(char, 'Custom_Jejudoldam', fontSize, 2);
                                totalWidth += pixelated.textWidth + (2 * scale);
                            }
                        }
                    }
                    cursorX -= totalWidth / 2;
                }

                for (let i = 0; i < text.length; i++) {
                    const char = text[i];
                    if (char === ' ') {
                        cursorX += 10 * scale;
                        continue;
                    }
                    const charCode = charset.indexOf(char);
                    
                    if (charCode >= 0 && charCode < 67 && this.bigFontImages[charCode] && this.bigFontImages[charCode].complete && this.bigFontImages[charCode].naturalWidth > 0) {
                        const img = this.bigFontImages[charCode];
                        this.ctx.drawImage(img, cursorX, y, img.naturalWidth * scale, img.naturalHeight * scale);
                        cursorX += (img.naturalWidth - 8) * scale;
                    } else {
                        const fontSize = Math.round(28 * scale);
                        const pixelated = this.getPixelatedTextCanvas(char, 'Custom_Jejudoldam', fontSize, 2);
                        this.ctx.save();
                        this.ctx.imageSmoothingEnabled = false;
                        this.ctx.drawImage(pixelated.canvas, Math.round(cursorX - pixelated.padding), Math.round(y - pixelated.padding + 2 * scale));
                        this.ctx.restore();
                        cursorX += pixelated.textWidth + (2 * scale);
                    }
                }
                this.ctx.globalAlpha = 1;
            };

            const startX = this.canvas.width / 2;
            const startY = this.canvas.height / 2 - 100;
            const lineSpace = 40;

            let currentOptions = [];
            if (this.optionsMenuLevel === 'MAIN') currentOptions = this.optionsMenuOptions;
            else if (this.optionsMenuLevel === 'AUDIO') currentOptions = ['BACK', 'MASTER', 'MUSIC', 'SFX', 'UNFOCUS MUTE'];
            else if (this.optionsMenuLevel === 'VIDEO') currentOptions = ['BACK', 'WINDOW MODE', 'RESOLUTION', 'VSYNC', 'TEXTURE FILTERING', 'HIDE HUD'];
            else if (this.optionsMenuLevel === 'GAME') currentOptions = ['BACK', 'SHAKE INTENS', 'TIMER'];
            else if (this.optionsMenuLevel === 'CONTROLS') currentOptions = ['BACK', 'KEYBOARD', 'CONTROLLER', 'RESET CONFIG'];
            else if (this.optionsMenuLevel === 'KEYBOARD') currentOptions = ['BACK', (('ontouchstart' in window) || navigator.maxTouchPoints > 0) ? 'MOBILE LAYOUT' : 'BINDINGS', 'DIR SUPERJUMP', 'DIR GROUNDPOUND'];
            else if (this.optionsMenuLevel === 'BINDINGS') currentOptions = ['BACK', 'UP', 'DOWN', 'LEFT', 'RIGHT', 'JUMP', 'GRAB', 'DASH', 'SUPERJUMP', 'GROUNDPOUND', 'TAUNT', 'PAUSE', 'MENU LEFT', 'MENU RIGHT', 'MENU UP', 'MENU DOWN', 'MENU CONFIRM', 'MENU BACK', 'MENU CLEAR'];
            else if (this.optionsMenuLevel === 'WINDOW MODE') currentOptions = ['BACK', 'WINDOWED', 'FULLSCREEN', 'BORDERLESS'];
            else if (this.optionsMenuLevel === 'LANGUAGE') currentOptions = ['BACK', this.settings.language === 'ko' ? '<- 한국어 ->' : '<- ENGLISH ->'];

            if (this.optionsMenuLevel === 'BINDINGS') {
                const targetScrollY = (this.optionsMenuIndex > 0 ? (this.optionsMenuIndex - 1) : 0) * lineSpace;
                this.bindingsScrollY += (targetScrollY - this.bindingsScrollY) * 0.2;
            }

            for (let i = 0; i < currentOptions.length; i++) {
                const opt = currentOptions[i];
                let y = startY + i * lineSpace;
                const isSelected = i === this.optionsMenuIndex;
                
                if (this.optionsMenuLevel === 'BINDINGS') {
                    if (opt === 'BACK') {
                        drawText(this.getMenuLabel('BACK'), startX - 350, startY - 100, 1, isSelected ? 1 : 0.5, false);
                        if (i === 0) {
                            const drawInstruction = (keyChar, textStr, x, y) => {
                                if (this.tutorialBlankKeyLoaded) {
                                    const bImg = this.tutorialBlankKeyImage;
                                    this.ctx.drawImage(bImg, x, y - 20);
                                    const charset = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZabcdefghijklmnñopqrstuvwxyz!¡,.:0123456789?¿-"';
                                    const charIdx = charset.indexOf(keyChar);
                                    if (charIdx !== -1 && this.tutorialFontImages[charIdx]) {
                                        const imgToDraw = this.tutorialFontImages[charIdx];
                                        const kx = x + bImg.width/2 - (imgToDraw.width - 4)/2;
                                        const ky = y - 28;
                                        this.ctx.drawImage(imgToDraw, kx, ky);
                                    } else {
                                        this.ctx.fillStyle = '#000000';
                                        this.ctx.font = 'bold 14px "Outfit", sans-serif';
                                        this.ctx.textAlign = 'center';
                                        this.ctx.textBaseline = 'middle';
                                        this.ctx.fillText(keyChar, x + bImg.width/2, y - 4);
                                    }
                                } else {
                                    drawText(keyChar, x, y, 0.8, 1, false);
                                }
                                drawText(this.getMenuLabel(textStr), x + 50, y, 0.8, 1, false);
                            };
                            drawInstruction('1', 'RESET BINDS', startX - 350, this.canvas.height - 180);
                            drawInstruction('Z', 'ADD BIND', startX - 350, this.canvas.height - 130);
                            drawInstruction('C', 'CLEAR BINDS', startX - 350, this.canvas.height - 80);
                        }
                        continue;
                    }

                    y -= this.bindingsScrollY;
                    let optStr = opt.toLowerCase().replace(' ', '_');
                    let drawCenter = startX - 50;
                    
                    if (this.controlIcons && this.controlIcons[optStr] && this.controlIcons[optStr].complete && this.controlIcons[optStr].naturalWidth > 0) {
                        this.ctx.globalAlpha = isSelected ? 1 : 0.5;
                        const icon = this.controlIcons[optStr];
                        this.ctx.drawImage(icon, drawCenter - icon.naturalWidth/2, y - icon.naturalHeight/2);
                        this.ctx.globalAlpha = 1;
                    } else {
                        drawText(this.getMenuLabel(opt), drawCenter, y, 1, isSelected ? 1 : 0.5, true);
                    }

                                        const renderBoundKey = (boundKeyVal, isBindingThis, colIndex) => {
                        if (boundKeyVal || isBindingThis) {
                            let displayKey = isBindingThis ? '' : boundKeyVal;
                            if (displayKey.startsWith('Arrow')) {
                                const arr = {'ArrowUp':'UP', 'ArrowDown':'DOWN', 'ArrowLeft':'LEFT', 'ArrowRight':'RIGHT'};
                                displayKey = arr[displayKey] || displayKey.replace('Arrow', '').toUpperCase();
                            } else if (displayKey === ' ') displayKey = 'SPACE';
                            else displayKey = displayKey.toUpperCase();
                            
                            let tX = drawCenter + 150 + (colIndex * 40);
                            let tY = y - 6;
                            this.ctx.globalAlpha = (isSelected && this.optionsMenuCol === colIndex) ? 1 : 0.4;

                            let specialImg = this.getKeyImage(displayKey);
                            
                            if (specialImg && specialImg.loaded && !specialImg.error) {
                                this.ctx.drawImage(specialImg, tX, tY);
                            } else if (this.tutorialBlankKeyLoaded) {
                                const bImg = this.tutorialBlankKeyImage;
                                this.ctx.drawImage(bImg, tX, tY);
                                
                                const charset = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZabcdefghijklmnñopqrstuvwxyz!¡,.:0123456789?¿-"`';
                                let textW = 0;
                                for (let k = 0; k < displayKey.length; k++) {
                                    const charIdx = charset.indexOf(displayKey[k]);
                                    if (displayKey[k] === ' ') textW += 16;
                                    else if (charIdx !== -1 && this.tutorialFontImages[charIdx]) {
                                        textW += this.tutorialFontImages[charIdx].width - 4;
                                    } else textW += 14;
                                }
                                
                                let kx = tX + bImg.width/2 - textW/2;
                                const ky = tY - 8;
                                
                                for (let k = 0; k < displayKey.length; k++) {
                                    const charIdx = charset.indexOf(displayKey[k]);
                                    if (displayKey[k] === ' ') {
                                        kx += 16;
                                    } else if (charIdx !== -1 && this.tutorialFontImages[charIdx]) {
                                        const imgToDraw = this.tutorialFontImages[charIdx];
                                        this.ctx.drawImage(imgToDraw, kx, ky);
                                        kx += imgToDraw.width - 4;
                                    } else {
                                        this.ctx.fillStyle = '#000000';
                                        this.ctx.font = 'bold 14px "Outfit", sans-serif';
                                        this.ctx.textAlign = 'left';
                                        this.ctx.textBaseline = 'middle';
                                        this.ctx.fillText(displayKey[k], kx, tY + bImg.height/2);
                                        kx += 14;
                                    }
                                }
                            } else {
                                drawText(`[${displayKey}]`, tX, y, 0.8, (isSelected && this.optionsMenuCol === colIndex) ? 1 : 0.4, false);
                            }
                            this.ctx.globalAlpha = 1;
                        } else {
                            let tX = drawCenter + 150 + (colIndex * 40);
                            drawText(`[---]`, tX, y, 0.8, (isSelected && this.optionsMenuCol === colIndex) ? 1 : 0.4, false);
                        }
                    };

                    const boundKey1 = this.settings.bindings[optStr];
                    const boundKey2 = this.settings.bindings_2 ? this.settings.bindings_2[optStr] : '';
                    renderBoundKey(boundKey1, this.bindingKeyFor === optStr && this.bindingColFor === 0, 0);
                    renderBoundKey(boundKey2, this.bindingKeyFor === optStr && this.bindingColFor === 1, 1);

                    continue;
                }
                
                if (this.optionsMenuLevel === 'LANGUAGE') {
                    const isBack = opt === 'BACK';
                    const yPos = startY + (i === 0 ? 0 : 50);
                    const langStr = this.settings.language === 'ko' ? '<- 한국어 ->' : '<- ENGLISH ->';
                    const textToDraw = isBack ? this.getMenuLabel('BACK') : langStr;
                    drawText(textToDraw, startX, yPos, 1, isSelected ? 1 : 0.5, true);
                    continue;
                }
                
                const isMain = this.optionsMenuLevel === 'MAIN';
                let textX = isMain ? startX : startX - 250;
                const optText = this.getMenuLabel(opt);
                
                if (isSelected) {
                    drawText(optText, textX, y, 1, 1, isMain);
                } else {
                    drawText(optText, textX, y, 1, 0.5, isMain);
                }

                // Draw setting value on the right
                const valX = startX + 250;
                let valueText = null;
                let sliderValue = null; // 0 to 1
                
                if (opt === 'MASTER') sliderValue = this.settings.masterVolume / 100;
                if (opt === 'MUSIC') sliderValue = this.settings.musicVolume / 100;
                if (opt === 'SFX') sliderValue = this.settings.sfxVolume / 100;
                if (opt === 'SHAKE INTENS') sliderValue = this.settings.shakeIntens / 100;
                
                if (opt === 'UNFOCUS MUTE') valueText = this.settings.unfocusedMute ? 'ON' : 'OFF';
                if (opt === 'WINDOW MODE') valueText = this.settings.windowMode;
                if (opt === 'RESOLUTION') valueText = this.settings.resolutions[this.settings.resolutionIndex];
                if (opt === 'VSYNC') valueText = this.settings.vsync ? 'ON' : 'OFF';
                if (opt === 'TEXTURE FILTERING') valueText = this.settings.textureFiltering ? 'ON' : 'OFF';
                if (opt === 'HIDE HUD') valueText = this.settings.hideHud ? 'ON' : 'OFF';
                if (opt === 'TIMER') valueText = this.settings.timer ? 'ON' : 'OFF';
                if (opt === 'DIR SUPERJUMP') valueText = this.settings.dirSuperjump ? 'ON' : 'OFF';
                if (opt === 'DIR GROUNDPOUND') valueText = this.settings.dirGroundpound ? 'ON' : 'OFF';
                
                const alpha = isSelected ? 1 : 0.5;
                if (valueText !== null) {
                    drawText(this.getMenuLabel(valueText), valX, y, 1, alpha, false);
                } else if (sliderValue !== null) {
                    this.ctx.globalAlpha = alpha;
                    if (this.sliderTrackImg.loaded && this.sliderThumbImg.loaded) {
                        const track = this.sliderTrackImg;
                        const thumb = this.sliderThumbImg;
                        // Draw track centered vertically with text
                        this.ctx.drawImage(track, valX, y + 15 - track.height/2);
                        // The track's visual length starts at 6px and ends at 218px
                        const visualTrackStart = valX + 6;
                        const visualTrackEnd = valX + 218;
                        const movableW = visualTrackEnd - visualTrackStart;
                        // Calculate thumb visual center along the track
                        const thumbVisualTargetX = visualTrackStart + (movableW * sliderValue);
                        // The face's visual center in the thumb image is at X=53.5
                        const thumbX = thumbVisualTargetX - 53.5;
                        const thumbY = y + 15 - thumb.height/2 - 8; // Offset by 8px to account for image padding
                        this.ctx.drawImage(thumb, thumbX, thumbY);
                    } else {
                        // Fallback
                        this.ctx.fillStyle = 'white';
                        this.ctx.fillRect(valX, y + 20, 200, 10);
                        this.ctx.fillStyle = '#657b54';
                        this.ctx.fillRect(valX + (200 * sliderValue) - 10, y + 10, 20, 30);
                        this.ctx.strokeStyle = 'white';
                        this.ctx.lineWidth = 2;
                        this.ctx.strokeRect(valX + (200 * sliderValue) - 10, y + 10, 20, 30);
                    }
                    this.ctx.globalAlpha = 1;
                }
            }
            if (this.bindingKeyFor) {
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                const pressPrompt = this.getMenuLabel('PRESS ANY KEY');
                const revertPrompt = this.settings.language === 'ko' ? (this.bindingTimeout + '초 후 되돌림...') : ('GOING BACK IN... ' + this.bindingTimeout);
                drawText(pressPrompt, this.canvas.width / 2, this.canvas.height / 2 - 20, 1, 1, true);
                drawText(revertPrompt, this.canvas.width / 2, this.canvas.height / 2 + 40, 1, 1, true);
            }
        }

        // Draw Score (Pizza Tower Style)
        if (this.score !== undefined) {
            this.ctx.save();
            const scoreX = 130;
            const scoreY = 70;
            const radiusX = 100;
            const radiusY = 30;
            
            // Bottom crust (thick 3D edge)
            this.ctx.fillStyle = '#9b2200'; // dark red/orange bottom
            this.ctx.beginPath();
            this.ctx.ellipse(scoreX, scoreY + 12, radiusX + 6, radiusY + 6, 0, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.lineWidth = 3;
            this.ctx.strokeStyle = '#000000';
            this.ctx.stroke();

            // Main crust
            this.ctx.fillStyle = '#e86b24'; // orange crust
            this.ctx.beginPath();
            this.ctx.ellipse(scoreX, scoreY, radiusX + 6, radiusY + 6, 0, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();

            // Inner cheese
            this.ctx.fillStyle = '#fcd051'; // yellow cheese
            this.ctx.beginPath();
            this.ctx.ellipse(scoreX, scoreY, radiusX - 4, radiusY - 4, 0, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
            
            // Text
            const scoreStr = this.score.toString();
            this.ctx.font = 'bold 50px "Impact", "Outfit", sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            for (let i = 0; i < scoreStr.length; i++) {
                let char = scoreStr[i];
                let bounceY = Math.sin((Date.now() / 150) + i) * 6;
                // Calculate position to center the text string
                let cX = scoreX - (scoreStr.length * 14) + (i * 28) + 14; 
                
                // Black outline
                this.ctx.lineWidth = 8;
                this.ctx.strokeStyle = '#000000';
                this.ctx.lineJoin = 'round';
                this.ctx.strokeText(char, cX, scoreY - 20 + bounceY);
                
                // Shadow / bottom highlight inside text
                this.ctx.fillStyle = '#783820'; // dark brown shadow
                this.ctx.fillText(char, cX, scoreY - 17 + bounceY);
                
                // Main text color
                this.ctx.fillStyle = '#db8449'; // light brown/orange
                this.ctx.fillText(char, cX, scoreY - 20 + bounceY);
            }
            this.ctx.restore();
        }
        
        // Draw Floating Texts
        if (this.floatingTexts) {
            this.ctx.save();
            this.ctx.globalAlpha = 1.0; // The floating text alpha is handled by ctx.globalAlpha
            for (let ft of this.floatingTexts) {
                this.ctx.globalAlpha = Math.max(0, ft.alpha);
                
                // Use credits font for floating text
                const textStr = ft.text.toString();
                
                // Calculate total width with tighter spacing
                let totalW = 0;
                const kerning = -16; // Much tighter spacing
                let charImages = [];
                for (let i = 0; i < textStr.length; i++) {
                    const charIdx = this.creditsFontMap.indexOf(textStr[i]);
                    if (charIdx !== -1 && this.creditsFontImages[charIdx]) {
                        const img = this.creditsFontImages[charIdx];
                        charImages.push(img);
                        totalW += (img.width || 30) + kerning; 
                    } else {
                        charImages.push(null);
                        totalW += 30 + kerning;
                    }
                }
                
                if (textStr.length > 0) totalW -= kerning;
                
                let screenX = ft.x - this.camera.x;
                let screenY = ft.y - this.camera.y;
                let startX = screenX - totalW / 2;
                
                for (let i = 0; i < textStr.length; i++) {
                    const img = charImages[i];
                    if (img && img.complete) {
                        this.ctx.drawImage(img, startX, screenY - img.height / 2);
                        startX += img.width + kerning;
                    } else {
                        // Fallback text drawing if image isn't loaded or character isn't mapped
                        this.ctx.font = 'bold 36px "Outfit", sans-serif';
                        this.ctx.fillStyle = `rgba(255, 215, 0, 1.0)`;
                        this.ctx.textAlign = 'left';
                        this.ctx.textBaseline = 'middle';
                        this.ctx.fillText(textStr[i], startX, screenY);
                        startX += 30 + kerning;
                    }
                }
            }
            this.ctx.restore();
        }

        // Draw combo
        if (this.combo > 0) {
            this.ctx.save();
            this.ctx.textAlign = 'right';
            
            // Wiggle effect based on timer
            const wiggleX = Math.sin(Date.now() / 50) * 2;
            const wiggleY = Math.cos(Date.now() / 50) * 2;
            
            this.ctx.translate(this.canvas.width - 50 + wiggleX, 150 + wiggleY);
            
            this.ctx.fillStyle = '#ff0000';
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 4;
            this.ctx.font = 'bold 32px Arial';
            
            const comboText = `${this.combo} COMBO!`;
            this.ctx.strokeText(comboText, 0, 0);
            this.ctx.fillText(comboText, 0, 0);
            
            // Draw combo timer bar
            const barWidth = 150;
            const barHeight = 10;
            const timerRatio = this.comboTimer / 60;
            
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(-barWidth, 15, barWidth, barHeight);
            
            this.ctx.fillStyle = `hsl(${timerRatio * 120}, 100%, 50%)`;
            this.ctx.fillRect(-barWidth, 15, barWidth * timerRatio, barHeight);
            
            this.ctx.restore();
        }

        // Draw Tutorial Book Banner UI
        if (this.currentTutorialText && this.gameState === 'PLAYING') {
            let processedText = this.currentTutorialText.replace(/\\n/g, '\n');
            const waveX = Math.sin(this.tutorialWaveTimer * 0.8) * 5;
            const bWidth = this.canvas.width - 128;
            const startX = 64 + waveX + 45;
            const maxTextWidth = bWidth - 90;
            const lines = this.layoutTutorialText(processedText, maxTextWidth);
            const totalLines = lines.length;
            const lineHeight = 36;
            const bHeight = Math.max(150, totalLines * lineHeight + 50);
            const bX = 64 + waveX;
            const bY = 50 + Math.sin(this.tutorialWaveTimer) * 10;
            
            // Draw rope
            if (this.tutorialRopeImage.complete && this.tutorialRopeImage.width > 0) {
                // Rope at 64 and width-64 from screen edges
                this.ctx.drawImage(this.tutorialRopeImage, 64 + waveX, -50, 16, bY + 50);
                this.ctx.drawImage(this.tutorialRopeImage, this.canvas.width - 64 - 16 + waveX, -50, 16, bY + 50);
            }
            
            // Draw background pattern (masked)
            if (this.tutorialPatternImage.complete && this.tutorialMaskImage.complete && this.tutorialBorderImage.complete) {
                if (!this.tutorialOffscreenCanvas) {
                    this.tutorialOffscreenCanvas = document.createElement('canvas');
                    this.tutorialOffscreenCtx = this.tutorialOffscreenCanvas.getContext('2d');
                }
                
                if (this.tutorialOffscreenCanvas.width !== bWidth || this.tutorialOffscreenCanvas.height !== bHeight) {
                    this.tutorialOffscreenCanvas.width = bWidth;
                    this.tutorialOffscreenCanvas.height = bHeight;
                }
                
                const offCtx = this.tutorialOffscreenCtx;
                offCtx.clearRect(0, 0, bWidth, bHeight);
                
                const draw9Slice = (ctx, img, dx, dy, dw, dh) => {
                    const sw = img.width;
                    const sh = img.height;
                    const cX = Math.min(16, Math.floor(sw / 2));
                    const cY = Math.min(16, Math.floor(sh / 2));
                    const mSw = Math.max(0, sw - cX * 2);
                    const mSh = Math.max(0, sh - cY * 2);
                    const mDw = Math.max(0, dw - cX * 2);
                    const mDh = Math.max(0, dh - cY * 2);
                    if (mSw > 0 && mSh > 0 && mDw > 0 && mDh > 0) {
                        ctx.drawImage(img, 0, 0, cX, cY, dx, dy, cX, cY);
                        ctx.drawImage(img, cX, 0, mSw, cY, dx + cX, dy, mDw, cY);
                        ctx.drawImage(img, sw - cX, 0, cX, cY, dx + dw - cX, dy, cX, cY);
                        ctx.drawImage(img, 0, cY, cX, mSh, dx, dy + cY, cX, mDh);
                        ctx.drawImage(img, cX, cY, mSw, mSh, dx + cX, dy + cY, mDw, mDh);
                        ctx.drawImage(img, sw - cX, cY, cX, mSh, dx + dw - cX, dy + cY, cX, mDh);
                        ctx.drawImage(img, 0, sh - cY, cX, cY, dx, dy + dh - cY, cX, cY);
                        ctx.drawImage(img, cX, sh - cY, mSw, cY, dx + cX, dy + dh - cY, mDw, cY);
                        ctx.drawImage(img, sw - cX, sh - cY, cX, cY, dx + dw - cX, dy + dh - cY, cX, cY);
                    } else {
                        ctx.drawImage(img, dx, dy, dw, dh);
                    }
                };

                // Draw mask sprite 9-sliced
                offCtx.globalCompositeOperation = 'source-over';
                draw9Slice(offCtx, this.tutorialMaskImage, 0, 0, bWidth, bHeight);
                
                // Draw scrolling pattern masked to the bubble
                offCtx.globalCompositeOperation = 'source-in';
                const pat = offCtx.createPattern(this.tutorialPatternImage, 'repeat');
                offCtx.fillStyle = pat;
                offCtx.save();
                offCtx.translate(this.tutorialTexX, this.tutorialTexX);
                offCtx.fillRect(-this.tutorialTexX, -this.tutorialTexX, bWidth + 64, bHeight + 64);
                offCtx.restore();
                
                // Draw border sprite 9-sliced on top
                offCtx.globalCompositeOperation = 'source-over';
                draw9Slice(offCtx, this.tutorialBorderImage, 0, 0, bWidth, bHeight);
                
                // Draw onto main canvas
                this.ctx.drawImage(this.tutorialOffscreenCanvas, bX, bY);
            }
            
            // Draw text lines
            let firstLineY = bY + 30;
            if (totalLines === 1) {
                firstLineY = bY + 32;
            } else if (totalLines === 2) {
                firstLineY = bY + 28;
            } else {
                firstLineY = bY + 24;
            }

            const charset = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZabcdefghijklmnñopqrstuvwxyz!¡,.:0123456789?¿-"`';
            let charCount = 0;
            for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
                const lineItems = lines[lineIdx];
                let charX = startX;
                const charY = firstLineY + lineIdx * lineHeight;

                for (let i = 0; i < lineItems.length; i++) {
                    const item = lineItems[i];
                    if (item.type === 'space') {
                        charX += item.width;
                        continue;
                    }

                    charCount++;
                    const bounceY = Math.sin(this.tutorialWaveTimer * 10 + charCount) * 1.5;

                    if (item.type === 'char') {
                        const char = item.char;
                        const charIdx = charset.indexOf(char);
                        const isKoreanChar = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(char);
                        let imgToDraw = null;
                        if (charIdx !== -1 && !isKoreanChar && this.settings.language !== 'ko' && this.tutorialFontImages && this.tutorialFontImages[charIdx]) {
                            imgToDraw = this.tutorialFontImages[charIdx];
                        }

                        if (imgToDraw) {
                            this.ctx.drawImage(imgToDraw, charX, charY + bounceY);
                            charX += imgToDraw.width - 12;
                        } else {
                            const pixelated = this.getPixelatedTextCanvas(char, 'Custom_KyoboHandwriting2019', 26, 0, true, '#000000');
                            this.ctx.save();
                            this.ctx.imageSmoothingEnabled = false;
                            this.ctx.drawImage(pixelated.canvas, Math.round(charX - pixelated.padding), Math.round(charY + 6 + bounceY - pixelated.padding));
                            this.ctx.restore();
                            charX += Math.max(14, pixelated.textWidth + 1);
                        }
                    } else if (item.type === 'key') {
                        const keyName = item.val;
                        const img = this.getKeyImage(keyName);
                        
                        if (img && img.loaded && !img.error) {
                            this.ctx.drawImage(img, charX, charY + 6 + bounceY);
                            charX += img.width + 4;
                        } else if (this.tutorialBlankKeyLoaded) {
                            const bImg = this.tutorialBlankKeyImage;
                            this.ctx.drawImage(bImg, charX, charY + 6 + bounceY);
                            
                            let totalW = 0;
                            for (let k = 0; k < keyName.length; k++) {
                                const c = keyName[k];
                                const idx = charset.indexOf(c);
                                if (c === ' ') totalW += 8;
                                else if (idx !== -1 && this.tutorialFontImages && this.tutorialFontImages[idx]) totalW += this.tutorialFontImages[idx].width - 12;
                                else totalW += 8;
                            }
                            if (keyName.length > 0) totalW += 12;

                            let kx = charX + bImg.width / 2 - totalW / 2;
                            let ky = charY - 2;
                            for (let k = 0; k < keyName.length; k++) {
                                const c = keyName[k];
                                if (c === ' ') { kx += 8; continue; }
                                const idx = charset.indexOf(c);
                                if (idx !== -1 && this.tutorialFontImages && this.tutorialFontImages[idx]) {
                                    this.ctx.drawImage(this.tutorialFontImages[idx], kx, ky + bounceY);
                                    kx += this.tutorialFontImages[idx].width - 12;
                                } else {
                                    this.ctx.save();
                                    this.ctx.fillStyle = '#000000';
                                    this.ctx.font = 'bold 14px "Outfit", sans-serif';
                                    this.ctx.fillText(c, kx, ky + 12 + bounceY);
                                    this.ctx.restore();
                                    kx += 8;
                                }
                            }
                            charX += bImg.width + 4;
                        } else {
                            this.ctx.save();
                            this.ctx.fillStyle = '#000000';
                            this.ctx.font = 'bold 24px "Outfit", sans-serif';
                            this.ctx.textAlign = 'left';
                            this.ctx.fillText(`[${keyName}]`, charX, charY + 24 + bounceY);
                            this.ctx.restore();
                            charX += 40;
                        }
                    }
                }
            }
        }

        if (this.gameState === 'TITLE') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = '#00f2ff';
            this.ctx.font = 'bold 80px "Outfit", sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.shadowColor = '#00f2ff';
            this.ctx.shadowBlur = 20;
            const shakeX = (Math.random() - 0.5) * 10;
            const shakeY = (Math.random() - 0.5) * 10;
            this.ctx.fillText('NEON PLATFORMER', this.canvas.width / 2 + shakeX, this.canvas.height / 2 - 40 + shakeY);
            this.ctx.shadowBlur = 0;
            
            if (Math.floor(Date.now() / 600) % 2 === 0) {
                const lang = this.settings.language || 'ko';
                const pressText = i18n[lang]['title.press'];
                if (/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(pressText)) {
                    const pixelated = this.getPixelatedTextCanvas(pressText, 'Custom_Jejudoldam', 40, 2);
                    this.ctx.save();
                    this.ctx.imageSmoothingEnabled = false;
                    this.ctx.drawImage(pixelated.canvas, Math.round(this.canvas.width / 2 - pixelated.textWidth / 2 - pixelated.padding), Math.round(this.canvas.height / 2 + 60 - pixelated.padding));
                    this.ctx.restore();
                } else {
                    this.ctx.fillStyle = 'white';
                    this.ctx.font = 'bold 36px "Outfit", sans-serif';
                    this.ctx.fillText(pressText, this.canvas.width / 2, this.canvas.height / 2 + 60);
                }
            }
        }

        if (this.transitionState !== 'NONE' && this.transitionAlpha > 0) {
            this.ctx.fillStyle = `rgba(0, 0, 0, ${this.transitionAlpha})`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        if (this.isPlayingTransition && this.transitionImages && this.transitionImages.length > 0) {
            let imgIndex = Math.min(this.transitionFrameIndex, this.transitionFrameCount - 1);
            let img = this.transitionImages[imgIndex];
            if (img && img.complete && img.naturalWidth !== 0) {
                this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
            }
        }
    }

    renderTileWave(viewLeft, viewRight, viewTop, viewBottom, shakeX, shakeY, targetLayer = 1) {
        if (!this.tileOffscreenCanvas) {
            this.tileOffscreenCanvas = document.createElement('canvas');
            this.tileOffscreenCtx = this.tileOffscreenCanvas.getContext('2d');
        }

        const amp = (typeof this.tileWaveAmp === 'number' && !isNaN(this.tileWaveAmp)) ? this.tileWaveAmp : 3.5;
        const pad = Math.ceil(amp + 16);
        const canvasW = this.canvas.width;
        const canvasH = this.canvas.height;
        const neededW = canvasW + pad * 2;
        const neededH = canvasH;

        if (this.tileOffscreenCanvas.width !== neededW || this.tileOffscreenCanvas.height !== neededH) {
            this.tileOffscreenCanvas.width = neededW;
            this.tileOffscreenCanvas.height = neededH;
            this.tileOffscreenCtx.imageSmoothingEnabled = false;
        } else {
            this.tileOffscreenCtx.clearRect(0, 0, neededW, neededH);
        }

        const tileViewLeft = viewLeft - pad;
        const tileViewRight = viewRight + pad;

        this.tileOffscreenCtx.save();
        this.tileOffscreenCtx.translate(
            Math.round(-this.camera.x + shakeX + pad),
            Math.round(-this.camera.y + shakeY)
        );

        let count = 0;
        for (let i = 0; i < this.entities.length; i++) {
            const e = this.entities[i];
            if (e.type === 'tile' || e instanceof Tile) {
                const eLayer = e.layer || 1;
                if (eLayer !== targetLayer) continue;
                if (e.x + e.width > tileViewLeft && e.x < tileViewRight &&
                    e.y + e.height > viewTop && e.y < viewBottom) {
                    e.render(this.tileOffscreenCtx);
                    count++;
                }
            }
        }
        this.tileOffscreenCtx.restore();

        if (count === 0) return;

        const sliceH = 2; // 2px slices for smooth wave
        const freq = (typeof this.tileWaveFreq === 'number' && !isNaN(this.tileWaveFreq)) ? this.tileWaveFreq : 0.025;
        const timer = this.tileWaveTimer || 0;

        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0); // Pure screen coordinates

        for (let y = 0; y < canvasH; y += sliceH) {
            const curH = Math.min(sliceH, canvasH - y);
            const worldY = y + this.camera.y - shakeY;
            const offset = Math.sin((worldY * freq) - timer) * amp;

            this.ctx.drawImage(
                this.tileOffscreenCanvas,
                pad + offset, y, canvasW, curH,
                0, y, canvasW, curH
            );
        }

        this.ctx.restore();
    }

    renderEditorGuides() {
        const ctx = this.ctx;
        
        // Draw Grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        const startX = this.snapToGrid(this.camera.x);
        const startY = this.snapToGrid(this.camera.y);
        const endX = startX + this.canvas.width + this.gridSize;
        const endY = startY + this.canvas.height + this.gridSize;

        for (let x = startX; x <= endX; x += this.gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, startY);
            ctx.lineTo(x, endY);
            ctx.stroke();
        }
        for (let y = startY; y <= endY; y += this.gridSize) {
            ctx.beginPath();
            ctx.moveTo(startX, y);
            ctx.lineTo(endX, y);
            ctx.stroke();
        }

        // Draw Room Boundaries (if set)
        if (this.roomWidth > 0 || this.roomHeight > 0) {
            const rw = this.roomWidth || 100000;
            const rh = this.roomHeight || 100000;
            ctx.save();
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 3;
            ctx.setLineDash([8, 8]);
            ctx.strokeRect(0, 0, rw, rh);
            ctx.setLineDash([]);

            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 16px "Outfit", sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(`ROOM BOUNDS: ${this.roomWidth || '∞'} x ${this.roomHeight || '∞'}`, 10, 25);
            if (this.roomWidth > 0 && this.roomHeight > 0) {
                ctx.textAlign = 'right';
                ctx.fillText(`(${this.roomWidth}, ${this.roomHeight})`, this.roomWidth - 10, this.roomHeight - 10);
            }
            ctx.restore();
        }

        // Mouse snapped crosshair (Preview)
        const snapX = this.snapToGrid(this.mousePos.x);
        const snapY = this.snapToGrid(this.mousePos.y);
        
        ctx.globalAlpha = 0.5;
        if (this.isTileType(this.selectedType)) {
            const img = document.getElementById('tileset-image');
            const sw = this.selectedTileW || 32;
            const sh = this.selectedTileH || 32;
            const tx = this.selectedTileX || 0;
            const ty = this.selectedTileY || 0;
            if (img && img.complete && img.naturalWidth > 0) {
                if (this.tileFlipX || this.tileFlipY) {
                    ctx.save();
                    ctx.translate(snapX + (this.tileFlipX ? sw : 0), snapY + (this.tileFlipY ? sh : 0));
                    ctx.scale(this.tileFlipX ? -1 : 1, this.tileFlipY ? -1 : 1);
                    ctx.drawImage(img, tx, ty, sw, sh, 0, 0, sw, sh);
                    ctx.restore();
                } else {
                    ctx.drawImage(img, tx, ty, sw, sh, snapX, snapY, sw, sh);
                }
            } else {
                const targetLayer = this.getTileLayerFromType(this.selectedType);
                ctx.fillStyle = targetLayer === 2 ? '#2e7d32' : (targetLayer === 3 ? '#455a64' : '#8B4513');
                ctx.fillRect(snapX, snapY, sw, sh);
            }
        } else if (this.selectedType === 'erase') {
            ctx.fillStyle = 'rgba(255, 60, 60, 0.4)';
            ctx.fillRect(snapX, snapY, this.gridSize, this.gridSize);
            ctx.strokeStyle = '#ff3333';
            ctx.lineWidth = 1;
            ctx.strokeRect(snapX, snapY, this.gridSize, this.gridSize);
        } else if (this.selectedType === 'destroyable-small') {
            const img = Destroyable.imageSmall;
            if (img && img.complete && img.naturalWidth > 0) {
                ctx.drawImage(img, snapX, snapY, 32, 32);
            } else {
                ctx.fillStyle = '#df7208';
                ctx.fillRect(snapX, snapY, 32, 32);
            }
        } else if (this.selectedType === 'destroyable') {
            const img = Destroyable.imageBig;
            if (img && img.complete && img.naturalWidth > 0) {
                ctx.drawImage(img, snapX, snapY, 64, 64);
            } else {
                ctx.fillStyle = '#df7208';
                ctx.fillRect(snapX, snapY, 64, 64);
            }
        } else if (this.selectedType === 'metal') {
            const img = Metal.image;
            if (img && img.complete && img.naturalWidth > 0) {
                ctx.drawImage(img, snapX, snapY, 64, 64);
            } else {
                ctx.fillStyle = '#c2dedc';
                ctx.fillRect(snapX, snapY, 64, 64);
            }
        } else if (this.selectedType === 'pillar') {
            const img = Pillar.image;
            if (img && img.complete && img.naturalWidth > 0) {
                ctx.drawImage(img, snapX, snapY, 128, 224);
            } else {
                ctx.fillStyle = '#b88958';
                ctx.fillRect(snapX, snapY, 128, 224);
            }
        } else {
            ctx.fillStyle = '#00aa9e';
            ctx.fillRect(snapX, snapY, this.gridSize, this.gridSize);
        }
        ctx.globalAlpha = 1.0;

        // Right-Click Drag Area Delete Preview
        if (this.rightDragStart) {
            const endX = this.snapToGrid(this.mousePos.x);
            const endY = this.snapToGrid(this.mousePos.y);
            const minX = Math.min(this.rightDragStart.x, endX);
            const minY = Math.min(this.rightDragStart.y, endY);
            const maxX = Math.max(this.rightDragStart.x, endX) + this.gridSize;
            const maxY = Math.max(this.rightDragStart.y, endY) + this.gridSize;
            const w = maxX - minX;
            const h = maxY - minY;

            ctx.fillStyle = 'rgba(255, 60, 60, 0.3)';
            ctx.fillRect(minX, minY, w, h);
            ctx.strokeStyle = '#ff3333';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.strokeRect(minX, minY, w, h);
            ctx.setLineDash([]);
        }

        // Left-Click Drag Preview
        if (this.dragStart) {
            const endX = this.snapToGrid(this.mousePos.x);
            const endY = this.snapToGrid(this.mousePos.y);
            const minX = Math.min(this.dragStart.x, endX);
            const minY = Math.min(this.dragStart.y, endY);

            if (this.selectedType === 'erase') {
                const maxX = Math.max(this.dragStart.x, endX) + this.gridSize;
                const maxY = Math.max(this.dragStart.y, endY) + this.gridSize;
                const w = maxX - minX;
                const h = maxY - minY;

                ctx.fillStyle = 'rgba(255, 60, 60, 0.3)';
                ctx.fillRect(minX, minY, w, h);
                ctx.strokeStyle = '#ff3333';
                ctx.lineWidth = 2;
                ctx.setLineDash([4, 4]);
                ctx.strokeRect(minX, minY, w, h);
                ctx.setLineDash([]);
            } else {
                let w = Math.abs(endX - this.dragStart.x);
                let h = Math.abs(endY - this.dragStart.y);
                if (w === 0) w = this.gridSize;
                if (h === 0) h = this.gridSize;

                if (this.isTileType(this.selectedType)) {
                    const img = document.getElementById('tileset-image');
                    const patW = this.selectedTileW || 32;
                    const patH = this.selectedTileH || 32;
                    const targetLayer = this.getTileLayerFromType(this.selectedType);
                    const fallbackColor = targetLayer === 2 ? '#2e7d32' : (targetLayer === 3 ? '#455a64' : '#8B4513');
                    ctx.globalAlpha = 0.5;
                    for (let cx = minX; cx < minX + w; cx += 32) {
                        for (let cy = minY; cy < minY + h; cy += 32) {
                            const relX = (cx - minX) % patW;
                            const relY = (cy - minY) % patH;
                            const srcOx = this.tileFlipX ? (patW - 32 - relX) : relX;
                            const srcOy = this.tileFlipY ? (patH - 32 - relY) : relY;
                            const srcX = (this.selectedTileX || 0) + srcOx;
                            const srcY = (this.selectedTileY || 0) + srcOy;
                            if (img && img.complete && img.naturalWidth > 0) {
                                if (this.tileFlipX || this.tileFlipY) {
                                    ctx.save();
                                    ctx.translate(cx + (this.tileFlipX ? 32 : 0), cy + (this.tileFlipY ? 32 : 0));
                                    ctx.scale(this.tileFlipX ? -1 : 1, this.tileFlipY ? -1 : 1);
                                    ctx.drawImage(img, srcX, srcY, 32, 32, 0, 0, 32, 32);
                                    ctx.restore();
                                } else {
                                    ctx.drawImage(img, srcX, srcY, 32, 32, cx, cy, 32, 32);
                                }
                            } else {
                                ctx.fillStyle = fallbackColor;
                                ctx.fillRect(cx, cy, 32, 32);
                            }
                        }
                    }
                    ctx.globalAlpha = 1.0;
                } else if (this.selectedType === 'destroyable-small' || this.selectedType === 'destroyable') {
                    const isSmall = this.selectedType === 'destroyable-small';
                    const img = isSmall ? Destroyable.imageSmall : Destroyable.imageBig;
                    const tileSize = isSmall ? 32 : 64;
                    ctx.globalAlpha = 0.5;
                    for (let cx = minX; cx < minX + w; cx += tileSize) {
                        for (let cy = minY; cy < minY + h; cy += tileSize) {
                            const dw = Math.min(tileSize, minX + w - cx);
                            const dh = Math.min(tileSize, minY + h - cy);
                            if (img && img.complete && img.naturalWidth > 0) {
                                ctx.drawImage(img, 0, 0, dw, dh, cx, cy, dw, dh);
                            } else {
                                ctx.fillStyle = '#df7208';
                                ctx.fillRect(cx, cy, dw, dh);
                            }
                        }
                    }
                    ctx.globalAlpha = 1.0;
                } else if (this.selectedType === 'metal') {
                    const img = Metal.image;
                    const tileSize = 64;
                    ctx.globalAlpha = 0.5;
                    for (let cx = minX; cx < minX + w; cx += tileSize) {
                        for (let cy = minY; cy < minY + h; cy += tileSize) {
                            const dw = Math.min(tileSize, minX + w - cx);
                            const dh = Math.min(tileSize, minY + h - cy);
                            if (img && img.complete && img.naturalWidth > 0) {
                                ctx.drawImage(img, 0, 0, dw, dh, cx, cy, dw, dh);
                            } else {
                                ctx.fillStyle = '#c2dedc';
                                ctx.fillRect(cx, cy, dw, dh);
                            }
                        }
                    }
                    ctx.globalAlpha = 1.0;
                } else if (this.selectedType === 'pillar') {
                    const img = Pillar.image;
                    ctx.globalAlpha = 0.5;
                    if (img && img.complete && img.naturalWidth > 0) {
                        ctx.drawImage(img, minX, minY, w, h);
                    } else {
                        ctx.fillStyle = '#b88958';
                        ctx.fillRect(minX, minY, w, h);
                    }
                    ctx.globalAlpha = 1.0;
                }

                ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.setLineDash([5, 5]);
                ctx.strokeRect(minX, minY, w, h);
                ctx.setLineDash([]);
            }
        }
    }

    loop(currentTime) {
        if (!this.lastTime) {
            this.lastTime = currentTime;
        }
        
        let deltaTime = currentTime - this.lastTime;
        
        // Prevent spiral of death if tab is inactive for a long time
        if (deltaTime > 1000) {
            deltaTime = 1000 / 60;
        }

        this.accumulator += deltaTime;
        const timeStep = 1000 / 60;

        while (this.accumulator >= timeStep) {
            this.update();
            this.accumulator -= timeStep;
        }

        this.render();
        this.lastTime = currentTime;

        if (this.settings.vsync) {
            requestAnimationFrame((time) => this.loop(time));
        } else {
            setTimeout(() => {
                this.loop(performance.now());
            }, 1000 / 60);
        }
    }
}

window.game = new Game();
