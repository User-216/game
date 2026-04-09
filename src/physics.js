/**
 * Physics utilities for the 2D Platformer
 * Supports AABB collision and Slope height calculation
 */

class Physics {
    static checkCollision(box1, box2) {
        return box1.x < box2.x + box2.width &&
               box1.x + box1.width > box2.x &&
               box1.y < box2.y + box2.height &&
               box1.y + box1.height > box2.y;
    }

    /**
     * Resolves collision between an entity and a solid platform
     * Returns the adjustment vector
     */
    static resolveAABB(entity, platform) {
        if (!this.checkCollision(entity, platform)) return null;

        const overlapX = Math.min(entity.x + entity.width, platform.x + platform.width) - Math.max(entity.x, platform.x);
        const overlapY = Math.min(entity.y + entity.height, platform.y + platform.height) - Math.max(entity.y, platform.y);

        if (overlapX < overlapY) {
            // Horizontal collision
            return {
                axis: 'x',
                amount: entity.x + entity.width / 2 < platform.x + platform.width / 2 ? -overlapX : overlapX
            };
        } else {
            // Vertical collision
            return {
                axis: 'y',
                amount: entity.y + entity.height / 2 < platform.y + platform.height / 2 ? -overlapY : overlapY
            };
        }
    }

    /**
     * Gets the Y height of a slope at a specific X position
     */
    static getSlopeHeight(entity, slope) {
        // Calculate normalized X within the slope (0 to 1)
        const relX = (entity.x + entity.width / 2 - slope.x) / slope.width;
        
        if (relX < 0 || relX > 1) return null;

        let heightRatio;
        if (slope.type === 'left-up') {
            // /  (Low on left, high on right)
            heightRatio = relX;
        } else if (slope.type === 'right-up') {
            // \  (High on left, low on right)
            heightRatio = 1 - relX;
        }

        // Return the absolute Y of the surface at this point
        // Using entity.height ensures the player stands 'on' the surface
        return slope.y + (1 - heightRatio) * slope.height;
    }
}
