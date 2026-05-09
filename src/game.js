const i18n = {
    en: {
        'ui.speed': 'SPEED', 'ui.climb': 'CLIMB', 'ui.state': 'STATE', 'ui.room': 'ROOM',
        'tut.move': 'Move', 'tut.jump': 'Jump', 'tut.run': 'Run', 'tut.editor': 'Design Mode',
        'tut.hint': 'Wall jump is possible / Break destroyable blocks!',
        'menu.paused': 'PAUSED', 'menu.resume': 'Resume', 'menu.options': 'Options',
        'menu.restart': 'Restart Level', 'menu.exit': 'Exit to Title',
        'opt.title': 'OPTIONS', 'opt.game': 'Game', 'opt.audio': 'Audio', 'opt.video': 'Video',
        'opt.control': 'Control', 'opt.volume': 'Volume', 'opt.resolution': 'Resolution',
        'opt.window': 'Window Size', 'opt.fullscreen': 'Toggle Fullscreen', 'opt.language': 'Language',
        'opt.vsync': 'VSync', 'opt.texture': 'Texture Filtering', 'opt.screenshake': 'Screen Shake',
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
        'opt.control': '조작', 'opt.volume': '음량', 'opt.resolution': '해상도',
        'opt.window': '창 모드', 'opt.fullscreen': '전체화면 전환', 'opt.language': '언어',
        'opt.vsync': '수직 동기화(VSync)', 'opt.texture': '텍스처 필터링', 'opt.screenshake': '화면 흔들림',
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
        
        this.settings = {
            language: 'en',
            volume: 100,
            resolution: 'native',
            vsync: true,
            textureFiltering: false,
            screenShake: true,
            bindings: {
                left: 'ArrowLeft',
                right: 'ArrowRight',
                up: 'ArrowUp',
                down: 'ArrowDown',
                jump: 'z',
                run: 'Shift'
            }
        };
        this.bindingKeyFor = null;
        this.audio = new AudioManager(this.settings);

        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.gameState = 'TITLE';

        this.player = new Player(100, 300);
        this.entities = [];
        this.keys = {};
        this.camera = { x: 0, y: 0 };
        this.cameraShake = 0;
        
        this.initRooms();
        this.loadRoom('titlescreen');
        
        this.isEditorMode = false;
        this.selectedType = 'platform';
        this.gridSize = 40;
        this.dragStart = null;
        this.mousePos = { x: 0, y: 0 };
        
        this.setupInputs();
        this.setupEditorUI();
        this.setupMenuUI();
        this.translateUI();

        this.loop();
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
    }

    togglePause() {
        if (this.gameState === 'PLAYING') {
            this.gameState = 'PAUSED';
            if (this.audio) this.audio.play('pause');
            document.getElementById('pause-overlay').style.display = 'flex';
            document.getElementById('pause-overlay').classList.remove('hidden');
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

        // Audio
        document.getElementById('volume-slider').addEventListener('input', (e) => {
            this.settings.volume = e.target.value;
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
        const canvasX = e.clientX - rect.left;
        const canvasY = e.clientY - rect.top;
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
        code += `this.entities.push(\n`;
        this.entities.forEach(ent => {
            let line = `    `;
            if (ent instanceof Platform) line += `new Platform(${ent.x}, ${ent.y}, ${ent.width}, ${ent.height}, '${ent.color}')`;
            else if (ent instanceof Slope) line += `new Slope(${ent.x}, ${ent.y}, ${ent.width}, ${ent.height}, '${ent.type}')`;
            else if (ent instanceof Destroyable) line += `new Destroyable(${ent.x}, ${ent.y}, ${ent.width}, ${ent.height})`;
            else if (ent instanceof Hallway) line += `new Hallway(${ent.x}, ${ent.y}, ${ent.width}, ${ent.height}, ${ent.targetRoom ? `'${ent.targetRoom}'` : 'null'}, ${ent.targetDoor ? `'${ent.targetDoor}'` : 'null'})`;
            else if (ent instanceof Door) line += `new Door(${ent.x}, ${ent.y}, ${ent.width}, ${ent.height}, '${ent.label}', '${ent.targetRoom}')`;
            else if (ent instanceof TargetDoorBase) line += `new TargetDoor_${ent.doorId}(${ent.x}, ${ent.y}, ${ent.width}, ${ent.height})`;
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

    loadRoom(roomName, targetDoorId = null) {
        // Save current room state to memory before switching
        if (this.currentRoom && this.rooms[this.currentRoom] && this.entities.length > 0) {
            const currentEntities = [...this.entities];
            const currentW = this.roomWidth;
            const currentH = this.roomHeight;
            this.rooms[this.currentRoom] = () => {
                this.roomWidth = currentW;
                this.roomHeight = currentH;
                currentEntities.forEach(ent => this.entities.push(ent));
            };
        }

        if (!this.rooms[roomName]) return;
        
        console.log(`Loading Room: ${roomName}`);
        this.entities = [];
        this.roomWidth = 0;
        this.roomHeight = 0;
        this.rooms[roomName]();
        
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
        this.player.vx = 0;
        this.player.vy = 0;
        this.player.isGrounded = false;
        this.player.isClimbing = false;
        this.player.isDrifting = false;
        this.player.isDrifting1 = false;
        this.player.hallwayCooldown = 60; // Prevent instant transition loop
        
        this.currentRoom = roomName;
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
            return;
        }

        this.keys.actionLeft = !!this.keys[this.settings.bindings.left];
        this.keys.actionRight = !!this.keys[this.settings.bindings.right];
        this.keys.actionUp = !!this.keys[this.settings.bindings.up];
        this.keys.actionDown = !!this.keys[this.settings.bindings.down];
        this.keys.actionJump = !!this.keys[this.settings.bindings.jump];
        this.keys.actionRun = !!this.keys[this.settings.bindings.run];

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
        let targetY = this.player.y - this.canvas.height / 2 + this.player.height / 2;
        
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

        this.camera.x += (targetX - this.camera.x) * 0.1;
        this.camera.y += (targetY - this.camera.y) * 0.1;
        
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
        else if (this.player.isRunning) currentStates.push(dict['state.running']);
        else if (this.player.isGrounded) currentStates.push(dict['state.grounded']);
        else currentStates.push(dict['state.airborne']);

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
            this.loadRoom(overlappingDoor.targetRoom);
            this.keys[this.settings.bindings.up] = false; // Prevent immediate multi-entry
            this.keys.actionUp = false;
        }

        // Hallway Transition Check
        if (this.player.hallwayCooldown > 0) {
            this.player.hallwayCooldown--;
        } else if (!this.player.isNoClip) {
            const overlappingHallway = this.entities.find(e => 
                e.type === 'hallway' && e.targetRoom && e.targetDoor && e.targetRoom !== 'null' && e.targetDoor !== 'null' &&
                this.player.x < e.x + e.width &&
                this.player.x + this.player.width > e.x &&
                this.player.y < e.y + e.height &&
                this.player.y + this.player.height > e.y
            );
            
            if (overlappingHallway) {
                this.loadRoom(overlappingHallway.targetRoom, overlappingHallway.targetDoor);
            }
        }

        this.stateInfo.innerText = `${dict['ui.state']}: ${currentStates.join(" / ")} | ${dict['ui.room']}: ${this.currentRoom}`;
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
        
        this.ctx.translate(-this.camera.x + shakeX, -this.camera.y + shakeY);
        
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

    loop() {
        this.update();
        this.render();
        if (this.settings.vsync) {
            requestAnimationFrame(() => this.loop());
        } else {
            // Uncapped / Fallback 60 FPS
            setTimeout(() => this.loop(), 1000 / 60);
        }
    }
}

new Game();
