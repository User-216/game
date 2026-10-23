

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
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
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

    destroy() {
        if (this.isDestroyed) return;
        this.isDestroyed = true;
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
        this.isDestroyed = true;

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
        if (!g || !g.entities) return;

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
                        ent.type === 'platform' || ent.type === 'metal' || ent.type === 'destroyable' || ent.type === 'solid' || ent.type === 'slope' || ent.type === 'slope-left' || ent.type === 'slope-right') {
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
                            g.entities.push(new Cutoff(cx, cy, 64, 64, 'top', '64x64'));
                        }
                    } else {
                        if (topSolid0 && !hasCutoffAt(cx, cy, 'top')) {
                            g.entities.push(new Cutoff(cx, cy, 32, 64, 'top', '32x32', Math.floor(Math.random() * 6)));
                        }
                        if (topSolid1 && !hasCutoffAt(cx + 32, cy, 'top')) {
                            g.entities.push(new Cutoff(cx + 32, cy, 32, 64, 'top', '32x32', Math.floor(Math.random() * 6)));
                        }
                    }

                    // BOTTOM:
                    const botSolid0 = shouldSpawnCutoff(cx + 16, cy + 64 + 16);
                    const botSolid1 = shouldSpawnCutoff(cx + 48, cy + 64 + 16);
                    if (botSolid0 && botSolid1) {
                        if (!hasCutoffAt(cx, cy + 64, 'bottom')) {
                            g.entities.push(new Cutoff(cx, cy + 64, 64, 64, 'bottom', '64x64'));
                        }
                    } else {
                        if (botSolid0 && !hasCutoffAt(cx, cy + 64, 'bottom')) {
                            g.entities.push(new Cutoff(cx, cy + 64, 32, 64, 'bottom', '32x32', Math.floor(Math.random() * 6)));
                        }
                        if (botSolid1 && !hasCutoffAt(cx + 32, cy + 64, 'bottom')) {
                            g.entities.push(new Cutoff(cx + 32, cy + 64, 32, 64, 'bottom', '32x32', Math.floor(Math.random() * 6)));
                        }
                    }

                    // LEFT:
                    const leftSolid0 = shouldSpawnCutoff(cx - 16, cy + 16);
                    const leftSolid1 = shouldSpawnCutoff(cx - 16, cy + 48);
                    if (leftSolid0 && leftSolid1) {
                        if (!hasCutoffAt(cx, cy, 'left')) {
                            g.entities.push(new Cutoff(cx, cy, 64, 64, 'left', '64x64'));
                        }
                    } else {
                        if (leftSolid0 && !hasCutoffAt(cx, cy, 'left')) {
                            g.entities.push(new Cutoff(cx, cy, 64, 32, 'left', '32x32', Math.floor(Math.random() * 6)));
                        }
                        if (leftSolid1 && !hasCutoffAt(cx, cy + 32, 'left')) {
                            g.entities.push(new Cutoff(cx, cy + 32, 64, 32, 'left', '32x32', Math.floor(Math.random() * 6)));
                        }
                    }

                    // RIGHT:
                    const rightSolid0 = shouldSpawnCutoff(cx + 64 + 16, cy + 16);
                    const rightSolid1 = shouldSpawnCutoff(cx + 64 + 16, cy + 48);
                    if (rightSolid0 && rightSolid1) {
                        if (!hasCutoffAt(cx + 64, cy, 'right')) {
                            g.entities.push(new Cutoff(cx + 64, cy, 64, 64, 'right', '64x64'));
                        }
                    } else {
                        if (rightSolid0 && !hasCutoffAt(cx + 64, cy, 'right')) {
                            g.entities.push(new Cutoff(cx + 64, cy, 64, 32, 'right', '32x32', Math.floor(Math.random() * 6)));
                        }
                        if (rightSolid1 && !hasCutoffAt(cx + 64, cy + 32, 'right')) {
                            g.entities.push(new Cutoff(cx + 64, cy + 32, 64, 32, 'right', '32x32', Math.floor(Math.random() * 6)));
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
                        g.entities.push(new Cutoff(cx, cy, 32, 64, 'top', '32x32', Math.floor(Math.random() * 6)));
                    }
                    // BOTTOM:
                    if (shouldSpawnCutoff(cx + 16, cy + 32 + 16) && !hasCutoffAt(cx, cy + 32, 'bottom')) {
                        g.entities.push(new Cutoff(cx, cy + 32, 32, 64, 'bottom', '32x32', Math.floor(Math.random() * 6)));
                    }
                    // LEFT:
                    if (shouldSpawnCutoff(cx - 16, cy + 16) && !hasCutoffAt(cx, cy, 'left')) {
                        g.entities.push(new Cutoff(cx, cy, 64, 32, 'left', '32x32', Math.floor(Math.random() * 6)));
                    }
                    // RIGHT:
                    if (shouldSpawnCutoff(cx + 32 + 16, cy + 16) && !hasCutoffAt(cx + 32, cy, 'right')) {
                        g.entities.push(new Cutoff(cx + 32, cy, 64, 32, 'right', '32x32', Math.floor(Math.random() * 6)));
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
        this.isDestroyed = true;

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

        const isCollisionVisible = !!(window.gameInstance && (window.gameInstance.showCollisions || window.gameInstance.isEditorMode));
        if (isCollisionVisible && window.gameInstance && window.gameInstance.isEditorMode) {
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 100, 100, 0.8)';
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 2]);
            ctx.strokeRect(this.x, this.y, this.width, this.height);
            ctx.restore();
        }
    }
}

// Global aliases for obj_cutoff
window.Cutoff = Cutoff;
window.obj_cutoff = Cutoff;
window.obj_cutoffsmall = Cutoff;

class Pillar extends Destroyable {
    constructor(x, y, width = 128, height = 224, flipX = false, flipY = false) {
        super(x, y, width, height, '#b88958', flipX, flipY);
        this.type = 'pillar';
        this.isPillar = true;
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
        if (g) {
            // Activate Escape Sequence!
            g.escape = true;
            
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

        // Generate debris chunks
        const debrisColors = ['#d2b991', '#a88c69', '#735a41', '#4b3726', '#e6d2af'];
        for (let i = 0; i < 45; i++) {
            this.particles.push({
                x: this.x + Math.random() * this.width,
                y: this.y + Math.random() * this.height,
                vx: (Math.random() - 0.5) * 16,
                vy: (Math.random() - 0.7) * 16,
                size: Math.random() * 8 + 4,
                life: 1.0,
                decay: Math.random() * 0.02 + 0.01,
                color: debrisColors[Math.floor(Math.random() * debrisColors.length)]
            });
        }
        // Flying larger chunks
        for (let i = 0; i < 8; i++) {
            this.debrisList.push({
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                vx: (Math.random() - 0.5) * 14,
                vy: (Math.random() - 0.8) * 18,
                angle: Math.random() * Math.PI * 2,
                vrot: (Math.random() - 0.5) * 0.3,
                size: Math.random() * 16 + 16,
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
                ctx.drawImage(frameImg, this.x, this.y, this.width, this.height);
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

        // Debris chunks
        const dImg = Pillar.debrisImage;
        this.debrisList.forEach((d, index) => {
            d.x += d.vx;
            d.y += d.vy;
            d.vy += 0.4;
            d.angle += d.vrot;
            d.alpha -= d.decay;
            if (d.alpha <= 0) {
                this.debrisList.splice(index, 1);
            } else {
                ctx.save();
                ctx.globalAlpha = Math.max(0, d.alpha);
                ctx.translate(d.x, d.y);
                ctx.rotate(d.angle);
                if (dImg && dImg.complete && dImg.naturalWidth > 0) {
                    ctx.drawImage(dImg, -d.size / 2, -d.size / 2, d.size, d.size);
                } else {
                    ctx.fillStyle = '#a88c69';
                    ctx.fillRect(-d.size / 2, -d.size / 2, d.size, d.size);
                }
                ctx.restore();
            }
        });

        ctx.globalAlpha = 1.0;
    }
}
Pillar.initImages();


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



class LevelGate extends Entity {
    static gateImages = [];
    static gateBGImages = [];
    static gateMaskImages = [];
    static titleCardImages = {};
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

    constructor(x, y, width = 192, height = 288, targetRoom = 'tutorial_1', targetDoor = 'A', titleCardImage = '0', titleCardText = '', gateIndex = 0, color = 'rgba(192, 57, 43, 0.8)', flipX = false, flipY = false) {
        super(x, y, width, height, color, flipX, flipY);
        this.targetRoom = targetRoom || 'tutorial_1';
        this.targetDoor = targetDoor || 'A';
        this.titleCardImage = (titleCardImage !== undefined && titleCardImage !== null) ? String(titleCardImage).trim() : '0';
        this.titleCardText = titleCardText || '';
        
        let gIdx = parseInt(gateIndex, 10);
        if (isNaN(gIdx) || gIdx < 0 || gIdx > 2) {
            const num = parseInt(this.titleCardImage, 10);
            gIdx = (!isNaN(num) && num >= 0 && num <= 2) ? num : 0;
        }
        this.gateIndex = gIdx;

        this.type = 'levelgate';
        this.isSolid = false;
        this.bgScrollX = 0;
        this.bgScrollSpeed = 0.35; // Gentle, smooth rightward drift
        this.waveTimer = Math.random() * 10;
        this.waveSpeed = 0.035;    // Smooth gentle portal wave
        this.waveAmp = 3.5;
        this.waveFreq = 0.045;

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

        const gateIdx = (this.gateIndex >= 0 && this.gateIndex < 3) ? this.gateIndex : 0;
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

            for (let sy = 0; sy < gh; sy += sliceH) {
                if (sy < bgStartY) continue;
                const srcY = sy - bgStartY;
                if (srcY >= bgH) break;

                const curH = Math.min(sliceH, gh - sy);
                const waveX = Math.sin((sy * this.waveFreq) + this.waveTimer) * this.waveAmp;

                for (let tx = -bgW; tx < gw + bgW; tx += bgW) {
                    const drawSliceX = Math.round(tx + scrollOffset + waveX);
                    if (drawSliceX + bgW > 0 && drawSliceX < gw) {
                        bCtx.drawImage(bgImg, 0, srcY, bgW, curH, drawSliceX, sy, bgW, curH);
                    }
                }
            }

            // 1.5. Distance-based White Fade Overlay (fades to white in proportion to player distance)
            if (whiteAlpha > 0) {
                bCtx.fillStyle = `rgba(255, 255, 255, ${Math.min(1.0, whiteAlpha).toFixed(3)})`;
                bCtx.fillRect(0, bgStartY, gw, bgH);
            }

            // 2. Clip strictly to doorway using pre-generated mask image (zero leaks outside!)
            bCtx.globalCompositeOperation = 'destination-in';
            bCtx.drawImage(maskImg, 0, 0, gw, gh);
            bCtx.globalCompositeOperation = 'source-over';

            // 3. Draw Gate Foreground Archway
            bCtx.drawImage(gateImg, 0, 0, gw, gh);

            // 4. Draw Composited Gate onto main canvas (aligned to bottom of entity)
            const drawW = w;
            const drawH = h;
            const drawX = Math.round(x + (w - drawW) / 2);
            const drawY = Math.round(y + (h - drawH));

            ctx.drawImage(bCanvas, drawX, drawY, drawW, drawH);

            // 5. Level Name Banner (cleanly fitted, with badge background and auto font-scaling)
            const levelTitle = (this.titleCardText || this.targetRoom || 'LEVEL').toUpperCase();
            ctx.save();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const maxTextW = Math.round(drawW * 1.15);
            let fontSize = 13;
            ctx.font = `900 ${fontSize}px "Outfit", "Arial Black", sans-serif`;
            while (fontSize > 8 && ctx.measureText(levelTitle).width > maxTextW) {
                fontSize--;
                ctx.font = `900 ${fontSize}px "Outfit", "Arial Black", sans-serif`;
            }

            // Position neatly above gate, or inside arch if near ceiling
            const nameY = (drawY < 25) ? (drawY + 45) : (drawY - 14);
            const tw = ctx.measureText(levelTitle).width;

            // Stylish badge background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
            ctx.fillRect(drawX + drawW / 2 - tw / 2 - 6, nameY - fontSize / 2 - 3, tw + 12, fontSize + 6);
            ctx.strokeStyle = '#d4af37';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(drawX + drawW / 2 - tw / 2 - 6, nameY - fontSize / 2 - 3, tw + 12, fontSize + 6);

            // Drop shadow & main text
            ctx.fillStyle = '#000000';
            ctx.fillText(levelTitle, drawX + drawW / 2 + 1, nameY + 1);
            ctx.fillStyle = '#fff4cc';
            ctx.fillText(levelTitle, drawX + drawW / 2, nameY);
            ctx.restore();

            // 6. Save Rank Badge (if stage was cleared previously)
            const game = window.gameInstance;
            if (game && game.currentSaveSlot && game.getSaveSlotData) {
                const data = game.getSaveSlotData(game.currentSaveSlot);
                const stageInfo = data?.stages?.[this.targetRoom];
                if (stageInfo && stageInfo.cleared && stageInfo.rank) {
                    const rank = stageInfo.rank.toUpperCase();
                    const rankOrder = { 'D': 0, 'C': 1, 'B': 2, 'A': 3, 'S': 4, 'P': 5 };
                    const rankIdx = rankOrder[rank] !== undefined ? rankOrder[rank] : 0;
                    const badgeX = drawX + drawW / 2 + tw / 2 + 16;
                    const badgeY = nameY;

                    if (game.rankBubbleImages && game.rankBubbleImages[rankIdx] && game.rankBubbleImages[rankIdx].complete) {
                        ctx.drawImage(game.rankBubbleImages[rankIdx], badgeX - 14, badgeY - 14, 28, 28);
                    } else {
                        ctx.save();
                        ctx.beginPath();
                        ctx.arc(badgeX, badgeY, 12, 0, Math.PI * 2);
                        ctx.fillStyle = (rank === 'P') ? '#a020f0' : ((rank === 'S') ? '#e67e22' : ((rank === 'A') ? '#e74c3c' : '#3498db'));
                        ctx.fill();
                        ctx.lineWidth = 2;
                        ctx.strokeStyle = '#ffffff';
                        ctx.stroke();

                        ctx.fillStyle = '#ffffff';
                        ctx.font = 'bold 11px "Outfit", sans-serif';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(rank, badgeX, badgeY);
                        ctx.restore();
                    }
                }
            }

        } else {
            // Clean fallback while images load: draw gate foreground directly
            if (gateImg && gateImg.complete && gateImg.naturalWidth > 0) {
                const drawW = w;
                const drawH = h;
                const drawX = Math.round(x + (w - drawW) / 2);
                const drawY = Math.round(y + (h - drawH));
                ctx.drawImage(gateImg, drawX, drawY, drawW, drawH);
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
            ctx.fillText(`GATE ${gateIdx} -> ${this.targetRoom} [${this.targetDoor}]`, this.x + this.width / 2, this.y - 16);
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
    constructor(x, y, w = 32, h = 32, flipX = false, flipY = false) {
        super(x, y, w, h, 'transparent', flipX, flipY);
        this.type = 'obj_collect';
        this.state = 'idle'; // idle, following, collected
        this.vx = 0;
        this.vy = 0;
        this.speed = 0;
        this.baseY = y;
        this.timer = Math.random() * 100;
        this.isSolid = false;
        this.isPlatform = false;
        this.points = 10;
        this.fontSize = 14;
    }

    update(game) {
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
                this.markedForDeletion = true;
            } else {
                this.x += (dx / dist) * 20;
                this.y += (dy / dist) * 20;
            }
        }
    }

    render(ctx) {
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

class BigCollect extends Collect {
    constructor(x, y, w = 64, h = 64, flipX = false, flipY = false) {
        super(x, y, w, h, flipX, flipY);
        this.type = 'obj_bigcollect';
        this.points = 100;
        this.fontSize = 24;
    }
}


class Slime extends Entity {
    constructor(x, y, w = 40, h = 40, flipX = false, flipY = false) {
        super(x, y, w, h, 'transparent', flipX, flipY);
        this.type = 'obj_slime';
        this.vx = 2; // Movement speed
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
        this.vx = 2 * this.facingDir;
        this.hitCooldown = 0;
        
        this.sprites = [];
        this.image_index = 0;
        this.image_speed = 25/60;
        for (let i = 1; i <= 9; i++) {
            let img = new Image();
            img.src = `spr_slimewalk/spr_slimewalk${i}.png`;
            this.sprites.push(img);
        }
    }

    update(game) {
        if (this.state === 'held') {
            const p = game.player;
            if (p.isHoldingEnemy && p.heldEnemy === this) {
                this.x = p.x + p.width/2 - this.width/2;
                this.y = p.y - this.height + 10;
                this.vx = 0;
                this.vy = 0;
                this.facingDir = p.facingDir || 1;
                return;
            }
        }
        if (this.hitCooldown > 0) this.hitCooldown--;
        this.wasGrounded = this.isGrounded;
        if (this.state === 'walk') {
            this.image_index += this.image_speed;
            if (this.image_index >= this.sprites.length) {
                this.image_index = 0;
            }
        } else {
            this.image_index = 0;
        }
        
        if (this.state === 'piledriver_die') {
            // Grant Combo & Points
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
                    if (ent.isDestroyed || ent.isSolid === false || ent.isCutoff || ent.type === 'obj_cutoff' || ent.type === 'obj_cutoffsmall' || ent.type === 'cutoff' || ent.type === 'hallway' || ent.type === 'tutorialbook' || ent.type === 'obj_collect' || ent.type === 'obj_bigcollect' || ent.type === 'obj_slime' || ent.type === 'obj_baddiespawner' || ent.type === 'obj_splatter') continue;
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
                this.vy = -5;
                this.vx = 2 * this.facingDir;
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
                this.vx = 2 * this.facingDir;
            } else if (this.scaredTimer <= 0 && this.isGrounded) {
                this.state = 'walk';
                this.vx = 2 * this.facingDir;
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
                    this.vx = 2 * this.facingDir;
                }
            }
        }
        
        let hitWall = false;
        let hitWallEnt = null;
        
        // AABB with solid platforms
        for (let ent of game.entities) {
            if (ent === this || ent.isDestroyed || ent.isSolid === false || ent.isCutoff || ent.type === 'obj_cutoff' || ent.type === 'obj_cutoffsmall' || ent.type === 'cutoff' || ent.type === 'hallway' || ent.type === 'door' || ent.type.startsWith('targetDoor') || ent.type === 'tutorialbook' || ent.type === 'obj_collect' || ent.type === 'obj_bigcollect' || ent.type === 'obj_slime' || ent.type === 'obj_baddiespawner' || ent.type === 'obj_splatter' || ent.type === 'ladder' || ent.type === 'tile' || ent.type === 'oneway' || ent.type === 'left-up' || ent.type === 'right-up') continue;
            
            if (this.x < ent.x + ent.width &&
                this.x + this.width > ent.x &&
                this.y < ent.y + ent.height &&
                this.y + this.height > ent.y) {
                
                if (this.y + this.height > ent.y + 10 && this.y < ent.y + ent.height - 10) {
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
                
                // Grant Combo & Points
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
            }
            this.x += this.vx; // step out of wall
        }
        
        // Vertical movement & collision
        this.y += this.vy;
        this.isGrounded = false;
        
        for (let ent of game.entities) {
            if (ent === this || ent.isDestroyed || ent.isSolid === false || ent.isCutoff || ent.type === 'obj_cutoff' || ent.type === 'obj_cutoffsmall' || ent.type === 'cutoff' || ent.type === 'hallway' || ent.type === 'door' || ent.type.startsWith('targetDoor') || ent.type === 'tutorialbook' || ent.type === 'obj_collect' || ent.type === 'obj_bigcollect' || ent.type === 'obj_slime' || ent.type === 'obj_baddiespawner' || ent.type === 'obj_splatter' || ent.type === 'ladder' || ent.type === 'tile' || ent.type === 'left-up' || ent.type === 'right-up') continue;
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
                const snapUp = this.wasGrounded ? 30 : 5;
                
                if (slopeY !== null && this.y + this.height > slopeY - snapUp && this.y + this.height <= slopeY + 20) {
                    if (this.isGrounded && this.y + this.height < slopeY - 0.1) {
                        continue;
                    }
                    this.y = slopeY - this.height;
                    this.vy = 0;
                    this.isGrounded = true;
                }
            }
        }
        
        // Ledge detection
        if (this.isGrounded && this.state === 'walk') {
            let hasFloorAhead = false;
            let probeX = (this.vx > 0) ? this.x + this.width + 5 : this.x - 5;
            let probeY = this.y + this.height + 5;
            for (let ent of game.entities) {
                if (ent === this || ent.isDestroyed || ent.isSolid === false || ent.isCutoff || ent.type === 'obj_cutoff' || ent.type === 'obj_cutoffsmall' || ent.type === 'cutoff' || ent.type === 'hallway' || ent.type === 'door' || ent.type.startsWith('targetDoor') || ent.type === 'tutorialbook' || ent.type === 'obj_collect' || ent.type === 'obj_bigcollect' || ent.type === 'obj_slime' || ent.type === 'obj_baddiespawner' || ent.type === 'obj_splatter' || ent.type === 'ladder' || ent.type === 'tile') continue;
                
                if (probeX >= ent.x && probeX <= ent.x + ent.width &&
                    probeY >= ent.y && probeY <= ent.y + ent.height) {
                    hasFloorAhead = true;
                    break;
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
                // Spawn splatter on the ground below
                let floorY = this.y + this.height;
                // Raycast down up to 200 pixels to find a solid platform
                let splatterOffset = p.vx * 3;
                let splatterX = this.x + this.width/2 + splatterOffset;
                let floorEnt = null;
                for (let step = 0; step < 200; step += 10) {
                    let checkY = floorY + step;
                    let foundFloor = false;
                    for (let ent of game.entities) {
                        if (ent.isDestroyed || ent.isSolid === false || ent.isCutoff || ent.type === 'obj_cutoff' || ent.type === 'obj_cutoffsmall' || ent.type === 'cutoff' || ent.type === 'hallway' || ent.type === 'tutorialbook' || ent.type === 'obj_collect' || ent.type === 'obj_bigcollect' || ent.type === 'obj_slime' || ent.type === 'obj_baddiespawner' || ent.type === 'obj_splatter') continue;
                        if (splatterX >= ent.x && splatterX <= ent.x + ent.width) {
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
                game.entities.push(new Splatter(splatterX, floorY, floorEnt));

                // Kill immediately (fly off screen)
                this.state = 'dead';
                this.vy = -15;
                const knockDir = p.facingDir || 1;
                this.vx = 15 * knockDir;
                
                game.cameraShake = 20;
                
                if (game.combo > 0) {
                    game.comboTimer = 60; // 1 second (60 frames)
                }
                
                if (!this.spawnedBySpawner) {
                    game.combo = (game.combo || 0) + 1;
                    game.comboTimer = 60; // 1 second (60 frames)
                    
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
                }
                
                if (isStomp) {
                    p.vy = -10;
                    p.sprite_index = 'spr_player_jump';
                }
                
                this.hitCooldown = 15;
                if (game.audio && game.audio.play) game.audio.play('sfx_enemyhit');
                
            } else if (isMach1or2 || isStomp) {
                // Stun / knockback
                this.state = 'stunned';
                this.stunTimer = 100;
                this.vy = -4;
                // Determine knockback direction based on player facing direction
                const knockDir = p.facingDir || 1;
                this.vx = 12 * knockDir;
                
                if (isStomp) {
                    p.vy = -10;
                    p.sprite_index = 'spr_player_jump';
                }
                
                this.hitCooldown = 15;
                if (game.audio && game.audio.play) game.audio.play('sfx_enemyhit');
                
            }
        }
        
        // Kicked slime dies on walls instead (handled in wall collision)
    }

    render(ctx) {
        
        const isScared = this.state === 'scared';
        
        let drawX = this.x;
        let drawY = this.y;
        
        if (this.sprites.length > 0) {
            const frameIndex = Math.floor(this.image_index) % this.sprites.length;
            const img = this.sprites[frameIndex];
            
            if (img && img.complete && img.naturalWidth > 0) {
                ctx.save();
                ctx.translate(Math.round(drawX + this.width / 2), Math.round(drawY + this.height / 2));
                
                let scaleX = (this.facingDir === -1) ? -1 : 1;
                let scaleY = 1;
                if (this.state === 'stunned' || this.state === 'dead') {
                    scaleY = -1;
                }
                if (this.flipY) {
                    scaleY *= -1;
                }
                ctx.scale(scaleX, scaleY);
                
                const offsetY = -57.5;
                ctx.drawImage(img, -51, offsetY, 100, 100);
                
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

