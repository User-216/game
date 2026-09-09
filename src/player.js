

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 26;
        this.height = 45;
        this.vx = 0;
        this.vy = 0;
        this.speed = 0.5;
        this.maxSpeed = 7;
        this.runInitialSpeed = 6;
        this.runMaxSpeed = 12;
        this.runAccel = 0.1;
        this.friction = 0.85;
        this.gravity = 0.5;
        this.jumpForce = -12;

        this.isGrounded = false;
        this.standingOnEntity = null;
        this.isWalled = false;
        this.wallSide = 0; // -1 for left, 1 for right
        this.isRunning = false;
        this.isGroundPounding = false;
        this.isGroundPoundLand = false;
        this.groundPoundLandTimer = 0;
        this.isClimbing = false;
        this.isClimbingLadder = false;
        this.climbSide = 0;
        this.isCrouching = false;
        
        this.isTaunting = false;
        this.tauntTimer = 0;
        
        this.canSuplexGrab = true;
        this.isTumbling = false;
            this.sprite_index = 'spr_player_idle';
            this.image_speed = (this.vy !== 0) ? 0.3 : 0;
        this.isSuplexGrabbing = false;
        this.suplexGrabTimer = 0;
        this.requestScreenShake = 0;
        this.isClimbing = false;
        this.wallClimbGraceTimer = 0;
        this.climbSide = 0; // -1 for left wall, 1 for right wall
        this.isDrifting = false;
        this.isDrifting1 = false;
        this.driftTimer = 0;
        this.driftFriction = 0.9;
        this.isMachSliding = false;
        this.machSlideFriction = 0.94;
        this.wasRunningLastFrame = false;
        this.isNoClip = false;
        this.canJump = true;
        this.jumpBufferTimer = 0;
        this.canGrab = true;
        this.grabBufferTimer = 0;
        this.canGroundPound = true;
        this.facingDir = 1;
        this.insideHallway = false;




        this.color = '#00f2ff';
        this.machSlideColor = '#ffaa00'; // Orange for sliding
        this.groundPoundColor = '#ff0073';

        // Mach Afterimage (Pizza Tower style)
        this.machAfters = [];
        this.machThreshold = 11.9;
        this.machColors = ['#ff0000', '#00ff00', '#bf00ff']; // Red, Green, Purple
        this.machColorIndex = 0;
        this.machFrameCount = 0;
        this.machFlashTimer = 0;

        // Ghost Trail (Smooth alpha fade for Ground Pound)
        this.ghostAfters = [];

        // Sprites
        this.state = 'normal';
        this.sprite_index = 'spr_player_idle';
        this.image_index = 0;
        this.image_speed = 0.4;
        this.sprites = {
            spr_player_idle: [],
            spr_player_walk: [],
            spr_player_fall: [],
            spr_player_jump: [],
            spr_player_land: [],
            spr_player_roll: [],
            spr_player_mach2: []
        };
        for (let i = 1; i <= 9; i++) {
            let img = new Image();
            img.src = `player/spr_player_idle/spr_playerT_idle${i}.png`;
            this.sprites.spr_player_idle.push(img);
        }
        
        for (let i = 1; i <= 14; i++) {
            let img = new Image();
            img.src = `player/spr_player_walk/spr_playerT_walk${i}.png`;
            this.sprites.spr_player_walk.push(img);
        }
        
        // Load fall sprite (3 frames)
        for (let i = 1; i <= 3; i++) {
            let img = new Image();
            img.src = `player/spr_player_fall/spr_playerT_fall${i}.png`;
            this.sprites.spr_player_fall.push(img);
        }

        // Load jump sprite (5 frames)
        for (let i = 1; i <= 5; i++) {
            let img = new Image();
            img.src = `player/spr_player_jump/spr_playerT_jump${i}.png`;
            this.sprites.spr_player_jump.push(img);
        }

        // Load land sprite (4 frames -> Eˆì§€EEú°E ˆì„ Eœê±° E”ì²­E¼EE3ú°E ˆì„EEEœë“œ)
        for (let i = 1; i <= 3; i++) {
            let img = new Image();
            img.src = `player/spr_player_land/spr_playerT_land${i}.png`;
            this.sprites.spr_player_land.push(img);
        }

        // Load roll sprite (4 frames)
        for (let i = 1; i <= 4; i++) {
            let img = new Image();
            img.src = `player/spr_player_roll/spr_playerT_roll${i}.png`;
            this.sprites.spr_player_roll.push(img);
        }

        // Load mach2 sprite (7 frames)
        for (let i = 1; i <= 7; i++) {
            let img = new Image();
            img.src = `player/spr_player_mach2/spr_playerT_mach${i}.png`;
            this.sprites.spr_player_mach2.push(img);
        }

        // Load ground pound start sprite (10 frames)
        this.sprites.spr_player_groundpoundstart = [];
        for (let i = 1; i <= 10; i++) {
            let img = new Image();
            img.src = `player/spr_player_groundpoundstart/spr_playerT_groundpoundstart${i}.png`;
            this.sprites.spr_player_groundpoundstart.push(img);
        }

        // Load ground pound sprite (3 frames)
        this.sprites.spr_player_groundpound = [];
        for (let i = 1; i <= 3; i++) {
            let img = new Image();
            img.src = `player/spr_player_groundpound/spr_playerT_groundpound${i}.png`;
            this.sprites.spr_player_groundpound.push(img);
        }

        // Load taunt sprite (8 frames)
        this.sprites.spr_player_taunt = [];
        for (let i = 1; i <= 8; i++) {
            let img = new Image();
            img.src = `player/spr_player_taunt/spr_playerT_taunt${i}.png`;
            this.sprites.spr_player_taunt.push(img);
        }

        this.effectSprites = {
            spr_highjumpcloud2: [],
            spr_taunteffect: [],
            spr_landcloud: [],
            spr_cloudeffect: []
        };
        for (let i = 0; i <= 6; i++) {
            let img = new Image();
            img.src = `effect/spr_highjumpcloud2/spr_highjumpcloud2_${i}.png`;
            this.effectSprites.spr_highjumpcloud2.push(img);
        }
        
        for (let i = 0; i <= 8; i++) {
            let img = new Image();
            img.src = `effect/spr_taunteffect/spr_taunteffect_${i}.png`;
            this.effectSprites.spr_taunteffect.push(img);
        }
        
        for (let i = 0; i <= 5; i++) {
            let img = new Image();
            img.src = `effect/spr_landcloud/spr_landcloud_${i}.png`;
            this.effectSprites.spr_landcloud.push(img);
        }
        
        for (let i = 0; i <= 13; i++) {
            let img = new Image();
            img.src = `effect/spr_cloudeffect/spr_cloudeffect_${i}.png`;
            this.effectSprites.spr_cloudeffect.push(img);
        }
        
        this.effectSprites.spr_dashcloud = [];
        for (let i = 0; i <= 4; i++) {
            let img = new Image();
            img.src = `effect/spr_dashcloud/spr_dashcloud_${i}.png`;
            this.effectSprites.spr_dashcloud.push(img);
        }
        
        this.effectSprites.spr_superdashcloud = [];
        for (let i = 0; i <= 7; i++) {
            let img = new Image();
            img.src = `effect/spr_superdashcloud/spr_superdashcloud_${i}.png`;
            this.effectSprites.spr_superdashcloud.push(img);
        }
        
        this.activeEffects = [];
        this.machColorIndex = 0;
        this.walkEffectTimer = 0;
        this.runEffectTimer = 0;
        this.prevKeysTaunt = false;
        
        // Load default sprite
        this.image = new Image();
        this.mask_image = new Image();
        this.mask_image.src = 'player/spr_player_mask.png';
        this.mask_image_crouch = new Image();
        this.mask_image_crouch.src = 'player/spr_player_maskc.png';
        this.frameCount = 0;
    }

    update(keys, entities, audio) {
        this.frameCount++;
        this.wasGrounded = this.isGrounded;

        if (this.isTaunting) {
            this.tauntTimer--;
            if (this.tauntTimer <= 0) {
                this.isTaunting = false;
            }
            return; // EE°EE‘ì—EEE¼E¬ E”ì§E³¼ EEE EE°E´ú¦¸E¼ EE Eˆ E•ì§€ (E¬E¬E° EEE E± EE²½ E E€)
        } else if (keys.actionTaunt && !this.prevKeysTaunt) {
            this.isTaunting = true;
            this.tauntTimer = 20;
            
            // E E€ E”ì²­: EE°EEEspr_player_tauntEEE€E½ EE8EEEEEœë¤ ú°E ˆì„ E úŸE
            this.sprite_index = 'spr_player_taunt';
            this.image_index = Math.floor(Math.random() * 8);
            this.image_speed = 0; // ú°E ˆì„ E EE
            
            if (audio) audio.play('taunt'); 
            
            this.activeEffects.push({
                type: 'spr_taunteffect',
                x: this.x + this.width / 2,
                y: this.y + this.height,
                image_index: 0,
                image_speed: 0.45 
            });
            this.prevKeysTaunt = true; // E€EEE©EEEE¥¸ EEE E€E¥
            return; // EE°EEœì‘ ú°E ˆì„EEEE°E´ú¦¸ E•ì§€
        }
        
        this.prevKeysTaunt = keys.actionTaunt;

        let isCurrentlyRunning = !!keys.actionRun;
        
        // EµE‘ì—EœëŠ” E¬E¬E° E¨EEEˆê°€ (E´EEú°E ˆì„EEE¬E¬E  Eˆì—ˆE¤E´ E•ì EE E€)
        // E¨, E½úŸ€E° E‘ì¼ EŒëŠ” Eˆì™¸EEE¬E¬E° ú¤E¼ E“ìœ¼E´ E‰ì‹œ E¨EŒë˜EE¡Eú±¨
        if (!this.isGrounded && this.wasRunningLastFrame && !this.isClimbing) {
            isCurrentlyRunning = true;
        }
        
        // EE¬E¬E  Eˆì„ EŒëŠ” E¬E¬E° Eˆê°€
        if (this.isCrouching) {
            isCurrentlyRunning = false;
        }

        // (E´EE— Eˆë˜ 'EµE‘ì—EEE¬E¬E° Eˆì¶EEEEEŒ' Eœí•œ ú±´EE

        // EµE‘ì—EœëŠ” Eˆë¡EE¬E¬E°E¼ Eœì‘ú±  EEEEœ¼EE E´E¸ Eë„E€ Eˆí•˜ E´EE´E´ E¬E¬E° E¬EEú³ˆìš©
        if (this.isGroundPounding) {
            isCurrentlyRunning = false;
        } else if (!this.isGrounded && !this.wasRunningLastFrame && !this.isClimbing) {
            if (Math.abs(this.vx) < this.machThreshold) {
                isCurrentlyRunning = false;
            }
        }

        // E¬E´E° E‘ì—EEE¬E¬E° EEE E•ì EE E€
        if (this.isTumbling) {
            isCurrentlyRunning = true;
        }

        // (E¡E° EEE¬E¬E° E¨EEE”ë“œ Eœê±°)


        // Noclip Trigger
        if (keys['1']) {
            this.isNoClip = true;
        }
        if (this.isNoClip && keys.actionJump) {
            this.isNoClip = false;
            this.canJump = false;
        }

        if (this.isNoClip) {
            this.isRunning = false;
            const noclipSpeed = 8;
            if (keys.actionLeft) this.vx = -noclipSpeed;
            else if (keys.actionRight) this.vx = noclipSpeed;
            else this.vx = 0;

            if (keys.actionUp) this.vy = -noclipSpeed;
            else if (keys.actionDown) this.vy = noclipSpeed;
            else this.vy = 0;

            this.x += this.vx;
            this.y += this.vy;

            // Skip normal logic
            this.wasRunningLastFrame = false;
            this.isGrounded = false;
        this.standingOnEntity = null;
            this.isWalled = false;
            this.isClimbing = false;
            this.isGroundPounding = false;
            this.machAfters = [];
            this.ghostAfters = [];
            return;
        }

        // Ladder Logic
        let overlappingLadder = null;
        for (let entity of entities) {
            if (entity.type === 'ladder' && !entity.isDestroyed && Physics.checkCollision(this, entity)) {
                overlappingLadder = entity;
                break;
            }
        }

        if (this.isClimbingLadder && !overlappingLadder) {
            this.isClimbingLadder = false; // fell off
        }

        if (overlappingLadder && !this.isClimbingLadder) {
            // Check if we should attach
            let canAttach = false;
            if (!this.isTumbling && !this.isGroundPounding) {
                if (keys.actionUp) { canAttach = true; }
                else if (keys.actionDown) {
                    if (!this.isGrounded) { canAttach = true; }
                    else if (this.standingOnEntity && this.standingOnEntity.type === 'oneway') { canAttach = true; }
                }
            }
            if (canAttach) {
                this.isClimbingLadder = true;
                this.vx = 0;
                this.vy = 0;
                this.isGroundPounding = false;
                this.isClimbing = false;
                this.isSuplexGrabbing = false;
                this.isMachSliding = false;
                this.isDrifting = false;
                this.isDrifting1 = false;
                this.isWalled = false;
                this.x = overlappingLadder.x + overlappingLadder.width / 2 - this.width / 2;
            }
        }

        if (this.isClimbingLadder) {
            this.isRunning = false;
            this.isCrouching = false;
            this.isTumbling = false;
            this.sprite_index = 'spr_player_idle';
            this.image_speed = (this.vy !== 0) ? 0.3 : 0;
            
            this.vx = 0;
            if (keys.actionUp) this.vy = -5;
            else if (keys.actionDown) this.vy = 5;
            else this.vy = 0;
            
            if (keys.actionJump && !this.prevKeysJump) {
                this.isClimbingLadder = false;
                this.vy = -this.jumpForce;
                if (keys.actionLeft) this.vx = -4;
                if (keys.actionRight) this.vx = 4;
                if (audio) audio.play('jump');
            }
            
            // Fix horizontally to ladder center
            this.x += ((overlappingLadder.x + overlappingLadder.width / 2) - (this.x + this.width / 2)) * 0.2;
        }

        // Running cancel triggers: EE—EEE¬E¬EEEEShiftE¼ E¼E´ E¬E¼E´EEEœë™ (E¬E´E° E‘ì—EEEœì™¸)
        if (this.wasRunningLastFrame && !isCurrentlyRunning && this.isGrounded && !this.isTumbling) {
            if (audio) {
                audio.stopFile('mach2');
                audio.stopFile('mach3');
                audio.playFile('sfx_break', true);
            }
            if (Math.abs(this.vx) >= this.machThreshold && !this.isDrifting && !this.isDrifting1) {
                this.isMachSliding = true;
            }
        }


        this.isRunning = isCurrentlyRunning;

        // Suplex Grab E¨EEEœì§E EŒì§EE©ú²¥E¼ E˜ëŒ€ E©ú²¥ú¤E¼ EE¥´E´ E‰ì‹œ E¨EE
        if (this.isSuplexGrabbing) {
            if ((this.facingDir === 1 && keys.actionLeft) || (this.facingDir === -1 && keys.actionRight)) {
                this.isSuplexGrabbing = false;
                this.vx = 0; // EµEEE€EEEE´€EE´ E‰ì‹œ E•ì§€ (E€E± Eœê±°)
            }
        }

        // Horizontal Movement (Eœë¦¬ú°EŠ¸EEEˆí•˜ E¬E¼E´EEE‘ì´ EE‹ EŒë§EE°EEE€E¥)
        if (!this.isDrifting && !this.isDrifting1 && !this.isMachSliding && !this.isClimbing && !this.isWallJumping && !this.isClimbingLadder) {
            let effLeft = keys.actionLeft;
            let effRight = keys.actionRight;
            
            // E¬E´E°(tumble) E‘ì—EEEŒìš° E©ú²¥ EE™˜ Eˆê°€ (E€E± E E€)
            if (this.isTumbling) {
                effLeft = false;
                effRight = false;
            }
            
            // EµE‘ì—EEE E´EEE¬E¬EEE‘ì´E´ E©ú²¥ EE™˜(ú¤ EE ¥)EEE´Eœí•˜E  ú´E¬ E©ú²¥EEE•ì EE E€ (E¤E´EŒë°¤ E‘ì—EEEˆì™¸)
            if (!this.isGrounded && this.isRunning && Math.abs(this.vx) >= 6 && !this.isGroundPounding) {
                effLeft = this.facingDir === -1;
                effRight = this.facingDir === 1;
            }
            // E¬E¬E° E‘ì¸E° E©ú²¥ú¤E¼ EEEE¥´E  Eˆë‹¤E´ E”ë¼E´EEE©ú²¥E¼EEEë™ E¬E¬E° (E¤E´EŒë°¤ E‘ì—EEEë™ EE§EEˆì§€)
            else if (this.isRunning && !keys.actionLeft && !keys.actionRight && !this.isGroundPounding) {
                if (this.facingDir === -1) effLeft = true;
                else if (this.facingDir === 1) effRight = true;
            }

            const activeMaxSpeed = this.isCrouching ? 4 : this.maxSpeed;

            if (effLeft) {
                if (!this.isTumbling && !this.isSuplexGrabbing && Math.abs(this.vx) < 12) this.facingDir = -1;
                
                if (this.isRunning && this.vx > 0 && this.vx < this.machThreshold) {
                    this.vx = -6;
                } else if (!this.isRunning && this.vx > 0) {
                    // E·EEEEE©ú²¥EEE¾EEEE E¸EEŸ¬E€E€ EŠê³  E‰ì‹œ Eë„E¼ E˜ëŒ€EEE¤E‘ìŒ
                    this.vx = -this.vx;
                } else {
                    const canSlowDown = !this.isRunning || this.vx <= 0;
                    if (canSlowDown) {
                        if (this.vx > -activeMaxSpeed) {
                            this.vx -= this.speed;
                        } else if (this.isCrouching && this.vx < -activeMaxSpeed) {
                            // If they were moving fast and then crouch, slow them down to activeMaxSpeed
                            this.vx += this.speed; 
                        }
                    }
                }
            } else if (effRight) {
                if (!this.isTumbling && !this.isSuplexGrabbing && Math.abs(this.vx) < 12) this.facingDir = 1;

                if (this.isRunning && this.vx < 0 && this.vx > -this.machThreshold) {
                    this.vx = 6;
                } else if (!this.isRunning && this.vx < 0) {
                    // E·EEEEE©ú²¥EEE¾EEEE E¸EEŸ¬E€E€ EŠê³  E‰ì‹œ Eë„E¼ E˜ëŒ€EEE¤E‘ìŒ
                    this.vx = -this.vx;
                } else {
                    const canSlowDown = !this.isRunning || this.vx >= 0;
                    if (canSlowDown) {
                        if (this.vx < activeMaxSpeed) {
                            this.vx += this.speed;
                        } else if (this.isCrouching && this.vx > activeMaxSpeed) {
                            // If they were moving fast and then crouch, slow them down to activeMaxSpeed
                            this.vx -= this.speed;
                        }
                    }
                }
            } else {
                // E©ú²¥ú¤E¼ EE¥´E€ EŠì•˜EEEE
                if (this.isTumbling || this.isSuplexGrabbing) {
                    // E¬E´E°/E¡E° EŒì§EE‘ì—EEEìE EE´ Eë„ EE EE E€
                } else {
                    this.vx = 0;
                }
            }
        }

        // Running acceleration logic
        if (this.isRunning && !this.isMachSliding && !this.isDrifting && !this.isDrifting1 && this.isGrounded && !this.isTumbling && !this.isCrouching && !this.isSuplexGrabbing) {
            let effLeft = keys.actionLeft;
            let effRight = keys.actionRight;
            if (!keys.actionLeft && !keys.actionRight) {
                if (this.facingDir === -1) effLeft = true;
                else if (this.facingDir === 1) effRight = true;
            }

            if (effLeft || effRight) {
                const runDir = effLeft ? -1 : 1;
                // Give an initial boost to 6 if running starts from low speed
                if (Math.abs(this.vx) < this.runInitialSpeed) {
                    this.vx = runDir * this.runInitialSpeed;
                }
                // Gradually accelerate up to max speed
                this.vx += runDir * this.runAccel;
            }
        }

        // Drifting Logic
        // Trigger: isRunning AND fast AND pressing opposite direction AND grounded
        const isPressingOpposite = (this.vx >= this.machThreshold && keys.actionLeft) || (this.vx <= -this.machThreshold && keys.actionRight);
        if (this.isRunning && Math.abs(this.vx) >= this.machThreshold && isPressingOpposite && !this.isDrifting && !this.isDrifting1 && this.isGrounded && !this.isTumbling) {
            if (Math.abs(this.vx) >= this.machThreshold) {
                this.isDrifting = true;
            } else {
                this.isDrifting1 = true;
            }
            this.driftTimer = 35;
            // Eœë¦¬ú°EŠ¸E€ Eë‚  EEú¦€E´E˜ê°EE©ú²¥ E€E¥ (ú´E¬ Eë„EEE˜ëŒ€ E©ú²¥)
            this.driftTargetDir = this.vx > 0 ? -1 : 1;
            if (audio) {
                audio.stopFile('mach2');
                audio.stopFile('mach3');
                audio.playFile('machslideboost', true);
            }
        }

        if (this.isDrifting) {
            // Eë„E¼ 0.4E© EE–´E¤EEú±¨ (E©ú²¥EEEì¶°EE
            if (this.vx > 0) {
                this.vx -= 0.4;
                if (this.vx < 0) this.vx = 0;
            } else if (this.vx < 0) {
                this.vx += 0.4;
                if (this.vx > 0) this.vx = 0;
            }

            this.driftTimer--;

            // EE£EE°E´: 35ú°E ˆì„E´ E¨EEE€E¬E  + EE— E¿EEEˆëŠ” EEEE¬E¼ ú±¨
            if (this.driftTimer <= 0 && this.isGrounded) {
                this.isDrifting = false;
                // Eœë¦¬ú°EŠ¸ EE£EEEE©ú­EE©ú²¥E¼EEEë„E¼ 12EEE¤EE
                this.vx = this.driftTargetDir * 12;
                this.facingDir = this.driftTargetDir;
            }
        }

        if (this.isDrifting1) {
            // Eë„E¼ 0.4E© EE–´E¤EEú±¨ (E•í•´EEE©EëŒ€EE
            if (this.vx > 0) {
                this.vx -= 0.4;
                if (this.vx < 0) this.vx = 0;
            } else if (this.vx < 0) {
                this.vx += 0.4;
                if (this.vx > 0) this.vx = 0;
            }

            this.driftTimer--;

            // EE£EE°E´: 35ú°E ˆì„E´ E¨EEE€E¬E  + EE— E¿EEEˆëŠ” EEEE¬E¼ ú±¨
            if (this.driftTimer <= 0 && this.isGrounded) {
                this.isDrifting1 = false;
                // DRIFTING1 EE£EEEE©ú­EE©ú²¥E¼EEEë„E¼ 8EEE¤EE
                this.vx = this.driftTargetDir * 8;
                this.facingDir = this.driftTargetDir;
            }
        }

        // Mach Sliding Logic
        if (this.isMachSliding) {
            this.vx *= this.machSlideFriction;

            // Eë„E€ E®EE§€E°EEEE—EEE¨E´E€E´ EE£E(EëŠ” E¬E©Eì˜ E¤E¸ E°EE
            if (Math.abs(this.vx) < 1.5) {
                this.isMachSliding = false;
            }
        }

        const targetMaxSpeed = isCurrentlyRunning ? this.runMaxSpeed : this.maxSpeed;

        // Clamp speed (Eˆí•˜ E¬E¼E´Eœë‚˜ E¡E°, E¬E´E°, EE°ê¸° E‘ì—EEú´E¨ú°EEëµ)
        if (!this.isMachSliding && !this.isSuplexGrabbing && !this.isTumbling && !this.isGroundPounding) {
            if (this.vx > targetMaxSpeed) {
                this.vx -= 0.5;
                if (this.vx < targetMaxSpeed) this.vx = targetMaxSpeed;
            } else if (this.vx < -targetMaxSpeed) {
                this.vx += 0.5;
                if (this.vx > -targetMaxSpeed) this.vx = -targetMaxSpeed;
            }
        }

        // Crouch & Tumble Logic
        let wantCrouch = false;
        let wantTumble = false;

        if (keys.actionDown && !this.isDrifting && !this.isDrifting1 && !this.isMachSliding && !this.isClimbing && !this.isGroundPounding && !this.isGroundPoundLand) {
            if (this.isSuplexGrabbing) {
                // E¡E° EŒì§EEEEE˜E¼ EE¥´E´ EŒì§E„ E¨EŒí•˜E  E‰ì‹œ E¬E´E°EEE°EE•˜E° Eë„E¼ 12EEE€E¤ú¦¸
                wantTumble = true;
                this.isSuplexGrabbing = false;
                this.suplexGrabTimer = 0;
                this.vx = 12 * this.facingDir;
            } else if (this.isTumbling) {
                // Keep tumbling even if falling in air
                wantTumble = true;
            } else if (this.isGrounded) {
                // E¬E¬E  Eˆê±°EEEë„E€ E·E° EœëŒ€ Eë„(7)E´E¤ E E¼ EŒë§EE¬E´E° Eœë™
                if (Math.abs(this.vx) > this.maxSpeed) {
                    wantTumble = true;
                } else {
                    wantCrouch = true;
                }
            } else if (!this.isGrounded) {
                // E¬E¬EEEë„E¼ EŒë§EEµEEE¬E´E°(E¤E´EE Eœë™, EE‹ˆE´ E¸E¥ E‰ë©E´ Eê¸°(crouch) E€EE
                if (Math.abs(this.vx) > this.maxSpeed) {
                    wantTumble = true;
                }
            } else if (this.isCrouching) {
                wantCrouch = true;
            }
        }

        const isCurrentlySmall = this.isCrouching || this.isTumbling;
        if (isCurrentlySmall && !wantCrouch && !wantTumble) {
            // Check ceiling before uncrouching/untumbling
            const headBox = { x: this.x, y: this.y - 22, width: 26, height: 22 };
            let hitCeiling = false;
            for (let entity of entities) {
                if (entity.isDestroyed || entity.type === 'hallway' || entity.type === 'door' || entity.type.startsWith('targetDoor') || entity.type === 'tutorialbook' || entity.type === 'left-up' || entity.type === 'right-up') continue;
                if (Physics.checkCollision(headBox, entity)) {
                    hitCeiling = true;
                    break;
                }
            }
            if (hitCeiling) {
                // Forced to stay small, keep current state
                if (this.isTumbling) wantTumble = true;
                else wantCrouch = true;
            }
        }

        const willBeSmall = wantCrouch || wantTumble;
        if (willBeSmall !== isCurrentlySmall) {
            if (willBeSmall) {
                this.height = 23;
                this.y += 22; // shift down
                // E E€ E”ì²­: EµE‘ì—EEE¬E´E°(E¤E´EE Eœì‘ EEEí”„ E‘ì´E”ë¼EEú±­EEEE˜EEúµEE‚íˆEE¡EE˜ì E
                if (wantTumble && !this.isGrounded) {
                    this.vy = 12; // E¤E´EEú±˜ê°EEë„E¼ 10EìE 12EEE´EEEEEœì›ú±˜ê²EE‚íˆEE¡EE°EE
                }
            } else {
                this.height = 45;
                this.y -= 22; // shift up
            }
        }

        this.isCrouching = wantCrouch;
        this.isTumbling = wantTumble;

        if (this.isSuplexGrabbing) {
            this.state = 'suplexgrab';
        } else if (this.isTumbling) {
            this.state = 'tumble';
            // Tumble maintains momentum, no forced stop
        } else if (this.isCrouching) {
            this.state = 'crouch';
            // E°E´E€E°E¼ EE•´ E•ì EE•ì§€(this.vx = 0) Eœê±°
        } else {
            this.state = 'normal';
        }

        if (!keys.actionGrab) {
            this.canGrab = true;
        }

        if (this.grabBufferTimer > 0) {
            this.grabBufferTimer--;
        }

        if (keys.actionGrab && this.canGrab) {
            this.grabBufferTimer = 18; // 18 frames (0.3s) of grab buffer
            this.canGrab = false; // Consume the grab press immediately
        }

        // Suplex Grab Trigger
        if (this.grabBufferTimer > 0 && !this.isSuplexGrabbing && !this.isGroundPounding && !this.isGroundPoundLand && !this.isClimbing && !this.isDrifting && !this.isDrifting1 && !this.isMachSliding && !this.isTumbling) {
            this.isSuplexGrabbing = true;
            this.suplexGrabTimer = 32; // 32 frames
            this.grabBufferTimer = 0; // Consume the buffer
            if (audio) audio.playFile('sfx_suplexdash', true); // E¡E° Eœì‘ú±  EEú±EEˆë§EE¬EE(forceRestart)
        }

        // Suplex Grab Logic
        if (this.isSuplexGrabbing) {
            if (this.suplexGrabTimer > 0 || !this.isGrounded) {
                if (this.suplexGrabTimer > 0) {
                    this.suplexGrabTimer--;
                }
                let absVx = Math.abs(this.vx);
                if (absVx < 8) {
                    absVx = 8;
                }
                if (absVx < 10) {
                    absVx += 0.5;
                    if (absVx > 10) absVx = 10;
                }
                this.vx = absVx * this.facingDir;
            } else {
                this.isSuplexGrabbing = false;
            }
        }

        if (!keys.actionDown) {
            this.canGroundPound = true;
        }

        // Ground Pound Trigger (Eí”„/E´E™ê³¼ Eˆì°¬E€E€EEEœë¦¬ú°EŠ¸, E½úŸ€E° E‘ì—EEEœë™ Eˆê°€, E¬E´E° E‘ì—EEEœë™ Eˆê°€)
        if (keys.actionDown && this.canGroundPound && !this.isGrounded && !this.isGroundPounding && !this.isGroundPoundLand && !this.isDrifting && !this.isDrifting1 && !this.isClimbing && !this.isClimbingLadder && !this.isTumbling && !this.isCrouching) {
            this.isGroundPounding = true;
            this.canGroundPound = false; // EŒë¹E
            this.vy = -10; // Upward hop
            this.vx = 0;   // E‰ë©E´ Eê¸° EEE˜í‰ E´EEEˆì¶¤
            this.sprite_index = 'spr_player_groundpoundstart';
            this.image_index = 0;
            if (audio) audio.play('groundpound');
        }

        if (this.wallClimbGraceTimer > 0) {
            this.wallClimbGraceTimer--;
        }

        // Apply Gravity / Ground Pound Descent / Climbing
        if (this.isClimbing && !this.isRunning && this.wallClimbGraceTimer <= 0) {
            this.isClimbing = false;
        }

        if (this.isClimbing) {
            // Accelerate upward by 0.05 each frame.
            this.vy -= 0.05;
            // EE–¥ Eë„E¼ EœëŒ€ 20E¼EEEœí•œ (EE–¥E€ EŒìE E’ì´E€EE-20 E´ú±˜ë¡EE´E¤E€E€ EŠê²Eú±¨)
            if (this.vy < -20) this.vy = -20;
            this.vx = 0;
            // Force player against the wall
            this.x += this.climbSide * 2;
        } else if (this.isGroundPounding) {
            this.vy += 1.2; // Slightly reduced downward acceleration for better control
        } else if (this.isClimbingLadder) {} else if (this.isMachSliding && !this.isGrounded) {
            // E¬E¼E´EEEEEµE‘ì— E¨E´ E¬E¼E´EEE‘ë‹¨ (EëŠ” EEE E E€ú± E€ E°EE
            // E¬E°E  E€E±EEEE•´ E E€ú±˜ë˜ E‘ë ¥ EEš©
            this.vy += this.gravity;
        } else {
            this.vy += this.gravity;
        }

        // Clamp falling speed to 20 (ground pound is capped at 40 to prevent collision clipping)
        if (this.vy > 20 && !this.isGroundPounding) {
            this.vy = 20;
        } else if (this.isGroundPounding && this.vy > 40) {
            this.vy = 40;
        }

        // Wall Slide friction removed

        if (this.isGroundPoundLand) {
            this.vx = 0;
            // Let vy be calculated by gravity so that collision logic marks us as grounded
            this.groundPoundLandTimer--;
            if (this.groundPoundLandTimer <= 0) {
                this.isGroundPoundLand = false;
            }
        }

        this.x += this.vx;
        this.y += this.vy;

        // E©ú²¥ EE°E´ú¦¸ (Eœë¦¬ú°EŠ¸EEE½úŸ€E°, E¬E´E° E‘ì´ EE‹ EŒë§Eú¤ EE ¥EEE°E¼ E©ú²¥ E°EE
        if (!this.isDrifting && !this.isDrifting1 && !this.isMachSliding && !this.isClimbing && !this.isWallJumping && !this.isTumbling && Math.abs(this.vx) < 12) {
            // EµE‘ì—EEE¬E¬EEE‘ì¼ EŒëŠ” E©ú²¥ EE™˜ Eˆê°€
            if (this.isGrounded || !this.isRunning) {
                if (keys.actionLeft) this.facingDir = -1;
                else if (keys.actionRight) this.facingDir = 1;
            }
        }

        // E¤EEú°E ˆì„EEEE•´ ú´E¬ E¬E¬E° EEE E€E¥
        this.wasRunningLastFrame = this.isRunning;

        // Reset states for collision
        this.isGrounded = false;
        this.standingOnEntity = null;
        this.isWalled = false;
        this.wallSide = 0;
        // isGroundPounding will be reset upon hitting ground in collision resolution

        // Mach Afterimage Update (EœìE Eˆí•˜ E¬E¬E°/Eí”„ EEEE¼ EŒë§EE”ìƒ Eì„±)
        if (Math.abs(this.vx) >= this.machThreshold && !this.isSuplexGrabbing && !this.isTumbling) {
            this.machFlashTimer++;
            this.machFrameCount++;

            // Create a new mach afterimage every 5 frames
            if (this.machFrameCount % 5 === 0) {
                const color = this.machColors[this.machColorIndex];
                this.machAfters.unshift({
                    x: this.x,
                    y: this.y,
                    sprite_index: this.sprite_index,
                    image_index: this.image_index,
                    facingDir: this.facingDir,
                    isCrouching: this.isCrouching,
                    isTumbling: this.isTumbling,
                    color: color,
                    alpha: 0.8,
                    life: 20 // 20 frames lifespan
                });

                // Cycle colors
                this.machColorIndex = (this.machColorIndex + 1) % this.machColors.length;
            }
        } else {
            this.machFlashTimer = 0;
            this.machFrameCount = 0;
        }

        // Update Mach Afterimages
        this.machAfters.forEach((m, index) => {
            m.life -= 1; // Decrement 1 frame every update
            m.alpha = (m.life / 20) * 0.8; // Smoothly fade over 20 frames
            if (m.life <= 0) {
                this.machAfters.splice(index, 1);
            }
        });

        // Ghost Trail Update (Ground Pound, Grab, or Tumble specific)
        if (this.isGroundPounding || this.isSuplexGrabbing || this.isTumbling) {
            // Add a ghost copy every frame for a super smooth trail
            this.ghostAfters.unshift({
                x: this.x,
                y: this.y,
                sprite_index: this.sprite_index,
                image_index: this.image_index,
                facingDir: this.facingDir,
                isCrouching: this.isCrouching,
                isTumbling: this.isTumbling,
                alpha: 0.3,
                life: 8 // 8ú°E ˆì„E¼EEúŸ€ú´E
            });
        }

        // Update Ghost Trail Afterimages
        this.ghostAfters.forEach((m, index) => {
            m.life -= 1;
            m.alpha = (m.life / 8) * 0.3;
            if (m.life <= 0) {
                this.ghostAfters.splice(index, 1);
            }
        });

        // Collision Resolution Pass 1: Normal AABB
        entities.forEach(entity => {
            if (entity.isDestroyed) return;
            if (entity.type === 'hallway' || entity.type === 'door' || entity.type.startsWith('targetDoor') || entity.type === 'tutorialbook' || entity.type === 'slope' || entity.type === 'ladder') return;
            if (entity.type === 'left-up' || entity.type === 'right-up') return;

            // Normal AABB Support
            const resolution = Physics.resolveAABB(this, entity);
            if (resolution) {
                if (entity.type === 'oneway') {
                    // approximate previous bottom
                    const prevBottom = this.y - this.vy + this.height;
                    // Skip collision if moving up or if already inside/below
                    if (this.vy < 0 || prevBottom > entity.y + 0.1 || this.isClimbingLadder) {
                        return;
                    }
                    // Skip if resolution is not pushing the player upwards
                    if (resolution.axis !== 'y' || resolution.amount >= 0) {
                        return;
                    }
                }

                // Step Up logic: If resolved horizontally, but feet are near the top of the block, convert to vertical
                if (resolution.axis === 'x' && entity.type !== 'oneway') {
                    const overlapAtFeet = (this.y + this.height) - entity.y;
                    if (overlapAtFeet > 0 && overlapAtFeet <= 25 && this.y < entity.y) {
                        resolution.axis = 'y';
                        resolution.amount = -overlapAtFeet;
                    }
                }

                if (resolution.axis === 'y') {
                    if (resolution.amount < 0) {
                        // Ground Pound breaks blocks beneath
                        if (this.isGroundPounding && entity.type === 'destroyable') {
                            entity.destroy();
                            if (audio) audio.play('break');
                            return; // Skip collision resolution to plow through
                        }
                        // Collision on bottom (Grounded)
                        this.isGrounded = true;
                        this.standingOnEntity = entity;
                        this.vy = 0;
                        this.isWallJumping = false;
                        this.isClimbingLadder = false; // Eí”„ E¨EE
                        if (this.isGroundPounding) {
                            this.isGroundPounding = false;
                            this.isGroundPoundLand = true;
                            this.groundPoundLandTimer = 8;
                            this.requestScreenShake = 15; // Set screen shake intensity
                            if (audio) audio.playFile('sfx_groundpound', true);
                        } else {
                            this.isGroundPounding = false; // Reset GP just in case
                        }
                        this.isClimbing = false;      // Reset Climbing
                    } else if (resolution.amount > 0) {
                        // Collision on top (Head butt)
                        if (this.isClimbing) {
                            this.isClimbing = false; // Stop climbing on ceiling
                            this.vx = 0; // E½úŸ€E° EEEœì¥EEE€Eªúºˆë©´ E˜í‰ Eë„ 0
                            this.isRunning = false; // E¬E¬E° EEE E¨EE
                            this.wasRunningLastFrame = false; // E¤EEú°E ˆì„EìE E¬E¬E° E•ì EE€úµEE©E€
                            
                            // E E€ E”ì²­: E½úŸ€E  Eœì¥EEE€Eªúºˆë©´ groundpound land EEEEEEE™˜
                            this.isGroundPoundLand = true;
                            this.groundPoundLandTimer = 8;
                        }
                        if (entity.type === 'destroyable') {
                            entity.destroy();
                            if (audio) audio.play('break');
                        }
                        this.vy = 0;
                    }
                    this.y += resolution.amount;
                } else {
                    // Collision on side (Wall)
                    if (entity.type === 'destroyable' && (this.isRunning || this.isGroundPounding || this.isClimbing || this.isSuplexGrabbing)) {
                        entity.destroy();
                        if (audio) audio.play('break');
                    } else {
                        // E¬E¬E° EEEëŠ” E¡E° EEE½EEE¿E˜ì„ EEEë™E¼EEE½úŸ€E° ú¦¸E¬E°
                        if (!this.isClimbing && (this.isRunning || this.isSuplexGrabbing)) {
                            this.isClimbing = true;
                            if (this.isSuplexGrabbing) {
                                this.wallClimbGraceTimer = 10; // E¡E°EìE E˜ì–´E¨ E½E° 10ú°E ˆì„ E EE
                            }
                            this.isSuplexGrabbing = false; // E¡E° E‘ì´Eˆë‹¤E´ E½úŸ€E°EEEE™˜
                            // resolution.amount < 0 E´E´ E½E´ E¤E¸E½EEEˆìŒ -> climbSide = 1
                            this.climbSide = resolution.amount < 0 ? 1 : -1;
                            // ú´E¬ E˜í‰ Eë„E¼ E˜ì§EE±EEEë„EEEE™˜
                            this.vy = -Math.abs(this.vx);
                            if (this.vy > -8) this.vy = -8; // EœìE Eˆê¸° E±EEEë„ E´E¥ (E úŸEE¬ú±­)
                        }

                        this.isWalled = true;
                        this.isWallJumping = false;
                        this.isClimbingLadder = false; // E½Eí”„ ú·EE½EEE¿E¼E´ Eˆê¸°úµE
                        this.wallSide = resolution.amount < 0 ? 1 : -1;
                        if (!this.isClimbing) this.vx = 0;
                        this.x += resolution.amount;
                    }
                }
            }
        });

        // Collision Resolution Pass 2: Slopes
        entities.forEach(entity => {
            if (entity.isDestroyed) return;
            if (entity.type === 'left-up' || entity.type === 'right-up') {
                const slopeY = Physics.getSlopeHeight(this, entity);
                
                // If the player was grounded, allow a larger snap distance downward to prevent bouncing down slopes
                const snapUp = this.wasGrounded ? 30 : 5;
                
                if (slopeY !== null && this.y + this.height > slopeY - snapUp && this.y + this.height <= slopeY + 20) {
                    
                    // IF we already resolved AABB and are standing on a block HIGHER than this slope, ignore the slope!
                    if (this.isGrounded && this.y + this.height < slopeY - 0.1) {
                        return;
                    }
                    
                    // Ground Pound transition to slope roll
                    if (this.isGroundPounding) {
                        const speed = this.vy >= 20 ? 12 : 8;
                        this.vx = (entity.type === 'left-up') ? -speed : speed;
                        this.facingDir = (entity.type === 'left-up') ? -1 : 1;
                        this.isGroundPounding = false;
                        
                        // E•ì œë¡EE¬E´E°(Tumble) EEE EŒì… EE E’ì´(Hitbox) E‰ì‹œ E°EE
                        if (!this.isTumbling && !this.isCrouching) {
                            this.height = 23;
                            this.y += 22;
                        }
                        this.isTumbling = true;
                    }
                    this.y = slopeY - this.height;
                    this.vy = 0;
                    this.isGrounded = true;
                        this.standingOnEntity = entity;
                    this.isWallJumping = false;
                        this.isClimbingLadder = false;
                }
            }
        });

        // If climbing but no wall is detected in a slightly wider area, stop climbing or perform ledge landing
        if (this.isClimbing && !this.isWalled) {
            // Check one more time with a tiny 5px buffer to see if the wall is still there
            const buffer = 5;
            const tempX = this.x;
            this.x += this.climbSide * buffer; // Move TOWARDS the wall

            let stillTouching = false;
            let targetWall = null;

            entities.forEach(entity => {
                if (!entity.isDestroyed && entity.type !== 'hallway' && entity.type !== 'tutorialbook' && Physics.checkCollision(this, entity)) {
                    stillTouching = true;
                    targetWall = entity;
                }
            });

            this.x = tempX; // Restore original X

            if (!stillTouching) {
                // --- Ledge Landing Logic ---
                // We lost the wall. Check if we just cleared the top of it.
                let ledgeLanded = false;
                const ledgeThreshold = 30; // Max distance to snap to top

                // Find the wall we were just climbing (it should be very close horizontally)
                entities.forEach(entity => {
                    if (entity.isDestroyed || entity.type === 'hallway' || entity.type === 'tutorialbook' || entity.type === 'slope') return;

                    const isRightWall = this.climbSide === 1;
                    const wallX = isRightWall ? entity.x : entity.x + entity.width;
                    const playerEdgeX = isRightWall ? this.x + this.width : this.x;

                    // If horizontally aligned with the wall we were climbing
                    if (Math.abs(playerEdgeX - wallX) < 15) {
                        // Check if our feet (y + height) are near the top of the wall (entity.y)
                        if (this.y + this.height > entity.y - ledgeThreshold && this.y + this.height <= entity.y + 10) {
                            // Snap to the top of the platform!
                            const climbSpeed = Math.abs(this.vy);
                            this.y = entity.y - this.height;
                            this.x += this.climbSide * 15; // Move onto the platform
                            this.vy = 0;
                            this.vx = this.climbSide * climbSpeed; // E±EEEë„E¼ E˜í‰ Eë„EEEE™˜
                            this.isGrounded = true;
                        this.standingOnEntity = entity;
                            this.isClimbing = false;
                            this.isWallJumping = false;
                        this.isClimbingLadder = false;
                            ledgeLanded = true;
                        }
                    }
                });

                if (!ledgeLanded) {
                    this.isClimbing = false;
                }
            } else {
                this.isWalled = true; // Still touching the wall via buffer
            }
        }


        // Jump (Z key)
        if (!keys.actionJump) {
            this.canJump = true;
        }

        if (this.jumpBufferTimer > 0) {
            this.jumpBufferTimer--;
        }

        if (keys.actionJump && this.canJump && !this.isDrifting && !this.isDrifting1 && !this.isClimbingLadder) {
            this.jumpBufferTimer = 18; // 18 frames (0.3s) of jump buffer
            this.canJump = false; // Consume the jump press immediately
        }

        if (this.jumpBufferTimer > 0) {
            if (this.isGrounded && !this.isGroundPoundLand) {
                if (this.isCrouching) {
                    this.vy = -8;
                } else {
                    this.vy = this.jumpForce;
                }
                
                this.isGrounded = false;
        this.standingOnEntity = null;
                this.jumpBufferTimer = 0;
                this.sprite_index = 'spr_player_jump';
                this.image_index = 0;
                if (audio) audio.play('jump');
                
                // E E€ E”ì²­: Eí”„ E°Eˆì„ EEE¬EEú¶¨E¼ E”ê°€ (E¨, E¬E¬E° E‘ì—EEE˜ì˜¤E€ EŠê²E
                if (!this.isRunning && !this.isSuplexGrabbing) {
                    this.activeEffects.push({
                        type: 'spr_highjumpcloud2',
                        x: this.x + this.width / 2,
                        y: this.y + this.height,
                        image_index: 0,
                        image_speed: 0.5 // E Eˆë©”ì´EEEë„
                    });
                }
            } else if (this.isClimbing) {
                // Wall Jump (Stronger if climbing or high speed)
                this.vy = this.jumpForce * 1.2;
                this.vx = -this.wallSide * 12;
                this.isWalled = false;
                this.isClimbing = false;
                this.isDrifting = false;
                this.isDrifting1 = false; // Cancel drift on jump
                // this.isWallJumping = true; // E E€ E”ì²­: EE·¸ E©E€E¼ EE•´ ú±­EEfalseEEE E€
                this.facingDir = -this.wallSide;
                this.jumpBufferTimer = 0;
                this.sprite_index = 'spr_player_jump';
                this.image_index = 0;
                if (audio) audio.play('jump');
            } else if (this.isTumbling) {
                // Divebomb: Cancel air tumble into a normal ground pound
                this.isTumbling = false;
            this.sprite_index = 'spr_player_idle';
            this.image_speed = (this.vy !== 0) ? 0.3 : 0;
                this.isGroundPounding = true;
                this.height = 45;
                this.y -= 22; // Restore size
                
                this.vy = -10; // E‰ë©E´ Eê¸° E˜ìŒ E¸ EŒì²˜ëŸ¼ EE¡EE´EEE¨EEE™ì‘ E”ê°€
                this.vx = 0;   // E‰ë©E´ Eê¸° EEE˜í‰ E´EEEˆì¶¤
                this.jumpBufferTimer = 0;
                this.sprite_index = 'spr_player_groundpoundstart';
                this.image_index = 0;
                if (audio) audio.play('groundpound');
            }
        }

        // Variable Jump Height
        if (!this.isGrounded && this.vy < 0 && !keys.actionJump && !this.isGroundPounding && !this.isClimbing) {
            this.vy = 0;
        }

        // Tumble Fast Fall: E¬E´E° EEEˆë²½EìE E¨E´EEEEE‰ì‹œ EEE¨E´E€EE¡EE¤EE
        if (this.isTumbling && this.wasGrounded && !this.isGrounded) {
            this.vy = 10; // E¨E´E€E° Eœì‘ú±˜ëŠ” Eœê°EEë„E¼ 10E¼EEE¤EE(E E´E  EµEE•˜EE
        }

        // Determine sprite index
        if (!this.wasGrounded && this.isGrounded && !this.isClimbing && !this.isGroundPounding && !this.isGroundPoundLand && !this.isTumbling && !this.isSuplexGrabbing) {
            this.sprite_index = 'spr_player_land';
            this.image_index = 0;
            if (!this.isRunning && !this.isSuplexGrabbing) {
                this.activeEffects.push({
                    type: 'spr_landcloud',
                    x: this.x + this.width / 2,
                    y: this.y + this.height,
                    image_index: 0,
                    image_speed: 0.5
                });
                if (audio) audio.playFile('sfx_step', true); // E©E€ú±  EŒë„ EœìEE¬ E¬EE
            }
        }
        
        if (this.isTumbling) {
            this.sprite_index = 'spr_player_roll';
        } else if (!this.isGrounded && !this.isClimbing && !this.isGroundPounding && !this.isSuplexGrabbing && this.sprite_index !== 'spr_player_jump') {
            this.sprite_index = 'spr_player_fall';
        } else if (this.isGrounded && this.sprite_index !== 'spr_player_land') {
            if (Math.abs(this.vx) < 0.1 && !this.isDrifting && !this.isDrifting1 && !this.isMachSliding && !this.isGroundPounding && !this.isClimbing && !keys.actionLeft && !keys.actionRight) {
                this.sprite_index = 'spr_player_idle';
            } else if (Math.abs(this.vx) > 0 && Math.abs(this.vx) <= this.maxSpeed && !this.isRunning && !this.isCrouching && !this.isDrifting && !this.isDrifting1 && !this.isMachSliding && !this.isGroundPounding && !this.isClimbing) {
                this.sprite_index = 'spr_player_walk';
            } else if (this.isRunning && Math.abs(this.vx) > 0 && this.sprite_index !== 'spr_player_mach1' && !this.isCrouching && !this.isDrifting && !this.isDrifting1 && !this.isMachSliding && !this.isGroundPounding && !this.isClimbing) {
                this.sprite_index = 'spr_player_mach2'; // E E€ E”ì²­: Eˆí•˜ 1E¼ EŒë„ E¼E¨ mach2 E Eˆë©”ì´EEE¬E©
            }
        }
        
        if (this.sprite_index === 'spr_player_walk') {
            this.image_speed = Math.max(0.15, Math.abs(this.vx) * 0.08);
            
            // E E€ E”ì²­: E¸EEEEEë„EEEE¡€ú±´EEE¼E€ E´úª™íŠ¸ Eì„±
            if (this.isGrounded && !this.isSuplexGrabbing) {
                this.walkEffectTimer += Math.abs(this.vx);
                if (this.walkEffectTimer >= 80) { // Eˆë¬´ E¨E¬ E˜ì˜¨E¤E  ú±˜ìEEE30 -> 80E¼EEEˆë„ EìE
                    this.walkEffectTimer = 0;
                    this.activeEffects.push({
                        type: 'spr_cloudeffect',
                        x: this.x + this.width / 2,
                        y: this.y + this.height,
                        image_index: 0,
                        image_speed: 0.5, // E Eˆë©”ì´EEEë„
                        scale: 1.0 // ú¬E° E•ìE (0.2 -> 1.0)
                    });
                    if (audio) audio.playFile('sfx_step', true); // Eœê±¸EEEŒë¦¬ E¬EE
                }
            }
        } else if (this.sprite_index === 'spr_player_idle') {
            this.image_speed = 0.4;
        } else if (this.sprite_index === 'spr_player_fall') {
            this.image_speed = 0.4;
        } else if (this.sprite_index === 'spr_player_jump') {
            this.image_speed = 0.4; // Eí”„ E Eˆë©”ì´EEEë„
        } else if (this.sprite_index === 'spr_player_land') {
            this.image_speed = 0.45; // E E€ E”ì²­: E©E€ E Eˆë©”ì´EEEë„ E¬E°EE
        } else if (this.sprite_index === 'spr_player_roll') {
            this.image_speed = Math.max(0.4, Math.abs(this.vx) * 0.06); // E¬E´E° E Eˆë©”ì´EEEë„ (Eë„EEEE¡€)
        } else if (this.sprite_index === 'spr_player_groundpoundstart') {
            this.image_speed = 0.55; // 30ms per frame (at 60fps)
        } else if (this.sprite_index === 'spr_player_groundpound') {
            this.image_speed = 0.55; // 30ms per frame (at 60fps)
        } else if (this.sprite_index === 'spr_player_mach2') {
            // E E€ E”ì²­: Eë„EEE°E¼ E Eˆë©”ì´EEEë„E€ E¤E´EE(E E¼E˜ë¡EE Eˆë©”ì´E˜ë„ E E´EE
            this.image_speed = 0.25 + (Math.abs(this.vx) * 0.04); 
            
            if (this.isGrounded) {
                this.runEffectTimer += Math.abs(this.vx);
                if (this.runEffectTimer >= 150) { // Eì„± E¼E° E€ú«­ EìE
                    this.runEffectTimer = 0;
                    
                    const absSpeed = Math.abs(this.vx);
                    let effectType = 'spr_dashcloud'; // mach1, mach2
                    let offset = 0; // mach1, 2EEE•ì¤‘ì•™
                    if (absSpeed >= 12) {
                        effectType = 'spr_superdashcloud'; // mach3
                        offset = 40; // mach3E¼ EŒë§EE± E¤EE40ú°½E€ E¼E°
                    }
                    
                    this.activeEffects.push({
                        type: effectType,
                        x: this.x + this.width / 2 - (this.facingDir * offset),
                        y: this.y + this.height,
                        image_index: 0,
                        image_speed: 0.5,
                        scale: 1.0,
                        facingDir: this.facingDir
                    });
                }
            }
        }

        if (this.sprite_index !== '') {
            this.image_index += this.image_speed;
        }

        // E E€ E”ì²­: Eí”„ E Eˆë©”ì´EEE¬Eì´ EE£Œë˜E´ E¨E´E€EEE Eˆë©”ì´E˜ìœ¼EEEë™ EE™˜
        if (this.sprite_index === 'spr_player_jump' && this.image_index >= this.sprites.spr_player_jump.length) {
            this.sprite_index = 'spr_player_fall';
            this.image_index = 0;
        }

        // E©E€ E Eˆë©”ì´EEE¬Eì´ EE£Œë˜E´ idle E Eˆë©”ì´E˜ìœ¼EEEë™ EE™˜
        if (this.sprite_index === 'spr_player_land' && this.image_index >= this.sprites.spr_player_land.length) {
            this.sprite_index = 'spr_player_idle';
            this.image_index = 0;
        }

        // E‰ë©E´ Eê¸° Eœì‘ E Eˆë©”ì´E˜ì´ EE£Œë˜E´ E´E¤Eê¸° E Eˆë©”ì´E˜ìœ¼EEEE™˜
        if (this.sprite_index === 'spr_player_groundpoundstart' && this.image_index >= this.sprites.spr_player_groundpoundstart.length) {
            this.sprite_index = 'spr_player_groundpound';
            this.image_index = 0;
        }

        // Manage Looping Running Sounds
        if (audio) {
            const absSpeed = Math.abs(this.vx);
            if (this.isRunning && !this.isMachSliding && !this.isDrifting && !this.isDrifting1 && !this.isWalled && !this.isClimbing && !this.isSuplexGrabbing && !this.isTumbling) {
                if (absSpeed >= 12) {
                    audio.playFile('mach3');
                    audio.stopFile('mach2');
                } else if (absSpeed >= 8) {
                    if (this.isGrounded) {
                        audio.playFile('mach2');
                    } else {
                        audio.stopFile('mach2');
                    }
                    audio.stopFile('mach3');
                } else {
                    audio.stopFile('mach2');
                    audio.stopFile('mach3');
                }
            } else {
                audio.stopFile('mach2');
                audio.stopFile('mach3');
            }
            
            // E¡E°E€ EE£Œë˜E´ EŒë¦¬EEEŠì–´EE
            if (!this.isSuplexGrabbing) {
                audio.stopFile('sfx_suplexdash');
            }
        }

        // EµE‘ì—EEE¡E° EŒì§EEEEE— E¿E˜ë‹¤E´ E‰ì‹œ EŒì§EEE£E
        if (this.isSuplexGrabbing && !this.wasGrounded && this.isGrounded) {
            this.isSuplexGrabbing = false;
            this.suplexGrabTimer = 0;
        }
        // E´EEú°E ˆì„ ú¤ EEE E€E¥
        this.prevKeysDown = keys.actionDown;
    }

    render(ctx) {
        if (!this.tintCanvas) {
            this.tintCanvas = document.createElement('canvas');
            this.tintCanvas.width = 100;
            this.tintCanvas.height = 100;
            this.tintCtx = this.tintCanvas.getContext('2d');
        }

        const drawAfterImage = (m, isMach) => {
            ctx.globalAlpha = m.alpha;
            let imgToDraw = null;
            
            if (m.sprite_index === 'spr_player_idle') {
                const frames = this.sprites.spr_player_idle;
                const frame = frames[Math.floor(m.image_index) % frames.length];
                if (frame && frame.complete && frame.naturalWidth > 0) {
                    imgToDraw = frame;
                }
            } else if (m.sprite_index === 'spr_player_walk') {
                const frames = this.sprites.spr_player_walk;
                const frame = frames[Math.floor(m.image_index) % frames.length];
                if (frame && frame.complete && frame.naturalWidth > 0) {
                    imgToDraw = frame;
                }
            } else if (m.sprite_index === 'spr_player_fall') {
                const frames = this.sprites.spr_player_fall;
                const frame = frames[Math.floor(m.image_index) % frames.length];
                if (frame && frame.complete && frame.naturalWidth > 0) {
                    imgToDraw = frame;
                }
            } else if (m.sprite_index === 'spr_player_jump') {
                const frames = this.sprites.spr_player_jump;
                let frameIndex = Math.floor(m.image_index);
                if (frameIndex >= frames.length) frameIndex = frames.length - 1;
                const frame = frames[frameIndex];
                if (frame && frame.complete && frame.naturalWidth > 0) {
                    imgToDraw = frame;
                }
            } else if (m.sprite_index === 'spr_player_land') {
                const frames = this.sprites.spr_player_land;
                let frameIndex = Math.floor(m.image_index);
                if (frameIndex >= frames.length) frameIndex = frames.length - 1;
                const frame = frames[frameIndex];
                if (frame && frame.complete && frame.naturalWidth > 0) {
                    imgToDraw = frame;
                }
            } else if (m.sprite_index === 'spr_player_roll') {
                const frames = this.sprites.spr_player_roll;
                const frame = frames[Math.floor(m.image_index) % frames.length];
                if (frame && frame.complete && frame.naturalWidth > 0) {
                    imgToDraw = frame;
                }
            } else if (m.sprite_index === 'spr_player_mach2') {
                const frames = this.sprites.spr_player_mach2;
                const frame = frames[Math.floor(m.image_index) % frames.length];
                if (frame && frame.complete && frame.naturalWidth > 0) {
                    imgToDraw = frame;
                }
            } else if (m.sprite_index === 'spr_player_groundpoundstart') {
                const frames = this.sprites.spr_player_groundpoundstart;
                let frameIndex = Math.floor(m.image_index);
                if (frameIndex >= frames.length) frameIndex = frames.length - 1;
                const frame = frames[frameIndex];
                if (frame && frame.complete && frame.naturalWidth > 0) {
                    imgToDraw = frame;
                }
            } else if (m.sprite_index === 'spr_player_groundpound') {
                const frames = this.sprites.spr_player_groundpound;
                const frame = frames[Math.floor(m.image_index) % frames.length];
                if (frame && frame.complete && frame.naturalWidth > 0) {
                    imgToDraw = frame;
                }
            } else if (m.sprite_index === 'spr_player_taunt') {
                const frames = this.sprites.spr_player_taunt;
                const frame = frames[Math.floor(m.image_index) % frames.length];
                if (frame && frame.complete && frame.naturalWidth > 0) {
                    imgToDraw = frame;
                }
            } else if (this.mask_image && this.mask_image.complete && this.mask_image.naturalWidth > 0) {
                imgToDraw = this.mask_image;
            }

            if (imgToDraw) {
                ctx.save();
                ctx.translate(m.x + this.width / 2, m.y + this.height / 2);
                if (m.facingDir === -1) ctx.scale(-1, 1);

                if (isMach && m.color) {
                    this.tintCtx.clearRect(0, 0, 100, 100);
                    // 1. Eë˜ E´E¸E€ E¸E¬E°
                    this.tintCtx.globalCompositeOperation = 'source-over';
                    this.tintCtx.drawImage(imgToDraw, 0, 0, 100, 100);
                    
                    // 2. source-inE¼EEE¤E¨E£EEE¨EEm.color)E¼EEEEš°E°
                    this.tintCtx.globalCompositeOperation = 'source-in';
                    this.tintCtx.fillStyle = m.color;
                    this.tintCtx.fillRect(0, 0, 100, 100);
                    
                    // 3. multiplyEEEë˜ E´E¸E€E¼ E¤EEE®E´EŒì›Œ E€E€EEE¤E½E  E´E´ú±˜ê¸°
                    this.tintCtx.globalCompositeOperation = 'multiply';
                    this.tintCtx.drawImage(imgToDraw, 0, 0, 100, 100);
                    
                    // Eë˜ E¤E•ìœ¼EEEµE¬
                    this.tintCtx.globalCompositeOperation = 'source-over';
                    
                    const offsetY = (m.isCrouching || m.isTumbling) ? -68.5 : -57.5;
                    ctx.drawImage(this.tintCanvas, -51, offsetY, 100, 100);
                } else {
                    const offsetY = (m.isCrouching || m.isTumbling) ? -68.5 : -57.5;
                    ctx.drawImage(imgToDraw, -51, offsetY, 100, 100);
                }
                ctx.restore();
            } else {
                ctx.fillStyle = m.color || this.color;
                // m doesn't store width/height, but for colored blocks we can assume they match current state or just draw fixed box
                const h = (m.isCrouching || m.isTumbling) ? 23 : 45;
                ctx.fillRect(m.x, m.y, this.width, h);
            }
        };

        // Draw Mach Afterimages (with flickering effect)
        this.machAfters.forEach((m, index) => {
            // Flicker precisely every 3 frames (all afterimages blink together)
            const isFlickering = Math.floor(this.frameCount / 3) % 2 === 0;
            if (isFlickering) {
                drawAfterImage(m, true);
            }
        });

        // Draw Ghost Trail (Smooth fade)
        this.ghostAfters.forEach(m => {
            drawAfterImage(m, false);
        });

        // Reset globalAlpha before drawing effects so they don't inherit afterimage transparency
        ctx.globalAlpha = 1.0;

        // Draw and update active effects
        for (let i = this.activeEffects.length - 1; i >= 0; i--) {
            const ef = this.activeEffects[i];
            const frames = this.effectSprites[ef.type];
            if (frames && frames.length > 0) {
                const frameIndex = Math.floor(ef.image_index);
                if (frameIndex < frames.length) {
                    const img = frames[frameIndex];
                    if (img && img.complete && img.naturalWidth > 0) {
                        ctx.save();
                        // E°E€Eì„ x E‘ì•™, y E”ë‹¥E¼EEE¡E°
                        ctx.translate(ef.x, ef.y);
                        if (ef.facingDir === -1) {
                            ctx.scale(-1, 1);
                        }
                        const scale = ef.scale || 1.0;
                        const w = img.naturalWidth * scale;
                        const h = img.naturalHeight * scale;
                        ctx.drawImage(img, -w/2, -h, w, h);
                        ctx.restore();
                    }
                    ef.image_index += ef.image_speed;
                } else {
                    this.activeEffects.splice(i, 1);
                }
            } else {
                this.activeEffects.splice(i, 1);
            }
        }

        ctx.globalAlpha = 1.0;

        // Draw Player
        ctx.save();

        if (this.isNoClip) {
            ctx.globalAlpha = 0.5; // Phantom effect
        }

        if (this.sprite_index === 'spr_player_idle') {
            const frames = this.sprites.spr_player_idle;
            const frameIndex = Math.floor(this.image_index) % frames.length;
            const img = frames[frameIndex];
            
            if (img && img.complete && img.naturalWidth > 0) {
                const drawX = this.x;
                const drawY = this.y;
                
                // Sprite is 100x100, mask bounding box is X:38, Y:35, W:26, H:45
                // Center of hitbox relative to the sprite top-left: X=51, Y=57.5 (or 68.5 if crouched/tumbled)
                // EŒìEEEú°½E€EEE¸ú±EEë¦­ú ° ú¹ë ¤EEE©E€E¼ EE•´ EE¹EE˜ì˜¬E¼
                ctx.translate(Math.round(drawX + this.width / 2), Math.round(drawY + this.height / 2));
                if (this.facingDir === -1) {
                    ctx.scale(-1, 1);
                }
                const offsetY = (this.isCrouching || this.isTumbling) ? -68.5 : -57.5;
                ctx.drawImage(img, -51, offsetY, 100, 100);
            }
        } else if (this.sprite_index === 'spr_player_walk') {
            const frames = this.sprites.spr_player_walk;
            const frameIndex = Math.floor(this.image_index) % frames.length;
            const img = frames[frameIndex];
            if (img && img.complete && img.naturalWidth > 0) {
                const drawX = this.x;
                const drawY = this.y;
                
                ctx.translate(Math.round(drawX + this.width / 2), Math.round(drawY + this.height / 2));
                if (this.facingDir === -1) {
                    ctx.scale(-1, 1);
                }
                const offsetY = (this.isCrouching || this.isTumbling) ? -68.5 : -57.5;
                ctx.drawImage(img, -51, offsetY, 100, 100);
            }
        } else if (this.sprite_index === 'spr_player_fall') {
            const frames = this.sprites.spr_player_fall;
            const frameIndex = Math.floor(this.image_index) % frames.length;
            const img = frames[frameIndex];
            if (img && img.complete && img.naturalWidth > 0) {
                const drawX = this.x;
                const drawY = this.y;
                
                ctx.translate(Math.round(drawX + this.width / 2), Math.round(drawY + this.height / 2));
                if (this.facingDir === -1) {
                    ctx.scale(-1, 1);
                }
                const offsetY = (this.isCrouching || this.isTumbling) ? -68.5 : -57.5;
                ctx.drawImage(img, -51, offsetY, 100, 100);
            }
        } else if (this.sprite_index === 'spr_player_jump') {
            const frames = this.sprites.spr_player_jump;
            // Stop at the last frame so it doesn't loop forever if intended, but let's loop by default
            let frameIndex = Math.floor(this.image_index);
            if (frameIndex >= frames.length) {
                frameIndex = frames.length - 1; // Eˆì§€EEú°E ˆì„EìE Eˆì¶”ê²E(Eí”„ Eì„¸ E E€)
            }
            const img = frames[frameIndex];
            if (img && img.complete && img.naturalWidth > 0) {
                const drawX = this.x;
                const drawY = this.y;
                
                ctx.translate(Math.round(drawX + this.width / 2), Math.round(drawY + this.height / 2));
                if (this.facingDir === -1) {
                    ctx.scale(-1, 1);
                }
                const offsetY = (this.isCrouching || this.isTumbling) ? -68.5 : -57.5;
                ctx.drawImage(img, -51, offsetY, 100, 100);
            }
        } else if (this.sprite_index === 'spr_player_land') {
            const frames = this.sprites.spr_player_land;
            let frameIndex = Math.floor(this.image_index);
            if (frameIndex >= frames.length) {
                frameIndex = frames.length - 1; // Eˆì§€EEú°E ˆì„ E E€ (EE™˜ EE¹Œì§€)
            }
            const img = frames[frameIndex];
            if (img && img.complete && img.naturalWidth > 0) {
                const drawX = this.x;
                const drawY = this.y;
                
                ctx.translate(Math.round(drawX + this.width / 2), Math.round(drawY + this.height / 2));
                if (this.facingDir === -1) {
                    ctx.scale(-1, 1);
                }
                const offsetY = (this.isCrouching || this.isTumbling) ? -68.5 : -57.5;
                ctx.drawImage(img, -51, offsetY, 100, 100);
            }
        } else if (this.sprite_index === 'spr_player_roll') {
            const frames = this.sprites.spr_player_roll;
            const frameIndex = Math.floor(this.image_index) % frames.length;
            const img = frames[frameIndex];
            if (img && img.complete && img.naturalWidth > 0) {
                const drawX = this.x;
                const drawY = this.y;
                
                ctx.translate(Math.round(drawX + this.width / 2), Math.round(drawY + this.height / 2));
                if (this.facingDir === -1) {
                    ctx.scale(-1, 1);
                }
                const offsetY = (this.isCrouching || this.isTumbling) ? -68.5 : -57.5;
                ctx.drawImage(img, -51, offsetY, 100, 100);
            }
        } else if (this.sprite_index === 'spr_player_mach2') {
            const frames = this.sprites.spr_player_mach2;
            const frameIndex = Math.floor(this.image_index) % frames.length;
            const img = frames[frameIndex];
            if (img && img.complete && img.naturalWidth > 0) {
                const drawX = this.x;
                const drawY = this.y;
                
                ctx.translate(Math.round(drawX + this.width / 2), Math.round(drawY + this.height / 2));
                if (this.facingDir === -1) {
                    ctx.scale(-1, 1);
                }
                const offsetY = (this.isCrouching || this.isTumbling) ? -68.5 : -57.5;
                ctx.drawImage(img, -51, offsetY, 100, 100);
            }
        } else if (this.sprite_index === 'spr_player_groundpoundstart') {
            const frames = this.sprites.spr_player_groundpoundstart;
            let frameIndex = Math.floor(this.image_index);
            if (frameIndex >= frames.length) {
                frameIndex = frames.length - 1; 
            }
            const img = frames[frameIndex];
            if (img && img.complete && img.naturalWidth > 0) {
                const drawX = this.x;
                const drawY = this.y;
                
                ctx.translate(Math.round(drawX + this.width / 2), Math.round(drawY + this.height / 2));
                if (this.facingDir === -1) {
                    ctx.scale(-1, 1);
                }
                const offsetY = (this.isCrouching || this.isTumbling) ? -68.5 : -57.5;
                ctx.drawImage(img, -51, offsetY, 100, 100);
            }
        } else if (this.sprite_index === 'spr_player_groundpound') {
            const frames = this.sprites.spr_player_groundpound;
            const frameIndex = Math.floor(this.image_index) % frames.length;
            const img = frames[frameIndex];
            if (img && img.complete && img.naturalWidth > 0) {
                const drawX = this.x;
                const drawY = this.y;
                
                ctx.translate(Math.round(drawX + this.width / 2), Math.round(drawY + this.height / 2));
                if (this.facingDir === -1) {
                    ctx.scale(-1, 1);
                }
                const offsetY = (this.isCrouching || this.isTumbling) ? -68.5 : -57.5;
                ctx.drawImage(img, -51, offsetY, 100, 100);
            }
        } else if (this.sprite_index === 'spr_player_taunt') {
            const frames = this.sprites.spr_player_taunt;
            let frameIndex = Math.floor(this.image_index);
            if (frameIndex >= frames.length) frameIndex = frames.length - 1; // Eˆì EE¥EE
            const img = frames[frameIndex];
            if (img && img.complete && img.naturalWidth > 0) {
                const drawX = this.x;
                const drawY = this.y;
                
                ctx.translate(Math.round(drawX + this.width / 2), Math.round(drawY + this.height / 2));
                if (this.facingDir === -1) {
                    ctx.scale(-1, 1);
                }
                const offsetY = (this.isCrouching || this.isTumbling) ? -68.5 : -57.5;
                ctx.drawImage(img, -51, offsetY, 100, 100);
            }
        } else {
            let pColor = this.color;
            if (this.isGroundPounding) pColor = this.color; // Match cyan aesthetic for GP
            if (this.isDrifting || this.isDrifting1) pColor = '#ffff00'; // Yellow for drifting
            if (this.isMachSliding) pColor = this.machSlideColor;

            if (this.mask_image && this.mask_image.complete && this.mask_image.naturalWidth > 0) {
                const drawX = this.x;
                const drawY = this.y;
                ctx.translate(Math.round(drawX + this.width / 2), Math.round(drawY + this.height / 2));
                if (this.facingDir === -1) ctx.scale(-1, 1);
                ctx.drawImage(this.mask_image, -51, -57.5, 100, 100);
            } else {
                ctx.fillStyle = pColor;
                ctx.fillRect(Math.round(this.x), Math.round(this.y), this.width, this.height);
            }

            // Eyes/Face to show direction
            ctx.fillStyle = 'white';
            const eyeX = this.facingDir >= 0 ? this.x + 20 : this.x + 5;
            ctx.fillRect(Math.round(eyeX), Math.round(this.y + 10), 5, 5);
        }
        ctx.restore();

        // E”ë²E¹EEEEEE úµ•ì¸E©: ú°Œë ˆì´E´ E¸E¬ EE— ú´E¬ EEE ú­œì‹œ
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        let debugState = this.state; // 'normal', 'crouch', 'tumble'
        if (this.isGroundPounding) debugState = 'groundpound';
        else if (this.isGroundPoundLand) debugState = 'groundpound land';
        else if (this.isClimbing) debugState = 'climbing';
        else if (this.isMachSliding) debugState = 'machslide';
        else if (this.isDrifting || this.isDrifting1) debugState = 'drifting';
        else if (this.isSuplexGrabbing) debugState = 'suplexgrab';
        
        if (this.sprite_index) {
            debugState += ` [${this.sprite_index}]`;
        }
        
        // E°E½EEE´EEE”ì•„E¼E´ E€E¨E€ EEEEE´EE‹ˆE¤.
        const textWidth = ctx.measureText(debugState).width;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(this.x + this.width / 2 - textWidth / 2 - 2, this.y - 22, textWidth + 4, 16);
        ctx.fillStyle = 'white';
        ctx.fillText(debugState, this.x + this.width / 2, this.y - 10);
    }
}


