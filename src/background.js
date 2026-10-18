class BackgroundManager {
    constructor(game) {
        this.game = game;
        this.cache = {}; // Cache loaded layer sets by bgName
        this.currentBgName = null;
        this.layers = [];
        this.followCameraRear = true; // 맨 뒤 배경 카메라 고정 여부
        this.speedMultiplier = 1.0;

        // 사전 등록된 배경 정의
        this.registry = {
            'bg_beaker': {
                name: 'bg_beaker',
                displayName: '비커 배경 (bg_beaker)',
                folder: 'backgrounds/bg_beaker',
                layerCount: 3,
                speeds: [0.05, 0.15, 0.25]
            }
        };

        // 기본 배경 미리 로드
        this.loadBackground('bg_beaker');
    }

    setBackground(bgName, followCameraRear = true, speedMultiplier = 1.0) {
        this.currentBgName = (bgName && bgName !== 'none') ? bgName.trim() : null;
        this.followCameraRear = followCameraRear !== false;
        this.speedMultiplier = (typeof speedMultiplier === 'number' && !isNaN(speedMultiplier)) ? speedMultiplier : 1.0;

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

    render(ctx, camera, shakeX = 0, shakeY = 0) {
        if (!this.currentBgName || !this.layers || this.layers.length === 0) return;

        const canvasW = ctx.canvas.width;
        const canvasH = ctx.canvas.height;

        for (let i = 0; i < this.layers.length; i++) {
            const layer = this.layers[i];
            const img = layer.image;
            if (!img || !img.complete || img.naturalWidth === 0) continue;

            const imgW = img.naturalWidth;
            const imgH = img.naturalHeight;
            const isRearmost = (i === 0);

            // 맨 뒤 배경 (1번 레이어):
            // followCameraRear가 true이면 카메라를 따라감 (화면 고정)
            // false이면 다른 배경처럼 느린 속도로 패럴랙스 스크롤
            if (isRearmost && this.followCameraRear) {
                if (imgW >= canvasW) {
                    const startX = Math.round((canvasW - imgW) / 2 + shakeX);
                    ctx.drawImage(img, startX, Math.round(shakeY), imgW, imgH);
                } else {
                    let startX = Math.round(shakeX) % imgW;
                    if (startX > 0) startX -= imgW;
                    for (let x = startX; x < canvasW; x += imgW) {
                        ctx.drawImage(img, x, Math.round(shakeY), imgW, imgH);
                    }
                }
            } else {
                // 느린 패럴랙스 이동
                const speed = layer.speedX * this.speedMultiplier;
                const scrollX = -(camera.x * speed) + shakeX;
                let startX = scrollX % imgW;
                if (startX > 0) startX -= imgW;

                for (let x = startX; x < canvasW; x += imgW) {
                    ctx.drawImage(img, Math.round(x), Math.round(shakeY), imgW, imgH);
                }
            }
        }
    }
}

window.BackgroundManager = BackgroundManager;
