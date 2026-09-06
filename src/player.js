

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
        this.isWalled = false;
        this.wallSide = 0; // -1 for left, 1 for right
        this.isRunning = false;
        this.isGroundPounding = false;
        this.isGroundPoundLand = false;
        this.groundPoundLandTimer = 0;
        
        this.isTaunting = false;
        this.tauntTimer = 0;
        this.isCrouching = false;
        
        this.canSuplexGrab = true;
        this.isTumbling = false;
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

        // Load land sprite (4 frames -> 마지막 프레임 제거 요청으로 3프레임만 로드)
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

        this.effectSprites = {
            spr_highjumpcloud2: [],
            spr_taunteffect: []
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
        
        this.activeEffects = [];
        
        // Mask
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
                this.vx = this.storedVx || 0;
                this.vy = this.storedVy || 0;
                if (this.storedState) {
                    Object.assign(this, this.storedState);
                }
            } else {
                keys = { ...keys, actionLeft: false, actionRight: false, actionUp: false, actionDown: false, actionJump: false, actionRun: false, actionGrab: false, actionTaunt: false };
            }
        } else if (keys.actionTaunt) {
            this.isTaunting = true;
            this.tauntTimer = 20;
            this.storedVx = this.vx;
            this.storedVy = this.vy;
            this.storedState = {
                isRunning: this.isRunning,
                isClimbing: this.isClimbing,
                isTumbling: this.isTumbling,
                isSuplexGrabbing: this.isSuplexGrabbing,
                isGroundPounding: this.isGroundPounding,
                isGroundPoundLand: this.isGroundPoundLand,
                isDrifting: this.isDrifting,
                isDrifting1: this.isDrifting1,
                isMachSliding: this.isMachSliding,
                sprite_index: this.sprite_index,
                image_index: this.image_index,
                facingDir: this.facingDir
            };
            
            // 유저가 올려주신 도발 이펙트 추가
            this.activeEffects.push({
                type: 'spr_taunteffect',
                x: this.x + this.width / 2,
                y: this.y + this.height,
                image_index: 0,
                image_speed: 0.45 // 20프레임 동안 9장 재생
            });
            
            if (audio) audio.play('taunt'); // Option to play taunt sound later
            keys = { ...keys, actionLeft: false, actionRight: false, actionUp: false, actionDown: false, actionJump: false, actionRun: false, actionGrab: false, actionTaunt: false };
            
            // Cancel other states while taunting so they don't process
            this.isClimbing = false;
            this.isTumbling = false;
            this.isSuplexGrabbing = false;
            this.isGroundPounding = false;
            this.isGroundPoundLand = false;
            this.isDrifting = false;
            this.isDrifting1 = false;
            this.isMachSliding = false;
        }

        let isCurrentlyRunning = !!keys.actionRun;
        
        // 웅크리고 있을 때는 달리기 불가
        if (this.isCrouching) {
            isCurrentlyRunning = false;
        }

        // (이전에 있던 '공중에서 달리기 멈출 수 없음' 제한 해제)

        // 공중에서는 새로 달리기를 시작할 수 없고, 땅찍기 중에는 달리기가 취소됨
        if (this.isGroundPounding) {
            isCurrentlyRunning = false;
        } else if (!this.isGrounded && !this.wasRunningLastFrame && !this.isClimbing) {
            isCurrentlyRunning = false;
        }

        // 구르기 중에는 달리기 상태 강제 유지
        if (this.isTumbling) {
            isCurrentlyRunning = true;
        }

        // (잡기 중 달리기 취소 코드 제거)


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
            this.isWalled = false;
            this.isClimbing = false;
            this.isGroundPounding = false;
            this.machAfters = [];
            this.ghostAfters = [];
            return;
        }

        // Running cancel triggers: 땅에서 달리던 중 Shift를 떼면 슬라이드 발동 (구르기 중에는 제외)
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

        // 만약 슬라이드 중 다시 Shift와 방향키를 누르면 달리기로 복귀
        if (this.isMachSliding && isCurrentlyRunning) {
            this.isMachSliding = false;
        }

        this.isRunning = isCurrentlyRunning;

        // Suplex Grab 취소 로직: 돌진 방향과 반대 방향키를 누르면 즉시 취소
        if (this.isSuplexGrabbing) {
            if ((this.facingDir === 1 && keys.actionLeft) || (this.facingDir === -1 && keys.actionRight)) {
                this.isSuplexGrabbing = false;
                this.vx = 0; // 공중/지상 상관없이 즉시 정지 (관성 제거)
            }
        }

        // Horizontal Movement (드리프트나 마하 슬라이드 중이 아닐 때만 조작 가능)
        if (!this.isDrifting && !this.isDrifting1 && !this.isMachSliding && !this.isClimbing && !this.isWallJumping) {
            let effLeft = keys.actionLeft;
            let effRight = keys.actionRight;
            
            // 구르기(tumble) 중에는 좌우 방향 전환 불가 (관성 유지)
            if (this.isTumbling) {
                effLeft = false;
                effRight = false;
            }
            
            // 공중에서 빠르게 달리는 중이면 방향 전환(키 입력)을 무시하고 현재 방향을 강제 유지 (다이브밤 중에는 예외)
            if (!this.isGrounded && this.isRunning && Math.abs(this.vx) >= 6 && !this.isGroundPounding) {
                effLeft = this.facingDir === -1;
                effRight = this.facingDir === 1;
            }
            // 달리기 중인데 방향키를 안 누르고 있다면 바라보는 방향으로 자동 달리기 (다이브밤 중에는 자동 전진 금지)
            else if (this.isRunning && !keys.actionLeft && !keys.actionRight && !this.isGroundPounding) {
                if (this.facingDir === -1) effLeft = true;
                else if (this.facingDir === 1) effRight = true;
            }

            const activeMaxSpeed = this.isCrouching ? 4 : this.maxSpeed;

            if (effLeft) {
                if (!this.isTumbling && !this.isSuplexGrabbing) this.facingDir = -1;
                
                if (this.isRunning && this.vx > 0 && this.vx < this.machThreshold) {
                    this.vx = -6;
                } else if (!this.isRunning && this.vx > 0) {
                    // 걷는 중 방향을 꺾을 때: 미끄러지지 않고 즉시 속도를 반대로 뒤집음
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
                if (!this.isTumbling && !this.isSuplexGrabbing) this.facingDir = 1;

                if (this.isRunning && this.vx < 0 && this.vx > -this.machThreshold) {
                    this.vx = 6;
                } else if (!this.isRunning && this.vx < 0) {
                    // 걷는 중 방향을 꺾을 때: 미끄러지지 않고 즉시 속도를 반대로 뒤집음
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
                // 방향키를 누르지 않았을 때
                if (this.isTumbling || this.isSuplexGrabbing) {
                    // 구르기/잡기 돌진 중에는 감속 없이 속도 완전 유지
                } else {
                    this.vx = 0;
                }
            }
        }

        // Running acceleration logic
        if (this.isRunning && !this.isDrifting && !this.isDrifting1 && this.isGrounded && !this.isTumbling && !this.isCrouching && !this.isSuplexGrabbing) {
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
            // 드리프트가 끝날 때 튀어나갈 방향 저장 (현재 속도의 반대 방향)
            this.driftTargetDir = this.vx > 0 ? -1 : 1;
            if (audio) {
                audio.stopFile('mach2');
                audio.stopFile('mach3');
                audio.playFile('machslideboost', true);
            }
        }

        if (this.isDrifting) {
            // 속도를 0.4씩 줄어들게 함 (방향에 맞춰서)
            if (this.vx > 0) {
                this.vx -= 0.4;
                if (this.vx < 0) this.vx = 0;
            } else if (this.vx < 0) {
                this.vx += 0.4;
                if (this.vx > 0) this.vx = 0;
            }

            this.driftTimer--;

            // 종료 조건: 35프레임이 모두 지났고 + 땅에 닿아 있는 상태여야 함
            if (this.driftTimer <= 0 && this.isGrounded) {
                this.isDrifting = false;
                // 드리프트 종료 시 목표 방향으로 속도를 12로 설정
                this.vx = this.driftTargetDir * 12;
                this.facingDir = this.driftTargetDir;
            }
        }

        if (this.isDrifting1) {
            // 속도를 0.4씩 줄어들게 함 (정해진 방식대로)
            if (this.vx > 0) {
                this.vx -= 0.4;
                if (this.vx < 0) this.vx = 0;
            } else if (this.vx < 0) {
                this.vx += 0.4;
                if (this.vx > 0) this.vx = 0;
            }

            this.driftTimer--;

            // 종료 조건: 35프레임이 모두 지났고 + 땅에 닿아 있는 상태여야 함
            if (this.driftTimer <= 0 && this.isGrounded) {
                this.isDrifting1 = false;
                // DRIFTING1 종료 시 목표 방향으로 속도를 8로 설정
                this.vx = this.driftTargetDir * 8;
                this.facingDir = this.driftTargetDir;
            }
        }

        // Mach Sliding Logic
        if (this.isMachSliding) {
            this.vx *= this.machSlideFriction;

            // 속도가 낮아지거나 땅에서 떨어지면 종료 (또는 사용자의 다른 조작)
            if (Math.abs(this.vx) < 1.5) {
                this.isMachSliding = false;
            }
        }

        const targetMaxSpeed = isCurrentlyRunning ? this.runMaxSpeed : this.maxSpeed;

        // Clamp speed (마하 슬라이드나 잡기, 구르기, 땅찍기 중에는 클램프 생략)
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
                // 잡기 돌진 중 아래를 누르면 돌진을 취소하고 즉시 구르기로 연계하며 속도를 12로 부스트
                wantTumble = true;
                this.isSuplexGrabbing = false;
                this.suplexGrabTimer = 0;
                this.vx = 12 * this.facingDir;
            } else if (this.isTumbling) {
                // Keep tumbling even if falling in air
                wantTumble = true;
            } else if (this.isGrounded) {
                // 달리고 있거나 속도가 걷기 최대 속도(7)보다 빠를 때만 구르기 발동
                if (Math.abs(this.vx) > this.maxSpeed) {
                    wantTumble = true;
                } else {
                    wantCrouch = true;
                }
            } else if (!this.isGrounded) {
                // 달리는 속도일 때만 공중 구르기(다이브) 발동, 아니면 그냥 엉덩이 찍기(crouch) 준비
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
                // 유저 요청: 공중에서 구르기(다이브) 시작 시 점프 중이더라도 항상 아래로 확 꽂히도록 수정
                if (wantTumble && !this.isGrounded) {
                    this.vy = 12; // 다이브 하강 속도를 10에서 12로 살짝 더 시원하게 꽂히도록 조정
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
            // 기어가기를 위해 강제 정지(this.vx = 0) 제거
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
            // TODO: 나중에 스프라이트가 추가되면 애니메이션 길이에 맞춰 취소되도록 수정할 예정
            this.suplexGrabTimer = 32; // 32 frames
            this.grabBufferTimer = 0; // Consume the buffer
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

        // Ground Pound Trigger (점프/이동과 마찬가지로 드리프트, 벽타기 중에는 발동 불가, 구르기 중에도 발동 불가)
        if (keys.actionDown && this.canGroundPound && !this.isGrounded && !this.isGroundPounding && !this.isGroundPoundLand && !this.isDrifting && !this.isDrifting1 && !this.isClimbing && !this.isTumbling && !this.isCrouching) {
            this.isGroundPounding = true;
            this.canGroundPound = false; // 소비
            this.vy = -10; // Upward hop
            this.vx = 0;   // 엉덩이 찍기 시 수평 이동 멈춤
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
            // 상향 속도를 최대 20으로 제한 (상향은 음수 값이므로 -20 이하로 내려가지 않게 함)
            if (this.vy < -20) this.vy = -20;
            this.vx = 0;
            // Force player against the wall
            this.x += this.climbSide * 2;
        } else if (this.isGroundPounding) {
            this.vy += 1.2; // Slightly reduced downward acceleration for better control
        } else if (this.isMachSliding && !this.isGrounded) {
            // 슬라이드 중 공중에 뜨면 슬라이드 중단 (또는 계속 유지할지 결정)
            // 여기선 관성을 위해 유지하되 중력 적용
            this.vy += this.gravity;
        } else if (this.isTaunting) {
            this.vx = 0;
            this.vy = 0;
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

        // 방향 업데이트 (드리프트나 벽타기, 구르기 중이 아닐 때만 키 입력에 따라 방향 결정)
        if (!this.isDrifting && !this.isDrifting1 && !this.isClimbing && !this.isWallJumping && !this.isTumbling) {
            // 공중에서 달리는 중일 때는 방향 전환 불가
            if (this.isGrounded || !this.isRunning) {
                if (keys.actionLeft) this.facingDir = -1;
                else if (keys.actionRight) this.facingDir = 1;
            }
        }

        // 다음 프레임을 위해 현재 달리기 상태 저장
        this.wasRunningLastFrame = this.isRunning;

        // Reset states for collision
        this.isGrounded = false;
        this.isWalled = false;
        this.wallSide = 0;
        // isGroundPounding will be reset upon hitting ground in collision resolution

        // Mach Afterimage Update (순수 마하 달리기/점프 상태일 때만 잔상 생성)
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
                life: 8 // 8프레임으로 타협!
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
            if (entity.type === 'hallway' || entity.type === 'door' || entity.type.startsWith('targetDoor') || entity.type === 'tutorialbook' || entity.type === 'slope') return;
            if (entity.type === 'left-up' || entity.type === 'right-up') return;

            // Normal AABB Support
            const resolution = Physics.resolveAABB(this, entity);
            if (resolution) {
                // Step Up logic: If resolved horizontally, but feet are near the top of the block, convert to vertical
                if (resolution.axis === 'x') {
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
                        this.vy = 0;
                        this.isWallJumping = false; // 점프 취소
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
                            this.vx = 0; // 벽타기 중 천장에 부딪히면 수평 속도 0
                            this.isRunning = false; // 달리기 상태 취소
                            this.wasRunningLastFrame = false; // 다음 프레임에서 달리기 강제 부활 방지
                            
                            // 유저 요청: 벽타고 천장에 부딪히면 groundpound land 상태로 전환
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
                        // 달리기 중 또는 잡기 중 벽에 닿았을 때 자동으로 벽타기 트리거
                        if (!this.isClimbing && (this.isRunning || this.isSuplexGrabbing)) {
                            this.isClimbing = true;
                            if (this.isSuplexGrabbing) {
                                this.wallClimbGraceTimer = 10; // 잡기에서 넘어온 경우 10프레임 유예
                            }
                            this.isSuplexGrabbing = false; // 잡기 중이었다면 벽타기로 전환
                            // resolution.amount < 0 이면 벽이 오른쪽에 있음 -> climbSide = 1
                            this.climbSide = resolution.amount < 0 ? 1 : -1;
                            // 현재 수평 속도를 수직 등반 속도로 전환
                            this.vy = -Math.abs(this.vx);
                            if (this.vy > -8) this.vy = -8; // 최소 초기 등반 속도 보장 (선택 사항)
                        }

                        this.isWalled = true;
                        this.isWallJumping = false; // 벽점프 후 벽에 닿으면 초기화
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
                        
                        // 강제로 구르기(Tumble) 상태 돌입 시, 높이(Hitbox) 즉시 조정
                        if (!this.isTumbling && !this.isCrouching) {
                            this.height = 23;
                            this.y += 22;
                        }
                        this.isTumbling = true;
                    }
                    this.y = slopeY - this.height;
                    this.vy = 0;
                    this.isGrounded = true;
                    this.isWallJumping = false;
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
                            this.vx = this.climbSide * climbSpeed; // 등반 속도를 수평 속도로 전환
                            this.isGrounded = true;
                            this.isClimbing = false;
                            this.isWallJumping = false;
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

        if (keys.actionJump && this.canJump && !this.isDrifting && !this.isDrifting1) {
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
                this.jumpBufferTimer = 0;
                this.sprite_index = 'spr_player_jump';
                this.image_index = 0;
                if (audio) audio.play('jump');
                
                // 유저 요청: 점프 뛰었을 때 구름 효과 추가
                this.activeEffects.push({
                    type: 'spr_highjumpcloud2',
                    x: this.x + this.width / 2,
                    y: this.y + this.height,
                    image_index: 0,
                    image_speed: 0.5 // 애니메이션 속도
                });
            } else if (this.isClimbing) {
                // Wall Jump (Stronger if climbing or high speed)
                this.vy = this.jumpForce * 1.2;
                this.vx = -this.wallSide * 12;
                this.isWalled = false;
                this.isClimbing = false;
                this.isDrifting = false;
                this.isDrifting1 = false; // Cancel drift on jump
                // this.isWallJumping = true; // 유저 요청: 버그 방지를 위해 항상 false로 유지
                this.facingDir = -this.wallSide;
                this.jumpBufferTimer = 0;
                this.sprite_index = 'spr_player_jump';
                this.image_index = 0;
                if (audio) audio.play('jump');
            } else if (this.isTumbling) {
                // Divebomb: Cancel air tumble into a normal ground pound
                this.isTumbling = false;
                this.isGroundPounding = true;
                this.height = 45;
                this.y -= 22; // Restore size
                
                this.vy = -10; // 엉덩이 찍기 처음 쓸 때처럼 위로 살짝 뜨는 동작 추가
                this.vx = 0;   // 엉덩이 찍기 시 수평 이동 멈춤
                this.jumpBufferTimer = 0;
                if (audio) audio.play('groundpound');
            }
        }

        // Variable Jump Height
        if (!this.isGrounded && this.vy < 0 && !keys.actionJump && !this.isGroundPounding && !this.isClimbing) {
            this.vy = 0;
        }

        // Tumble Fast Fall: 구르기 중 절벽에서 떨어질 때 즉시 뚝 떨어지도록 설정
        if (this.isTumbling && this.wasGrounded && !this.isGrounded) {
            this.vy = 10; // 떨어지기 시작하는 순간 속도를 10으로 설정 (빠르고 묵직하게)
        }

        // Determine sprite index
        if (this.isTaunting) {
            this.sprite_index = 'spr_player_idle'; // 현재 도발 스프라이트가 없으므로 idle 사용
        } else if (!this.wasGrounded && this.isGrounded && !this.isClimbing && !this.isGroundPounding && !this.isGroundPoundLand && !this.isTumbling && !this.isSuplexGrabbing) {
            this.sprite_index = 'spr_player_land';
            this.image_index = 0;
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
                this.sprite_index = 'spr_player_mach2'; // 유저 요청: 마하 1일 때도 일단 mach2 애니메이션 사용
            }
        }
        
        if (this.sprite_index === 'spr_player_walk') {
            this.image_speed = Math.max(0.15, Math.abs(this.vx) * 0.08);
        } else if (this.sprite_index === 'spr_player_idle') {
            this.image_speed = 0.4;
        } else if (this.sprite_index === 'spr_player_fall') {
            this.image_speed = 0.4;
        } else if (this.sprite_index === 'spr_player_jump') {
            this.image_speed = 0.4; // 점프 애니메이션 속도
        } else if (this.sprite_index === 'spr_player_land') {
            this.image_speed = 0.45; // 유저 요청: 착지 애니메이션 속도 재조정
        } else if (this.sprite_index === 'spr_player_roll') {
            this.image_speed = Math.max(0.4, Math.abs(this.vx) * 0.06); // 구르기 애니메이션 속도 (속도에 비례)
        } else if (this.sprite_index === 'spr_player_mach2') {
            // 유저 요청: 속도에 따라 애니메이션 속도가 다르게 (빠를수록 애니메이션도 빠르게)
            this.image_speed = 0.25 + (Math.abs(this.vx) * 0.04); 
        }

        if (this.sprite_index !== '') {
            this.image_index += this.image_speed;
        }

        // 유저 요청: 점프 애니메이션 재생이 완료되면 떨어지는 애니메이션으로 자동 전환
        if (this.sprite_index === 'spr_player_jump' && this.image_index >= this.sprites.spr_player_jump.length) {
            this.sprite_index = 'spr_player_fall';
            this.image_index = 0;
        }

        // 착지 애니메이션 재생이 완료되면 idle 애니메이션으로 자동 전환
        if (this.sprite_index === 'spr_player_land' && this.image_index >= this.sprites.spr_player_land.length) {
            this.sprite_index = 'spr_player_idle';
            this.image_index = 0;
        }

        // Manage Looping Running Sounds
        if (audio) {
            const absSpeed = Math.abs(this.vx);
            if (this.isRunning && this.isGrounded && !this.isMachSliding && !this.isDrifting && !this.isDrifting1 && !this.isWalled && !this.isClimbing && !this.isSuplexGrabbing && !this.isTumbling) {
                if (absSpeed >= 12) {
                    audio.playFile('mach3');
                    audio.stopFile('mach2');
                } else if (absSpeed >= 8) {
                    audio.playFile('mach2');
                    audio.stopFile('mach3');
                } else {
                    audio.stopFile('mach2');
                    audio.stopFile('mach3');
                }
            } else {
                audio.stopFile('mach2');
                audio.stopFile('mach3');
            }
        }

        // 공중에서 잡기 돌진 중 땅에 닿았다면 즉시 돌진 종료
        if (this.isSuplexGrabbing && !this.wasGrounded && this.isGrounded) {
            this.isSuplexGrabbing = false;
            this.suplexGrabTimer = 0;
        }
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
            } else if (this.mask_image && this.mask_image.complete && this.mask_image.naturalWidth > 0) {
                imgToDraw = this.mask_image;
            }

            if (imgToDraw) {
                ctx.save();
                ctx.translate(m.x + this.width / 2, m.y + this.height / 2);
                if (m.facingDir === -1) ctx.scale(-1, 1);

                if (isMach && m.color) {
                    this.tintCtx.clearRect(0, 0, 100, 100);
                    // 1. 원래 이미지 그리기
                    this.tintCtx.globalCompositeOperation = 'source-over';
                    this.tintCtx.drawImage(imgToDraw, 0, 0, 100, 100);
                    
                    // 2. source-in으로 실루엣만 단색(m.color)으로 채우기
                    this.tintCtx.globalCompositeOperation = 'source-in';
                    this.tintCtx.fillStyle = m.color;
                    this.tintCtx.fillRect(0, 0, 100, 100);
                    
                    // 3. multiply로 원래 이미지를 다시 덮어씌워 검은색 윤곽선 보존하기
                    this.tintCtx.globalCompositeOperation = 'multiply';
                    this.tintCtx.drawImage(imgToDraw, 0, 0, 100, 100);
                    
                    // 원래 설정으로 복구
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
                        // 100x100 렌더링, 기준점을 x 중앙, y 바닥으로 잡기
                        ctx.translate(ef.x, ef.y);
                        ctx.drawImage(img, -50, -100, 100, 100);
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
                // 소수점 픽셀로 인한 캐릭터 흐려짐 방지를 위해 위치 반올림
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
                frameIndex = frames.length - 1; // 마지막 프레임에서 멈추게 (점프 자세 유지)
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
                frameIndex = frames.length - 1; // 마지막 프레임 유지 (전환 전까지)
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

        // 디버깅 및 상태 확인용: 플레이어 머리 위에 현재 상태 표시
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
        
        // 배경을 살짝 깔아주면 글씨가 더 잘 보입니다.
        const textWidth = ctx.measureText(debugState).width;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(this.x + this.width / 2 - textWidth / 2 - 2, this.y - 22, textWidth + 4, 16);
        ctx.fillStyle = 'white';
        ctx.fillText(debugState, this.x + this.width / 2, this.y - 10);
    }
}
