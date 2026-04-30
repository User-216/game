

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 40;
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
        this.isClimbing = false;
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




        this.color = '#00f2ff';
        this.machSlideColor = '#ffaa00'; // Orange for sliding
        this.groundPoundColor = '#ff0073';

        // Mach Afterimage (Pizza Tower style)
        this.machAfters = [];
        this.machThreshold = 10;
        this.machColors = ['#ff0000', '#00ff00', '#bf00ff']; // Red, Green, Purple
        this.machColorIndex = 0;
        this.machFrameCount = 0;
        this.machFlashTimer = 0;

        // Ghost Trail (Smooth alpha fade for Ground Pound)
        this.ghostAfters = [];
    }

    update(keys, entities, audio) {
        const currentMaxSpeed = keys.actionRun ? this.runMaxSpeed : this.maxSpeed;
        const isCurrentlyRunning = !!keys.actionRun;

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

        // Mach Slide Trigger: 달리던 중 Shift를 떼면 발동
        if (this.wasRunningLastFrame && !keys.actionRun && Math.abs(this.vx) > 8 && !this.isDrifting && !this.isDrifting1) {
            this.isMachSliding = true;
            if (audio) {
                audio.stopFile('mach2');
                audio.stopFile('mach3');
                audio.playFile('machslideboost', true);
            }
        }

        // 만약 슬라이드 중 다시 Shift와 방향키를 누르면 달리기로 복귀
        if (this.isMachSliding && isCurrentlyRunning) {
            this.isMachSliding = false;
        }

        this.isRunning = isCurrentlyRunning;

        // Horizontal Movement (드리프트나 마하 슬라이드 중이 아닐 때만 조작 가능)
        if (!this.isDrifting && !this.isDrifting1 && !this.isMachSliding) {
            if (keys.actionLeft) {
                if (this.isRunning && this.vx > 0 && this.vx <= 8) {
                    this.vx = -6;
                } else if (!this.isRunning && this.vx > 0) {
                    // 걷는 중 방향을 꺾을 때: 미끄러지지 않고 즉시 속도를 반대로 뒤집음
                    this.vx = -this.vx;
                } else {
                    const canSlowDown = !this.isRunning || this.vx <= 0;
                    if (canSlowDown) {
                        if (this.vx > -this.maxSpeed) {
                            this.vx -= this.speed;
                        }
                    }
                }
            } else if (keys.actionRight) {
                if (this.isRunning && this.vx < 0 && this.vx >= -8) {
                    this.vx = 6;
                } else if (!this.isRunning && this.vx < 0) {
                    // 걷는 중 방향을 꺾을 때: 미끄러지지 않고 즉시 속도를 반대로 뒤집음
                    this.vx = -this.vx;
                } else {
                    const canSlowDown = !this.isRunning || this.vx >= 0;
                    if (canSlowDown) {
                        if (this.vx < this.maxSpeed) {
                            this.vx += this.speed;
                        }
                    }
                }
            } else if (!this.isRunning) {
                this.vx = 0;
            }
        }

        // Running acceleration logic
        if (this.isRunning && !this.isDrifting && !this.isDrifting1) {
            // Give an initial boost to 6 if running starts from low speed
            if (Math.abs(this.vx) < this.runInitialSpeed) {
                this.vx = (this.vx < 0 ? -1 : 1) * this.runInitialSpeed;
            }
            // Gradually accelerate up to max speed
            this.vx += (this.vx < 0 ? -this.runAccel : this.runAccel);
        }

        // Drifting Logic
        // Trigger: isRunning AND fast AND pressing opposite direction
        const isPressingOpposite = (this.vx > 8 && keys.actionLeft) || (this.vx < -8 && keys.actionRight);
        if (this.isRunning && Math.abs(this.vx) > 8 && isPressingOpposite && !this.isDrifting && !this.isDrifting1) {
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

        // Clamp speed (마하 슬라이드 중에는 감속 중이므로 클램프 생략하거나 유연하게 처리)
        if (!this.isMachSliding) {
            if (this.vx > currentMaxSpeed) this.vx = currentMaxSpeed;
            if (this.vx < -currentMaxSpeed) this.vx = -currentMaxSpeed;
        }

        // Ground Pound Trigger (점프/이동과 마찬가지로 드리프트 중에는 발동 불가)
        if (keys.actionDown && !this.isGrounded && !this.isGroundPounding && !this.isDrifting && !this.isDrifting1) {
            this.isGroundPounding = true;
            this.vy = -18; // Upward hop
            this.vx = 0;   // Cancel horizontal momentum
            if (audio) audio.play('groundpound');
        }

        // Apply Gravity / Ground Pound Descent / Climbing
        if (this.isClimbing) {
            // Accelerate upward by 0.05 each frame.
            this.vy -= 0.05;
            // 상향 속도를 최대 20으로 제한 (상향은 음수 값이므로 -20 이하로 내려가지 않게 함)
            if (this.vy < -20) this.vy = -20;
            this.vx = 0;
            // Force player against the wall
            this.x += this.climbSide * 2;
        } else if (this.isGroundPounding) {
            this.vy += 2; // Immediate heavy downward acceleration as requested
        } else if (this.isMachSliding && !this.isGrounded) {
            // 슬라이드 중 공중에 뜨면 슬라이드 중단 (또는 계속 유지할지 결정)
            // 여기선 관성을 위해 유지하되 중력 적용
            this.vy += this.gravity;
        } else {
            this.vy += this.gravity;
        }

        // Clamp falling speed to 20 as requested
        if (this.vy > 20) this.vy = 20;

        // Wall Slide friction
        if (this.isWalled && this.vy > 0) {
            this.vy *= 0.5; // Slow down fall
        }

        // Apply movement
        this.x += this.vx;
        this.y += this.vy;

        // 다음 프레임을 위해 현재 달리기 상태 저장
        this.wasRunningLastFrame = this.isRunning;

        // Reset states for collision
        this.isGrounded = false;
        this.isWalled = false;
        this.wallSide = 0;
        // isGroundPounding will be reset upon hitting ground in collision resolution

        // Mach Afterimage Update (속도가 빠르거나, 등반 중이거나, 드리프트 또는 슬라이드 중일 때 잔상 생성)
        if (Math.abs(this.vx) >= this.machThreshold || (this.isClimbing && Math.abs(this.vy) >= 8) || this.isDrifting || this.isDrifting1 || this.isMachSliding || (this.isGroundPounding && this.vy >= 20)) {
            this.machFlashTimer++;
            this.machFrameCount++;

            // Create a new mach afterimage every 4 frames
            if (this.machFrameCount % 4 === 0) {
                const color = this.machColors[this.machColorIndex];
                this.machAfters.unshift({
                    x: this.x,
                    y: this.y,
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

        // Ghost Trail Update (Ground Pound specific)
        if (this.isGroundPounding) {
            // Add a ghost copy every frame for a super smooth trail
            this.ghostAfters.unshift({
                x: this.x,
                y: this.y,
                alpha: 0.2,
                life: 15 // Shorter life for a denser feel
            });
        }

        // Update Ghost Trail Afterimages
        this.ghostAfters.forEach((m, index) => {
            m.life -= 1;
            m.alpha = (m.life / 15) * 0.2;
            if (m.life <= 0) {
                this.ghostAfters.splice(index, 1);
            }
        });

        // Collision Resolution
        entities.forEach(entity => {
            if (entity.isDestroyed) return;

            // Slope Handling
            if (entity.type === 'left-up' || entity.type === 'right-up') {
                const slopeY = Physics.getSlopeHeight(this, entity);
                if (slopeY !== null && this.y + this.height > slopeY - 5 && this.y + this.height <= slopeY + 20) {
                    // Ground Pound transition to slope run
                    if (this.isGroundPounding) {
                        const speed = this.vy >= 20 ? 12 : 8;
                        this.vx = (entity.type === 'left-up') ? -speed : speed;
                        this.isGroundPounding = false;
                    }
                    this.y = slopeY - this.height;
                    this.vy = 0;
                    this.isGrounded = true;
                }
                return;
            }

            // Normal AABB Support
            const resolution = Physics.resolveAABB(this, entity);
            if (resolution) {
                if (resolution.axis === 'y') {
                    if (resolution.amount < 0) {
                        // Collision on bottom (Grounded)
                        this.isGrounded = true;
                        this.vy = 0;
                        this.isGroundPounding = false; // Reset GP
                        this.isClimbing = false;      // Reset Climbing
                    } else if (resolution.amount > 0) {
                        // Collision on top (Head butt)
                        if (this.isClimbing) this.isClimbing = false; // Stop climbing on ceiling
                        if (entity.type === 'destroyable') {
                            entity.destroy();
                            if (audio) audio.play('break');
                        }
                        this.vy = 0;
                    }
                    this.y += resolution.amount;
                } else {
                    // Collision on side (Wall)
                    if (entity.type === 'destroyable' && (this.isRunning || this.isGroundPounding || this.isClimbing)) {
                        entity.destroy();
                        if (audio) audio.play('break');
                    } else {
                        // 벽에 닿았을 때 자동으로 벽타기 트리거
                        if (!this.isClimbing) {
                            this.isClimbing = true;
                            // resolution.amount < 0 이면 벽이 오른쪽에 있음 -> climbSide = 1
                            this.climbSide = resolution.amount < 0 ? 1 : -1;
                            // 현재 수평 속도를 수직 등반 속도로 전환
                            this.vy = -Math.abs(this.vx);
                            if (this.vy > -8) this.vy = -8; // 최소 초기 등반 속도 보장 (선택 사항)
                        }

                        this.isWalled = true;
                        this.wallSide = resolution.amount < 0 ? 1 : -1;
                        if (!this.isClimbing) this.vx = 0;
                        this.x += resolution.amount;
                    }
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
                if (!entity.isDestroyed && entity.type !== 'hallway' && Physics.checkCollision(this, entity)) {
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
                    if (entity.isDestroyed || entity.type === 'hallway' || entity.type === 'slope') return;

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

        if (keys.actionJump && !this.isDrifting && !this.isDrifting1) {
            if (this.isGrounded && this.canJump) {
                this.vy = this.jumpForce;
                this.isGrounded = false;
                this.canJump = false;
                if (audio) audio.play('jump');
            } else if ((this.isWalled || this.isClimbing) && this.canJump) {
                // Wall Jump (Stronger if climbing or high speed)
                this.vy = this.jumpForce * 1.2;
                this.vx = -this.wallSide * 12;
                this.isWalled = false;
                this.isClimbing = false;
                this.isDrifting = false;
                this.isDrifting1 = false; // Cancel drift on jump
                this.canJump = false;
                if (audio) audio.play('jump');
            }
        }

        // Variable Jump Height
        if (!this.isGrounded && this.vy < 0 && !keys.actionJump && !this.isGroundPounding && !this.isClimbing) {
            this.vy = 0;
        }

        // Manage Looping Running Sounds
        if (audio) {
            const absSpeed = Math.abs(this.vx);
            if (this.isRunning && this.isGrounded && !this.isMachSliding && !this.isDrifting && !this.isDrifting1 && !this.isWalled && !this.isClimbing) {
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
    }

    render(ctx) {
        // Draw Mach Afterimages (with flickering effect)
        this.machAfters.forEach((m, index) => {
            // Flicker based on a global timer or unique ID
            const isFlickering = Math.floor(Date.now() / 50 + index) % 2 === 0;
            if (isFlickering) {
                ctx.globalAlpha = m.alpha;
                ctx.fillStyle = m.color;
                ctx.fillRect(m.x, m.y, this.width, this.height);
            }
        });

        // Draw Ghost Trail (Smooth fade)
        this.ghostAfters.forEach(m => {
            ctx.globalAlpha = m.alpha;
            ctx.fillStyle = this.color;
            ctx.fillRect(m.x, m.y, this.width, this.height);
        });

        ctx.globalAlpha = 1.0;

        // Draw Player
        const isMachSpeed = Math.abs(this.vx) >= this.machThreshold;
        const isFlashing = isMachSpeed && Math.floor(this.machFlashTimer / 3) % 2 === 0;

        ctx.save();
        if (isFlashing) {
            ctx.globalAlpha = 0.5; // Blinking effect
        }

        if (this.isNoClip) {
            ctx.globalAlpha = 0.5; // Phantom effect
        }

        let pColor = this.color;
        if (this.isGroundPounding) pColor = this.color; // Match cyan aesthetic for GP
        if (this.isDrifting || this.isDrifting1) pColor = '#ffff00'; // Yellow for drifting
        if (this.isMachSliding) pColor = this.machSlideColor;

        ctx.fillStyle = pColor;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Eyes/Face to show direction
        ctx.fillStyle = 'white';
        const eyeX = this.vx >= 0 ? this.x + 20 : this.x + 5;
        ctx.fillRect(eyeX, this.y + 10, 5, 5);
        ctx.restore();
    }
}
