

class Entity {
    constructor(x, y, width, height, color, flipX = false, flipY = false) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.isDestroyed = false;
        this.id = Math.random().toString(36).substr(2, 9);
        this.flipX = !!flipX;
        this.flipY = !!flipY;
    }

    render(ctx) {
        if (this.isDestroyed) return;
        ctx.save();
        if (this.flipX || this.flipY) {
            const cx = this.x + this.width / 2;
            const cy = this.y + this.height / 2;
            ctx.translate(cx, cy);
            ctx.scale(this.flipX ? -1 : 1, this.flipY ? -1 : 1);
            ctx.translate(-cx, -cy);
        }
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.restore();
    }
}

class Platform extends Entity {
    constructor(x, y, width, height, color = '#00aa9e66') {
        super(x, y, width, height, color);
        this.type = 'platform';
    }

    render(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

class OneWayPlatform extends Entity {
    constructor(x, y, width, height, color = '#9e00aa66') { // Purple color
        super(x, y, width, height, color);
        this.type = 'oneway';
    }

    render(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        // Draw a top border to indicate one-way direction
        ctx.fillStyle = '#ffffff99';
        ctx.fillRect(this.x, this.y, this.width, Math.min(this.height, 4));
    }
}

class Ladder extends Entity {
    constructor(x, y, width, height, color = '#d2691e66') { // Chocolate/brown color
        super(x, y, width, height, color);
        this.type = 'ladder';
    }

    render(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        // Draw ladder rungs
        ctx.strokeStyle = '#ffffff99';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let yy = this.y + 10; yy < this.y + this.height; yy += 20) {
            ctx.moveTo(this.x, yy);
            ctx.lineTo(this.x + this.width, yy);
        }
        ctx.stroke();
    }
}

class Slope extends Entity {
    constructor(x, y, width, height, slopeType = 'left-up', color = '#FF9FA266', flipX = false, flipY = false) {
        super(x, y, width, height, color, flipX, flipY);
        this.type = slopeType; // 'left-up' / or 'right-up' \
    }

    render(ctx) {
        ctx.save();
        if (this.flipY) {
            const cx = this.x + this.width / 2;
            const cy = this.y + this.height / 2;
            ctx.translate(cx, cy);
            ctx.scale(1, -1);
            ctx.translate(-cx, -cy);
        }
        ctx.fillStyle = this.color;
        ctx.beginPath();
        if (this.type === 'left-up') {
            // /  (Bottom-left to Top-right)
            ctx.moveTo(this.x, this.y + this.height);
            ctx.lineTo(this.x + this.width, this.y);
            ctx.lineTo(this.x + this.width, this.y + this.height);
        } else {
            // \  (Top-left to Bottom-right)
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + this.width, this.y + this.height);
            ctx.lineTo(this.x, this.y + this.height);
        }
        ctx.closePath();
        ctx.fill();
        
        // Stroke for better visibility
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    }
}

class Destroyable extends Entity {
    constructor(x, y, width, height, color = '#df7208', flipX = false, flipY = false) {
        super(x, y, width, height, color, flipX, flipY);
        this.health = 1;
        this.particles = [];
        this.type = 'destroyable';
        Destroyable.initImages();
    }

    static initImages() {
        if (!Destroyable.imageSmall) {
            Destroyable.imageSmall = new Image();
            Destroyable.imageSmall.src = '이미지/spr_towerblocksmall.png';
        }
        if (!Destroyable.imageBig) {
            Destroyable.imageBig = new Image();
            Destroyable.imageBig.src = '이미지/spr_towerblock.png';
        }
    }

    destroy() {
        if (this.isDestroyed) return;
        this.isDestroyed = true;
        const g = (typeof window !== 'undefined' ? (window.gameInstance || window.game) : null);
        if (g && g.persistentDestruction && !g.isEditorMode && this.persistentId && g.destroyedEntityIds) {
            g.destroyedEntityIds.add(this.persistentId);
        }
        const particleColors = ['#df7208', '#7f2800', '#ffaa44', '#b85400'];
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                size: Math.random() * 4 + 2,
                life: 1.0,
                decay: Math.random() * 0.05 + 0.01,
                color: particleColors[Math.floor(Math.random() * particleColors.length)]
            });
        }
    }

    render(ctx) {
        if (!this.isDestroyed) {
            const isSmall = (this.width <= 32 && this.height <= 32);
            const img = isSmall ? Destroyable.imageSmall : Destroyable.imageBig;
            const tileSize = isSmall ? 32 : 64;

            ctx.save();
            if (this.flipX || this.flipY) {
                const cx = this.x + this.width / 2;
                const cy = this.y + this.height / 2;
                ctx.translate(cx, cy);
                ctx.scale(this.flipX ? -1 : 1, this.flipY ? -1 : 1);
                ctx.translate(-cx, -cy);
            }

            if (img && img.complete && img.naturalWidth > 0) {
                ctx.imageSmoothingEnabled = false;
                if (this.width === tileSize && this.height === tileSize) {
                    ctx.drawImage(img, this.x, this.y, tileSize, tileSize);
                } else {
                    for (let ox = 0; ox < this.width; ox += tileSize) {
                        for (let oy = 0; oy < this.height; oy += tileSize) {
                            const dw = Math.min(tileSize, this.width - ox);
                            const dh = Math.min(tileSize, this.height - oy);
                            ctx.drawImage(img, 0, 0, dw, dh, this.x + ox, this.y + oy, dw, dh);
                        }
                    }
                }
            } else {
                ctx.fillStyle = this.color;
                ctx.fillRect(this.x, this.y, this.width, this.height);
                
                // Add cross pattern for visual hint
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(this.x + 5, this.y + 5);
                ctx.lineTo(this.x + this.width - 5, this.y + this.height - 5);
                ctx.moveTo(this.x + this.width - 5, this.y + 5);
                ctx.lineTo(this.x + 5, this.y + this.height - 5);
                ctx.stroke();
            }
            ctx.restore();
        }

        // Always update and render particles
        this.particles.forEach((p, index) => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2; // gravity for particles
            p.life -= p.decay;
            
            if (p.life <= 0) {
                this.particles.splice(index, 1);
            } else {
                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.color;
                ctx.fillRect(p.x, p.y, p.size, p.size);
            }
        });
        ctx.globalAlpha = 1.0;
    }
}
Destroyable.initImages();



class PizzaBlockDead extends Entity {
    static spritesSmall = [];
    static spritesBig = [];
    static imagesLoaded = false;

    static initImages() {
        if (PizzaBlockDead.imagesLoaded) return;
        PizzaBlockDead.spritesSmall = [];
        PizzaBlockDead.spritesBig = [];

        // spr_pizzablockdead: 9 frames (61x61)
        for (let i = 0; i < 9; i++) {
            const img = new Image();
            img.src = `이미지/spr_pizzablockdead/spr_pizzablockdead_${i}.png`;
            PizzaBlockDead.spritesSmall.push(img);
        }

        // spr_bigpizzablockdead: 10 frames (149x141)
        for (let i = 0; i < 10; i++) {
            const img = new Image();
            img.src = `이미지/spr_bigpizzablockdead/spr_bigpizzablockdead_${i}.png`;
            PizzaBlockDead.spritesBig.push(img);
        }

        PizzaBlockDead.imagesLoaded = true;
    }

    constructor(cx, cy, isBig = false) {
        const w = isBig ? 149 : 61;
        const h = isBig ? 141 : 61;
        super(cx - w / 2, cy - h / 2, w, h, 'transparent');
        this.type = 'obj_debris';
        this.isSolid = false;
        this.isPlatform = false;
        this.renderBehind = false;
        this.isBig = isBig;
        this.image_index = 0;
        this.image_speed = 0.38;
        this.vx = (Math.random() - 0.5) * 1.5;
        this.vy = -1.2;
        this.gravity = 0.12;
        PizzaBlockDead.initImages();
    }

    update(game) {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.image_index += this.image_speed;

        const frames = this.isBig ? PizzaBlockDead.spritesBig : PizzaBlockDead.spritesSmall;
        if (this.image_index >= frames.length) {
            this.markedForDeletion = true;
        }
    }

    render(ctx) {
        const frames = this.isBig ? PizzaBlockDead.spritesBig : PizzaBlockDead.spritesSmall;
        const frameIdx = Math.floor(this.image_index);
        if (frameIdx < frames.length) {
            const img = frames[frameIdx];
            if (img && img.complete && img.naturalWidth > 0) {
                ctx.drawImage(img, Math.round(this.x), Math.round(this.y), this.width, this.height);
            }
        }
    }
}

class AppleBlock extends Destroyable {
    static spritesSmall = [];
    static spritesBig = [];
    static imagesLoaded = false;

    static initImages() {
        if (AppleBlock.imagesLoaded) return;
        AppleBlock.spritesSmall = [];
        AppleBlock.spritesBig = [];

        // spr_destroyable2: 10 frames (32x32)
        for (let i = 0; i < 10; i++) {
            const img = new Image();
            img.src = `이미지/spr_destroyable2/spr_destroyable2_${i}.png`;
            AppleBlock.spritesSmall.push(img);
        }

        // spr_bigbreakable2: 12 frames (64x64)
        for (let i = 0; i < 12; i++) {
            const img = new Image();
            img.src = `이미지/spr_bigbreakable2/spr_bigbreakable2_${i}.png`;
            AppleBlock.spritesBig.push(img);
        }

        PizzaBlockDead.initImages();
        AppleBlock.imagesLoaded = true;
    }

    constructor(x, y, width = 16, height = 16, isBig = null, flipX = false, flipY = false) {
        let actualBig = false;
        if (typeof isBig === 'boolean') {
            actualBig = isBig;
        } else {
            actualBig = (width >= 32 && height >= 32);
        }

        super(x, y, width, height, '#e74c3c', flipX, flipY);
        this.isBig = actualBig;
        this.type = this.isBig ? 'appleblock_big' : 'appleblock_small';
        this.isSolid = true;
        this.isPlatform = false;
        this.points = this.isBig ? 100 : 10;
        this.image_index = Math.random() * 5;
        this.image_speed = this.isBig ? 0.35 : 0.2;
        AppleBlock.initImages();
    }

    destroy(game = window.gameInstance) {
        if (this.isDestroyed) return;
        this.isDestroyed = true;
        this.isSolid = false;
        this.isPlatform = false;

        const g = game || window.gameInstance || window.game;
        if (g && g.persistentDestruction && !g.isEditorMode && this.persistentId && g.destroyedEntityIds) {
            g.destroyedEntityIds.add(this.persistentId);
        }
        if (g) {
            // Break sound
            if (g.audio && g.audio.play) {
                g.audio.play('break');
            }

            // Score
            if (g.score === undefined) g.score = 0;
            g.score += this.points;

            // Combo timer: 16x16 increases like fruit (+20), 32x32 sets to max combo time (60)
            if (g.combo > 0) {
                if (this.isBig) {
                    g.comboTimer = 60; // Max combo time
                } else {
                    g.comboTimer = Math.min(60, (g.comboTimer || 0) + 20); // Fruit combo time
                }
            }

            // Floating score popup (+10 or +100)
            g.floatingTexts = g.floatingTexts || [];
            g.floatingTexts.push({
                x: this.x + this.width / 2,
                y: this.y,
                text: this.points.toString(),
                alpha: 1.0,
                vy: -1.2
            });

            // Track destroyed block for level reload / escape
            g.destroyedBlocks = g.destroyedBlocks || [];
            if (!g.destroyedBlocks.includes(this)) {
                g.destroyedBlocks.push(this);
            }

            // Spawn PizzaBlockDead debris
            const cx = this.x + this.width / 2;
            const cy = this.y + this.height / 2;
            const deadEffect = new PizzaBlockDead(cx, cy, this.isBig);
            g.entities.push(deadEffect);
        }
    }

    render(ctx) {
        if (!this.isDestroyed) {
            ctx.save();
            if (this.flipX || this.flipY) {
                const cx = this.x + this.width / 2;
                const cy = this.y + this.height / 2;
                ctx.translate(cx, cy);
                ctx.scale(this.flipX ? -1 : 1, this.flipY ? -1 : 1);
                ctx.translate(-cx, -cy);
            }

            const frames = this.isBig ? AppleBlock.spritesBig : AppleBlock.spritesSmall;
            if (frames && frames.length > 0) {
                this.image_index = (this.image_index + this.image_speed) % frames.length;
                const frameIdx = Math.floor(this.image_index);
                const img = frames[frameIdx];
                if (img && img.complete && img.naturalWidth > 0) {
                    ctx.imageSmoothingEnabled = false;
                    ctx.drawImage(img, this.x, this.y, this.width, this.height);
                } else {
                    ctx.fillStyle = this.isBig ? '#c0392b' : '#e74c3c';
                    ctx.fillRect(this.x, this.y, this.width, this.height);
                }
            } else {
                ctx.fillStyle = this.isBig ? '#c0392b' : '#e74c3c';
                ctx.fillRect(this.x, this.y, this.width, this.height);
            }

            // Editor mode outline
            const isEditor = (window.gameInstance && window.gameInstance.isEditorMode) || (window.game && window.game.isEditorMode);
            if (isEditor) {
                ctx.strokeStyle = '#2ecc71';
                ctx.lineWidth = 1;
                ctx.strokeRect(this.x, this.y, this.width, this.height);
            }

            ctx.restore();
        }
    }
}

class AppleBlockSmall extends AppleBlock {
    constructor(x, y, width = 16, height = 16, isBig = false, flipX = false, flipY = false) {
        super(x, y, width, height, false, flipX, flipY);
    }
}

class AppleBlockBig extends AppleBlock {
    constructor(x, y, width = 32, height = 32, isBig = true, flipX = false, flipY = false) {
        super(x, y, width, height, true, flipX, flipY);
    }
}

AppleBlock.initImages();
PizzaBlockDead.initImages();




class SecretPortal extends Entity {
    static spritesIdle = [];
    static spritesClose = [];
    static imagesLoaded = false;

    static initImages() {
        if (SecretPortal.imagesLoaded) return;
        SecretPortal.spritesIdle = [];
        SecretPortal.spritesClose = [];

        // spr_secretportal_idle: 14 frames (0 to 13)
        for (let i = 0; i < 14; i++) {
            const img = new Image();
            img.src = `이미지/spr_secretportal_idle/spr_secretportal_idle_${i}.png`;
            SecretPortal.spritesIdle.push(img);
        }

        // spr_secretportal_close: 16 frames (0 to 15)
        for (let i = 0; i < 16; i++) {
            const img = new Image();
            img.src = `이미지/spr_secretportal_close/spr_secretportal_close_${i}.png`;
            SecretPortal.spritesClose.push(img);
        }

        SecretPortal.imagesLoaded = true;
    }

    constructor(x, y, width = 64, height = 64, targetRoom = 'cider_1', flipX = false, flipY = false) {
        super(x, y, width, height, 'rgba(142, 68, 173, 0.4)', flipX, flipY);
        this.type = 'secretportal';
        this.targetRoom = targetRoom || '';
        this.isSolid = false;
        this.isPlatform = false;
        this.state = 'idle'; // 'idle' | 'close'
        this.image_index = 0;
        this.image_speed = 0.35;
        this.renderBehind = false;
        SecretPortal.initImages();
    }

    convertToExit(game = window.gameInstance) {
        const exit = new SecretPortalExit(this.x, this.y, this.width, this.height, this.flipX, this.flipY, this);
        exit.originalPortal = this;
        exit.isConvertedFromPortal = true;
        exit.targetRoom = this.targetRoom;
        this.convertedExit = exit;

        const g = game || window.gameInstance || window.game;
        if (g) {
            if (!g.convertedPortals) g.convertedPortals = [];
            if (!g.convertedPortals.includes(exit)) g.convertedPortals.push(exit);

            if (g.entities) {
                const idx = g.entities.indexOf(this);
                if (idx !== -1) {
                    g.entities[idx] = exit;
                } else {
                    g.entities.push(exit);
                }
            }
        }
        return exit;
    }

    update(game = window.gameInstance) {
        if (this.isDestroyed) return;
        const g = game || window.gameInstance || window.game;
        if (!g) return;

        SecretPortal.initImages();

        if (this.state === 'idle') {
            const frames = SecretPortal.spritesIdle;
            if (frames.length > 0) {
                this.image_index = (this.image_index + this.image_speed) % frames.length;
            }

            if (!g.isEditorMode && g.player && g.player.state !== 'secretportal' && g.player.state !== 'secretportal_exit' && g.player.state !== 'enterdoor') {
                if (Physics.checkCollision(this, g.player)) {
                    // Sucked into portal
                    this.state = 'close';
                    this.image_index = 0;
                    g.player.state = 'secretportal';
                    g.player.portalTarget = {
                        x: this.x + this.width / 2 - g.player.width / 2,
                        y: this.y + this.height / 2 - g.player.height / 2
                    };
                    g.player.portalScale = 1.0;
                    g.player.vx = 0;
                    g.player.vy = 0;
                }
            }
        } else if (this.state === 'close') {
            this.image_index += this.image_speed;

            if (g.player && g.player.state === 'secretportal') {
                const targetX = this.x + this.width / 2 - g.player.width / 2;
                const targetY = this.y + this.height / 2 - g.player.height / 2;
                g.player.x += (targetX - g.player.x) * 0.3;
                g.player.y += (targetY - g.player.y) * 0.3;
                if (g.player.portalScale !== undefined) {
                    g.player.portalScale = Math.max(0.05, g.player.portalScale * 0.88);
                }
            }

            const frames = SecretPortal.spritesClose;
            if (this.image_index >= frames.length) {
                this.state = 'idle';
                this.image_index = 0;
                if (g.player) {
                    g.player.portalScale = 1.0;
                }
                if (this.targetRoom) {
                    if (typeof g.triggerSecretPortalTransition === 'function') {
                        g.triggerSecretPortalTransition(this.targetRoom);
                    } else if (typeof g.triggerRoomTransition === 'function') {
                        g.isPortalTransition = true;
                        g.triggerRoomTransition(this.targetRoom, 'SECRET_PORTAL', false);
                    }
                } else {
                    if (g.player) g.player.state = 'normal';
                }
            }
        }
    }

    render(ctx) {
        if (this.isDestroyed) return;
        SecretPortal.initImages();

        const frames = (this.state === 'close') ? SecretPortal.spritesClose : SecretPortal.spritesIdle;
        const frameIdx = Math.min(frames.length - 1, Math.floor(this.image_index));
        const img = frames[frameIdx];

        ctx.save();
        if (img && img.complete && img.naturalWidth > 0) {
            const drawX = Math.round(this.x + this.width / 2 - 64);
            const drawY = Math.round(this.y + this.height / 2 - 64);
            ctx.drawImage(img, drawX, drawY, 128, 128);
        } else {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }

        const g = window.gameInstance;
        if (g && g.isEditorMode) {
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 11px Arial';
            ctx.textAlign = 'center';
            ctx.shadowColor = 'black';
            ctx.shadowBlur = 4;
            ctx.fillText(`PORTAL -> ${this.targetRoom || 'none'}`, this.x + this.width / 2, this.y - 6);
        }
        ctx.restore();
    }
}

class SecretPortalExit extends Entity {
    static spritesSpawnOpen = [];
    static spritesSpawnIdle = [];
    static spritesSpawnClose = [];
    static imagesLoaded = false;

    static initImages() {
        if (SecretPortalExit.imagesLoaded) return;
        SecretPortalExit.spritesSpawnOpen = [];
        SecretPortalExit.spritesSpawnIdle = [];
        SecretPortalExit.spritesSpawnClose = [];

        // spr_secretportal_spawnopen: 10 frames (0 to 9)
        for (let i = 0; i < 10; i++) {
            const img = new Image();
            img.src = `이미지/spr_secretportal_spawnopen/spr_secretportal_spawnopen_${i}.png`;
            SecretPortalExit.spritesSpawnOpen.push(img);
        }

        // spr_secretportal_spawnidle: 12 frames (0 to 11)
        for (let i = 0; i < 12; i++) {
            const img = new Image();
            img.src = `이미지/spr_secretportal_spawnidle/spr_secretportal_spawnidle_${i}.png`;
            SecretPortalExit.spritesSpawnIdle.push(img);
        }

        // spr_secretportal_spawnclose: 8 frames (0 to 7)
        for (let i = 0; i < 8; i++) {
            const img = new Image();
            img.src = `이미지/spr_secretportal_spawnclose/spr_secretportal_spawnclose_${i}.png`;
            SecretPortalExit.spritesSpawnClose.push(img);
        }

        SecretPortalExit.imagesLoaded = true;
    }

    constructor(x, y, width = 64, height = 64, flipX = false, flipY = false, originalPortal = null) {
        super(x, y, width, height, 'rgba(142, 68, 173, 0.4)', flipX, flipY);
        this.type = 'secretportalexit';
        this.isSolid = false;
        this.isPlatform = false;
        this.active = false;
        this.state = 'spawnidle'; // 'spawnopen' | 'spawnidle' | 'spawnclose'
        this.image_index = 0;
        this.image_speed = 0.35;
        this.idleRepeatCount = 0;
        this.renderBehind = false;
        this.originalPortal = originalPortal;
        SecretPortalExit.initImages();
    }

    convertToPortal(game = window.gameInstance) {
        let portal = this.originalPortal;
        if (!portal && (this.isConvertedFromPortal || this.targetRoom)) {
            portal = new SecretPortal(this.x, this.y, this.width, this.height, this.targetRoom || 'cider_1', this.flipX, this.flipY);
        }
        if (!portal) return null;

        portal.state = 'idle';
        portal.image_index = 0;
        portal.isDestroyed = false;
        portal.markedForDeletion = false;

        const g = game || window.gameInstance || window.game;
        if (g) {
            if (g.convertedPortals) {
                const cIdx = g.convertedPortals.indexOf(this);
                if (cIdx !== -1) g.convertedPortals.splice(cIdx, 1);
            }
            if (g.entities) {
                const idx = g.entities.indexOf(this);
                if (idx !== -1) {
                    g.entities[idx] = portal;
                } else if (!g.entities.includes(portal)) {
                    g.entities.push(portal);
                }
            }
        }
        return portal;
    }

    activate(player = null) {
        this.active = true;
        this.state = 'spawnopen';
        this.image_index = 0;
        this.idleRepeatCount = 0;
        if (player) {
            player.state = 'secretportal_exit';
            player.x = this.x + this.width / 2 - player.width / 2;
            player.y = this.y + this.height - player.height;
            player.vx = 0;
            player.vy = 0;
            player.visible = true;
            player.portalScale = 1.0;
        }
    }

    update(game = window.gameInstance) {
        if (this.isDestroyed || this.markedForDeletion) return;
        const g = game || window.gameInstance || window.game;
        if (!g) return;

        if (g.isEditorMode) {
            return;
        }

        SecretPortalExit.initImages();

        if (!this.active) {
            return;
        }

        if (this.state === 'spawnopen') {
            this.image_index += this.image_speed;

            if (g.player && g.player.state === 'secretportal_exit') {
                g.player.x = this.x + this.width / 2 - g.player.width / 2;
                g.player.y = this.y + this.height - g.player.height;
                g.player.vx = 0;
                g.player.vy = 0;
            }

            const frames = SecretPortalExit.spritesSpawnOpen;
            if (this.image_index >= frames.length) {
                this.state = 'spawnidle';
                this.image_index = 0;
                this.idleRepeatCount = 0;

                if (g.player && g.player.state === 'secretportal_exit') {
                    g.player.state = 'normal';
                    g.player.isGrounded = false;
                    g.player.vy = -6; // Pop player upwards out of the portal
                    g.player.sprite_index = 'spr_player_jump';
                    g.player.image_index = 0;
                }
            }
        } else if (this.state === 'spawnidle') {
            this.image_index += this.image_speed;
            const frames = SecretPortalExit.spritesSpawnIdle;
            if (this.image_index >= frames.length) {
                this.image_index = 0;
                this.idleRepeatCount++;
                if (this.idleRepeatCount >= 5) {
                    this.state = 'spawnclose';
                    this.image_index = 0;
                }
            }
        } else if (this.state === 'spawnclose') {
            this.image_index += this.image_speed;
            const frames = SecretPortalExit.spritesSpawnClose;
            if (this.image_index >= frames.length) {
                this.markedForDeletion = true;
            }
        }
    }

    render(ctx) {
        if (this.isDestroyed || this.markedForDeletion) return;
        SecretPortalExit.initImages();

        const g = window.gameInstance;
        let frames = SecretPortalExit.spritesSpawnIdle;
        if (this.state === 'spawnopen') frames = SecretPortalExit.spritesSpawnOpen;
        else if (this.state === 'spawnidle') frames = SecretPortalExit.spritesSpawnIdle;
        else if (this.state === 'spawnclose') frames = SecretPortalExit.spritesSpawnClose;

        const frameIdx = (this.active || (g && !g.isEditorMode)) 
            ? Math.min(frames.length - 1, Math.floor(this.image_index))
            : 0;
        const img = frames[frameIdx];

        ctx.save();
        if (img && img.complete && img.naturalWidth > 0) {
            const drawX = Math.round(this.x + this.width / 2 - 64);
            const drawY = Math.round(this.y + this.height / 2 - 64);
            ctx.drawImage(img, drawX, drawY, 128, 128);
        } else {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }

        if (g && g.isEditorMode) {
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 11px Arial';
            ctx.textAlign = 'center';
            ctx.shadowColor = 'black';
            ctx.shadowBlur = 4;
            ctx.fillText(`PORTAL EXIT`, this.x + this.width / 2, this.y - 6);
        }
        ctx.restore();
    }
}

SecretPortal.initImages();
SecretPortalExit.initImages();


class Metal extends Destroyable {
    constructor(x, y, width, height) {
        super(x, y, width, height, '#c2dedc');
        this.type = 'metal';
        Metal.initImages();
    }

    static initImages() {
        if (!Metal.image) {
            Metal.image = new Image();
            Metal.image.src = '이미지/spr_metaltowerblock.png';
        }
    }

    destroy(game = (typeof window !== 'undefined' ? window.gameInstance : null)) {
        if (this.isDestroyed) return;
        this.isDestroyed = true;
        const g = game || (typeof window !== 'undefined' ? window.gameInstance : null);
        if (g && g.persistentDestruction && !g.isEditorMode && this.persistentId && g.destroyedEntityIds) {
            g.destroyedEntityIds.add(this.persistentId);
        }
        if (g) {
            if (g.player) g.player.requestScreenShake = 20;
            if (g.cameraShake !== undefined) g.cameraShake = Math.max(g.cameraShake || 0, 20);
        }
        const metalColors = ['#c2dedc', '#65998f', '#888888', '#e0f4f2'];
        for (let i = 0; i < 24; i++) {
            this.particles.push({
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                vx: (Math.random() - 0.5) * 12,
                vy: (Math.random() - 0.5) * 12,
                size: Math.random() * 5 + 2,
                life: 1.0,
                decay: Math.random() * 0.04 + 0.01,
                color: metalColors[Math.floor(Math.random() * metalColors.length)]
            });
        }
    }

    render(ctx) {
        if (!this.isDestroyed) {
            const img = Metal.image;
            if (img && img.complete && img.naturalWidth > 0) {
                ctx.save();
                ctx.imageSmoothingEnabled = false;
                if (this.width === 64 && this.height === 64) {
                    ctx.drawImage(img, this.x, this.y, 64, 64);
                } else if (this.width <= 32 && this.height <= 32) {
                    ctx.drawImage(img, this.x, this.y, this.width, this.height);
                } else {
                    const tileSize = 64;
                    for (let ox = 0; ox < this.width; ox += tileSize) {
                        for (let oy = 0; oy < this.height; oy += tileSize) {
                            const dw = Math.min(tileSize, this.width - ox);
                            const dh = Math.min(tileSize, this.height - oy);
                            ctx.drawImage(img, 0, 0, dw, dh, this.x + ox, this.y + oy, dw, dh);
                        }
                    }
                }
                ctx.restore();
            } else {
                ctx.fillStyle = this.color;
                ctx.fillRect(this.x, this.y, this.width, this.height);
                ctx.strokeStyle = '#cccccc';
                ctx.lineWidth = 4;
                ctx.strokeRect(this.x + 2, this.y + 2, this.width - 4, this.height - 4);
                ctx.fillStyle = '#666666';
                ctx.fillRect(this.x + 6, this.y + 6, 4, 4);
                ctx.fillRect(this.x + this.width - 10, this.y + 6, 4, 4);
                ctx.fillRect(this.x + 6, this.y + this.height - 10, 4, 4);
                ctx.fillRect(this.x + this.width - 10, this.y + this.height - 10, 4, 4);
            }
        }
        this.particles.forEach((p, index) => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2;
            p.life -= p.decay;
            if (p.life <= 0) { this.particles.splice(index, 1); } else {
                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.color;
                ctx.fillRect(p.x, p.y, p.size, p.size);
            }
        });
        ctx.globalAlpha = 1.0;
    }
}
Metal.initImages();

class SecretBlock extends Destroyable {
    constructor(x, y, width = 32, height = 32) {
        super(x, y, width, height, 'rgba(223, 114, 8, 0.55)');
        this.type = 'obj_secretblock';
        this.isSecret = true;
        this.secretType = 'small';
    }

    destroy(game = window.gameInstance) {
        if (this.isDestroyed) return;
        const g = game || (typeof window !== 'undefined' ? window.gameInstance : null);
        if (g && g.isEditorMode) return;
        this.isDestroyed = true;
        if (g && g.persistentDestruction && !g.isEditorMode && this.persistentId && g.destroyedEntityIds) {
            g.destroyedEntityIds.add(this.persistentId);
        }

        const particleColors = ['#df7208', '#7f2800', '#ffaa44', '#b85400', '#ffd700'];
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                size: Math.random() * 4 + 2,
                life: 1.0,
                decay: Math.random() * 0.05 + 0.01,
                color: particleColors[Math.floor(Math.random() * particleColors.length)]
            });
        }

        this.destroyOverlappingTiles(game);
        this.spawnCutoffs(game);
    }

    spawnCutoffs(game = window.gameInstance) {
        const g = game || window.gameInstance;
        if (!g || !g.entities || g.isEditorMode) return;

        const addCutoff = (cutoff) => {
            cutoff.spawnedBySecret = true;
            g.entities.push(cutoff);
        };

        // 1. Activate any pre-placed obj_cutoff instances touching this block
        for (let i = 0; i < g.entities.length; i++) {
            const ent = g.entities[i];
            if (ent && (ent instanceof Cutoff || ent.type === 'obj_cutoff' || ent.type === 'obj_cutoffsmall')) {
                if (ent.x >= this.x - 32 && ent.x <= this.x + this.width + 32 &&
                    ent.y >= this.y - 32 && ent.y <= this.y + this.height + 32) {
                    ent.visible = true;
                }
            }
        }

        // Helper to check if a secret block exists at (px, py)
        const isSecretAt = (px, py) => {
            for (let i = 0; i < g.entities.length; i++) {
                const ent = g.entities[i];
                if (!ent) continue;
                if (ent.isSecret || ent.type === 'obj_secretblock' || ent.type === 'obj_secretbigblock' || ent.type === 'obj_secretmetalblock' ||
                    ent.type === 'secretblock' || ent.type === 'secretbigblock' || ent.type === 'secretmetalblock') {
                    if (px >= ent.x && px < ent.x + ent.width &&
                        py >= ent.y && py < ent.y + ent.height) {
                        return true;
                    }
                }
            }
            return false;
        };

        // Helper to check if a solid or layer-1 tile exists at (px, py)
        const isSolidOrTileAt = (px, py) => {
            for (let i = 0; i < g.entities.length; i++) {
                const ent = g.entities[i];
                if (!ent || ent.isDestroyed) continue;
                if (px >= ent.x && px < ent.x + ent.width &&
                    py >= ent.y && py < ent.y + ent.height) {
                    if (ent.isSecret) continue;
                    // Tiles: ONLY Layer 1 counts! Layer 2 and Layer 3 are NEVER solid walls!
                    if (ent instanceof Tile || ent.type === 'tile') {
                        const layer = ent.layer || 1;
                        return (layer === 1) && !(typeof Tile2 !== 'undefined' && ent instanceof Tile2) && !(typeof Tile3 !== 'undefined' && ent instanceof Tile3);
                    }
                    if (ent instanceof Platform || ent instanceof Metal || ent instanceof Destroyable || ent instanceof Slope ||
                        ent.type === 'platform' || ent.type === 'metal' || ent.type === 'destroyable' || ent.type === 'solid' || ent.type === 'slope' || ent.type === 'slope-left' || ent.type === 'slope-right' || ((ent instanceof EscapeBlockBase || ent.type === 'escapeblock_closed' || ent.type === 'escapeblock_open') && ent.isSolid)) {
                        return true;
                    }
                }
            }
            return false;
        };

        const shouldSpawnCutoff = (px, py) => {
            if (isSecretAt(px, py)) return false;
            return isSolidOrTileAt(px, py);
        };

        const hasCutoffAt = (x, y, side) => {
            return g.entities.some(e => (e instanceof Cutoff || e.type === 'obj_cutoff' || e.type === 'obj_cutoffsmall') &&
                Math.abs(e.x - x) < 4 && Math.abs(e.y - y) < 4 && e.side === side);
        };

        const bw = this.width;
        const bh = this.height;
        const bx = this.x;
        const by = this.y;

        // If 64x64 or larger block (SecretBigBlock, SecretMetalBlock):
        if (bw >= 64 && bh >= 64) {
            for (let ox = 0; ox < bw; ox += 64) {
                for (let oy = 0; oy < bh; oy += 64) {
                    const cx = bx + ox;
                    const cy = by + oy;

                    // TOP:
                    const topSolid0 = shouldSpawnCutoff(cx + 16, cy - 16);
                    const topSolid1 = shouldSpawnCutoff(cx + 48, cy - 16);
                    if (topSolid0 && topSolid1) {
                        if (!hasCutoffAt(cx, cy, 'top')) {
                            addCutoff(new Cutoff(cx, cy, 64, 64, 'top', '64x64'));
                        }
                    } else {
                        if (topSolid0 && !hasCutoffAt(cx, cy, 'top')) {
                            addCutoff(new Cutoff(cx, cy, 32, 64, 'top', '32x32', Math.floor(Math.random() * 6)));
                        }
                        if (topSolid1 && !hasCutoffAt(cx + 32, cy, 'top')) {
                            addCutoff(new Cutoff(cx + 32, cy, 32, 64, 'top', '32x32', Math.floor(Math.random() * 6)));
                        }
                    }

                    // BOTTOM:
                    const botSolid0 = shouldSpawnCutoff(cx + 16, cy + 64 + 16);
                    const botSolid1 = shouldSpawnCutoff(cx + 48, cy + 64 + 16);
                    if (botSolid0 && botSolid1) {
                        if (!hasCutoffAt(cx, cy + 64, 'bottom')) {
                            addCutoff(new Cutoff(cx, cy + 64, 64, 64, 'bottom', '64x64'));
                        }
                    } else {
                        if (botSolid0 && !hasCutoffAt(cx, cy + 64, 'bottom')) {
                            addCutoff(new Cutoff(cx, cy + 64, 32, 64, 'bottom', '32x32', Math.floor(Math.random() * 6)));
                        }
                        if (botSolid1 && !hasCutoffAt(cx + 32, cy + 64, 'bottom')) {
                            addCutoff(new Cutoff(cx + 32, cy + 64, 32, 64, 'bottom', '32x32', Math.floor(Math.random() * 6)));
                        }
                    }

                    // LEFT:
                    const leftSolid0 = shouldSpawnCutoff(cx - 16, cy + 16);
                    const leftSolid1 = shouldSpawnCutoff(cx - 16, cy + 48);
                    if (leftSolid0 && leftSolid1) {
                        if (!hasCutoffAt(cx, cy, 'left')) {
                            addCutoff(new Cutoff(cx, cy, 64, 64, 'left', '64x64'));
                        }
                    } else {
                        if (leftSolid0 && !hasCutoffAt(cx, cy, 'left')) {
                            addCutoff(new Cutoff(cx, cy, 64, 32, 'left', '32x32', Math.floor(Math.random() * 6)));
                        }
                        if (leftSolid1 && !hasCutoffAt(cx, cy + 32, 'left')) {
                            addCutoff(new Cutoff(cx, cy + 32, 64, 32, 'left', '32x32', Math.floor(Math.random() * 6)));
                        }
                    }

                    // RIGHT:
                    const rightSolid0 = shouldSpawnCutoff(cx + 64 + 16, cy + 16);
                    const rightSolid1 = shouldSpawnCutoff(cx + 64 + 16, cy + 48);
                    if (rightSolid0 && rightSolid1) {
                        if (!hasCutoffAt(cx + 64, cy, 'right')) {
                            addCutoff(new Cutoff(cx + 64, cy, 64, 64, 'right', '64x64'));
                        }
                    } else {
                        if (rightSolid0 && !hasCutoffAt(cx + 64, cy, 'right')) {
                            addCutoff(new Cutoff(cx + 64, cy, 64, 32, 'right', '32x32', Math.floor(Math.random() * 6)));
                        }
                        if (rightSolid1 && !hasCutoffAt(cx + 64, cy + 32, 'right')) {
                            addCutoff(new Cutoff(cx + 64, cy + 32, 64, 32, 'right', '32x32', Math.floor(Math.random() * 6)));
                        }
                    }
                }
            }
        } else {
            // 32x32 block (SecretBlock)
            for (let ox = 0; ox < bw; ox += 32) {
                for (let oy = 0; oy < bh; oy += 32) {
                    const cx = bx + ox;
                    const cy = by + oy;

                    // TOP:
                    if (shouldSpawnCutoff(cx + 16, cy - 16) && !hasCutoffAt(cx, cy, 'top')) {
                        addCutoff(new Cutoff(cx, cy, 32, 64, 'top', '32x32', Math.floor(Math.random() * 6)));
                    }
                    // BOTTOM:
                    if (shouldSpawnCutoff(cx + 16, cy + 32 + 16) && !hasCutoffAt(cx, cy + 32, 'bottom')) {
                        addCutoff(new Cutoff(cx, cy + 32, 32, 64, 'bottom', '32x32', Math.floor(Math.random() * 6)));
                    }
                    // LEFT:
                    if (shouldSpawnCutoff(cx - 16, cy + 16) && !hasCutoffAt(cx, cy, 'left')) {
                        addCutoff(new Cutoff(cx, cy, 64, 32, 'left', '32x32', Math.floor(Math.random() * 6)));
                    }
                    // RIGHT:
                    if (shouldSpawnCutoff(cx + 32 + 16, cy + 16) && !hasCutoffAt(cx + 32, cy, 'right')) {
                        addCutoff(new Cutoff(cx + 32, cy, 64, 32, 'right', '32x32', Math.floor(Math.random() * 6)));
                    }
                }
            }
        }

        // Clean up internal cutoffs that no longer border a solid/tile
        for (let i = g.entities.length - 1; i >= 0; i--) {
            const e = g.entities[i];
            if (e && (e instanceof Cutoff || e.type === 'obj_cutoff')) {
                let wallExists = false;
                if (e.side === 'top') {
                    wallExists = shouldSpawnCutoff(e.x + (e.spriteType === '64x64' ? 32 : 16), e.y - 16);
                } else if (e.side === 'bottom') {
                    wallExists = shouldSpawnCutoff(e.x + (e.spriteType === '64x64' ? 32 : 16), e.y + 16);
                } else if (e.side === 'left') {
                    wallExists = shouldSpawnCutoff(e.x - 16, e.y + (e.spriteType === '64x64' ? 32 : 16));
                } else if (e.side === 'right') {
                    wallExists = shouldSpawnCutoff(e.x + 16, e.y + (e.spriteType === '64x64' ? 32 : 16));
                }
                if (!wallExists) {
                    g.entities.splice(i, 1);
                }
            }
        }
    }

    destroyOverlappingTiles(game = window.gameInstance) {
        const g = game || window.gameInstance;
        if (!g || !g.entities) return;

        const bx1 = this.x;
        const by1 = this.y;
        const bx2 = this.x + this.width;
        const by2 = this.y + this.height;

        for (let i = g.entities.length - 1; i >= 0; i--) {
            const ent = g.entities[i];
            if (!ent || ent.isDestroyed) continue;

            const isTile = (ent instanceof Tile || ent.type === 'tile');
            if (isTile) {
                // Layer 1 only ("타일 1만")
                const layer = ent.layer || 1;
                const isLayer1 = (layer === 1) && !(ent instanceof Tile2) && !(ent instanceof Tile3);
                if (isLayer1) {
                    const overlapW = Math.min(bx2, ent.x + ent.width) - Math.max(bx1, ent.x);
                    const overlapH = Math.min(by2, ent.y + ent.height) - Math.max(by1, ent.y);
                    if (overlapW > 1 && overlapH > 1) {
                        ent.isDestroyed = true;
                        ent.markedForDeletion = true;
                        if (!g.destroyedBlocks) g.destroyedBlocks = [];
                        if (!g.destroyedBlocks.includes(ent)) {
                            g.destroyedBlocks.push(ent);
                        }
                        g.entities.splice(i, 1);
                    }
                }
            }
        }
    }

    render(ctx) {
        const isCollisionVisible = !!(window.gameInstance && (window.gameInstance.showCollisions || window.gameInstance.isEditorMode));

        if (!this.isDestroyed) {
            if (!isCollisionVisible) return;

            ctx.save();
            ctx.fillStyle = 'rgba(223, 114, 8, 0.55)';
            ctx.fillRect(this.x, this.y, this.width, this.height);

            const isSmall = (this.width <= 32 && this.height <= 32);
            const img = isSmall ? Destroyable.imageSmall : Destroyable.imageBig;
            const tileSize = isSmall ? 32 : 64;
            if (img && img.complete && img.naturalWidth > 0) {
                ctx.globalAlpha = 0.5;
                ctx.imageSmoothingEnabled = false;
                for (let ox = 0; ox < this.width; ox += tileSize) {
                    for (let oy = 0; oy < this.height; oy += tileSize) {
                        const dw = Math.min(tileSize, this.width - ox);
                        const dh = Math.min(tileSize, this.height - oy);
                        ctx.drawImage(img, 0, 0, dw, dh, this.x + ox, this.y + oy, dw, dh);
                    }
                }
                ctx.globalAlpha = 1.0;
            }

            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 2]);
            ctx.strokeRect(this.x + 1, this.y + 1, this.width - 2, this.height - 2);
            ctx.setLineDash([]);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px "Outfit", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const label = this.width >= 64 ? 'SECRET' : 'S';
            ctx.fillText(label, this.x + this.width / 2, this.y + this.height / 2);

            ctx.restore();
        }

        if (this.particles.length > 0) {
            for (let index = this.particles.length - 1; index >= 0; index--) {
                const p = this.particles[index];
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.2;
                p.life -= p.decay;

                if (p.life <= 0) {
                    this.particles.splice(index, 1);
                } else {
                    ctx.globalAlpha = p.life;
                    ctx.fillStyle = p.color;
                    ctx.fillRect(p.x, p.y, p.size, p.size);
                }
            }
            ctx.globalAlpha = 1.0;
        } else if (this.isDestroyed) {
            this.markedForDeletion = true;
        }
    }
}

class SecretBigBlock extends SecretBlock {
    constructor(x, y, width = 64, height = 64) {
        super(x, y, width, height);
        this.type = 'obj_secretbigblock';
        this.isSecret = true;
        this.secretType = 'big';
    }
}

class SecretMetalBlock extends Metal {
    constructor(x, y, width = 64, height = 64) {
        super(x, y, width, height);
        this.color = 'rgba(101, 153, 143, 0.6)';
        this.type = 'obj_secretmetalblock';
        this.isSecret = true;
        this.secretType = 'metal';
    }

    destroy(game = window.gameInstance) {
        if (this.isDestroyed) return;
        const g = game || (typeof window !== 'undefined' ? window.gameInstance : null);
        if (g && g.isEditorMode) return;
        this.isDestroyed = true;
        if (g && g.persistentDestruction && !g.isEditorMode && this.persistentId && g.destroyedEntityIds) {
            g.destroyedEntityIds.add(this.persistentId);
        }
        if (g) {
            if (g.player) g.player.requestScreenShake = 20;
            if (g.cameraShake !== undefined) g.cameraShake = Math.max(g.cameraShake || 0, 20);
        }

        const metalColors = ['#c2dedc', '#65998f', '#888888', '#e0f4f2', '#00ffff'];
        for (let i = 0; i < 24; i++) {
            this.particles.push({
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                vx: (Math.random() - 0.5) * 12,
                vy: (Math.random() - 0.5) * 12,
                size: Math.random() * 5 + 2,
                life: 1.0,
                decay: Math.random() * 0.04 + 0.01,
                color: metalColors[Math.floor(Math.random() * metalColors.length)]
            });
        }

        this.destroyOverlappingTiles(game);
        this.spawnCutoffs(game);
    }

    spawnCutoffs(game = window.gameInstance) {
        SecretBlock.prototype.spawnCutoffs.call(this, game);
    }

    destroyOverlappingTiles(game = window.gameInstance) {
        SecretBlock.prototype.destroyOverlappingTiles.call(this, game);
    }

    render(ctx) {
        const isCollisionVisible = !!(window.gameInstance && (window.gameInstance.showCollisions || window.gameInstance.isEditorMode));

        if (!this.isDestroyed) {
            if (!isCollisionVisible) return;

            ctx.save();
            ctx.fillStyle = 'rgba(101, 153, 143, 0.6)';
            ctx.fillRect(this.x, this.y, this.width, this.height);

            const img = Metal.image;
            if (img && img.complete && img.naturalWidth > 0) {
                ctx.globalAlpha = 0.5;
                ctx.imageSmoothingEnabled = false;
                const tileSize = 64;
                for (let ox = 0; ox < this.width; ox += tileSize) {
                    for (let oy = 0; oy < this.height; oy += tileSize) {
                        const dw = Math.min(tileSize, this.width - ox);
                        const dh = Math.min(tileSize, this.height - oy);
                        ctx.drawImage(img, 0, 0, dw, dh, this.x + ox, this.y + oy, dw, dh);
                    }
                }
                ctx.globalAlpha = 1.0;
            }

            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 2]);
            ctx.strokeRect(this.x + 1, this.y + 1, this.width - 2, this.height - 2);
            ctx.setLineDash([]);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px "Outfit", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const label = this.width >= 64 ? 'SEC MTL' : 'M';
            ctx.fillText(label, this.x + this.width / 2, this.y + this.height / 2);

            ctx.restore();
        }

        if (this.particles.length > 0) {
            for (let index = this.particles.length - 1; index >= 0; index--) {
                const p = this.particles[index];
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.2;
                p.life -= p.decay;

                if (p.life <= 0) {
                    this.particles.splice(index, 1);
                } else {
                    ctx.globalAlpha = p.life;
                    ctx.fillStyle = p.color;
                    ctx.fillRect(p.x, p.y, p.size, p.size);
                }
            }
            ctx.globalAlpha = 1.0;
        } else if (this.isDestroyed) {
            this.markedForDeletion = true;
        }
    }
}

// Global aliases for obj_secretblock, obj_secretbigblock, and obj_secretmetalblock
window.SecretBlock = SecretBlock;
window.obj_secretblock = SecretBlock;
window.SecretBigBlock = SecretBigBlock;
window.obj_secretbigblock = SecretBigBlock;
window.SecretMetalBlock = SecretMetalBlock;
window.obj_secretmetalblock = SecretMetalBlock;

class Cutoff extends Entity {
    constructor(x, y, width = 32, height = 64, side = 'top', spriteType = null, imageIndex = null, flipX = false, flipY = false) {
        super(x, y, width, height, 'transparent', flipX, flipY);
        this.type = 'obj_cutoff';
        this.side = side || 'top';
        this.spriteType = spriteType || ((width >= 64 && height >= 64) ? '64x64' : '32x32');
        this.imageIndex = (imageIndex !== null && imageIndex !== undefined) ? imageIndex : Math.floor(Math.random() * 6);
        this.visible = true;
        this.isCutoff = true;
        this.isSolid = false;
        Cutoff.initImages();
    }

    static initImages() {
        if (Cutoff.initialized) return;
        Cutoff.initialized = true;

        Cutoff.canvases64 = null;
        Cutoff.canvases32 = [];

        const img64 = new Image();
        img64.src = '이미지/spr_64x64cutoff.png';
        img64.onload = () => {
            Cutoff.canvases64 = Cutoff.createOrientations(img64, 64, 64);
        };

        for (let i = 0; i < 6; i++) {
            const img32 = new Image();
            img32.src = `이미지/spr_32x32cutoff/spr_32x32cutoff_${i}.png`;
            img32.onload = () => {
                Cutoff.canvases32[i] = Cutoff.createOrientations(img32, 32, 64);
            };
        }
    }

    static createOrientations(img, w, h) {
        // BOTTOM: normal (crack line at y=32, cracks extend DOWN into floor)
        const cBot = document.createElement('canvas');
        cBot.width = w;
        cBot.height = h;
        const ctxBot = cBot.getContext('2d');
        ctxBot.imageSmoothingEnabled = false;
        ctxBot.drawImage(img, 0, 0);

        // TOP: flipped vertically (crack line at y=32, cracks extend UP into ceiling)
        const cTop = document.createElement('canvas');
        cTop.width = w;
        cTop.height = h;
        const ctxTop = cTop.getContext('2d');
        ctxTop.imageSmoothingEnabled = false;
        ctxTop.translate(0, h);
        ctxTop.scale(1, -1);
        ctxTop.drawImage(img, 0, 0);

        // LEFT: 90 deg clockwise rotation (crack line at x=32, cracks extend LEFT into left wall)
        const cLeft = document.createElement('canvas');
        cLeft.width = h;
        cLeft.height = w;
        const ctxLeft = cLeft.getContext('2d');
        ctxLeft.imageSmoothingEnabled = false;
        ctxLeft.translate(h, 0);
        ctxLeft.rotate(Math.PI / 2);
        ctxLeft.drawImage(img, 0, 0);

        // RIGHT: -90 deg counter-clockwise rotation (crack line at x=32, cracks extend RIGHT into right wall)
        const cRight = document.createElement('canvas');
        cRight.width = h;
        cRight.height = w;
        const ctxRight = cRight.getContext('2d');
        ctxRight.imageSmoothingEnabled = false;
        ctxRight.translate(0, w);
        ctxRight.rotate(-Math.PI / 2);
        ctxRight.drawImage(img, 0, 0);

        return { top: cTop, bottom: cBot, left: cLeft, right: cRight };
    }

    render(ctx) {
        // 디자인(에디터) 모드일 때는 cutoff가 완전히 사라지도록(표시 안 됨) 즉시 반환
        const g = window.gameInstance;
        if (g && g.isEditorMode) return;
        if (!this.visible) return;

        let canvasObj = null;
        if (this.spriteType === '64x64') {
            canvasObj = Cutoff.canvases64;
        } else {
            const idx = Math.max(0, Math.min(5, this.imageIndex || 0));
            canvasObj = Cutoff.canvases32 ? Cutoff.canvases32[idx] : null;
        }

        if (canvasObj && canvasObj[this.side]) {
            const c = canvasObj[this.side];
            ctx.save();
            ctx.imageSmoothingEnabled = false;
            if (this.flipX || this.flipY) {
                const cx = this.x + this.width / 2;
                const cy = this.y + this.height / 2;
                ctx.translate(cx, cy);
                ctx.scale(this.flipX ? -1 : 1, this.flipY ? -1 : 1);
                ctx.translate(-cx, -cy);
            }
            if (this.side === 'top' || this.side === 'bottom') {
                ctx.drawImage(c, Math.round(this.x), Math.round(this.y - 32));
            } else {
                ctx.drawImage(c, Math.round(this.x - 32), Math.round(this.y));
            }
            ctx.restore();
        }
    }
}

// Global aliases for obj_cutoff
window.Cutoff = Cutoff;
window.obj_cutoff = Cutoff;
window.obj_cutoffsmall = Cutoff;

class Pillar extends Destroyable {
    constructor(x, y, width = 128, height = 224, flipX = false, flipY = false, escapeTime = 120) {
        super(x, y, width, height, '#b88958', flipX, flipY);
        this.type = 'pillar';
        this.isPillar = true;
        this.escapeTime = (typeof escapeTime === 'number' && escapeTime > 0) ? escapeTime : 120;
        this.debrisList = [];
        this.image_index = 0;
        this.image_speed = 0.3;
        Pillar.initImages();
    }

    static initImages() {
        if (!Pillar.frames) {
            Pillar.frames = [];
            for (let i = 0; i < 16; i++) {
                const img = new Image();
                img.src = `이미지/spr_pillarjohn/spr_pillar_${i}.png`;
                Pillar.frames.push(img);
            }
        }
        if (!Pillar.image && Pillar.frames && Pillar.frames.length > 0) {
            Pillar.image = Pillar.frames[0];
        }
        if (!Pillar.debrisImage) {
            Pillar.debrisImage = new Image();
            Pillar.debrisImage.src = '이미지/spr_pillarjohndebris.png';
        }
        if (!Pillar.debrisImages) {
            Pillar.debrisImages = [];
            for (let i = 0; i < 7; i++) {
                const dImg = new Image();
                dImg.src = `이미지/spr_kettle_debris/kettle_debris_${i}.png`;
                Pillar.debrisImages.push(dImg);
            }
        }
    }

    update(game) {
        if (!this.isDestroyed) {
            this.image_index += this.image_speed;
            if (Pillar.frames && Pillar.frames.length > 0) {
                if (this.image_index >= Pillar.frames.length) {
                    this.image_index = 0;
                }
            }
        }
    }

    destroy(game) {
        if (this.isDestroyed) return;
        this.isDestroyed = true;

        const g = game || (typeof window !== 'undefined' ? window.gameInstance : null);
        if (g && g.persistentDestruction && !g.isEditorMode && this.persistentId && g.destroyedEntityIds) {
            g.destroyedEntityIds.add(this.persistentId);
        }
        if (g) {
            // Activate Escape Sequence with this Pillar's custom escapeTime!
            const sec = (typeof this.escapeTime === 'number' && this.escapeTime > 0) ? this.escapeTime : 120;
            g.escapeTimer = sec;
            g.escapeTimeTotal = sec;
            g.escape = true;
            if (g.audio) {
                g.audio.escapeJumpTriggered = false;
                g.audio.escapeLoopEnabled = (sec > 50);
                if (sec <= 50 && typeof g.audio.triggerEscape50Jump === 'function') {
                    g.audio.triggerEscape50Jump();
                }
            }
            
            // Screen Shake
            if (g.player) {
                g.player.requestScreenShake = 30;
            }
            if (g.cameraShake !== undefined) {
                g.cameraShake = 30;
            }
            
            // Play powerful impact sound
            if (g.audio) {
                if (typeof g.audio.playFile === 'function') {
                    g.audio.playFile('sfx_groundpound', true);
                }
                if (typeof g.audio.play === 'function') {
                    g.audio.play('break');
                }
            }

            // Floating Text: "IT'S PIZZA TIME!"
            if (g.floatingTexts) {
                g.floatingTexts.push({
                    x: this.x + this.width / 2,
                    y: this.y - 20,
                    text: "IT'S PIZZA TIME!!",
                    alpha: 1.0,
                    vy: -2,
                    color: '#ff2222',
                    scale: 1.5
                });
            }
        }

        // Generate Kettle Ken debris particles (steam, boiling water drops, metallic chunks, lemon, teabag)
        const debrisColors = ['#d0d8e0', '#a0aab5', '#7a8590', '#ffd700', '#8b5a2b', '#ffffff', '#e8f0f8'];
        for (let i = 0; i < 55; i++) {
            this.particles.push({
                x: this.x + Math.random() * this.width,
                y: this.y + Math.random() * this.height,
                vx: (Math.random() - 0.5) * 18,
                vy: (Math.random() - 0.7) * 20,
                size: Math.random() * 8 + 4,
                life: 1.0,
                decay: Math.random() * 0.02 + 0.01,
                color: debrisColors[Math.floor(Math.random() * debrisColors.length)]
            });
        }
        // Flying larger kettle chunks (Lid, teabag, lemon, bolts, spout, plates)
        const debrisCount = (Pillar.debrisImages && Pillar.debrisImages.length > 0) ? Pillar.debrisImages.length : 8;
        for (let i = 0; i < debrisCount; i++) {
            const specificImg = (Pillar.debrisImages && Pillar.debrisImages[i % Pillar.debrisImages.length]) || Pillar.debrisImage;
            this.debrisList.push({
                x: this.x + this.width / 2,
                y: this.y + this.height * 0.4,
                vx: (Math.random() - 0.5) * 16,
                vy: (Math.random() - 0.85) * 20,
                angle: Math.random() * Math.PI * 2,
                vrot: (Math.random() - 0.5) * 0.4,
                size: Math.random() * 12 + 26,
                img: specificImg,
                alpha: 1.0,
                decay: 0.015
            });
        }
    }

    render(ctx) {
        if (!this.isDestroyed) {
            const frameIdx = Math.floor(this.image_index) % (Pillar.frames ? Pillar.frames.length : 1);
            const frameImg = (Pillar.frames && Pillar.frames[frameIdx] && Pillar.frames[frameIdx].complete && Pillar.frames[frameIdx].naturalWidth > 0)
                             ? Pillar.frames[frameIdx]
                             : Pillar.image;
            ctx.save();
            ctx.imageSmoothingEnabled = false;
            if (this.flipX || this.flipY) {
                const cx = this.x + this.width / 2;
                const cy = this.y + this.height / 2;
                ctx.translate(cx, cy);
                ctx.scale(this.flipX ? -1 : 1, this.flipY ? -1 : 1);
                ctx.translate(-cx, -cy);
            }
            if (frameImg && frameImg.complete && frameImg.naturalWidth > 0) {
                const drawW = frameImg.naturalWidth || this.width;
                const drawH = frameImg.naturalHeight || this.height;
                ctx.drawImage(frameImg, this.x, this.y, drawW, drawH);
            } else {
                // Procedural fallback
                ctx.fillStyle = this.color;
                ctx.fillRect(this.x, this.y, this.width, this.height);
                ctx.strokeStyle = '#4b3726';
                ctx.lineWidth = 3;
                ctx.strokeRect(this.x, this.y, this.width, this.height);
                // Draw face
                ctx.fillStyle = '#22150c';
                const eyeY = this.y + this.height * 0.35;
                ctx.fillRect(this.x + this.width * 0.25, eyeY, 8, 6);
                ctx.fillRect(this.x + this.width * 0.65, eyeY, 8, 6);
                ctx.fillRect(this.x + this.width * 0.45, eyeY + 12, 8, 14);
            }
            ctx.restore();

            // In Editor Mode: Display Escape Time badge above John Pillar!
            const g = (typeof window !== 'undefined' ? window.gameInstance : null);
            if (g && g.isEditorMode) {
                ctx.save();
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const cx = this.x + this.width / 2;
                const cy = this.y - 14;
                const sec = this.escapeTime || 120;
                const m = Math.floor(sec / 60);
                const s = Math.floor(sec % 60);
                const timeStr = `⏱️ ${m}:${s < 10 ? '0' : ''}${s} (${sec}s)`;

                ctx.font = 'bold 13px Arial';
                const textWidth = ctx.measureText(timeStr).width;
                ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
                ctx.strokeStyle = sec <= 50 ? '#ff3b30' : '#ffcc00';
                ctx.lineWidth = 2;
                ctx.beginPath();
                if (ctx.roundRect) ctx.roundRect(cx - textWidth / 2 - 8, cy - 11, textWidth + 16, 22, 6);
                else ctx.rect(cx - textWidth / 2 - 8, cy - 11, textWidth + 16, 22);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = sec <= 50 ? '#ff4d4d' : '#ffcc00';
                ctx.fillText(timeStr, cx, cy);
                ctx.restore();
            }
        }

        // Particles
        this.particles.forEach((p, index) => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.35;
            p.life -= p.decay;
            if (p.life <= 0) {
                this.particles.splice(index, 1);
            } else {
                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.color;
                ctx.fillRect(p.x, p.y, p.size, p.size);
            }
        });

        // Debris chunks (Kettle Ken pieces: Lid, Teabag, Lemon, Bolts, Spout)
        this.debrisList.forEach((d, index) => {
            d.x += d.vx;
            d.y += d.vy;
            d.vy += 0.45;
            d.angle += d.vrot;
            d.alpha -= d.decay;
            if (d.alpha <= 0) {
                this.debrisList.splice(index, 1);
            } else {
                ctx.save();
                ctx.globalAlpha = Math.max(0, d.alpha);
                ctx.translate(d.x, d.y);
                ctx.rotate(d.angle);
                const dImg = d.img || Pillar.debrisImage;
                if (dImg && dImg.complete && dImg.naturalWidth > 0) {
                    ctx.drawImage(dImg, -d.size / 2, -d.size / 2, d.size, d.size);
                } else {
                    ctx.fillStyle = '#c8d0d8';
                    ctx.fillRect(-d.size / 2, -d.size / 2, d.size, d.size);
                }
                ctx.restore();
            }
        });

        ctx.globalAlpha = 1.0;
    }
}
Pillar.initImages();


class EscapeBlockBase extends Entity {
    static closedFrames = [];
    static openFrames = [];
    static imagesLoaded = false;

    static initImages() {
        if (EscapeBlockBase.imagesLoaded) return;
        EscapeBlockBase.closedFrames = [];
        EscapeBlockBase.openFrames = [];
        for (let i = 0; i < 3; i++) {
            const imgC = new Image();
            imgC.src = `이미지/spr_escapeblock_closed/spr_escapeblock_closed_${i}.png`;
            imgC.onerror = () => { imgC.src = `이미지/spr_escapeblock_closed/spr_spaceblock_closed_${i}.png`; };
            EscapeBlockBase.closedFrames.push(imgC);

            const imgO = new Image();
            imgO.src = `이미지/spr_escapeblock_open/spr_escapeblock_open_${i}.png`;
            imgO.onerror = () => { imgO.src = `이미지/spr_escapeblock_open/spr_spaceblock_open_${i}.png`; };
            EscapeBlockBase.openFrames.push(imgO);
        }
        EscapeBlockBase.imagesLoaded = true;
    }

    constructor(x, y, width = 32, height = 32, mode = 'closed') {
        super(x, y, width, height, 'transparent');
        this.mode = mode; // 'closed' or 'open'
        this.type = (mode === 'closed') ? 'escapeblock_closed' : 'escapeblock_open';
        this.image_index = 0;
        this.image_speed = 0.25;
        this._overrideSolid = undefined;
        EscapeBlockBase.initImages();
    }

    get isSolid() {
        if (this._overrideSolid !== undefined) return this._overrideSolid;
        const game = window.gameInstance;
        const isEscape = !!(game && game.escape);
        // Mode 'closed': closed (solid) normally, opens (passable) during escape
        // Mode 'open': open (passable) normally, closes (solid) during escape
        return (this.mode === 'closed') ? !isEscape : isEscape;
    }

    set isSolid(val) {
        this._overrideSolid = val;
    }

    update(game) {
        this.image_index = (this.image_index + this.image_speed) % 3;
    }

    render(ctx) {
        if (this.isDestroyed) return;
        const game = window.gameInstance;
        const solidNow = this.isSolid; // true = closed (solid), false = open (passable)
        const frameIdx = Math.floor(this.image_index) % 3;
        const frames = solidNow ? EscapeBlockBase.closedFrames : EscapeBlockBase.openFrames;
        const img = (frames && frames.length > frameIdx) ? frames[frameIdx] : null;

        ctx.save();
        if (!solidNow) {
            // Open state: draw semi-transparent so player clearly sees it can be passed through
            ctx.globalAlpha = 0.55;
        }

        if (img && img.complete && img.naturalWidth > 0) {
            for (let bx = this.x; bx < this.x + this.width; bx += 32) {
                for (let by = this.y; by < this.y + this.height; by += 32) {
                    const bw = Math.min(32, this.x + this.width - bx);
                    const bh = Math.min(32, this.y + this.height - by);
                    ctx.drawImage(img, 0, 0, bw, bh, bx, by, bw, bh);
                }
            }
        } else {
            // Fallback while loading
            ctx.fillStyle = solidNow ? '#7030a0' : 'rgba(112, 48, 160, 0.3)';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }

        if (game && game.isEditorMode) {
            ctx.globalAlpha = 1.0;
            ctx.strokeStyle = (this.mode === 'closed') ? '#ff4444' : '#00ffff';
            ctx.lineWidth = 1;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 9px monospace';
            ctx.shadowColor = '#000000';
            ctx.shadowBlur = 3;
            const label = (this.mode === 'closed') ? 'ESC-C' : 'ESC-O';
            ctx.fillText(label, this.x + 2, this.y + 11);
        }

        ctx.restore();
    }
}

class EscapeBlockClosed extends EscapeBlockBase {
    constructor(x, y, width = 32, height = 32) {
        super(x, y, width, height, 'closed');
        this.type = 'escapeblock_closed';
    }
}

class EscapeBlockOpen extends EscapeBlockBase {
    constructor(x, y, width = 32, height = 32) {
        super(x, y, width, height, 'open');
        this.type = 'escapeblock_open';
    }
}

EscapeBlockBase.initImages();

if (typeof window !== 'undefined') {
    window.EscapeBlockBase = EscapeBlockBase;
    window.EscapeBlockClosed = EscapeBlockClosed;
    window.EscapeBlockOpen = EscapeBlockOpen;
    window.escapeblock_closed = EscapeBlockClosed;
    window.escapeblock_open = EscapeBlockOpen;
}


class Tile extends Platform {
    constructor(x, y, width, height, tx = 0, ty = 0, tileImageName = 'tile_tutorial.png', sw = 32, sh = 32, flipX = false, flipY = false, layer = 1) {
        super(x, y, width, height, 'transparent');
        this.type = 'tile';
        this.layer = layer || 1;
        this.tx = tx;
        this.ty = ty;
        this.sw = sw;
        this.sh = sh;
        this.tileImageName = tileImageName;
        this.flipX = !!flipX;
        this.flipY = !!flipY;
        
        if (!Tile.images) Tile.images = {};
        if (!Tile.images[tileImageName]) {
            Tile.images[tileImageName] = new Image();
            Tile.images[tileImageName].src = `Tileset/${tileImageName}`;
        }
    }

    render(ctx) {
        const img = Tile.images[this.tileImageName];
        if (img && img.complete && img.naturalWidth > 0) {
            for(let dx = 0; dx < this.width; dx += this.sw) {
                for(let dy = 0; dy < this.height; dy += this.sh) {
                    let drawW = Math.min(this.sw, this.width - dx);
                    let drawH = Math.min(this.sh, this.height - dy);
                    if (this.flipX || this.flipY) {
                        ctx.save();
                        ctx.translate(this.x + dx + (this.flipX ? drawW : 0), this.y + dy + (this.flipY ? drawH : 0));
                        ctx.scale(this.flipX ? -1 : 1, this.flipY ? -1 : 1);
                        ctx.drawImage(img, this.tx, this.ty, drawW, drawH, 0, 0, drawW, drawH);
                        ctx.restore();
                    } else {
                        ctx.drawImage(img, this.tx, this.ty, drawW, drawH, this.x + dx, this.y + dy, drawW, drawH);
                    }
                }
            }
        } else {
            const fallbackColor = this.layer === 2 ? '#2e7d32' : (this.layer === 3 ? '#455a64' : '#8B4513');
            ctx.fillStyle = fallbackColor;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.strokeStyle = '#222222';
            ctx.lineWidth = 1;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }
    }
}

class Tile2 extends Tile {
    constructor(x, y, width, height, tx = 0, ty = 0, tileImageName = 'tile_tutorial.png', sw = 32, sh = 32, flipX = false, flipY = false) {
        super(x, y, width, height, tx, ty, tileImageName, sw, sh, flipX, flipY, 2);
    }
}

class Tile3 extends Tile {
    constructor(x, y, width, height, tx = 0, ty = 0, tileImageName = 'tile_tutorial.png', sw = 32, sh = 32, flipX = false, flipY = false) {
        super(x, y, width, height, tx, ty, tileImageName, sw, sh, flipX, flipY, 3);
    }
}

class Hallway extends Entity {
    constructor(x, y, width, height, targetRoom = null, targetDoor = null) {
        super(x, y, width, height, 'transparent');
        this.type = 'hallway';
        this.targetRoom = targetRoom;
        this.targetDoor = targetDoor;
        this.doorId = targetDoor;
        
        this.image = new Image();
        this.image.src = '이미지/spr_hallway.png';
        this.imageLoaded = false;
        
        this.image.onload = () => {
            this.imageLoaded = true;
        };
    }

    render(ctx) {
        if (this.imageLoaded) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        } else {
            // Fallback while loading
            ctx.fillStyle = 'rgba(20, 25, 40, 0.8)';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}

if (typeof window !== 'undefined') {
    window.Hallway = Hallway;
}

class HallwayVertical extends Entity {
    constructor(x, y, width = 64, height = 32, targetRoom = null, targetDoor = null, verticalDir = 'up') {
        super(x, y, width, height, 'transparent');
        this.type = 'hallwayvertical';
        this.targetRoom = targetRoom;
        this.targetDoor = targetDoor;
        this.doorId = targetDoor;
        this.verticalDir = verticalDir || 'up'; // 'up' or 'down'

        this.image = new Image();
        this.image.src = '이미지/spr_hallwayvertical.png';
        this.imageLoaded = false;

        this.image.onload = () => {
            this.imageLoaded = true;
        };
    }

    render(ctx) {
        if (this.imageLoaded) {
            if (this.verticalDir === 'down') {
                ctx.save();
                ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
                ctx.scale(1, -1);
                ctx.drawImage(this.image, -this.width / 2, -this.height / 2, this.width, this.height);
                ctx.restore();
            } else {
                ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
            }
        } else {
            // Fallback while loading
            ctx.fillStyle = 'rgba(20, 25, 40, 0.8)';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}
if (typeof window !== 'undefined') {
    window.HallwayVertical = HallwayVertical;
}
class Door extends Entity {
    static image = null;
    static imageLoaded = false;

    static initImage() {
        if (!Door.image) {
            Door.image = new Image();
            Door.image.src = '이미지/spr_door.png';
            Door.image.onload = () => {
                Door.imageLoaded = true;
            };
        }
    }

    constructor(x, y, width, height, label, targetRoom, color = 'rgba(191, 0, 255, 0.6)', flipX = false, flipY = false) {
        super(x, y, width, height, color, flipX, flipY);
        this.label = label;
        this.targetRoom = targetRoom;
        this.type = 'door';
        this.isSolid = false;
        Door.initImage();
    }

    render(ctx) {
        if (this.isDestroyed) return;
        
        Door.initImage();

        ctx.save();
        if (this.flipX || this.flipY) {
            const cx = this.x + this.width / 2;
            const cy = this.y + this.height / 2;
            ctx.translate(cx, cy);
            ctx.scale(this.flipX ? -1 : 1, this.flipY ? -1 : 1);
            ctx.translate(-cx, -cy);
        }

        const img = Door.image;
        if (img && img.complete && img.naturalWidth > 0) {
            const drawW = (this.width >= 100) ? this.width : 100;
            const drawH = (this.height >= 100) ? this.height : 100;
            const drawX = Math.round(this.x + this.width / 2 - drawW / 2);
            const drawY = Math.round(this.y + this.height - drawH);
            ctx.drawImage(img, drawX, drawY, drawW, drawH);
        } else {
            // Door body fallback
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            
            // Door frame fallback
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }

        const showDebug = (window.gameInstance && (window.gameInstance.showCollisions || window.gameInstance.isEditorMode));
        if (showDebug) {
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.strokeRect(this.x, this.y, this.width, this.height);
            ctx.setLineDash([]);

            // Label text
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.shadowColor = 'black';
            ctx.shadowBlur = 4;
            ctx.fillText(`DOOR ${this.label}`, this.x + this.width / 2, this.y - 8);
            ctx.restore();
        }
        ctx.restore();
    }
}
Door.initImage();

class ExitGate extends Entity {
    static imageClosed = null;
    static imageOpen = null;
    static imagesLoaded = false;

    static initImages() {
        if (ExitGate.imagesLoaded) return;
        ExitGate.imagesLoaded = true;
        ExitGate.imageClosed = new Image();
        ExitGate.imageClosed.src = '이미지/spr_exitgate/spr_exitgate_0.png';
        ExitGate.imageOpen = new Image();
        ExitGate.imageOpen.src = '이미지/spr_exitgate/spr_exitgate_1.png';
    }

    constructor(x, y, width = 160, height = 256, color = 'rgba(46, 204, 113, 0.7)', flipX = false, flipY = false) {
        super(x, y, width, height, color, flipX, flipY);
        this.type = 'exitgate';
        this.isSolid = false;
        ExitGate.initImages();
    }

    render(ctx) {
        if (this.isDestroyed) return;
        ExitGate.initImages();

        ctx.save();
        if (this.flipX || this.flipY) {
            const cx = this.x + this.width / 2;
            const cy = this.y + this.height / 2;
            ctx.translate(cx, cy);
            ctx.scale(this.flipX ? -1 : 1, this.flipY ? -1 : 1);
            ctx.translate(-cx, -cy);
        }

        const game = window.gameInstance;
        // 탈출 중일 때 문 열림(spr_exitgate_1), 평소에는 문 닫힘(spr_exitgate_0)
        const isOpen = !!(game && game.escape);
        const img = isOpen ? ExitGate.imageOpen : ExitGate.imageClosed;

        if (img && img.complete && img.naturalWidth > 0) {
            ctx.imageSmoothingEnabled = false;
            const drawW = img.naturalWidth;
            const drawH = img.naturalHeight;
            const drawX = Math.round(this.x + this.width / 2 - drawW / 2);
            const drawY = Math.round(this.y + this.height - drawH);
            ctx.drawImage(img, drawX, drawY, drawW, drawH);
        } else {
            // Fallback rendering
            ctx.fillStyle = isOpen ? '#2ecc71' : '#e74c3c';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }

        const showDebug = (game && (game.showCollisions || game.isEditorMode));
        if (showDebug) {
            ctx.save();
            ctx.strokeStyle = isOpen ? 'rgba(46, 204, 113, 0.9)' : 'rgba(231, 76, 60, 0.9)';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.strokeRect(this.x, this.y, this.width, this.height);
            ctx.setLineDash([]);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.shadowColor = 'black';
            ctx.shadowBlur = 4;
            ctx.fillText(isOpen ? 'EXIT GATE (OPEN)' : 'EXIT GATE (CLOSED)', this.x + this.width / 2, this.y - 8);
            ctx.restore();
        }
        ctx.restore();
    }
}
ExitGate.initImages();



class LevelGate extends Entity {
    static gateImages = [];
    static gateBGImages = [];
    static gateMaskImages = [];
    static titleCardImages = {};
    static titleCardTitleImages = {};
    static rankBubbleImages = [];
    static rankFImage = null;
    static imagesLoaded = false;
    static bufferCanvas = null;
    static bufferCtx = null;

    static initGateImages() {
        if (LevelGate.imagesLoaded) return;
        LevelGate.imagesLoaded = true;

        for (let i = 0; i < 3; i++) {
            const gImg = new Image();
            gImg.src = `이미지/spr_gate/spr_gate_${i}.png`;
            LevelGate.gateImages.push(gImg);

            const bgImg = new Image();
            bgImg.src = `이미지/spr_gate_BG/spr_gate_entranceBG/spr_gate_BG_${i}.png`;
            LevelGate.gateBGImages.push(bgImg);

            const mImg = new Image();
            mImg.src = `이미지/spr_gate/spr_gate_mask_${i}.png`;
            LevelGate.gateMaskImages.push(mImg);
        }

        LevelGate.rankBubbleImages = [];
        for (let i = 0; i < 6; i++) {
            const bImg = new Image();
            bImg.src = `이미지/spr_rankbubble/spr_rankbubble_${i}.png`;
            LevelGate.rankBubbleImages.push(bImg);
        }

        LevelGate.rankFImage = new Image();
        LevelGate.rankFImage.src = `이미지/spr_rankbadge/rank_F.png`;

        if (!LevelGate.rankBadgeImages) {
            LevelGate.rankBadgeImages = {};
            ['F', 'D', 'C', 'B', 'A', 'S', 'P'].forEach(r => {
                const img = new Image();
                img.src = `이미지/spr_rankbadge/rank_${r}.png`;
                LevelGate.rankBadgeImages[r] = img;
            });
        }
    }

    static getTitleCardImage(numOrPath) {
        if (!numOrPath && numOrPath !== 0) return null;
        let src = String(numOrPath).trim();
        if (/^\d+$/.test(src)) {
            src = `이미지/spr_titlecards/spr_titlecards_${src}.png`;
        }
        if (!LevelGate.titleCardImages[src]) {
            const img = new Image();
            img.src = src;
            LevelGate.titleCardImages[src] = img;
        }
        return LevelGate.titleCardImages[src];
    }

    static getTitleCardTitleImage(numOrPath) {
        if (!numOrPath && numOrPath !== 0) return null;
        const num = String(numOrPath).trim();
        if (!/^\d+$/.test(num)) return null;
        const src = `이미지/spr_titlecards_title/spr_titlecards_title_${num}.png`;
        if (!LevelGate.titleCardTitleImages[src]) {
            const img = new Image();
            img.src = src;
            LevelGate.titleCardTitleImages[src] = img;
        }
        return LevelGate.titleCardTitleImages[src];
    }

    constructor(x, y, width = 192, height = 288, targetRoom = 'tutorial_1', targetDoor = 'A', titleCardImage = '0', titleCardText = '', gateIndex = 0, color = 'rgba(192, 57, 43, 0.8)', flipX = false, flipY = false, sRankScore = 10000) {
        let gIdx = parseInt(gateIndex, 10);
        if (isNaN(gIdx) || gIdx < 0 || gIdx > 2) {
            const num = parseInt(titleCardImage, 10);
            gIdx = (!isNaN(num) && num >= 0 && num <= 2) ? num : 0;
        }
        const natSizes = [
            { w: 192, h: 288 },
            { w: 161, h: 267 },
            { w: 165, h: 254 }
        ];
        const nat = natSizes[gIdx] || natSizes[0];
        const actualW = width || nat.w;
        const actualH = height || nat.h;
        let finalColor = color;
        let finalSRank = 10000;
        if (typeof color === 'number') {
            finalSRank = color;
            finalColor = 'rgba(192, 57, 43, 0.8)';
        } else if (sRankScore !== undefined && sRankScore !== null) {
            const parsed = parseInt(sRankScore, 10);
            if (!isNaN(parsed) && parsed > 0) finalSRank = parsed;
        }
        super(x, y, actualW, actualH, finalColor, flipX, flipY);
        this.targetRoom = targetRoom || 'tutorial_1';
        this.targetDoor = targetDoor || 'A';
        this.titleCardImage = (titleCardImage !== undefined && titleCardImage !== null) ? String(titleCardImage).trim() : '0';
        this.titleCardText = titleCardText || '';
        this.gateIndex = gIdx;
        this.sRankScore = finalSRank;

        this.type = 'levelgate';
        this.isSolid = false;
        this.bgScrollX = 0;
        this.bgScrollSpeed = 0.35; // Gentle, smooth rightward drift
        this.waveTimer = Math.random() * 10;
        this.waveSpeed = 0.035;    // Smooth gentle portal wave
        this.waveAmp = 3.5;
        this.waveFreq = 0.045;

        this.gateAnimTimer = 0.0;
        this.isPlayerNear = false;
        this.hasBoardDropped = false;

        LevelGate.initGateImages();

        if (this.titleCardImage) {
            LevelGate.getTitleCardImage(this.titleCardImage);
        }
    }

    render(ctx) {
        if (this.isDestroyed) return;
        LevelGate.initGateImages();

        // Advance animation
        this.bgScrollX += this.bgScrollSpeed;
        this.waveTimer += this.waveSpeed;

        ctx.save();
        if (this.flipX || this.flipY) {
            const cx = this.x + this.width / 2;
            const cy = this.y + this.height / 2;
            ctx.translate(cx, cy);
            ctx.scale(this.flipX ? -1 : 1, this.flipY ? -1 : 1);
            ctx.translate(-cx, -cy);
        }

        const x = Math.round(this.x);
        const y = Math.round(this.y);
        const w = this.width;
        const h = this.height;

        // Calculate player distance for distance-based white fade
        let whiteAlpha = 0;
        const game = window.gameInstance;
        if (game && game.player && !game.isEditorMode) {
            const px = game.player.x + game.player.width / 2;
            const py = game.player.y + game.player.height / 2;
            const gx = this.x + this.width / 2;
            const gy = this.y + this.height / 2;
            const dist = Math.hypot(px - gx, py - gy);

            const minDist = 100; // Close to gate: 0% white (full vibrant background)
            const maxDist = 420; // Far away: 100% white silhouette portal

            if (dist <= minDist) {
                whiteAlpha = 0;
            } else if (dist >= maxDist) {
                whiteAlpha = 1.0;
            } else {
                whiteAlpha = (dist - minDist) / (maxDist - minDist);
            }
        }

        const gateIdx = (this.gateIndex >= 0 && this.gateIndex < 3) ? parseInt(this.gateIndex, 10) : 0;
        const levelTitle = (this.titleCardText || `GATE ${gateIdx + 1}`).toUpperCase();
        const gateImg = LevelGate.gateImages[gateIdx];
        const bgImg = LevelGate.gateBGImages[gateIdx];
        const maskImg = LevelGate.gateMaskImages[gateIdx];

        if (gateImg && gateImg.complete && gateImg.naturalWidth > 0 && 
            bgImg && bgImg.complete && bgImg.naturalWidth > 0 && 
            maskImg && maskImg.complete && maskImg.naturalWidth > 0) {
            
            const gw = gateImg.naturalWidth;
            const gh = gateImg.naturalHeight;

            // Prepare buffer canvas
            if (!LevelGate.bufferCanvas) {
                LevelGate.bufferCanvas = document.createElement('canvas');
                LevelGate.bufferCtx = LevelGate.bufferCanvas.getContext('2d');
            }
            const bCanvas = LevelGate.bufferCanvas;
            const bCtx = LevelGate.bufferCtx;

            if (bCanvas.width !== gw || bCanvas.height !== gh) {
                bCanvas.width = gw;
                bCanvas.height = gh;
                bCtx.imageSmoothingEnabled = false;
            } else {
                bCtx.clearRect(0, 0, gw, gh);
            }

            // 1. Draw waving, gently right-scrolling background
            const bgW = bgImg.naturalWidth;
            const bgH = bgImg.naturalHeight;
            const bgStartY = gh - bgH;
            const scrollOffset = (this.bgScrollX) % bgW;
            const sliceH = 2;

            if (bgW > 0 && bgH > 0 && gw > 0 && gh > 0) {
                for (let sy = 0; sy < gh; sy += sliceH) {
                    if (sy < bgStartY) continue;
                    const srcY = sy - bgStartY;
                    if (srcY >= bgH) break;

                    const curH = Math.min(sliceH, gh - sy, bgH - srcY);
                    if (curH <= 0) continue;
                    const waveX = Math.sin((sy * this.waveFreq) + this.waveTimer) * this.waveAmp;

                    for (let tx = -bgW; tx < gw + bgW; tx += bgW) {
                        const drawSliceX = Math.round(tx + scrollOffset + waveX);
                        if (drawSliceX + bgW > 0 && drawSliceX < gw) {
                            bCtx.drawImage(bgImg, 0, srcY, bgW, curH, drawSliceX, sy, bgW, curH);
                        }
                    }
                }
            }

            // 1.5. Distance-based White Fade Overlay (fades to white in proportion to player distance)
            if (whiteAlpha > 0) {
                bCtx.fillStyle = `rgba(255, 255, 255, ${Math.min(1.0, whiteAlpha).toFixed(3)})`;
                bCtx.fillRect(0, Math.max(0, bgStartY), gw, bgH);
            }

            // 2. Clip strictly to doorway using pre-generated mask image (zero leaks outside!)
            bCtx.globalCompositeOperation = 'destination-in';
            bCtx.drawImage(maskImg, 0, 0, gw, gh);
            bCtx.globalCompositeOperation = 'source-over';

            // 3. Draw Gate Foreground Archway
            bCtx.drawImage(gateImg, 0, 0, gw, gh);

            // 4. Draw Composited Gate onto main canvas (never stretched, 1:1 pixel size, bottom-aligned)
            const drawW = gw;
            const drawH = gh;
            const drawX = Math.round(x + (w - drawW) / 2);
            const drawY = Math.round(y + (h - drawH));

            ctx.drawImage(bCanvas, drawX, drawY, drawW, drawH);

            // 5. Authentic Pizza Tower Level Gate Sequence:
            // 1) Score Plate Drops down first & lands with bounce
            // 2) Score Digits Drop down one-by-one onto the plate
            // 3) Rank bubble (spr_rankbubble) pops in last with elastic bounce
            const game = window.gameInstance;

            // Proximity check: Is player close to the gate?
            let isNear = false;
            if (game && game.player) {
                if (game.isEditorMode) {
                    isNear = true;
                } else {
                    const px = game.player.x + game.player.width / 2;
                    const py = game.player.y + game.player.height / 2;
                    const gx = this.x + this.width / 2;
                    const gy = this.y + this.height / 2;
                    isNear = (Math.abs(px - gx) < 160 && Math.abs(py - gy) < 180);
                }
            }
            this.isPlayerNear = isNear;

            // Check stage clear status
            let isCleared = false;
            let score = 0;
            let rank = 'D';

            let stageInfo = null;
            let saveData = null;
            if (game && game.currentSaveSlot && game.getSaveSlotData) {
                saveData = game.getSaveSlotData(game.currentSaveSlot);
                stageInfo = saveData?.stages?.[this.targetRoom];
                if (stageInfo) {
                    if (stageInfo.gateDropped) {
                        delete stageInfo.gateDropped;
                        if (game.saveSlotData) game.saveSlotData(game.currentSaveSlot, saveData);
                    }
                    if (stageInfo.cleared) {
                        isCleared = true;
                        if (typeof stageInfo.score === 'number') {
                            score = stageInfo.score;
                        }
                        if (stageInfo.rank) {
                            rank = stageInfo.rank.toUpperCase();
                        }
                    }
                }
            }

            // Only show score board and rank badge if the stage has been cleared (or in editor mode)
            const showScoreBoard = isCleared || !!(game && game.isEditorMode);

            // Step timeline management:
            // Once dropped in the current room, it stays down as long as the player is in this room (never retracts back up).
            // When moving to another room, room gate instances reset so it drops again upon revisit.
            if (game && game.isEditorMode) {
                this.hasBoardDropped = true;
                this.gateAnimTimer = 120; // Always fully shown in editor mode
            } else if (!showScoreBoard) {
                this.hasBoardDropped = false;
                this.gateAnimTimer = 0;
            } else {
                if (isNear) {
                    this.hasBoardDropped = true;
                }

                if (this.hasBoardDropped) {
                    // Only advances forward until fully seated (120), never rewinds backwards when player moves away
                    this.gateAnimTimer = Math.min(120, this.gateAnimTimer + 1);
                }
            }

            if (this.gateAnimTimer > 0 && showScoreBoard) {
                const scoreStr = String(score);

                // --- 1. Score Plate Gravity Fall (Landing first with heavy physical bounce) ---
                const plateDuration = 16;
                const plateP = Math.min(1.0, this.gateAnimTimer / plateDuration);
                const dropDist = 260; // Falls from high ceiling with real gravity acceleration

                let plateFallOffset = -dropDist;
                if (plateP > 0) {
                    const landTime = 0.72;
                    if (plateP < landTime) {
                        // Free fall under gravity (u^2 curve: starts slow, accelerates heavily downward!)
                        const u = plateP / landTime;
                        plateFallOffset = -dropDist * (1.0 - u * u);
                    } else {
                        // Elastic rebound bounce upon landing
                        const u = (plateP - landTime) / (1.0 - landTime);
                        plateFallOffset = -Math.sin(u * Math.PI) * 14 * Math.exp(-u * 2);
                    }
                }

                // Precision arch top alignment for all 3 gate variations
                const plateOffset = (gateIdx === 0 ? 4 : (gateIdx === 1 ? -18 : -22));
                const targetPlateY = drawY + plateOffset;
                const currentPlateY = Math.round(targetPlateY + plateFallOffset);
                const scoreCenterX = Math.round(drawX + drawW / 2);

                const pizzaImg = game.pizzaScoreImg;
                if (pizzaImg && pizzaImg.complete && pizzaImg.naturalWidth > 0) {
                    // 1:1 Pixel Perfect rendering: zero distortion, razor sharp Pizza Tower art!
                    const pw = pizzaImg.naturalWidth;
                    const ph = pizzaImg.naturalHeight;
                    ctx.save();
                    ctx.imageSmoothingEnabled = false;
                    ctx.globalAlpha = Math.min(1.0, plateP * 2);
                    // Pizza center origin is (135, 79)
                    ctx.drawImage(pizzaImg, Math.round(scoreCenterX - 135), Math.round(currentPlateY - 79), pw, ph);
                    ctx.restore();
                }

                // --- 2. Score Digits Gravity Fall ONE BY ONE onto the pizza plate (Heavy physics) ---
                const charAdvance = 36;
                const totalWidth = (scoreStr.length - 1) * charAdvance + 47;
                let cursorX = Math.round(scoreCenterX - totalWidth / 2);
                // Cheese floor level sits at currentPlateY - 1
                const cheeseFloorY = Math.round(currentPlateY - 1);

                for (let i = 0; i < scoreStr.length; i++) {
                    const digit = parseInt(scoreStr[i], 10);
                    const digitStart = 14 + i * 6; // 6 frames gap: distinct staggered drop
                    const digitDuration = 14;
                    const dp = Math.min(1.0, Math.max(0.0, (this.gateAnimTimer - digitStart) / digitDuration));

                    if (dp > 0) {
                        // Real gravity drop physics for each individual digit
                        const digitDropH = 180;
                        let digitFallOffset = -digitDropH;
                        const landTime = 0.72;
                        if (dp < landTime) {
                            // Accelerates downward under gravity
                            const u = dp / landTime;
                            digitFallOffset = -digitDropH * (1.0 - u * u);
                        } else {
                            // Elastic bounce upon impact onto the cheese
                            const u = (dp - landTime) / (1.0 - landTime);
                            digitFallOffset = -Math.sin(u * Math.PI) * 10 * Math.exp(-u * 2);
                        }
                        const curDigitFloor = Math.round(cheeseFloorY + digitFallOffset);

                        if (!isNaN(digit) && game.fontCollectImages && game.fontCollectImages[digit]) {
                            const img = game.fontCollectImages[digit];
                            if (img.complete && img.naturalWidth > 0) {
                                // 1:1 Pixel Perfect: exactly 47x54 without any sub-pixel distortion or bottom line artifacts!
                                const srcH = Math.min(54, img.naturalHeight);
                                const drawX = Math.round(cursorX);
                                const drawY = Math.round(curDigitFloor - 53);

                                ctx.save();
                                ctx.imageSmoothingEnabled = false;
                                ctx.globalAlpha = Math.min(1.0, dp * 2);
                                ctx.drawImage(img, 0, 0, img.naturalWidth, srcH, drawX, drawY, img.naturalWidth, srcH);
                                ctx.restore();
                            }
                        } else {
                            // Text fallback
                            ctx.save();
                            ctx.globalAlpha = Math.min(1.0, dp * 2);
                            ctx.font = '900 32px "Outfit", "Comic Sans MS", "Arial Black", sans-serif';
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'bottom';
                            ctx.lineWidth = 6;
                            ctx.strokeStyle = '#000000';
                            ctx.strokeText(scoreStr[i], cursorX + charAdvance / 2, curDigitFloor);
                            ctx.fillStyle = '#ffffff';
                            ctx.fillText(scoreStr[i], cursorX + charAdvance / 2, curDigitFloor);
                            ctx.restore();
                        }
                    }
                    cursorX += charAdvance;
                }

                // --- 3. Rank Bubble Pop-in (Appears LAST, smooth leisurely cartoon bounce) ---
                const rankStart = 14 + scoreStr.length * 6 + 8;
                const rankDuration = 26; // Slower, rich elastic cartoon pop-in!
                const rankP = Math.min(1.0, Math.max(0.0, (this.gateAnimTimer - rankStart) / rankDuration));

                if (rankP > 0) {
                    let rankScale = 0;
                    if (rankP < 0.45) {
                        // Leisurely outward swell: 0 -> 1.38
                        const u = rankP / 0.45;
                        rankScale = (1 - (1 - u) * (1 - u)) * 1.38;
                    } else if (rankP < 0.78) {
                        // Elastic return bounce: 1.38 -> 0.94
                        const u = (rankP - 0.45) / 0.33;
                        rankScale = 1.38 - u * 0.44;
                    } else {
                        // Smooth settle: 0.94 -> 1.00
                        const u = (rankP - 0.78) / 0.22;
                        rankScale = 0.94 + u * 0.06;
                    }

                    if (rankScale > 0.01) {
                        const badgeX = drawX + drawW / 2;
                        const badgeY = drawY + (gateIdx === 0 ? 116 : (gateIdx === 1 ? 108 : 104));

                        ctx.save();
                        ctx.translate(badgeX, badgeY);
                        ctx.scale(rankScale, rankScale);

                        // Authentic Pizza Tower Rank Sprites:
                        // D, C, B, A, S, P -> LevelGate.rankBubbleImages (spr_rankbubble_0 ~ 5)
                        const rankOrder = { 'D': 0, 'C': 1, 'B': 2, 'A': 3, 'S': 4, 'P': 5 };
                        const rankIdx = rankOrder[rank];
                        if (rankIdx !== undefined && LevelGate.rankBubbleImages && LevelGate.rankBubbleImages[rankIdx]) {
                            const bImg = LevelGate.rankBubbleImages[rankIdx];
                            if (bImg.complete && bImg.naturalWidth > 0) {
                                // spr_rankbubble is 76x92 with content centered at (38, 46)
                                ctx.drawImage(bImg, -38, -46, 76, 92);
                            }
                        } else {
                            // Rank 'F' or unplayed stage: circular F rank badge
                            const fImg = LevelGate.rankFImage;
                            if (fImg && fImg.complete && fImg.naturalWidth > 0) {
                                const badgeSize = 58;
                                ctx.drawImage(fImg, Math.round(-badgeSize / 2), Math.round(-badgeSize / 2), badgeSize, badgeSize);
                            }
                        }
                        ctx.restore();
                    }
                }
            }

            // 5c. Level Name & S-Rank Target (Editor Mode Only)
            if (game && game.isEditorMode) {
                ctx.save();
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.font = 'bold 12px Arial';
                const nameY = drawY - 26;
                const sVal = this.sRankScore || 10000;
                const gateLabel = `${levelTitle} [S: ${sVal.toLocaleString()}]`;
                const tw = ctx.measureText(gateLabel).width;
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(drawX + drawW / 2 - tw / 2 - 4, nameY - 8, tw + 8, 16);
                ctx.fillStyle = '#ffcc00';
                ctx.fillText(gateLabel, drawX + drawW / 2, nameY);
                ctx.restore();
            }

        } else {
            // Clean fallback while images load: draw gate foreground directly (1:1 pixel size)
            if (gateImg && gateImg.complete && gateImg.naturalWidth > 0) {
                const gw = gateImg.naturalWidth;
                const gh = gateImg.naturalHeight;
                const drawW = gw;
                const drawH = gh;
                const drawX = Math.round(x + (w - drawW) / 2);
                const drawY = Math.round(y + (h - drawH));
                ctx.drawImage(gateImg, drawX, drawY, drawW, drawH);
            } else {
                ctx.fillStyle = '#4a444d';
                ctx.fillRect(x, y, w, h);
            }
        }

        // 7. Editor Debug Outline & Label
        const showDebug = (window.gameInstance && (window.gameInstance.showCollisions || window.gameInstance.isEditorMode));
        if (showDebug) {
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 60, 60, 0.9)';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.strokeRect(this.x, this.y, this.width, this.height);
            ctx.setLineDash([]);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 11px Arial';
            ctx.textAlign = 'center';
            ctx.shadowColor = 'black';
            ctx.shadowBlur = 4;
            ctx.fillText(`${levelTitle} -> ${this.targetRoom || 'none'} [${this.targetDoor || 'none'}]`, this.x + this.width / 2, this.y - 16);
            ctx.restore();
        }

        ctx.restore();
    }
}
LevelGate.initGateImages();
if (typeof window !== 'undefined') {
    window.LevelGate = LevelGate;
}

class TargetDoorBase extends Entity {
    constructor(x, y, width, height, doorId, flipX = false, flipY = false) {
        super(x, y, width, height, 'transparent', flipX, flipY);
        this.doorId = doorId;
        this.type = `targetDoor_${doorId}`;
        this.image = new Image();
        this.image.src = `이미지/spr_targetDoor_${doorId}.png`;
        this.imageLoaded = false;
        
        this.image.onload = () => {
            this.imageLoaded = true;
        };
        this.image.onerror = () => {
            // If specific door image fails to load, fallback to spr_targetDoor_A.png
            this.image.src = `이미지/spr_targetDoor_A.png`;
        };
    }

    render(ctx) {
        if (this.isDestroyed) return;
        
        ctx.save();
        if (this.flipX || this.flipY) {
            const cx = this.x + this.width / 2;
            const cy = this.y + this.height / 2;
            ctx.translate(cx, cy);
            ctx.scale(this.flipX ? -1 : 1, this.flipY ? -1 : 1);
            ctx.translate(-cx, -cy);
        }

        if (this.imageLoaded) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = 'rgba(255, 0, 255, 0.3)';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.strokeStyle = 'white';
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Target ${this.doorId}`, this.x + this.width / 2, this.y - 10);
        ctx.restore();
    }
}

class TargetDoor_A extends TargetDoorBase { constructor(x, y, w, h) { super(x, y, w, h, 'A'); } }
class TargetDoor_B extends TargetDoorBase { constructor(x, y, w, h) { super(x, y, w, h, 'B'); } }
class TargetDoor_C extends TargetDoorBase { constructor(x, y, w, h) { super(x, y, w, h, 'C'); } }
class TargetDoor_D extends TargetDoorBase { constructor(x, y, w, h) { super(x, y, w, h, 'D'); } }
class TargetDoor_E extends TargetDoorBase { constructor(x, y, w, h) { super(x, y, w, h, 'E'); } }

class TutorialBook extends Entity {
    constructor(x, y, width, height, text = "Tutorial Message", flipX = false, flipY = false) {
        super(x, y, width, height, '#00f2ff', flipX, flipY);
        this.type = 'tutorialbook';
        this.text = text;
    }

    getText() {
        if (typeof this.text === 'string') {
            const raw = this.text.trim();
            const match = raw.match(/^lang_get_value\(\s*["']?([^"'\s\)]+)["']?\s*\)$/i);
            if (match && typeof window.lang_get_value === 'function') {
                return window.lang_get_value(match[1]);
            }
            if (typeof window.lang_get_value === 'function') {
                const cleanKey = raw.replace(/^["']|["']$/g, '');
                const val = window.lang_get_value(cleanKey);
                if (val && val !== cleanKey) {
                    return val;
                }
            }
        }
        return this.text;
    }

    render(ctx) {
        if (this.isDestroyed) return;
        
        ctx.save();
        if (this.flipX || this.flipY) {
            const cx = this.x + this.width / 2;
            const cy = this.y + this.height / 2;
            ctx.translate(cx, cy);
            ctx.scale(this.flipX ? -1 : 1, this.flipY ? -1 : 1);
            ctx.translate(-cx, -cy);
        }
        // Glow effect
        ctx.shadowColor = '#00f2ff';
        ctx.shadowBlur = 10;
        
        // Draw Book icon
        ctx.strokeStyle = '#00f2ff';
        ctx.lineWidth = 3;
        ctx.fillStyle = 'rgba(0, 242, 255, 0.2)';
        
        // Draw open book pages
        ctx.beginPath();
        // Left page
        ctx.moveTo(this.x + 5, this.y + 10);
        ctx.bezierCurveTo(this.x + 15, this.y + 5, this.x + 18, this.y + 12, this.x + 20, this.y + 10);
        // Right page
        ctx.bezierCurveTo(this.x + 22, this.y + 12, this.x + 25, this.y + 5, this.x + 35, this.y + 10);
        // Right side down
        ctx.lineTo(this.x + 35, this.y + 30);
        // Bottom pages
        ctx.bezierCurveTo(this.x + 25, this.y + 25, this.x + 22, this.y + 32, this.x + 20, this.y + 30);
        ctx.bezierCurveTo(this.x + 18, this.y + 32, this.x + 15, this.y + 25, this.x + 5, this.y + 30);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Middle spine of the book
        ctx.beginPath();
        ctx.moveTo(this.x + 20, this.y + 10);
        ctx.lineTo(this.x + 20, this.y + 30);
        ctx.stroke();
        
        // Draw a small "?" mark on top of the book
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('?', this.x + 20, this.y + 23);
        
        ctx.restore();
    }
}


class Collect extends Entity {
    static sprites = {};
    static imagesLoaded = false;

    static initImages() {
        if (Collect.imagesLoaded) return;
        Collect.sprites = { 1: [], 2: [], 3: [], 4: [], 5: [] };

        // 과일 수집품(Collect) 프레임 수: 1(사과)=8, 2(오렌지)=13, 3(포도)=16, 4(수박)=4, 5(파인애플)=5
        const KNOWN_COUNTS = { 1: 8, 2: 13, 3: 16, 4: 4, 5: 5 };

        for (let c = 1; c <= 5; c++) {
            Collect.sprites[c] = [];
            const count = KNOWN_COUNTS[c] || 0;
            if (count > 0) {
                for (let i = 0; i < count; i++) {
                    const img = new Image();
                    img.src = `이미지/spr_collect${c}/spr_collect${c}_${i}.png`;
                    Collect.sprites[c].push(img);
                }
            } else {
                // For types 3, 4, 5: probe spr_collect${c}_0.png
                // Once the user adds the folder, it will automatically load all frames!
                const firstImg = new Image();
                firstImg.onload = () => {
                    Collect.sprites[c] = [firstImg];
                    const loadNext = (idx) => {
                        if (idx >= 32) return;
                        const nextImg = new Image();
                        nextImg.onload = () => {
                            Collect.sprites[c].push(nextImg);
                            loadNext(idx + 1);
                        };
                        nextImg.src = `이미지/spr_collect${c}/spr_collect${c}_${idx}.png`;
                    };
                    loadNext(1);
                };
                firstImg.src = `이미지/spr_collect${c}/spr_collect${c}_0.png`;
            }
        }
        Collect.imagesLoaded = true;
    }

    constructor(x, y, w = 32, h = 32, flipX = false, flipY = false, collectType = null) {
        super(x, y, w, h, 'transparent', flipX, flipY);
        this.type = 'obj_collect';
        this.state = 'idle'; // idle, following, collected
        this.vx = 0;
        this.vy = 0;
        this.speed = 0;
        this.baseX = x;
        this.baseY = y;
        this.timer = Math.random() * 100;
        this.isSolid = false;
        this.isPlatform = false;
        this.points = 10;
        this.fontSize = 14;
        this.isCollected = false;

        // collect1~5 중 랜덤 생성 (파라미터 전달 시 해당 타입 사용)
        this.collectType = collectType || (Math.floor(Math.random() * 5) + 1);
        const frameMap = { 1: 8, 2: 13, 3: 16, 4: 4, 5: 5 };
        const maxF = frameMap[this.collectType] || 8;
        this.image_index = Math.random() * maxF;
        this.image_speed = 0.35;
        Collect.initImages();
    }

    isInsideBox(game) {
        const g = game || (typeof window !== 'undefined' ? (window.gameInstance || window.game) : null);
        if (!g || !g.entities) return false;
        const bx = (typeof this.baseX === 'number') ? this.baseX : this.x;
        const by = (typeof this.baseY === 'number') ? this.baseY : this.y;
        const cx = bx + this.width / 2;
        const cy = by + this.height / 2;

        for (let i = 0; i < g.entities.length; i++) {
            const ent = g.entities[i];
            if (!ent || ent === this || ent.isDestroyed || ent.markedForDeletion) continue;

            const isBox = (
                (typeof Destroyable !== 'undefined' && ent instanceof Destroyable) ||
                (typeof Metal !== 'undefined' && ent instanceof Metal) ||
                (typeof SecretBlock !== 'undefined' && ent instanceof SecretBlock) ||
                ent.type === 'destroyable' ||
                ent.type === 'metal' ||
                ent.type === 'obj_secretblock' ||
                ent.type === 'obj_secretbigblock' ||
                ent.type === 'obj_secretmetalblock' ||
                ent.type === 'pillar' ||
                ent.type === 'escapeblock_closed' ||
                (ent.isSolid && ent.type !== 'platform' && ent.type !== 'oneway' && ent.type !== 'ladder')
            );

            if (isBox) {
                // If fruit center is inside the box
                if (cx >= ent.x && cx <= ent.x + ent.width &&
                    cy >= ent.y && cy <= ent.y + ent.height) {
                    return true;
                }
                // Check AABB overlap with 4px margin
                if (bx + 4 < ent.x + ent.width && bx + this.width - 4 > ent.x &&
                    by + 4 < ent.y + ent.height && by + this.height - 4 > ent.y) {
                    return true;
                }
            }
        }
        return false;
    }

    update(game) {
        // In Editor (Design) Mode: restore all collected items, stay at base position!
        if (game && game.isEditorMode) {
            this.isCollected = false;
            this.markedForDeletion = false;
            this.state = 'idle';
            this.vx = 0;
            this.vy = 0;
            this.speed = 0;
            if (typeof this.baseX === 'number') this.x = this.baseX;
            if (typeof this.baseY === 'number') this.y = this.baseY;
            this.image_index = (this.image_index + this.image_speed) % 1000;
            return;
        }

        // In Play Mode: if already collected and flown to scoreboard, stay hidden and inert
        if (this.isCollected) {
            return;
        }

        this.image_index = (this.image_index + this.image_speed) % 1000;

        // If trapped inside an unbroken box or block, stay stationary and do NOT attract or collect
        if (this.isInsideBox(game)) {
            this.state = 'idle';
            this.vx = 0;
            this.vy = 0;
            this.speed = 0;
            if (typeof this.baseX === 'number') this.x = this.baseX;
            if (typeof this.baseY === 'number') this.y = this.baseY;
            return;
        }

        if (this.state === 'idle') {
            this.timer += 0.1;
            this.y = this.baseY + Math.sin(this.timer) * 5;

            const dx = (game.player.x + game.player.width / 2) - (this.x + this.width / 2);
            const dy = (game.player.y + game.player.height / 2) - (this.y + this.height / 2);
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 150) {
                this.state = 'following';
            }
        } else if (this.state === 'following') {
            const dx = (game.player.x + game.player.width / 2) - (this.x + this.width / 2);
            const dy = (game.player.y + game.player.height / 2) - (this.y + this.height / 2);
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 0) {
                this.speed += 0.5;
                this.vx = (dx / dist) * this.speed;
                this.vy = (dy / dist) * this.speed;
            }

            this.x += this.vx;
            this.y += this.vy;

            // Collision with player
            if (this.x < game.player.x + game.player.width &&
                this.x + this.width > game.player.x &&
                this.y < game.player.y + game.player.height &&
                this.y + this.height > game.player.y) {
                
                this.state = 'collected';
                if (game.audio && game.audio.play) game.audio.play('sfx_collect'); 
                
                if (game.score === undefined) game.score = 0;
                game.score += this.points;
                
                if (game.combo > 0) {
                    if (this.type === 'obj_bigcollect') {
                        game.comboTimer = 60;
                    } else {
                        game.comboTimer = Math.min(60, (game.comboTimer || 0) + 20);
                    }
                }
                
                // Spawn floating text at the touched position
                game.floatingTexts = game.floatingTexts || [];
                game.floatingTexts.push({
                    x: this.x + this.width / 2,
                    y: this.y,
                    text: this.points.toString(),
                    alpha: 1.0,
                    vy: -1
                });
            }
        } else if (this.state === 'collected') {
            // Fly to scoreboard in world space (scoreboard center is at screen 130, 70)
            const targetX = game.camera.x + 130;
            const targetY = game.camera.y + 70;

            const dx = targetX - this.x;
            const dy = targetY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 20) {
                this.isCollected = true;
                this.state = 'collected_done';
                this.markedForDeletion = false;
                this.vx = 0;
                this.vy = 0;
                this.speed = 0;
                if (typeof this.baseX === 'number') this.x = this.baseX;
                if (typeof this.baseY === 'number') this.y = this.baseY;
            } else {
                this.x += (dx / dist) * 20;
                this.y += (dy / dist) * 20;
            }
        }
    }

    render(ctx) {
        if (this.markedForDeletion) return;
        const isEditor = (window.gameInstance && window.gameInstance.isEditorMode) || (window.game && window.game.isEditorMode);
        if (this.isCollected && !isEditor) return;
        if (!isEditor && this.isInsideBox(window.game || window.gameInstance)) return;
        const typeKey = this.collectType || 1;
        let frames = (Collect.sprites && Collect.sprites[typeKey] && Collect.sprites[typeKey].length > 0)
            ? Collect.sprites[typeKey]
            : null;

        if (!frames || frames.length === 0) {
            frames = (Collect.sprites && Collect.sprites[1]);
        }

        const numFrames = (frames && frames.length > 0) ? frames.length : 8;
        const frameIdx = Math.floor(this.image_index) % numFrames;
        let img = (frames && frames[frameIdx] && frames[frameIdx].complete && frames[frameIdx].naturalWidth > 0)
            ? frames[frameIdx]
            : null;

        // Fallback to collect1 or collect2 frame if this specific frame is not ready
        if (!img && Collect.sprites) {
            const fbFrames = (Collect.sprites[1] && Collect.sprites[1].length > 0) ? Collect.sprites[1] : (Collect.sprites[2] || []);
            const fbIdx = Math.floor(this.image_index) % (fbFrames.length || 1);
            if (fbFrames[fbIdx] && fbFrames[fbIdx].complete && fbFrames[fbIdx].naturalWidth > 0) {
                img = fbFrames[fbIdx];
            }
        }

        if (img) {
            ctx.save();
            const cx = this.x + this.width / 2;
            const cy = this.y + this.height / 2;
            // spr_collect frames are 100x100 with bounding box (~32x32) centered at (50, 50)
            ctx.drawImage(img, cx - 50, cy - 50, 100, 100);
            ctx.restore();
        } else {
            // Fallback while loading
            ctx.fillStyle = '#f1c40f';
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2 - 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#f39c12';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold ' + this.fontSize + 'px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.points.toString(), this.x + this.width / 2, this.y + this.height / 2);
        }
    }
}

class BigCollect extends Collect {
    static sprites = {};
    static imagesLoaded = false;

    static initImages() {
        if (BigCollect.imagesLoaded) return;
        BigCollect.sprites = { 1: [], 2: [], 3: [] };

        // 큰 과일 수집품(BigCollect) 프레임 수: 1=8, 2=13, 3=17
        const KNOWN_COUNTS = { 1: 8, 2: 13, 3: 17 };

        for (let c = 1; c <= 3; c++) {
            BigCollect.sprites[c] = [];
            const count = KNOWN_COUNTS[c] || 0;
            if (count > 0) {
                for (let i = 0; i < count; i++) {
                    const img = new Image();
                    img.src = `이미지/spr_bigcollect${c}/spr_bigcollect${c}_${i}.png`;
                    BigCollect.sprites[c].push(img);
                }
            } else {
                // 향후 추가될 BigCollect 4, 5 동적 탐색
                const firstImg = new Image();
                firstImg.onload = () => {
                    BigCollect.sprites[c] = [firstImg];
                    const loadNext = (idx) => {
                        if (idx >= 32) return;
                        const nextImg = new Image();
                        nextImg.onload = () => {
                            BigCollect.sprites[c].push(nextImg);
                            loadNext(idx + 1);
                        };
                        nextImg.src = `이미지/spr_bigcollect${c}/spr_bigcollect${c}_${idx}.png`;
                    };
                    loadNext(1);
                };
                firstImg.src = `이미지/spr_bigcollect${c}/spr_bigcollect${c}_0.png`;
            }
        }

        BigCollect.imagesLoaded = true;
    }

    constructor(x, y, w = 64, h = 64, flipX = false, flipY = false, collectType = null) {
        // BigCollect: 1, 2, 3 중 랜덤 생성 (파라미터 전달 시 해당 타입 사용)
        const chosenType = collectType || (Math.floor(Math.random() * 3) + 1);
        super(x, y, w, h, flipX, flipY, chosenType);
        this.type = 'obj_bigcollect';
        this.points = 100;
        this.fontSize = 24;

        this.collectType = chosenType;
        const frameMap = { 1: 8, 2: 13, 3: 17 };
        const maxF = frameMap[this.collectType] || 8;
        this.image_index = Math.random() * maxF;
        this.image_speed = 0.35;
        BigCollect.initImages();

    }

    render(ctx) {
        if (this.markedForDeletion) return;
        const isEditor = (window.gameInstance && window.gameInstance.isEditorMode) || (window.game && window.game.isEditorMode);
        if (this.isCollected && !isEditor) return;
        if (!isEditor && this.isInsideBox(window.game || window.gameInstance)) return;

        const typeKey = this.collectType || 1;
        let frames = (BigCollect.sprites && BigCollect.sprites[typeKey] && BigCollect.sprites[typeKey].length > 0)
            ? BigCollect.sprites[typeKey]
            : null;

        if (!frames || frames.length === 0) {
            frames = (BigCollect.sprites && BigCollect.sprites[1]);
        }

        const numFrames = (frames && frames.length > 0) ? frames.length : 8;
        const frameIdx = Math.floor(this.image_index) % numFrames;
        let img = (frames && frames[frameIdx] && frames[frameIdx].complete && frames[frameIdx].naturalWidth > 0)
            ? frames[frameIdx]
            : null;

        if (!img && BigCollect.sprites) {
            const fbFrames = (BigCollect.sprites[1] && BigCollect.sprites[1].length > 0) ? BigCollect.sprites[1] : (BigCollect.sprites[2] || []);
            const fbIdx = Math.floor(this.image_index) % (fbFrames.length || 1);
            if (fbFrames[fbIdx] && fbFrames[fbIdx].complete && fbFrames[fbIdx].naturalWidth > 0) {
                img = fbFrames[fbIdx];
            }
        }

        if (img) {
            ctx.save();
            const cx = this.x + this.width / 2;
            const cy = this.y + this.height / 2;
            // spr_bigcollect 프레임은 100x100 크기이며 중심이 (50, 50)에 위치
            ctx.drawImage(img, cx - 50, cy - 50, 100, 100);
            ctx.restore();
        } else {
            // 로딩 중 대체 원형 렌더링
            ctx.fillStyle = '#f1c40f';
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2 - 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#f39c12';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold ' + this.fontSize + 'px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.points.toString(), this.x + this.width / 2, this.y + this.height / 2);
        }
    }
}

Collect.initImages();
BigCollect.initImages();

if (typeof window !== 'undefined') {
    window.Collect = Collect;
    window.BigCollect = BigCollect;
    window.obj_collect = Collect;
    window.obj_bigcollect = BigCollect;
}

class PizzaBoxUnopen extends Entity {
    static sprites = [];
    static imagesLoaded = false;

    static initImages() {
        if (PizzaBoxUnopen.imagesLoaded) return;
        PizzaBoxUnopen.sprites = [];
        for (let i = 0; i < 30; i++) {
            const img = new Image();
            img.src = `spr_pizzaboxunopen/spr_pizzaboxunopen_${i}.png`;
            PizzaBoxUnopen.sprites.push(img);
        }
        PizzaBoxUnopen.imagesLoaded = true;
    }

    constructor(x, y, width = 64, height = 64, flipX = false, flipY = false, toppinType = 1) {
        let actualW = 64;
        let actualH = 64;
        let actualFlipX = false;
        let actualFlipY = false;
        let actualType = 1;

        if (typeof width === 'number' && width <= 5) {
            actualType = width;
        } else if (typeof width === 'string' && ['1', '2', '3', '4', '5', 'shroom', 'mushroom', 'cheese', 'tomato', 'sausage', 'pineapple', 'apple', 'orange', 'grape', 'watermelon'].includes(width.toLowerCase())) {
            actualType = width;
        } else {
            actualW = typeof width === 'number' ? width : 64;
            actualH = typeof height === 'number' ? height : 64;
            if (typeof flipX === 'number' || (typeof flipX === 'string' && ['1', '2', '3', '4', '5'].includes(flipX))) {
                actualType = flipX;
            } else {
                actualFlipX = !!flipX;
                actualFlipY = !!flipY;
                actualType = toppinType !== undefined ? toppinType : 1;
            }
        }

        super(x, y, actualW, actualH, 'transparent', actualFlipX, actualFlipY);
        this.type = 'pizzaboxunopen';
        this.isSolid = false;
        this.isPlatform = false;
        this.toppinType = actualType;
        this.isOpened = false;
        this.image_index = 0;
        this.image_speed = 0.35;
        this.particles = [];
        PizzaBoxUnopen.initImages();
    }

    open(game) {
        if (this.isOpened) return;
        this.isOpened = true;
        if (game && game.persistentDestruction && !game.isEditorMode && this.persistentId && game.destroyedEntityIds) {
            game.destroyedEntityIds.add(this.persistentId);
        }
        if (game) {
            if (!game.openedPizzaBoxes) game.openedPizzaBoxes = [];
            if (!game.openedPizzaBoxes.includes(this)) game.openedPizzaBoxes.push(this);
        }

        if (game.audio && game.audio.playFile) {
            game.audio.playFile('sfx_collect', true);
        } else if (game.audio && game.audio.play) {
            game.audio.play('break');
        }

        // Add 1000 score points
        if (game.score === undefined) game.score = 0;
        game.score += 1000;

        // Combo timer refresh
        if (game.combo > 0) {
            game.comboTimer = 60;
        }

        // Floating score popup (+1000)
        game.floatingTexts = game.floatingTexts || [];
        game.floatingTexts.push({
            x: this.x + this.width / 2,
            y: this.y,
            text: "1000",
            alpha: 1.0,
            vy: -1.5
        });

        // Burst particles
        const colors = ['#df7208', '#f39c12', '#d35400', '#ffffff', '#e67e22'];
        for (let i = 0; i < 16; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = 2 + Math.random() * 6;
            this.particles.push({
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd - 3,
                size: 3 + Math.random() * 5,
                color: colors[Math.floor(Math.random() * colors.length)],
                alpha: 1.0,
                life: 30 + Math.random() * 20
            });
        }

        // Spawn freed toppin follower! (1=사과/버섯, 2=오렌지/치즈, 3=포도/토마토, 4=수박/소시지, 5=파인애플)
        game.toppins = game.toppins || [];
        let typeToUse = this.toppinType;
        if (!typeToUse || typeToUse === 'mushroom') {
            typeToUse = (game.toppins.length % 5) + 1;
        }
        const toppin = new Toppin(this.x + this.width / 2 - 16, this.y + this.height - 36, typeToUse);
        game.toppins.push(toppin);
    }

    update(game) {
        const isEditor = (window.gameInstance && window.gameInstance.isEditorMode) || (window.game && window.game.isEditorMode);

        // Update burst particles
        if (this.particles.length > 0) {
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.25;
                p.alpha -= 1 / p.life;
                if (p.alpha <= 0) {
                    this.particles.splice(i, 1);
                }
            }
        }

        if (isEditor) {
            this.isOpened = false;
            this.image_index = (this.image_index + this.image_speed) % 30;
            return;
        }

        if (this.isOpened) return;

        this.image_index = (this.image_index + this.image_speed) % 30;

        // Player overlap trigger
        if (game && game.player) {
            const p = game.player;
            if (p.x + p.width > this.x && p.x < this.x + this.width &&
                p.y + p.height > this.y && p.y < this.y + this.height) {
                this.open(game);
            }
        }
    }

    render(ctx) {
        // Draw burst particles
        if (this.particles.length > 0) {
            ctx.save();
            for (const p of this.particles) {
                ctx.globalAlpha = Math.max(0, p.alpha);
                ctx.fillStyle = p.color;
                ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
            }
            ctx.restore();
        }

        const isEditor = (window.gameInstance && window.gameInstance.isEditorMode) || (window.game && window.game.isEditorMode);
        if (this.isOpened && !isEditor) return;

        ctx.save();
        if (this.flipX || this.flipY) {
            const cx = this.x + this.width / 2;
            const cy = this.y + this.height / 2;
            ctx.translate(cx, cy);
            ctx.scale(this.flipX ? -1 : 1, this.flipY ? -1 : 1);
            ctx.translate(-cx, -cy);
        }

        const frames = PizzaBoxUnopen.sprites;
        const frameIdx = Math.floor(this.image_index) % 30;
        const img = frames && frames[frameIdx];

        if (img && img.complete && img.naturalWidth > 0) {
            // Draw 96x96 sprite with 16px offset to align 64x64 box to entity bounding box
            ctx.drawImage(img, this.x - 16, this.y - 16, 96, 96);
        } else {
            // Fallback while loading
            ctx.fillStyle = '#b7950b';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 10px monospace';
            ctx.fillText('P-BOX', this.x + 14, this.y + 36);
        }

        // Show outline in editor mode or collision view
        const showDebug = (window.gameInstance && (window.gameInstance.showCollisions || window.gameInstance.isEditorMode));
        if (showDebug) {
            ctx.strokeStyle = '#f39c12';
            ctx.lineWidth = 1;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }

        // In editor mode, show cute badge indicating toppin character (1..5)
        if (isEditor) {
            let typeId = 1;
            if (typeof this.toppinType === 'number' && this.toppinType >= 1 && this.toppinType <= 5) {
                typeId = this.toppinType;
            } else if (typeof this.toppinType === 'string') {
                const parsed = parseInt(this.toppinType, 10);
                if (!isNaN(parsed) && parsed >= 1 && parsed <= 5) typeId = parsed;
            }
            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
            ctx.fillRect(this.x + 4, this.y + 4, 22, 18);
            ctx.strokeStyle = '#f1c40f';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(this.x + 4, this.y + 4, 22, 18);
            ctx.fillStyle = '#f1c40f';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(typeId), this.x + 15, this.y + 13);
            ctx.restore();
        }

        ctx.restore();
    }
}

class Toppin {
    static maskImage = null;
    static initImage() {
        if (!Toppin.maskImage) {
            Toppin.maskImage = new Image();
            Toppin.maskImage.src = 'player/spr_player_mask.png';
        }
        if (typeof Collect !== 'undefined' && typeof Collect.initImages === 'function') {
            Collect.initImages();
        }
    }

    constructor(x, y, toppinType = 1) {
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 36;
        this.toppinType = toppinType;
        this.facingDir = 1;
        this.animTimer = Math.random() * 10;
        this.popTimer = 10; // Pop-out frames
        this.popVy = -6;
        this.isSolid = false;
        this.dragLag = 0; // Trailing drag inertia for Option A
        Toppin.initImage();
    }

    getCollectTypeId(index = 0) {
        if (typeof this.toppinType === 'number' && this.toppinType >= 1 && this.toppinType <= 5) {
            return this.toppinType;
        }
        if (typeof this.toppinType === 'string') {
            const lower = this.toppinType.toLowerCase();
            if (lower.includes('shroom') || lower.includes('mushroom') || lower.includes('apple') || lower === '1') return 1;
            if (lower.includes('cheese') || lower.includes('orange') || lower === '2') return 2;
            if (lower.includes('tomato') || lower.includes('grape') || lower === '3') return 3;
            if (lower.includes('sausage') || lower.includes('watermelon') || lower === '4') return 4;
            if (lower.includes('pineapple') || lower === '5') return 5;
        }
        return (index % 5) + 1;
    }

    update(game, index = 0) {
        const player = game.player;
        if (!player) return;

        if (this.popTimer > 0) {
            this.popTimer--;
            this.y += this.popVy;
            this.popVy += 0.6;
            // Pop 중에 플레이어 방향으로 유도
            const playerCenterX = player.x + player.width / 2;
            const thisCenterX = this.x + this.width / 2;
            const driftX = playerCenterX - thisCenterX;
            if (Math.abs(driftX) > 1) {
                this.x += Math.sign(driftX) * Math.min(Math.abs(driftX), 10);
            }
            return;
        }

        const trail = game.playerTrail || [];
        if (trail.length === 0) return;

        // [Option A] Trailing Drag (바람/관성에 의한 거리 벌어짐):
        // 수평 질주 시 토핑이 바로 등 뒤(24px)에 바짝 붙지 않고, 바람과 관성에 끌려오듯 자연스럽게 60~80px 후방으로 벌어짐
        const horizontalSpd = Math.abs(player.vx || 0);
        const speedExcess = Math.max(0, horizontalSpd - 3);
        const targetDrag = Math.min(8, speedExcess * 0.7);

        if (this.dragLag === undefined) this.dragLag = 0;
        const lagRate = targetDrag > this.dragLag ? 0.09 : 0.08;
        this.dragLag += (targetDrag - this.dragLag) * lagRate;

        // 후속 토핑 간격도 질주 시 비례하여 여유 있게 벌어짐 (P > T0 > T1 > T2 순서 완벽 유지)
        const followerSpread = Math.round(this.dragLag * 0.3);
        const targetIndex = Math.min(trail.length - 1, Math.round(6 + this.dragLag + index * (6 + followerSpread)));
        const target = trail[targetIndex];
        if (!target) return;

        const targetX = target.x;
        const targetY = target.y;
        const targetFacing = target.facingDir || 1;

        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const dist = Math.hypot(dx, dy);

        const isMoving = dist > 1.5 || horizontalSpd > 0.4;
        this.animTimer += (isMoving ? 0.32 : 0.22);

        if (dist > 500) {
            // 룸 이동 등 극단적으로 거리가 벌어지면 즉시 스냅
            this.x = targetX;
            this.y = targetY;
            this.facingDir = targetFacing;
        } else if (dist <= 1.0) {
            this.x = targetX;
            this.y = targetY;
            this.facingDir = targetFacing;
        } else {
            // 부드러운 탄성 추적 (질주 시 자연스러운 슬립스트림 완충)
            const ease = Math.min(0.42, 0.28 + dist * 0.002);
            this.x += dx * ease;
            this.y += dy * ease;
            this.facingDir = targetFacing;
        }
    }

    render(ctx, index = 0) {
        ctx.save();
        
        // 정지 및 이동 중에도 파도타기 위상차로 생동감 있게 뛰는 깡총 바운스 효과
        const hopHeight = 11;
        const hopProgress = Math.sin(this.animTimer + index * 0.8);
        const bobY = Math.abs(hopProgress) * -hopHeight;
        const renderX = Math.round(this.x);
        const renderY = Math.round(this.y + bobY);

        const cx = renderX + this.width / 2;
        const cy = renderY + this.height;
        ctx.translate(cx, cy);

        // 좌우 반전
        if (this.facingDir === -1) {
            ctx.scale(-1, 1);
        }

        // [Option A] 질주 시 바람 저항(Slipstream Drag) 연출:
        // 바람에 끌려올 때 뒤로 살짝 눕는 틸트와 유선형 스트레치
        const dragIntensity = Math.min(1.0, (this.dragLag || 0) / 7.5);
        if (dragIntensity > 0.05) {
            ctx.rotate(-dragIntensity * 0.12); // 뒤로 약 7도 자연스러운 바람 눕힘
        }

        // 도약/착지에 맞춘 귀여운 스쿼시 & 스트레치
        const stretch = 1.0 + (bobY / hopHeight) * -0.15 - dragIntensity * 0.05;
        const squash = 1.0 + (1.0 - Math.abs(bobY / hopHeight)) * 0.1 + dragIntensity * 0.1;
        ctx.scale(squash, stretch);

        const typeId = this.getCollectTypeId(index);
        let drawn = false;

        // [임시 과일/음식 수집품 이미지 적용] spr_collect 1~5 애니메이션 스프라이트 렌더링
        if (typeof Collect !== 'undefined' && Collect.sprites && Collect.sprites[typeId]) {
            const frames = Collect.sprites[typeId];
            if (frames && frames.length > 0) {
                const frameIdx = Math.floor(this.animTimer * 1.0) % frames.length;
                const img = frames[frameIdx];
                if (img && img.complete && img.naturalWidth > 0) {
                    // spr_collect 스프라이트(100x100) 하단(Y=68)을 지면 피벗(Y=0)에 자연스럽게 정렬
                    ctx.drawImage(img, -50, -68, 100, 100);
                    drawn = true;
                }
            }
        }

        if (!drawn) {
            const img = Toppin.maskImage;
            if (img && img.complete && img.naturalWidth > 0) {
                ctx.drawImage(img, -this.width / 2 - 38, -this.height - 35, 100, 100);
            } else {
                ctx.fillStyle = '#ff3333';
                ctx.fillRect(-this.width / 2, -this.height, this.width, this.height);
            }
        }

        ctx.restore();
    }
}

class PizzaSon extends Entity {
    static idleSprites = [];
    static throwSprites = [];
    static imagesLoaded = false;

    static initImages() {
        if (PizzaSon.imagesLoaded) return;
        PizzaSon.idleSprites = [];
        for (let i = 1; i <= 11; i++) {
            const img = new Image();
            img.src = `이미지/spr_pizzasona1/spr_pizzasona${i}.png`;
            PizzaSon.idleSprites.push(img);
        }
        PizzaSon.throwSprites = [];
        for (let i = 1; i <= 7; i++) {
            const img = new Image();
            img.src = `이미지/spr_pizzasona1throw/spr_pizzasona1throw${i}.png`;
            PizzaSon.throwSprites.push(img);
        }
        if (typeof Collect !== 'undefined' && typeof Collect.initImages === 'function') {
            Collect.initImages();
        }
        PizzaSon.imagesLoaded = true;
    }

    constructor(x, y, width = 64, height = 64, flipX = false, flipY = false) {
        super(x, y, width, height, 'transparent', flipX, flipY);
        this.type = 'obj_pizzason';
        this.baseX = x;
        this.baseY = y;
        this.isSolid = false;
        this.isPlatform = false;
        this.facingDir = flipX ? -1 : 1;
        this.isActivated = false;
        this.isCollected = false;
        this.isOffScreenGone = false;
        this.pointsGiven = 0;
        this.scoreTickTimer = 0;
        this.vy = 0;
        this.alpha = 1.0;
        this.image_index = 0;
        this.image_speed = 0.25;
        this.spawnedFruits = [];
        PizzaSon.initImages();
    }

    resetState() {
        this.isActivated = false;
        this.isCollected = false;
        this.isOffScreenGone = false;
        this.markedForDeletion = false;
        this.isDestroyed = false;
        this.pointsGiven = 0;
        this.scoreTickTimer = 0;
        this.vy = 0;
        this.alpha = 1.0;
        this.image_index = 0;
        this.spawnedFruits = [];
        if (typeof this.baseX === 'number') this.x = this.baseX;
        if (typeof this.baseY === 'number') this.y = this.baseY;
        this.facingDir = this.flipX ? -1 : 1;
    }

    spawnFruit() {
        if (typeof Collect !== 'undefined' && typeof Collect.initImages === 'function') {
            Collect.initImages();
        }
        const collectType = Math.floor(Math.random() * 5) + 1;
        const frameMap = { 1: 8, 2: 13, 3: 16, 4: 4, 5: 5 };
        const maxF = frameMap[collectType] || 8;
        this.spawnedFruits.push({
            x: this.x + this.width / 2,
            y: this.y + this.height / 2,
            vx: (Math.random() - 0.5) * 7,
            vy: -4 - Math.random() * 3,
            collectType,
            image_index: Math.random() * maxF,
            image_speed: 0.35,
            scatterTimer: 10
        });
    }

    updateFruits(game) {
        const camX = (game && game.camera) ? game.camera.x : 0;
        const camY = (game && game.camera) ? game.camera.y : 0;
        const targetX = camX + 130;
        const targetY = camY + 70;

        for (let i = this.spawnedFruits.length - 1; i >= 0; i--) {
            const f = this.spawnedFruits[i];
            f.image_index = (f.image_index + f.image_speed) % 1000;
            if (f.scatterTimer > 0) {
                f.scatterTimer--;
                f.x += f.vx;
                f.y += f.vy;
                f.vy += 0.35;
            } else {
                const dx = targetX - f.x;
                const dy = targetY - f.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 20) {
                    this.spawnedFruits.splice(i, 1);
                } else {
                    f.x += (dx / dist) * 20;
                    f.y += (dy / dist) * 20;
                }
            }
        }
    }

    update(game) {
        const isEditor = (game && game.isEditorMode) || (typeof window !== 'undefined' && ((window.gameInstance && window.gameInstance.isEditorMode) || (window.game && window.game.isEditorMode)));
        if (isEditor) {
            this.resetState();
            const len = PizzaSon.idleSprites.length || 11;
            this.image_index = (this.image_index + this.image_speed) % len;
            return;
        }

        this.updateFruits(game);

        if (this.isOffScreenGone) {
            if (this.spawnedFruits.length === 0) {
                this.markedForDeletion = true;
            }
            return;
        }

        if (game && game.player) {
            const p = game.player;
            const pCenterX = p.x + p.width / 2;
            const selfCenterX = this.x + this.width / 2;
            this.facingDir = (pCenterX < selfCenterX) ? -1 : 1;

            if (!this.isActivated &&
                p.x < this.x + this.width &&
                p.x + p.width > this.x &&
                p.y < this.y + this.height &&
                p.y + p.height > this.y) {
                this.isActivated = true;
                this.isCollected = true;
                this.image_index = 0;
                this.vy = 0;
                this.scoreTickTimer = 0;
            }
        }

        if (!this.isActivated) {
            const len = PizzaSon.idleSprites.length || 11;
            this.image_index = (this.image_index + this.image_speed) % len;
            return;
        }

        const throwLen = PizzaSon.throwSprites.length || 7;
        this.image_index = (this.image_index + 0.3) % throwLen;

        if (this.pointsGiven < 250) {
            if (this.scoreTickTimer % 4 === 0) {
                this.pointsGiven += 10;
                this.spawnFruit();
                if (game) {
                    game.score = (game.score || 0) + 10;
                    if (game.combo > 0) {
                        game.comboTimer = Math.min(60, (game.comboTimer || 0) + 10);
                    }
                    if (game.audio && game.audio.play) {
                        game.audio.play('sfx_collect');
                    }
                }
            }
            this.scoreTickTimer++;
        }

        if (this.pointsGiven >= 250) {
            // Once all 250 points are awarded, launch upwards fast while fading out and remove outside screen bounds
            if (this.vy === 0) {
                this.vy = -3;
            }
            this.vy -= 0.35;
            this.y += this.vy;
            this.alpha = Math.max(0, this.alpha - 0.02);

            if (game && game.camera && game.canvas) {
                const camX = game.camera.x;
                const camY = game.camera.y;
                const camW = game.canvas.width;
                const camH = game.canvas.height;
                const isOffScreen =
                    this.y + this.height < camY ||
                    this.y > camY + camH ||
                    this.x + this.width < camX ||
                    this.x > camX + camW;
                if (isOffScreen) {
                    this.isOffScreenGone = true;
                    if (this.spawnedFruits.length === 0) {
                        this.markedForDeletion = true;
                    }
                }
            }
        }
    }

    render(ctx) {
        if (!this.isOffScreenGone) {
            const frames = this.isActivated ? PizzaSon.throwSprites : PizzaSon.idleSprites;
            const frameIdx = frames.length > 0 ? Math.floor(this.image_index) % frames.length : 0;
            const img = frames[frameIdx];

            ctx.save();
            ctx.globalAlpha *= Math.max(0, this.alpha);
            if (img && img.complete && img.naturalWidth > 0) {
                const cx = Math.round(this.x + this.width / 2);
                const cy = Math.round(this.y + this.height / 2);
                ctx.translate(cx, cy);
                ctx.scale(this.facingDir === -1 ? -1 : 1, this.flipY ? -1 : 1);
                const drawOffsetY = this.height / 2 - 74;
                ctx.drawImage(img, -50, drawOffsetY, 100, 100);
            } else {
                ctx.fillStyle = '#e67e22';
                ctx.fillRect(this.x, this.y, this.width, this.height);
            }
            ctx.restore();

            const showDebug = (typeof window !== 'undefined' && window.gameInstance && (window.gameInstance.showCollisions || window.gameInstance.isEditorMode));
            if (showDebug) {
                ctx.strokeStyle = '#ff9f43';
                ctx.lineWidth = 1;
                ctx.strokeRect(this.x, this.y, this.width, this.height);
            }
        }

        // Render fruits spawned by PizzaSon
        if (this.spawnedFruits && this.spawnedFruits.length > 0 && typeof Collect !== 'undefined' && Collect.sprites) {
            for (let i = 0; i < this.spawnedFruits.length; i++) {
                const f = this.spawnedFruits[i];
                const frames = (Collect.sprites[f.collectType] && Collect.sprites[f.collectType].length > 0)
                    ? Collect.sprites[f.collectType]
                    : Collect.sprites[1];
                if (frames && frames.length > 0) {
                    const img = frames[Math.floor(f.image_index) % frames.length];
                    if (img && img.complete && img.naturalWidth > 0) {
                        ctx.drawImage(img, f.x - 50, f.y - 50, 100, 100);
                    }
                }
            }
        }
    }
}

PizzaBoxUnopen.initImages();
Toppin.initImage();
PizzaSon.initImages();

if (typeof window !== 'undefined') {
    window.PizzaBoxUnopen = PizzaBoxUnopen;
    window.pizzaboxunopen = PizzaBoxUnopen;
    window.obj_pizzaboxunopen = PizzaBoxUnopen;
    window.Toppin = Toppin;
    window.PizzaSon = PizzaSon;
    window.pizzason = PizzaSon;
    window.obj_pizzason = PizzaSon;

    window.AppleBlock = AppleBlock;
    window.AppleBlockSmall = AppleBlockSmall;
    window.AppleBlockBig = AppleBlockBig;
    window.appleblock = AppleBlock;
    window.appleblock_small = AppleBlockSmall;
    window.appleblock_big = AppleBlockBig;
    window.obj_destroyable2 = AppleBlockSmall;
    window.obj_bigbreakable2 = AppleBlockBig;
    window.PizzaBlockDead = PizzaBlockDead;

    window.SecretPortal = SecretPortal;
    window.SecretPortalExit = SecretPortalExit;
    window.secretportal = SecretPortal;
    window.secretportalexit = SecretPortalExit;
    window.obj_secretportal = SecretPortal;
    window.obj_secretportalexit = SecretPortalExit;

}



class SlimeDebris extends Entity {
    static images = null;
    static initImages() {
        if (!SlimeDebris.images) {
            SlimeDebris.images = [];
            for (let i = 1; i <= 3; i++) {
                const img = new Image();
                img.src = 'slimedebris/slimedebris' + i + '.png';
                SlimeDebris.images.push(img);
            }
        }
    }

    constructor(x, y, vx = 0, vy = 0) {
        super(x - 25, y - 25, 50, 50, 'transparent');
        this.type = 'obj_debris';
        this.isSolid = false;
        this.isPlatform = false;
        this.renderBehind = true; // 슬라임/몬스터 뒤쪽 레이어에 렌더링
        
        SlimeDebris.initImages();

        this.vx = vx;
        this.vy = vy;
        this.initialVy = vy < 0 ? vy : -2.5; // 방출 초기 수직 속도 (납작 스쿼시 계산 기준)
        this.gravity = 0.32;
        this.image_index = 0;
        this.image_speed = 1 / 8; // 8프레임 애니메이션 (1프레임당 8틱 유지)
        this.lifetime = 0;
        this.maxLifetime = 48; // 총 48프레임 수명 (24틱 1사이클 * 2회 회전)
        this.alpha = 1.0;
    }

    update(game) {
        this.lifetime++;

        // 연속 애니메이션 재생 (무한 루프)
        if (SlimeDebris.images && SlimeDebris.images.length > 0) {
            this.image_index = (this.image_index + this.image_speed) % SlimeDebris.images.length;
        }

        // 바닥 충돌 없이 중력과 속도로 자유롭게 포물선 비행 (바닥 통과)
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        if (this.vy > 14) this.vy = 14;

        // 시간에 따라 점점 투명해지게 페이드아웃
        this.alpha = Math.max(0, 1 - (this.lifetime / this.maxLifetime));

        // 화면 밖으로 완전히 벗어나거나 완전히 투명해지면 삭제
        const camX = (game && game.camera) ? game.camera.x : 0;
        const camY = (game && game.camera) ? game.camera.y : 0;
        const viewW = (game && game.canvas) ? game.canvas.width : 960;
        const viewH = (game && game.canvas) ? game.canvas.height : 540;
        const margin = 120;

        if (this.alpha <= 0 ||
            this.y > camY + viewH + margin ||
            this.y < camY - margin * 3 ||
            this.x < camX - margin ||
            this.x > camX + viewW + margin) {
            this.markedForDeletion = true;
            this.isDestroyed = true;
        }
    }

    render(ctx) {
        const imgs = SlimeDebris.images;
        if (!imgs || imgs.length === 0) return;
        const frameIdx = Math.floor(this.image_index) % imgs.length;
        const img = imgs[frameIdx];
        if (img && img.complete && img.naturalWidth > 0) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, Math.min(1, this.alpha));

            // 스쿼시 & 스트레치: 나올 때 납작했다가, 떨어지는 속도에 따라 세로로 늘어남
            let sx = 1.0;
            let sy = 1.0;

            if (this.vy < 0 && this.initialVy < 0) {
                // 방출 상승 구간: 나올 때 납작(가로 넓고 세로 낮음)했다가 정점에 도달하며 둥근 형태로 복원
                const riseRatio = Math.max(0, Math.min(1, this.vy / this.initialVy));
                sx = 1.0 + (0.50 * riseRatio); // 나올 때 최대 1.5배 넓적
                sy = 1.0 - (0.45 * riseRatio); // 나올 때 0.55배 납작
            } else if (this.vy >= 0) {
                // 낙하 구간: 떨어지는 속도(vy)에 비례하여 세로로 길쭉하게 늘어남
                const fallRatio = Math.min(1.3, this.vy / 10);
                sy = 1.0 + (fallRatio * 0.70); // 낙하 속도 빠를수록 최대 1.9배까지 세로로 늘어남
                sx = Math.max(0.55, 1.0 - (fallRatio * 0.35)); // 부피 보존: 가로는 홀쭉해짐
            }

            const cx = Math.round(this.x + this.width / 2);
            const cy = Math.round(this.y + this.height / 2);

            // 이동 방향(속도 벡터) 각도 계산: 로컬 Y축이 진행 방향(속도 방향)을 향하도록 회전 정렬
            let angle = 0;
            if (Math.abs(this.vx) > 0.05 || Math.abs(this.vy) > 0.05) {
                angle = Math.atan2(this.vy, this.vx) - Math.PI / 2;
            }

            ctx.translate(cx, cy);
            ctx.rotate(angle);
            ctx.scale(sx, sy);
            ctx.drawImage(img, -this.width / 2, -this.height / 2, this.width, this.height);
            ctx.restore();
        }
    }
}

if (typeof window !== 'undefined') {
    window.SlimeDebris = SlimeDebris;
    window.obj_slimedebris = SlimeDebris;
}

class Slime extends Entity {
    static deadImage = null;
    static stunImages = null;

    static initImages() {
        if (!Slime.deadImage) {
            const deadImg = new Image();
            deadImg.src = 'spr_slimedead.png';
            Slime.deadImage = deadImg;
        }
        if (!Slime.stunImages) {
            Slime.stunImages = [];
            for (let i = 1; i <= 3; i++) {
                const sImg = new Image();
                sImg.src = `spr_slimestun/spr_slimestun${i}.png`;
                Slime.stunImages.push(sImg);
            }
        }
    }

    constructor(x, y, w = 40, h = 40, flipX = false, flipY = false) {
        super(x, y, w, h, 'transparent', flipX, flipY);
        this.type = 'obj_slime';
        this.spawnX = x;
        this.spawnY = y;
        this.moveSpeed = 1; // Movement speed (reduced from 2 for slower squishy walk)
        this.vx = this.moveSpeed * (this.flipX ? -1 : 1);
        this.vy = 0;
        this.isGrounded = false;
        this.isSolid = false;
        this.isPlatform = false;
        this.color = '#2ecc71'; // Green slime
        this.bounceTimer = 0;
        
        this.state = 'walk'; // 'walk', 'stunned'
        this.stunTimer = 0;
        this.flipX = !!flipX;
        this.flipY = !!flipY;
        this.facingDir = this.flipX ? -1 : 1;
        this.vx = this.moveSpeed * this.facingDir;
        this.hitCooldown = 0;
        
        this.sprites = [];
        this.image_index = 0;
        this.image_speed = 0.35;
        this.squashTimer = 0;
        this.maxSquashTimer = 0;
        for (let i = 1; i <= 9; i++) {
            let img = new Image();
            img.src = `spr_slimewalk/spr_slimewalk${i}.png`;
            this.sprites.push(img);
        }
        Slime.initImages();
        this.deadSprite = Slime.deadImage;
        this.stunSprites = Slime.stunImages;
        this.deadDebrisTimer = 0;
    }

    advanceStunAnim() {
        const stunLen = (this.stunSprites && this.stunSprites.length > 0) ? this.stunSprites.length : 3;
        this.image_index = (this.image_index + this.image_speed) % stunLen;
    }

    static isBreakableBlock(ent) {
        return (typeof Destroyable !== 'undefined' && ent instanceof Destroyable) ||
            ent.type === 'destroyable' || ent.type === 'appleblock_small' || ent.type === 'appleblock_big' ||
            ent.type === 'obj_secretblock' || ent.type === 'secretblock' ||
            ent.type === 'obj_secretbigblock' || ent.type === 'secretbigblock' ||
            ent.type === 'metal' || ent.type === 'obj_secretmetalblock' || ent.type === 'secretmetalblock' ||
            ent.type === 'pillar';
    }

    awardKillScore(game) {
        if (!game) return;
        if (!this.spawnedBySpawner) {
            game.combo = (game.combo || 0) + 1;
            game.comboTimer = 60;
            const x = game.combo;
            const pts = Math.floor(x * x * 0.25 + 10 * x);
            if (game.score === undefined) game.score = 0;
            game.score += pts;

            game.floatingTexts = game.floatingTexts || [];
            game.floatingTexts.push({
                x: this.x + this.width / 2,
                y: this.y,
                text: pts.toString(),
                alpha: 1.0,
                vy: -1
            });
        } else if (game.combo > 0) {
            game.comboTimer = 60;
        }
    }

    kill(game, knockDir = 1, sourceVx = 15 * knockDir) {
        if (this.state === 'dead' || this.state === 'piledriver_die' || this.isDestroyed) return;
        const dir = Math.sign(knockDir) || 1;

        let floorY = this.y + this.height;
        const splatterOffset = (typeof sourceVx === 'number' ? sourceVx : 0) * 3;
        const splatterX = this.x + this.width / 2 + splatterOffset;
        let floorEnt = null;
        if (game && Array.isArray(game.entities)) {
            for (let step = 0; step < 200; step += 10) {
                const checkY = floorY + step;
                let foundFloor = false;
                for (let ent of game.entities) {
                    if (!ent || ent.isDestroyed || ent.isSolid === false || ent.isCutoff || ent.type === 'obj_cutoff' || ent.type === 'obj_cutoffsmall' || ent.type === 'cutoff' || ent.type === 'hallway' || ent.type === 'hallwayvertical' || ent.type === 'tutorialbook' || ent.type === 'obj_collect' || ent.type === 'obj_bigcollect' || ent.type === 'obj_slime' || ent.type === 'obj_baddiespawner' || ent.type === 'obj_splatter') continue;
                    if (splatterX >= ent.x && splatterX <= ent.x + ent.width && checkY >= ent.y && checkY <= ent.y + ent.height) {
                        floorY = ent.y;
                        floorEnt = ent;
                        foundFloor = true;
                        break;
                    }
                }
                if (foundFloor) break;
            }
            game.entities.push(new Splatter(splatterX, floorY, floorEnt));
        }

        this.state = 'dead';
        this.vy = -15;
        this.vx = 15 * dir;
        if (game) {
            game.cameraShake = 20;
            this.awardKillScore(game);
            if (game.audio && game.audio.play) game.audio.play('sfx_enemyhit');
        }
        this.hitCooldown = 15;
    }

    update(game) {
        // If spawned by spawner and currently in editor mode, disappear immediately!
        if (this.spawnedBySpawner && game && game.isEditorMode) {
            this.markedForDeletion = true;
            return;
        }

        // In Editor (Design) Mode: stay frozen at initial spawn position, never move or take damage
        if (game && game.isEditorMode) {
            this.state = 'walk';
            this.vx = 0;
            this.vy = 0;
            this.hitCooldown = 0;
            this.stunTimer = 0;
            this.squashTimer = 0;
            this.deadDebrisTimer = 0;
            if (typeof this.spawnX === 'number') this.x = this.spawnX;
            if (typeof this.spawnY === 'number') this.y = this.spawnY;
            return;
        }

        if (this.state === 'held') {
            const p = game.player;
            if (p.isHoldingEnemy && p.heldEnemy === this) {
                const dir = p.facingDir || 1;
                this.facingDir = dir;
                this.isGrounded = false;
                if (p.isFinishingBlow) {
                    // 피니싱 블로우 차지 중: 주먹 앞에 위치하며 카툰 스타일로 부들부들 떨림
                    const trembleX = (Math.random() - 0.5) * 3;
                    const trembleY = (Math.random() - 0.5) * 3;
                    this.x = p.x + (p.width - this.width) / 2 + dir * 38 + trembleX;
                    this.y = p.y + 4 + trembleY;
                } else {
                    this.x = p.x + (p.width - this.width) / 2 - dir * 3;
                    this.y = p.y - 26 + (p.isCrouching ? 10 : 0);
                }
                this.vx = 0;
                this.vy = 0;
                this.advanceStunAnim();
                return;
            }
        }
        if (this.hitCooldown > 0) this.hitCooldown--;
        if (this.squashTimer > 0) this.squashTimer--;
        this.wasGrounded = this.isGrounded;
        if (this.state === 'walk') {
            const oldIndex = this.image_index;
            this.image_index += this.image_speed;
            if (this.image_index >= this.sprites.length) {
                this.image_index = 0;
            }

            // 슬라임 걸어가는 애니메이션 이미지가 8프레임(spr_slimewalk8.png, index 7)일 때 방울 2개 방출 (한 쪽은 뒤쪽, 한 쪽은 머리)
            const reachedFrame8 = (oldIndex < 7 && this.image_index >= 7) || 
                                  (Math.floor(oldIndex) !== 7 && Math.floor(this.image_index) === 7);

            if (this.isGrounded && reachedFrame8 && game && game.entities) {
                // 1) 뒤쪽(등/엉덩이) 방울: 슬라임 뒤쪽 아래에서 살짝 튀어나감
                const rearX = (this.facingDir === 1)
                    ? (this.x - 2 + Math.random() * 4) // 오른쪽으로 갈 때 -> 왼쪽 뒤
                    : (this.x + this.width + 2 - Math.random() * 4); // 왼쪽으로 갈 때 -> 오른쪽 뒤
                const rearY = this.y + this.height - 8 + (Math.random() - 0.5) * 4;
                const rearVx = -this.facingDir * (1.2 + Math.random() * 0.5) + (Math.random() - 0.5) * 0.4;
                const rearVy = -2.2 - Math.random() * 0.8;
                game.entities.push(new SlimeDebris(rearX, rearY, rearVx, rearVy));

                // 2) 한 쪽은 머리(정수리) 방울: 슬라임 머리 위쪽에서 뿅 튀어오름
                const headX = this.x + this.width / 2 + (Math.random() - 0.5) * 6;
                const headY = this.y + 16 + (Math.random() - 0.5) * 4;
                const headVx = -this.facingDir * (0.4 + Math.random() * 0.4) + (Math.random() - 0.5) * 0.6;
                const headVy = -3.2 - Math.random() * 0.8;
                game.entities.push(new SlimeDebris(headX, headY, headVx, headVy));
            }
        } else if (this.state === 'stunned' || this.state === 'kicked') {
            this.advanceStunAnim();
        } else {
            this.image_index = 0;
        }
        
        if (this.state === 'piledriver_die') {
            this.awardKillScore(game);

            this.state = 'dead';
            this.vx = Math.random() > 0.5 ? 5 : -5;
            this.vy = -12;
            
            // Raycast for floor splatter
            let floorY = this.y + this.height;
            let floorEnt = null;
            for (let step = 0; step < 200; step += 10) {
                let checkY = floorY + step;
                let foundFloor = false;
                for (let ent of game.entities) {
                    if (ent.isDestroyed || ent.isSolid === false || ent.isCutoff || ent.type === 'obj_cutoff' || ent.type === 'obj_cutoffsmall' || ent.type === 'cutoff' || ent.type === 'hallway' || ent.type === 'hallwayvertical' || ent.type === 'tutorialbook' || ent.type === 'obj_collect' || ent.type === 'obj_bigcollect' || ent.type === 'obj_slime' || ent.type === 'obj_baddiespawner' || ent.type === 'obj_splatter') continue;
                    if (this.x + this.width/2 >= ent.x && this.x + this.width/2 <= ent.x + ent.width) {
                        if (checkY >= ent.y && checkY <= ent.y + ent.height) {
                            floorY = ent.y;
                            floorEnt = ent;
                            foundFloor = true;
                            break;
                        }
                    }
                }
                if (foundFloor) break;
            }
            game.entities.push(new Splatter(this.x + this.width/2, floorY, floorEnt));
            return;
        }
        
        if (this.state === 'dead') {
            this.x += this.vx;
            this.y += this.vy;
            this.vy += 0.5; // gravity for arc

            if (game && Array.isArray(game.entities)) {
                const camY = (game.camera && typeof game.camera.y === 'number') ? game.camera.y : 0;
                const viewH = (game.canvas && typeof game.canvas.height === 'number') ? game.canvas.height : 540;
                const tick = this.deadDebrisTimer || 0;
                if (tick % 3 === 0 && this.y <= camY + viewH + 100) {
                    const count = (tick === 0) ? 2 : 1;
                    const moveDir = Math.sign(this.vx) || 0;
                    for (let i = 0; i < count; i++) {
                        const cx = this.x + this.width / 2 + (Math.random() - 0.5) * 14;
                        const cy = this.y + this.height / 2 + (Math.random() - 0.5) * 14;
                        const dropVx = -moveDir * (1.2 + Math.random() * 1.4) + (Math.random() - 0.5) * 2.2;
                        const dropVy = -2.2 - Math.random() * 2.4 + (this.vy < 0 ? this.vy * 0.12 : 0);
                        game.entities.push(new SlimeDebris(cx, cy, dropVx, dropVy));
                    }
                }
                this.deadDebrisTimer = tick + 1;
            }
            
            // Delete when it falls way below screen
            if (this.y > game.camera.y + game.canvas.height + 200) {
                this.markedForDeletion = true;
            }
            return;
        }
        
        // Simple gravity
        if (this.state !== 'kicked') {
            this.vy += 0.5;
            if (this.vy > 12) this.vy = 12;
        } else {
            this.vy = 0; // Fly straight!
        }
        
        this.bounceTimer += 0.1;
        
        // Wake up on taunt
        if (this.state === 'stunned' && game.player.isTaunting && game.player.tauntTimer === 20) {
            const isOffScreen = (this.x + this.width < game.camera.x || this.x > game.camera.x + game.canvas.width ||
                                 this.y + this.height < game.camera.y || this.y > game.camera.y + game.canvas.height);
            if (!isOffScreen) {
                this.state = 'walk';
                this.stunTimer = 0;
                this.squashTimer = 0;
                this.vy = -5;
                this.vx = (this.moveSpeed || 1) * this.facingDir;
            }
        }
        
        if (this.state === 'walk') {
            // Check for player mach3 proximity (scared state)
            const p = game.player;
            const absV = Math.abs(p.vx);
            const isMach3 = absV >= 12 || p.sprite_index.includes('mach3') || p.sprite_index === 'spr_player_mach3jump';
            if (isMach3 && !p.isTaunting) {
                const dx = (p.x + p.width/2) - (this.x + this.width/2);
                const dy = (p.y + p.height/2) - (this.y + this.height/2);
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < 300) {
                    this.state = 'scared';
                    this.scaredTimer = 100;
                    this.vx = 0;
                    this.vy = -4; // hop up slightly
                    this.facingDir = (p.x < this.x) ? -1 : 1; // Face the player
                    if (game.audio && game.audio.play) game.audio.play('jump');
                }
            }
        }
        
        if (this.state === 'scared') {
            this.scaredTimer--;
            // Wake up on taunt
            if (game.player.isTaunting && game.player.tauntTimer === 20) {
                this.state = 'walk';
                this.vx = (this.moveSpeed || 1) * this.facingDir;
            } else if (this.scaredTimer <= 0 && this.isGrounded) {
                this.state = 'walk';
                this.vx = (this.moveSpeed || 1) * this.facingDir;
            }
            this.x += this.vx;
        } else if (this.state === 'walk') {
            this.x += this.vx;
            this.facingDir = Math.sign(this.vx) || 1;
        } else if (this.state === 'stunned' || this.state === 'kicked') {
            this.x += this.vx;
            
            // Off-screen death for kicked enemy (Combo!)
            const offMargin = 400; // Generous off-screen margin so it doesn't die right at the edge of the screen/x=0
            const isOffScreen = (this.x + this.width < game.camera.x - offMargin || this.x > game.camera.x + game.canvas.width + offMargin ||
                                 this.y + this.height < game.camera.y - offMargin || this.y > game.camera.y + game.canvas.height + offMargin);
            if (this.state === 'kicked' && isOffScreen) {
                this.markedForDeletion = true;
                
                game.combo = (game.combo || 0) + 1;
                game.comboTimer = 60; 
                const x = game.combo;
                const pts = Math.floor(x * x * 0.25 + 10 * x);
                if (game.score === undefined) game.score = 0;
                game.score += pts;
                
                if (game.audio && game.audio.play) game.audio.play('sfx_enemyhit');
                return;
            }
            
            // Apply friction
            if (this.isGrounded) {
                if (this.state !== 'kicked') {
                    this.vx *= 0.85; // Ground friction
                }
                if (Math.abs(this.vx) < 0.5) this.vx = 0;
            } else {
                if (this.state !== 'kicked') {
                    this.vx *= 0.98; // Slight air friction
                }
            }
            
            if (this.state === 'stunned') {
                this.stunTimer--;
                if (this.stunTimer <= 0 && this.isGrounded) {
                    this.state = 'walk';
                    this.squashTimer = 0;
                    this.vx = (this.moveSpeed || 1) * this.facingDir;
                }
            }
        }
        
        let hitWall = false;
        let hitWallEnt = null;

        // Kicked enemies break blocks and kill normal enemies along their flight path
        if (this.state === 'kicked') {
            const kickDir = Math.sign(this.vx) || this.facingDir || 1;
            const prevX = this.x - this.vx;
            let reachLeft = Math.min(prevX, this.x);
            let reachRight = Math.max(prevX, this.x) + this.width;
            const snapshotCount = game.entities.length;

            // Clamp sweep range to the nearest unbreakable wall so targets behind solid walls aren't hit
            for (let i = 0; i < snapshotCount; i++) {
                const ent = game.entities[i];
                if (!ent || ent === this || ent.isDestroyed || ent.isSolid === false || Slime.isBreakableBlock(ent)) continue;
                if (ent.isCutoff || ent.type === 'obj_cutoff' || ent.type === 'obj_cutoffsmall' || ent.type === 'cutoff' || ent.type === 'hallway' || ent.type === 'hallwayvertical' || ent.type === 'door' || (typeof ent.type === 'string' && ent.type.startsWith('targetDoor')) || ent.type === 'tutorialbook' || ent.type === 'obj_collect' || ent.type === 'obj_bigcollect' || ent.type === 'obj_slime' || ent.type === 'obj_baddiespawner' || ent.type === 'obj_splatter' || ent.type === 'ladder' || ent.type === 'tile' || ent.type === 'oneway' || ent.type === 'left-up' || ent.type === 'right-up') continue;
                if (reachLeft < ent.x + ent.width && reachRight > ent.x && ent.y < this.y + this.height - 14 && this.y < ent.y + ent.height - 10) {
                    if (kickDir > 0 && ent.x >= prevX) {
                        reachRight = Math.min(reachRight, ent.x + 1);
                    } else if (kickDir < 0 && ent.x + ent.width <= prevX + this.width) {
                        reachLeft = Math.max(reachLeft, ent.x + ent.width - 1);
                    }
                }
            }

            for (let i = 0; i < snapshotCount; i++) {
                const ent = game.entities[i];
                if (!ent || ent === this || ent.isDestroyed || ent.markedForDeletion) continue;
                if (!(reachLeft < ent.x + ent.width && reachRight > ent.x && this.y < ent.y + ent.height && this.y + this.height > ent.y)) {
                    continue;
                }

                if (Slime.isBreakableBlock(ent) && typeof ent.destroy === 'function') {
                    ent.destroy(game);
                    if (game.audio && game.audio.play && ent.type !== 'appleblock_small' && ent.type !== 'appleblock_big') {
                        game.audio.play('break');
                    }
                    if (game.player) {
                        game.player.requestScreenShake = Math.max(game.player.requestScreenShake || 0, 12);
                    }
                } else if (((typeof Slime !== 'undefined' && ent instanceof Slime) || ent.type === 'obj_slime') &&
                    ent.state !== 'dead' && ent.state !== 'piledriver_die' && ent.state !== 'held' && ent.state !== 'kicked') {
                    ent.kill(game, kickDir, this.vx);
                }
            }
        }
        
        // AABB with solid platforms
        for (let ent of game.entities) {
            if (ent === this || ent.isDestroyed || ent.isSolid === false || ent.isCutoff || ent.type === 'obj_cutoff' || ent.type === 'obj_cutoffsmall' || ent.type === 'cutoff' || ent.type === 'hallway' || ent.type === 'hallwayvertical' || ent.type === 'door' || ent.type.startsWith('targetDoor') || ent.type === 'tutorialbook' || ent.type === 'obj_collect' || ent.type === 'obj_bigcollect' || ent.type === 'obj_slime' || ent.type === 'obj_baddiespawner' || ent.type === 'obj_splatter' || ent.type === 'ladder' || ent.type === 'tile' || ent.type === 'oneway' || ent.type === 'left-up' || ent.type === 'right-up') continue;
            
            if (this.x < ent.x + ent.width &&
                this.x + this.width > ent.x &&
                this.y < ent.y + ent.height &&
                this.y + this.height > ent.y) {
                
                // 실제 수직 벽(벽 윗면이 발보다 14px 이상 높음)인 경우에만 벽 충돌로 판정 (슬로프에서 바닥으로 착지할 때 바닥을 벽으로 오인 방지)
                if (ent.y < this.y + this.height - 14 && this.y < ent.y + ent.height - 10) {
                    hitWall = true;
                    hitWallEnt = ent;
                }
            }
        }
        
        const hitRightRoomBound = (game.roomWidth > 0 && this.x + this.width > game.roomWidth);
        if (hitWall || hitRightRoomBound) {
            if (this.state === 'kicked') {
                this.state = 'dead';
                if (game.audio && game.audio.play) game.audio.play('break');
                
                game.player.requestScreenShake = 20; // Strong screen shake on wall crash!
                this.awardKillScore(game);
                
                // Bounce dead body off the wall
                this.vx = -10 * this.facingDir;
                this.vy = -10;
                
                // Spawn splatter on the wall
                let oldVx = 10 * this.facingDir;
                let wallX = oldVx > 0 ? this.x + this.width + 50 : this.x - 50;
                game.entities.push(new Splatter(wallX, this.y + this.height/2, hitWallEnt)); // Wall splatter
                return;
            } else if (this.state === 'walk') {
                this.vx *= -1; // Turn around
                this.facingDir = Math.sign(this.vx);
            } else {
                this.vx *= -1; // Bounce off wall while stunned
                this.squashTimer = 18;
                this.maxSquashTimer = 18;
            }
            this.x += this.vx; // step out of wall
        }
        
        // Vertical movement & collision
        this.y += this.vy;
        this.isGrounded = false;
        
        for (let ent of game.entities) {
            if (ent === this || ent.isDestroyed || ent.isSolid === false || ent.isCutoff || ent.type === 'obj_cutoff' || ent.type === 'obj_cutoffsmall' || ent.type === 'cutoff' || ent.type === 'hallway' || ent.type === 'hallwayvertical' || ent.type === 'door' || ent.type.startsWith('targetDoor') || ent.type === 'tutorialbook' || ent.type === 'obj_collect' || ent.type === 'obj_bigcollect' || ent.type === 'obj_slime' || ent.type === 'obj_baddiespawner' || ent.type === 'obj_splatter' || ent.type === 'ladder' || ent.type === 'tile' || ent.type === 'left-up' || ent.type === 'right-up') continue;
            // Handle oneway
            if (ent.type === 'oneway' && this.vy < 0) continue;
            
            if (this.x < ent.x + ent.width &&
                this.x + this.width > ent.x &&
                this.y < ent.y + ent.height &&
                this.y + this.height > ent.y) {
                
                if (this.vy > 0) { // Landing
                    if (ent.type === 'oneway') {
                        if (this.y - this.vy + this.height <= ent.y + 10) {
                            this.y = ent.y - this.height;
                            this.vy = 0;
                            this.isGrounded = true;
                        }
                    } else {
                        this.y = ent.y - this.height;
                        this.vy = 0;
                        this.isGrounded = true;
                    }
                } else if (this.vy < 0 && ent.type !== 'oneway') { // Hit ceiling
                    this.y = ent.y + ent.height;
                    this.vy = 0;
                }
            }
        }
        
        // Collision Resolution Pass 2: Slopes
        for (let ent of game.entities) {
            if (ent.isDestroyed) continue;
            if (ent.type === 'left-up' || ent.type === 'right-up') {
                if (this.vy < 0) continue;
                
                const slopeY = Physics.getSlopeHeight(this, ent);
                const snapUp = this.wasGrounded ? 32 : 6;
                const slopeThickness = Math.max(48, (this.vy || 0) + 12);
                const slopeBottom = ent.y + ent.height;
                
                if (slopeY !== null && this.y + this.height > slopeY - snapUp && this.y + this.height <= slopeY + slopeThickness && this.y + this.height <= slopeBottom + 16) {
                    if (this.isGrounded && this.y + this.height < slopeY - 0.1) {
                        continue;
                    }
                    this.y = slopeY - this.height;
                    this.vy = 0;
                    this.isGrounded = true;
                }
            }
        }
        
        // Ledge detection (슬로프 하강 및 바닥 연결부 인식 지원)
        if (this.isGrounded && this.state === 'walk') {
            let hasFloorAhead = false;
            let probeX = (this.vx > 0) ? this.x + this.width + 5 : this.x - 5;
            const feetY = this.y + this.height;

            for (let ent of game.entities) {
                if (ent === this || ent.isDestroyed || ent.isSolid === false || ent.isCutoff || ent.type === 'obj_cutoff' || ent.type === 'obj_cutoffsmall' || ent.type === 'cutoff' || ent.type === 'hallway' || ent.type === 'hallwayvertical' || ent.type === 'door' || ent.type.startsWith('targetDoor') || ent.type === 'tutorialbook' || ent.type === 'obj_collect' || ent.type === 'obj_bigcollect' || ent.type === 'obj_slime' || ent.type === 'obj_baddiespawner' || ent.type === 'obj_splatter' || ent.type === 'ladder' || ent.type === 'tile') continue;
                
                if (probeX >= ent.x && probeX <= ent.x + ent.width) {
                    if (ent.type === 'left-up' || ent.type === 'right-up') {
                        const sY = Physics.getSlopeHeight({ x: probeX - 16, width: 32 }, ent);
                        if (sY !== null && Math.abs(sY - feetY) <= 40) {
                            hasFloorAhead = true;
                            break;
                        }
                    } else {
                        // 일반 플랫폼 바닥 (슬로프에서 평지 바닥으로 내려올 때 최대 35px 낙차 허용)
                        if (ent.y <= feetY + 35 && ent.y + ent.height >= feetY - 10) {
                            hasFloorAhead = true;
                            break;
                        }
                    }
                }
            }
            if (!hasFloorAhead) {
                this.vx *= -1;
                this.facingDir = Math.sign(this.vx) || 1;
                this.x += this.vx * 2;
            }
        }
        
        // Collision with player
        if (this.state !== 'dead' && this.hitCooldown <= 0 &&
            this.x < game.player.x + game.player.width &&
            this.x + this.width > game.player.x &&
            this.y < game.player.y + game.player.height &&
            this.y + this.height > game.player.y) {
            
            const p = game.player;
            
            if (p.isSuplexGrabbing && !p.isHoldingEnemy) {
                this.state = 'held';
                p.isHoldingEnemy = true;
                p.heldEnemy = this;
                p.isSuplexGrabbing = false;
                this.hitCooldown = 15;
                if (game.audio && game.audio.play) game.audio.play('sfx_enemyhit');
                return;
            }
            
            const absV = Math.abs(p.vx);
            const isMach3 = absV >= 12 || p.sprite_index.includes('mach3') || p.sprite_index === 'spr_player_mach3jump';
            const isMach1or2 = (absV >= 8 && absV < 12) || p.sprite_index.includes('mach2') || p.sprite_index.includes('suplexgrab') || p.sprite_index.includes('dash');
            const isStomp = p.vy > 0 && p.y + p.height < this.y + 20 && !p.isGroundPounding;
            const isGroundPound = p.isGroundPounding;
            
            const killCondition = isMach3 || isGroundPound;
            
            if (killCondition) {
                this.kill(game, p.facingDir || 1, p.vx);
                if (isStomp) {
                    p.vy = -10;
                    p.sprite_index = 'spr_player_jump';
                }
            } else if (isStomp) {
                // 밟힘(Stomp): 수평 넉백 없이 바닥에서 찌부(squash)되었다가 바로 통통 튀며 복원
                this.state = 'stunned';
                this.stunTimer = 22; // 밟힌 후 바로 복원
                this.squashTimer = 18;
                this.maxSquashTimer = 18;
                this.vx = 0;
                this.vy = 0;
                
                p.vy = -10;
                p.sprite_index = 'spr_player_jump';
                
                this.hitCooldown = 15;
                if (game.audio && game.audio.play) game.audio.play('sfx_enemyhit');
            } else if (isMach1or2) {
                // 마하 대시 몸통 박치기: 튕겨나갈 때도 밟힌 것처럼 찌부되었다가 바로 복원
                this.state = 'stunned';
                this.stunTimer = 35; // 튕겨나간 후 바로 복원
                this.squashTimer = 18;
                this.maxSquashTimer = 18;
                this.vy = -4;
                const knockDir = p.facingDir || 1;
                this.vx = 12 * knockDir;
                
                this.hitCooldown = 15;
                if (game.audio && game.audio.play) game.audio.play('sfx_enemyhit');
            }
        }
        
        // Kicked slime dies on walls instead (handled in wall collision)
    }

    render(ctx) {
        const isScared = this.state === 'scared';
        const isDead = this.state === 'dead' || this.state === 'piledriver_die';
        
        let drawX = this.x;
        let drawY = this.y;

        if (isDead) {
            Slime.initImages();
            const deadImg = this.deadSprite || Slime.deadImage;
            if (deadImg && deadImg.complete && deadImg.naturalWidth > 0) {
                ctx.save();
                const scaleX = (this.facingDir === -1) ? -1 : 1;
                const scaleY = this.flipY ? -1 : 1;
                ctx.translate(Math.round(drawX + this.width / 2), Math.round(drawY + this.height / 2));
                ctx.scale(scaleX, scaleY);
                ctx.drawImage(deadImg, -51, -57.5, 100, 100);
                ctx.restore();
                return;
            }
        }
        
        const useStunSprites = (this.state === 'stunned' || this.state === 'held' || this.state === 'kicked') &&
            this.stunSprites && this.stunSprites.length > 0;
        const activeSprites = useStunSprites ? this.stunSprites : this.sprites;

        if (activeSprites.length > 0) {
            // 찌부(스쿼시) 초기에는 납작한 프레임(8프레임, index 7), 복원되면서 원래 프레임 표시
            let frameIndex = Math.floor(this.image_index) % activeSprites.length;
            if (!useStunSprites && this.squashTimer > this.maxSquashTimer * 0.5) {
                frameIndex = 7;
            }
            let img = activeSprites[frameIndex];
            if (useStunSprites && !(img && img.complete && img.naturalWidth > 0) && this.sprites.length > 0) {
                img = this.sprites[Math.floor(this.image_index) % this.sprites.length];
            }
            
            if (img && img.complete && img.naturalWidth > 0) {
                ctx.save();
                
                let scaleX = (this.facingDir === -1) ? -1 : 1;
                let scaleY = 1;
                if (this.flipY) {
                    scaleY *= -1;
                }

                if (this.state === 'dead') {
                    // 사망 상태일 때만 위로 튕기며 상하 반전
                    ctx.translate(Math.round(drawX + this.width / 2), Math.round(drawY + this.height / 2));
                    ctx.scale(scaleX, -scaleY);
                    ctx.drawImage(img, -51, -57.5, 100, 100);
                } else {
                    // 평상시 / 기절 / 밟힘 및 튕겨나감 찌부 상태:
                    // 공중/튕겨나갈 때는 중심 앵커, 바닥에 있을 때는 발바닥 앵커 사용
                    const isAir = !this.isGrounded || this.state === 'kicked' || this.state === 'held';
                    const cx = Math.round(drawX + this.width / 2);
                    const cy = isAir ? Math.round(drawY + this.height / 2) : Math.round(drawY + this.height / 2 + 22.5);
                    const drawOffsetY = isAir ? -57.5 : -80;
                    ctx.translate(cx, cy);

                    let squashX = 1.0;
                    let squashY = 1.0;
                    if (this.squashTimer > 0 && this.maxSquashTimer > 0) {
                        const p = 1.0 - (this.squashTimer / this.maxSquashTimer); // 0 (충격 직후) -> 1 (복원 완료)
                        // 바로 복원: 찌부(sy=0.35, sx=1.46)된 직후 지체 없이 바로 통통 튀며 탄성 복원
                        const sy = 1.0 - 0.65 * Math.cos(p * Math.PI * 1.8) * Math.exp(-p * 3.0);
                        const sx = 1.0 + (1.0 - sy) * 0.7;
                        squashY = sy;
                        squashX = sx;
                    }

                    ctx.scale(scaleX * squashX, scaleY * squashY);
                    ctx.drawImage(img, -51, drawOffsetY, 100, 100);
                }
                
                ctx.restore();
            }
        }
    }
}

class BaddieSpawner extends Entity {
    constructor(x, y, width = 40, height = 40, baddieType = 'obj_slime', flipX = false, flipY = false) {
        super(x, y, width, height, 'transparent', flipX, flipY);
        this.type = 'obj_baddiespawner';
        this.baddieType = baddieType;
        this.spawnTimer = 60; // Initial delay
        this.spawnInterval = 60; // 5 seconds (at 60fps)
        this.currentBaddie = null;
        
        this.image = new Image();
        this.image.src = 'spr_baddiespawner.png';
        this.imageLoaded = false;
        this.image.onload = () => { this.imageLoaded = true; };
    }
    
    update(game) {
        // In Editor (Design) Mode: never spawn any baddie, reset timer and current baddie
        if (game && game.isEditorMode) {
            if (this.currentBaddie) {
                this.currentBaddie = null;
            }
            this.spawnTimer = this.spawnInterval;
            return;
        }

        // If we have spawned a baddie, check if it's dead
        if (this.currentBaddie) {
            if (this.currentBaddie.isDestroyed || this.currentBaddie.markedForDeletion || this.currentBaddie.state === 'dead') {
                this.currentBaddie = null;
                this.spawnTimer = this.spawnInterval;
            }
        } else {
            // Only spawn if near camera
            const dx = (this.x + this.width/2) - (game.camera.x + game.canvas.width/2);
            const dy = (this.y + this.height/2) - (game.camera.y + game.canvas.height/2);
            if (Math.abs(dx) > game.canvas.width || Math.abs(dy) > game.canvas.height) return;
            
            this.spawnTimer--;
            if (this.spawnTimer <= 0) {
                if (this.baddieType === 'obj_slime') {
                    const slime = new Slime(this.x, this.y, 40, 40, this.flipX, this.flipY);
                    slime.spawnedBySpawner = true;
                    game.entities.push(slime);
                    this.currentBaddie = slime;
                    
                    if (game.audio && game.audio.play) game.audio.play('jump');
                }
            }
        }
    }
    
    render(ctx) {
        ctx.save();
        if (this.flipX || this.flipY) {
            const cx = this.x + this.width / 2;
            const cy = this.y + this.height / 2;
            ctx.translate(cx, cy);
            ctx.scale(this.flipX ? -1 : 1, this.flipY ? -1 : 1);
            ctx.translate(-cx, -cy);
        }
        if (this.imageLoaded) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = '#666';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.strokeStyle = '#222';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }
        ctx.restore();
    }
}

class Splatter extends Entity {
    constructor(x, y, floorEnt = null) {
        super(x, y, 100, 100, 'transparent');
        this.type = 'obj_splatter';
        this.floorEnt = floorEnt;
        this.image = new Image();
        this.image.src = 'spr_slimeSplatter.png';
        this.imageLoaded = false;
        this.image.onload = () => { this.imageLoaded = true; };
        // Center the splatter on x, and place it exactly at y
        this.x = x - 50; 
        this.y = y - 45; // Adjust so it sits on the ground
    }
    
    update(game) {
        // Splatters just stay on the ground
    }
    
    render(ctx) {
        if (this.imageLoaded) {
            ctx.save();
            ctx.globalAlpha = 0.7; // Make it a bit transparent
            if (this.floorEnt) {
                ctx.beginPath();
                ctx.rect(this.floorEnt.x, this.floorEnt.y, this.floorEnt.width, this.floorEnt.height);
                ctx.clip();
            }
            ctx.drawImage(this.image, this.x, this.y, 100, 100);
            ctx.restore();
        }
    }
}

class PaletteDebris extends Entity {
    constructor(x, y, palIndex) {
        super(x, y, 100, 100, 'transparent');
        this.type = 'obj_debris';
        this.palIndex = palIndex;
        this.sprite = new Image();
        this.sprite.src = '이미지/spr_palettedresserdebris.png';
        this.vx = (Math.random() - 0.5) * 12;
        this.vy = -8 - Math.random() * 6;
        this.gravity = 0.5;
        this.angle = 0;
        this.rotSpeed = (Math.random() - 0.5) * 0.4;
    }

    update(game) {
        this.game = game;
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.angle += this.rotSpeed;

        const maxH = (game.roomHeight && game.roomHeight > 0) ? game.roomHeight : 2000;
        if (this.y > maxH + 200) {
            this.isDestroyed = true;
        }
    }

    render(ctx) {
        if (!this.sprite.complete || this.sprite.naturalWidth === 0) return;
        
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        ctx.rotate(this.angle);
        
        let imgToDraw = this.sprite;
        if (this.game && this.game.player && this.game.player.paletteManager) {
            imgToDraw = this.game.player.paletteManager.getTintedFrame(this.sprite, this.sprite.src, this.palIndex);
        }
        
        ctx.drawImage(imgToDraw, -this.sprite.naturalWidth/2, -this.sprite.naturalHeight/2, this.sprite.naturalWidth, this.sprite.naturalHeight);
        ctx.restore();
    }
}

class PaletteDresser extends Entity {
    constructor(x, y, width = 64, height = 64, flipX = false, flipY = false) {
        super(x, y, width, height, 'rgba(0,0,0,0)', flipX, flipY);
        this.type = 'obj_palettedresser';
        this.sprite = new Image();
        this.sprite.src = '이미지/spr_palettedresser.png';
        
        this.playerTouching = false;
        this.prevUp = false;
        this.prevDown = false;
    }

    update(game) {
        if (!game || !game.player) return;
        this.game = game;
        
        // Simple AABB collision check with player
        const touching = (
            this.x < game.player.x + game.player.width &&
            this.x + this.width > game.player.x &&
            this.y < game.player.y + game.player.height &&
            this.y + this.height > game.player.y
        );

        this.playerTouching = touching;
        
        if (touching) {
            const upPressed = game.isActionPressed ? game.isActionPressed('up') : (game.keys.actionUp || game.keys['ArrowUp']);
            const downPressed = game.isActionPressed ? game.isActionPressed('down') : (game.keys.actionDown || game.keys['ArrowDown']);
            
            if (upPressed && !this.prevUp) {
                if (game.player.paletteManager) {
                    let oldP = game.player.paletteManager.currentPalette;
                    let newP = oldP + 1;
                    if (newP > 16) newP = 1;
                    game.player.paletteManager.setPalette(newP);
                    if (game.audio) game.audio.playFile('sfx_switch', true);
                    let deb = new PaletteDebris(game.player.x + game.player.width/2 - 50, game.player.y + game.player.height/2 - 50, oldP);
                    deb.game = game;
                    game.entities.push(deb);
                }
            }
            if (downPressed && !this.prevDown) {
                if (game.player.paletteManager) {
                    let oldP = game.player.paletteManager.currentPalette;
                    let newP = oldP - 1;
                    if (newP < 1) newP = 16;
                    game.player.paletteManager.setPalette(newP);
                    if (game.audio) game.audio.playFile('sfx_switch', true);
                    let deb = new PaletteDebris(game.player.x + game.player.width/2 - 50, game.player.y + game.player.height/2 - 50, oldP);
                    deb.game = game;
                    game.entities.push(deb);
                }
            }
            
            this.prevUp = upPressed;
            this.prevDown = downPressed;
        } else {
            this.prevUp = false;
            this.prevDown = false;
        }
    }

    render(ctx) {
        ctx.save();
        if (this.flipX || this.flipY) {
            const cx = this.x + this.width / 2;
            const cy = this.y + this.height / 2;
            ctx.translate(cx, cy);
            ctx.scale(this.flipX ? -1 : 1, this.flipY ? -1 : 1);
            ctx.translate(-cx, -cy);
        }
        if (this.sprite && this.sprite.complete && this.sprite.naturalWidth > 0) {
            let imgToDraw = this.sprite;
            if (this.game && this.game.player && this.game.player.paletteManager) {
                imgToDraw = this.game.player.paletteManager.getTintedFrame(this.sprite, this.sprite.src);
            }
            // Draw at natural size, aligning the bottom to the bounding box bottom
            const drawW = this.sprite.naturalWidth;
            const drawH = this.sprite.naturalHeight;
            const drawX = this.x + (this.width - drawW) / 2;
            const drawY = this.y + this.height - drawH;
            
            ctx.drawImage(imgToDraw, drawX, drawY, drawW, drawH);
        } else {
            ctx.fillStyle = 'rgba(200, 100, 200, 0.5)';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.strokeRect(this.x, this.y, this.width, this.height);
            
            ctx.fillStyle = 'white';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText("DRESSER", this.x + this.width/2, this.y + this.height/2);
        }
        ctx.restore();

        if (this.playerTouching) {
            if (this.game && this.game.drawCreditsText) {
                let currentPal = this.game.player.paletteManager.currentPalette;
                let palName = "Palette " + currentPal;
                let palDesc = "";
                
                if (this.game.langData) {
                    if (Object.keys(this.game.langData).length === 0) {
                        palName = "Loading or Error";
                    } else if (this.game.langData["palette_" + currentPal]) {
                        palName = this.game.langData["palette_" + currentPal];
                    }
                    if (this.game.langData["palettedesc_" + currentPal]) {
                        palDesc = this.game.langData["palettedesc_" + currentPal];
                    } else if (currentPal === 1) {
                        palDesc = "The one you know and love";
                    }
                }
                
                // Pass text info to game to draw on HUD
                this.game.paletteUIActive = true;
                this.game.paletteUIName = palName;
                this.game.paletteUIDesc = palDesc;
            }
        }
    }
}

class OnlineComputer {
    constructor(x, y, w=64, h=64, flipX = false, flipY = false) {
        this.type = 'obj_computer';
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.flipX = !!flipX;
        this.flipY = !!flipY;
        this.game = null;
        this.playerTouching = false;
        
        this.sprite = new Image();
        this.sprite.src = '이미지/spr_computer.png';
        this.sprite.onerror = () => {
            if (this.sprite.src.indexOf('assets/') === -1) {
                this.sprite.src = 'assets/spr_computer.png';
            }
        };
    }

    update(game) {
        this.game = game;
        
        const player = game.player;
        if (!player) return;

        this.playerTouching = (
            player.x < this.x + this.width &&
            player.x + player.width > this.x &&
            player.y < this.y + this.height &&
            player.y + player.height > this.y
        );

        const upPressed = game.isActionPressed('up');
        if (this.playerTouching && upPressed && !this.prevUp) {
            game.toggleOnlineMenu();
        }
        
        this.prevUp = upPressed;
    }

    render(ctx) {
        ctx.save();
        if (this.flipX || this.flipY) {
            const cx = this.x + this.width / 2;
            const cy = this.y + this.height / 2;
            ctx.translate(cx, cy);
            ctx.scale(this.flipX ? -1 : 1, this.flipY ? -1 : 1);
            ctx.translate(-cx, -cy);
        }
        if (this.sprite && this.sprite.complete && this.sprite.naturalWidth > 0) {
            ctx.drawImage(this.sprite, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = 'rgba(100, 200, 100, 0.5)';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }

        if (this.game && this.game.isEditorMode) {
            ctx.strokeStyle = 'rgba(100, 255, 100, 0.8)';
            ctx.lineWidth = 1;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }
        ctx.restore();
    }
}



class RankController extends Entity {
    constructor(x = 0, y = 0, targetRank = null) {
        super(x, y, 960, 540);
        this.type = 'rankcontroller';
        this.isSolid = false;
        this.targetRank = targetRank ? targetRank.toUpperCase() : null;
        this.rank = this.targetRank || 'D';
        this.rankLocked = false;
        
        // Phase sequence:
        // 0: Initial wait before rank anim starts (5.0 sec / 300 frames)
        // 1: Playing rank animation (spr_rankC or spr_rankD)
        // 2: Delay after rank anim finishes before texts appear (1.0 sec / 60 frames)
        // 3: Line-by-line text slam with screen shake & sound
        // 4: Complete & waiting for key press to exit
        this.phase = 0;
        this.timer = 0;
        this.lookdoorFinished = false;
        
        this.imageIndex = 0;
        this.imageSpeed = 0.35;
        this.showRankAnim = false;
        this.isPurple = false;
        this.purpleFlash = 0;
        this.animFinished = false;

        this.revealedLines = 0; // Number of text lines shown so far (0 to 5)
        this.lineTimer = 0;
        this.shakeAmount = 0;
        this.shakeX = 0;
        this.shakeY = 0;

        this.canExit = false;
        this.exiting = false;

        if (RankController.recolorCache) {
            RankController.recolorCache.clear();
        }
        if (!RankController.imagesC || !RankController.imagesD || !RankController.imagesB || !RankController.imagesA) {
            RankController.reloadImages();
        }
    }

    static reloadImages() {
        const cacheBust = Date.now();
        if (RankController.recolorCache) {
            RankController.recolorCache.clear();
        }

        RankController.imagesD_normal = [];
        RankController.imagesD_purple = [];
        for (let i = 0; i <= 15; i++) {
            const nImg = new Image();
            nImg.src = `player/spr_rankD/spr_rankD_${i}.png?v=${cacheBust}`;
            RankController.imagesD_normal.push(nImg);
            const pImg = new Image();
            pImg.src = `player/spr_rankD_purple/spr_rankD_${i}.png?v=${cacheBust}`;
            RankController.imagesD_purple.push(pImg);
        }
        RankController.imagesD = RankController.imagesD_purple;
        RankController.images = RankController.imagesD;

        RankController.imagesC_normal = [];
        RankController.imagesC_purple = [];
        for (let i = 1; i <= 16; i++) {
            const nImg = new Image();
            nImg.src = `player/spr_rankC/spr_rankC${i}.png?v=${cacheBust}`;
            RankController.imagesC_normal.push(nImg);
            const pImg = new Image();
            pImg.src = `player/spr_rankC_purple/spr_rankC${i}.png?v=${cacheBust}`;
            RankController.imagesC_purple.push(pImg);
        }
        RankController.imagesC = RankController.imagesC_purple;

        RankController.imagesB_normal = [];
        RankController.imagesB_purple = [];
        for (let i = 1; i <= 16; i++) {
            const nImg = new Image();
            nImg.src = `player/spr_rankB/spr_rankB${i}.png?v=${cacheBust}`;
            RankController.imagesB_normal.push(nImg);
            const pImg = new Image();
            pImg.src = `player/spr_rankB_purple/spr_rankB${i}.png?v=${cacheBust}`;
            RankController.imagesB_purple.push(pImg);
        }
        RankController.imagesB = RankController.imagesB_purple;

        RankController.imagesA_normal = [];
        RankController.imagesA_purple = [];
        for (let i = 1; i <= 16; i++) {
            const nImg = new Image();
            nImg.src = `player/spr_rankA/spr_rankA${i}.png?v=${cacheBust}`;
            RankController.imagesA_normal.push(nImg);
            const pImg = new Image();
            pImg.src = `player/spr_rankA_purple/spr_rankA${i}.png?v=${cacheBust}`;
            RankController.imagesA_purple.push(pImg);
        }
        RankController.imagesA = RankController.imagesA_purple;

        RankController.imagesS = [];
        for (let i = 1; i <= 16; i++) {
            const img = new Image();
            img.src = `player/spr_rankS/spr_rankS${i}.png?v=${cacheBust}`;
            RankController.imagesS.push(img);
        }

        RankController.imagesP = [];
        for (let i = 1; i <= 16; i++) {
            const img = new Image();
            img.src = `player/spr_rankP/spr_rankP${i}.png?v=${cacheBust}`;
            RankController.imagesP.push(img);
        }
    }

    static getValidImages(arr) {
        if (!arr) return [];
        return arr.filter(img => img && img.complete && img.naturalWidth > 0);
    }

    static recolorRankFrame(img) {
        if (!img || !img.complete || img.naturalWidth <= 0) return img;
        if (img.src && img.src.includes('_purple')) {
            return img;
        }
        if (!RankController.recolorCache) {
            RankController.recolorCache = new Map();
        }
        if (RankController.recolorCache.has(img.src)) {
            return RankController.recolorCache.get(img.src);
        }

        try {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imgData.data;

            // 결과 화면 색상 팔레트:
            // 검정색 아닌 건 보라색: rgb(152, 80, 248) -> #9850f8
            // 검정색인 건 진한 보라색: rgb(80, 0, 184) -> #5000b8
            const PURPLE_R = 152;
            const PURPLE_G = 80;
            const PURPLE_B = 248;

            const DARK_R = 80;
            const DARK_G = 0;
            const DARK_B = 184;

            for (let i = 0; i < data.length; i += 4) {
                const a = data[i + 3];
                if (a < 15) continue;

                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];

                // 휘도 계산 (0 ~ 255)
                const lum = 0.299 * r + 0.587 * g + 0.114 * b;

                if (lum <= 35) {
                    data[i] = DARK_R;
                    data[i + 1] = DARK_G;
                    data[i + 2] = DARK_B;
                } else if (lum >= 75) {
                    data[i] = PURPLE_R;
                    data[i + 1] = PURPLE_G;
                    data[i + 2] = PURPLE_B;
                } else {
                    const t = (lum - 35) / (75 - 35);
                    data[i] = Math.round(DARK_R + (PURPLE_R - DARK_R) * t);
                    data[i + 1] = Math.round(DARK_G + (PURPLE_G - DARK_G) * t);
                    data[i + 2] = Math.round(DARK_B + (PURPLE_B - DARK_B) * t);
                }
            }

            ctx.putImageData(imgData, 0, 0);
            RankController.recolorCache.set(img.src, canvas);
            return canvas;
        } catch (e) {
            console.warn('Rank frame recolor error (using fallback):', e);
            try {
                const fbCanvas = document.createElement('canvas');
                fbCanvas.width = img.naturalWidth;
                fbCanvas.height = img.naturalHeight;
                const fbCtx = fbCanvas.getContext('2d');
                fbCtx.drawImage(img, 0, 0);
                fbCtx.globalCompositeOperation = 'source-in';
                fbCtx.fillStyle = '#5000b8';
                fbCtx.fillRect(0, 0, fbCanvas.width, fbCanvas.height);
                RankController.recolorCache.set(img.src, fbCanvas);
                return fbCanvas;
            } catch (e2) {
                return img;
            }
        }
    }

    restart(targetRank = null) {
        RankController.reloadImages();
        if (targetRank) {
            this.targetRank = targetRank.toUpperCase();
            this.rank = this.targetRank;
        } else {
            this.targetRank = null;
            this.rank = this.getRank(window.gameInstance);
        }
        this.rankLocked = true;
        this.phase = 0;
        this.timer = 0;
        this.lookdoorFinished = false;
        this.imageIndex = 0;
        this.showRankAnim = false;
        this.animFinished = false;
        this.revealedLines = 0;
        this.lineTimer = 0;
        this.shakeAmount = 0;
        this.shakeX = 0;
        this.shakeY = 0;
        this.canExit = false;
        this.exiting = false;

        const game = window.gameInstance;
        if (game) {
            game.transitionAlpha = 0;
            game.transitionState = 'NONE';
            game.roomBackground = '#ffffff';
        }
        if (game && game.player) {
            game.player.visible = true;
            game.player.state = 'rank';
            game.player.sprite_index = 'spr_player_lookdoor';
            game.player.image_index = 0;
            game.player.x = 465;
            game.player.y = 255;
            game.player.vx = 0;
            game.player.vy = 0;
            game.player.isGrounded = true;
        }
    }

    getRank(game) {
        if (this.targetRank) return this.targetRank;
        const raw = (game && (game.forceRank || game.clearedRank)) || (game && typeof game.getCurrentRank === 'function' ? game.getCurrentRank() : 'D');
        const upper = (raw || 'D').toUpperCase();
        if (upper === 'P' && RankController.getValidImages(RankController.imagesP).length > 0) return 'P';
        if (upper === 'S' && RankController.getValidImages(RankController.imagesS).length > 0) return 'S';
        if (upper === 'A' && RankController.getValidImages(RankController.imagesA).length > 0) return 'A';
        if (upper === 'B' && RankController.getValidImages(RankController.imagesB).length > 0) return 'B';
        if (upper === 'C' && RankController.getValidImages(RankController.imagesC).length > 0) return 'C';
        if (upper === 'B' || upper === 'A' || upper === 'S' || upper === 'P') {
            if (RankController.getValidImages(RankController.imagesC).length > 0) return 'C';
        }
        return 'D';
    }

    getRankImages(usePurple = false) {
        const r = (this.rank || 'D').toUpperCase();
        if (r === 'P' || r === 'S') {
            const pPool = (r === "P") ? RankController.imagesP : RankController.imagesS;
            const valid = RankController.getValidImages(pPool);
            if (valid.length > 0) return valid;
        }
        let targetPool = null;
        let fallbackPool = null;
        if (r === 'A') {
            targetPool = usePurple ? RankController.imagesA_purple : RankController.imagesA_normal;
            fallbackPool = usePurple ? RankController.imagesA_normal : RankController.imagesA_purple;
        } else if (r === 'B') {
            targetPool = usePurple ? RankController.imagesB_purple : RankController.imagesB_normal;
            fallbackPool = usePurple ? RankController.imagesB_normal : RankController.imagesB_purple;
        } else if (r === 'C') {
            targetPool = usePurple ? RankController.imagesC_purple : RankController.imagesC_normal;
            fallbackPool = usePurple ? RankController.imagesC_normal : RankController.imagesC_purple;
        } else {
            targetPool = usePurple ? RankController.imagesD_purple : RankController.imagesD_normal;
            fallbackPool = usePurple ? RankController.imagesD_normal : RankController.imagesD_purple;
        }
        const validTarget = RankController.getValidImages(targetPool);
        if (validTarget.length > 0) return validTarget;
        const validFallback = RankController.getValidImages(fallbackPool);
        if (validFallback.length > 0) return validFallback;
        return RankController.getValidImages(RankController.imagesD_purple) || [];
    }

    getStats(game) {
        const score = (game && game.lastStageScore !== undefined) ? game.lastStageScore : ((game && game.score !== undefined) ? game.score : 0);
        const totalSec = (game && game.stageSeconds !== undefined && game.stageSeconds > 0) ? game.stageSeconds : 15.54;
        
        const hours = Math.floor(totalSec / 3600);
        const mins = Math.floor((totalSec % 3600) / 60);
        const secs = Math.floor(totalSec % 60);
        const ms = Math.floor((totalSec % 1) * 100);
        
        const pad = (n) => String(n).padStart(2, '0');
        const timeStr = `${pad(hours)}:${pad(mins)}:${pad(secs)}:${pad(ms)}`;
        
        const damage = (game && game.stageDamage !== undefined) ? game.stageDamage : 0;
        const highestCombo = (game && game.highestCombo !== undefined) ? game.highestCombo : ((game && game.combo) || 3);

        return [
            `SCORE: ${score}`,
            `TIME: ${timeStr}`,
            `DAMAGE: ${damage}`,
            `HIGHEST COMBO: ${highestCombo}`,
            `BUDDY TAXED!!!`
        ];
    }

    update(game) {
        if (!game) game = window.gameInstance;
        const player = game ? game.player : null;
        if (game && game.isEditorMode) return;

        // Screen shake decay
        if (this.shakeAmount > 0.1) {
            this.shakeX = (Math.random() - 0.5) * 2 * this.shakeAmount;
            this.shakeY = (Math.random() - 0.5) * 2 * this.shakeAmount;
            this.shakeAmount *= 0.85;
        } else {
            this.shakeAmount = 0;
            this.shakeX = 0;
            this.shakeY = 0;
        }

        // Determine player rank from game state if not manually locked
        if (!this.rankLocked && game) {
            this.rank = this.getRank(game);
            this.rankLocked = true;
        }

        // Keep player centered, grounded and in rank state (with lookdoor sprite)
        if (player) {
            player.state = 'rank';
            player.x = 465;
            player.y = 255;
            player.vx = 0;
            player.vy = 0;
            player.isGrounded = true;
            player.sprite_index = 'spr_player_lookdoor';
            player.visible = !this.showRankAnim;
        }

        // Phase 0: Lookdoor animation plays completely, then rank slam starts after 5 seconds (300 frames)
        if (this.phase === 0) {
            this.timer++;

            const maxLookFrames = (player && player.sprites && player.sprites.spr_player_lookdoor && player.sprites.spr_player_lookdoor.length) || 10;
            if (player && player.image_index >= maxLookFrames - 1) {
                player.image_index = maxLookFrames - 1;
                this.lookdoorFinished = true;
            }

            const skip = game && game.keys && (game.keys.actionJump || game.keys.actionAttack || game.keys[' '] || game.keys['Enter'] || game.keys['z'] || game.keys['x']);
            // 5초(300 프레임) 대기 또는 키 입력 시 풀컬러 랭크 애니메이션 시작!
            if (this.timer >= 300 || (this.timer > 30 && skip)) {
                this.phase = 1;
                this.timer = 0;
                this.showRankAnim = true;
                this.isPurple = false; // 처음에는 흰색 배경에 원래 풀컬러 스프라이트!
                this.imageIndex = 0;
                if (game) game.roomBackground = '#ffffff';
                if (game && game.audio) {
                    game.audio.playFile('sfx_step', true);
                }
            }
        }
        // Phase 1: 원래 풀컬러로 랭크 애니메이션 재생
        else if (this.phase === 1) {
            const skip = game && game.keys && (game.keys.actionJump || game.keys.actionAttack || game.keys[' '] || game.keys['Enter'] || game.keys['z'] || game.keys['x']);
            const rankImgs = this.getRankImages(false);
            const maxIdx = rankImgs ? Math.max(0, rankImgs.length - 1) : 0;
            this.imageIndex += this.imageSpeed;
            if (this.imageIndex >= maxIdx || (skip && this.imageIndex > 1)) {
                this.imageIndex = maxIdx;
                this.animFinished = true;
                this.phase = 2;
                this.timer = 0;
                this.shakeAmount = 6;
                if (game && game.audio) {
                    game.audio.playFile('sfx_step', true);
                }
            }
        }
        // Phase 2: 마지막 포즈 유지 후, 몇 초 뒤 쿙! 보라색으로 변환 & 점수 슬램 준비!
        else if (this.phase === 2) {
            this.timer++;
            const skip = game && game.keys && (game.keys.actionJump || game.keys.actionAttack || game.keys[' '] || game.keys['Enter'] || game.keys['z'] || game.keys['x']);
            // 몇 초 뒤(90프레임 ~ 1.5초 또는 스킵 키) 보라색 극적 전환!
            if (this.timer >= 90 || (this.timer > 15 && skip)) {
                this.phase = 3;
                this.timer = 0;
                this.isPurple = true; // 화면과 랭크 스프라이트가 보라색으로 변환!
                this.purpleFlash = 8; // 번쩍이는 플래시 효과
                this.shakeAmount = 14;
                this.revealedLines = 0;
                this.lineTimer = 0;
                if (game) game.roomBackground = '#9850f8';
                if (game && game.audio) {
                    game.audio.playFile('sfx_step', true);
                }
            }
        }
        // Phase 3: Text line by line slam with screen shake & sound
        else if (this.phase === 3) {
            this.lineTimer++;
            const totalLines = 5;
            // Reveal a new line every 24 frames (~0.4s)
            if (this.lineTimer >= 24 && this.revealedLines < totalLines) {
                this.lineTimer = 0;
                this.revealedLines++;
                // Strong shake for each slammed line
                this.shakeAmount = (this.revealedLines === totalLines) ? 18 : 12;
                if (game && game.audio) {
                    const snd = (this.revealedLines === totalLines) ? 'sfx_break' : 'sfx_step';
                    game.audio.playFile(snd, true);
                }
                if (this.revealedLines >= totalLines) {
                    this.phase = 4;
                    this.timer = 0;
                }
            }
        }
        // Phase 4: Ready to exit on any key
        else if (this.phase === 4) {
            this.timer++;
            if (this.timer > 30) {
                this.canExit = true;
            }

            if (this.canExit && !this.exiting && game && (!game.debugConsole || !game.debugConsole.open)) {
                const anyKeyPressed = game.keys.actionJump || game.keys.actionTaunt || 
                                      game.keys.actionGroundpound || game.keys.actionUp || 
                                      game.keys.actionDown || game.keys.actionLeft || 
                                      game.keys.actionRight || game.keys.actionAttack ||
                                      game.keys[' '] || game.keys['Enter'] || game.keys['z'] || game.keys['x'] || game.keys['c'];
                if (anyKeyPressed) {
                    this.exiting = true;
                    if (game.audio) {
                        game.audio.playFile('sfx_step', true);
                    }
                    if (player) {
                        player.state = 'walkfront';
                        player.visible = true;
                    }
                    const hubRoom = game.hub_room || 'demo_hub';
                    if (typeof game.resetScoreAndToppins === 'function') {
                        game.resetScoreAndToppins();
                    } else {
                        game.score = 0;
                        game.toppins = [];
                        game.playerTrail = [];
                    }
                    game.transitionState = 'FADE_OUT';
                    game.transitionTimer = 0;
                    game.pendingRoom = hubRoom;
                    game.pendingDoor = 'A';
                    game.pendingPreserveVelocity = false;
                    game.isExitingLevelGate = true;
                }
            }
        }
    }

    render(ctx) {
        const game = window.gameInstance;
        const w = (game && game.canvas) ? game.canvas.width : 960;
        const h = (game && game.canvas) ? game.canvas.height : 540;

        if (game && game.isEditorMode) {
            ctx.save();
            ctx.fillStyle = 'rgba(255, 100, 100, 0.4)';
            ctx.fillRect(this.x, this.y, 64, 64);
            ctx.strokeStyle = '#ff4444';
            ctx.strokeRect(this.x, this.y, 64, 64);
            ctx.font = 'bold 12px Arial';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.fillText('RANK', this.x + 32, this.y + 36);
            ctx.restore();
            return;
        }

        ctx.save();
        if (game && game.camera) {
            ctx.translate(game.camera.x, game.camera.y);
        }

        // Apply screen shake offset
        ctx.translate(this.shakeX, this.shakeY);

        // 1. Background (보라색 전환 전에는 흰색 #ffffff, 몇 초 뒤 보라색 #9850f8)
        if (this.isPurple) {
            ctx.fillStyle = '#9850f8';
            ctx.fillRect(0, 0, w, h);
        } else {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, w, h);
        }

        // 2. Rank Animation (처음에는 풀컬러 스프라이트, 몇 초 뒤 보라색 2톤 스프라이트)
        if (this.showRankAnim) {
            const rankImgs = this.getRankImages(this.isPurple);
            if (rankImgs && rankImgs.length > 0) {
                const idx = Math.min(rankImgs.length - 1, Math.floor(this.imageIndex));
                const img = rankImgs[idx];
                if (img && img.complete && img.naturalWidth > 0) {
                    const finalImg = this.isPurple ? RankController.recolorRankFrame(img) : img;
                    ctx.drawImage(finalImg, 0, 0, w, h);
                }
            }
        }

        // 보라색 전환 시 순간적인 플래시 효과
        if (this.purpleFlash > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${this.purpleFlash / 8})`;
            ctx.fillRect(0, 0, w, h);
            this.purpleFlash--;
        }

        // 3. Sequential Text Lines (보라색 전환 후 점수도 차례차례 슬램!)
        if (this.isPurple && this.revealedLines > 0) {
            const lines = this.getStats(game);
            const startX = 50;
            const startY = 60;
            const lineHeight = 40;

            for (let i = 0; i < this.revealedLines && i < lines.length; i++) {
                const text = lines[i];
                const lineY = startY + i * lineHeight;

                if (game && typeof game.drawBigFontText === 'function') {
                    game.drawBigFontText(ctx, text, startX, lineY, 1, false, false);
                } else {
                    ctx.font = '900 32px "Impact", "Outfit", sans-serif';
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'top';
                    ctx.strokeStyle = '#000000';
                    ctx.lineWidth = 7;
                    ctx.strokeText(text, startX, lineY);
                    ctx.fillStyle = '#ffffff';
                    ctx.fillText(text, startX, lineY);
                }
            }
        }

        // 4. Blinking prompt when can exit
        if (this.canExit) {
            const blink = Math.sin(Date.now() / 200) > 0;
            if (blink) {
                if (game && typeof game.drawBigFontText === 'function') {
                    game.drawBigFontText(ctx, 'PRESS ANY KEY TO CONTINUE', w / 2, h - 45, 0.65, true, false);
                } else {
                    ctx.fillStyle = '#000000';
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 3;
                    ctx.font = 'bold 22px "Outfit", sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'bottom';
                    ctx.strokeText('PRESS ANY KEY TO CONTINUE', w / 2, h - 25);
                    ctx.fillText('PRESS ANY KEY TO CONTINUE', w / 2, h - 25);
                }
            }
        }
        ctx.restore();
    }
}
