class PaletteManager {
    constructor() {
        this.base64Img = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAAHCAYAAADu4qZ8AAAAoElEQVQYlWNgYGD4D8P///+Hs2enWcHYBAHL58sxcA4jIyPDiV5vBm03QYZLO98yvNu1hUHIzYegIUyXdr5luLTzLVzg7/9/cP71S1OJcQgDi6ZeNpS5goGBgYEBxr9+aSqUvZ2wIcwqnBDWVwgF519CYhMATKs6ahlWddTCBVZ11DLwKznD2cQAFl11QRQBXXVBhhO93gx///9jQJfDBQCQSzfXl/k2NgAAAABJRU5ErkJggg==";
        this.colors = [];
        this.currentPalette = 0;
        this.isLoaded = false;
        this.cache = new Map();
        
        this.img = new Image();
        this.img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = this.img.width;
            canvas.height = this.img.height;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            ctx.drawImage(this.img, 0, 0);
            
            try {
                const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
                for (let x = 0; x < canvas.width; x++) {
                    let col = [];
                    for (let y = 0; y < canvas.height; y++) {
                        const i = (y * canvas.width + x) * 4;
                        col.push({ r: data[i], g: data[i+1], b: data[i+2], a: data[i+3] });
                    }
                    this.colors.push(col);
                }
                this.isLoaded = true;
            } catch (e) {
                console.error("Canvas taint error", e);
            }
        };
        this.img.src = this.base64Img;
    }

    setPalette(index) {
        if (this.currentPalette === index) return;
        this.currentPalette = index;
        this.cache.clear();
    }

    getTintedFrame(img, frameName) {
        if (!this.isLoaded || !img || !img.width) return img;
        if (this.currentPalette === 0) return img;
        if (this.currentPalette >= this.colors.length) return img;

        if (this.cache.has(frameName)) {
            return this.cache.get(frameName);
        }

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0);

        try {
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imgData.data;
            const baseColors = this.colors[0];
            const targetColors = this.colors[this.currentPalette];

            for (let i = 0; i < data.length; i += 4) {
                if (data[i+3] === 0) continue;
                for (let c = 0; c < baseColors.length; c++) {
                    const bc = baseColors[c];
                    if (bc.a > 0 && Math.abs(data[i] - bc.r) <= 8 && Math.abs(data[i+1] - bc.g) <= 8 && Math.abs(data[i+2] - bc.b) <= 8) {
                        data[i] = targetColors[c].r;
                        data[i+1] = targetColors[c].g;
                        data[i+2] = targetColors[c].b;
                        data[i+3] = data[i+3];
                        break;
                    }
                }
            }
            ctx.putImageData(imgData, 0, 0);
            this.cache.set(frameName, canvas);
            return canvas;
        } catch(e) {
            return img;
        }
    }
}
