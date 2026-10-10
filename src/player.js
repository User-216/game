

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
        this.isHoldingEnemy = false;
        this.heldEnemy = null;
        this.kickWindupTimer = 0;
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
        this.machEffectIndex = 0;
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
            spr_player_mach2: [],
            spr_player_mach3: [],
            spr_player_mach3jump: [],
            spr_player_rollgetup: [],
            spr_player_climbwall: [],
            spr_player_groundpoundland: [],
            spr_player_suplexgrab: []
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

        // Load land sprite (4 frames -> ・溢ｧ・・嵓・�溢桷 ・懋ｱｰ ・肥ｲｭ・ｼ・・3嵓・�溢桷・・・罹糖)
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
        for (let i = 1; i <= 11; i++) {
            let img = new Image();
            img.src = `player/spr_player_rollgetup/spr_playerT_rollgetup${i}.png`;
            this.sprites.spr_player_rollgetup.push(img);
        }
        // Load climbwall sprite
        for (let i = 1; i <= 8; i++) {
            let img = new Image();
            img.src = `player/spr_player_climbwall/spr_playerT_climbwall${i}.png`;
            this.sprites.spr_player_climbwall.push(img);
        }
        // Load groundpoundland sprite
        for (let i = 1; i <= 4; i++) {
            let img = new Image();
            img.src = `player/spr_player_groundpoundland/spr_playerT_groundpoundland${i}.png`;
            this.sprites.spr_player_groundpoundland.push(img);
        }
        // Load suplexgrab sprite
        for (let i = 1; i <= 14; i++) {
            let img = new Image();
            img.src = `player/spr_player_suplexgrab/spr_playerT_suplexgrab${i}.png`;
            this.sprites.spr_player_suplexgrab.push(img);
        }

        // Load mach2 sprite (7 frames)
        for (let i = 1; i <= 7; i++) {
            let img = new Image();
            img.src = `player/spr_player_mach2/spr_playerT_mach${i}.png`;
            this.sprites.spr_player_mach2.push(img);
        }
        
        // Load mach3 sprite (10 frames)
        for (let i = 0; i <= 9; i++) {
            let img = new Image();
            img.src = `player/spr_player_mach3/spr_playerT_mach3_${i}.png`;
            this.sprites.spr_player_mach3.push(img);
        }
        
        // Load mach3jump sprite (9 frames)
        for (let i = 1; i <= 9; i++) {
            let img = new Image();
            img.src = `player/spr_player_mach3jump/spr_player_mach3_jump${i}.png`;
            this.sprites.spr_player_mach3jump.push(img);
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
        
        this.effectSprites.spr_mach_effect = [];
        for (let i = 1; i <= 10; i++) {
            let img = new Image();
            img.src = `effect/spr_mach_effect/spr_mach_effect${i}.png`;
            this.effectSprites.spr_mach_effect.push(img);
        }
        
        this.activeEffects = [];
        this.machColorIndex = 0;
        this.machEffectIndex = 0;
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
        this.paletteManager = typeof PaletteManager !== 'undefined' ? new PaletteManager() : null;
    }

    update(keys, entities, audio) {
        this.frameCount++;
        this.wasGrounded = this.isGrounded;

        if (this.isTaunting) {
            this.tauntTimer--;
            if (this.tauntTimer <= 0) {
                this.isTaunting = false;
            }
            return; // ・・ｰ・・卓乱・・・ｼ・ｬ ・肥ｧ・ｳｼ ・・・ ・・魂・ｴ孖ｸ・ｼ ・・�・梭 ・菩ｧ (・ｬ・ｬ・ｰ ・・・ ・ｱ ・・ｲｽ ・�・)
        } else if (keys.actionTaunt && !this.prevKeysTaunt) {
            this.isTaunting = true;
            this.tauntTimer = 20;
            
            // ・�・ ・肥ｲｭ: ・・ｰ・・・spr_player_taunt・・・・ｽ ・・8・・・・・罹墾 嵓・�溢桷 ・�夋・
            this.sprite_index = 'spr_player_taunt';
            this.image_index = Math.floor(Math.random() * 8);
            this.image_speed = 0; // 嵓・�溢桷 ・�・・
            
            if (audio) audio.play('taunt'); 
            
            this.activeEffects.push({
                type: 'spr_taunteffect',
                x: this.x + this.width / 2,
                y: this.y + this.height,
                image_index: 0,
                image_speed: 0.45 
            });
            this.prevKeysTaunt = true; // ・・・・ｩ・・・・･ｸ ・・・ ・・･
            return; // ・・ｰ・・懍梠 嵓・�溢桷・・・・魂・ｴ孖ｸ ・菩ｧ
        }
        
        this.prevKeysTaunt = keys.actionTaunt;

        let isCurrentlyRunning = !!keys.actionRun;
        
        // ・ｵ・卓乱・罹株 ・ｬ・ｬ・ｰ ・ｨ・・・一ｰ (・ｴ・・嵓・�溢桷・・・ｬ・ｬ・� ・溢来・､・ｴ ・菩�・・�・)
        // ・ｨ, ・ｽ夋・ｰ ・卓攵 ・誤株 ・溢匣・・・ｬ・ｬ・ｰ 墲､・ｼ ・南愍・ｴ ・餓亨 ・ｨ・誤据・・｡・﨑ｨ
        if (!this.isGrounded && this.wasRunningLastFrame && !this.isClimbing) {
            isCurrentlyRunning = true;
        }
        
        // ・・〓・ｬ・� ・溢揆 ・誤株 ・ｬ・ｬ・ｰ ・一ｰ
        if (this.isCrouching) {
            isCurrentlyRunning = false;
        }

        // (・ｴ・・乱 ・壱腰 '・ｵ・卓乱・・・ｬ・ｬ・ｰ ・溢ｶ・・・・・搆' ・懦復 﨑ｴ・・

        // ・ｵ・卓乱・罹株 ・壱｡・・ｬ・ｬ・ｰ・ｼ ・懍梠﨑� ・・・・愍・・ ・ｴ・ｸ ・鷺巡・ ・逸葺 ・ｴ・・擽・ｴ ・ｬ・ｬ・ｰ ・ｬ・・嵭溢圸
        if (this.isGroundPounding) {
            isCurrentlyRunning = false;
        } else if (!this.isGrounded && !this.wasRunningLastFrame && !this.isClimbing) {
            if (Math.abs(this.vx) < this.machThreshold) {
                isCurrentlyRunning = false;
            }
        }

        // ・ｬ・ｴ・ｰ ・卓乱・・・ｬ・ｬ・ｰ ・・・ ・菩�・・�・
        if (this.isTumbling) {
            isCurrentlyRunning = true;
        }

        // (・｡・ｰ ・・・ｬ・ｬ・ｰ ・ｨ・・・罷糖 ・懋ｱｰ)


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
            if (entity.type === 'ladder' && !entity.isDestroyed && Physics.checkCollision({x: this.x, y: this.y, width: this.width, height: this.height + 2}, entity)) {
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
                if (keys.actionUp && this.vy >= 0) { canAttach = true; }
                else if (keys.actionDown && this.isGrounded && this.standingOnEntity && this.standingOnEntity.type === 'oneway') { 
                    canAttach = true; 
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
            this.sprite_index = 'spr_player_idle';
            this.image_speed = (this.vy !== 0) ? 0.3 : 0;
            
            this.vx = 0;
            if (keys.actionUp) this.vy = -5;
            else if (keys.actionDown) this.vy = 10;
            else this.vy = 0;
            
            if (keys.actionJump && !this.prevKeysJump) {
                this.isClimbingLadder = false;
                this.vy = this.jumpForce;
                if (keys.actionLeft) this.vx = -4;
                if (keys.actionRight) this.vx = 4;
                if (audio) audio.play('jump');
            }
            
            // Fix horizontally to ladder center
            this.x += ((overlappingLadder.x + overlappingLadder.width / 2) - (this.x + this.width / 2)) * 0.2;
        }

        // Running cancel triggers: ・・乱・・・ｬ・ｬ・・・・Shift・ｼ ・ｼ・ｴ ・ｬ・ｼ・ｴ・・・罹徐 (・ｬ・ｴ・ｰ ・卓乱・・・懍匣)
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

        // Suplex Grab ・ｨ・・・懍ｧ・ ・護ｧ・・ｩ嵂･・ｼ ・俯劇 ・ｩ嵂･墲､・ｼ ・・･ｴ・ｴ ・餓亨 ・ｨ・・
        if (this.isSuplexGrabbing) {
            if ((this.facingDir === 1 && keys.actionLeft) || (this.facingDir === -1 && keys.actionRight)) {
                this.isSuplexGrabbing = false;
                this.vx = 0; // ・ｵ・・・・・・・ｴ・・擽 ・餓亨 ・菩ｧ (・・ｱ ・懋ｱｰ)
            }
        }

        // Horizontal Movement (・罹ｦｬ嵓・敢・・・逸葺 ・ｬ・ｼ・ｴ・・・卓擽 ・・巨 ・誤ｧ・・ｰ・・・・･)
        if (!this.isDrifting && !this.isDrifting1 && !this.isMachSliding && !this.isClimbing && !this.isWallJumping && !this.isClimbingLadder && this.kickWindupTimer <= 0 && (this.kickKnockbackTimer || 0) <= 0) {
            let effLeft = keys.actionLeft;
            let effRight = keys.actionRight;
            
            // ・ｬ・ｴ・ｰ(tumble) ・卓乱・・・護垈 ・ｩ嵂･ ・・劍 ・一ｰ (・・ｱ ・�・)
            if (this.isTumbling) {
                effLeft = false;
                effRight = false;
            }
            
            // ・ｵ・卓乱・・・�・ｴ・・・ｬ・ｬ・・・卓擽・ｴ ・ｩ嵂･ ・・劍(墲､ ・・�･)・・・ｴ・懦葺・� 嶸・椪 ・ｩ嵂･・・・菩�・・�・ (・､・ｴ・誤ｰ､ ・卓乱・・・溢匣)
            if (!this.isGrounded && this.isRunning && Math.abs(this.vx) >= 6 && !this.isGroundPounding) {
                effLeft = this.facingDir === -1;
                effRight = this.facingDir === 1;
            }
            // ・ｬ・ｬ・ｰ ・卓攤・ｰ ・ｩ嵂･墲､・ｼ ・・・・･ｴ・� ・壱共・ｴ ・罷攵・ｴ・・・ｩ嵂･・ｼ・・・尖徐 ・ｬ・ｬ・ｰ (・､・ｴ・誤ｰ､ ・卓乱・・・尖徐 ・・ｧ・・溢ｧ)
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
                    // ・ｷ・・・・・ｩ嵂･・・・ｾ・・・・ ・ｸ・・洳・・ ・伎ｳ� ・餓亨 ・鷺巡・ｼ ・俯劇・・・､・卓搆
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
                    // ・ｷ・・・・・ｩ嵂･・・・ｾ・・・・ ・ｸ・・洳・・ ・伎ｳ� ・餓亨 ・鷺巡・ｼ ・俯劇・・・､・卓搆
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
                // ・ｩ嵂･墲､・ｼ ・・･ｴ・ ・喜葺・・・・
                if (this.isTumbling || this.isSuplexGrabbing) {
                    // ・ｬ・ｴ・ｰ/・｡・ｰ ・護ｧ・・卓乱・・・川・ ・・擽 ・鷺巡 ・・�・・�・
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
            // ・罹ｦｬ嵓・敢・ ・晤あ ・・孖・ｴ・俾ｰ・・ｩ嵂･ ・・･ (嶸・椪 ・鷺巡・・・俯劇 ・ｩ嵂･)
            this.driftTargetDir = this.vx > 0 ? -1 : 1;
            if (audio) {
                audio.stopFile('mach2');
                audio.stopFile('mach3');
                audio.playFile('machslideboost', true);
            }
        }

        if (this.isDrifting) {
            // ・鷺巡・ｼ 0.4・ｩ ・・牟・､・・﨑ｨ (・ｩ嵂･・・・樌ｶｰ・・
            if (this.vx > 0) {
                this.vx -= 0.4;
                if (this.vx < 0) this.vx = 0;
            } else if (this.vx < 0) {
                this.vx += 0.4;
                if (this.vx > 0) this.vx = 0;
            }

            this.driftTimer--;

            // ・・｣・・ｰ・ｴ: 35嵓・�溢桷・ｴ ・ｨ・・・・ｬ・� + ・・乱 ・ｿ・・・壱株 ・・・・ｬ・ｼ 﨑ｨ
            if (this.driftTimer <= 0 && this.isGrounded) {
                this.isDrifting = false;
                // ・罹ｦｬ嵓・敢 ・・｣・・・・ｩ岺・・ｩ嵂･・ｼ・・・鷺巡・ｼ 12・・・､・・
                this.vx = this.driftTargetDir * 12;
                this.facingDir = this.driftTargetDir;
            }
        }

        if (this.isDrifting1) {
            // ・鷺巡・ｼ 0.4・ｩ ・・牟・､・・﨑ｨ (・倣紛・・・ｩ・晤劇・・
            if (this.vx > 0) {
                this.vx -= 0.4;
                if (this.vx < 0) this.vx = 0;
            } else if (this.vx < 0) {
                this.vx += 0.4;
                if (this.vx > 0) this.vx = 0;
            }

            this.driftTimer--;

            // ・・｣・・ｰ・ｴ: 35嵓・�溢桷・ｴ ・ｨ・・・・ｬ・� + ・・乱 ・ｿ・・・壱株 ・・・・ｬ・ｼ 﨑ｨ
            if (this.driftTimer <= 0 && this.isGrounded) {
                this.isDrifting1 = false;
                // DRIFTING1 ・・｣・・・・ｩ岺・・ｩ嵂･・ｼ・・・鷺巡・ｼ 8・・・､・・
                this.vx = this.driftTargetDir * 8;
                this.facingDir = this.driftTargetDir;
            }
        }

        // Mach Sliding Logic
        if (this.isMachSliding) {
            this.vx *= this.machSlideFriction;

            // ・鷺巡・ ・ｮ・・ｧ・ｰ・・・・乱・・・ｨ・ｴ・・ｴ ・・｣・(・尖株 ・ｬ・ｩ・川攪 ・､・ｸ ・ｰ・・
            if (Math.abs(this.vx) < 1.5) {
                this.isMachSliding = false;
            }
        }

        const targetMaxSpeed = isCurrentlyRunning ? this.runMaxSpeed : this.maxSpeed;

        // Clamp speed (・逸葺 ・ｬ・ｼ・ｴ・罹ｘ ・｡・ｰ, ・ｬ・ｴ・ｰ, ・・ｰ碕ｸｰ ・卓乱・・增ｴ・ｨ嵓・・晤楫)
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

        if (keys.actionDown && !this.isDrifting && !this.isDrifting1 && !this.isMachSliding && !this.isClimbing && !this.isClimbingLadder && !this.isGroundPounding && !this.isGroundPoundLand) {
            if (this.isSuplexGrabbing) {
                // ・｡・ｰ ・護ｧ・・・・・椈・ｼ ・・･ｴ・ｴ ・護ｧ・揆 ・ｨ・醐葺・� ・餓亨 ・ｬ・ｴ・ｰ・・・ｰ・・葺・ｰ ・鷺巡・ｼ 12・・・・､孖ｸ
                wantTumble = true;
                this.isSuplexGrabbing = false;
                this.suplexGrabTimer = 0;
                this.vx = 12 * this.facingDir;
            } else if (this.isTumbling) {
                // Keep tumbling even if falling in air
                wantTumble = true;
            } else if (this.isGrounded) {
                // ・ｬ・ｬ・� ・一ｱｰ・・・鷺巡・ ・ｷ・ｰ ・罹劇 ・鷺巡(7)・ｴ・､ ・�・ｼ ・誤ｧ・・ｬ・ｴ・ｰ ・罹徐
                if (Math.abs(this.vx) > this.maxSpeed) {
                    wantTumble = true;
                } else {
                    wantCrouch = true;
                }
            } else if (!this.isGrounded) {
                // ・ｬ・ｬ・・・鷺巡・ｼ ・誤ｧ・・ｵ・・・ｬ・ｴ・ｰ(・､・ｴ・・ ・罹徐, ・・笈・ｴ ・ｸ・･ ・雅昆・ｴ ・碕ｸｰ(crouch) ・・・
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
                if (entity.isDestroyed || entity.type === 'hallway' || entity.type === 'door' || entity.type.startsWith('targetDoor') || entity.type === 'tutorialbook' || entity.type === 'obj_palettedresser' || entity.type === 'obj_computer' || entity.type === 'obj_debris' || entity.type === 'obj_collect' || entity.type === 'obj_bigcollect' || entity.type === 'obj_slime' || entity.type === 'obj_baddiespawner' || entity.type === 'obj_splatter' || entity.type === 'left-up' || entity.type === 'right-up' || entity.type === 'tile') continue;
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
                // ・�・ ・肥ｲｭ: ・ｵ・卓乱・・・ｬ・ｴ・ｰ(・､・ｴ・・ ・懍梠 ・・・戦売 ・卓擽・罷攵・・﨑ｭ・・・・椈・・嶹・・わ梭・・｡・・們�・
                if (wantTumble && !this.isGrounded) {
                    this.vy = 12; // ・､・ｴ・・﨑俾ｰ・・鷺巡・ｼ 10・川・ 12・・・ｴ・・・・・懍寳﨑俾ｲ・・わ梭・・｡・・ｰ・・
                }
            } else {
                this.height = 45;
                this.y -= 22; // shift up
            }
        }

        if (this.isTumbling && !wantTumble && this.isGrounded) {
            this.isRollGettingUp = true;
            this.image_index = 0;
            this.sprite_index = 'spr_player_rollgetup';
        }
        if (wantTumble || !this.isGrounded) {
            this.isRollGettingUp = false;
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
            // ・ｰ・ｴ・・ｰ・ｼ ・・紛 ・菩�・・菩ｧ(this.vx = 0) ・懋ｱｰ
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

        // Kick Held Enemy Trigger
        if (this.grabBufferTimer > 0 && this.isHoldingEnemy && this.heldEnemy && this.kickWindupTimer <= 0) {
            this.kickWindupTimer = 15;
            this.grabBufferTimer = 0;
            this.sprite_index = 'spr_player_suplexgrab';
            this.image_index = 0;
        }

        // Drop Enemy
        if (keys.actionDown && !this.prevKeysDown && this.isHoldingEnemy && this.isGrounded) {
            this.isHoldingEnemy = false;
            if (this.heldEnemy) {
                this.heldEnemy.state = 'stunned';
                this.heldEnemy.stunTimer = 60;
                this.heldEnemy.vx = 0;
                this.heldEnemy.vy = -2;
                this.heldEnemy = null;
            }
        }
        
        // Kick Windup Logic
        if (this.kickWindupTimer > 0) {
            this.kickWindupTimer--;
            
            // Slow down time/movement effect (anti-gravity & friction)
            this.vx *= 0.85;
            this.vy *= 0.85;
            if (this.vy > 0) this.vy -= this.gravity; // cancel gravity pulling down
            
            if (this.kickWindupTimer <= 0) {
                // Execute Kick
                this.isHoldingEnemy = false;
                this.heldEnemy.state = 'kicked';
                this.heldEnemy.vx = 25 * this.facingDir;
                this.heldEnemy.vy = 0;
                this.requestScreenShake = 10; // Screen shake on kick!
                
                this.heldEnemy = null;
                if (audio) audio.playFile('sfx_suplexdash', true);
                
                // Knockback player backwards
                this.vx = -5 * this.facingDir;
                this.vy = -5;
                this.isGrounded = false;
                this.kickKnockbackTimer = 15;
            }
        }
        if (this.kickKnockbackTimer > 0) {
            this.kickKnockbackTimer--;
        }

        // Suplex Grab Trigger
        if (this.grabBufferTimer > 0 && !this.isHoldingEnemy && !this.isSuplexGrabbing && !this.isGroundPounding && !this.isGroundPoundLand && !this.isClimbing && !this.isDrifting && !this.isDrifting1 && !this.isMachSliding && !this.isTumbling) {
            this.isSuplexGrabbing = true;
            this.image_index = 0;
            this.grabBufferTimer = 0; // Consume the buffer
            if (audio) audio.playFile('sfx_suplexdash', true); // ・｡・ｰ ・懍梠﨑� ・・﨑・・壱ｧ・・ｬ・・(forceRestart)
        }

        // Suplex Grab Logic
        if (this.isSuplexGrabbing) {
            let animFinished = (this.sprite_index === 'spr_player_suplexgrab' && this.image_index >= this.sprites.spr_player_suplexgrab.length);
            if (!animFinished || !this.isGrounded) {
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

        // Ground Pound Trigger (・戦売/・ｴ・呟ｳｼ ・溢ｰｬ・・・・・罹ｦｬ嵓・敢, ・ｽ夋・ｰ ・卓乱・・・罹徐 ・一ｰ, ・ｬ・ｴ・ｰ ・卓乱・・・罹徐 ・一ｰ)
        if (keys.actionDown && this.canGroundPound && !this.isGrounded && !this.isGroundPounding && !this.isGroundPoundLand && !this.isDrifting && !this.isDrifting1 && !this.isClimbing && !this.isClimbingLadder && !this.isTumbling && !this.isCrouching) {
            this.isGroundPounding = true;
            this.canGroundPound = false; // ・誤ｹ・
            this.vy = -10; // Upward hop
            this.vx = 0;   // ・雅昆・ｴ ・碕ｸｰ ・・・倆初 ・ｴ・・・溢ｶ､
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
            if (this.vy > -this.runMaxSpeed) this.vy = -this.runMaxSpeed;
            // Accelerate upward by 0.05 each frame.
            this.vy -= 0.05;
            // ・・箕 ・鷺巡・ｼ ・罹劇 20・ｼ・・・懦復 (・・箕・ ・護・ ・廷擽・・・-20 ・ｴ﨑俯｡・・ｴ・､・・ ・伎ｲ・﨑ｨ)
            if (this.vy < -20) this.vy = -20;
            this.vx = 0;
            // Force player against the wall
            this.x += this.climbSide * 2;
        } else if (this.isGroundPounding) {
            this.vy += 1.2; // Slightly reduced downward acceleration for better control
        } else if (this.isClimbingLadder) {} else if (this.isMachSliding && !this.isGrounded) {
            // ・ｬ・ｼ・ｴ・・・・・ｵ・卓乱 ・ｨ・ｴ ・ｬ・ｼ・ｴ・・・瀧卿 (・尖株 ・・・ ・�・﨑�・ ・ｰ・・
            // ・ｬ・ｰ・� ・・ｱ・・・・紛 ・�・﨑俯据 ・瀧�･ ・・圸
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

        // ・ｩ嵂･ ・・魂・ｴ孖ｸ (・罹ｦｬ嵓・敢・・・ｽ夋・ｰ, ・ｬ・ｴ・ｰ ・卓擽 ・・巨 ・誤ｧ・墲､ ・・�･・・・ｰ・ｼ ・ｩ嵂･ ・ｰ・・
        if (!this.isDrifting && !this.isDrifting1 && !this.isMachSliding && !this.isClimbing && !this.isWallJumping && !this.isTumbling && Math.abs(this.vx) < 12) {
            // ・ｵ・卓乱・・・ｬ・ｬ・・・卓攵 ・誤株 ・ｩ嵂･ ・・劍 ・一ｰ
            if (this.isGrounded || !this.isRunning) {
                if (keys.actionLeft) this.facingDir = -1;
                else if (keys.actionRight) this.facingDir = 1;
            }
        }

        // ・､・・嵓・�溢桷・・・・紛 嶸・椪 ・ｬ・ｬ・ｰ ・・・ ・・･
        this.wasRunningLastFrame = this.isRunning;

        // Reset states for collision
        this.isGrounded = false;
        this.standingOnEntity = null;
        this.isWalled = false;
        this.wallSide = 0;
        // isGroundPounding will be reset upon hitting ground in collision resolution

        // Mach Afterimage Update (・懍・ ・逸葺 ・ｬ・ｬ・ｰ/・戦売 ・・・・ｼ ・誤ｧ・・肥メ ・晧┳)
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
                life: 8 // 8嵓・�溢桷・ｼ・・夋嶸・
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
            if (entity.type === 'hallway' || entity.type === 'door' || entity.type.startsWith('targetDoor') || entity.type === 'tutorialbook' || entity.type === 'obj_palettedresser' || entity.type === 'obj_computer' || entity.type === 'obj_debris' || entity.type === 'obj_collect' || entity.type === 'obj_bigcollect' || entity.type === 'obj_slime' || entity.type === 'obj_baddiespawner' || entity.type === 'obj_splatter' || entity.type === 'slope' || entity.type === 'ladder' || entity.type === 'tile') return;
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
                    if (overlapAtFeet > 0 && overlapAtFeet <= 25 && this.y < entity.y && !this.isClimbing) {
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
                        } else if (this.isGroundPounding && entity.type === 'metal' && this.vy >= 20) {
                            entity.destroy();
                            if (audio) audio.play('break');
                            return; // Skip collision resolution to plow through
                        }
                        // Collision on bottom (Grounded)
                        this.isGrounded = true;
                        this.standingOnEntity = entity;
                        this.vy = 0;
                        this.isWallJumping = false;
                        this.isClimbingLadder = false; // ・戦売 ・ｨ・・
                        if (this.isGroundPounding) {
                            this.isGroundPounding = false;
                            
                            if (this.isHoldingEnemy) {
                                // Piledriver Landing
                                this.isHoldingEnemy = false;
                                if (this.heldEnemy) {
                                    this.heldEnemy.state = 'piledriver_die';
                                    this.heldEnemy = null;
                                }
                                this.requestScreenShake = 25; // Massive shake
                                if (audio) audio.play('break');
                                this.vy = -12; // High bounce
                                this.sprite_index = 'spr_player_jump';
                                this.y -= 5;
                            } else {
                                this.isGroundPoundLand = true;
                                this.image_index = 0;
                                this.groundPoundLandTimer = 8;
                                this.requestScreenShake = 15; // Set screen shake intensity
                                if (audio) audio.playFile('sfx_groundpound', true);
                            }
                        } else {
                            this.isGroundPounding = false; // Reset GP just in case
                        }
                        this.isClimbing = false;      // Reset Climbing
                    } else if (resolution.amount > 0) {
                        // Collision on top (Head butt)
                        if (this.isClimbing) {
                            this.isClimbing = false; // Stop climbing on ceiling
                            this.vx = 0; // ・ｽ夋・ｰ ・・・懍棗・・・・ｪ德壱ｩｴ ・倆初 ・鷺巡 0
                            this.isRunning = false; // ・ｬ・ｬ・ｰ ・・・ ・ｨ・・
                            this.wasRunningLastFrame = false; // ・､・・嵓・�溢桷・川・ ・ｬ・ｬ・ｰ ・菩�・・嶹・・ｩ・
                            
                            // ・�・ ・肥ｲｭ: ・ｽ夋・� ・懍棗・・・・ｪ德壱ｩｴ groundpound land ・・・・・・・劍
                            this.isGroundPoundLand = true;
                            this.image_index = 0;
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
                    } else if (entity.type === 'metal' && Math.abs(this.vx) >= 11.5) {
                        entity.destroy();
                        if (audio) audio.play('break');
                    } else {
                        // ・ｬ・ｬ・ｰ ・・・尖株 ・｡・ｰ ・・・ｽ・・・ｿ・們揆 ・・・尖徐・ｼ・・・ｽ夋・ｰ 孖ｸ・ｬ・ｰ
                        if (!this.isClimbing && (this.isRunning || this.isSuplexGrabbing)) {
                            this.isClimbing = true;
                            if (this.isSuplexGrabbing) {
                                this.wallClimbGraceTimer = 10; // ・｡・ｰ・川・ ・們牟・ｨ ・ｽ・ｰ 10嵓・�溢桷 ・�・・
                            }
                            this.isSuplexGrabbing = false; // ・｡・ｰ ・卓擽・壱共・ｴ ・ｽ夋・ｰ・・・・劍
                            // resolution.amount < 0 ・ｴ・ｴ ・ｽ・ｴ ・､・ｸ・ｽ・・・溢搆 -> climbSide = 1
                            this.climbSide = resolution.amount < 0 ? 1 : -1;
                            // 嶸・椪 ・倆初 ・鷺巡・ｼ ・們ｧ・・ｱ・・・鷺巡・・・・劍
                            this.vy = -Math.abs(this.vx);
                            if (this.vy > -this.runMaxSpeed) this.vy = -this.runMaxSpeed; // ・懍・ ・一ｸｰ ・ｱ・・・鷺巡 ・ｴ・･ (・�夋・・ｬ﨑ｭ)
                        }

                        this.isWalled = true;
                        this.isWallJumping = false;
                        this.isClimbingLadder = false; // ・ｽ・戦売 弡・・ｽ・・・ｿ・ｼ・ｴ ・一ｸｰ嶹・
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
                if (this.vy < 0 || this.isClimbing) return; // Do not snap to slopes when moving upwards (e.g., jumping or wall climbing)
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
                        this.isGroundPounding = false;
                        if (this.isHoldingEnemy) {
                            // Piledriver Landing on slope
                            this.isHoldingEnemy = false;
                            if (this.heldEnemy) {
                                this.heldEnemy.state = 'piledriver_die';
                                this.heldEnemy = null;
                            }
                            this.requestScreenShake = 25;
                            if (audio) audio.play('break');
                            this.vy = -12;
                            this.vx = 5 * this.facingDir;
                            this.sprite_index = 'spr_player_jump';
                            this.y -= 5;
                        } else {
                            this.isGroundPounding = true;
                        }
                    }
                    if (this.isGroundPounding) {
                        const speed = this.vy >= 20 ? 12 : 8;
                        this.vx = (entity.type === 'left-up') ? -speed : speed;
                        this.facingDir = (entity.type === 'left-up') ? -1 : 1;
                        this.isGroundPounding = false;
                        
                        // ・菩�罹｡・・ｬ・ｴ・ｰ(Tumble) ・・・ ・護桿 ・・ ・廷擽(Hitbox) ・餓亨 ・ｰ・・
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
                if (!entity.isDestroyed && entity.type !== 'hallway' && entity.type !== 'tutorialbook' && entity.type !== 'obj_palettedresser' && entity.type !== 'obj_computer' && entity.type !== 'obj_debris' && entity.type !== 'tile' && Physics.checkCollision(this, entity)) {
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
                    if (entity.isDestroyed || entity.type === 'hallway' || entity.type === 'tutorialbook' || entity.type === 'obj_palettedresser' || entity.type === 'obj_computer' || entity.type === 'obj_debris' || entity.type === 'obj_collect' || entity.type === 'obj_bigcollect' || entity.type === 'obj_slime' || entity.type === 'obj_baddiespawner' || entity.type === 'obj_splatter' || entity.type === 'slope' || entity.type === 'tile') return;

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
                            this.vx = this.climbSide * climbSpeed; // ・ｱ・・・鷺巡・ｼ ・倆初 ・鷺巡・・・・劍
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
                this.sprite_index = (Math.abs(this.vx) >= 12 || this.sprite_index === 'spr_player_mach3') ? 'spr_player_mach3jump' : 'spr_player_jump';
                this.image_index = 0;
                if (audio) audio.play('jump');
                
                // ・�・ ・肥ｲｭ: ・戦売 ・ｰ・溢揆 ・・・ｬ・・巐ｨ・ｼ ・緋ｰ (・ｨ, ・ｬ・ｬ・ｰ ・卓乱・・・們丶・ ・伎ｲ・
                if (!this.isRunning && !this.isSuplexGrabbing) {
                    this.activeEffects.push({
                        type: 'spr_highjumpcloud2',
                        x: this.x + this.width / 2,
                        y: this.y + this.height,
                        image_index: 0,
                        image_speed: 0.5 // ・�・壱ｩ肥擽・・・鷺巡
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
                // this.isWallJumping = true; // ・�・ ・肥ｲｭ: ・・ｷｸ ・ｩ・・ｼ ・・紛 﨑ｭ・・false・・・�・
                this.facingDir = -this.wallSide;
                this.jumpBufferTimer = 0;
                this.sprite_index = (Math.abs(this.vx) >= 12 || this.sprite_index === 'spr_player_mach3') ? 'spr_player_mach3jump' : 'spr_player_jump';
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
                
                this.vy = -10; // ・雅昆・ｴ ・碕ｸｰ ・們搆 ・ｸ ・護ｲ俯涵 ・・｡・・ｴ・・・ｨ・・・呷梠 ・緋ｰ
                this.vx = 0;   // ・雅昆・ｴ ・碕ｸｰ ・・・倆初 ・ｴ・・・溢ｶ､
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

        // Tumble Fast Fall: ・ｬ・ｴ・ｰ ・・・壱ｲｽ・川・ ・ｨ・ｴ・・・・・餓亨 ・・・ｨ・ｴ・・・｡・・､・・
        if (this.isTumbling && this.wasGrounded && !this.isGrounded) {
            this.vy = 10; // ・ｨ・ｴ・・ｰ ・懍梠﨑俯株 ・懋ｰ・・鷺巡・ｼ 10・ｼ・・・､・・(・�・ｴ・� ・ｵ・・葺・・
        }

        // Determine sprite index
        if (this.isClimbing) {
            this.sprite_index = 'spr_player_climbwall';
        } else if (this.isSuplexGrabbing) {
            this.sprite_index = 'spr_player_suplexgrab';
        } else if (this.isGroundPoundLand) {
            this.sprite_index = 'spr_player_groundpoundland';
        } else if (this.isRollGettingUp) {
            this.sprite_index = 'spr_player_rollgetup';
            if (Math.floor(this.image_index) >= this.sprites.spr_player_rollgetup.length - 1) {
                this.isRollGettingUp = false;
            }
        } else if (!this.wasGrounded && this.isGrounded && !this.isClimbing && !this.isGroundPounding && !this.isGroundPoundLand && !this.isTumbling && !this.isSuplexGrabbing && !this.isRunning) {
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
                if (audio) audio.playFile('sfx_step', true); // ・ｩ・﨑� ・誤巡 ・懍・・ｬ ・ｬ・・
            }
        }
        
        if (this.isTumbling) {
            this.sprite_index = 'spr_player_roll';
        } else if (!this.isGrounded && !this.isClimbing && !this.isGroundPounding && !this.isSuplexGrabbing && this.sprite_index !== 'spr_player_jump' && this.sprite_index !== 'spr_player_mach3jump' && this.sprite_index !== 'spr_player_mach3') {
            this.sprite_index = 'spr_player_fall';
        } else if (this.isGrounded && this.sprite_index !== 'spr_player_land' && !this.isRollGettingUp && !this.isGroundPoundLand && !this.isSuplexGrabbing) {
            if (Math.abs(this.vx) < 0.1 && !this.isDrifting && !this.isDrifting1 && !this.isMachSliding && !this.isGroundPounding && !this.isClimbing && !keys.actionLeft && !keys.actionRight) {
                this.sprite_index = 'spr_player_idle';
            } else if (Math.abs(this.vx) > 0 && Math.abs(this.vx) <= this.maxSpeed && !this.isRunning && !this.isCrouching && !this.isDrifting && !this.isDrifting1 && !this.isMachSliding && !this.isGroundPounding && !this.isClimbing) {
                this.sprite_index = 'spr_player_walk';
            } else if (this.isRunning && Math.abs(this.vx) > 0 && this.sprite_index !== 'spr_player_mach1' && !this.isCrouching && !this.isDrifting && !this.isDrifting1 && !this.isMachSliding && !this.isGroundPounding && !this.isClimbing) {
                if (Math.abs(this.vx) >= 12) {
                    this.sprite_index = 'spr_player_mach3';
                } else {
                    this.sprite_index = 'spr_player_mach2';
                } // ・�・ ・肥ｲｭ: ・逸葺 1・ｼ ・誤巡 ・ｼ・ｨ mach2 ・�・壱ｩ肥擽・・・ｬ・ｩ
            }
        }
        
        if (this.sprite_index === 'spr_player_walk') {
            this.image_speed = Math.max(0.15, Math.abs(this.vx) * 0.08);
            
            // ・�・ ・肥ｲｭ: ・ｸ・・・・・鷺巡・・・・｡﨑ｴ・・・ｼ・ ・ｴ寬呰敢 ・晧┳
            if (this.isGrounded && !this.isSuplexGrabbing) {
                this.walkEffectTimer += Math.abs(this.vx);
                if (this.walkEffectTimer >= 80) { // ・壱ｬｴ ・ｨ・ｬ ・們乖・､・� 﨑們・・・30 -> 80・ｼ・・・壱巡 ・川・
                    this.walkEffectTimer = 0;
                    this.activeEffects.push({
                        type: 'spr_cloudeffect',
                        x: this.x + this.width / 2,
                        y: this.y + this.height,
                        image_index: 0,
                        image_speed: 0.5, // ・�・壱ｩ肥擽・・・鷺巡
                        scale: 1.0 // 增ｬ・ｰ ・菩・ (0.2 -> 1.0)
                    });
                    if (audio) audio.playFile('sfx_step', true); // ・懋ｱｸ・・・誤ｦｬ ・ｬ・・
                }
            }
        } else if (this.sprite_index === 'spr_player_idle') {
            this.image_speed = 0.4;
        } else if (this.sprite_index === 'spr_player_fall') {
            this.image_speed = 0.4;
        } else if (this.sprite_index === 'spr_player_jump') {
            this.image_speed = 0.4;
        } else if (this.sprite_index === 'spr_player_mach3jump') {
            this.image_speed = 0.7; // ・戦売 ・�・壱ｩ肥擽・・・鷺巡
        } else if (this.sprite_index === 'spr_player_land') {
            this.image_speed = 0.45; // ・�・ ・肥ｲｭ: ・ｩ・ ・�・壱ｩ肥擽・・・鷺巡 ・ｬ・ｰ・・
        } else if (this.sprite_index === 'spr_player_roll') {
            this.image_speed = Math.max(0.4, Math.abs(this.vx) * 0.06); // ・ｬ・ｴ・ｰ ・�・壱ｩ肥擽・・・鷺巡 (・鷺巡・・・・｡)
                } else if (this.sprite_index === 'spr_player_rollgetup') {
            this.image_speed = 0.5;
        } else if (this.sprite_index === 'spr_player_climbwall') {
            this.image_speed = (this.vy !== 0) ? 0.65 : 0;
                } else if (this.sprite_index === 'spr_player_groundpoundland') {
            this.image_speed = 0.5;
        } else if (this.sprite_index === 'spr_player_suplexgrab') {
            this.image_speed = 0.45;
        } else if (this.sprite_index === 'spr_player_groundpoundstart') {
            this.image_speed = 0.55; // 30ms per frame (at 60fps)
        } else if (this.sprite_index === 'spr_player_groundpound') {
            this.image_speed = 0.55; // 30ms per frame (at 60fps)
        } else if (this.sprite_index === 'spr_player_mach2' || this.sprite_index === 'spr_player_mach3') {
            // ・�・ ・肥ｲｭ: ・鷺巡・・・ｰ・ｼ ・�・壱ｩ肥擽・・・鷺巡・ ・､・ｴ・・(・�・ｼ・俯｡・・�・壱ｩ肥擽・俯巡 ・�・ｴ・・
            if (this.sprite_index === 'spr_player_mach2') {
                this.image_speed = 0.25 + (Math.abs(this.vx) * 0.04);
            } else {
                this.image_speed = 0.2 + (Math.abs(this.vx) * 0.02);
            } 
            
            if (this.isGrounded) {
                this.runEffectTimer += Math.abs(this.vx);
                if (this.runEffectTimer >= 150) { // ・晧┳ ・ｼ・ｰ ・尞ｭ ・川・
                    this.runEffectTimer = 0;
                    
                    const absSpeed = Math.abs(this.vx);
                    let effectType = 'spr_dashcloud'; // mach1, mach2
                    let offset = 0; // mach1, 2・・・菩､卓蕗
                    if (absSpeed >= 12) {
                        effectType = 'spr_superdashcloud';
                        offset = 40;
                        

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
        if (Math.abs(this.vx) >= 12 || this.sprite_index === 'spr_player_mach3' || this.sprite_index === 'spr_player_mach3jump') {
            this.machEffectIndex += 0.5;
        }
        }

        // ・�・ ・肥ｲｭ: ・戦売 ・�・壱ｩ肥擽・・・ｬ・晧擽 ・・｣誤据・ｴ ・ｨ・ｴ・・・・�・壱ｩ肥擽・們愍・・・尖徐 ・・劍
        if (this.sprite_index === 'spr_player_jump' && this.image_index >= this.sprites.spr_player_jump.length) {
            this.sprite_index = 'spr_player_fall';
            this.image_index = 0;
        }
        if (this.sprite_index === 'spr_player_mach3jump' && this.image_index >= this.sprites.spr_player_mach3jump.length) {
            this.sprite_index = 'spr_player_mach3';
            this.image_index = 0;
        }

        // ・ｩ・ ・�・壱ｩ肥擽・・・ｬ・晧擽 ・・｣誤据・ｴ idle ・�・壱ｩ肥擽・們愍・・・尖徐 ・・劍
        if (this.sprite_index === 'spr_player_land' && this.image_index >= this.sprites.spr_player_land.length) {
            this.sprite_index = 'spr_player_idle';
            this.image_index = 0;
        }

        // ・雅昆・ｴ ・碕ｸｰ ・懍梠 ・�・壱ｩ肥擽・們擽 ・・｣誤据・ｴ ・ｴ・､・碕ｸｰ ・�・壱ｩ肥擽・們愍・・・・劍
        if (this.sprite_index === 'spr_player_groundpoundstart' && this.image_index >= this.sprites.spr_player_groundpoundstart.length) {
            this.sprite_index = 'spr_player_groundpound';
            this.image_index = 0;
        }

        // Manage Looping Running Sounds
        if (audio) {
            const absSpeed = Math.abs(this.vx);
            if (this.isClimbing) {
                audio.playFile('mach2');
                audio.stopFile('mach3');
            } else if (this.isRunning && !this.isMachSliding && !this.isDrifting && !this.isDrifting1 && !this.isWalled && !this.isSuplexGrabbing && !this.isTumbling) {
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
            
            // ・｡・ｰ・ ・・｣誤据・ｴ ・誤ｦｬ・・・喜牟・・
            if (!this.isSuplexGrabbing) {
                audio.stopFile('sfx_suplexdash');
            }
        }

        // ・ｵ・卓乱・・・｡・ｰ ・護ｧ・・・・・乱 ・ｿ・俯共・ｴ ・餓亨 ・護ｧ・・・｣・
        if (this.isSuplexGrabbing && !this.wasGrounded && this.isGrounded) {
            this.isSuplexGrabbing = false;
            this.suplexGrabTimer = 0;
        }
        // ・ｴ・・嵓・�溢桷 墲､ ・・・ ・・･
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
            } else if (m.sprite_index === 'spr_player_mach2' || m.sprite_index === 'spr_player_mach3' || m.sprite_index === 'spr_player_mach3jump' || m.sprite_index === 'spr_player_rollgetup' || m.sprite_index === 'spr_player_roll') {
                const frames = this.sprites[m.sprite_index];
                const frame = frames[Math.floor(m.image_index) % frames.length];
                if (frame && frame.complete && frame.naturalWidth > 0) {
                    imgToDraw = frame;
                }
            } else if (m.sprite_index === 'spr_player_suplexgrab') {
                const frames = this.sprites.spr_player_suplexgrab;
                let frameIndex = Math.floor(m.image_index);
                if (frameIndex >= frames.length) frameIndex = frames.length - 1;
                const frame = frames[frameIndex];
                if (frame && frame.complete && frame.naturalWidth > 0) {
                    imgToDraw = frame;
                }
            } else if (m.sprite_index === 'spr_player_groundpoundland') {
                const frames = this.sprites.spr_player_groundpoundland;
                let frameIndex = Math.floor(m.image_index);
                if (frameIndex >= frames.length) frameIndex = frames.length - 1;
                const frame = frames[frameIndex];
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
                        } else if (m.sprite_index === 'spr_player_rollgetup') {
                const frames = this.sprites.spr_player_rollgetup;
                let frameIndex = Math.floor(m.image_index);
                if (frameIndex >= frames.length) frameIndex = frames.length - 1;
                const frame = frames[frameIndex];
                if (frame && frame.complete && frame.naturalWidth > 0) {
                    imgToDraw = frame;
                }
            } else if (m.sprite_index === 'spr_player_climbwall') {
                const frames = this.sprites.spr_player_climbwall;
                if (frames.length > 0) {
                    const frame = frames[Math.floor(m.image_index) % frames.length];
                    if (frame && frame.complete && frame.naturalWidth > 0) {
                        imgToDraw = frame;
                    }
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
                    // 1. ・尖椈 ・ｴ・ｸ・ ・ｸ・ｬ・ｰ
                    this.tintCtx.globalCompositeOperation = 'source-over';
                    this.tintCtx.drawImage(imgToDraw, 0, 0, 100, 100);
                    
                    // 2. source-in・ｼ・・・､・ｨ・｣・・・ｨ・・m.color)・ｼ・・・・垈・ｰ
                    this.tintCtx.globalCompositeOperation = 'source-in';
                    this.tintCtx.fillStyle = m.color;
                    this.tintCtx.fillRect(0, 0, 100, 100);
                    
                    // 3. multiply・・・尖椈 ・ｴ・ｸ・・ｼ ・､・・・ｮ・ｴ・護寥 ・・・・・､・ｽ・� ・ｴ・ｴ﨑俾ｸｰ
                    this.tintCtx.globalCompositeOperation = 'multiply';
                    this.tintCtx.drawImage(imgToDraw, 0, 0, 100, 100);
                    
                    // ・尖椈 ・､・菩愍・・・ｵ・ｬ
                    this.tintCtx.globalCompositeOperation = 'source-over';
                    
                    const offsetY = (m.isCrouching || m.isTumbling) ? -68.5 : -57.5;
                    ctx.drawImage(this.tintCanvas, -51, offsetY, 100, 100);
                } else {
                    const offsetY = (m.isCrouching || m.isTumbling) ? -68.5 : -57.5;
                    ctx.drawImage(this.paletteManager ? this.paletteManager.getTintedFrame(imgToDraw, imgToDraw.src || "imgToDraw") : imgToDraw, -51, offsetY, 100, 100);
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
                        // ・ｰ・・川揆 x ・卓蕗, y ・罷凶・ｼ・・・｡・ｰ
                        ctx.translate(ef.x, ef.y);
                        if (ef.facingDir === -1) {
                            ctx.scale(-1, 1);
                        }
                        const scale = ef.scale || 1.0;
                        const w = img.naturalWidth * scale;
                        const h = img.naturalHeight * scale;
                        ctx.drawImage(this.paletteManager ? this.paletteManager.getTintedFrame(img, img.src || "img") : img, -w/2, -h, w, h);
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
                // ・護・・・嵓ｽ・・・・ｸ﨑・・尖ｦｭ奓ｰ 彧尖�､・・・ｩ・・ｼ ・・紛 ・・ｹ・・們豫・ｼ
                ctx.translate(Math.round(drawX + this.width / 2), Math.round(drawY + this.height / 2));
                if (this.facingDir === -1) {
                    ctx.scale(-1, 1);
                }
                const offsetY = (this.isCrouching || this.isTumbling) ? -68.5 : -57.5;
                ctx.drawImage(this.paletteManager ? this.paletteManager.getTintedFrame(img, img.src || "img") : img, -51, offsetY, 100, 100);
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
                ctx.drawImage(this.paletteManager ? this.paletteManager.getTintedFrame(img, img.src || "img") : img, -51, offsetY, 100, 100);
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
                ctx.drawImage(this.paletteManager ? this.paletteManager.getTintedFrame(img, img.src || "img") : img, -51, offsetY, 100, 100);
            }
        } else if (this.sprite_index === 'spr_player_jump') {
            const frames = this.sprites.spr_player_jump;
            // Stop at the last frame so it doesn't loop forever if intended, but let's loop by default
            let frameIndex = Math.floor(this.image_index);
            if (frameIndex >= frames.length) {
                frameIndex = frames.length - 1; // ・溢ｧ・・嵓・�溢桷・川・ ・溢ｶ緋ｲ・(・戦売 ・川┷ ・�・)
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
                ctx.drawImage(this.paletteManager ? this.paletteManager.getTintedFrame(img, img.src || "img") : img, -51, offsetY, 100, 100);
            }
        } else if (this.sprite_index === 'spr_player_land') {
            const frames = this.sprites.spr_player_land;
            let frameIndex = Math.floor(this.image_index);
            if (frameIndex >= frames.length) {
                frameIndex = frames.length - 1; // ・溢ｧ・・嵓・�溢桷 ・�・ (・・劍 ・・ｹ護ｧ)
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
                ctx.drawImage(this.paletteManager ? this.paletteManager.getTintedFrame(img, img.src || "img") : img, -51, offsetY, 100, 100);
            }
                } else if (this.sprite_index === 'spr_player_climbwall') {
            const frames = this.sprites.spr_player_climbwall;
            if (frames.length > 0) {
                const frameIndex = Math.floor(this.image_index) % frames.length;
                const img = frames[frameIndex];
                if (img && img.complete && img.naturalWidth > 0) {
                    const drawX = this.x;
                    const drawY = this.y;
                    ctx.translate(Math.round(drawX + this.width / 2), Math.round(drawY + this.height / 2));
                    // If climbing on left wall (climbSide == -1), face left (flip). If right wall (climbSide == 1), face right.
                    if (this.climbSide === -1) {
                        ctx.scale(-1, 1);
                    }
                    ctx.drawImage(this.paletteManager ? this.paletteManager.getTintedFrame(img, img.src || "img") : img, -51, -57.5, 100, 100);
                }
            }
        } else if (this.sprite_index === 'spr_player_rollgetup') {
            const frames = this.sprites.spr_player_rollgetup;
            let frameIndex = Math.floor(this.image_index);
            if (frameIndex >= frames.length) frameIndex = frames.length - 1;
            const img = frames[frameIndex];
            if (img && img.complete && img.naturalWidth > 0) {
                const drawX = this.x;
                const drawY = this.y;
                ctx.translate(Math.round(drawX + this.width / 2), Math.round(drawY + this.height / 2));
                if (this.facingDir === -1) {
                    ctx.scale(-1, 1);
                }
                const offsetY = -57.5;
                ctx.drawImage(this.paletteManager ? this.paletteManager.getTintedFrame(img, img.src || "img") : img, -51, offsetY, 100, 100);
                
                if (Math.abs(this.vx) >= 12) {
                    const effectFrames = this.effectSprites.spr_mach_effect;
                    if (effectFrames && effectFrames.length > 0) {
                        const efIndex = Math.floor(this.machEffectIndex) % effectFrames.length;
                        const efImg = effectFrames[efIndex];
                        if (efImg && efImg.complete && efImg.naturalWidth > 0) {
                            ctx.drawImage(efImg, -51, offsetY, 100, 100);
                        }
                    }
                }
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
                ctx.drawImage(this.paletteManager ? this.paletteManager.getTintedFrame(img, img.src || "img") : img, -51, offsetY, 100, 100);
            }
        } else if (this.sprite_index === 'spr_player_mach2' || this.sprite_index === 'spr_player_mach3' || this.sprite_index === 'spr_player_mach3jump') {
            const frames = this.sprites[this.sprite_index];
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
                ctx.drawImage(this.paletteManager ? this.paletteManager.getTintedFrame(img, img.src || "img") : img, -51, offsetY, 100, 100);
                
                if (Math.abs(this.vx) >= 12 || this.sprite_index === 'spr_player_mach3' || this.sprite_index === 'spr_player_mach3jump') {
                    const effectFrames = this.effectSprites.spr_mach_effect;
                    if (effectFrames && effectFrames.length > 0) {
                        const efIndex = Math.floor(this.machEffectIndex) % effectFrames.length;
                        const efImg = effectFrames[efIndex];
                        if (efImg && efImg.complete && efImg.naturalWidth > 0) {
                            ctx.drawImage(efImg, -51, offsetY, 100, 100);
                        }
                    }
                }
            }
        } else if (this.sprite_index === 'spr_player_suplexgrab') {
            const frames = this.sprites.spr_player_suplexgrab;
            let frameIndex = Math.floor(this.image_index);
            if (frameIndex >= frames.length) frameIndex = frames.length - 1;
            const img = frames[frameIndex];
            if (img && img.complete && img.naturalWidth > 0) {
                const drawX = this.x;
                const drawY = this.y;
                ctx.translate(Math.round(drawX + this.width / 2), Math.round(drawY + this.height / 2));
                if (this.facingDir === -1) {
                    ctx.scale(-1, 1);
                }
                const offsetY = -57.5;
                ctx.drawImage(this.paletteManager ? this.paletteManager.getTintedFrame(img, img.src || "img") : img, -51, offsetY, 100, 100);
            }
        } else if (this.sprite_index === 'spr_player_groundpoundland') {
            const frames = this.sprites.spr_player_groundpoundland;
            let frameIndex = Math.floor(this.image_index);
            if (frameIndex >= frames.length) frameIndex = frames.length - 1;
            const img = frames[frameIndex];
            if (img && img.complete && img.naturalWidth > 0) {
                const drawX = this.x;
                const drawY = this.y;
                ctx.translate(Math.round(drawX + this.width / 2), Math.round(drawY + this.height / 2));
                if (this.facingDir === -1) {
                    ctx.scale(-1, 1);
                }
                const offsetY = (this.isCrouching || this.isTumbling) ? -68.5 : -57.5;
                ctx.drawImage(this.paletteManager ? this.paletteManager.getTintedFrame(img, img.src || "img") : img, -51, offsetY, 100, 100);
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
                ctx.drawImage(this.paletteManager ? this.paletteManager.getTintedFrame(img, img.src || "img") : img, -51, offsetY, 100, 100);
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
                ctx.drawImage(this.paletteManager ? this.paletteManager.getTintedFrame(img, img.src || "img") : img, -51, offsetY, 100, 100);
            }
        } else if (this.sprite_index === 'spr_player_taunt') {
            const frames = this.sprites.spr_player_taunt;
            let frameIndex = Math.floor(this.image_index);
            if (frameIndex >= frames.length) frameIndex = frames.length - 1; // ・溢�・・･・・
            const img = frames[frameIndex];
            if (img && img.complete && img.naturalWidth > 0) {
                const drawX = this.x;
                const drawY = this.y;
                
                ctx.translate(Math.round(drawX + this.width / 2), Math.round(drawY + this.height / 2));
                if (this.facingDir === -1) {
                    ctx.scale(-1, 1);
                }
                const offsetY = (this.isCrouching || this.isTumbling) ? -68.5 : -57.5;
                ctx.drawImage(this.paletteManager ? this.paletteManager.getTintedFrame(img, img.src || "img") : img, -51, offsetY, 100, 100);
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

        // ・罷ｲ・ｹ・・・・・・ 嶹菩攤・ｩ: 嵓誤�溢擽・ｴ ・ｸ・ｬ ・・乱 嶸・椪 ・・・ 岺懍亨
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
        
        // ・ｰ・ｽ・・・ｴ・・・肥符・ｼ・ｴ ・・ｨ・ ・・・・・ｴ・・笈・､.
        const textWidth = ctx.measureText(debugState).width;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(this.x + this.width / 2 - textWidth / 2 - 2, this.y - 22, textWidth + 4, 16);
        ctx.fillStyle = 'white';
        ctx.fillText(debugState, this.x + this.width / 2, this.y - 10);
    }
}










