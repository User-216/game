class AudioManager {
    constructor(settings) {
        this.settings = settings;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        
        // Load actual sound files from the sound folder
        this.files = {
            mach1: new Audio('sound/sfx_mach1.wav?v=' + Date.now()),
            mach2: new Audio('sound/sfx_mach2.wav?v=' + Date.now()),
            mach3: new Audio('sound/sfx_mach3.wav?v=' + Date.now()),
            mach4: new Audio('sound/sfx_mach4.wav?v=' + Date.now()),
            machroll: new Audio('sound/machroll.wav'),
            machslideboost: new Audio('sound/sfx_machslideboost.wav'),
            dive: new Audio('sound/dive.wav'),
            sfx_break: new Audio('sound/sfx_break.wav'),
            sfx_freefall: new Audio('sound/sfx_freefall.wav'),
            sfx_freefallstart: new Audio('sound/sfx_freefallstart.wav'),
            sfx_groundpound: new Audio('sound/sfx_groundpound.wav'),
            sfx_killingblow: new Audio('sound/sfx_killingblow.wav'),
            sfx_pausestart: new Audio('sound/sfx_pausestart.wav'),
            sfx_rollgetup: new Audio('sound/sfx_rollgetup.wav'),
            sfx_step: new Audio('sound/sfx_step.wav'),
            sfx_suplexdash: new Audio('sound/sfx_suplexdash.wav'),
            sfx_wallsplat: new Audio('sound/sfx_wallsplat.wav'),
            sfx_switch: new Audio('sound/switch1.ogg'),
            taunt: new Audio('sound/taunt.wav?v=' + Date.now()),
            taunt_user_chosen: new Audio('sound/taunt_user_chosen.wav?v=' + Date.now()),
            taunt_bacon_vocal: new Audio('sound/taunt_bacon_vocal.wav'),
            taunt_orchestra_hit: new Audio('sound/taunt_orchestra_hit.wav'),
            taunt_cartoon_bonk_pop: new Audio('sound/taunt_cartoon_bonk_pop.wav'),
            taunt_wacky_honk: new Audio('sound/taunt_wacky_honk.wav'),
            taunt_frying_pan: new Audio('sound/taunt_frying_pan.wav'),
            taunt_slap_whistle: new Audio('sound/taunt_slap_whistle.wav'),
            taunt_rubber_squeak: new Audio('sound/taunt_rubber_squeak.wav'),
            taunt_record_scratch: new Audio('sound/taunt_record_scratch.wav'),
            taunt_bacon: new Audio('sound/taunt_bacon.wav'),
            taunt_boing: new Audio('sound/taunt_wacky_boing.wav'),
            pizza_guitar: new Audio('sound/pizza_guitar.wav?v=' + Date.now()),
            guitar: new Audio('sound/pizza_guitar.wav?v=' + Date.now()),
            pizza_guitar_heavy_chug: new Audio('sound/pizza_guitar_heavy_chug.wav?v=' + Date.now()),
            pizza_guitar_arcade_metal: new Audio('sound/pizza_guitar_arcade_metal.wav?v=' + Date.now()),
            pizza_guitar_powerchord_drive: new Audio('sound/pizza_guitar_powerchord_drive.wav?v=' + Date.now()),
            pizza_guitar_retro_crunch: new Audio('sound/pizza_guitar_retro_crunch.wav?v=' + Date.now()),
            pizza_guitar_user_chosen: new Audio('sound/pizza_guitar_user_chosen.wav?v=' + Date.now()),
            pizza_guitar_user_ref: new Audio('sound/pizza_guitar_user_ref_mastered.wav'),
            pizza_guitar_vibe_match: new Audio('sound/pizza_guitar_vibe_match.wav'),
            pizza_guitar_vibe_harmony: new Audio('sound/pizza_guitar_vibe_harmony.wav'),
            pizza_guitar_vibe_speed_metal: new Audio('sound/pizza_guitar_vibe_speed_metal.wav'),
            pizza_guitar_escape_riff: new Audio('sound/pizza_guitar_escape_riff.wav'),
            pizza_guitar_speed_chug: new Audio('sound/pizza_guitar_speed_chug.wav'),
            pizza_guitar_funky_wah: new Audio('sound/pizza_guitar_funky_wah.wav'),
            pizza_guitar_wl4_toxic: new Audio('sound/pizza_guitar_wl4_toxic.wav'),
            pizza_guitar_powerchord: new Audio('sound/pizza_guitar_powerchord_hit.wav'),
            pizza_guitar_squeal: new Audio('sound/pizza_guitar_squeal_hit.wav'),
            boss_gate: new Audio('sound/boss_gate.wav?v=' + Date.now()),
            sf2_short_piano: new Audio('sound/sf2_short_piano__smb3_.wav'),
            sf2_long_piano: new Audio('sound/sf2_long_piano__smb3_.wav'),
            sf2_musicbox: new Audio('sound/sf2_musicbox__smb3_.wav'),
            sf2_strings: new Audio('sound/sf2_strings__smb3_.wav'),
            sf2_guitar: new Audio('sound/sf2_guitar__smb3_.wav?v=' + Date.now()),
            sf2_marimba: new Audio('sound/sf2_marimba__smb1_.wav'),
            sf2_bass_lead: new Audio('sound/sf2_bass___lead__fds_.wav'),
            sf2_tubular_bells: new Audio('sound/sf2_tubular_bells__fds_.wav'),
            sf2_tom: new Audio('sound/sf2_tom__smb1_.wav'),
            sf2_triangle: new Audio('sound/sf2_triangle_wave__nes_.wav'),
            sf2_drums_smb3: new Audio('sound/sf2_drums__smb3_.wav'),
            sf2_drums_smb1: new Audio('sound/sf2_drums__smb1_.wav')
        };
        
        // Set loops where appropriate
        if (this.files.mach1) this.files.mach1.loop = true;
        this.files.mach2.loop = true;
        this.files.mach3.loop = true;
        if (this.files.mach4) this.files.mach4.loop = true;
        if (this.files.machroll) this.files.machroll.loop = true;
        if (this.files.sfx_freefall) this.files.sfx_freefall.loop = true;
        [
            'sf2_short_piano', 'sf2_long_piano', 'sf2_musicbox', 'sf2_strings',
            'sf2_guitar', 'sf2_marimba', 'sf2_bass_lead', 'sf2_tubular_bells',
            'sf2_tom', 'sf2_triangle', 'sf2_drums_smb3', 'sf2_drums_smb1'
        ].forEach(k => {
            if (this.files[k]) this.files[k].loop = true;
        });

        this.musicFiles = {};
        this.currentMusicName = null;
        this.currentMusicAudio = null;
        this.fadeIntervals = [];
        this.isPausedAll = false;
        this.pauseMusic = new Audio('music/mu_pause.mp3');
        this.pauseMusic.loop = true;

        // FMOD-style Escape Music Controller
        // Loop region: 1:10 (70.38s) ~ 1:40 (100.08s) (downbeats of Phrase 14 & 21)
        // Emergency jump point: 1:37 (97.0s) when escape remaining time <= 50s
        this.escapeLoopEnabled = false;
        this.escapeJumpTriggered = false;
        this.escapeLoopStart = 70.38;
        this.escapeLoopEnd = 100.08;
        this.escapeJumpTime = 97.0;

        // Auto-unlock audio on user interaction
        this.unlockAudio = () => {
            if (this.settings) {
                this.settings.isFocused = true;
            }
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume().catch(() => {});
            }
            // Do NOT unpause or play music if the game is paused!
            if (this.isPausedAll) {
                if (this.pauseMusic && this.pauseMusic.paused) {
                    this.pauseMusic.volume = this.getMusicVolume();
                    this.pauseMusic.play().catch(() => {});
                }
                return;
            }
            if (this.currentMusicAudio && this.currentMusicName) {
                const vol = this.getMusicVolume();
                if (this.currentMusicAudio.paused) {
                    this.currentMusicAudio.volume = vol;
                    this.currentMusicAudio.play().catch(e => {
                        console.log('Unlock audio play blocked:', e);
                    });
                } else if (!this.currentMusicAudio.isFading && vol > 0) {
                    this.currentMusicAudio.volume = vol;
                }
            }
        };

        ['click', 'keydown', 'pointerdown', 'touchstart', 'mousedown'].forEach(evt => {
            window.addEventListener(evt, this.unlockAudio, { passive: true });
        });
        window.addEventListener('focus', this.unlockAudio, { passive: true });
    }

    getMusicVolume() {
        if (this.settings && this.settings.unfocusedMute && !this.settings.isFocused) return 0;
        const master = (this.settings && typeof this.settings.masterVolume === 'number') ? this.settings.masterVolume : 100;
        const music = (this.settings && typeof this.settings.musicVolume === 'number') ? this.settings.musicVolume : 80;
        return Math.max(0, Math.min(1, (master / 100) * (music / 100)));
    }
    
    getSFXVolume() {
        if (this.settings && this.settings.unfocusedMute && !this.settings.isFocused) return 0;
        const master = (this.settings && typeof this.settings.masterVolume === 'number') ? this.settings.masterVolume : 100;
        const sfx = (this.settings && typeof this.settings.sfxVolume === 'number') ? this.settings.sfxVolume : 100;
        return Math.max(0, Math.min(1, (master / 100) * (sfx / 100)));
    }

    updateMusicVolume() {
        const vol = this.getMusicVolume();
        if (this.currentMusicAudio && !this.currentMusicAudio.isFading) {
            this.currentMusicAudio.volume = vol;
        }
        if (this.pauseMusic && !this.pauseMusic.paused) {
            this.pauseMusic.volume = vol;
        }
    }

    enableEscapeLoop() {
        this.escapeLoopEnabled = true;
        this.escapeJumpTriggered = false;
        if (this.currentMusicAudio) {
            this.currentMusicAudio.loop = false;
        }
    }

    triggerEscape50Jump() {
        if (!this.currentMusicAudio) return;
        if (this.escapeJumpTriggered) return;
        this.escapeJumpTriggered = true;
        this.escapeLoopEnabled = false;

        const oldAudio = this.currentMusicAudio;
        // If old audio is already paused or at start, simply seek without crossfade
        if (oldAudio.paused || oldAudio.currentTime < 1.0) {
            oldAudio.currentTime = this.escapeJumpTime;
            oldAudio.volume = this.getMusicVolume();
            return;
        }

        const filename = this.currentMusicName || 'mu_escape.wav';
        const cacheBuster = '?t=' + Date.now();
        const newAudio = new Audio('music/' + filename + cacheBuster);
        newAudio.loop = false;
        newAudio.currentTime = this.escapeJumpTime; // 97.0s (1:37.0)

        const masterVol = this.getMusicVolume();
        newAudio.volume = 0;
        newAudio.play().catch(e => console.log('Transition audio play blocked:', e));

        this.currentMusicAudio = newAudio;
        this.musicFiles[filename] = newAudio;

        // Smooth Equal-Power Crossfade over 2500ms (2.5s) so it morphs seamlessly!
        const fadeDuration = 2500;
        const steps = 50;
        const stepTime = fadeDuration / steps;
        let currentStep = 0;

        oldAudio.isFading = true;
        newAudio.isFading = true;

        const crossfadeInterval = setInterval(() => {
            currentStep++;
            const progress = Math.min(1.0, currentStep / steps);
            const currentVol = this.getMusicVolume();

            // Equal-power crossfade curves (cos / sin)
            const angle = progress * (Math.PI / 2);
            const outGain = Math.cos(angle);
            const inGain = Math.sin(angle);

            if (oldAudio && !oldAudio.paused) {
                oldAudio.volume = Math.max(0, Math.min(1, currentVol * outGain));
            }
            if (newAudio && !newAudio.paused) {
                newAudio.volume = Math.max(0, Math.min(1, currentVol * inGain));
            }

            if (progress >= 1.0) {
                clearInterval(crossfadeInterval);
                const idx = this.fadeIntervals.indexOf(crossfadeInterval);
                if (idx !== -1) this.fadeIntervals.splice(idx, 1);

                if (oldAudio) {
                    oldAudio.pause();
                    oldAudio.currentTime = 0;
                    oldAudio.isFading = false;
                }
                if (newAudio) {
                    newAudio.isFading = false;
                    newAudio.volume = this.getMusicVolume();
                }
                console.log("[FMOD Music] 50s gradual crossfade to 1:37 complete!");
            }
        }, stepTime);

        this.fadeIntervals.push(crossfadeInterval);
    }

    update(game) {
        if (!this.currentMusicAudio || !this.currentMusicName) return;
        if (this.isPausedAll || (game && (game.gameState === 'PAUSED' || game.gameState === 'OPTIONS' || game.isEditorMode))) return;

        const isEscapeTrack = this.currentMusicName.toLowerCase().includes('escape') || 
                              this.currentMusicName.toLowerCase().includes('pizzatime') || 
                              this.currentMusicName.toLowerCase().includes('breaking');

        if (isEscapeTrack && !this.currentMusicAudio.paused) {
            const curTime = this.currentMusicAudio.currentTime;
            const escapeRemaining = (game && typeof game.escapeTimer === 'number') ? game.escapeTimer : null;

            // 1. If escape timer has 50 seconds or less left -> trigger gradual transition to 1:37!
            if (escapeRemaining !== null && escapeRemaining > 0 && escapeRemaining <= 50) {
                if (!this.escapeJumpTriggered) {
                    console.log(`[FMOD Music] Escape timer <= 50s (${escapeRemaining.toFixed(1)}s left)! Starting gradual crossfade to 1:37...`);
                    this.triggerEscape50Jump();
                }
            } else if (this.escapeLoopEnabled && !this.escapeJumpTriggered) {
                // 2. Normal loop: 1:10 (70.38s) ~ 1:40 (100.08s)
                if (curTime >= this.escapeLoopEnd) {
                    this.currentMusicAudio.currentTime = this.escapeLoopStart;
                    console.log(`[FMOD Music] Looping escape theme: 1:40 -> 1:10 (${this.escapeLoopStart}s).`);
                }
            }
        }
    }

    resetMusic() {
        this.stopPauseMusic();
        this.escapeLoopEnabled = false;
        this.escapeJumpTriggered = false;
        this.fadeIntervals.forEach(interval => clearInterval(interval));
        this.fadeIntervals = [];
        if (this.currentMusicAudio) {
            this.currentMusicAudio.pause();
            this.currentMusicAudio.currentTime = 0;
            this.currentMusicAudio.isFading = false;
            this.currentMusicAudio = null;
            this.currentMusicName = null;
        }
        for (const key in this.musicFiles) {
            const audio = this.musicFiles[key];
            if (audio) {
                audio.pause();
                audio.currentTime = 0;
                audio.isFading = false;
                audio.wasPlaying = false;
            }
        }
    }

    playMusic(filename, forceRestart = false) {
        if (!filename) {
            // Stop current music
            this.fadeIntervals.forEach(interval => clearInterval(interval));
            this.fadeIntervals = [];
            if (this.currentMusicAudio) {
                const oldAudio = this.currentMusicAudio;
                this.currentMusicAudio = null;
                this.currentMusicName = null;
                oldAudio.isFading = true;
                const steps = 20;
                let oldVol = oldAudio.volume;
                const oldStep = oldVol / steps;
                const fadeOut = setInterval(() => {
                    oldVol -= oldStep;
                    if (oldVol <= 0) {
                        oldVol = 0;
                        oldAudio.pause();
                        oldAudio.currentTime = 0;
                        oldAudio.isFading = false;
                        clearInterval(fadeOut);
                    }
                    oldAudio.volume = Math.max(0, oldVol);
                }, 50);
                this.fadeIntervals.push(fadeOut);
            } else {
                this.currentMusicName = null;
            }
            return;
        }

        if (this.currentMusicName === filename) {
            if (forceRestart && this.currentMusicAudio) {
                this.currentMusicAudio.currentTime = 0;
            }
            // Same track: if not paused, make sure it's unpaused and volume is active
            if (this.currentMusicAudio && !this.isPausedAll) {
                const targetVol = this.getMusicVolume();
                if (this.currentMusicAudio.paused) {
                    this.currentMusicAudio.volume = targetVol;
                    this.currentMusicAudio.play().catch(e => {
                        console.log('Music play blocked (waiting for interaction):', e);
                    });
                } else if (!this.currentMusicAudio.isFading && targetVol > 0) {
                    this.currentMusicAudio.volume = targetVol;
                }
            }
            return;
        }

        // Clear existing fades
        this.fadeIntervals.forEach(interval => clearInterval(interval));
        this.fadeIntervals = [];

        if (this.currentMusicAudio) {
            this.currentMusicAudio.isFading = false;
        }

        let newAudio = null;
        if (!this.musicFiles[filename]) {
            const cacheBuster = '?t=' + Date.now();
            this.musicFiles[filename] = new Audio('music/' + filename + cacheBuster);
            this.musicFiles[filename].loop = true;
        }
        newAudio = this.musicFiles[filename];
        newAudio.currentTime = 0; // Always start newly switched track from beginning!

        const oldAudio = this.currentMusicAudio;
        
        const isEscapeTrack = filename && (filename.toLowerCase().includes('escape') || filename.toLowerCase().includes('breaking') || filename.toLowerCase().includes('pizzatime'));
        if (isEscapeTrack && newAudio) {
            newAudio.loop = false; // Disable native loop so FMOD interactive loop handles it!
            this.escapeLoopEnabled = true;
            this.escapeJumpTriggered = false;
        }

        // Immediate change if filename contains 'secret', 'escape', or 'breaking'
        const isImmediate = (filename && (filename.toLowerCase().includes('secret') || filename.toLowerCase().includes('escape') || filename.toLowerCase().includes('breaking') || filename.toLowerCase().includes('pizzatime'))) || 
                            (this.currentMusicName && (this.currentMusicName.toLowerCase().includes('secret') || this.currentMusicName.toLowerCase().includes('escape') || this.currentMusicName.toLowerCase().includes('breaking') || this.currentMusicName.toLowerCase().includes('pizzatime')));

        this.currentMusicName = filename;
        this.currentMusicAudio = newAudio;

        if (this.isPausedAll) {
            if (oldAudio) {
                oldAudio.pause();
                oldAudio.currentTime = 0;
            }
            if (newAudio) {
                newAudio.pause();
                newAudio.currentTime = 0;
                newAudio.wasPlaying = true;
            }
            return;
        }

        const masterVol = this.getMusicVolume();

        if (isImmediate) {
            if (oldAudio) {
                oldAudio.pause();
                oldAudio.currentTime = 0;
            }
            if (newAudio) {
                newAudio.currentTime = 0;
                newAudio.volume = masterVol;
                newAudio.play().catch(e => console.log('Music play blocked (waiting for interaction):', e));
            }
            return;
        }

        // Crossfade
        const fadeDuration = 1000; // 1 second
        const steps = 20;
        const stepTime = fadeDuration / steps;

        if (oldAudio && oldAudio !== newAudio) {
            oldAudio.isFading = true;
            let oldVol = oldAudio.volume;
            const oldStep = oldVol / steps;
            const fadeOutInterval = setInterval(() => {
                oldVol -= oldStep;
                if (oldVol <= 0) {
                    oldVol = 0;
                    oldAudio.pause();
                    oldAudio.currentTime = 0;
                    oldAudio.isFading = false;
                    clearInterval(fadeOutInterval);
                }
                oldAudio.volume = Math.max(0, oldVol);
            }, stepTime);
            this.fadeIntervals.push(fadeOutInterval);
        }

        if (newAudio) {
            newAudio.isFading = true;
            const targetMasterVol = this.getMusicVolume();
            const effectiveTarget = targetMasterVol > 0 ? targetMasterVol : 0.8;
            newAudio.volume = 0;
            newAudio.play().catch(e => console.log('Music play blocked (waiting for interaction):', e));
            let newVol = 0;
            
            const fadeInInterval = setInterval(() => {
                const currentTarget = this.getMusicVolume();
                const targetToUse = currentTarget > 0 ? currentTarget : effectiveTarget;
                const newStep = targetToUse / steps;
                
                newVol += newStep;
                if (newVol >= targetToUse) {
                    newVol = targetToUse;
                    newAudio.isFading = false;
                    clearInterval(fadeInInterval);
                }
                newAudio.volume = Math.min(1, Math.max(0, currentTarget > 0 ? newVol : 0));
            }, stepTime);
            this.fadeIntervals.push(fadeInInterval);
        }
    }

    playFile(name, forceRestart = false) {
        const audio = this.files[name];
        if (audio) {
            let vol = this.getSFXVolume();
            // Continuous mach running loops are balanced down so other SFX (drift, jumps, bumps) and BGM are clear
            if (name === 'mach1' || name === 'mach2' || name === 'mach3' || name === 'mach4' || name === 'machroll') {
                vol *= 0.65;
            }
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
        if (audio) {
            if (name === 'sfx_freefallstart' || name === 'sfx_freefall') {
                if (this.files.sfx_freefallstart) {
                    this.files.sfx_freefallstart.onended = null;
                }
            }
            if (!audio.paused) {
                audio.pause();
            }
            audio.currentTime = 0; // reset to beginning
        }
    }
    playPauseMusic() {
        if (!this.pauseMusic) {
            this.pauseMusic = new Audio('music/mu_pause.mp3');
            this.pauseMusic.loop = true;
        }
        this.pauseMusic.volume = this.getMusicVolume();
        this.pauseMusic.currentTime = 0;
        this.pauseMusic.play().catch(e => {
            console.log('Pause music play blocked:', e);
        });
    }

    stopPauseMusic() {
        if (this.pauseMusic) {
            this.pauseMusic.pause();
            this.pauseMusic.currentTime = 0;
        }
    }

    pauseAll() {
        this.isPausedAll = true;
        this.fadeIntervals.forEach(interval => clearInterval(interval));
        this.fadeIntervals = [];

        if (this.ctx && this.ctx.state === 'running') {
            this.ctx.suspend();
        }
        for (const key in this.files) {
            const audio = this.files[key];
            if (!audio.paused) {
                audio.wasPlaying = true;
                audio.pause();
            } else {
                audio.wasPlaying = false;
            }
        }
        for (const key in this.musicFiles) {
            const audio = this.musicFiles[key];
            if (!audio.paused) {
                audio.wasPlaying = true;
                audio.pause();
            } else {
                audio.wasPlaying = false;
            }
        }
        if (this.currentMusicAudio && !this.currentMusicAudio.paused) {
            this.currentMusicAudio.wasPlaying = true;
            this.currentMusicAudio.pause();
        }

        // Start relaxing pause music
        this.playPauseMusic();
    }

    resumeAll() {
        this.isPausedAll = false;
        // Stop pause music
        this.stopPauseMusic();

        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        for (const key in this.files) {
            const audio = this.files[key];
            if (audio.wasPlaying) {
                audio.play().catch(e => console.log('Resume blocked:', e));
                audio.wasPlaying = false;
            }
        }
        for (const key in this.musicFiles) {
            const audio = this.musicFiles[key];
            if (audio.wasPlaying) {
                audio.volume = this.getMusicVolume();
                audio.play().catch(e => console.log('Resume blocked:', e));
                audio.wasPlaying = false;
            }
        }
        if (this.currentMusicAudio && this.currentMusicAudio.wasPlaying) {
            this.currentMusicAudio.volume = this.getMusicVolume();
            this.currentMusicAudio.play().catch(e => console.log('Resume blocked:', e));
            this.currentMusicAudio.wasPlaying = false;
        }
    }

    play(soundName) {
        if (this.files) {
            if (soundName === 'groundpound' && this.files.sfx_freefallstart) {
                this.stopFile('sfx_freefall');
                this.playFile('sfx_freefallstart', true);
                if (this.files.sfx_freefall) {
                    this.files.sfx_freefallstart.onended = () => {
                        this.playFile('sfx_freefall');
                    };
                }
                return;
            }
            if (this.files[soundName]) {
                this.playFile(soundName, true);
                return;
            }
        }
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
