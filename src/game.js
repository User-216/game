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
        'opt.back': 'Back', 'bind.press': 'Press any key...', 'bind.cancel': '(Escape to cancel)',
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
        'opt.back': '뒤로', 'bind.press': '아무 키나 누르세요...', 'bind.cancel': '(ESC 취소)',
        'state.idle': '대기', 'state.climbing': '등반중', 'state.running': '달리는중',
        'state.grounded': '지상', 'state.airborne': '공중', 'state.groundpound': '찍기',
        'state.groundpoundland': '찍기착지',
        'state.drifting': '드리프트', 'state.mach': '마하', 'title.press': '- Z를 눌러 시작 -'
    }
};

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.speedMeter = document.getElementById('speed-meter');
        this.climbMeter = document.getElementById('climb-speed-meter');
        this.posInfo = document.getElementById('pos-info');
        this.stateInfo = document.getElementById('state-info');
        this.uiOverlay = document.getElementById('ui-overlay');
        
        this.lastTime = performance.now();
        this.accumulator = 0;
        
        this.pauseMenuOptions = ['RESUME', 'OPTIONS', 'RESTART', 'EXIT LEVEL'];
        this.pauseMenuIndex = 0;
        this.pauseBubbles = [];
        
        this.optionsMenuOptions = ['AUDIO', 'VIDEO', 'GAME', 'CONTROLS'];
        this.optionsMenuIndex = 0;
        this.optionsMenuLevel = 'MAIN'; // MAIN, AUDIO, VIDEO, GAME, CONTROLS
        this.optionsScrollX = 0;
        this.optionsScrollY = 0;
        
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
        for(let i = 0; i < 26; i++) {
            let img = new Image();
            img.src = `font/spr_bigfont/spr_bigfont_${i}.png`;
            img.onload = () => {
                loadedCount++;
                if (loadedCount === 26) this.bigFontLoaded = true;
            };
            this.bigFontImages.push(img);
        }
        
        this.settings = {
            language: 'en',
            masterVolume: 100,
            musicVolume: 80,
            sfxVolume: 100,
            unfocusedMute: true,
            isFocused: true,
            resolution: 'native',
            vsync: true,
            textureFiltering: false,
            screenShake: true,
            cameraSpeed: 100,
            showHitboxes: false,
            bindings: {
                left: 'ArrowLeft',
                right: 'ArrowRight',
                up: 'ArrowUp',
                down: 'ArrowDown',
                jump: 'z',
                run: 'Shift',
                grab: 'x'
            }
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
            if (this.audio && this.audio.updateMusicVolume) this.audio.updateMusicVolume();
        });
        this.settings.isFocused = document.hasFocus();

        this.gameState = 'TITLE';

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
        
        this.initRooms();
        this.loadRoom('titlescreen');
        
        this.isEditorMode = false;
        this.selectedType = 'platform';
        this.gridSize = 32;
        this.dragStart = null;
        this.mousePos = { x: 0, y: 0 };
        
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

        // Load blank key
        this.tutorialBlankKeyImage = new Image();
        this.tutorialBlankKeyImage.src = 'tutorial/spr_tutorialkey.png';
        this.tutorialBlankKeyLoaded = false;
        this.tutorialBlankKeyImage.onload = () => { this.tutorialBlankKeyLoaded = true; };
        
        // Special key images (if any)
        this.tutorialKeyImages = {};
        this.getKeyImage = (keyName) => {
            if (this.tutorialKeyImages[keyName]) return this.tutorialKeyImages[keyName];
            const img = new Image();
            img.src = `tutorial/spr_tutorialkeyspecial/${keyName}.png`; // fallback if they exist
            img.loaded = false;
            img.error = false;
            img.onload = () => { img.loaded = true; };
            img.onerror = () => { img.error = true; };
            this.tutorialKeyImages[keyName] = img;
            return img;
        };

        this.tutorialTexX = 0;
        this.tutorialWaveTimer = 0;
        this.currentTutorialText = null;
        this.currentTutorialBook = null;

        this.setupInputs();
        this.setupEditorUI();
        this.setupMenuUI();
        this.translateUI();

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
        if (this.settings && this.settings.resolution !== 'native') {
            const [w, h] = this.settings.resolution.split('x').map(Number);
            this.canvas.width = w;
            this.canvas.height = h;
        } else {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }
    }

    setupInputs() {
        window.addEventListener('keydown', (e) => {
            if (this.bindingKeyFor) {
                e.preventDefault();
                const key = e.key === ' ' ? 'Space' : e.key;
                if (key === 'Escape') {
                    this.bindingKeyFor = null;
                    document.getElementById('bind-overlay').classList.add('hidden');
                    return;
                }
                this.settings.bindings[this.bindingKeyFor] = key;
                this.bindingKeyFor = null;
                document.getElementById('bind-overlay').classList.add('hidden');
                this.refreshControlList();
                return;
            }

            if (e.key === 'Escape') {
                this.togglePause();
                return;
            }

            const key = e.key === ' ' ? 'Space' : e.key;
            this.keys[key] = true;
            this.keys[key.toLowerCase()] = true;
            this.keys[key.toUpperCase()] = true;

            if (e.key === 'e' || e.key === 'E') {
                this.toggleEditorMode();
            }
            if (this.isEditorMode && (e.key === 'f' || e.key === 'F')) {
                this.flipSelectedTool();
            }
        });
        window.addEventListener('keyup', (e) => {
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

        addTouch('mbtn-up', 'up');
        addTouch('mbtn-left', 'left');
        addTouch('mbtn-down', 'down');
        addTouch('mbtn-right', 'right');
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
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.handleRightClick(e);
        });
    }

    setupEditorUI() {
        // Palette buttons
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectTool(btn.dataset.type);
            });
        });

        // Export button
        const exportBtn = document.getElementById('export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportLevel());
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

        // Set Room Size button
        const setSizeBtn = document.getElementById('set-size-btn');
        if (setSizeBtn) {
            setSizeBtn.addEventListener('click', () => {
                let w = prompt("Enter Room Width (e.g., 2000) or Cancel for infinite:", this.roomWidth || "");
                if (w !== null) {
                    let h = prompt("Enter Room Height (e.g., 1000) or Cancel for infinite:", this.roomHeight || "");
                    if (h !== null) {
                        this.roomWidth = parseInt(w) || 0;
                        this.roomHeight = parseInt(h) || 0;
                    }
                }
            });
        }

        // Set Music button
        const setMusicBtn = document.getElementById('set-music-btn');
        if (setMusicBtn) {
            setMusicBtn.addEventListener('click', () => {
                let m = prompt("Enter music file name (e.g., mu_oldlevel.wav) or Cancel to clear:", this.roomMusic || "");
                if (m !== null) {
                    this.roomMusic = m.trim() === "" ? null : m.trim();
                    if (this.roomMusic) {
                        this.audio.playMusic(this.roomMusic);
                    } else {
                        this.audio.playMusic(null);
                    }
                }
            });
        }
    }

    togglePause() {
        if (this.gameState === 'PLAYING') {
            this.gameState = 'PAUSED';
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
            if (this.audio) this.audio.play('pause');
            document.getElementById('pause-overlay').style.display = 'none'; // Ensure DOM overlay is hidden
            document.getElementById('pause-overlay').classList.add('hidden');
        } else if (this.gameState === 'PAUSED' || this.gameState === 'OPTIONS') {
            this.gameState = 'PLAYING';
            if (this.audio) this.audio.play('unpause');
            document.getElementById('pause-overlay').style.display = 'none';
            document.getElementById('pause-overlay').classList.add('hidden');
            document.getElementById('options-overlay').style.display = 'none';
            document.getElementById('options-overlay').classList.add('hidden');
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
        document.getElementById('resolution-select').addEventListener('change', (e) => {
            this.settings.resolution = e.target.value;
            this.resize();
        });
        
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
        if (this.isEditorMode) {
            toolbar.classList.remove('hidden');
            this.player.isNoClip = true; // Auto-noclip for building
        } else {
            toolbar.classList.add('hidden');
            this.player.isNoClip = false;
        }
    }

    selectTool(type) {
        this.selectedType = type;
        document.querySelectorAll('.tool-btn').forEach(btn => {
            if (btn.dataset.type === type) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    flipSelectedTool() {
        if (this.selectedType === 'slope-left') {
            this.selectTool('slope-right');
        } else if (this.selectedType === 'slope-right') {
            this.selectTool('slope-left');
        }
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

    handleMouseDown(e) {
        if (!this.isEditorMode || e.button !== 0) return;
        const worldPos = this.getMouseInWorld(e);
        this.dragStart = {
            x: this.snapToGrid(worldPos.x),
            y: this.snapToGrid(worldPos.y)
        };
    }

    handleMouseMove(e) {
        const worldPos = this.getMouseInWorld(e);
        this.mousePos = worldPos;
    }

    handleMouseUp(e) {
        if (!this.isEditorMode || !this.dragStart || e.button !== 0) return;
        
        const worldPos = this.getMouseInWorld(e);
        const endX = this.snapToGrid(worldPos.x);
        const endY = this.snapToGrid(worldPos.y);

        const x = Math.min(this.dragStart.x, endX);
        const y = Math.min(this.dragStart.y, endY);
        let w = Math.abs(this.dragStart.x - endX);
        let h = Math.abs(this.dragStart.y - endY);

        // Minimum size
        if (w < this.gridSize) w = this.gridSize;
        if (h < this.gridSize) h = this.gridSize;

        // Create entity
        let entity;
        switch(this.selectedType) {
            case 'platform': entity = new Platform(x, y, w, h); break;
            case 'slope-left': entity = new Slope(x, y, w, h, 'left-up'); break;
            case 'slope-right': entity = new Slope(x, y, w, h, 'right-up'); break;
            case 'destroyable': entity = new Destroyable(x, y, w, h); break;
            case 'hallway': 
                let tRoom = prompt("Target Room (e.g., A, B, C) (Cancel for none):", "A");
                let tDoor = prompt("Target Door (A, B, C, D, E) (Cancel for none):", "A");
                entity = new Hallway(x, y, w, h, tRoom, tDoor); 
                break;
            case 'door': entity = new Door(x, y, w, h, 'NEW', 'A'); break;
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
        }

        if (entity) {
            this.entities.push(entity);
        }

        this.dragStart = null;
    }

    handleRightClick(e) {
        if (!this.isEditorMode) return;
        const worldPos = this.getMouseInWorld(e);
        
        // Find and remove entity at this position
        for (let i = this.entities.length - 1; i >= 0; i--) {
            const ent = this.entities[i];
            if (worldPos.x >= ent.x && worldPos.x <= ent.x + ent.width &&
                worldPos.y >= ent.y && worldPos.y <= ent.y + ent.height) {
                this.entities.splice(i, 1);
                break;
            }
        }
    }

    exportLevel() {
        let code = ``;
        if (this.roomWidth || this.roomHeight) {
            code += `this.roomWidth = ${this.roomWidth || 0};\n`;
            code += `this.roomHeight = ${this.roomHeight || 0};\n`;
        }
        if (this.roomMusic) {
            code += `this.roomMusic = '${this.roomMusic}';\n`;
        }
        code += `this.entities.push(\n`;
        this.entities.forEach(ent => {
            let line = `    `;
            if (ent instanceof Platform) line += `new Platform(${ent.x}, ${ent.y}, ${ent.width}, ${ent.height}, '${ent.color}')`;
            else if (ent instanceof Slope) line += `new Slope(${ent.x}, ${ent.y}, ${ent.width}, ${ent.height}, '${ent.type}')`;
            else if (ent instanceof Destroyable) line += `new Destroyable(${ent.x}, ${ent.y}, ${ent.width}, ${ent.height})`;
            else if (ent instanceof Hallway) line += `new Hallway(${ent.x}, ${ent.y}, ${ent.width}, ${ent.height}, ${ent.targetRoom ? `'${ent.targetRoom}'` : 'null'}, ${ent.targetDoor ? `'${ent.targetDoor}'` : 'null'})`;
            else if (ent instanceof Door) line += `new Door(${ent.x}, ${ent.y}, ${ent.width}, ${ent.height}, '${ent.label}', '${ent.targetRoom}')`;
            else if (ent instanceof TargetDoorBase) line += `new TargetDoor_${ent.doorId}(${ent.x}, ${ent.y}, ${ent.width}, ${ent.height})`;
            else if (ent instanceof TutorialBook) line += `new TutorialBook(${ent.x}, ${ent.y}, ${ent.width}, ${ent.height}, ${JSON.stringify(ent.text)})`;
            code += line + `,\n`;
        });
        code += `);`;
        
        navigator.clipboard.writeText(code).then(() => {
            alert("Level code copied to clipboard! Paste it into initRooms() in game.js");
        });
    }

    initRooms() {
        this.rooms = {
            'titlescreen': () => {
                // Initial room
                this.entities.push(new Platform(0, 500, 1000, 50));
                this.entities.push(new Door(400, 420, 50, 80, 'START', 'A'));
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

    loadRoom(roomName, targetDoorId = null, preserveVelocity = false) {
        // Save current room state to memory before switching
        if (this.currentRoom && this.rooms[this.currentRoom] && this.entities.length > 0) {
            const currentEntities = [...this.entities];
            const currentW = this.roomWidth;
            const currentH = this.roomHeight;
            const currentMusic = this.roomMusic;
            this.rooms[this.currentRoom] = () => {
                this.roomWidth = currentW;
                this.roomHeight = currentH;
                this.roomMusic = currentMusic;
                currentEntities.forEach(ent => this.entities.push(ent));
            };
        }

        if (!this.rooms[roomName]) return;
        
        console.log(`Loading Room: ${roomName}`);
        this.entities = [];
        this.roomWidth = 0;
        this.roomHeight = 0;
        this.roomMusic = null;
        this.rooms[roomName]();
        
        if (this.audio) {
            this.audio.playMusic(this.roomMusic);
        }
        
        let startX = 100;
        let startY = 300;
        
        if (targetDoorId) {
            const doorObj = this.entities.find(e => e.type === `targetDoor_${targetDoorId}`);
            if (doorObj) {
                startX = doorObj.x + doorObj.width / 2 - this.player.width / 2;
                startY = doorObj.y + doorObj.height - this.player.height;
            }
        }
        
        // Reset player
        this.player.x = startX;
        this.player.y = startY;
        if (!preserveVelocity) {
            this.player.vx = 0;
            this.player.vy = 0;
        }
        this.player.isGrounded = false;
        this.player.isClimbing = false;
        this.player.isDrifting = false;
        this.player.isDrifting1 = false;
        this.player.insideHallway = true; // Mark as inside hallway to prevent immediate loop
        
        this.cameraSpeedOffset = 0;
        this.currentRoom = roomName;
    }

    triggerRoomTransition(roomName, targetDoorId = null, preserveVelocity = false) {
        if (this.transitionState !== 'NONE') return;
        this.transitionState = 'FADE_OUT';
        this.transitionTimer = 0;
        this.pendingRoom = roomName;
        this.pendingDoor = targetDoorId;
        this.pendingPreserveVelocity = preserveVelocity;
    }

    update() {
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

        if (this.gameState === 'PAUSED' || this.gameState === 'OPTIONS') {
            if (this.gameState === 'PAUSED') {
                if (this.keys['ArrowUp'] && !this.prevKeysUp) {
                    this.pauseMenuIndex = (this.pauseMenuIndex - 1 + this.pauseMenuOptions.length) % this.pauseMenuOptions.length;
                    if (this.audio) this.audio.play('unpause'); 
                }
                if (this.keys['ArrowDown'] && !this.prevKeysDown) {
                    this.pauseMenuIndex = (this.pauseMenuIndex + 1) % this.pauseMenuOptions.length;
                    if (this.audio) this.audio.play('unpause'); 
                }
                if ((this.keys['z'] || this.keys['Z'] || this.keys['Enter']) && !this.prevKeysZ) {
                    const sel = this.pauseMenuOptions[this.pauseMenuIndex];
                    if (sel === 'RESUME') {
                        this.togglePause();
                    } else if (sel === 'OPTIONS') {
                        this.gameState = 'OPTIONS';
                        this.optionsMenuIndex = 0;
                        this.optionsMenuLevel = 'MAIN';
                        document.getElementById('options-overlay').style.display = 'none'; // just in case
                    } else if (sel === 'RESTART') {
                        this.togglePause();
                        this.loadRoom(this.currentRoom);
                    } else if (sel === 'EXIT LEVEL') {
                        this.togglePause();
                        this.gameState = 'TITLE';
                        if (this.uiOverlay) this.uiOverlay.style.display = 'none';
                    }
                }
                this.prevKeysUp = this.keys['ArrowUp'];
                this.prevKeysDown = this.keys['ArrowDown'];
                this.prevKeysZ = this.keys['z'] || this.keys['Z'] || this.keys['Enter'];

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
            } else if (this.gameState === 'OPTIONS') {
                this.optionsScrollX -= 0.5;
                this.optionsScrollY -= 0.5;

                let currentOptions = [];
                if (this.optionsMenuLevel === 'MAIN') currentOptions = this.optionsMenuOptions;
                else if (this.optionsMenuLevel === 'AUDIO') currentOptions = ['BACK', 'MASTER', 'MUSIC', 'SFX', 'UNFOCUS MUTE'];
                else if (this.optionsMenuLevel === 'VIDEO') currentOptions = ['BACK', 'WINDOW MODE', 'RESOLUTION', 'VSYNC', 'TEXTURE FILTERING', 'HIDE HUD'];
                else if (this.optionsMenuLevel === 'GAME') currentOptions = ['BACK', 'SHAKE INTENS', 'TIMER'];
                else if (this.optionsMenuLevel === 'CONTROLS') currentOptions = ['BACK', 'KEYBOARD', 'CONTROLLER', 'RESET CONFIG'];
                else if (this.optionsMenuLevel === 'KEYBOARD') currentOptions = ['BACK', 'BINDINGS', 'DIR SUPERJUMP', 'DIR GROUNDPOUND'];
                else if (this.optionsMenuLevel === 'BINDINGS') currentOptions = ['BACK', 'UP', 'DOWN', 'LEFT', 'RIGHT', 'JUMP', 'ATTACK'];
                else if (this.optionsMenuLevel === 'WINDOW MODE') currentOptions = ['BACK', 'WINDOWED', 'FULLSCREEN', 'BORDERLESS'];
                
                if (this.keys['ArrowUp'] && !this.prevKeysUp) {
                    this.optionsMenuIndex = (this.optionsMenuIndex - 1 + currentOptions.length) % currentOptions.length;
                    if (this.audio) this.audio.play('unpause');
                }
                if (this.keys['ArrowDown'] && !this.prevKeysDown) {
                    this.optionsMenuIndex = (this.optionsMenuIndex + 1) % currentOptions.length;
                    if (this.audio) this.audio.play('unpause');
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
                    if (sel === 'SHAKE INTENS') this.settings.shakeIntens = Math.max(0, this.settings.shakeIntens - 1);

                    // Discrete toggles (change only once per press)
                    if (!this.prevKeysLeft) {
                        if (sel === 'UNFOCUS MUTE') this.settings.unfocusedMute = !this.settings.unfocusedMute;
                        if (sel === 'RESOLUTION') this.settings.resolutionIndex = Math.max(0, this.settings.resolutionIndex - 1);
                        if (sel === 'VSYNC') this.settings.vsync = !this.settings.vsync;
                        if (sel === 'TEXTURE FILTERING') this.settings.textureFiltering = !this.settings.textureFiltering;
                        if (sel === 'HIDE HUD') this.settings.hideHud = !this.settings.hideHud;
                        if (sel === 'TIMER') this.settings.timer = !this.settings.timer;
                        if (sel === 'DIR SUPERJUMP') this.settings.dirSuperjump = !this.settings.dirSuperjump;
                        if (sel === 'DIR GROUNDPOUND') this.settings.dirGroundpound = !this.settings.dirGroundpound;
                        if (this.audio && sel !== 'BACK') this.audio.play('unpause');
                    }
                }
                
                if (this.keys['ArrowRight']) {
                    // Continuous sliders (change by 1 every frame while held)
                    if (sel === 'MASTER') this.settings.masterVolume = Math.min(100, this.settings.masterVolume + 1);
                    if (sel === 'MUSIC') this.settings.musicVolume = Math.min(100, this.settings.musicVolume + 1);
                    if (sel === 'SFX') this.settings.sfxVolume = Math.min(100, this.settings.sfxVolume + 1);
                    if (sel === 'SHAKE INTENS') this.settings.shakeIntens = Math.min(100, this.settings.shakeIntens + 1);

                    // Discrete toggles (change only once per press)
                    if (!this.prevKeysRight) {
                        if (sel === 'UNFOCUS MUTE') this.settings.unfocusedMute = !this.settings.unfocusedMute;
                        if (sel === 'RESOLUTION') this.settings.resolutionIndex = Math.min(this.settings.resolutions.length - 1, this.settings.resolutionIndex + 1);
                        if (sel === 'VSYNC') this.settings.vsync = !this.settings.vsync;
                        if (sel === 'TEXTURE FILTERING') this.settings.textureFiltering = !this.settings.textureFiltering;
                        if (sel === 'HIDE HUD') this.settings.hideHud = !this.settings.hideHud;
                        if (sel === 'TIMER') this.settings.timer = !this.settings.timer;
                        if (sel === 'DIR SUPERJUMP') this.settings.dirSuperjump = !this.settings.dirSuperjump;
                        if (sel === 'DIR GROUNDPOUND') this.settings.dirGroundpound = !this.settings.dirGroundpound;
                        if (this.audio && sel !== 'BACK') this.audio.play('unpause');
                    }
                }

                if (this.keys['Escape'] && !this.prevKeysEsc) {
                    if (this.optionsMenuLevel === 'MAIN') {
                        this.gameState = 'PAUSED';
                    } else if (this.optionsMenuLevel === 'KEYBOARD') {
                        this.optionsMenuLevel = 'CONTROLS';
                        this.optionsMenuIndex = 0;
                    } else if (this.optionsMenuLevel === 'BINDINGS') {
                        this.optionsMenuLevel = 'KEYBOARD';
                        this.optionsMenuIndex = 0;
                    } else if (this.optionsMenuLevel === 'WINDOW MODE') {
                        this.optionsMenuLevel = 'VIDEO';
                        this.optionsMenuIndex = 1;
                    } else {
                        this.optionsMenuLevel = 'MAIN';
                        this.optionsMenuIndex = 0;
                    }
                    if (this.audio) this.audio.play('unpause');
                }
                if ((this.keys['z'] || this.keys['Z'] || this.keys['Enter']) && !this.prevKeysZ) {
                    if (this.optionsMenuLevel === 'MAIN') {
                        this.optionsMenuLevel = currentOptions[this.optionsMenuIndex];
                        this.optionsMenuIndex = 0;
                    } else if (currentOptions[this.optionsMenuIndex] === 'BACK') {
                        if (this.optionsMenuLevel === 'KEYBOARD') {
                            this.optionsMenuLevel = 'CONTROLS';
                        } else if (this.optionsMenuLevel === 'BINDINGS') {
                            this.optionsMenuLevel = 'KEYBOARD';
                        } else if (this.optionsMenuLevel === 'WINDOW MODE') {
                            this.optionsMenuLevel = 'VIDEO';
                            this.optionsMenuIndex = 1;
                        } else {
                            this.optionsMenuLevel = 'MAIN';
                        }
                        this.optionsMenuIndex = 0;
                    } else if (this.optionsMenuLevel === 'CONTROLS' && currentOptions[this.optionsMenuIndex] === 'KEYBOARD') {
                        this.optionsMenuLevel = 'KEYBOARD';
                        this.optionsMenuIndex = 0;
                    } else if (this.optionsMenuLevel === 'KEYBOARD' && currentOptions[this.optionsMenuIndex] === 'BINDINGS') {
                        this.optionsMenuLevel = 'BINDINGS';
                        this.optionsMenuIndex = 0;
                    } else if (this.optionsMenuLevel === 'VIDEO' && currentOptions[this.optionsMenuIndex] === 'WINDOW MODE') {
                        this.optionsMenuLevel = 'WINDOW MODE';
                        this.optionsMenuIndex = 0;
                    } else if (this.optionsMenuLevel === 'WINDOW MODE') {
                        this.settings.windowMode = currentOptions[this.optionsMenuIndex];
                        this.optionsMenuLevel = 'VIDEO';
                        this.optionsMenuIndex = 1;
                    }
                    if (this.audio) this.audio.play('unpause');
                }

                this.prevKeysUp = this.keys['ArrowUp'];
                this.prevKeysDown = this.keys['ArrowDown'];
                this.prevKeysLeft = this.keys['ArrowLeft'];
                this.prevKeysRight = this.keys['ArrowRight'];
                this.prevKeysEsc = this.keys['Escape'];
                this.prevKeysZ = this.keys['z'] || this.keys['Z'] || this.keys['Enter'];
            }
            return;
        }

        if (this.transitionState === 'FADE_OUT') {
            this.transitionTimer++;
            this.transitionAlpha = this.transitionTimer / this.transitionDuration;
            if (this.transitionTimer >= this.transitionDuration) {
                this.transitionAlpha = 1;
                this.loadRoom(this.pendingRoom, this.pendingDoor, this.pendingPreserveVelocity);
                this.transitionState = 'FADE_IN';
                this.transitionTimer = 0;
            }
        } else if (this.transitionState === 'FADE_IN') {
            this.transitionTimer++;
            this.transitionAlpha = 1 - (this.transitionTimer / this.transitionDuration);
            if (this.transitionTimer >= this.transitionDuration) {
                this.transitionAlpha = 0;
                this.transitionState = 'NONE';
                this.pendingRoom = null;
                this.pendingDoor = null;
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

        if (this.gameState === 'PAUSED' || this.gameState === 'OPTIONS') {
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
            this.keys.actionLeft = !!this.keys[this.settings.bindings.left];
            this.keys.actionRight = !!this.keys[this.settings.bindings.right];
            this.keys.actionUp = !!this.keys[this.settings.bindings.up];
            this.keys.actionDown = !!this.keys[this.settings.bindings.down];
            this.keys.actionJump = !!this.keys[this.settings.bindings.jump];
            this.keys.actionRun = !!this.keys[this.settings.bindings.run];
            this.keys.actionGrab = !!this.keys[this.settings.bindings.grab];
        }

        this.player.update(this.keys, this.entities, this.audio);
        
        // Handle screen shake requests
        if (this.player.requestScreenShake > 0) {
            this.cameraShake = this.player.requestScreenShake;
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

        const lerpFactor = (this.settings.cameraSpeed || 20) / 100;
        this.camera.x += (targetX - this.camera.x) * lerpFactor;
        this.camera.y += (targetY - this.camera.y) * lerpFactor;
        
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
        if (this.player.isClimbing) currentStates.push(dict['state.climbing']);
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

        if (overlappingDoor && this.keys.actionUp && this.player.isGrounded) {
            this.triggerRoomTransition(overlappingDoor.targetRoom);
            this.keys[this.settings.bindings.up] = false; // Prevent immediate multi-entry
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
                    bookText = e.text;
                    this.currentTutorialBook = e;
                    break;
                }
            }
        }
        
        if (touchingBook) {
            if (this.currentTutorialText !== bookText) {
                this.currentTutorialText = bookText;
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
        
        this.ctx.save();
        
        let shakeX = 0;
        let shakeY = 0;
        if (this.settings.screenShake && this.cameraShake > 0) {
            shakeX = (Math.random() - 0.5) * this.cameraShake;
            shakeY = (Math.random() - 0.5) * this.cameraShake;
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
        
        // 2. Foreground objects (Platforms, slopes, etc.)
        for (let i = 0; i < this.entities.length; i++) {
            const e = this.entities[i];
            if (e.type !== 'hallway') {
                if (e.x + e.width > viewLeft && e.x < viewRight && 
                    e.y + e.height > viewTop && e.y < viewBottom) {
                    e.render(this.ctx);
                }
            }
        }
        
        this.player.render(this.ctx);

        // Render Editor Overlays
        if (this.isEditorMode) {
            this.renderEditorGuides();
        }
        
        this.ctx.restore();

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
            // Draw dark background mask on right side using bubbles
            this.ctx.fillStyle = 'black';
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 2;
            
            // Draw a base dark rect for the menu area
            this.ctx.fillRect(this.canvas.width / 2 + 50, 0, this.canvas.width / 2, this.canvas.height);

            // Draw bubbles acting as the border
            if (this.pauseBubbles) {
                this.pauseBubbles.forEach(b => {
                    this.ctx.beginPath();
                    this.ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.stroke();
                    this.ctx.beginPath();
                    this.ctx.arc(b.x, b.y, b.r - 2, 0, Math.PI * 2);
                    this.ctx.fill();
                });
            }

            const drawText = (text, x, y, scale = 1, alpha = 1, center = true) => {
                let cursorX = x;
                if (typeof text !== 'string') text = String(text);
                text = text.toUpperCase();
                this.ctx.globalAlpha = alpha;
                
                // Calculate width for centering
                if (center) {
                    let totalWidth = 0;
                    for (let i = 0; i < text.length; i++) {
                        const char = text[i];
                        if (char === ' ') totalWidth += 10 * scale;
                        else {
                            let charCode = -1;
                            if (char >= 'A' && char <= 'Z') charCode = char.charCodeAt(0) - 65;
                            else if (char >= '0' && char <= '9') charCode = char.charCodeAt(0) - 48 + 26;
                            else if (char === '.') charCode = 36;
                            
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
                    let charCode = -1;
                    if (char >= 'A' && char <= 'Z') {
                        charCode = char.charCodeAt(0) - 65; // 0-25
                    } else if (char >= '0' && char <= '9') {
                        charCode = char.charCodeAt(0) - 48 + 26; // 26-35
                    } else if (char === '.') {
                        charCode = 36; // guess
                    }

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

            const startX = this.canvas.width / 2 + 150; // The right side of the screen
            const startY = this.canvas.height / 2 - 120;
            const lineSpace = 60;

            for (let i = 0; i < this.pauseMenuOptions.length; i++) {
                const opt = this.pauseMenuOptions[i];
                const y = startY + i * lineSpace;
                const isSelected = i === this.pauseMenuIndex;
                
                // Draw text
                if (isSelected) {
                    drawText(opt, startX + 20, y, 1, 1);
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
                    drawText(opt, startX + 20, y, 1, 0.5);
                }
            }
        } else if (this.gameState === 'OPTIONS' && this.bigFontLoaded) {
            if (this.optionsBGLoaded) {
                let bgIndex = 0;
                if (this.optionsMenuLevel === 'AUDIO') bgIndex = 1;
                else if (this.optionsMenuLevel === 'VIDEO') bgIndex = 2;
                else if (this.optionsMenuLevel === 'GAME') bgIndex = 3;
                else if (this.optionsMenuLevel === 'CONTROLS') bgIndex = 4;
                else if (this.optionsMenuLevel === 'KEYBOARD') bgIndex = 4; // Use CONTROLS background

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
                text = text.toUpperCase();
                this.ctx.globalAlpha = alpha;
                
                // Calculate width for centering
                if (center) {
                    let totalWidth = 0;
                    for (let i = 0; i < text.length; i++) {
                        const char = text[i];
                        if (char === ' ') totalWidth += 10 * scale;
                        else {
                            let charCode = -1;
                            if (char >= 'A' && char <= 'Z') charCode = char.charCodeAt(0) - 65;
                            else if (char >= '0' && char <= '9') charCode = char.charCodeAt(0) - 48 + 26;
                            else if (char === '.') charCode = 36;
                            
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
                    let charCode = -1;
                    if (char >= 'A' && char <= 'Z') charCode = char.charCodeAt(0) - 65;
                    else if (char >= '0' && char <= '9') charCode = char.charCodeAt(0) - 48 + 26;
                    else if (char === '.') charCode = 36;
                    
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

            const startX = this.canvas.width / 2;
            const startY = this.canvas.height / 2 - 100;
            const lineSpace = 40;

            let currentOptions = [];
            if (this.optionsMenuLevel === 'MAIN') currentOptions = this.optionsMenuOptions;
            else if (this.optionsMenuLevel === 'AUDIO') currentOptions = ['BACK', 'MASTER', 'MUSIC', 'SFX', 'UNFOCUS MUTE'];
            else if (this.optionsMenuLevel === 'VIDEO') currentOptions = ['BACK', 'WINDOW MODE', 'RESOLUTION', 'VSYNC', 'TEXTURE FILTERING', 'HIDE HUD'];
            else if (this.optionsMenuLevel === 'GAME') currentOptions = ['BACK', 'SHAKE INTENS', 'TIMER'];
            else if (this.optionsMenuLevel === 'CONTROLS') currentOptions = ['BACK', 'KEYBOARD', 'CONTROLLER', 'RESET CONFIG'];
            else if (this.optionsMenuLevel === 'KEYBOARD') currentOptions = ['BACK', 'BINDINGS', 'DIR SUPERJUMP', 'DIR GROUNDPOUND'];
            else if (this.optionsMenuLevel === 'BINDINGS') currentOptions = ['BACK', 'UP', 'DOWN', 'LEFT', 'RIGHT', 'JUMP', 'ATTACK'];
            else if (this.optionsMenuLevel === 'WINDOW MODE') currentOptions = ['BACK', 'WINDOWED', 'FULLSCREEN', 'BORDERLESS'];

            for (let i = 0; i < currentOptions.length; i++) {
                const opt = currentOptions[i];
                const y = startY + i * lineSpace;
                const isSelected = i === this.optionsMenuIndex;
                
                const isMain = this.optionsMenuLevel === 'MAIN';
                let textX = isMain ? startX : startX - 250;
                
                // For BINDINGS, we want the options to be centered (with BACK at top left)
                if (this.optionsMenuLevel === 'BINDINGS') {
                    if (opt === 'BACK') {
                        textX = startX - 250;
                    } else {
                        textX = startX;
                    }
                }
                
                if (isSelected) {
                    drawText(opt, textX, y, 1, 1, isMain || (this.optionsMenuLevel === 'BINDINGS' && opt !== 'BACK'));
                } else {
                    drawText(opt, textX, y, 1, 0.5, isMain || (this.optionsMenuLevel === 'BINDINGS' && opt !== 'BACK'));
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
                    drawText(valueText, valX, y, 1, alpha, false);
                } else if (sliderValue !== null) {
                    this.ctx.globalAlpha = alpha;
                    this.ctx.fillStyle = 'white';
                    this.ctx.fillRect(valX, y + 20, 200, 10); // Background line
                    
                    // The knob
                    this.ctx.fillStyle = '#657b54'; // A distinct color for the knob, maybe green
                    this.ctx.fillRect(valX + (200 * sliderValue) - 10, y + 10, 20, 30);
                    this.ctx.strokeStyle = 'white';
                    this.ctx.lineWidth = 2;
                    this.ctx.strokeRect(valX + (200 * sliderValue) - 10, y + 10, 20, 30);
                    this.ctx.globalAlpha = 1;
                }
            }
        }

        // Draw Tutorial Book Banner UI
        if (this.currentTutorialText && this.gameState === 'PLAYING') {
            let processedText = this.currentTutorialText.replace(/\\n/g, '\n');
            const linesCount = processedText.split('\n').length;
            
            const waveX = Math.sin(this.tutorialWaveTimer * 0.8) * 5;
            const bWidth = this.canvas.width - 128;
            const bHeight = Math.max(150, linesCount * 36 + 60);
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
            
            // Draw text
            if (this.currentTutorialText) {
                const charset = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZabcdefghijklmnñopqrstuvwxyz!¡,.:0123456789`?¿-";
                
                const formatKey = (key) => {
                    if (!key) return "NONE";
                    if (key.startsWith("Arrow")) return key.replace("Arrow", "").toUpperCase();
                    if (key === " ") return "SPACE";
                    return key.toUpperCase();
                };
                
                const macros = {
                    '[J]': formatKey(this.settings.bindings.jump),
                    '[S]': formatKey(this.settings.bindings.run),
                    '[L]': formatKey(this.settings.bindings.left),
                    '[R]': formatKey(this.settings.bindings.right),
                    '[U]': formatKey(this.settings.bindings.up),
                    '[D]': formatKey(this.settings.bindings.down),
                    '[G]': formatKey(this.settings.bindings.grab)
                };
                
                // Parse text into tokens of either string or key macro
                let tokens = [];
                let currentStr = "";
                for (let i = 0; i < processedText.length; i++) {
                    let matched = false;
                    for (let m in macros) {
                        if (processedText.substring(i, i + 3) === m) {
                            if (currentStr.length > 0) tokens.push({ type: 'text', val: currentStr });
                            tokens.push({ type: 'key', val: macros[m] });
                            currentStr = "";
                            i += 2;
                            matched = true;
                            break;
                        }
                    }
                    if (!matched) {
                        currentStr += processedText[i];
                    }
                }
                if (currentStr.length > 0) tokens.push({ type: 'text', val: currentStr });
                
                let startX = bX + 40;
                let charX = startX;
                let charY = bY + 30; // Top-left alignment inside banner
                
                let charCount = 0;
                
                // Use regular for loop to allow breaking
                for (let t = 0; t < tokens.length; t++) {
                    const token = tokens[t];
                    
                    if (token.type === 'text') {
                        for (let i = 0; i < token.val.length; i++) {
                            charCount++;
                            const char = token.val[i];
                            if (char === '\n') {
                                charX = startX;
                                charY += 36;
                                continue;
                            }
                            if (char === ' ') {
                                charX += 16;
                                continue;
                            }
                            
                            const bounceY = Math.sin(this.tutorialWaveTimer * 10 + charCount) * 1.5;
                            
                            const charIdx = charset.indexOf(char);
                            let imgToDraw = null;
                            
                            if (charIdx !== -1) {
                                imgToDraw = this.tutorialFontImages[charIdx]; 
                            }
                            
                            if (imgToDraw) {
                                this.ctx.drawImage(imgToDraw, charX, charY + bounceY);
                                charX += imgToDraw.width - 4;
                            } else {
                                this.ctx.save();
                                this.ctx.fillStyle = '#000000';
                                this.ctx.font = 'bold 24px "Outfit", sans-serif';
                                this.ctx.textAlign = 'left';
                                this.ctx.fillText(char, charX, charY + 24 + bounceY);
                                this.ctx.restore();
                                charX += 16;
                            }
                        }
                    } else if (token.type === 'key') {
                        charCount++;
                        const bounceY = Math.sin(this.tutorialWaveTimer * 10 + charCount) * 1.5;
                        const keyName = token.val;
                        const img = this.getKeyImage(keyName);
                        
                        if (img && img.loaded && !img.error) {
                            this.ctx.drawImage(img, charX, charY + 6 + bounceY); // Adjust Y for vertical alignment
                            charX += img.width + 4;
                        } else if (this.tutorialBlankKeyLoaded) {
                            // Fallback to blank key
                            const bImg = this.tutorialBlankKeyImage;
                            this.ctx.drawImage(bImg, charX, charY + 6 + bounceY);
                            
                            let totalW = 0;
                            for(let i=0; i<keyName.length; i++) {
                               const c = keyName[i];
                               const idx = charset.indexOf(c);
                               if (c === ' ') totalW += 16;
                               else if (idx !== -1 && this.tutorialFontImages[idx]) totalW += this.tutorialFontImages[idx].width - 4;
                               else totalW += 16;
                            }
                            if (keyName.length > 0) totalW -= -2;

                            let kx = charX + bImg.width/2 - totalW/2;
                            let ky = charY - 2; // Align with regular text baseline but slightly higher
                            for(let i=0; i<keyName.length; i++) {
                               const c = keyName[i];
                               if (c === ' ') { kx += 16; continue; }
                               const idx = charset.indexOf(c);
                               if (idx !== -1 && this.tutorialFontImages[idx]) {
                                   this.ctx.drawImage(this.tutorialFontImages[idx], kx, ky + bounceY);
                                   kx += this.tutorialFontImages[idx].width - 4;
                               } else {
                                   this.ctx.save();
                                   this.ctx.fillStyle = '#000000';
                                   this.ctx.font = 'bold 14px "Outfit", sans-serif';
                                   this.ctx.fillText(c, kx, ky + 12 + bounceY);
                                   this.ctx.restore();
                                   kx += 16;
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
            
            this.ctx.fillStyle = 'white';
            this.ctx.font = '30px "Outfit", sans-serif';
            if (Math.floor(Date.now() / 600) % 2 === 0) {
                const lang = this.settings.language || 'ko';
                const pressText = i18n[lang]['title.press'];
                this.ctx.fillText(pressText, this.canvas.width / 2, this.canvas.height / 2 + 60);
            }
        }

        if (this.transitionState !== 'NONE' && this.transitionAlpha > 0) {
            this.ctx.fillStyle = `rgba(0, 0, 0, ${this.transitionAlpha})`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
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

        // Mouse snapped crosshair
        const snapX = this.snapToGrid(this.mousePos.x);
        const snapY = this.snapToGrid(this.mousePos.y);
        ctx.fillStyle = '#00aa9e66';
        ctx.fillRect(snapX, snapY, this.gridSize, this.gridSize);

        // Drag Preview
        if (this.dragStart) {
            const endX = this.snapToGrid(this.mousePos.x);
            const endY = this.snapToGrid(this.mousePos.y);
            let w = endX - this.dragStart.x;
            let h = endY - this.dragStart.y;
            if (w === 0) w = this.gridSize;
            if (h === 0) h = this.gridSize;

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(this.dragStart.x, this.dragStart.y, w, h);
            ctx.setLineDash([]);
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

new Game();
