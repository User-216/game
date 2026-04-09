

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.speedMeter = document.getElementById('speed-meter');
        this.climbMeter = document.getElementById('climb-speed-meter');
        this.stateInfo = document.getElementById('state-info');
        
        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.player = new Player(100, 300);
        this.entities = [];
        this.keys = {};
        this.camera = { x: 0, y: 0 };
        
        this.initRooms();
        this.loadRoom('A');
        
        this.isEditorMode = false;
        this.selectedType = 'platform';
        this.gridSize = 40;
        this.dragStart = null;
        this.mousePos = { x: 0, y: 0 };
        
        this.setupInputs();
        this.setupEditorUI();
        this.loop();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    setupInputs() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            if (e.key === 'e' || e.key === 'E') {
                this.toggleEditorMode();
            }
        });
        window.addEventListener('keyup', (e) => this.keys[e.key] = false);

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
                document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedType = btn.dataset.type;
            });
        });

        // Export button
        const exportBtn = document.getElementById('export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportLevel());
        }
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
            case 'hallway': entity = new Hallway(x, y, w, h); break;
            case 'door': entity = new Door(x, y, w, h, 'NEW', 'A'); break;
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
        let code = `this.entities.push(\n`;
        this.entities.forEach(ent => {
            let line = `    `;
            if (ent instanceof Platform) line += `new Platform(${ent.x}, ${ent.y}, ${ent.width}, ${ent.height}, '${ent.color}')`;
            else if (ent instanceof Slope) line += `new Slope(${ent.x}, ${ent.y}, ${ent.width}, ${ent.height}, '${ent.type}')`;
            else if (ent instanceof Destroyable) line += `new Destroyable(${ent.x}, ${ent.y}, ${ent.width}, ${ent.height})`;
            else if (ent instanceof Hallway) line += `new Hallway(${ent.x}, ${ent.y}, ${ent.width}, ${ent.height})`;
            else if (ent instanceof Door) line += `new Door(${ent.x}, ${ent.y}, ${ent.width}, ${ent.height}, '${ent.label}', '${ent.targetRoom}')`;
            code += line + `,\n`;
        });
        code += `);`;
        
        navigator.clipboard.writeText(code).then(() => {
            alert("Level code copied to clipboard! Paste it into initRooms() in game.js");
        });
    }

    initRooms() {
        this.rooms = {
            'A': () => {
                // Room A: Central Hub
                this.entities.push(new Platform(0, 500, 1000, 50, '#1a1f2b')); // Floor
                this.entities.push(new Hallway(0, 300, 1000, 200));
                
                this.entities.push(new Door(200, 420, 40, 80, 'A', 'B')); // To Room B
                this.entities.push(new Door(500, 420, 50, 80, 'B', 'C')); // To Room C
                this.entities.push(new Door(800, 420, 50, 80, 'C', 'A')); // Self loop test
                
                this.entities.push(new Platform(300, 400, 100, 20)); // Little ledge
            },
            'B': () => {
                // Room B: Challenge (Climbing & Precision)
                this.entities.push(new Platform(0, 500, 2000, 50, '#1a1f2b'));
                this.entities.push(new Platform(400, 100, 50, 400, '#ff0073')); // Tall wall for climbing
                this.entities.push(new Platform(400, 100, 400, 20, '#ff0073')); // Ledge
                
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
                this.entities.push(new Platform(0, 500, 5000, 50, '#1a1f2b'));
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

    loadRoom(roomName) {
        if (!this.rooms[roomName]) return;
        
        console.log(`Loading Room: ${roomName}`);
        this.entities = [];
        this.rooms[roomName]();
        
        // Reset player
        this.player.x = 100;
        this.player.y = 300;
        this.player.vx = 0;
        this.player.vy = 0;
        this.player.isGrounded = false;
        this.player.isClimbing = false;
        this.player.isDrifting = false;
        this.player.isDrifting1 = false;
        
        this.currentRoom = roomName;
    }

    update() {
        this.player.update(this.keys, this.entities);
        
        // Camera Follow (Lerp)
        const targetX = this.player.x - this.canvas.width / 2 + this.player.width / 2;
        const targetY = this.player.y - this.canvas.height / 2 + this.player.height / 2;
        this.camera.x += (targetX - this.camera.x) * 0.1;
        this.camera.y += (targetY - this.camera.y) * 0.1;
        
        // Update speed meters UI
        const hSpeed = Math.round(Math.abs(this.player.vx) * 10);
        const vSpeed = Math.round(Math.abs(this.player.vy) * 10);
        this.speedMeter.innerText = `SPEED: ${hSpeed}`;
        this.climbMeter.innerText = `CLIMB: ${vSpeed}`;

        // Update state info UI
        let currentStates = [];
        if (this.player.isClimbing) currentStates.push("CLIMBING");
        else if (this.player.isRunning) currentStates.push("RUNNING");
        else if (this.player.isGrounded) currentStates.push("GROUNDED");
        else currentStates.push("AIRBORNE");

        if (this.player.isWalled && !this.player.isClimbing) currentStates.push("CLIMBING");
        if (this.player.isGroundPounding) currentStates.push("GROUNDPOUND");
        if (this.player.isDrifting) currentStates.push("DRIFTING");
        if (this.player.isDrifting1) currentStates.push("DRIFTING1");
        if (Math.abs(this.player.vx) >= this.player.machThreshold) currentStates.push("MACH");

        // Door Interaction Check
        const overlappingDoor = this.entities.find(e => 
            e.type === 'door' && 
            this.player.x < e.x + e.width &&
            this.player.x + this.player.width > e.x &&
            this.player.y < e.y + e.height &&
            this.player.y + this.player.height > e.y
        );

        if (overlappingDoor && this.keys['ArrowUp'] && this.player.isGrounded) {
            this.loadRoom(overlappingDoor.targetRoom);
            delete this.keys['ArrowUp']; // Prevent immediate multi-entry
        }

        this.stateInfo.innerText = `STATE: ${currentStates.join(" / ")} | ROOM: ${this.currentRoom}`;
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        // Render Hallways first (Background layer)
        this.entities.filter(e => e.type === 'hallway').forEach(e => e.render(this.ctx));
        
        // Render other entities
        this.entities.filter(e => e.type !== 'hallway').forEach(e => e.render(this.ctx));
        
        this.player.render(this.ctx);

        // Render Editor Overlays
        if (this.isEditorMode) {
            this.renderEditorGuides();
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

        // Mouse snapped crosshair
        const snapX = this.snapToGrid(this.mousePos.x);
        const snapY = this.snapToGrid(this.mousePos.y);
        ctx.fillStyle = 'rgba(0, 242, 255, 0.3)';
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
        requestAnimationFrame(() => this.loop());
    }
}

new Game();
