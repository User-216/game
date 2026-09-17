

class Entity {
    constructor(x, y, width, height, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.isDestroyed = false;
        this.id = Math.random().toString(36).substr(2, 9);
    }

    render(ctx) {
        if (this.isDestroyed) return;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
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
    constructor(x, y, width, height, slopeType = 'left-up', color = '#FF9FA266') {
        super(x, y, width, height, color);
        this.type = slopeType; // 'left-up' / or 'right-up' \
    }

    render(ctx) {
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
    }
}

class Destroyable extends Entity {
    constructor(x, y, width, height, color = '#ff0073') {
        super(x, y, width, height, color);
        this.health = 1;
        this.particles = [];
        this.type = 'destroyable';
    }

    destroy() {
        if (this.isDestroyed) return;
        this.isDestroyed = true;
        // Create explosion particles
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                size: Math.random() * 4 + 2,
                life: 1.0,
                decay: Math.random() * 0.05 + 0.01,
                color: this.color
            });
        }
    }

    render(ctx) {
        if (!this.isDestroyed) {
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

class Metal extends Destroyable {
    constructor(x, y, width, height) {
        super(x, y, width, height, '#999999');
        this.type = 'metal';
    }

    render(ctx) {
        if (!this.isDestroyed) {
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

class Tile extends Platform {
    constructor(x, y, width, height, tx = 0, ty = 0, tileImageName = 'tile_tutorial.png', sw = 32, sh = 32) {
        super(x, y, width, height, 'transparent');
        this.type = 'tile';
        this.tx = tx;
        this.ty = ty;
        this.sw = sw;
        this.sh = sh;
        this.tileImageName = tileImageName;
        
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
                    ctx.drawImage(img, this.tx, this.ty, drawW, drawH, this.x + dx, this.y + dy, drawW, drawH);
                }
            }
        } else {
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }
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
    constructor(x, y, width, height, label, targetRoom, color = 'rgba(191, 0, 255, 0.6)') {
        super(x, y, width, height, color);
        this.label = label;
        this.targetRoom = targetRoom;
        this.type = 'door';
    }

    render(ctx) {
        if (this.isDestroyed) return;
        
        // Door body
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Door frame
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        // Label text
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`DOOR ${this.label}`, this.x + this.width / 2, this.y - 10);
        
        // Arrow hint if close (optional visual polish)
        ctx.font = '12px Arial';
        ctx.fillText('↑ ENTER', this.x + this.width / 2, this.y + this.height + 20);
    }
}

class TargetDoorBase extends Entity {
    constructor(x, y, width, height, doorId) {
        super(x, y, width, height, 'transparent');
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
    }
}

class TargetDoor_A extends TargetDoorBase { constructor(x, y, w, h) { super(x, y, w, h, 'A'); } }
class TargetDoor_B extends TargetDoorBase { constructor(x, y, w, h) { super(x, y, w, h, 'B'); } }
class TargetDoor_C extends TargetDoorBase { constructor(x, y, w, h) { super(x, y, w, h, 'C'); } }
class TargetDoor_D extends TargetDoorBase { constructor(x, y, w, h) { super(x, y, w, h, 'D'); } }
class TargetDoor_E extends TargetDoorBase { constructor(x, y, w, h) { super(x, y, w, h, 'E'); } }

class TutorialBook extends Entity {
    constructor(x, y, width, height, text = "Tutorial Message") {
        super(x, y, width, height, '#00f2ff');
        this.type = 'tutorialbook';
        this.text = text;
    }

    render(ctx) {
        if (this.isDestroyed) return;
        
        ctx.save();
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
    constructor(x, y, w = 32, h = 32) {
        super(x, y, w, h);
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
    constructor(x, y, w = 64, h = 64) {
        super(x, y, w, h);
        this.type = 'obj_bigcollect';
        this.points = 100;
        this.fontSize = 24;
    }
}


class Slime extends Entity {
    constructor(x, y, w = 40, h = 40) {
        super(x, y, w, h);
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
        this.facingDir = 1;
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
            
            // Off-screen death for stunned enemy (Combo!)
            const isOffScreen = (this.x + this.width < game.camera.x || this.x > game.camera.x + game.canvas.width ||
                                 this.y + this.height < game.camera.y || this.y > game.camera.y + game.canvas.height);
            if (isOffScreen) {
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
            if (ent === this || ent.isDestroyed || ent.type === 'hallway' || ent.type === 'door' || ent.type.startsWith('targetDoor') || ent.type === 'tutorialbook' || ent.type === 'obj_collect' || ent.type === 'obj_bigcollect' || ent.type === 'obj_slime' || ent.type === 'obj_baddiespawner' || ent.type === 'obj_splatter' || ent.type === 'ladder' || ent.type === 'tile' || ent.type === 'oneway' || ent.type === 'left-up' || ent.type === 'right-up') continue;
            
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
        
        if (hitWall || this.x < 0 || (game.roomWidth && this.x + this.width > game.roomWidth)) {
            if (this.state === 'kicked') {
                this.markedForDeletion = true;
                if (game.audio && game.audio.play) game.audio.play('break');
                
                game.player.requestScreenShake = 20; // Strong screen shake on wall crash!
                
                // Spawn splatter on the wall
                let wallX = this.vx > 0 ? this.x + this.width + 50 : this.x - 50; // shift fully into wall
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
            if (ent === this || ent.isDestroyed || ent.type === 'hallway' || ent.type === 'door' || ent.type.startsWith('targetDoor') || ent.type === 'tutorialbook' || ent.type === 'obj_collect' || ent.type === 'obj_bigcollect' || ent.type === 'obj_slime' || ent.type === 'obj_baddiespawner' || ent.type === 'obj_splatter' || ent.type === 'ladder' || ent.type === 'tile' || ent.type === 'left-up' || ent.type === 'right-up') continue;
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
                if (ent === this || ent.isDestroyed || ent.type === 'hallway' || ent.type === 'door' || ent.type.startsWith('targetDoor') || ent.type === 'tutorialbook' || ent.type === 'obj_collect' || ent.type === 'obj_bigcollect' || ent.type === 'obj_slime' || ent.type === 'obj_baddiespawner' || ent.type === 'obj_splatter' || ent.type === 'ladder' || ent.type === 'tile') continue;
                
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
            const isMach1or2 = (absV >= 8 && absV < 12) || p.sprite_index.includes('mach2') || p.sprite_index === 'spr_player_suplexgrab' || p.sprite_index.includes('dash');
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
                        if (ent.isDestroyed || ent.type === 'hallway' || ent.type === 'tutorialbook' || ent.type === 'obj_collect' || ent.type === 'obj_bigcollect' || ent.type === 'obj_slime' || ent.type === 'obj_baddiespawner' || ent.type === 'obj_splatter') continue;
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
                
                if (this.facingDir === -1) {
                    ctx.scale(-1, 1);
                }
                
                if (this.state === 'stunned' || this.state === 'dead') {
                    ctx.scale(1, -1);
                }
                
                const offsetY = -57.5;
                ctx.drawImage(img, -51, offsetY, 100, 100);
                
                ctx.restore();
            }
        }
        

    }
}

class BaddieSpawner extends Entity {
    constructor(x, y, width = 40, height = 40, baddieType = 'obj_slime') {
        super(x, y, width, height, 'transparent');
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
                    const slime = new Slime(this.x, this.y, 40, 40);
                    slime.spawnedBySpawner = true;
                    game.entities.push(slime);
                    this.currentBaddie = slime;
                    
                    if (game.audio && game.audio.play) game.audio.play('jump');
                }
            }
        }
    }
    
    render(ctx) {
        if (this.imageLoaded) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = '#666';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.strokeStyle = '#222';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }
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
