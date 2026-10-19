import math
import struct
import wave
import random

SAMPLE_RATE = 44100
BPM = 160
BEATS_PER_BAR = 4
STEPS_PER_BEAT = 4  # 16th notes
TOTAL_BARS = 16

TOTAL_STEPS = TOTAL_BARS * BEATS_PER_BAR * STEPS_PER_BEAT  # 256 steps
SECONDS_PER_BEAT = 60.0 / BPM
SECONDS_PER_STEP = SECONDS_PER_BEAT / STEPS_PER_BEAT
TOTAL_SECONDS = TOTAL_STEPS * SECONDS_PER_STEP
TOTAL_SAMPLES = int(TOTAL_SECONDS * SAMPLE_RATE)

print(f"Composing Original Bacontu-Style Tutorial Track: {TOTAL_BARS} bars at {BPM} BPM ({TOTAL_SECONDS:.2f}s, {TOTAL_SAMPLES} samples)")

# ------------------------------------------------------------------------------
# 1. EXTRACT REAL SAMPLED DRUMS FROM THE SOURCE MATERIAL
# ------------------------------------------------------------------------------
print("Extracting real studio drum samples from mu_id_please.mp3...")
# Read audio from mu_id_please.mp3 / mu_tutorial.wav
with wave.open('music/mu_tutorial.wav', 'rb') as w:
    src_sr = w.getframerate()
    src_frames = w.readframes(src_sr * 10)
    src_samples = struct.unpack('<' + 'h' * (len(src_frames) // 2), src_frames)
    src_left = [src_samples[i*2] / 32768.0 for i in range(len(src_samples) // 2)]
    src_right = [src_samples[i*2+1] / 32768.0 for i in range(len(src_samples) // 2)]

def extract_sample(start_sec, dur_sec, fade_out=0.03):
    start_idx = int(start_sec * src_sr)
    dur_idx = int(dur_sec * src_sr)
    sample_l = []
    sample_r = []
    fade_len = int(fade_out * src_sr)
    for i in range(dur_idx):
        idx = start_idx + i
        if idx >= len(src_left): break
        env = 1.0
        if i >= dur_idx - fade_len:
            env = (dur_idx - i) / fade_len
        sample_l.append(src_left[idx] * env)
        sample_r.append(src_right[idx] * env)
    return sample_l, sample_r

# Clean punchy kick at 2.305s
kick_l, kick_r = extract_sample(2.305, 0.28, fade_out=0.05)
# Clean snappy snare at 2.665s
snare_l, snare_r = extract_sample(2.665, 0.26, fade_out=0.06)
# Ghost snare at 2.85s
ghost_l, ghost_r = extract_sample(2.850, 0.14, fade_out=0.04)

print(f"Extracted Kick ({len(kick_l)} samples), Snare ({len(snare_l)} samples)")

# ------------------------------------------------------------------------------
# 2. AUDIO BUFFERS & MUSICAL HELPERS
# ------------------------------------------------------------------------------
left_buffer = [0.0] * TOTAL_SAMPLES
right_buffer = [0.0] * TOTAL_SAMPLES

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

# ------------------------------------------------------------------------------
# 3. DRUM ARRANGEMENT (Real Sampled Breakbeat)
# ------------------------------------------------------------------------------
print("Arranging authentic sampled breakbeat groove...")
def trigger_drum(start_samp, smp_l, smp_r, vol=1.0):
    for i in range(len(smp_l)):
        idx = start_samp + i
        if idx >= TOTAL_SAMPLES: break
        left_buffer[idx] += smp_l[i] * vol
        right_buffer[idx] += smp_r[i] * vol

def trigger_hat(start_samp, is_open=False, vol=0.25):
    dur = int((0.18 if is_open else 0.05) * SAMPLE_RATE)
    for i in range(dur):
        idx = start_samp + i
        if idx >= TOTAL_SAMPLES: break
        t = i / SAMPLE_RATE
        decay = 18.0 if is_open else 65.0
        n = (random.random() * 2 - 1) * math.exp(-decay * t) * vol
        left_buffer[idx] += n * 0.85
        right_buffer[idx] += n * 1.15

def trigger_crash(start_samp, vol=0.45):
    dur = int(1.5 * SAMPLE_RATE)
    for i in range(dur):
        idx = start_samp + i
        if idx >= TOTAL_SAMPLES: break
        t = i / SAMPLE_RATE
        # Metallic overtone sines + noise
        m = (math.sin(2*math.pi*430*t) + math.sin(2*math.pi*670*t) + math.sin(2*math.pi*910*t)) * 0.2
        n = (random.random() * 2 - 1) * 0.8
        sample = (m + n) * math.exp(-2.8 * t) * vol
        left_buffer[idx] += sample
        right_buffer[idx] += sample

for bar in range(TOTAL_BARS):
    base_step = bar * 16
    for step in range(16):
        cur_step = base_step + step
        start_samp = int(cur_step * SECONDS_PER_STEP * SAMPLE_RATE)
        
        # Crash on bar 0 and bar 8
        if step == 0 and (bar == 0 or bar == 8):
            trigger_crash(start_samp, 0.45)
            
        # Kick on 0, 6 (syncopation), 10
        if step in [0, 6, 10]:
            trigger_drum(start_samp, kick_l, kick_r, 1.0)
        elif step == 14 and bar in [3, 7, 11, 15]:
            trigger_drum(start_samp, kick_l, kick_r, 0.9)
            
        # Snare on 4, 12 (beats 2 and 4)
        if step in [4, 12]:
            trigger_drum(start_samp, snare_l, snare_r, 1.05)
        elif step in [7, 15]:
            # Funky ghost note snare!
            trigger_drum(start_samp, ghost_l, ghost_r, 0.65)
            
        # Hi-hats every 16th note with open hats on the offbeat
        if step in [2, 6, 10, 14]:
            trigger_hat(start_samp, is_open=True, vol=0.22)
        else:
            acc = 0.24 if step % 4 == 0 else 0.16
            trigger_hat(start_samp, is_open=False, vol=acc)

# ------------------------------------------------------------------------------
# 4. ORGANIC ELECTRIC BASS (Harmonic Physical String Model)
# ------------------------------------------------------------------------------
print("Synthesizing organic slap/finger bass...")
# G# Minor / B Major Funk Progression (16 bars)
# 0..3: G#m7, Emaj7, Bmaj7, F#7
# 4..7: G#m7, Emaj7, C#m7, D#7
# 8..11: Emaj7, F#7, G#m7, Bmaj7 (Heroic sprint)
# 12..15: C#m7, Emaj7, D#7, D#7alt (Turnaround)
BASS_LINES = [
    # Bar 0: G#m7
    [('G#1', 2), ('-', 1), ('G#2', 2), ('-', 1), ('G#1', 2), ('-', 1), ('F#2', 1), ('G2', 1), ('G#2', 2), ('D#2', 2), ('F#2', 1)],
    # Bar 1: Emaj7
    [('E1', 2), ('-', 1), ('E2', 2), ('-', 1), ('E1', 2), ('-', 1), ('D#2', 1), ('E2', 1), ('G#2', 2), ('B2', 2), ('E2', 1)],
    # Bar 2: Bmaj7
    [('B1', 2), ('-', 1), ('B2', 2), ('-', 1), ('B1', 2), ('-', 1), ('A#2', 1), ('B2', 1), ('D#2', 2), ('F#2', 2), ('B1', 1)],
    # Bar 3: F#7
    [('F#1', 2), ('-', 1), ('F#2', 2), ('-', 1), ('F#1', 2), ('-', 1), ('E2', 2), ('F#2', 2), ('-', 1), ('C#2', 2), ('E1', 1)],

    # Bar 4: G#m7
    [('G#1', 2), ('-', 1), ('G#2', 2), ('-', 1), ('G#1', 2), ('-', 1), ('F#2', 1), ('G2', 1), ('G#2', 2), ('D#2', 2), ('F#2', 1)],
    # Bar 5: Emaj7
    [('E1', 2), ('-', 1), ('E2', 2), ('-', 1), ('E1', 2), ('-', 1), ('D#2', 1), ('E2', 1), ('G#2', 2), ('B2', 2), ('E2', 1)],
    # Bar 6: C#m7
    [('C#2', 2), ('-', 1), ('C#3', 2), ('-', 1), ('C#2', 2), ('-', 1), ('B2', 2), ('C#3', 2), ('-', 1), ('G#2', 2), ('B1', 1)],
    # Bar 7: D#7
    [('D#2', 2), ('-', 1), ('D#3', 2), ('-', 1), ('D#2', 2), ('-', 1), ('C#3', 2), ('D#3', 2), ('-', 1), ('A#2', 2), ('C#2', 1)],

    # Bar 8: Emaj7
    [('E1', 2), ('-', 1), ('E2', 2), ('-', 1), ('E1', 2), ('-', 1), ('D#2', 1), ('E2', 1), ('G#2', 2), ('B2', 2), ('E2', 1)],
    # Bar 9: F#7
    [('F#1', 2), ('-', 1), ('F#2', 2), ('-', 1), ('F#1', 2), ('-', 1), ('E2', 2), ('F#2', 2), ('-', 1), ('C#2', 2), ('E1', 1)],
    # Bar 10: G#m7
    [('G#1', 2), ('-', 1), ('G#2', 2), ('-', 1), ('G#1', 2), ('-', 1), ('F#2', 1), ('G2', 1), ('G#2', 2), ('D#2', 2), ('F#2', 1)],
    # Bar 11: Bmaj7
    [('B1', 2), ('-', 1), ('B2', 2), ('-', 1), ('B1', 2), ('-', 1), ('A#2', 1), ('B2', 1), ('D#2', 2), ('F#2', 2), ('B1', 1)],

    # Bar 12: C#m7
    [('C#2', 2), ('-', 1), ('C#3', 2), ('-', 1), ('C#2', 2), ('-', 1), ('B2', 2), ('C#3', 2), ('-', 1), ('G#2', 2), ('B1', 1)],
    # Bar 13: Emaj7
    [('E1', 2), ('-', 1), ('E2', 2), ('-', 1), ('E1', 2), ('-', 1), ('D#2', 1), ('E2', 1), ('G#2', 2), ('B2', 2), ('E2', 1)],
    # Bar 14: D#7
    [('D#2', 2), ('-', 1), ('D#3', 2), ('-', 1), ('D#2', 2), ('-', 1), ('C#3', 2), ('D#3', 2), ('-', 1), ('A#2', 2), ('C#2', 1)],
    # Bar 15: D#7alt chromatic walking bass back to G#1
    [('D#2', 2), ('E2', 1), ('F2', 1), ('F#2', 2), ('G2', 2), ('A2', 2), ('A#2', 2), ('C3', 2), ('D3', 2)]
]

for bar in range(TOTAL_BARS):
    pattern = BASS_LINES[bar]
    step_offset = 0
    for note, dur_steps in pattern:
        if note != '-':
            f0 = note_to_freq(note)
            cur_step = bar * 16 + step_offset
            start_samp = int(cur_step * SECONDS_PER_STEP * SAMPLE_RATE)
            dur_samp = int(dur_steps * SECONDS_PER_STEP * SAMPLE_RATE) + int(0.04 * SAMPLE_RATE)
            
            # String harmonics with physical damping
            for i in range(dur_samp):
                idx = start_samp + i
                if idx >= TOTAL_SAMPLES: break
                t = i / SAMPLE_RATE
                
                # Multi-harmonic pluck
                h1 = math.sin(2 * math.pi * f0 * t) * math.exp(-7.0 * t)
                h2 = math.sin(2 * math.pi * 2 * f0 * t) * 0.65 * math.exp(-11.0 * t)
                h3 = math.sin(2 * math.pi * 3 * f0 * t) * 0.40 * math.exp(-16.0 * t)
                h4 = math.sin(2 * math.pi * 4 * f0 * t) * 0.22 * math.exp(-22.0 * t)
                h5 = math.sin(2 * math.pi * 5 * f0 * t) * 0.12 * math.exp(-28.0 * t)
                
                # Finger pluck attack transient
                click = math.exp(-90.0 * t) * math.sin(2 * math.pi * 750 * t) * 0.35
                
                sample = (h1 + h2 + h3 + h4 + h5 + click) * 0.38
                left_buffer[idx] += sample
                right_buffer[idx] += sample
                
        step_offset += dur_steps

# ------------------------------------------------------------------------------
# 5. WARM RHODES / ELECTRIC PIANO CHORDS
# ------------------------------------------------------------------------------
print("Synthesizing warm Rhodes jazz chords...")
CHORD_PROGRESSIONS = [
    # G#m7 (G#3, B3, D#4, F#4)
    ['G#3', 'B3', 'D#4', 'F#4'],
    # Emaj7 (E3, G#3, B3, D#4)
    ['E3', 'G#3', 'B3', 'D#4'],
    # Bmaj7 (B3, D#4, F#4, A#4)
    ['B3', 'D#4', 'F#4', 'A#4'],
    # F#7 (F#3, A#3, C#4, E4)
    ['F#3', 'A#3', 'C#4', 'E4'],

    # G#m7
    ['G#3', 'B3', 'D#4', 'F#4'],
    # Emaj7
    ['E3', 'G#3', 'B3', 'D#4'],
    # C#m7 (C#3, E3, G#3, B3)
    ['C#3', 'E3', 'G#3', 'B3'],
    # D#7 (D#3, G3, A#3, C#4)
    ['D#3', 'G3', 'A#3', 'C#4'],

    # Emaj7
    ['E3', 'G#3', 'B3', 'D#4'],
    # F#7
    ['F#3', 'A#3', 'C#4', 'E4'],
    # G#m7
    ['G#3', 'B3', 'D#4', 'F#4'],
    # Bmaj7
    ['B3', 'D#4', 'F#4', 'A#4'],

    # C#m7
    ['C#3', 'E3', 'G#3', 'B3'],
    # Emaj7
    ['E3', 'G#3', 'B3', 'D#4'],
    # D#7
    ['D#3', 'G3', 'A#3', 'C#4'],
    # D#7alt (D#3, G3, C#4, F#4)
    ['D#3', 'G3', 'C#4', 'F#4']
]

# Rhythmic stabs on beats 2 and 4 and upbeat 16ths
RHODES_HITS = [4, 7, 12, 14]

for bar in range(TOTAL_BARS):
    chord = CHORD_PROGRESSIONS[bar]
    for step in RHODES_HITS:
        start_samp = int((bar * 16 + step) * SECONDS_PER_STEP * SAMPLE_RATE)
        dur = int(0.65 * SAMPLE_RATE)
        for note in chord:
            freq = note_to_freq(note)
            phase = random.random() * 2 * math.pi
            for i in range(dur):
                idx = start_samp + i
                if idx >= TOTAL_SAMPLES: break
                t = i / SAMPLE_RATE
                # Tremolo + bell decay
                trem = 1.0 + 0.22 * math.sin(2 * math.pi * 4.8 * t)
                env = math.exp(-4.2 * t) * trem
                phase += 2.0 * math.pi * freq / SAMPLE_RATE
                
                # Tine tone bar synthesis (bell overtone at 3.98x)
                bell = math.sin(phase * 3.98) * 0.3 * math.exp(-18.0 * t)
                tone = (math.sin(phase) + 0.35 * math.sin(phase * 2.0) + bell) * env * 0.05
                
                left_buffer[idx] += tone * 0.85
                right_buffer[idx] += tone * 1.15

# ------------------------------------------------------------------------------
# 6. BIG BAND CARTOON BRASS STABS ("ID, Please!" Style)
# ------------------------------------------------------------------------------
print("Synthesizing cartoon big-band brass section stabs...")
BRASS_HITS = [
    # Bar 0 (Punch on 4 and 10)
    (0, 4, ['G#4', 'B4', 'D#5', 'G#5'], 2, False),
    (0, 10, ['B4', 'D#5', 'F#5', 'B5'], 3, True),
    # Bar 1
    (1, 4, ['E4', 'G#4', 'B4', 'E5'], 2, False),
    (1, 10, ['G#4', 'B4', 'D#5', 'G#5'], 3, True),
    # Bar 2
    (2, 4, ['B4', 'D#5', 'F#5', 'B5'], 2, False),
    (2, 10, ['F#4', 'A#4', 'C#5', 'F#5'], 3, True),
    # Bar 3 (Turnaround punch)
    (3, 4, ['G3', 'C#4', 'D#4', 'G4'], 2, False),
    (3, 8, ['A#3', 'D#4', 'G4', 'A#4'], 2, False),
    (3, 12, ['C#4', 'G4', 'A#4', 'C#5'], 3, True),

    # Bar 4
    (4, 4, ['G#4', 'B4', 'D#5', 'G#5'], 2, False),
    (4, 10, ['B4', 'D#5', 'F#5', 'B5'], 3, True),
    # Bar 5
    (5, 4, ['E4', 'G#4', 'B4', 'E5'], 2, False),
    (5, 10, ['G#4', 'B4', 'E5', 'G#5'], 3, True),
    # Bar 6
    (6, 4, ['E4', 'G#4', 'C#5', 'E5'], 2, False),
    (6, 10, ['G#4', 'C#5', 'E5', 'G#5'], 3, True),
    # Bar 7 (Rising horns)
    (7, 4, ['G4', 'A#4', 'C#5', 'D#5'], 2, False),
    (7, 8, ['A#4', 'C#5', 'D#5', 'G5'], 2, False),
    (7, 12, ['C#5', 'D#5', 'G5', 'A#5'], 3, True),

    # Bar 8-11 (Heroic sprint horns)
    (8, 4, ['G#4', 'B4', 'E5', 'G#5'], 2, False),
    (8, 10, ['A#4', 'C#5', 'F#5', 'A#5'], 3, True),
    (9, 4, ['A#4', 'C#5', 'F#5', 'A#5'], 2, False),
    (9, 10, ['B4', 'D#5', 'G#5', 'B5'], 3, True),
    (10, 4, ['B4', 'D#5', 'G#5', 'B5'], 2, False),
    (10, 10, ['D#5', 'F#5', 'B5', 'D#6'], 3, True),
    (11, 4, ['D#5', 'F#5', 'B5', 'D#6'], 2, False),
    (11, 10, ['F#5', 'A#5', 'C#6', 'F#6'], 3, True),

    # Bar 12-15 (Climax crescendo)
    (12, 4, ['E4', 'G#4', 'C#5', 'E5'], 2, False),
    (12, 10, ['G#4', 'B4', 'E5', 'G#5'], 2, False),
    (13, 4, ['G#4', 'B4', 'E5', 'G#5'], 2, False),
    (13, 10, ['A#4', 'C#5', 'F#5', 'A#5'], 2, False),
    (14, 4, ['A#4', 'C#5', 'F#5', 'A#5'], 2, False),
    (14, 10, ['C#5', 'D#5', 'G5', 'A#5'], 3, True),
    # Bar 15 big cartoon build
    (15, 0, ['G4', 'C#5', 'D#5', 'G5'], 2, False),
    (15, 4, ['A#4', 'D#5', 'G5', 'A#5'], 2, False),
    (15, 8, ['C#5', 'G5', 'A#5', 'C#6'], 3, False),
    (15, 12, ['D#5', 'A#5', 'C#6', 'D#6'], 4, True)
]

for bar, step, chord, dur_steps, is_fall in BRASS_HITS:
    start_samp = int((bar * 16 + step) * SECONDS_PER_STEP * SAMPLE_RATE)
    dur_samp = int(dur_steps * SECONDS_PER_STEP * SAMPLE_RATE) + int(0.08 * SAMPLE_RATE)
    
    for note in chord:
        base_f = note_to_freq(note)
        p1 = random.random() * 2 * math.pi
        p2 = random.random() * 2 * math.pi
        
        for i in range(dur_samp):
            idx = start_samp + i
            if idx >= TOTAL_SAMPLES: break
            t = i / SAMPLE_RATE
            
            # Swell attack and punchy brass decay
            if t < 0.018:
                env = (t / 0.018)
            else:
                env = math.exp(-5.2 * (t - 0.018))
                
            cur_f = base_f
            if is_fall and t > 0.09:
                cur_f *= math.exp(-9.0 * (t - 0.09)) # cartoon fall!
                
            p1 += 2 * math.pi * cur_f / SAMPLE_RATE
            p2 += 2 * math.pi * (cur_f * 1.004) / SAMPLE_RATE
            
            # Saw + square brass tone
            b1 = (2.0 * ((p1 / (2*math.pi)) % 1.0) - 1.0)
            b2 = (2.0 * ((p2 / (2*math.pi)) % 1.0) - 1.0)
            sample = (b1 + b2) * 0.5 * env * 0.12
            
            left_buffer[idx] += sample * 0.95
            right_buffer[idx] += sample * 0.95

# ------------------------------------------------------------------------------
# 7. SWAGGERING CARTOON LEAD (Vibraphone & Tenor Sax Lead Line)
# ------------------------------------------------------------------------------
print("Synthesizing original swaggering Bacontu cartoon lead...")
# High-energy, playful, swaggering platformer melody
LEAD_LINE = [
    # Bar 0 (Catchy motif: G#5 -> B5 -> C#6 -> D#6)
    (0, 0, 'D#5', 2), (0, 2, 'F#5', 2), (0, 4, 'G#5', 3), (0, 7, 'B5', 2), (0, 9, 'C#6', 2), (0, 11, 'D#6', 3), (0, 14, 'C#6', 2),
    # Bar 1 (Playful fall and bounce)
    (1, 0, 'B5', 3), (1, 3, 'G#5', 2), (1, 5, 'F#5', 3), (1, 8, 'E5', 2), (1, 10, 'G#5', 6),
    # Bar 2
    (2, 0, 'F#5', 2), (2, 2, 'G#5', 2), (2, 4, 'B5', 3), (2, 7, 'C#6', 2), (2, 9, 'D#6', 2), (2, 11, 'F#6', 3), (2, 14, 'D#6', 2),
    # Bar 3 (Quirky cartoon horn turn)
    (3, 0, 'C#6', 3), (3, 3, 'A#5', 2), (3, 5, 'F#5', 3), (3, 8, 'G#5', 2), (3, 10, 'A#5', 6),

    # Bar 4 (Repeat motif with higher energetic variations)
    (4, 0, 'D#5', 2), (4, 2, 'F#5', 2), (4, 4, 'G#5', 3), (4, 7, 'B5', 2), (4, 9, 'C#6', 2), (4, 11, 'D#6', 3), (4, 14, 'C#6', 2),
    # Bar 5
    (5, 0, 'B5', 3), (5, 3, 'G#5', 2), (5, 5, 'E5', 3), (5, 8, 'G#5', 2), (5, 10, 'B5', 6),
    # Bar 6
    (6, 0, 'C#6', 2), (6, 2, 'D#6', 2), (6, 4, 'E6', 3), (6, 7, 'D#6', 2), (6, 9, 'C#6', 2), (6, 11, 'B5', 3), (6, 14, 'G#5', 2),
    # Bar 7
    (7, 0, 'A#5', 3), (7, 3, 'C#6', 2), (7, 5, 'D#6', 3), (7, 8, 'G6', 4), (7, 12, 'A#6', 4),

    # Bar 8 (Heroic sprint B-section!)
    (8, 0, 'G#5', 2), (8, 2, 'B5', 2), (8, 4, 'E6', 4), (8, 8, 'D#6', 2), (8, 10, 'C#6', 2), (8, 12, 'B5', 4),
    # Bar 9
    (9, 0, 'A#5', 2), (9, 2, 'C#6', 2), (9, 4, 'F#6', 4), (9, 8, 'E6', 2), (9, 10, 'D#6', 2), (9, 12, 'C#6', 4),
    # Bar 10
    (10, 0, 'B5', 2), (10, 2, 'D#6', 2), (10, 4, 'G#6', 4), (10, 8, 'F#6', 2), (10, 10, 'E6', 2), (10, 12, 'D#6', 4),
    # Bar 11
    (11, 0, 'F#6', 3), (11, 3, 'D#6', 2), (11, 5, 'B5', 3), (11, 8, 'D#6', 3), (11, 11, 'F#6', 3), (11, 14, 'G#6', 2),

    # Bar 12 (Climax buildup)
    (12, 0, 'E6', 3), (12, 3, 'C#6', 2), (12, 5, 'G#5', 3), (12, 8, 'C#6', 2), (12, 10, 'E6', 6),
    # Bar 13
    (13, 0, 'G#6', 3), (13, 3, 'E6', 2), (13, 5, 'B5', 3), (13, 8, 'E6', 2), (13, 10, 'G#6', 6),
    # Bar 14
    (14, 0, 'A#6', 3), (14, 3, 'G6', 2), (14, 5, 'D#6', 3), (14, 8, 'C#6', 2), (14, 10, 'A#5', 6),
    # Bar 15 (Final cartoon chromatic slide resolving to D#5)
    (15, 0, 'G5', 2), (15, 2, 'G#5', 2), (15, 4, 'A5', 2), (15, 6, 'A#5', 2), (15, 8, 'B5', 2), (15, 10, 'C6', 2), (15, 12, 'C#6', 2), (15, 14, 'D#6', 2)
]

for bar, step, note, dur_steps in LEAD_LINE:
    base_f = note_to_freq(note)
    start_samp = int((bar * 16 + step) * SECONDS_PER_STEP * SAMPLE_RATE)
    dur_samp = int(dur_steps * SECONDS_PER_STEP * SAMPLE_RATE)
    rel_samp = int(0.06 * SAMPLE_RATE)
    
    phase = 0.0
    for i in range(dur_samp + rel_samp):
        idx = start_samp + i
        if idx >= TOTAL_SAMPLES: break
        t = i / SAMPLE_RATE
        
        # Envelope: punchy front, warm sustain
        if i < int(0.015 * SAMPLE_RATE):
            env = i / (0.015 * SAMPLE_RATE)
        elif i < dur_samp:
            env = 1.0 - 0.12 * (i / dur_samp)
        else:
            env = (1.0 - 0.12) * ((dur_samp + rel_samp - i) / rel_samp)
            
        # Vibrato
        vib = 0.0
        if t > 0.07:
            vib = math.sin(2 * math.pi * 6.2 * t) * (base_f * 0.014)
            
        phase += 2 * math.pi * (base_f + vib) / SAMPLE_RATE
        # Rich multi-sine / warm acoustic reed sound
        reed = (math.sin(phase) + 0.45 * math.sin(phase * 2.0) + 0.25 * math.sin(phase * 3.0)) * env * 0.24
        
        left_buffer[idx] += reed * 0.88
        right_buffer[idx] += reed * 0.88
        
        # Echo
        echo = idx + int(3 * SECONDS_PER_STEP * SAMPLE_RATE)
        if echo < TOTAL_SAMPLES:
            left_buffer[echo] += reed * 0.18
            right_buffer[echo] += reed * 0.12

# ------------------------------------------------------------------------------
# 8. MASTERING & SEAMLESS 16-BAR LOOP CROSSFADE
# ------------------------------------------------------------------------------
print("Mastering and normalizing audio with seamless loop crossfade...")
CROSSFADE = 1200
for i in range(CROSSFADE):
    factor = i / CROSSFADE
    end_idx = TOTAL_SAMPLES - CROSSFADE + i
    left_buffer[i] = left_buffer[i] * factor + left_buffer[end_idx] * (1.0 - factor)
    right_buffer[i] = right_buffer[i] * factor + right_buffer[end_idx] * (1.0 - factor)

max_val = max(max(abs(x) for x in left_buffer), max(abs(x) for x in right_buffer), 0.001)
print(f"Peak amplitude before normalization: {max_val:.3f}")
gain = 0.94 / max_val

output_wav = 'music/mu_tutorial.wav'
with wave.open(output_wav, 'wb') as wav:
    wav.setnchannels(2)
    wav.setsampwidth(2)
    wav.setframerate(SAMPLE_RATE)
    
    frames = bytearray()
    for i in range(TOTAL_SAMPLES):
        l = left_buffer[i] * gain
        r = right_buffer[i] * gain
        # Warm analog limiter
        l = max(-0.98, min(0.98, math.tanh(l * 1.05)))
        r = max(-0.98, min(0.98, math.tanh(r * 1.05)))
        
        int_l = int(l * 32767.0)
        int_r = int(r * 32767.0)
        frames.extend(struct.pack('<hh', int_l, int_r))
        
    wav.writeframes(frames)

print(f"Successfully composed original Bacontu-style track: {output_wav} ({len(frames)} bytes, {TOTAL_SECONDS:.2f}s)")
