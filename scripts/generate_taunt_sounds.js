const fs = require('fs');
const path = require('path');

function createWavBuffer(samples, sampleRate = 44100) {
    const bytesPerSample = 2;
    const numChannels = 1;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = samples.length * bytesPerSample;
    const buffer = Buffer.alloc(44 + dataSize);

    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + dataSize, 4);
    buffer.write('WAVE', 8);
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20);
    buffer.writeUInt16LE(numChannels, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(byteRate, 28);
    buffer.writeUInt16LE(blockAlign, 32);
    buffer.writeUInt16LE(16, 34);
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataSize, 40);

    let offset = 44;
    for (let i = 0; i < samples.length; i++) {
        let s = Math.max(-1, Math.min(1, samples[i]));
        let val = s < 0 ? s * 0x8000 : s * 0x7FFF;
        buffer.writeInt16LE(Math.round(val), offset);
        offset += 2;
    }
    return buffer;
}

// 1. Wacky Cartoon Spring Boing (엉뚱한 만화 용수철 뾰요요요용~!)
function synthesizeWackyBoing(sampleRate = 44100) {
    const duration = 0.42;
    const totalSamples = Math.round(duration * sampleRate);
    const out = new Float32Array(totalSamples);

    let phase = 0;
    let phaseHarm = 0;

    for (let i = 0; i < totalSamples; i++) {
        const t = i / sampleRate;

        let baseFreq = 0;
        if (t < 0.08) {
            baseFreq = 180 + (950 - 180) * Math.pow(t / 0.08, 0.6);
        } else {
            const relT = (t - 0.08) / 0.34;
            baseFreq = 850 - 250 * relT;
        }

        const wobble = Math.sin(2 * Math.PI * 26 * t) * 120 * Math.exp(-t * 4);
        const curFreq = Math.max(60, baseFreq + wobble);

        phase += curFreq / sampleRate;
        if (phase >= 1.0) phase -= Math.floor(phase);
        phaseHarm += (curFreq * 2.02) / sampleRate;
        if (phaseHarm >= 1.0) phaseHarm -= Math.floor(phaseHarm);

        const s1 = Math.sin(2 * Math.PI * phase);
        const s2 = Math.sin(2 * Math.PI * phaseHarm) * 0.35;
        const raw = s1 + s2;
        const sat = Math.tanh(raw * 1.5);

        let env = Math.exp(-t * 6.5);
        if (t < 0.005) env *= (t / 0.005);

        out[i] = sat * env;
    }

    let maxA = 0;
    for (let i = 0; i < totalSamples; i++) if (Math.abs(out[i]) > maxA) maxA = Math.abs(out[i]);
    if (maxA > 0) for (let i = 0; i < totalSamples; i++) out[i] = (out[i] / maxA) * 0.92;

    return out;
}

// 2. Wacky Rubber Chicken / Clown Squeaker (엉뚱한 삑-뽀옥 고무 오리/클라운 혼)
function synthesizeWackySqueak(sampleRate = 44100) {
    const duration = 0.38;
    const totalSamples = Math.round(duration * sampleRate);
    const out = new Float32Array(totalSamples);

    let phase = 0;

    for (let i = 0; i < totalSamples; i++) {
        const t = i / sampleRate;

        let curFreq = 0;
        let env = 0;

        if (t < 0.14) {
            const p1 = t / 0.14;
            curFreq = 1200 + 400 * Math.sin(p1 * Math.PI);
            env = Math.sin(p1 * Math.PI);
        } else if (t < 0.18) {
            curFreq = 0;
            env = 0;
        } else {
            const p2 = (t - 0.18) / 0.20;
            curFreq = 550 * Math.pow(220 / 550, p2);
            env = Math.sin(p2 * Math.PI) * Math.exp(-p2 * 2.5);
        }

        phase += curFreq / sampleRate;
        if (phase >= 1.0) phase -= Math.floor(phase);

        const wave = (phase < 0.30) ? 1.0 : -1.0;
        out[i] = wave * env * 0.75;
    }

    let maxA = 0;
    for (let i = 0; i < totalSamples; i++) if (Math.abs(out[i]) > maxA) maxA = Math.abs(out[i]);
    if (maxA > 0) for (let i = 0; i < totalSamples; i++) out[i] = (out[i] / maxA) * 0.90;

    return out;
}

// 3. Wacky Cartoon Slide Whistle (엉뚱한 만화 슬라이드 휘슬 뾰오오옵-!)
function synthesizeWackyWhistle(sampleRate = 44100) {
    const duration = 0.38;
    const totalSamples = Math.round(duration * sampleRate);
    const out = new Float32Array(totalSamples);

    let phase = 0;

    for (let i = 0; i < totalSamples; i++) {
        const t = i / sampleRate;
        const prog = t / duration;

        let baseFreq = 0;
        if (prog < 0.6) {
            baseFreq = 380 + (1300 - 380) * Math.pow(prog / 0.6, 1.2);
        } else {
            baseFreq = 1300 - (1300 - 600) * ((prog - 0.6) / 0.4);
        }

        const vib = Math.sin(2 * Math.PI * 18 * t) * 45;
        const curFreq = baseFreq + vib;

        phase += curFreq / sampleRate;
        if (phase >= 1.0) phase -= Math.floor(phase);

        const s1 = Math.sin(2 * Math.PI * phase);
        const s3 = Math.sin(2 * Math.PI * phase * 3) * 0.15;

        let env = Math.sin(prog * Math.PI);
        if (prog < 0.1) env = prog / 0.1;

        out[i] = (s1 + s3) * env;
    }

    let maxA = 0;
    for (let i = 0; i < totalSamples; i++) if (Math.abs(out[i]) > maxA) maxA = Math.abs(out[i]);
    if (maxA > 0) for (let i = 0; i < totalSamples; i++) out[i] = (out[i] / maxA) * 0.90;

    return out;
}

// 4. Wacky 8-Bit NES Quirk / Fart Blip (엉뚱한 8비트 뾲-뿌우웅~!)
function synthesizeWackyNesBlip(sampleRate = 44100) {
    const duration = 0.35;
    const totalSamples = Math.round(duration * sampleRate);
    const out = new Float32Array(totalSamples);

    let phaseSq = 0;
    let phaseTri = 0;

    for (let i = 0; i < totalSamples; i++) {
        const t = i / sampleRate;
        const prog = t / duration;

        const fSq = 780 * Math.pow(110 / 780, Math.pow(prog, 0.8));
        phaseSq += fSq / sampleRate;
        if (phaseSq >= 1.0) phaseSq -= Math.floor(phaseSq);

        const fTri = 390 * Math.pow(55 / 390, Math.pow(prog, 0.8));
        phaseTri += fTri / sampleRate;
        if (phaseTri >= 1.0) phaseTri -= Math.floor(phaseTri);

        const sq = (phaseSq < 0.25) ? 1.0 : -1.0;
        const triStep = Math.floor(phaseTri * 32) % 32;
        const tri = (triStep < 16 ? (triStep - 7.5)/7.5 : (23.5 - triStep)/7.5);

        const vol4bit = Math.max(0, Math.min(15, Math.round((1.0 - prog) * 15)));
        let mixed = (sq * 0.6 + tri * 0.4) * (vol4bit / 15);

        out[i] = Math.round(mixed * 15) / 15;
    }

    let maxA = 0;
    for (let i = 0; i < totalSamples; i++) if (Math.abs(out[i]) > maxA) maxA = Math.abs(out[i]);
    if (maxA > 0) for (let i = 0; i < totalSamples; i++) out[i] = (out[i] / maxA) * 0.88;

    return out;
}

// 5. Wacky Tongue Pop & Bouncy Twang (엉뚱한 만화 뾱-통! 텅트위스트)
function synthesizeWackyPopTwang(sampleRate = 44100) {
    const duration = 0.32;
    const totalSamples = Math.round(duration * sampleRate);
    const out = new Float32Array(totalSamples);

    let phase = 0;

    for (let i = 0; i < totalSamples; i++) {
        const t = i / sampleRate;

        let curFreq = 0;
        let env = 0;

        if (t < 0.035) {
            const p = t / 0.035;
            curFreq = 2200 * Math.pow(350 / 2200, p);
            env = Math.sin(p * Math.PI);
        } else {
            const p = (t - 0.035) / 0.285;
            const vib = Math.sin(2 * Math.PI * 32 * t) * 80;
            curFreq = 480 - 160 * p + vib;
            env = Math.exp(-p * 6);
        }

        phase += curFreq / sampleRate;
        if (phase >= 1.0) phase -= Math.floor(phase);

        const wave = Math.sin(2 * Math.PI * phase) + 0.3 * Math.sin(4 * Math.PI * phase);
        out[i] = Math.tanh(wave * 1.4) * env;
    }

    let maxA = 0;
    for (let i = 0; i < totalSamples; i++) if (Math.abs(out[i]) > maxA) maxA = Math.abs(out[i]);
    if (maxA > 0) for (let i = 0; i < totalSamples; i++) out[i] = (out[i] / maxA) * 0.90;

    return out;
}

// 6. SF2 Marimba & Tom Wacky Plink (마리오 사운드폰트 통-또잉~)
function synthesizeWackyPlink(sampleRate = 44100) {
    const duration = 0.36;
    const totalSamples = Math.round(duration * sampleRate);
    const out = new Float32Array(totalSamples);

    let phase1 = 0;
    let phase2 = 0;

    for (let i = 0; i < totalSamples; i++) {
        const t = i / sampleRate;
        const prog = t / duration;

        // Double plink: First high wooden plink, then downward pitch drop
        let f1 = 0, env1 = 0;
        if (t < 0.12) {
            f1 = 784; // G5
            env1 = Math.exp(-t * 25);
        }

        let f2 = 0, env2 = 0;
        if (t >= 0.08) {
            const t2 = t - 0.08;
            f2 = 523 * Math.pow(130 / 523, Math.pow(t2 / 0.28, 0.7)); // C5 down to C3
            env2 = Math.exp(-t2 * 8) * (1.0 + 0.3 * Math.sin(2 * Math.PI * 24 * t2));
        }

        phase1 += f1 / sampleRate;
        if (phase1 >= 1.0) phase1 -= Math.floor(phase1);
        phase2 += f2 / sampleRate;
        if (phase2 >= 1.0) phase2 -= Math.floor(phase2);

        const w1 = Math.sin(2 * Math.PI * phase1) * env1;
        const w2 = (4 * Math.abs(phase2 - 0.5) - 1) * env2; // triangle wave

        out[i] = w1 * 0.6 + w2 * 0.7;
    }

    let maxA = 0;
    for (let i = 0; i < totalSamples; i++) if (Math.abs(out[i]) > maxA) maxA = Math.abs(out[i]);
    if (maxA > 0) for (let i = 0; i < totalSamples; i++) out[i] = (out[i] / maxA) * 0.90;

    return out;
}

const sampleRate = 44100;
const boing = synthesizeWackyBoing(sampleRate);
const squeak = synthesizeWackySqueak(sampleRate);
const whistle = synthesizeWackyWhistle(sampleRate);
const nesBlip = synthesizeWackyNesBlip(sampleRate);
const popTwang = synthesizeWackyPopTwang(sampleRate);
const plink = synthesizeWackyPlink(sampleRate);

const outDir = path.resolve(__dirname, '../sound');

// 1. Primary in-game taunt sound (sound/taunt.wav) -> Set to hilarious Wacky Cartoon Boing!
fs.writeFileSync(path.join(outDir, 'taunt.wav'), createWavBuffer(boing, sampleRate));

// 2. Write dedicated named wacky taunt sounds
fs.writeFileSync(path.join(outDir, 'taunt_wacky_boing.wav'), createWavBuffer(boing, sampleRate));
fs.writeFileSync(path.join(outDir, 'taunt_wacky_squeak.wav'), createWavBuffer(squeak, sampleRate));
fs.writeFileSync(path.join(outDir, 'taunt_wacky_whistle.wav'), createWavBuffer(whistle, sampleRate));
fs.writeFileSync(path.join(outDir, 'taunt_wacky_nes_blip.wav'), createWavBuffer(nesBlip, sampleRate));
fs.writeFileSync(path.join(outDir, 'taunt_wacky_pop_twang.wav'), createWavBuffer(popTwang, sampleRate));
fs.writeFileSync(path.join(outDir, 'taunt_wacky_sf2_plink.wav'), createWavBuffer(plink, sampleRate));

console.log('Successfully generated 6 Wacky Taunt Sounds in sound/:');
console.log('  - sound/taunt.wav (Default in-game: Wacky Boing):', (boing.length / sampleRate).toFixed(3) + 's');
console.log('  - sound/taunt_wacky_boing.wav (만화 뾰요요용 용수철 보잉):', (boing.length / sampleRate).toFixed(3) + 's');
console.log('  - sound/taunt_wacky_squeak.wav (고무 오리/클라운 혼 삑-뽀옥):', (squeak.length / sampleRate).toFixed(3) + 's');
console.log('  - sound/taunt_wacky_whistle.wav (슬라이드 휘슬 뾰오오옵):', (whistle.length / sampleRate).toFixed(3) + 's');
console.log('  - sound/taunt_wacky_nes_blip.wav (8비트 뾲-뿌우웅 NES 블립):', (nesBlip.length / sampleRate).toFixed(3) + 's');
console.log('  - sound/taunt_wacky_pop_twang.wav (만화 뾱-통! 텅팝):', (popTwang.length / sampleRate).toFixed(3) + 's');
console.log('  - sound/taunt_wacky_sf2_plink.wav (마리오 사운드폰트 통-또잉):', (plink.length / sampleRate).toFixed(3) + 's');
