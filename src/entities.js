

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
    constructor(x, y, width, height, color = 'rgba(0, 242, 255, 0.4)') {
        super(x, y, width, height, color);
        this.type = 'platform';
    }

    render(ctx) {
        // Draw with a glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Add a subtle border
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        ctx.shadowBlur = 0;
    }
}

class Slope extends Entity {
    constructor(x, y, width, height, slopeType = 'left-up', color = 'rgba(70, 0, 255, 0.4)') {
        super(x, y, width, height, color);
        this.type = slopeType; // 'left-up' / or 'right-up' \
    }

    render(ctx) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
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
        
        // Stroke
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.shadowBlur = 0;
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
            ctx.shadowBlur = 15;
            ctx.shadowColor = this.color;
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
            ctx.shadowBlur = 0;
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

class Hallway extends Entity {
    constructor(x, y, width, height) {
        super(x, y, width, height, 'transparent');
        this.type = 'hallway';
    }

    render(ctx) {
        // Draw background panels for the hallway
        ctx.fillStyle = 'rgba(20, 25, 40, 0.8)';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Draw perspective lines
        ctx.strokeStyle = 'rgba(0, 242, 255, 0.1)';
        ctx.lineWidth = 1;
        for (let i = 0; i < this.width; i += 100) {
            ctx.strokeRect(this.x + i, this.y, 100, this.height);
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
        
        // Glow effect for the door
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;
        
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
