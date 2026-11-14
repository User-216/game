class BackgroundManager {
    constructor(game) {
        this.game = game;
        this.cache = {}; // Cache loaded layer sets by bgName
        this.currentBgName = null;
        this.layers = [];
        this.followCameraRear = true; // 맨 뒤 배경 카메라 고정 여부
        this.speedMultiplier = 1.0;

        // 세로(상하) 이동 및 자동 스크롤 설정
        this.moveY = false;          // 상하(세로) 카메라 추종 이동 활성화
        this.speedMultiplierY = 1.0; // 세로 스크롤 속도 배율
        this.autoSpeedX = 0.0;       // 가로 자동 스크롤 속도
        this.autoSpeedY = 0.0;       // 세로 자동 스크롤 속도
        this.autoTimerX = 0.0;
        this.autoTimerY = 0.0;
        this.tileY = true;           // 세로 무한 반복 타일링

        // 피자타워 시크릿 배경 움직임 & 웨이브 효과
        this.secretMovement = false; // 대각선 연속 자동 스크롤
        this.waveEnabled = false;    // 웨이브(물결) 왜곡 효과
        this.secretTimerX = 0;
        this.secretTimerY = 0;
        this.secretSpeedX = -1.0;    // 피자타워 시크릿 배경 기본 이동 속도 (좌상단 대각선 이동)
        this.secretSpeedY = -1.0;
        this.waveTimer = 0;
        this.waveSpeed = 1.0;
        this.waveAmp = 8;            // 왜곡 진폭 (픽셀)
        this.waveFreq = 0.04;        // 주파수 (주기 약 157px)

        // 웨이브 왜곡 렌더링용 오프스크린 버퍼
        this.offscreenCanvas = document.createElement('canvas');
        this.offscreenCtx = this.offscreenCanvas.getContext('2d');

        // 사전 등록된 배경 정의
        this.registry = {
            'bg_beaker': {
                name: 'bg_beaker',
                displayName: '비커 배경 (bg_beaker)',
                folder: 'backgrounds/bg_beaker',
                layerCount: 3,
                speeds: [0.05, 0.15, 0.25]
            },
            'bg_cidersewer': {
                name: 'bg_cidersewer',
                displayName: '사이다 수어 배경 (bg_cidersewer)',
                folder: 'backgrounds/bg_cidersewer',
                layerCount: 3,
                speeds: [0.05, 0.15, 0.25]
            },
            'bg_tutorial': {
                name: 'bg_tutorial',
                displayName: '튜토리얼 배경 (bg_tutorial)',
                folder: 'backgrounds/bg_tutorial',
                layerCount: 1,
                singleFile: 'bg_tutorial.png',
                speeds: [0.15]
            },
            'bg_cidercity': {
                name: 'bg_cidercity',
                displayName: '사이다 시티 배경 (bg_cidercity)',
                folder: 'backgrounds/bg_cidercity',
                layerCount: 3,
                speeds: [0.05, 0.15, 0.25]
            }
        };

        // 기본 배경 미리 로드
        this.loadBackground('bg_beaker');
        this.loadBackground('bg_cidersewer');
        this.loadBackground('bg_tutorial');
        this.loadBackground('bg_cidercity');
    }

    setBackground(bgName, followCameraRear = true, speedMultiplier = 1.0, secretMovement = false, waveEnabled = false, waveAmp = 8, waveSpeed = 1.0, moveY = false, speedMultiplierY = 1.0, autoSpeedY = 0.0, autoSpeedX = 0.0, tileY = true) {
        this.currentBgName = (bgName && bgName !== 'none') ? bgName.trim() : null;
        this.followCameraRear = followCameraRear !== false;
        this.speedMultiplier = (typeof speedMultiplier === 'number' && !isNaN(speedMultiplier)) ? speedMultiplier : 1.0;
        this.secretMovement = !!secretMovement;
        this.waveEnabled = !!waveEnabled;
        if (typeof waveAmp === 'number' && !isNaN(waveAmp)) {
            this.waveAmp = waveAmp;
        }
        if (typeof waveSpeed === 'number' && !isNaN(waveSpeed)) {
            this.waveSpeed = waveSpeed;
        }

        this.moveY = !!moveY;
        this.speedMultiplierY = (typeof speedMultiplierY === 'number' && !isNaN(speedMultiplierY)) ? speedMultiplierY : 1.0;
        this.autoSpeedY = (typeof autoSpeedY === 'number' && !isNaN(autoSpeedY)) ? autoSpeedY : 0.0;
        this.autoSpeedX = (typeof autoSpeedX === 'number' && !isNaN(autoSpeedX)) ? autoSpeedX : 0.0;
        this.tileY = tileY !== false;

        if (!this.currentBgName) {
            this.layers = [];
            return;
        }

        if (this.cache[this.currentBgName] && this.cache[this.currentBgName].length > 0) {
            this.layers = this.cache[this.currentBgName];
            return;
        }

        this.loadBackground(this.currentBgName);
    }

    loadBackground(name) {
        if (!name || name === 'none') {
            this.layers = [];
            return;
        }

        if (this.cache[name] && this.cache[name].length > 0) {
            this.layers = this.cache[name];
            return;
        }

        const info = this.registry[name] || {
            name: name,
            folder: `backgrounds/${name}`,
            layerCount: 3,
            speeds: [0.05, 0.15, 0.25]
        };

        const layers = [];

        if (info.singleFile) {
            const img = new Image();
            img.src = `${info.folder}/${info.singleFile}`;
            layers.push({
                number: 1,
                image: img,
                speedX: info.speeds ? info.speeds[0] : 0.15,
                speedY: info.speeds ? info.speeds[0] : 0.15
            });
            this.cache[name] = layers;
            this.layers = layers;
            return;
        }
        const layerCount = info.layerCount || 3;

        for (let i = 1; i <= layerCount; i++) {
            const img = new Image();
            const num = i;
            img.src = `${info.folder}/${name}_${num}.png`;

            let defaultSpeed = 0.05 + (num - 1) * 0.1;
            if (info.speeds && info.speeds[num - 1] !== undefined) {
                defaultSpeed = info.speeds[num - 1];
            }

            layers.push({
                number: num,
                image: img,
                speedX: defaultSpeed,
                speedY: defaultSpeed
            });
        }

        // 숫자가 낮은 순서(1 -> 2 -> 3...)로 정렬:
        // 낮은 번호가 맨 뒤(배경의 가장 먼 곳), 높은 번호가 맨 앞(전경 쪽)
        layers.sort((a, b) => a.number - b.number);

        // 등록되지 않은 새 배경 폴더의 추가 레이어 동적 탐색 (최대 10개까지)
        if (!this.registry[name]) {
            // 단일 파일 형태 (예: backgrounds/my_bg/my_bg.png) 확인
            const singleImg = new Image();
            singleImg.onload = () => {
                if (!layers.some(l => l.image.complete && l.image.naturalWidth > 0)) {
                    layers.length = 0;
                    layers.push({
                        number: 1,
                        image: singleImg,
                        speedX: 0.15,
                        speedY: 0.15
                    });
                    this.cache[name] = layers;
                    this.layers = layers;
                }
            };
            singleImg.src = `${info.folder}/${name}.png`;
            for (let i = layerCount + 1; i <= 10; i++) {
                const img = new Image();
                const num = i;
                img.onload = () => {
                    if (!layers.some(l => l.number === num)) {
                        layers.push({
                            number: num,
                            image: img,
                            speedX: 0.05 + (num - 1) * 0.1,
                            speedY: 0.05 + (num - 1) * 0.1
                        });
                        layers.sort((a, b) => a.number - b.number);
                    }
                };
                img.src = `${info.folder}/${name}_${num}.png`;
            }
        }

        this.cache[name] = layers;
        this.layers = layers;
    }

    update(dt = 1) {
        if (this.secretMovement) {
            this.secretTimerX += this.secretSpeedX * this.speedMultiplier * dt;
            this.secretTimerY += this.secretSpeedY * this.speedMultiplier * dt;
        }
        if (this.autoSpeedX) {
            this.autoTimerX = (this.autoTimerX || 0) + this.autoSpeedX * dt;
        }
        if (this.autoSpeedY) {
            this.autoTimerY = (this.autoTimerY || 0) + this.autoSpeedY * dt;
        }
        if (this.waveEnabled) {
            this.waveTimer += 0.018 * this.waveSpeed * dt;
        }
    }

    render(ctx, camera, shakeX = 0, shakeY = 0) {
        if (!this.currentBgName || !this.layers || this.layers.length === 0) return;

        const canvasW = ctx.canvas.width;
        const canvasH = ctx.canvas.height;

        // 웨이브 효과 활성화 시 오프스크린 버퍼에 패딩을 두고 렌더링한 후 슬라이스 왜곡 복사
        const pad = this.waveEnabled ? 32 : 0;
        const targetW = canvasW + pad * 2;
        const targetH = canvasH;
        const targetCtx = this.waveEnabled ? this.offscreenCtx : ctx;

        if (this.waveEnabled) {
            if (this.offscreenCanvas.width !== targetW || this.offscreenCanvas.height !== targetH) {
                this.offscreenCanvas.width = targetW;
                this.offscreenCanvas.height = targetH;
            }
            this.offscreenCtx.clearRect(0, 0, targetW, targetH);
        }

        for (let i = 0; i < this.layers.length; i++) {
            const layer = this.layers[i];
            const img = layer.image;
            if (!img || !img.complete || img.naturalWidth === 0) continue;

            const imgW = img.naturalWidth;
            const imgH = img.naturalHeight;
            const isRearmost = (i === 0);

            const speedX = (layer.speedX !== undefined ? layer.speedX : 0.15) * this.speedMultiplier;
            const speedY = (layer.speedY !== undefined ? layer.speedY : (layer.speedX !== undefined ? layer.speedX : 0.15)) * (this.speedMultiplierY !== undefined ? this.speedMultiplierY : 1.0);

            if (this.secretMovement) {
                // 피자타워 시크릿 배경 모드: 가로 & 세로 무한 2D 타일링 + 대각선 연속 자동 스크롤
                const camX = (isRearmost && this.followCameraRear) ? 0 : camera.x;
                const camY = (isRearmost && this.followCameraRear && !this.moveY) ? 0 : camera.y;

                const scrollX = -(camX * speedX) + this.secretTimerX + (this.autoTimerX || 0) + shakeX + pad;
                const scrollY = -(camY * speedY) + this.secretTimerY + (this.autoTimerY || 0) + shakeY;

                let startX = scrollX % imgW;
                if (startX > 0) startX -= imgW;

                let startY = scrollY % imgH;
                if (startY > 0) startY -= imgH;

                for (let x = startX; x < targetW; x += imgW) {
                    for (let y = startY; y < targetH; y += imgH) {
                        targetCtx.drawImage(img, Math.round(x), Math.round(y), imgW, imgH);
                    }
                }
            } else {
                // 일반 패럴랙스 배경 모드
                let scrollX, scrollY;

                if (isRearmost && this.followCameraRear) {
                    if (imgW >= canvasW) {
                        scrollX = (canvasW - imgW) / 2 + (this.autoTimerX || 0) + shakeX + pad;
                    } else {
                        scrollX = (this.autoTimerX || 0) + shakeX + pad;
                    }
                } else {
                    scrollX = -(camera.x * speedX) + (this.autoTimerX || 0) + shakeX + pad;
                }

                if (this.moveY) {
                    const camY = camera.y;
                    scrollY = -(camY * speedY) + (this.autoTimerY || 0) + shakeY;
                } else {
                    scrollY = (this.autoTimerY || 0) + shakeY;
                }

                let startX = scrollX % imgW;
                if (startX > 0) startX -= imgW;

                // 세로 이동 또는 타일링이 활성화된 경우 세로 반복 타일링
                const shouldTileY = this.tileY || this.moveY || (this.autoTimerY && this.autoTimerY !== 0);

                let startY = 0;
                if (shouldTileY) {
                    startY = scrollY % imgH;
                    if (startY > 0) startY -= imgH;
                } else {
                    startY = Math.round(scrollY);
                }

                // 가로 중앙 고정 1장 여부
                const singleX = (isRearmost && this.followCameraRear && imgW >= canvasW);

                if (singleX) {
                    const fixedX = Math.round(scrollX);
                    if (shouldTileY) {
                        for (let y = startY; y < targetH; y += imgH) {
                            targetCtx.drawImage(img, fixedX, Math.round(y), imgW, imgH);
                        }
                    } else {
                        targetCtx.drawImage(img, fixedX, Math.round(scrollY), imgW, imgH);
                    }
                } else {
                    for (let x = startX; x < targetW; x += imgW) {
                        if (shouldTileY) {
                            for (let y = startY; y < targetH; y += imgH) {
                                targetCtx.drawImage(img, Math.round(x), Math.round(y), imgW, imgH);
                            }
                        } else {
                            targetCtx.drawImage(img, Math.round(x), Math.round(scrollY), imgW, imgH);
                        }
                    }
                }
            }
        }

        // 웨이브 왜곡 효과 적용: 오프스크린 캔버스를 수평 스트립으로 슬라이스하여 사인파 오프셋 적용
        if (this.waveEnabled) {
            const sliceH = 2; // 2px 슬라이스로 매우 부드러운 웨이브 구현
            const amp = this.waveAmp || 8;
            const freq = this.waveFreq || 0.04;

            for (let y = 0; y < canvasH; y += sliceH) {
                const curH = Math.min(sliceH, canvasH - y);
                // 위에서 아래로 물결치는 사인파 오프셋
                const offset = Math.sin((y * freq) - this.waveTimer) * amp;
                ctx.drawImage(
                    this.offscreenCanvas,
                    pad + offset, y, canvasW, curH,
                    0, y, canvasW, curH
                );
            }
        }
    }
}

window.BackgroundManager = BackgroundManager;
