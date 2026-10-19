import math
import struct
import wave
import random

SAMPLE_RATE = 44100
NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
FLAT_MAP = {'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#'}

def note_to_freq(note_str):
    if not note_str or note_str == '-': return 0.0
    name = note_str[:-1]
    octave = int(note_str[-1])
    if name in FLAT_MAP: name = FLAT_MAP[name]
    semitone = NOTE_NAMES.index(name)
    midi = (octave + 1) * 12 + semitone
    return 440.0 * (2.0 ** ((midi - 69) / 12.0))

def osc_saw(phase):
    p = (phase / (2.0 * math.pi)) % 1.0
    return 2.0 * p - 1.0

def osc_square(phase, duty=0.5):
    p = phase % (2.0 * math.pi)
    return 1.0 if p < (2.0 * math.pi * duty) else -1.0

def osc_sine(phase):
    return math.sin(phase)

def osc_tri(phase):
    p = (phase / (2.0 * math.pi)) % 1.0
    return 2.0 * abs(2.0 * p - 1.0) - 1.0

# ==============================================================================
# TRACK 1: FAST FRANTIC PIZZA TOWER "SMACKDOWN" STYLE (mu_tutorial_fast.wav)
# ==============================================================================
print("Generating mu_tutorial_fast.wav (132 BPM, High-Energy Frantic Pizza Tower Funk)...")
BPM_FAST = 132
TOTAL_BARS = 16
TOTAL_STEPS = TOTAL_BARS * 16
SEC_PER_STEP_FAST = (60.0 / BPM_FAST) / 4.0
TOTAL_SAMPLES_FAST = int(TOTAL_STEPS * SEC_PER_STEP_FAST * SAMPLE_RATE)

buf_l_fast = [0.0] * TOTAL_SAMPLES_FAST
buf_r_fast = [0.0] * TOTAL_SAMPLES_FAST

# Drums helper
def add_fast_drum(step, drum_type, vol=1.0):
    start = int(step * SEC_PER_STEP_FAST * SAMPLE_RATE)
    if drum_type == 'kick':
        dur = int(0.22 * SAMPLE_RATE)
        for i in range(dur):
            idx = start + i
            if idx >= TOTAL_SAMPLES_FAST: break
            t = i / SAMPLE_RATE
            p = 50.0 + 130.0 * math.exp(-35.0 * t)
            sample = (math.sin(2.0 * math.pi * p * t) + math.exp(-100.0 * t) * (random.random() * 2 - 1) * 0.4) * math.exp(-14.0 * t) * vol * 0.85
            buf_l_fast[idx] += sample
            buf_r_fast[idx] += sample
    elif drum_type == 'snare':
        dur = int(0.22 * SAMPLE_RATE)
        for i in range(dur):
            idx = start + i
            if idx >= TOTAL_SAMPLES_FAST: break
            t = i / SAMPLE_RATE
            body = math.sin(2.0 * math.pi * 230.0 * math.exp(-25.0 * t) * t) * math.exp(-18.0 * t) * 0.5
            noise = (random.random() * 2 - 1) * math.exp(-16.0 * t) * 0.7
            sample = (body + noise) * vol * 0.65
            buf_l_fast[idx] += sample
            buf_r_fast[idx] += sample
    elif drum_type == 'hat':
        dur = int(0.05 * SAMPLE_RATE)
        for i in range(dur):
            idx = start + i
            if idx >= TOTAL_SAMPLES_FAST: break
            t = i / SAMPLE_RATE
            noise = (random.random() * 2 - 1) * math.exp(-70.0 * t) * 0.22 * vol
            buf_l_fast[idx] += noise * 0.9
            buf_r_fast[idx] += noise * 1.1
    elif drum_type == 'crash':
        dur = int(1.2 * SAMPLE_RATE)
        for i in range(dur):
            idx = start + i
            if idx >= TOTAL_SAMPLES_FAST: break
            t = i / SAMPLE_RATE
            noise = (random.random() * 2 - 1) * math.exp(-3.5 * t) * 0.4 * vol
            buf_l_fast[idx] += noise
            buf_r_fast[idx] += noise

# Fast frantic drum beat
for bar in range(TOTAL_BARS):
    base = bar * 16
    if bar == 0 or bar == 8:
        add_fast_drum(base, 'crash')
    for s in range(16):
        # High-energy driving breakbeat
        if s in [0, 6, 8, 11]:
            add_fast_drum(base + s, 'kick')
        if s in [4, 12]:
            add_fast_drum(base + s, 'snare', 1.0)
        elif s in [14, 15] and bar in [3, 7, 11, 15]:
            add_fast_drum(base + s, 'snare', 0.8) # drum roll
        add_fast_drum(base + s, 'hat', 1.0 if s % 2 == 0 else 0.6)

# Fast slap bass (driving, punchy 16ths in F Minor / Ab Major funk)
FAST_BASS_NOTES = [
    # 0..3: Fm, Db, Eb, C7
    ['F1', 'F2', 'F1', 'Ab1', 'F1', 'F2', 'Bb1', 'C2', 'Db2', 'Db3', 'Db2', 'F2', 'Eb2', 'Eb3', 'C2', 'E2'],
    ['F1', 'F2', 'F1', 'Ab1', 'F1', 'F2', 'Bb1', 'C2', 'Db2', 'Db3', 'C2', 'C3', 'Bb1', 'Bb2', 'Ab1', 'G1'],
    ['F1', 'F2', 'F1', 'Ab1', 'F1', 'F2', 'Bb1', 'C2', 'Db2', 'Db3', 'Db2', 'F2', 'Eb2', 'Eb3', 'C2', 'E2'],
    ['Db2', 'Db3', 'Eb2', 'Eb3', 'E2', 'E3', 'F2', 'F3', 'G2', 'G3', 'Ab2', 'Ab3', 'Bb2', 'C3', 'Db3', 'E3'],
]

for bar in range(TOTAL_BARS):
    pat = FAST_BASS_NOTES[bar % 4]
    for step in range(16):
        note = pat[step]
        freq = note_to_freq(note)
        start = int((bar * 16 + step) * SEC_PER_STEP_FAST * SAMPLE_RATE)
        dur = int(SEC_PER_STEP_FAST * 1.2 * SAMPLE_RATE)
        phase = 0.0
        filter_state = 0.0
        for i in range(dur):
            idx = start + i
            if idx >= TOTAL_SAMPLES_FAST: break
            t = i / SAMPLE_RATE
            env = math.exp(-16.0 * t)
            phase += 2.0 * math.pi * freq / SAMPLE_RATE
            raw = 0.7 * osc_saw(phase) + 0.4 * osc_square(phase, 0.4)
            # auto-wah bite
            fc = 0.12 + 0.45 * env
            filter_state += fc * (raw - filter_state)
            val = filter_state * env * 0.42
            buf_l_fast[idx] += val
            buf_r_fast[idx] += val

# Fast Brass Stabs & Horn Riffs
FAST_BRASS = [
    (0, 4, ['Ab4', 'C5', 'F5'], 2), (0, 7, ['Ab4', 'C5', 'F5'], 2), (0, 12, ['Bb4', 'Db5', 'G5'], 3),
    (1, 4, ['Ab4', 'C5', 'F5'], 2), (1, 8, ['C5', 'Eb5', 'Ab5'], 2), (1, 12, ['G4', 'Bb4', 'E5'], 3),
    (2, 4, ['Ab4', 'C5', 'F5'], 2), (2, 7, ['Ab4', 'C5', 'F5'], 2), (2, 12, ['Bb4', 'Db5', 'G5'], 3),
    (3, 2, ['Db5', 'F5', 'Ab5'], 2), (3, 6, ['Eb5', 'G5', 'Bb5'], 2), (3, 10, ['E5', 'G#5', 'B5'], 2), (3, 13, ['F5', 'A5', 'C6'], 3),
]

for bar in range(TOTAL_BARS):
    bar_pat = FAST_BRASS
    for b_bar, step, chord, dur_steps in bar_pat:
        if (bar % 4) == b_bar:
            start = int((bar * 16 + step) * SEC_PER_STEP_FAST * SAMPLE_RATE)
            dur = int(dur_steps * SEC_PER_STEP_FAST * SAMPLE_RATE) + int(0.06 * SAMPLE_RATE)
            for note in chord:
                freq = note_to_freq(note)
                p1, p2 = random.random(), random.random()
                for i in range(dur):
                    idx = start + i
                    if idx >= TOTAL_SAMPLES_FAST: break
                    t = i / SAMPLE_RATE
                    env = math.exp(-6.0 * t) if t > 0.015 else (t / 0.015)
                    p1 += 2.0 * math.pi * freq / SAMPLE_RATE
                    p2 += 2.0 * math.pi * (freq * 1.005) / SAMPLE_RATE
                    val = (osc_saw(p1) + osc_saw(p2)) * 0.5 * env * 0.14
                    buf_l_fast[idx] += val
                    buf_r_fast[idx] += val

# Crazy fast pizza tower lead melody
FAST_LEAD = [
    (0, 0, 'F5', 2), (0, 2, 'Ab5', 2), (0, 4, 'C6', 3), (0, 7, 'Bb5', 2), (0, 9, 'Ab5', 2), (0, 11, 'F5', 3), (0, 14, 'Eb5', 2),
    (1, 0, 'F5', 4), (1, 4, 'C6', 2), (1, 6, 'Eb6', 2), (1, 8, 'F6', 4), (1, 12, 'Eb6', 2), (1, 14, 'C6', 2),
    (2, 0, 'Db6', 3), (2, 3, 'C6', 2), (2, 5, 'Bb5', 3), (2, 8, 'Ab5', 2), (2, 10, 'F5', 4), (2, 14, 'Ab5', 2),
    (3, 0, 'Bb5', 4), (3, 4, 'C6', 4), (3, 8, 'Db6', 3), (3, 11, 'Eb6', 2), (3, 13, 'E6', 3)
]

for bar in range(TOTAL_BARS):
    for l_bar, step, note, dur_steps in FAST_LEAD:
        if (bar % 4) == l_bar:
            # Octave up on bars 8-15
            oct_shift = 1 if bar >= 8 else 0
            n_name = note[:-1]
            n_oct = str(int(note[-1]) + oct_shift)
            freq = note_to_freq(n_name + n_oct)
            start = int((bar * 16 + step) * SEC_PER_STEP_FAST * SAMPLE_RATE)
            dur = int(dur_steps * SEC_PER_STEP_FAST * SAMPLE_RATE)
            rel = int(0.06 * SAMPLE_RATE)
            p = 0.0
            for i in range(dur + rel):
                idx = start + i
                if idx >= TOTAL_SAMPLES_FAST: break
                t = i / SAMPLE_RATE
                env = (1.0 - 0.15 * (i / dur)) if i < dur else ((dur + rel - i) / rel * 0.85)
                # Vibrato
                vib = math.sin(2.0 * math.pi * 6.5 * t) * (freq * 0.015) if t > 0.06 else 0.0
                p += 2.0 * math.pi * (freq + vib) / SAMPLE_RATE
                val = (osc_square(p, 0.3) * 0.6 + osc_saw(p) * 0.4) * env * 0.20
                buf_l_fast[idx] += val
                buf_r_fast[idx] += val

# Crossfade fast
for i in range(1024):
    f = i / 1024
    end_i = TOTAL_SAMPLES_FAST - 1024 + i
    buf_l_fast[i] = buf_l_fast[i] * f + buf_l_fast[end_i] * (1.0 - f)
    buf_r_fast[i] = buf_r_fast[i] * f + buf_r_fast[end_i] * (1.0 - f)

max_f = max(max(abs(x) for x in buf_l_fast), max(abs(x) for x in buf_r_fast), 0.001)
gain_f = 0.94 / max_f

with wave.open('music/mu_tutorial_fast.wav', 'wb') as wav:
    wav.setnchannels(2); wav.setsampwidth(2); wav.setframerate(SAMPLE_RATE)
    frames = bytearray()
    for i in range(TOTAL_SAMPLES_FAST):
        l = max(-0.98, min(0.98, math.tanh(buf_l_fast[i] * gain_f * 1.05)))
        r = max(-0.98, min(0.98, math.tanh(buf_r_fast[i] * gain_f * 1.05)))
        frames.extend(struct.pack('<hh', int(l * 32767.0), int(r * 32767.0)))
    wav.writeframes(frames)
print(f"Generated mu_tutorial_fast.wav: {len(frames)} bytes, {TOTAL_SAMPLES_FAST/SAMPLE_RATE:.2f}s")


# ==============================================================================
# TRACK 2: CHILL / JAZZY LO-FI LOUNGE STYLE (mu_tutorial_chill.wav)
# ==============================================================================
print("\nGenerating mu_tutorial_chill.wav (104 BPM, Smooth Jazzy Rhodes Lounge)...")
BPM_CHILL = 104
TOTAL_BARS = 16
TOTAL_STEPS = TOTAL_BARS * 16
SEC_PER_STEP_CHILL = (60.0 / BPM_CHILL) / 4.0
TOTAL_SAMPLES_CHILL = int(TOTAL_STEPS * SEC_PER_STEP_CHILL * SAMPLE_RATE)

buf_l_chill = [0.0] * TOTAL_SAMPLES_CHILL
buf_r_chill = [0.0] * TOTAL_SAMPLES_CHILL

# Vinyl dust
random.seed(99)
for i in range(TOTAL_SAMPLES_CHILL):
    if random.random() < 0.0012:
        pop = (random.random() * 2 - 1) * 0.06
        for j in range(8):
            if i + j < TOTAL_SAMPLES_CHILL:
                buf_l_chill[i + j] += pop * math.exp(-0.9 * j)
                buf_r_chill[i + j] += pop * math.exp(-0.9 * j) * 0.8

# Laid-back swing drums
SWING_C = 0.58
def get_chill_step_sample(step):
    beat = step // 4
    sub = step % 4
    t = beat * (60.0 / BPM_CHILL)
    sub_durs = [0.25 * SWING_C * 2, 0.25 * (1 - SWING_C) * 2, 0.25 * SWING_C * 2, 0.25 * (1 - SWING_C) * 2]
    for s in range(sub):
        t += sub_durs[s] * (60.0 / BPM_CHILL)
    return int(t * SAMPLE_RATE)

for bar in range(TOTAL_BARS):
    base = bar * 16
    for s in range(16):
        start = get_chill_step_sample(base + s)
        # Deep warm round kick on 0, 7, 10
        if s in [0, 7, 10]:
            dur = int(0.28 * SAMPLE_RATE)
            for i in range(dur):
                idx = start + i
                if idx >= TOTAL_SAMPLES_CHILL: break
                t = i / SAMPLE_RATE
                sample = math.sin(2.0 * math.pi * (52.0 * math.exp(-18.0 * t)) * t) * math.exp(-9.0 * t) * 0.75
                buf_l_chill[idx] += sample; buf_r_chill[idx] += sample
        # Soft rimshot / snare on 4 and 12
        if s in [4, 12]:
            dur = int(0.18 * SAMPLE_RATE)
            for i in range(dur):
                idx = start + i
                if idx >= TOTAL_SAMPLES_CHILL: break
                t = i / SAMPLE_RATE
                noise = (random.random() * 2 - 1) * math.exp(-22.0 * t) * 0.45
                snap = math.sin(2.0 * math.pi * 380.0 * t) * math.exp(-35.0 * t) * 0.3
                buf_l_chill[idx] += noise + snap; buf_r_chill[idx] += noise + snap
        # Soft brushed hi-hats
        dur = int(0.08 * SAMPLE_RATE)
        for i in range(dur):
            idx = start + i
            if idx >= TOTAL_SAMPLES_CHILL: break
            t = i / SAMPLE_RATE
            noise = (random.random() * 2 - 1) * math.exp(-45.0 * t) * 0.16
            buf_l_chill[idx] += noise * 0.8; buf_r_chill[idx] += noise * 1.2

# Warm Jazzy Rhodes Chords (Cmaj9, Am9, Dm9, G13)
JAZZ_CHORDS = [
    # Cmaj9
    ['C4', 'E4', 'G4', 'B4', 'D5'],
    # Am9
    ['A3', 'C4', 'E4', 'G4', 'B4'],
    # Dm9
    ['D4', 'F4', 'A4', 'C5', 'E5'],
    # G13 (G, B, F, A, E)
    ['G3', 'B3', 'F4', 'A4', 'E5']
]

for bar in range(TOTAL_BARS):
    chord = JAZZ_CHORDS[bar % 4]
    # Play chord on beat 1 and syncopated beat 3-and (step 0 and 10)
    for step in [0, 10]:
        start = get_chill_step_sample(bar * 16 + step)
        dur = int(1.2 * SAMPLE_RATE)
        for note in chord:
            freq = note_to_freq(note)
            phase = random.random() * 2 * math.pi
            for i in range(dur):
                idx = start + i
                if idx >= TOTAL_SAMPLES_CHILL: break
                t = i / SAMPLE_RATE
                # Tremolo effect
                trem = 1.0 + 0.25 * math.sin(2.0 * math.pi * 4.2 * t)
                env = math.exp(-3.2 * t) * trem
                phase += 2.0 * math.pi * freq / SAMPLE_RATE
                # Bell-like Rhodes tone: sine + soft 2nd harmonic
                tone = (math.sin(phase) + 0.3 * math.sin(phase * 2.0) * math.exp(-8.0 * t)) * env * 0.08
                buf_l_chill[idx] += tone * 0.9
                buf_r_chill[idx] += tone * 1.1

# Warm walking jazz bass
CHILL_BASS = [
    # Bar 0 (Cmaj9)
    ['C2', 'E2', 'G2', 'B2', 'C3', 'G2', 'E2', 'D2'],
    # Bar 1 (Am9)
    ['A1', 'C2', 'E2', 'G2', 'A2', 'E2', 'C2', 'B1'],
    # Bar 2 (Dm9)
    ['D2', 'F2', 'A2', 'C3', 'D3', 'A2', 'F2', 'Eb2'],
    # Bar 3 (G13)
    ['G1', 'B1', 'D2', 'F2', 'G2', 'F2', 'D2', 'Db2'],
]

for bar in range(TOTAL_BARS):
    pat = CHILL_BASS[bar % 4]
    for step_idx, note in enumerate(pat):
        step = step_idx * 2 # 8th notes
        start = get_chill_step_sample(bar * 16 + step)
        dur = int(0.55 * SAMPLE_RATE)
        freq = note_to_freq(note)
        p = 0.0
        for i in range(dur):
            idx = start + i
            if idx >= TOTAL_SAMPLES_CHILL: break
            t = i / SAMPLE_RATE
            env = math.exp(-5.5 * t)
            p += 2.0 * math.pi * freq / SAMPLE_RATE
            val = (math.sin(p) * 0.8 + osc_tri(p) * 0.3) * env * 0.40
            buf_l_chill[idx] += val
            buf_r_chill[idx] += val

# Mellow Vibraphone Lead
VIBE_MELODY = [
    (0, 4, 'E5', 4), (0, 8, 'G5', 4), (0, 12, 'B5', 3),
    (1, 0, 'D6', 4), (1, 6, 'C6', 3), (1, 10, 'B5', 3), (1, 14, 'A5', 2),
    (2, 0, 'F5', 4), (2, 6, 'A5', 4), (2, 12, 'C6', 3),
    (3, 0, 'E6', 4), (3, 6, 'D6', 4), (3, 12, 'G5', 4)
]

for bar in range(TOTAL_BARS):
    for l_bar, step, note, dur_steps in VIBE_MELODY:
        if (bar % 4) == l_bar:
            start = get_chill_step_sample(bar * 16 + step)
            dur = int(dur_steps * 0.35 * SAMPLE_RATE)
            freq = note_to_freq(note)
            p = 0.0
            for i in range(dur):
                idx = start + i
                if idx >= TOTAL_SAMPLES_CHILL: break
                t = i / SAMPLE_RATE
                trem = 1.0 + 0.3 * math.sin(2.0 * math.pi * 5.0 * t)
                env = math.exp(-3.5 * t) * trem
                p += 2.0 * math.pi * freq / SAMPLE_RATE
                val = math.sin(p) * env * 0.22
                buf_l_chill[idx] += val * 0.8
                buf_r_chill[idx] += val * 0.8
                # Delay
                d_idx = idx + int(0.28 * SAMPLE_RATE)
                if d_idx < TOTAL_SAMPLES_CHILL:
                    buf_l_chill[d_idx] += val * 0.25
                    buf_r_chill[d_idx] += val * 0.15

# Crossfade chill
for i in range(1200):
    f = i / 1200
    end_i = TOTAL_SAMPLES_CHILL - 1200 + i
    buf_l_chill[i] = buf_l_chill[i] * f + buf_l_chill[end_i] * (1.0 - f)
    buf_r_chill[i] = buf_r_chill[i] * f + buf_r_chill[end_i] * (1.0 - f)

max_c = max(max(abs(x) for x in buf_l_chill), max(abs(x) for x in buf_r_chill), 0.001)
gain_c = 0.94 / max_c

with wave.open('music/mu_tutorial_chill.wav', 'wb') as wav:
    wav.setnchannels(2); wav.setsampwidth(2); wav.setframerate(SAMPLE_RATE)
    frames = bytearray()
    for i in range(TOTAL_SAMPLES_CHILL):
        l = max(-0.98, min(0.98, math.tanh(buf_l_chill[i] * gain_c * 1.05)))
        r = max(-0.98, min(0.98, math.tanh(buf_r_chill[i] * gain_c * 1.05)))
        frames.extend(struct.pack('<hh', int(l * 32767.0), int(r * 32767.0)))
    wav.writeframes(frames)
print(f"Generated mu_tutorial_chill.wav: {len(frames)} bytes, {TOTAL_SAMPLES_CHILL/SAMPLE_RATE:.2f}s")
