const fs = require('fs');
const path = require('path');

// 1. Process and Trim my turn sound.wav
function processMyTurnSound() {
    const srcPath = path.resolve(__dirname, '../my turn sound.wav');
    if (!fs.existsSync(srcPath)) {
        console.error('Source file not found:', srcPath);
        return null;
    }

    const b = fs.readFileSync(srcPath);
    let dataOffset = 12;
    while (dataOffset < b.length) {
        const chunkId = b.toString('ascii', dataOffset, dataOffset + 4);
        const chunkSize = b.readUInt32LE(dataOffset + 4);
        if (chunkId === 'data') {
            dataOffset += 8;
            break;
        }
        dataOffset += 8 + chunkSize;
    }

    const srcSr = 48000;
    const numChannels = 2;
    const totalFrames = Math.floor((b.length - dataOffset) / (2 * numChannels));

    // Convert stereo to mono float
    const rawMono = new Float32Array(totalFrames);
    for (let i = 0; i < totalFrames; i++) {
        const left = b.readInt16LE(dataOffset + i * 4) / 32768;
        const right = b.readInt16LE(dataOffset + i * 4 + 2) / 32768;
        rawMono[i] = (left + right) / 2;
    }

    // Find precise start (threshold > 0.03) and end (after energy drops)
    let startFrame = Math.floor(0.20 * srcSr);
    while (startFrame > 0 && Math.abs(rawMono[startFrame]) > 0.01) {
        startFrame--;
    }
    // Zero-crossing search for click-free start
    while (startFrame < totalFrames - 1 && !(rawMono[startFrame] <= 0 && rawMono[startFrame + 1] >= 0)) {
        startFrame++;
    }

    // End around 1.42s
    let endFrame = Math.floor(1.42 * srcSr);
    while (endFrame < totalFrames - 1 && !(rawMono[endFrame] >= 0 && rawMono[endFrame + 1] <= 0)) {
        endFrame++;
    }

    const activeFrames = endFrame - startFrame;
    const targetSr = 44100;
    const resampledLen = Math.round(activeFrames * (targetSr / srcSr));
    const resampled = new Float32Array(resampledLen);

    for (let i = 0; i < resampledLen; i++) {
        const srcPos = startFrame + (i * srcSr / targetSr);
        const idx0 = Math.floor(srcPos);
        const idx1 = Math.min(totalFrames - 1, idx0 + 1);
        const frac = srcPos - idx0;
        resampled[i] = rawMono[idx0] * (1 - frac) + rawMono[idx1] * frac;
    }

    // Micro fade-in (5ms) and smooth fade-out (60ms)
    const fadeIn = Math.round(0.005 * targetSr);
    for (let i = 0; i < fadeIn; i++) {
        resampled[i] *= (i / fadeIn);
    }
    const fadeOut = Math.round(0.08 * targetSr);
    for (let i = 0; i < fadeOut; i++) {
        const idx = resampledLen - 1 - i;
        if (idx >= 0) resampled[idx] *= (i / fadeOut);
    }

    // Peak normalize to 0.88
    let maxA = 0;
    for (let i = 0; i < resampledLen; i++) {
        const a = Math.abs(resampled[i]);
        if (a > maxA) maxA = a;
    }
    if (maxA > 0) {
        const scale = 0.88 / maxA;
        for (let i = 0; i < resampledLen; i++) resampled[i] *= scale;
    }

    return { samples: resampled, sampleRate: targetSr, duration: resampledLen / targetSr };
}

// 2. Synthesize 8-Bit NES version styled after my turn sound.wav
// Duration: 1.22s
// Envelope: Initial screech bite (1750Hz->1200Hz) + 14Hz chatter modulation + 60Hz rumble + 260Hz squeak burst
function synthesizeNesTurnSound(targetSr = 44100) {
    const duration = 1.22;
    const totalSamples = Math.round(duration * targetSr);
    const out = new Float32Array(totalSamples);

    // NES Noise generator
    let shiftReg = 1;
    const noise = new Float32Array(totalSamples);
    for (let i = 0; i < totalSamples; i++) {
        const t = i / targetSr;
        const freqRatio = Math.max(0.15, 1.0 - (t / duration) * 0.6);
        const stepRate = Math.round(targetSr / (2400 * freqRatio));
        if (i % stepRate === 0) {
            const feedbackBit = (shiftReg & 1) ^ ((shiftReg >> 1) & 1);
            shiftReg = (shiftReg >> 1) | (feedbackBit << 14);
        }
        noise[i] = (shiftReg & 1) ? 1.0 : -1.0;
    }

    // 1750Hz -> 1100Hz square wave bite (t=0 to 0.20s)
    let phaseSq1 = 0;
    let phaseSq2 = 0;
    let phaseTri = 0;

    for (let i = 0; i < totalSamples; i++) {
        const t = i / targetSr;
        const prog = t / duration;

        // Attack screech (first 0.20s)
        let sqBite = 0;
        if (t < 0.25) {
            const curFreq = 1750 * Math.pow(1100 / 1750, t / 0.25);
            phaseSq1 += curFreq / targetSr;
            if (phaseSq1 >= 1.0) phaseSq1 -= Math.floor(phaseSq1);
            const envBite = Math.sin((t / 0.25) * Math.PI) * Math.exp(-t * 3);
            sqBite = ((phaseSq1 < 0.25) ? 1.0 : -1.0) * envBite * 0.35;
        }

        // Secondary resonant squeak burst at t = 0.80s ~ 1.10s (matching my turn sound.wav second peak)
        let sqBurst = 0;
        if (t >= 0.75 && t < 1.15) {
            const burstT = (t - 0.75) / 0.40;
            const curFreq2 = 270 + 30 * Math.sin(2 * Math.PI * 8 * burstT);
            phaseSq2 += curFreq2 / targetSr;
            if (phaseSq2 >= 1.0) phaseSq2 -= Math.floor(phaseSq2);
            const envBurst = Math.sin(burstT * Math.PI) * 0.30;
            sqBurst = ((phaseSq2 < 0.5) ? 1.0 : -1.0) * envBurst;
        }

        // Low rumble triangle body (55Hz)
        phaseTri += 55 / targetSr;
        if (phaseTri >= 1.0) phaseTri -= Math.floor(phaseTri);
        const triVal = 4 * Math.abs(phaseTri - 0.5) - 1; // triangle wave -1 to +1
        let triEnv = 0;
        if (t >= 0.10 && t < 0.85) {
            triEnv = Math.sin(((t - 0.10) / 0.75) * Math.PI) * 0.45;
        }

        // 14Hz chatter modulation (matches the 60-70ms peaks in my turn sound.wav)
        const chatter = 0.75 + 0.25 * Math.sin(2 * Math.PI * 14 * t);

        // Overall envelope matching my turn sound.wav
        let env = 1.0;
        if (t < 0.02) {
            env = t / 0.02;
        } else if (prog > 0.65) {
            env = Math.max(0, 1.0 - (prog - 0.65) / 0.35);
        }

        const noiseVal = noise[i] * 0.55 * chatter;
        out[i] = (noiseVal + sqBite + triVal * triEnv + sqBurst) * env;
    }

    // 16-level 8-bit DAC quantization
    for (let i = 0; i < totalSamples; i++) {
        const levels = 15;
        out[i] = Math.round(out[i] * levels) / levels;
    }

    // Peak normalize
    let maxA = 0;
    for (let i = 0; i < totalSamples; i++) {
        const a = Math.abs(out[i]);
        if (a > maxA) maxA = a;
    }
    if (maxA > 0) {
        for (let i = 0; i < totalSamples; i++) out[i] = (out[i] / maxA) * 0.88;
    }

    return { samples: out, sampleRate: targetSr, duration };
}

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

const trimmed = processMyTurnSound();
const nesTurn = synthesizeNesTurnSound(44100);

if (trimmed) {
    const outDir = path.resolve(__dirname, '../sound');
    
    // 1. Write the clean trimmed reference sound
    const trimmedBuf = createWavBuffer(trimmed.samples, trimmed.sampleRate);
    fs.writeFileSync(path.join(outDir, 'my_turn_sound_trimmed.wav'), trimmedBuf);
    
    // 2. Write the 8-bit NES version modeled after my turn sound
    const nesBuf = createWavBuffer(nesTurn.samples, nesTurn.sampleRate);
    fs.writeFileSync(path.join(outDir, 'smb3_drift_turn_nes.wav'), nesBuf);
    
    // 3. Apply to in-game drift sfx (sfx_machslideboost.wav)
    // The user requested: "드리프트 소리는 my turn sound.wav 랑 비슷하게 해줘"
    // Using the clean trimmed version as primary in-game sound:
    fs.writeFileSync(path.join(outDir, 'sfx_machslideboost.wav'), trimmedBuf);
    fs.writeFileSync(path.join(outDir, 'smb3_drift.wav'), trimmedBuf);

    console.log('Successfully processed turn sound:');
    console.log(`  - my_turn_sound_trimmed.wav: ${trimmed.duration.toFixed(3)}s (Zero-latency master of my turn sound.wav)`);
    console.log(`  - smb3_drift_turn_nes.wav: ${nesTurn.duration.toFixed(3)}s (8-bit NES recreation of my turn sound)`);
    console.log(`  - sfx_machslideboost.wav updated (${trimmed.duration.toFixed(3)}s)!`);
}
