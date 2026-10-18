class BackgroundManager {
    constructor(game) {
        this.game = game;
        this.cache = {}; // Cache loaded layer sets by bgName
        this.currentBgName = null;
        this.layers = [];
        this.followCameraRear = true; // 맨 뒤 배경 카메라 고정 여부
        this.speedMultiplier = 1.0;

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
            'bg_tutorial': {
                name: 'bg_tutorial',
                displayName: '튜토리얼 배경 (bg_tutorial)',
                folder: 'backgrounds/bg_tutorial',
                layerCount: 1,
                singleFile: 'bg_tutorial.png',
                speeds: [0.15]
            }
        };

        // 기본 배경 미리 로드
        this.loadBackground('bg_beaker');
        this.loadBackground('bg_tutorial');
    }

    setBackground(bgName, followCameraRear = true, speedMultiplier = 1.0, secretMovement = false, waveEnabled = false, waveAmp = 8) {
        this.currentBgName = (bgName && bgName !== 'none') ? bgName.trim() : null;
        this.followCameraRear = followCameraRear !== false;
        this.speedMultiplier = (typeof speedMultiplier === 'number' && !isNaN(speedMultiplier)) ? speedMultiplier : 1.0;
        this.secretMovement = !!secretMovement;
        this.waveEnabled = !!waveEnabled;
        if (typeof waveAmp === 'number' && !isNaN(waveAmp)) {
            this.waveAmp = waveAmp;
        }

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
                speedX: info.speeds ? info.speeds[0] : 0.15
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
                speedX: defaultSpeed
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
                        speedX: 0.15
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
                            speedX: 0.05 + (num - 1) * 0.1
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
        if (this.waveEnabled) {
            this.waveTimer += 0.05 * this.waveSpeed * dt;
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

            if (this.secretMovement) {
                // 피자타워 시크릿 배경 모드: 가로 & 세로 무한 2D 타일링 + 대각선 연속 자동 스크롤
                const speed = layer.speedX * this.speedMultiplier;
                
                // 맨 뒤 레이어가 카메라 고정 설정이면 카메라 이동 대신 순수 자동 이동만 적용
                const camX = (isRearmost && this.followCameraRear) ? 0 : camera.x;
                const camY = (isRearmost && this.followCameraRear) ? 0 : camera.y;

                const scrollX = -(camX * speed) + this.secretTimerX + shakeX + pad;
                const scrollY = -(camY * speed) + this.secretTimerY + shakeY;

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
                if (isRearmost && this.followCameraRear) {
                    if (imgW >= canvasW) {
                        const startX = Math.round((canvasW - imgW) / 2 + shakeX + pad);
                        targetCtx.drawImage(img, startX, Math.round(shakeY), imgW, imgH);
                    } else {
                        let startX = Math.round(shakeX + pad) % imgW;
                        if (startX > 0) startX -= imgW;
                        for (let x = startX; x < targetW; x += imgW) {
                            targetCtx.drawImage(img, x, Math.round(shakeY), imgW, imgH);
                        }
                    }
                } else {
                    const speed = layer.speedX * this.speedMultiplier;
                    const scrollX = -(camera.x * speed) + shakeX + pad;
                    let startX = scrollX % imgW;
                    if (startX > 0) startX -= imgW;

                    for (let x = startX; x < targetW; x += imgW) {
                        targetCtx.drawImage(img, Math.round(x), Math.round(shakeY), imgW, imgH);
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
