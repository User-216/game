const fs = require('fs');
const path = require('path');

const sf2Path = path.resolve(__dirname, '../The_NES_Super_Mario_Ultimate_Soundfont.sf2');
if (!fs.existsSync(sf2Path)) {
    console.error('SF2 file not found at:', sf2Path);
    process.exit(1);
}

const fd = fs.openSync(sf2Path, 'r');
const smplOffset = 250;
const pdtaOffset = 60157390;

function readFourCC(pos) {
    const b = Buffer.alloc(4);
    fs.readSync(fd, b, 0, 4, pos);
    return b.toString('ascii');
}
function readUInt32(pos) {
    const b = Buffer.alloc(4);
    fs.readSync(fd, b, 0, 4, pos);
    return b.readUInt32LE(0);
}

// Locate shdr subchunk
let cur = pdtaOffset + 12;
let shdrSub = null;
while (cur < pdtaOffset + 37824) {
    const fcc = readFourCC(cur);
    const sz = readUInt32(cur + 4);
    if (fcc === 'shdr') {
        shdrSub = { offset: cur + 8, size: sz };
        break;
    }
    cur += 8 + sz;
    if (sz % 2 !== 0) cur++;
}

const shdrBuf = Buffer.alloc(shdrSub.size);
fs.readSync(fd, shdrBuf, 0, shdrSub.size, shdrSub.offset);
const numSamples = shdrSub.size / 46;
const sampleHeaders = [];
for (let i = 0; i < numSamples - 1; i++) {
    const off = i * 46;
    sampleHeaders.push({
        i,
        name: shdrBuf.toString('ascii', off, off + 20).replace(/\0.*$/, ''),
        start: shdrBuf.readUInt32LE(off + 20),
        end: shdrBuf.readUInt32LE(off + 24),
        sampleRate: shdrBuf.readUInt32LE(off + 36),
        originalPitch: shdrBuf.readUInt8(off + 40)
    });
}

function loadSample(header) {
    const numSamples = header.end - header.start;
    const byteOff = smplOffset + header.start * 2;
    const pcmBuf = Buffer.alloc(numSamples * 2);
    fs.readSync(fd, pcmBuf, 0, numSamples * 2, byteOff);

    const f32 = new Float32Array(numSamples);
    for (let i = 0; i < numSamples; i++) {
        f32[i] = pcmBuf.readInt16LE(i * 2) / 32768;
    }
    return f32;
}

// 1. Short Piano SMB3 samples (Piano)
const pianoSamples = {};
sampleHeaders.filter(s => s.name.startsWith('Piano')).forEach(h => {
    pianoSamples[h.originalPitch] = loadSample(h);
});

// 2. Acoustic Guitar SMB3 samples (GG)
const guitarSamples = {};
sampleHeaders.filter(s => s.name.startsWith('GG')).forEach(h => {
    guitarSamples[h.originalPitch] = loadSample(h);
});

// 3. Tubular Bells FDS samples (bell)
const bellSamples = {};
sampleHeaders.filter(s => s.name.startsWith('bell')).forEach(h => {
    bellSamples[h.originalPitch] = loadSample(h);
});

// 4. Drums SMB1 samples (smdr)
const smb1DrumSamples = {};
sampleHeaders.filter(s => s.name.startsWith('smdr')).forEach(h => {
    smb1DrumSamples[h.originalPitch] = loadSample(h);
});

// 5. Drums SMB3 Marker #6 (Key 60, sample 86) for Mach 1 and Mach 2
const drum60Header = sampleHeaders[86];
const drum60Raw = loadSample(drum60Header);

fs.closeSync(fd);

// Function to resample Drum 60 to any MIDI note
function getResampledDrum(midiNote) {
    const semitones = midiNote - 60;
    const ratio = Math.pow(2, semitones / 12);
    const outLen = Math.floor(drum60Raw.length / ratio);
    const out = new Float32Array(outLen);
    for (let i = 0; i < outLen; i++) {
        const srcIdx = i * ratio;
        const idx0 = Math.floor(srcIdx);
        const frac = srcIdx - idx0;
        const s0 = drum60Raw[idx0] || 0;
        const s1 = drum60Raw[idx0 + 1] || 0;
        out[i] = s0 * (1 - frac) + s1 * frac;
    }
    return out;
}

const drum64Raw = getResampledDrum(64);

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

// Generate Mach 1 Drums:
// 64 (0.05 beats) -> rest (0.25 beats) -> 60 (0.05 beats) -> rest (0.25 beats)
// Total loop duration = 0.60 seconds
function generateMach1Drums(sampleRate = 44100) {
    const beatSec = 1.0;
    const dur64 = 0.05 * beatSec;
    const rest1 = 0.25 * beatSec;
    const dur60 = 0.05 * beatSec;
    const rest2 = 0.25 * beatSec;
    const totalSec = dur64 + rest1 + dur60 + rest2;
    const totalSamples = Math.round(totalSec * sampleRate);
    const out = new Float32Array(totalSamples);

    // Note 64 at t = 0
    const start64 = 0;
    const playLen64 = Math.min(drum64Raw.length, Math.round((dur64 + 0.15) * sampleRate));
    for (let i = 0; i < playLen64 && (start64 + i) < totalSamples; i++) {
        let env = 1.0;
        if (i > dur64 * sampleRate) {
            env = Math.max(0, 1.0 - (i - dur64 * sampleRate) / (0.15 * sampleRate));
        }
        out[start64 + i] += drum64Raw[i] * env;
    }

    // Note 60 at t = dur64 + rest1 = 0.30s
    const start60 = Math.round((dur64 + rest1) * sampleRate);
    const playLen60 = Math.min(drum60Raw.length, Math.round((dur60 + 0.15) * sampleRate));
    for (let i = 0; i < playLen60 && (start60 + i) < totalSamples; i++) {
        let env = 1.0;
        if (i > dur60 * sampleRate) {
            env = Math.max(0, 1.0 - (i - dur60 * sampleRate) / (0.15 * sampleRate));
        }
        out[start60 + i] += drum60Raw[i] * env;
    }

    const xfadeLen = 32;
    for (let j = 0; j < xfadeLen; j++) {
        const f = j / xfadeLen;
        out[j] *= f;
        out[totalSamples - 1 - j] *= f;
    }

    let maxA = 0;
    for (let i = 0; i < totalSamples; i++) {
        const a = Math.abs(out[i]);
        if (a > maxA) maxA = a;
    }
    if (maxA > 0) {
        // Scaled down so continuous footstep loop doesn't overpower other SFX and BGM
        const scale = 0.52 / maxA;
        for (let i = 0; i < totalSamples; i++) out[i] *= scale;
    }
    return out;
}

// Generate Mach 2 Drums:
// 64 (0.05 beats) -> rest (0.04 beats) -> 60 (0.05 beats) -> rest (0.04 beats)
// Total loop duration = 0.05 + 0.04 + 0.05 + 0.04 = 0.18 seconds (조금 더 빠른 경쾌한 질주 템포)
function generateMach2Drums(highNote = 64, lowNote = 60, restSec = 0.04, sampleRate = 44100) {
    const drumHigh = getResampledDrum(highNote);
    const drumLow = getResampledDrum(lowNote);
    const beatSec = 1.0;
    const durHigh = 0.05 * beatSec;
    const rest1 = restSec * beatSec;
    const durLow = 0.05 * beatSec;
    const rest2 = restSec * beatSec;
    const totalSec = durHigh + rest1 + durLow + rest2;
    const totalSamples = Math.round(totalSec * sampleRate);
    const out = new Float32Array(totalSamples);

    // High Note at t = 0
    const startHigh = 0;
    const playLenHigh = Math.min(drumHigh.length, Math.round((durHigh + rest1) * sampleRate));
    for (let i = 0; i < playLenHigh && (startHigh + i) < totalSamples; i++) {
        let env = 1.0;
        if (i > durHigh * sampleRate) {
            env = Math.max(0, 1.0 - (i - durHigh * sampleRate) / (rest1 * sampleRate));
        }
        out[startHigh + i] += drumHigh[i] * env;
    }

    // Low Note at t = durHigh + rest1 = 0.12s
    const startLow = Math.round((durHigh + rest1) * sampleRate);
    const playLenLow = Math.min(drumLow.length, Math.round((durLow + rest2) * sampleRate));
    for (let i = 0; i < playLenLow && (startLow + i) < totalSamples; i++) {
        let env = 1.0;
        if (i > durLow * sampleRate) {
            env = Math.max(0, 1.0 - (i - durLow * sampleRate) / (rest2 * sampleRate));
        }
        out[startLow + i] += drumLow[i] * env;
    }

    const xfadeLen = 32;
    for (let j = 0; j < xfadeLen; j++) {
        const f = j / xfadeLen;
        out[j] *= f;
        out[totalSamples - 1 - j] *= f;
    }

    let maxA = 0;
    for (let i = 0; i < totalSamples; i++) {
        const a = Math.abs(out[i]);
        if (a > maxA) maxA = a;
    }
    if (maxA > 0) {
        // Scaled down so continuous footstep loop doesn't overpower other SFX and BGM
        const scale = 0.52 / maxA;
        for (let i = 0; i < totalSamples; i++) out[i] *= scale;
    }
    return out;
}

// Scratch melody sequence: 55..70..60
const sequence = [
    55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70,
    69, 68, 67, 66, 65, 64, 63, 62, 61, 60
];

function renderMelodyLayer(sampleDict, noteDurationSec, staccatoRatio, sampleRate = 44100) {
    const totalDuration = sequence.length * noteDurationSec;
    const totalSamples = Math.round(totalDuration * sampleRate);
    const out = new Float32Array(totalSamples);

    for (let n = 0; n < sequence.length; n++) {
        const key = sequence[n];
        const raw = sampleDict[key];
        if (!raw) continue;

        const sStart = Math.round(n * noteDurationSec * sampleRate);
        const sEnd = Math.min(totalSamples, Math.round((n + 1) * noteDurationSec * sampleRate));
        const noteLen = sEnd - sStart;
        const gateLen = Math.round(noteLen * staccatoRatio);

        for (let i = 0; i < noteLen; i++) {
            const outIdx = sStart + i;
            if (outIdx >= totalSamples) break;

            if (i < raw.length) {
                let s = raw[i];
                if (i > gateLen) {
                    const rel = Math.max(0, 1.0 - (i - gateLen) / (noteLen - gateLen));
                    s *= rel;
                }
                out[outIdx] += s;
            }
        }
    }
    return out;
}

// Drums (SMB1) beat pattern for 26 steps of noteDurationSec
function renderDrumsSMB1Layer(noteDurationSec, sampleRate = 44100) {
    const totalDuration = sequence.length * noteDurationSec;
    const totalSamples = Math.round(totalDuration * sampleRate);
    const out = new Float32Array(totalSamples);

    const kick = smb1DrumSamples[36];
    const snare = smb1DrumSamples[38];
    const hihat = smb1DrumSamples[42];

    const drumEvents = [
        { step: 0, sample: kick, vol: 0.9 },
        { step: 3, sample: hihat, vol: 0.5 },
        { step: 6, sample: snare, vol: 0.8 },
        { step: 9, sample: hihat, vol: 0.5 },
        { step: 13, sample: kick, vol: 0.9 },
        { step: 16, sample: hihat, vol: 0.5 },
        { step: 20, sample: snare, vol: 0.8 },
        { step: 23, sample: hihat, vol: 0.5 }
    ];

    drumEvents.forEach(ev => {
        if (!ev.sample) return;
        const sStart = Math.round(ev.step * noteDurationSec * sampleRate);
        const maxLen = Math.min(ev.sample.length, Math.round(0.12 * sampleRate));
        for (let i = 0; i < maxLen && (sStart + i) < totalSamples; i++) {
            let env = 1.0;
            if (i > 0.08 * sampleRate) {
                env = Math.max(0, 1.0 - (i - 0.08 * sampleRate) / (0.04 * sampleRate));
            }
            out[sStart + i] += ev.sample[i] * ev.vol * env;
        }
    });

    return out;
}

// Generate Mach 3 Ensemble:
// Short Piano + Acoustic Guitar + Tubular Bells (Drums SMB1 removed per user request)
function generateMach3Ensemble(noteDurationSec = 0.032, sampleRate = 44100) {
    const totalDuration = sequence.length * noteDurationSec;
    const totalSamples = Math.round(totalDuration * sampleRate);

    const piano = renderMelodyLayer(pianoSamples, noteDurationSec, 0.85, sampleRate);
    const guitar = renderMelodyLayer(guitarSamples, noteDurationSec, 0.82, sampleRate);
    const bells = renderMelodyLayer(bellSamples, noteDurationSec, 0.80, sampleRate);

    const out = new Float32Array(totalSamples);
    for (let i = 0; i < totalSamples; i++) {
        out[i] = (piano[i] * 0.45) + (guitar[i] * 0.38) + (bells[i] * 0.30);
    }

    // Boundary crossfade
    const xfadeLen = 64;
    for (let j = 0; j < xfadeLen; j++) {
        const f = j / xfadeLen;
        out[j] *= f;
        out[totalSamples - 1 - j] *= f;
    }

    // Peak normalize (scaled down so 3-instrument ensemble doesn't overpower other SFX and BGM)
    let maxA = 0;
    for (let i = 0; i < totalSamples; i++) {
        const a = Math.abs(out[i]);
        if (a > maxA) maxA = a;
    }
    if (maxA > 0) {
        const scale = 0.48 / maxA;
        for (let i = 0; i < totalSamples; i++) out[i] *= scale;
    }

    return out;
}

const sampleRate = 44100;
const outDir = path.resolve(__dirname, '../sound');

// 1. Mach 1: Drums (SMB3) 64 (0.05s) - rest (0.25s) - 60 (0.05s) - rest (0.25s) -> 0.600s
const mach1 = generateMach1Drums(sampleRate);

// 2. Mach 2: Drums (SMB3) 64 (0.05s) - rest (0.04s) - 60 (0.05s) - rest (0.04s) -> 0.180s
const mach2 = generateMach2Drums(64, 60, 0.04, sampleRate);
const mach2_007 = generateMach2Drums(64, 60, 0.07, sampleRate);
const mach2_fast = generateMach2Drums(64, 60, 0.01, sampleRate);

// 3. Mach 3: Piano + Guitar + Bells (Drums SMB1 removed) -> 0.832s
const mach3 = generateMach3Ensemble(0.032, sampleRate);

// Solo piano fallback for Mach 3
const mach3_piano = renderMelodyLayer(pianoSamples, 0.032, 0.85, sampleRate);
for (let j = 0; j < 64; j++) {
    mach3_piano[j] *= (j / 64);
    mach3_piano[mach3_piano.length - 1 - j] *= (j / 64);
}
let maxP3 = 0;
for (let i = 0; i < mach3_piano.length; i++) {
    const a = Math.abs(mach3_piano[i]);
    if (a > maxP3) maxP3 = a;
}
if (maxP3 > 0) {
    for (let i = 0; i < mach3_piano.length; i++) mach3_piano[i] = (mach3_piano[i] / maxP3) * 0.50;
}

// 4. Mach 4: Hyper-speed Piano SMB3 melody -> 0.016s per note = 0.416s
const mach4 = renderMelodyLayer(pianoSamples, 0.016, 0.82, sampleRate);
for (let j = 0; j < 64; j++) {
    mach4[j] *= (j / 64);
    mach4[mach4.length - 1 - j] *= (j / 64);
}
let maxM4 = 0;
for (let i = 0; i < mach4.length; i++) {
    const a = Math.abs(mach4[i]);
    if (a > maxM4) maxM4 = a;
}
if (maxM4 > 0) {
    for (let i = 0; i < mach4.length; i++) mach4[i] = (mach4[i] / maxM4) * 0.50;
}

// Scratch raw 0.05s beat: (1.300s loop)
const scratchRaw = renderMelodyLayer(pianoSamples, 0.05, 0.88, sampleRate);
for (let j = 0; j < 64; j++) {
    scratchRaw[j] *= (j / 64);
    scratchRaw[scratchRaw.length - 1 - j] *= (j / 64);
}
let maxSR = 0;
for (let i = 0; i < scratchRaw.length; i++) {
    const a = Math.abs(scratchRaw[i]);
    if (a > maxSR) maxSR = a;
}
if (maxSR > 0) {
    for (let i = 0; i < scratchRaw.length; i++) scratchRaw[i] = (scratchRaw[i] / maxSR) * 0.50;
}

// Write active game sfx files
fs.writeFileSync(path.join(outDir, 'sfx_mach1.wav'), createWavBuffer(mach1, sampleRate));
fs.writeFileSync(path.join(outDir, 'sfx_mach2.wav'), createWavBuffer(mach2, sampleRate));
fs.writeFileSync(path.join(outDir, 'sfx_mach3.wav'), createWavBuffer(mach3, sampleRate));
fs.writeFileSync(path.join(outDir, 'sfx_mach4.wav'), createWavBuffer(mach4, sampleRate));

// Write dedicated named copies
fs.writeFileSync(path.join(outDir, 'smb3_mach1.wav'), createWavBuffer(mach1, sampleRate));
fs.writeFileSync(path.join(outDir, 'smb3_mach2.wav'), createWavBuffer(mach2, sampleRate));
fs.writeFileSync(path.join(outDir, 'smb3_mach2_007.wav'), createWavBuffer(mach2_007, sampleRate));
fs.writeFileSync(path.join(outDir, 'smb3_mach2_fast.wav'), createWavBuffer(mach2_fast, sampleRate));
fs.writeFileSync(path.join(outDir, 'smb3_mach3.wav'), createWavBuffer(mach3, sampleRate));
fs.writeFileSync(path.join(outDir, 'smb3_mach3_piano_solo.wav'), createWavBuffer(mach3_piano, sampleRate));
fs.writeFileSync(path.join(outDir, 'smb3_mach4.wav'), createWavBuffer(mach4, sampleRate));
fs.writeFileSync(path.join(outDir, 'smb3_scratch_loop.wav'), createWavBuffer(scratchRaw, sampleRate));

console.log('Successfully generated audio from The_NES_Super_Mario_Ultimate_Soundfont.sf2:');
console.log('  Mach 1 (Drums SMB3):', (mach1.length / sampleRate).toFixed(3) + 's');
console.log('  Mach 2 (Drums SMB3 0.04 rest):', (mach2.length / sampleRate).toFixed(3) + 's');
console.log('  Mach 3 (Piano + Guitar + Bells):', (mach3.length / sampleRate).toFixed(3) + 's');
console.log('  Mach 4 (Piano Turbo):', (mach4.length / sampleRate).toFixed(3) + 's');
console.log('  Scratch 0.05s Raw:', (scratchRaw.length / sampleRate).toFixed(3) + 's');
