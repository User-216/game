class AudioManager {
    constructor(settings) {
        this.settings = settings;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        
        // Load actual sound files from the sound folder
        this.files = {
            mach2: new Audio('sound/sfx_mach2.wav'),
            mach3: new Audio('sound/sfx_mach3.wav'),
            machslideboost: new Audio('sound/sfx_machslideboost.wav'),
            sfx_break: new Audio('sound/sfx_break.wav')
        };
        
        // Set loops where appropriate
        this.files.mach2.loop = true;
        this.files.mach3.loop = true;
    }

    playFile(name, forceRestart = false) {
        const audio = this.files[name];
        if (audio) {
            const masterVol = (this.settings.volume / 100);
            if (masterVol <= 0) {
                audio.pause();
                return;
            }
            audio.volume = masterVol;
            if (forceRestart) {
                audio.currentTime = 0;
                audio.play().catch(e => console.log('Audio play blocked:', e));
            } else if (audio.paused) {
                audio.play().catch(e => console.log('Audio play blocked:', e));
            }
        }
    }

    stopFile(name) {
        const audio = this.files[name];
        if (audio && !audio.paused) {
            audio.pause();
            audio.currentTime = 0; // reset to beginning
        }
    }

    play(soundName) {
        if (!this.ctx) return;
        
        // Options menu volume (0-100) -> 0.0 to 1.0 -> scaled down so it's not too loud
        const masterVol = (this.settings.volume / 100) * 0.3; 
        if (masterVol <= 0) return;

        // Resume AudioContext if it was suspended (browser policy)
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        switch (soundName) {
            case 'jump':
                osc.type = 'square';
                osc.frequency.setValueAtTime(150, t);
                osc.frequency.exponentialRampToValueAtTime(300, t + 0.1);
                gain.gain.setValueAtTime(masterVol, t);
                gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
                osc.start(t);
                osc.stop(t + 0.1);
                break;
                
            case 'groundpound':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(100, t);
                osc.frequency.exponentialRampToValueAtTime(20, t + 0.2);
                gain.gain.setValueAtTime(masterVol * 1.5, t);
                gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
                osc.start(t);
                osc.stop(t + 0.2);
                break;

            case 'dash': // Legacy synthesized dash, replaced mostly by real files now
                osc.type = 'square';
                osc.frequency.setValueAtTime(400, t);
                osc.frequency.exponentialRampToValueAtTime(100, t + 0.15);
                gain.gain.setValueAtTime(masterVol * 0.5, t);
                gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
                osc.start(t);
                osc.stop(t + 0.15);
                break;

            case 'pause':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(600, t);
                osc.frequency.setValueAtTime(800, t + 0.1);
                gain.gain.setValueAtTime(masterVol, t);
                gain.gain.linearRampToValueAtTime(0, t + 0.2);
                osc.start(t);
                osc.stop(t + 0.2);
                break;

            case 'unpause':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, t);
                osc.frequency.setValueAtTime(600, t + 0.1);
                gain.gain.setValueAtTime(masterVol, t);
                gain.gain.linearRampToValueAtTime(0, t + 0.2);
                osc.start(t);
                osc.stop(t + 0.2);
                break;
                
            case 'break':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(50, t);
                
                for(let i=0; i<10; i++) {
                    osc.frequency.setValueAtTime(50 + Math.random()*200, t + i*0.01);
                }
                
                gain.gain.setValueAtTime(masterVol, t);
                gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
                osc.start(t);
                osc.stop(t + 0.1);
                break;
        }
    }
}
