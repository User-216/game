class AudioManager {
    constructor(settings) {
        this.settings = settings;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        
        // Load actual sound files from the sound folder
        this.files = {
            mach2: new Audio('sound/sfx_mach2.wav'),
            mach3: new Audio('sound/sfx_mach3.wav'),
            machslideboost: new Audio('sound/sfx_machslideboost.wav'),
            sfx_break: new Audio('sound/sfx_break.wav'),
            sfx_groundpound: new Audio('sound/sfx_groundpound.wav')
        };
        
        // Set loops where appropriate
        this.files.mach2.loop = true;
        this.files.mach3.loop = true;

        this.musicFiles = {};
        this.currentMusicName = null;
        this.currentMusicAudio = null;
        this.fadeIntervals = [];
    }

    getMusicVolume() {
        if (this.settings.unfocusedMute && !this.settings.isFocused) return 0;
        return (this.settings.masterVolume / 100) * (this.settings.musicVolume / 100);
    }
    
    getSFXVolume() {
        if (this.settings.unfocusedMute && !this.settings.isFocused) return 0;
        return (this.settings.masterVolume / 100) * (this.settings.sfxVolume / 100);
    }

    updateMusicVolume() {
        const vol = this.getMusicVolume();
        if (this.currentMusicAudio && !this.currentMusicAudio.isFading) {
            this.currentMusicAudio.volume = vol;
        }
    }

    playMusic(filename) {
        if (this.currentMusicName === filename) return;

        // Clear existing fades
        this.fadeIntervals.forEach(interval => clearInterval(interval));
        this.fadeIntervals = [];

        if (this.currentMusicAudio) {
            this.currentMusicAudio.isFading = false;
        }

        const masterVol = this.getMusicVolume();

        let newAudio = null;
        if (filename) {
            if (!this.musicFiles[filename]) {
                this.musicFiles[filename] = new Audio('music/' + filename);
                this.musicFiles[filename].loop = true;
            }
            newAudio = this.musicFiles[filename];
        }

        const oldAudio = this.currentMusicAudio;
        
        // Immediate change if filename contains 'secret' or old filename contained 'secret'
        const isSecret = (filename && filename.toLowerCase().includes('secret')) || 
                         (this.currentMusicName && this.currentMusicName.toLowerCase().includes('secret'));

        this.currentMusicName = filename;
        this.currentMusicAudio = newAudio;

        if (isSecret) {
            if (oldAudio) {
                oldAudio.pause();
                // removed currentTime reset to allow resume
            }
            if (newAudio) {
                newAudio.volume = masterVol;
                newAudio.play().catch(e => console.log('Music play blocked:', e));
            }
            return;
        }

        // Crossfade
        const fadeDuration = 2000; // 2 seconds
        const steps = 20;
        const stepTime = fadeDuration / steps;

        if (oldAudio) {
            oldAudio.isFading = true;
            let oldVol = oldAudio.volume;
            const oldStep = oldVol / steps;
            const fadeOutInterval = setInterval(() => {
                oldVol -= oldStep;
                if (oldVol <= 0) {
                    oldVol = 0;
                    oldAudio.pause();
                    // removed currentTime reset to allow resume
                    oldAudio.isFading = false;
                    clearInterval(fadeOutInterval);
                }
                oldAudio.volume = oldVol;
            }, stepTime);
            this.fadeIntervals.push(fadeOutInterval);
        }

        if (newAudio) {
            newAudio.isFading = true;
            newAudio.volume = 0;
            newAudio.play().catch(e => console.log('Music play blocked:', e));
            let newVol = 0;
            
            const fadeInInterval = setInterval(() => {
                const targetMasterVol = this.getMusicVolume();
                const newStep = targetMasterVol / steps;
                
                newVol += newStep;
                if (newVol >= targetMasterVol) {
                    newVol = targetMasterVol;
                    newAudio.isFading = false;
                    clearInterval(fadeInInterval);
                }
                // Avoid exception if volume slightly exceeds 1.0 due to float math
                newAudio.volume = Math.min(1, Math.max(0, newVol));
            }, stepTime);
            this.fadeIntervals.push(fadeInInterval);
        }
    }

    playFile(name, forceRestart = false) {
        const audio = this.files[name];
        if (audio) {
            const vol = this.getSFXVolume();
            audio.volume = vol;
            if (vol <= 0 && !audio.loop) {
                // If it's 0 volume and not looping, don't bother playing it to save resources
                return;
            }
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
        
        // Settings menu volume -> scaled down so it's not too loud
        const masterVol = this.getSFXVolume() * 0.3; 
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
