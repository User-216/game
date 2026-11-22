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

// 1. True NES 2A03 APU Triangle Generator (32-step staircase: 0..15..0..-15)
function getNesTriangleSample(phase) {
    const step = Math.floor(phase * 32) % 32;
    let val;
    if (step < 16) {
        val = (step - 7.5) / 7.5;
    } else {
        val = (23.5 - step) / 7.5;
    }
    return Math.round(val * 15) / 15;
}

// 2. True NES 2A03 Pulse Generator (4-bit volume, duty cycle)
function getNesSquareSample(phase, duty = 0.25, vol4bit = 15) {
    const high = (phase % 1.0) < duty;
    const normVol = (vol4bit & 15) / 15;
    return (high ? normVol : -normVol);
}

// 3. True NES 2A03 Noise Generator (1-bit LFSR, 16-level volume)
class NesNoiseGen {
    constructor(mode = 0) {
        this.shiftReg = 1;
        this.mode = mode;
        this.currentBit = 1;
    }
    step() {
        const feedbackBit = this.mode === 1 
            ? ((this.shiftReg & 1) ^ ((this.shiftReg >> 6) & 1))
            : ((this.shiftReg & 1) ^ ((this.shiftReg >> 1) & 1));
        this.shiftReg = (this.shiftReg >> 1) | (feedbackBit << 14);
        this.currentBit = (this.shiftReg & 1) ? 1.0 : -1.0;
        return this.currentBit;
    }
}

// Authentic 8-Bit NES Pixel Drift modeled after my turn sound.wav
function synthesizePixelDrift(sampleRate = 44100, noiseRatio = 0.40, squareBiteRatio = 0.30) {
    const duration = 1.22;
    const totalSamples = Math.round(duration * sampleRate);
    const out = new Float32Array(totalSamples);

    const noiseGen = new NesNoiseGen(0);
    const noiseMetallic = new NesNoiseGen(1);

    let phaseTri = 0;
    let phaseSq1 = 0;
    let phaseSq2 = 0;

    let curNoiseBit = 1;
    let noiseClockAcc = 0;

    for (let i = 0; i < totalSamples; i++) {
        const t = i / sampleRate;
        const prog = t / duration;

        // 13.5Hz flutter chatter envelope (4-bit: 0..15)
        const chatterRaw = 0.68 + 0.32 * Math.sin(2 * Math.PI * 13.5 * t);
        const chatterVol4bit = Math.max(0, Math.min(15, Math.round(chatterRaw * 15)));

        // Overall master envelope (4-bit quantization)
        let masterEnvRaw = 1.0;
        if (t < 0.015) {
            masterEnvRaw = t / 0.015;
        } else if (prog > 0.65) {
            masterEnvRaw = Math.max(0, 1.0 - (prog - 0.65) / 0.35);
        }
        const masterVol4bit = Math.max(0, Math.min(15, Math.round(masterEnvRaw * 15)));

        // 1. NES Triangle Channel: 48Hz Bass Rumble
        const fTri = 48 - prog * 6;
        phaseTri += fTri / sampleRate;
        if (phaseTri >= 1.0) phaseTri -= Math.floor(phaseTri);

        let triEnvRaw = 0;
        if (t < 0.06) triEnvRaw = t / 0.06;
        else if (t < 0.70) triEnvRaw = 1.0 - 0.20 * ((t - 0.06) / 0.64);
        else triEnvRaw = Math.max(0, 0.80 * (1.0 - (t - 0.70) / 0.52));

        const triVol4bit = Math.round(triEnvRaw * (chatterVol4bit / 15) * (masterVol4bit / 15) * 15);
        const triSample = getNesTriangleSample(phaseTri) * (triVol4bit / 15);

        // 2. NES Noise Channel: Sample-and-Hold LFSR
        const noiseFreq = 3800 * Math.max(0.35, 1.0 - prog * 0.45);
        noiseClockAcc += noiseFreq / sampleRate;
        if (noiseClockAcc >= 1.0) {
            noiseClockAcc -= Math.floor(noiseClockAcc);
            curNoiseBit = (prog < 0.15 && i % 2 === 0) ? noiseMetallic.step() : noiseGen.step();
        }
        const noiseVol = Math.round(triEnvRaw * (chatterVol4bit / 15) * (masterVol4bit / 15) * 14);
        const noiseSample = curNoiseBit * (noiseVol / 15);

        // 3. NES Square 1: Initial Bite (1050Hz -> 580Hz, duty 25%)
        let sq1Sample = 0;
        if (t < 0.18) {
            const biteProg = t / 0.18;
            const fSq1 = 1050 * Math.pow(580 / 1050, Math.pow(biteProg, 0.6));
            phaseSq1 += fSq1 / sampleRate;
            if (phaseSq1 >= 1.0) phaseSq1 -= Math.floor(phaseSq1);
            const biteVol4bit = Math.round((1.0 - biteProg) * 15 * (masterVol4bit / 15));
            sq1Sample = getNesSquareSample(phaseSq1, 0.25, biteVol4bit);
        }

        // 4. NES Square 2: Secondary Resonant Surge at t=0.60..1.05s
        let sq2Sample = 0;
        if (t >= 0.55 && t < 1.10) {
            const swellT = (t - 0.55) / 0.55;
            const fSq2 = 300 + 35 * Math.sin(2 * Math.PI * 6.5 * swellT);
            phaseSq2 += fSq2 / sampleRate;
            if (phaseSq2 >= 1.0) phaseSq2 -= Math.floor(phaseSq2);
            const swellVol = Math.round(Math.sin(swellT * Math.PI) * (masterVol4bit / 15) * 12);
            sq2Sample = getNesSquareSample(phaseSq2, 0.50, swellVol);
        }

        // Mix APU channels:
        const triWeight = 0.45;
        let mixed = (triSample * triWeight) + 
                    (noiseSample * noiseRatio) + 
                    (sq1Sample * squareBiteRatio) + 
                    (sq2Sample * 0.22);

        // 4-bit DAC quantization
        const qLevels = 15;
        mixed = Math.round(mixed * qLevels) / qLevels;

        out[i] = mixed;
    }

    let maxA = 0;
    for (let i = 0; i < totalSamples; i++) {
        const a = Math.abs(out[i]);
        if (a > maxA) maxA = a;
    }
    if (maxA > 0) {
        const scale = 0.88 / maxA;
        for (let i = 0; i < totalSamples; i++) out[i] *= scale;
    }

    return out;
}

// Quick 0.28s NES Brake Skid
function synthesizeBrake(sampleRate = 44100) {
    const duration = 0.28;
    const totalSamples = Math.round(duration * sampleRate);
    const out = new Float32Array(totalSamples);
    let shiftReg = 1;
    let phase = 0;

    for (let i = 0; i < totalSamples; i++) {
        const t = i / sampleRate;
        const progress = t / duration;

        if (i % 20 === 0) {
            const feedbackBit = (shiftReg & 1) ^ ((shiftReg >> 1) & 1);
            shiftReg = (shiftReg >> 1) | (feedbackBit << 14);
        }
        const n = (shiftReg & 1) ? 1.0 : -1.0;

        const curFreq = 1400 * Math.pow(500 / 1400, Math.pow(progress, 0.7));
        phase += curFreq / sampleRate;
        if (phase >= 1.0) phase -= Math.floor(phase);
        const sq = (phase < 0.25) ? 1.0 : -1.0;

        let env = 1.0;
        if (t < 0.01) env = t / 0.01;
        else if (progress > 0.4) env = Math.max(0, 1.0 - (progress - 0.4) / 0.6);

        const chatter = 0.8 + 0.2 * Math.sin(2 * Math.PI * 32 * t);
        const squeak = (t < 0.2) ? sq * Math.sin((t / 0.2) * Math.PI) * 0.35 : 0;

        out[i] = (n * 0.7 * chatter + squeak) * env;
    }

    for (let i = 0; i < totalSamples; i++) {
        out[i] = Math.round(out[i] * 15) / 15;
    }

    let maxA = 0;
    for (let i = 0; i < totalSamples; i++) {
        const a = Math.abs(out[i]);
        if (a > maxA) maxA = a;
    }
    if (maxA > 0) {
        const scale = 0.90 / maxA;
        for (let i = 0; i < totalSamples; i++) out[i] *= scale;
    }
    return out;
}

const sampleRate = 44100;
const outDir = path.resolve(__dirname, '../sound');

const pixelDrift1 = synthesizePixelDrift(sampleRate, 0.40, 0.30);
const pixelDriftGritty = synthesizePixelDrift(sampleRate, 0.55, 0.20);
const pixelDriftSqueak = synthesizePixelDrift(sampleRate, 0.30, 0.45);
const brakeSound = synthesizeBrake(sampleRate);

// Active in-game files (100% NES Pixel Drift!)
fs.writeFileSync(path.join(outDir, 'sfx_machslideboost.wav'), createWavBuffer(pixelDrift1, sampleRate));
fs.writeFileSync(path.join(outDir, 'sfx_break.wav'), createWavBuffer(brakeSound, sampleRate));

// Dedicated named files
fs.writeFileSync(path.join(outDir, 'smb3_drift.wav'), createWavBuffer(pixelDrift1, sampleRate));
fs.writeFileSync(path.join(outDir, 'smb3_drift_pixel_turn.wav'), createWavBuffer(pixelDrift1, sampleRate));
fs.writeFileSync(path.join(outDir, 'smb3_drift_pixel_gritty.wav'), createWavBuffer(pixelDriftGritty, sampleRate));
fs.writeFileSync(path.join(outDir, 'smb3_drift_pixel_squeak.wav'), createWavBuffer(pixelDriftSqueak, sampleRate));
fs.writeFileSync(path.join(outDir, 'smb3_break.wav'), createWavBuffer(brakeSound, sampleRate));

console.log('Successfully generated authentic 8-Bit NES Pixel Drift sounds:');
console.log('  - sfx_machslideboost.wav (Active In-Game Pixel Drift): 1.220s');
console.log('  - smb3_drift_pixel_turn.wav (NES Triangle Rumble + Noise + Squeal): 1.220s');
console.log('  - smb3_drift_pixel_gritty.wav (Heavy LFSR Noise): 1.220s');
console.log('  - smb3_drift_pixel_squeak.wav (Squeaky Pulse Tire): 1.220s');
console.log('  - sfx_break.wav (NES Brake Skid): 0.280s');
