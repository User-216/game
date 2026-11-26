const fs = require('fs');
const path = require('path');

// Helper: 16-bit 44.1kHz Stereo WAV generator
function createStereoWav(samplesL, samplesR, sampleRate = 44100) {
    const numSamples = samplesL.length;
    const numChannels = 2;
    const bytesPerSample = 2;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = numSamples * blockAlign;
    const buf = Buffer.alloc(44 + dataSize);

    buf.write('RIFF', 0);
    buf.writeUInt32LE(36 + dataSize, 4);
    buf.write('WAVE', 8);
    buf.write('fmt ', 12);
    buf.writeUInt32LE(16, 16);
    buf.writeUInt16LE(1, 20); // PCM
    buf.writeUInt16LE(numChannels, 22);
    buf.writeUInt32LE(sampleRate, 24);
    buf.writeUInt32LE(byteRate, 28);
    buf.writeUInt16LE(blockAlign, 32);
    buf.writeUInt16LE(16, 34);
    buf.write('data', 36);
    buf.writeUInt32LE(dataSize, 40);

    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
        let sl = Math.max(-1, Math.min(1, samplesL[i]));
        let sr = Math.max(-1, Math.min(1, samplesR[i]));
        let vl = Math.round(sl < 0 ? sl * 0x8000 : sl * 0x7FFF);
        let vr = Math.round(sr < 0 ? sr * 0x8000 : sr * 0x7FFF);
        buf.writeInt16LE(vl, offset);
        buf.writeInt16LE(vr, offset + 2);
        offset += 4;
    }
    return buf;
}

// Biquad Filter implementation for realistic formant and acoustic body shaping
class Biquad {
    constructor() {
        this.x1 = 0; this.x2 = 0;
        this.y1 = 0; this.y2 = 0;
        this.b0 = 1; this.b1 = 0; this.b2 = 0;
        this.a1 = 0; this.a2 = 0;
    }
    setBandpass(freq, q, sr = 44100) {
        const w0 = 2 * Math.PI * freq / sr;
        const alpha = Math.sin(w0) / (2 * q);
        const a0 = 1 + alpha;
        this.b0 = (Math.sin(w0) / 2) / a0;
        this.b1 = 0;
        this.b2 = (-Math.sin(w0) / 2) / a0;
        this.a1 = (-2 * Math.cos(w0)) / a0;
        this.a2 = (1 - alpha) / a0;
    }
    setLowpass(freq, q, sr = 44100) {
        const w0 = 2 * Math.PI * freq / sr;
        const cosw0 = Math.cos(w0);
        const alpha = Math.sin(w0) / (2 * q);
        const a0 = 1 + alpha;
        this.b0 = ((1 - cosw0) / 2) / a0;
        this.b1 = (1 - cosw0) / a0;
        this.b2 = ((1 - cosw0) / 2) / a0;
        this.a1 = (-2 * cosw0) / a0;
        this.a2 = (1 - alpha) / a0;
    }
    process(x) {
        const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;
        this.x2 = this.x1; this.x1 = x;
        this.y2 = this.y1; this.y1 = y;
        return y;
    }
}

// 1. Synthesize Wacky Cartoon "BAY-CON!" Vocal Taunt (새로 만든 엉뚱한 만화 캐릭터 베이컨 보컬 도발)
function synthesizeVocalBacon(sr = 44100) {
    const duration = 0.49;
    const n = Math.round(duration * sr);
    const outL = new Float32Array(n);
    const outR = new Float32Array(n);

    // Formant filters for Syllable 1 ("BAY-")
    const f1_1 = new Biquad(); f1_1.setBandpass(480, 5, sr);
    const f2_1 = new Biquad(); f2_1.setBandpass(1850, 7, sr);
    const f3_1 = new Biquad(); f3_1.setBandpass(2600, 8, sr);

    // Formant filters for Syllable 2 ("-KIN!")
    const f1_2 = new Biquad(); f1_2.setBandpass(650, 5, sr);
    const f2_2 = new Biquad(); f2_2.setBandpass(1100, 6, sr);
    const f3_2 = new Biquad(); f3_2.setBandpass(2200, 7, sr);

    let phaseVoiced = 0;
    for (let i = 0; i < n; i++) {
        const t = i / sr;
        let sig = 0;

        if (t < 0.17) {
            // Syllable 1: "BAY-" (Punchy cartoon voice, F0 190Hz -> 160Hz)
            const p = t / 0.17;
            const f0 = 195 - 35 * p;
            phaseVoiced += f0 / sr;
            if (phaseVoiced >= 1.0) phaseVoiced -= 1.0;

            // Glottal excitation: Rosenberg glottal pulse approximation + harmonics
            let glot = (phaseVoiced < 0.6) ? Math.sin(phaseVoiced / 0.6 * Math.PI) : 0;
            glot += 0.3 * Math.sin(2 * Math.PI * phaseVoiced * 2);
            glot += 0.15 * Math.sin(2 * Math.PI * phaseVoiced * 3);

            // Subharmonic growl
            glot += 0.2 * Math.sin(Math.PI * phaseVoiced);

            // Envelope
            let env = Math.sin(p * Math.PI);
            if (p < 0.1) env = p / 0.1;

            const v1 = f1_1.process(glot) * 1.5;
            const v2 = f2_1.process(glot) * 1.8;
            const v3 = f3_1.process(glot) * 0.9;
            sig = (v1 + v2 + v3) * env * 2.2;
        } else if (t < 0.20) {
            // Plosive release "-K-" (Quiet closure then crisp burst at 0.195s)
            if (t >= 0.192) {
                const kt = (t - 0.192) / 0.008;
                const burst = (Math.random() * 2 - 1) * Math.sin(kt * Math.PI) * 0.8;
                sig = burst;
            }
        } else {
            // Syllable 2: "-CON! / -KIN!" (Comedic falsetto squeak jump: 620Hz down to 520Hz)
            const p = (t - 0.20) / 0.29;
            const f0 = 620 - 90 * Math.pow(p, 0.7) + Math.sin(2 * Math.PI * 25 * t) * 20;
            phaseVoiced += f0 / sr;
            if (phaseVoiced >= 1.0) phaseVoiced -= 1.0;

            let glot = (phaseVoiced < 0.5) ? Math.sin(phaseVoiced / 0.5 * Math.PI) : -0.2 * Math.sin((phaseVoiced - 0.5) / 0.5 * Math.PI);
            glot += 0.3 * Math.sin(2 * Math.PI * phaseVoiced * 2);

            let env = Math.sin(p * Math.PI) * Math.exp(-p * 2.2);
            if (p < 0.05) env = p / 0.05;

            const v1 = f1_2.process(glot) * 1.6;
            const v2 = f2_2.process(glot) * 1.9;
            const v3 = f3_2.process(glot) * 1.2;
            sig = (v1 + v2 + v3) * env * 2.5;
        }

        // Saturation & presence
        sig = Math.tanh(sig * 1.35);

        // Subtle stereo spread
        outL[i] = sig * 0.95;
        outR[i] = sig * 0.90;
    }

    normalizeStereo(outL, outR, 0.90);
    return { l: outL, r: outR };
}

// 2. Synthesize Classic Pizza Tower / Slapstick Orchestra Hit (브라스 오케스트라 히트)
function synthesizeOrchestraHit(sr = 44100) {
    const duration = 0.50;
    const n = Math.round(duration * sr);
    const outL = new Float32Array(n);
    const outR = new Float32Array(n);

    // Multi-voice chord frequencies (C minor / major slap: C3, G3, C4, Eb4, G4, C5)
    const baseFreqs = [130.81, 196.00, 261.63, 311.13, 392.00, 523.25];
    const phasesL = new Array(baseFreqs.length).fill(0);
    const phasesR = new Array(baseFreqs.length).fill(0);
    const detuneL = [1.0, 0.997, 1.002, 0.998, 1.003, 1.001];
    const detuneR = [1.0, 1.003, 0.998, 1.002, 0.997, 1.004];

    const lpfL = new Biquad();
    const lpfR = new Biquad();

    // Reverb delay line buffers
    const dLenL = Math.round(0.029 * sr);
    const dLenR = Math.round(0.037 * sr);
    const dBufL = new Float32Array(dLenL);
    const dBufR = new Float32Array(dLenR);
    let dIdxL = 0, dIdxR = 0;

    for (let i = 0; i < n; i++) {
        const t = i / sr;
        const prog = t / duration;

        // Cutoff sweep: Bright brass burst (7500Hz) falling to warm hall decay (800Hz)
        const cutoff = 800 + 6700 * Math.exp(-prog * 8);
        lpfL.setLowpass(cutoff, 1.8, sr);
        lpfR.setLowpass(cutoff, 1.8, sr);

        // Dynamic amplitude envelope
        const env = Math.exp(-prog * 5.5) * (t < 0.005 ? (t / 0.005) : 1.0);

        // Layer 1: Detuned sawtooth stack
        let stackL = 0, stackR = 0;
        for (let v = 0; v < baseFreqs.length; v++) {
            phasesL[v] += (baseFreqs[v] * detuneL[v]) / sr;
            if (phasesL[v] >= 1.0) phasesL[v] -= 1.0;
            phasesR[v] += (baseFreqs[v] * detuneR[v]) / sr;
            if (phasesR[v] >= 1.0) phasesR[v] -= 1.0;

            const sawL = 2.0 * phasesL[v] - 1.0;
            const sawR = 2.0 * phasesR[v] - 1.0;
            stackL += sawL;
            stackR += sawR;
        }

        // Layer 2: Percussive slap attack transient (0 to 15ms)
        let slap = 0;
        if (t < 0.02) {
            const st = t / 0.02;
            const thud = Math.sin(2 * Math.PI * (180 - 100 * st) * t);
            const snap = (Math.random() * 2 - 1) * Math.exp(-st * 15);
            slap = (thud * 0.8 + snap * 0.7) * (1 - st);
        }

        let dryL = (stackL * 0.22 + slap * 0.6) * env;
        let dryR = (stackR * 0.22 + slap * 0.6) * env;

        // Filter through lowpass
        let fltL = lpfL.process(dryL);
        let fltR = lpfR.process(dryR);

        // Simple stereo acoustic reflections
        const echoL = dBufL[dIdxL];
        const echoR = dBufR[dIdxR];
        dBufL[dIdxL] = fltL + echoR * 0.35;
        dBufR[dIdxR] = fltR + echoL * 0.35;
        dIdxL = (dIdxL + 1) % dLenL;
        dIdxR = (dIdxR + 1) % dLenR;

        outL[i] = Math.tanh(fltL * 1.2 + echoL * 0.35);
        outR[i] = Math.tanh(fltR * 1.2 + echoR * 0.35);
    }

    normalizeStereo(outL, outR, 0.90);
    return { l: outL, r: outR };
}

// 3. Synthesize Cartoon Mouth Pop & Spring Bonk (찰진 만화 입술 뾲! & 용수철 띠요옹)
function synthesizeCartoonPopBonk(sr = 44100) {
    const duration = 0.44;
    const n = Math.round(duration * sr);
    const outL = new Float32Array(n);
    const outR = new Float32Array(n);

    const bp = new Biquad();
    bp.setBandpass(540, 8, sr);

    let phaseSpring = 0;
    for (let i = 0; i < n; i++) {
        const t = i / sr;

        // Part 1: Instant cavitation lip pop (0.00s to 0.05s)
        let pop = 0;
        if (t < 0.06) {
            const pt = t / 0.06;
            const popFreq = 2600 * Math.pow(240 / 2600, pt);
            pop = Math.sin(2 * Math.PI * popFreq * t) * Math.sin(pt * Math.PI) * Math.exp(-pt * 3.5);
        }

        // Part 2: Silly cartoon spring bonk (0.04s to 0.44s)
        let spring = 0;
        if (t >= 0.03) {
            const st = (t - 0.03) / 0.41;
            const vib = Math.sin(2 * Math.PI * 28 * t) * 90 * Math.exp(-st * 3.0);
            const f = 420 - 180 * st + vib;
            phaseSpring += f / sr;
            if (phaseSpring >= 1.0) phaseSpring -= 1.0;

            const w = Math.sin(2 * Math.PI * phaseSpring) + 0.4 * Math.sin(4 * Math.PI * phaseSpring);
            const env = Math.sin(st * Math.PI) * Math.exp(-st * 4.5);
            spring = w * env;
        }

        const filteredSpring = bp.process(spring) * 1.8 + spring * 0.4;
        const sig = Math.tanh((pop * 1.2 + filteredSpring * 0.9) * 1.4);

        outL[i] = sig;
        outR[i] = sig * 0.96;
    }

    normalizeStereo(outL, outR, 0.90);
    return { l: outL, r: outR };
}

// 4. Synthesize Wacky Clown Horn & Duck Quack (엉뚱한 클라운 에어혼 & 오리 꽥!)
function synthesizeWackyHonk(sr = 44100) {
    const duration = 0.40;
    const n = Math.round(duration * sr);
    const outL = new Float32Array(n);
    const outR = new Float32Array(n);

    const bp = new Biquad();

    let p1 = 0, p2 = 0;
    for (let i = 0; i < n; i++) {
        const t = i / sr;
        const prog = t / duration;

        // Reed dual frequency: 320Hz and 400Hz (cartoon chord)
        const f1 = 320 - 40 * Math.pow(prog, 1.2);
        const f2 = 405 - 55 * Math.pow(prog, 1.2);
        p1 += f1 / sr; if (p1 >= 1.0) p1 -= 1.0;
        p2 += f2 / sr; if (p2 >= 1.0) p2 -= 1.0;

        // Rich reed waves
        const reed1 = (p1 < 0.4) ? 1.0 : -1.0;
        const reed2 = (p2 < 0.4) ? 0.7 : -0.7;

        // Formant sweep (horn flare: 1400Hz down to 600Hz)
        const flare = 600 + 800 * Math.exp(-prog * 4);
        bp.setBandpass(flare, 4.5, sr);

        // Air burst puff
        const air = (Math.random() * 2 - 1) * Math.exp(-prog * 12) * 0.5;

        const raw = (reed1 + reed2 + air);
        const filtered = bp.process(raw) * 1.9;

        let env = Math.sin(prog * Math.PI) * Math.exp(-prog * 2.5);
        if (prog < 0.04) env = prog / 0.04;

        const sig = Math.tanh(filtered * env * 1.5);
        outL[i] = sig;
        outR[i] = sig * 0.94;
    }

    normalizeStereo(outL, outR, 0.90);
    return { l: outL, r: outR };
}

// 5. Synthesize Cast Iron Frying Pan Clang & Bacon Sizzle (프라이팬 깡-! & 베이컨 지글지글 고음질 사운드)
function synthesizeFryingPanSizzle(sr = 44100) {
    const duration = 0.52;
    const n = Math.round(duration * sr);
    const outL = new Float32Array(n);
    const outR = new Float32Array(n);

    const panModes = [
        [485, 0.45, 10],
        [735, 0.35, 16],
        [1160, 0.28, 22],
        [1590, 0.22, 28],
        [2240, 0.18, 35],
        [3180, 0.12, 42],
        [4400, 0.08, 50]
    ];

    const bpSizzle = new Biquad();
    bpSizzle.setBandpass(4200, 3.0, sr);

    for (let i = 0; i < n; i++) {
        const t = i / sr;

        // Metallic modal chime
        let metal = 0;
        for (const [freq, amp, decay] of panModes) {
            metal += Math.sin(2 * Math.PI * freq * t) * amp * Math.exp(-t * decay);
        }

        // Sharp strike transient
        let strike = 0;
        if (t < 0.015) {
            const st = t / 0.015;
            strike = (Math.sin(2 * Math.PI * 1800 * t) + (Math.random() * 2 - 1) * 0.6) * (1 - st);
        }

        // Bacon frying sizzle / crackle
        let sizzle = 0;
        if (t >= 0.03) {
            const st = (t - 0.03) / 0.49;
            const crackle = (Math.random() < 0.08 ? (Math.random() * 2 - 1) * 1.5 : (Math.random() * 2 - 1) * 0.3);
            const envSizzle = Math.sin(st * Math.PI) * Math.exp(-st * 2.8) * 0.45;
            sizzle = bpSizzle.process(crackle) * envSizzle;
        }

        const sig = Math.tanh((metal * 0.8 + strike * 0.7 + sizzle * 0.8) * 1.3);
        outL[i] = sig;
        outR[i] = sig * 0.95;
    }

    normalizeStereo(outL, outR, 0.90);
    return { l: outL, r: outR };
}

// 6. Synthesize Slapstick Wet Slap & Slide Whistle (찰진 만화 슬랩 & 익살스러운 슬라이드 휘슬)
function synthesizeSlapWhistle(sr = 44100) {
    const duration = 0.44;
    const n = Math.round(duration * sr);
    const outL = new Float32Array(n);
    const outR = new Float32Array(n);

    let phaseWhistle = 0;
    for (let i = 0; i < n; i++) {
        const t = i / sr;

        // Slap transient (0.00s to 0.07s)
        let slap = 0;
        if (t < 0.07) {
            const st = t / 0.07;
            const thud = Math.sin(2 * Math.PI * 130 * t) * Math.exp(-st * 8);
            const crack = (Math.random() * 2 - 1) * Math.exp(-st * 16);
            slap = (thud * 0.7 + crack * 0.8);
        }

        // Whistle glissando (0.05s to 0.44s)
        let whistle = 0;
        if (t >= 0.04) {
            const wt = (t - 0.04) / 0.40;
            const wFreq = 520 + 1300 * Math.pow(wt, 1.4);
            const vib = Math.sin(2 * Math.PI * 18 * t) * 45;
            phaseWhistle += (wFreq + vib) / sr;
            if (phaseWhistle >= 1.0) phaseWhistle -= 1.0;

            const w = Math.sin(2 * Math.PI * phaseWhistle) + 0.15 * Math.sin(6 * Math.PI * phaseWhistle);
            const env = Math.sin(wt * Math.PI) * Math.exp(-wt * 1.2) * 0.7;
            whistle = w * env;
        }

        const sig = Math.tanh((slap * 0.85 + whistle * 0.75) * 1.25);
        outL[i] = sig;
        outR[i] = sig * 0.95;
    }

    normalizeStereo(outL, outR, 0.90);
    return { l: outL, r: outR };
}

function normalizeStereo(l, r, target = 0.90) {
    let peak = 0;
    for (let i = 0; i < l.length; i++) {
        const al = Math.abs(l[i]);
        const ar = Math.abs(r[i]);
        if (al > peak) peak = al;
        if (ar > peak) peak = ar;
    }
    if (peak > 0) {
        const scale = target / peak;
        for (let i = 0; i < l.length; i++) {
            l[i] *= scale;
            r[i] *= scale;
        }
    }
}

// Generate all sounds
const sr = 44100;
const sounds = {
    'taunt_bacon_vocal.wav': synthesizeVocalBacon(sr),
    'taunt_orchestra_hit.wav': synthesizeOrchestraHit(sr),
    'taunt_cartoon_bonk_pop.wav': synthesizeCartoonPopBonk(sr),
    'taunt_wacky_honk.wav': synthesizeWackyHonk(sr),
    'taunt_frying_pan.wav': synthesizeFryingPanSizzle(sr),
    'taunt_slap_whistle.wav': synthesizeSlapWhistle(sr),
};

const soundDir = path.resolve(__dirname, '../sound');
for (const [name, audio] of Object.entries(sounds)) {
    const buf = createStereoWav(audio.l, audio.r, sr);
    fs.writeFileSync(path.join(soundDir, name), buf);
    console.log(`Saved sound/${name} (${(audio.l.length / sr).toFixed(3)}s)`);
}

// Also update the active sound/taunt.wav to the brand new vocal taunt or orchestra hit!
// Default to the brand new synthesized cartoon vocal taunt (taunt_bacon_vocal.wav)
fs.writeFileSync(path.join(soundDir, 'taunt.wav'), createStereoWav(sounds['taunt_bacon_vocal.wav'].l, sounds['taunt_bacon_vocal.wav'].r, sr));
console.log('Set sound/taunt.wav to brand new synthesized taunt_bacon_vocal.wav!');
