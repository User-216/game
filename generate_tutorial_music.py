import math
import struct
import wave
import random

SAMPLE_RATE = 44100
BPM = 118
BEATS_PER_BAR = 4
STEPS_PER_BEAT = 4  # 16th notes
TOTAL_BARS = 16

TOTAL_STEPS = TOTAL_BARS * BEATS_PER_BAR * STEPS_PER_BEAT # 256 steps
SECONDS_PER_BEAT = 60.0 / BPM
# Swing timing: 60% swing ratio on 16th notes
SWING_RATIO = 0.60
EVEN_16TH_DUR = SECONDS_PER_BEAT / 4.0 * (SWING_RATIO * 2.0)
ODD_16TH_DUR  = SECONDS_PER_BEAT / 4.0 * ((1.0 - SWING_RATIO) * 2.0)

# Precalculate start sample of each 16th note step
step_start_samples = [0] * (TOTAL_STEPS + 1)
accum_time = 0.0
for s in range(TOTAL_STEPS):
    step_start_samples[s] = int(accum_time * SAMPLE_RATE)
    dur = EVEN_16TH_DUR if (s % 2 == 0) else ODD_16TH_DUR
    accum_time += dur
step_start_samples[TOTAL_STEPS] = int(accum_time * SAMPLE_RATE)
TOTAL_SAMPLES = step_start_samples[TOTAL_STEPS]

print(f"Generating Pizza Tower/Bacontu Style Tutorial Track: {TOTAL_BARS} bars at {BPM} BPM ({TOTAL_SAMPLES/SAMPLE_RATE:.2f}s, {TOTAL_SAMPLES} samples)")

NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
FLAT_MAP = {'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#'}
def note_to_freq(note_str):
    if not note_str or note_str == '-': return 0.0
    name = note_str[:-1]
    octave = int(note_str[-1])
    if name in FLAT_MAP:
        name = FLAT_MAP[name]
    semitone = NOTE_NAMES.index(name)
    midi = (octave + 1) * 12 + semitone
    return 440.0 * (2.0 ** ((midi - 69) / 12.0))

# Oscillators
def osc_saw(phase):
    p = (phase / (2.0 * math.pi)) % 1.0
    return 2.0 * p - 1.0

def osc_square(phase, duty=0.5):
    p = phase % (2.0 * math.pi)
    return 1.0 if p < (2.0 * math.pi * duty) else -1.0

def osc_tri(phase):
    p = (phase / (2.0 * math.pi)) % 1.0
    return 2.0 * abs(2.0 * p - 1.0) - 1.0

def osc_sine(phase):
    return math.sin(phase)

left_buffer = [0.0] * TOTAL_SAMPLES
right_buffer = [0.0] * TOTAL_SAMPLES

# Subtle vinyl crackle background
random.seed(42)
for i in range(TOTAL_SAMPLES):
    if random.random() < 0.0008:
        pop = (random.random() * 2 - 1) * 0.08
        if i + 10 < TOTAL_SAMPLES:
            for j in range(10):
                decay = math.exp(-0.8 * j)
                left_buffer[i + j] += pop * decay
                right_buffer[i + j] += pop * decay * 0.7

# 1. DRUMS (Boom-Bap / Funk Breakbeat)
print("Rendering boom-bap drum groove...")
def add_drum(start_samp, drum_type, vol=1.0):
    if drum_type == 'kick':
        dur = int(0.32 * SAMPLE_RATE)
        for i in range(dur):
            idx = start_samp + i
            if idx >= TOTAL_SAMPLES: break
            t = i / SAMPLE_RATE
            pitch = 45.0 + 110.0 * math.exp(-32.0 * t)
            phase = 2.0 * math.pi * pitch * t
            env = math.exp(-11.0 * t)
            click = math.exp(-120.0 * t) * (random.random() * 2 - 1) * 0.35
            sample = (math.sin(phase) + click) * env * vol * 0.85
            left_buffer[idx] += sample
            right_buffer[idx] += sample
    elif drum_type == 'snare':
        dur = int(0.28 * SAMPLE_RATE)
        for i in range(dur):
            idx = start_samp + i
            if idx >= TOTAL_SAMPLES: break
            t = i / SAMPLE_RATE
            # Snappy acoustic body + noise crack
            body = math.sin(2.0 * math.pi * (210.0 * math.exp(-22.0 * t)) * t) * math.exp(-16.0 * t) * 0.45
            snap = math.sin(2.0 * math.pi * 330.0 * t) * math.exp(-30.0 * t) * 0.2
            noise = (random.random() * 2 - 1) * math.exp(-15.0 * t) * 0.65
            sample = (body + snap + noise) * vol * 0.65
            left_buffer[idx] += sample
            right_buffer[idx] += sample
    elif drum_type == 'ghost_snare':
        dur = int(0.12 * SAMPLE_RATE)
        for i in range(dur):
            idx = start_samp + i
            if idx >= TOTAL_SAMPLES: break
            t = i / SAMPLE_RATE
            noise = (random.random() * 2 - 1) * math.exp(-28.0 * t) * 0.18 * vol
            left_buffer[idx] += noise
            right_buffer[idx] += noise
    elif drum_type == 'hat_closed':
        dur = int(0.06 * SAMPLE_RATE)
        for i in range(dur):
            idx = start_samp + i
            if idx >= TOTAL_SAMPLES: break
            t = i / SAMPLE_RATE
            noise = (random.random() * 2 - 1) * math.exp(-65.0 * t) * 0.22 * vol
            left_buffer[idx] += noise * 0.85
            right_buffer[idx] += noise * 1.15
    elif drum_type == 'hat_open':
        dur = int(0.22 * SAMPLE_RATE)
        for i in range(dur):
            idx = start_samp + i
            if idx >= TOTAL_SAMPLES: break
            t = i / SAMPLE_RATE
            noise = (random.random() * 2 - 1) * math.exp(-18.0 * t) * 0.28 * vol
            left_buffer[idx] += noise * 1.15
            right_buffer[idx] += noise * 0.85
    elif drum_type == 'crash':
        dur = int(1.4 * SAMPLE_RATE)
        for i in range(dur):
            idx = start_samp + i
            if idx >= TOTAL_SAMPLES: break
            t = i / SAMPLE_RATE
            metal = (math.sin(2.0 * math.pi * 340 * t) + math.sin(2.0 * math.pi * 520 * t) + math.sin(2.0 * math.pi * 780 * t)) * 0.22
            noise = (random.random() * 2 - 1) * 0.78
            sample = (metal + noise) * math.exp(-3.2 * t) * 0.4 * vol
            left_buffer[idx] += sample
            right_buffer[idx] += sample

for bar in range(TOTAL_BARS):
    bar_start_step = bar * 16
    for step in range(16):
        cur_step = bar_start_step + step
        start_samp = step_start_samples[cur_step]
        
        # Crash on bar 0 and bar 8 downbeat
        if step == 0 and (bar == 0 or bar == 8):
            add_drum(start_samp, 'crash', 1.0)
            
        # Boom-bap kick pattern (1, 2-and, 3-and)
        if step in [0, 6, 10]:
            add_drum(start_samp, 'kick', 1.0)
        elif step == 14 and bar in [3, 7, 11, 15]:
            add_drum(start_samp, 'kick', 0.9)
            
        # Fat snare on 4 and 12 (beats 2 and 4)
        if step in [4, 12]:
            add_drum(start_samp, 'snare', 1.0)
        elif step in [7, 15] and random.random() < 0.7:
            add_drum(start_samp, 'ghost_snare', 0.6) # funk ghost notes!

        # Hi-hat groove with swing accents
        if step in [2, 6, 10, 14]:
            add_drum(start_samp, 'hat_open', 0.85)
        else:
            acc = 1.0 if (step % 4 == 0) else 0.65
            add_drum(start_samp, 'hat_closed', acc)

# 2. FUNK SLAP BASS (Auto-Wah / Envelope Filter Groove)
print("Rendering funky slap bass with envelope filter...")
# E Minor / E Dorian Funk Progression (4 bars x 4)
# Bars 0-3: Em7 -> A7 -> Em7 -> B7alt
# Bars 4-7: Em7 -> A7 -> C7 -> B7
# Bars 8-11: Am7 -> D7 -> Em7 -> G7 (B section)
# Bars 12-15: Am7 -> C7 -> B7 -> B7#9 (turnaround)
BASS_PATTERNS = [
    # Bar 0: Em7
    [('E1', 2), ('-', 1), ('E2', 2), ('-', 1), ('E1', 2), ('-', 1), ('D2', 1), ('D#2', 1), ('E2', 2), ('B1', 2), ('D2', 1)],
    # Bar 1: A7
    [('A1', 2), ('-', 1), ('A2', 2), ('-', 1), ('A1', 2), ('-', 1), ('G2', 1), ('G#2', 1), ('A2', 2), ('E2', 2), ('G2', 1)],
    # Bar 2: Em7
    [('E1', 2), ('-', 1), ('E2', 2), ('-', 1), ('E1', 2), ('-', 1), ('D2', 1), ('D#2', 1), ('E2', 2), ('G2', 2), ('E2', 1)],
    # Bar 3: B7alt
    [('B1', 2), ('-', 1), ('B2', 2), ('-', 1), ('B1', 2), ('-', 1), ('A2', 2), ('B2', 2), ('-', 1), ('F#2', 2), ('A1', 1)],

    # Bar 4: Em7
    [('E1', 2), ('-', 1), ('E2', 2), ('-', 1), ('E1', 2), ('-', 1), ('D2', 1), ('D#2', 1), ('E2', 2), ('B1', 2), ('D2', 1)],
    # Bar 5: A7
    [('A1', 2), ('-', 1), ('A2', 2), ('-', 1), ('A1', 2), ('-', 1), ('G2', 1), ('G#2', 1), ('A2', 2), ('E2', 2), ('G2', 1)],
    # Bar 6: C7
    [('C2', 2), ('-', 1), ('C3', 2), ('-', 1), ('C2', 2), ('-', 1), ('Bb2', 2), ('C3', 2), ('-', 1), ('G2', 2), ('Bb1', 1)],
    # Bar 7: B7
    [('B1', 2), ('-', 1), ('B2', 2), ('-', 1), ('B1', 2), ('-', 1), ('A2', 2), ('B2', 1), ('C3', 1), ('B2', 1), ('A2', 1), ('F#2', 1)],

    # Bar 8: Am7
    [('A1', 2), ('-', 1), ('A2', 2), ('-', 1), ('A1', 2), ('-', 1), ('G2', 1), ('G#2', 1), ('A2', 2), ('E2', 2), ('G2', 1)],
    # Bar 9: D7
    [('D2', 2), ('-', 1), ('D3', 2), ('-', 1), ('D2', 2), ('-', 1), ('C3', 1), ('C#3', 1), ('D3', 2), ('A2', 2), ('C3', 1)],
    # Bar 10: Em7
    [('E1', 2), ('-', 1), ('E2', 2), ('-', 1), ('E1', 2), ('-', 1), ('D2', 1), ('D#2', 1), ('E2', 2), ('B1', 2), ('D2', 1)],
    # Bar 11: G7
    [('G1', 2), ('-', 1), ('G2', 2), ('-', 1), ('G1', 2), ('-', 1), ('F2', 2), ('G2', 2), ('-', 1), ('D2', 2), ('F1', 1)],

    # Bar 12: Am7
    [('A1', 2), ('-', 1), ('A2', 2), ('-', 1), ('A1', 2), ('-', 1), ('G2', 1), ('G#2', 1), ('A2', 2), ('E2', 2), ('G2', 1)],
    # Bar 13: C7
    [('C2', 2), ('-', 1), ('C3', 2), ('-', 1), ('C2', 2), ('-', 1), ('Bb2', 2), ('C3', 2), ('-', 1), ('G2', 2), ('Bb1', 1)],
    # Bar 14: B7
    [('B1', 2), ('-', 1), ('B2', 2), ('-', 1), ('B1', 2), ('-', 1), ('A2', 2), ('B2', 2), ('-', 1), ('F#2', 2), ('A1', 1)],
    # Bar 15: B7#9 (climax walking bass up to E1)
    [('B1', 2), ('C2', 1), ('C#2', 1), ('D2', 2), ('D#2', 2), ('F#2', 2), ('A2', 2), ('A#2', 2), ('B2', 2)]
]

for bar in range(TOTAL_BARS):
    pattern = BASS_PATTERNS[bar]
    step_offset = 0
    for note, dur_steps in pattern:
        if note != '-':
            freq = note_to_freq(note)
            cur_step = bar * 16 + step_offset
            start_samp = step_start_samples[cur_step]
            end_step = min(TOTAL_STEPS, cur_step + dur_steps)
            dur_samp = step_start_samples[end_step] - start_samp + int(0.04 * SAMPLE_RATE)
            
            phase = 0.0
            phase_sub = 0.0
            filter_y = 0.0
            for i in range(dur_samp):
                idx = start_samp + i
                if idx >= TOTAL_SAMPLES: break
                t = i / SAMPLE_RATE
                
                # Auto-wah envelope: opens quickly, snaps and decays
                wah_env = math.exp(-14.0 * t)
                amp_env = math.exp(-8.0 * t)
                
                phase += 2.0 * math.pi * freq / SAMPLE_RATE
                phase_sub += 2.0 * math.pi * (freq * 0.5) / SAMPLE_RATE
                
                raw = 0.65 * osc_saw(phase) + 0.55 * osc_square(phase, 0.4) + 0.4 * osc_sine(phase_sub)
                
                # Resonant filter coefficient
                fc = 0.08 + 0.42 * wah_env
                filter_y += fc * (raw - filter_y)
                
                out = filter_y * amp_env * 0.45
                left_buffer[idx] += out
                right_buffer[idx] += out
                
        step_offset += dur_steps

# 3. FUNK CLAVINET / RHYTHM CHORDS (Crisp 16th comping)
print("Rendering funky clavinet chords...")
CHORD_VOICINGS = [
    # 0..3: Em7, A7, Em7, B7
    ['G3', 'D4', 'E4', 'G4'],
    ['G3', 'C#4', 'E4', 'A4'],
    ['G3', 'D4', 'E4', 'G4'],
    ['A3', 'D#4', 'F#4', 'B4'],
    # 4..7: Em7, A7, C7, B7
    ['G3', 'D4', 'E4', 'G4'],
    ['G3', 'C#4', 'E4', 'A4'],
    ['Bb3', 'E4', 'G4', 'C5'],
    ['A3', 'D#4', 'F#4', 'B4'],
    # 8..11: Am7, D7, Em7, G7
    ['G3', 'C4', 'E4', 'A4'],
    ['F#3', 'C4', 'D4', 'A4'],
    ['G3', 'D4', 'E4', 'G4'],
    ['F3', 'B3', 'D4', 'G4'],
    # 12..15: Am7, C7, B7, B7#9
    ['G3', 'C4', 'E4', 'A4'],
    ['Bb3', 'E4', 'G4', 'C5'],
    ['A3', 'D#4', 'F#4', 'B4'],
    ['A3', 'D4', 'D#4', 'G4']
]

# Funky comping rhythm (staccato chords on offbeats and syncopations)
CLAV_HITS = [2, 5, 8, 11, 14]

for bar in range(TOTAL_BARS):
    chord = CHORD_VOICINGS[bar]
    for step in CLAV_HITS:
        cur_step = bar * 16 + step
        start_samp = step_start_samples[cur_step]
        dur = int(0.09 * SAMPLE_RATE) # short staccato
        
        for note in chord:
            freq = note_to_freq(note)
            phase = random.random() * 2.0 * math.pi
            for i in range(dur):
                idx = start_samp + i
                if idx >= TOTAL_SAMPLES: break
                t = i / SAMPLE_RATE
                env = math.exp(-32.0 * t)
                phase += 2.0 * math.pi * freq / SAMPLE_RATE
                # narrow pulse wave for clavinet sound
                val = osc_square(phase, duty=0.2) * env * 0.05
                left_buffer[idx] += val * 0.7
                right_buffer[idx] += val * 1.3

# 4. CARTOON BRASS STABS ("Ba-da-BAP! ... BA-DOW!")
print("Rendering cartoon brass section stabs...")
# Brass chords: (bar, step, chord_notes, dur_steps, is_fall)
BRASS_EVENTS = [
    # Bar 0
    (0, 4, ['E4', 'G4', 'D5', 'E5'], 2, False),
    (0, 7, ['E4', 'G4', 'D5', 'E5'], 3, True),
    # Bar 1
    (1, 4, ['E4', 'G4', 'C#5', 'E5'], 2, False),
    (1, 7, ['G4', 'C#5', 'E5', 'A5'], 4, True),
    # Bar 2
    (2, 4, ['E4', 'G4', 'D5', 'E5'], 2, False),
    (2, 10, ['E4', 'G4', 'D5', 'E5'], 2, False),
    (2, 13, ['D4', 'F#4', 'C5', 'D5'], 3, True),
    # Bar 3 (Turnaround punch)
    (3, 4, ['D#4', 'A4', 'B4', 'D#5'], 2, False),
    (3, 8, ['D#4', 'A4', 'B4', 'F#5'], 3, False),
    (3, 12, ['D#4', 'A4', 'C5', 'G5'], 4, True),

    # Bar 4
    (4, 4, ['E4', 'G4', 'D5', 'E5'], 2, False),
    (4, 7, ['E4', 'G4', 'D5', 'E5'], 3, True),
    # Bar 5
    (5, 4, ['E4', 'G4', 'C#5', 'E5'], 2, False),
    (5, 7, ['G4', 'C#5', 'E5', 'A5'], 4, True),
    # Bar 6
    (6, 4, ['G4', 'Bb4', 'E5', 'G5'], 2, False),
    (6, 10, ['Bb4', 'E5', 'G5', 'C6'], 2, False),
    (6, 13, ['A4', 'D#5', 'F#5', 'B5'], 3, True),
    # Bar 7
    (7, 4, ['A4', 'D#5', 'F#5', 'B5'], 2, False),
    (7, 8, ['D#5', 'A5', 'B5', 'D#6'], 3, False),
    (7, 12, ['A5', 'C6', 'D#6', 'F#6'], 4, True),

    # Bars 8-11 (B-section funk breakdown punches)
    (8, 4, ['C4', 'E4', 'A4', 'C5'], 2, False),
    (8, 7, ['E4', 'A4', 'C5', 'E5'], 3, True),
    (9, 4, ['C4', 'D4', 'F#4', 'A4'], 2, False),
    (9, 7, ['D4', 'F#4', 'A4', 'C5'], 4, True),
    (10, 4, ['B3', 'E4', 'G4', 'B4'], 2, False),
    (10, 7, ['E4', 'G4', 'B4', 'E5'], 3, True),
    (11, 4, ['B3', 'D4', 'F4', 'G4'], 2, False),
    (11, 8, ['D4', 'F4', 'G4', 'B4'], 3, False),
    (11, 12, ['F4', 'G4', 'B4', 'D5'], 4, True),

    # Bars 12-15 (Climax buildup)
    (12, 4, ['C4', 'E4', 'A4', 'C5'], 2, False),
    (12, 10, ['C4', 'E4', 'A4', 'C5'], 2, False),
    (13, 4, ['E4', 'G4', 'Bb4', 'C5'], 2, False),
    (13, 10, ['G4', 'Bb4', 'C5', 'E5'], 2, False),
    (14, 4, ['F#4', 'A4', 'B4', 'D#5'], 2, False),
    (14, 10, ['A4', 'B4', 'D#5', 'F#5'], 2, False),
    # Bar 15 big crescendo hits
    (15, 0, ['A4', 'D#5', 'F#5', 'B5'], 2, False),
    (15, 4, ['B4', 'F5', 'G5', 'D6'], 2, False),
    (15, 8, ['C5', 'F#5', 'A5', 'D#6'], 3, False),
    (15, 12, ['D#5', 'A5', 'C6', 'F#6'], 4, True)
]

for bar, step, chord, dur_steps, is_fall in BRASS_EVENTS:
    cur_step = bar * 16 + step
    start_samp = step_start_samples[cur_step]
    dur_samp = int(dur_steps * SECONDS_PER_BEAT / 4.0 * SAMPLE_RATE) + int(0.08 * SAMPLE_RATE)
    
    for note in chord:
        base_freq = note_to_freq(note)
        # Detuned saw waves for thick brass section
        phase1 = random.random() * 2 * math.pi
        phase2 = random.random() * 2 * math.pi
        phase3 = random.random() * 2 * math.pi
        
        for i in range(dur_samp):
            idx = start_samp + i
            if idx >= TOTAL_SAMPLES: break
            t = i / SAMPLE_RATE
            
            # Brass envelope: fast 15ms swell, sustained punch, then decay
            if t < 0.015:
                env = (t / 0.015)
            else:
                env = math.exp(-5.5 * (t - 0.015))
                
            # Cartoon pitch fall at the end of the hit!
            cur_freq = base_freq
            if is_fall and t > 0.08:
                cur_freq *= math.exp(-8.0 * (t - 0.08))
                
            phase1 += 2.0 * math.pi * cur_freq / SAMPLE_RATE
            phase2 += 2.0 * math.pi * (cur_freq * 1.004) / SAMPLE_RATE
            phase3 += 2.0 * math.pi * (cur_freq * 0.996) / SAMPLE_RATE
            
            raw = (osc_saw(phase1) + osc_saw(phase2) + osc_saw(phase3)) / 3.0
            val = raw * env * 0.12
            
            left_buffer[idx] += val * 0.95
            right_buffer[idx] += val * 0.95

# 5. CARTOON WHISTLING / SWAGGERING LEAD MELODY
print("Rendering cartoon swaggering lead melody...")
# Format: (bar, step, note, dur_steps, slide_to_note)
LEAD_MELODY = [
    # Bar 0 (Playful, swaggering motif)
    (0, 0, 'E5', 3, None), (0, 3, 'G5', 2, None), (0, 5, 'A5', 2, None), (0, 7, 'Bb5', 1, 'B5'), (0, 8, 'B5', 4, None), (0, 12, 'D6', 2, None), (0, 14, 'B5', 2, None),
    # Bar 1
    (1, 0, 'A5', 3, None), (1, 3, 'G5', 2, None), (1, 5, 'E5', 3, None), (1, 8, 'D5', 2, None), (1, 10, 'E5', 6, None),
    # Bar 2
    (2, 0, 'E5', 3, None), (2, 3, 'G5', 2, None), (2, 5, 'A5', 2, None), (2, 7, 'Bb5', 1, 'B5'), (2, 8, 'B5', 3, None), (2, 11, 'D6', 2, None), (2, 13, 'E6', 3, None),
    # Bar 3 (Quirky cartoon fall)
    (3, 0, 'F#6', 3, None), (3, 3, 'D#6', 2, None), (3, 5, 'B5', 3, None), (3, 8, 'A5', 2, None), (3, 10, 'F#5', 6, None),

    # Bar 4 (Repeat motif with higher energetic variations)
    (4, 0, 'E5', 3, None), (4, 3, 'G5', 2, None), (4, 5, 'A5', 2, None), (4, 7, 'Bb5', 1, 'B5'), (4, 8, 'B5', 4, None), (4, 12, 'D6', 2, None), (4, 14, 'E6', 2, None),
    # Bar 5
    (5, 0, 'G6', 3, None), (5, 3, 'E6', 2, None), (5, 5, 'C#6', 3, None), (5, 8, 'B5', 2, None), (5, 10, 'A5', 6, None),
    # Bar 6
    (6, 0, 'Bb5', 3, None), (6, 3, 'C6', 2, None), (6, 5, 'E6', 3, None), (6, 8, 'G6', 3, None), (6, 11, 'E6', 2, None), (6, 13, 'C6', 3, None),
    # Bar 7
    (7, 0, 'B5', 3, None), (7, 3, 'D#6', 2, None), (7, 5, 'F#6', 3, None), (7, 8, 'A6', 4, None), (7, 12, 'B6', 4, None),

    # Bar 8 (B-Section bluesy breakdown)
    (8, 0, 'C6', 3, None), (8, 3, 'A5', 2, None), (8, 5, 'E5', 3, None), (8, 8, 'G5', 2, None), (8, 10, 'A5', 6, None),
    # Bar 9
    (9, 0, 'D6', 3, None), (9, 3, 'B5', 2, None), (9, 5, 'F#5', 3, None), (9, 8, 'A5', 2, None), (9, 10, 'B5', 6, None),
    # Bar 10
    (10, 0, 'E6', 3, None), (10, 3, 'G6', 2, None), (10, 5, 'E6', 3, None), (10, 8, 'D6', 2, None), (10, 10, 'B5', 6, None),
    # Bar 11
    (11, 0, 'G5', 2, None), (11, 2, 'A5', 2, None), (11, 4, 'B5', 2, None), (11, 6, 'D6', 2, None), (11, 8, 'F6', 4, None), (11, 12, 'D6', 4, None),

    # Bar 12 (Climax buildup)
    (12, 0, 'A5', 3, None), (12, 3, 'C6', 2, None), (12, 5, 'E6', 3, None), (12, 8, 'A6', 4, None), (12, 12, 'G6', 2, None), (12, 14, 'E6', 2, None),
    # Bar 13
    (13, 0, 'Bb5', 3, None), (13, 3, 'C6', 2, None), (13, 5, 'E6', 3, None), (13, 8, 'G6', 4, None), (13, 12, 'F6', 2, None), (13, 14, 'D6', 2, None),
    # Bar 14
    (14, 0, 'B5', 3, None), (14, 3, 'D#6', 2, None), (14, 5, 'F#6', 3, None), (14, 8, 'B6', 4, None), (14, 12, 'A6', 2, None), (14, 14, 'F#6', 2, None),
    # Bar 15 (Final chromatic roll resolving to E5)
    (15, 0, 'G6', 2, None), (15, 2, 'G#6', 2, None), (15, 4, 'A6', 2, None), (15, 6, 'A#6', 2, None), (15, 8, 'B6', 4, None), (15, 12, 'D#6', 4, None)
]

for bar, step, note, dur_steps, slide_to in LEAD_MELODY:
    start_freq = note_to_freq(note)
    target_freq = note_to_freq(slide_to) if slide_to else start_freq
    cur_step = bar * 16 + step
    start_samp = step_start_samples[cur_step]
    end_step = min(TOTAL_STEPS, cur_step + dur_steps)
    dur_samp = step_start_samples[end_step] - start_samp
    release_samp = int(0.06 * SAMPLE_RATE)
    
    phase = 0.0
    for i in range(dur_samp + release_samp):
        idx = start_samp + i
        if idx >= TOTAL_SAMPLES: break
        t = i / SAMPLE_RATE
        
        # Envelope: punchy attack, lively sustain
        if i < int(0.02 * SAMPLE_RATE):
            env = (i / (0.02 * SAMPLE_RATE))
        elif i < dur_samp:
            env = 1.0 - 0.15 * (i / dur_samp)
        else:
            rel_t = (i - dur_samp) / release_samp
            env = (1.0 - 0.15) * (1.0 - rel_t)
            
        # Pitch slide if specified, plus vibrato after 0.1s
        if slide_to and i < dur_samp:
            slide_frac = min(1.0, i / dur_samp)
            cur_freq = start_freq + (target_freq - start_freq) * slide_frac
        else:
            cur_freq = start_freq
            
        if t > 0.08:
            cur_freq += math.sin(2.0 * math.pi * 6.0 * (t - 0.08)) * (cur_freq * 0.015)
            
        phase += 2.0 * math.pi * cur_freq / SAMPLE_RATE
        # Muted square wave / cartoon lead tone
        pulse = osc_square(phase, duty=0.35)
        tri = osc_tri(phase)
        val = (pulse * 0.6 + tri * 0.4) * env * 0.22
        
        # Delay send
        left_buffer[idx] += val * 0.85
        right_buffer[idx] += val * 0.85
        
        echo_idx = idx + int(EVEN_16TH_DUR * 2.5 * SAMPLE_RATE)
        if echo_idx < TOTAL_SAMPLES:
            left_buffer[echo_idx] += val * 0.18
            right_buffer[echo_idx] += val * 0.12

# 6. SEAMLESS LOOP CROSSFADE & MASTERING
print("Mastering and normalizing audio with seamless loop crossfade...")
CROSSFADE = 1200
for i in range(CROSSFADE):
    factor = i / CROSSFADE
    end_idx = TOTAL_SAMPLES - CROSSFADE + i
    left_buffer[i] = left_buffer[i] * factor + left_buffer[end_idx] * (1.0 - factor)
    right_buffer[i] = right_buffer[i] * factor + right_buffer[end_idx] * (1.0 - factor)

max_val = 0.0001
for i in range(TOTAL_SAMPLES):
    max_val = max(max_val, abs(left_buffer[i]), abs(right_buffer[i]))

print(f"Peak amplitude before normalization: {max_val:.3f}")
gain = 0.94 / max_val

output_path = 'music/mu_tutorial.wav'
with wave.open(output_path, 'wb') as wav:
    wav.setnchannels(2)
    wav.setsampwidth(2)
    wav.setframerate(SAMPLE_RATE)
    
    frames = bytearray()
    for i in range(TOTAL_SAMPLES):
        l = left_buffer[i] * gain
        r = right_buffer[i] * gain
        # Warm analog tape saturation
        l = max(-0.98, min(0.98, math.tanh(l * 1.05)))
        r = max(-0.98, min(0.98, math.tanh(r * 1.05)))
        
        int_l = int(l * 32767.0)
        int_r = int(r * 32767.0)
        frames.extend(struct.pack('<hh', int_l, int_r))
        
    wav.writeframes(frames)

print(f"Successfully generated: {output_path} ({len(frames)} bytes, {TOTAL_SAMPLES/SAMPLE_RATE:.2f}s)")
