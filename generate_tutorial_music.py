import math
import struct
import wave
import random

SAMPLE_RATE = 44100
BPM = 136
BEATS_PER_BAR = 4
STEPS_PER_BEAT = 4  # 16th notes
TOTAL_BARS = 16

TOTAL_STEPS = TOTAL_BARS * BEATS_PER_BAR * STEPS_PER_BEAT # 256 steps
SECONDS_PER_BEAT = 60.0 / BPM
SECONDS_PER_STEP = SECONDS_PER_BEAT / STEPS_PER_BEAT
TOTAL_SECONDS = TOTAL_STEPS * SECONDS_PER_STEP
TOTAL_SAMPLES = int(TOTAL_SECONDS * SAMPLE_RATE)

print(f"Generating Tutorial Soundtrack: {TOTAL_BARS} bars at {BPM} BPM ({TOTAL_SECONDS:.2f}s, {TOTAL_SAMPLES} samples)")

# Frequency lookup for notes
NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
def note_to_freq(note_str):
    if not note_str or note_str == '-': return 0.0
    name = note_str[:-1]
    octave = int(note_str[-1])
    semitone = NOTE_NAMES.index(name)
    # A4 is 440Hz, octave 4, semitone 9
    midi = (octave + 1) * 12 + semitone
    return 440.0 * (2.0 ** ((midi - 69) / 12.0))

# Oscillators
def osc_square(phase, duty=0.5):
    p = phase % (2.0 * math.pi)
    return 1.0 if p < (2.0 * math.pi * duty) else -1.0

def osc_saw(phase):
    p = (phase / (2.0 * math.pi)) % 1.0
    return 2.0 * p - 1.0

def osc_triangle(phase):
    p = (phase / (2.0 * math.pi)) % 1.0
    return 2.0 * abs(2.0 * p - 1.0) - 1.0

def osc_sine(phase):
    return math.sin(phase)

# Stereo buffers
left_buffer = [0.0] * TOTAL_SAMPLES
right_buffer = [0.0] * TOTAL_SAMPLES

# 1. DRUMS SYNTHESIS
print("Synthesizing drums...")
# Patterns across 16 bars
def add_drum(buffer_l, buffer_r, start_sample, drum_type, vol=1.0):
    if drum_type == 'kick':
        dur = int(0.28 * SAMPLE_RATE)
        for i in range(dur):
            idx = start_sample + i
            if idx >= TOTAL_SAMPLES: break
            t = i / SAMPLE_RATE
            # pitch drops from 160Hz to 40Hz
            pitch = 40.0 + 120.0 * math.exp(-25.0 * t)
            phase = 2.0 * math.pi * pitch * t
            # env
            env = math.exp(-12.0 * t)
            # click
            click = math.exp(-100.0 * t) * (random.random() * 2 - 1) * 0.3
            sample = (math.sin(phase) + click) * env * vol * 0.75
            buffer_l[idx] += sample
            buffer_r[idx] += sample
    elif drum_type == 'snare':
        dur = int(0.25 * SAMPLE_RATE)
        for i in range(dur):
            idx = start_sample + i
            if idx >= TOTAL_SAMPLES: break
            t = i / SAMPLE_RATE
            tone = math.sin(2.0 * math.pi * (180.0 * math.exp(-15.0 * t)) * t) * math.exp(-18.0 * t) * 0.4
            noise = (random.random() * 2 - 1) * math.exp(-14.0 * t) * 0.6
            sample = (tone + noise) * vol * 0.6
            buffer_l[idx] += sample
            buffer_r[idx] += sample
    elif drum_type == 'hat_closed':
        dur = int(0.05 * SAMPLE_RATE)
        for i in range(dur):
            idx = start_sample + i
            if idx >= TOTAL_SAMPLES: break
            t = i / SAMPLE_RATE
            noise = (random.random() * 2 - 1) * math.exp(-70.0 * t) * 0.22 * vol
            buffer_l[idx] += noise * 0.9
            buffer_r[idx] += noise * 1.1
    elif drum_type == 'hat_open':
        dur = int(0.18 * SAMPLE_RATE)
        for i in range(dur):
            idx = start_sample + i
            if idx >= TOTAL_SAMPLES: break
            t = i / SAMPLE_RATE
            noise = (random.random() * 2 - 1) * math.exp(-20.0 * t) * 0.25 * vol
            buffer_l[idx] += noise * 1.1
            buffer_r[idx] += noise * 0.9
    elif drum_type == 'crash':
        dur = int(1.2 * SAMPLE_RATE)
        for i in range(dur):
            idx = start_sample + i
            if idx >= TOTAL_SAMPLES: break
            t = i / SAMPLE_RATE
            # metallic mix
            metal = (math.sin(2.0 * math.pi * 324 * t) + math.sin(2.0 * math.pi * 517 * t) + math.sin(2.0 * math.pi * 791 * t)) * 0.2
            noise = (random.random() * 2 - 1) * 0.8
            env = math.exp(-3.5 * t)
            sample = (metal + noise) * env * 0.35 * vol
            buffer_l[idx] += sample
            buffer_r[idx] += sample

for bar in range(TOTAL_BARS):
    bar_start_step = bar * 16
    for step in range(16):
        cur_step = bar_start_step + step
        start_samp = int(cur_step * SECONDS_PER_STEP * SAMPLE_RATE)
        
        # Crash on bar 0 and bar 8
        if step == 0 and (bar == 0 or bar == 8):
            add_drum(left_buffer, right_buffer, start_samp, 'crash', 1.0)
            
        # Kick on 0, 6 (syncopated 2-and), 8
        if step in [0, 6, 8]:
            add_drum(left_buffer, right_buffer, start_samp, 'kick', 1.0)
        elif step in [10, 14] and bar in [3, 7, 11, 15]:
            add_drum(left_buffer, right_buffer, start_samp, 'kick', 0.85)

        # Snare on 4, 12 (beats 2 and 4)
        if step in [4, 12]:
            add_drum(left_buffer, right_buffer, start_samp, 'snare', 1.0)
        # Snare fill at end of bar 7 and 15
        if (bar == 7 or bar == 15) and step in [13, 14, 15]:
            add_drum(left_buffer, right_buffer, start_samp, 'snare', 0.8)

        # Hi-hats every 16th note
        if step in [2, 6, 10, 14]:
            add_drum(left_buffer, right_buffer, start_samp, 'hat_open', 0.8)
        else:
            acc = 1.0 if (step % 2 == 0) else 0.6
            add_drum(left_buffer, right_buffer, start_samp, 'hat_closed', acc)

# 2. BASSLINE SYNTHESIS (Slap / Synth Bass)
print("Synthesizing bassline...")
# 16-bar bass score: 16 notes per bar (16th notes)
CHORD_ROOTS = [
    # 0..3: C, G, Am, F
    ('C2', 'C3', 'G2'),
    ('G1', 'G2', 'D2'),
    ('A1', 'A2', 'E2'),
    ('F1', 'F2', 'C2'),
    # 4..7: C, Em, Am, F
    ('C2', 'C3', 'G2'),
    ('E1', 'E2', 'B1'),
    ('A1', 'A2', 'E2'),
    ('F1', 'F2', 'C2'),
    # 8..11: Dm, G, Em, Am
    ('D2', 'D3', 'A1'),
    ('G1', 'G2', 'D2'),
    ('E1', 'E2', 'B1'),
    ('A1', 'A2', 'E2'),
    # 12..15: Dm, F, G, G7 (turnaround)
    ('D2', 'D3', 'A1'),
    ('F1', 'F2', 'C2'),
    ('G1', 'G2', 'D2'),
    ('G1', 'G2', 'F2')
]

for bar in range(TOTAL_BARS):
    r_low, r_hi, fifth = CHORD_ROOTS[bar]
    # Funky bass pattern
    bass_pattern = [
        r_low, None, r_hi, None,
        r_low, None, r_hi, r_low,
        None,  r_hi, None, r_low,
        r_hi,  None, fifth, r_low
    ]
    for step in range(16):
        note = bass_pattern[step]
        if not note: continue
        freq = note_to_freq(note)
        start_samp = int((bar * 16 + step) * SECONDS_PER_STEP * SAMPLE_RATE)
        note_dur = int(SECONDS_PER_STEP * 1.5 * SAMPLE_RATE)
        
        phase = 0.0
        phase_sub = 0.0
        filter_state = 0.0
        for i in range(note_dur):
            idx = start_samp + i
            if idx >= TOTAL_SAMPLES: break
            t = i / SAMPLE_RATE
            
            # Envelope (punchy plucky decay)
            env = math.exp(-12.0 * t)
            
            # Saw + Sub Sine
            phase += 2.0 * math.pi * freq / SAMPLE_RATE
            phase_sub += 2.0 * math.pi * (freq * 0.5) / SAMPLE_RATE
            
            raw = 0.7 * osc_saw(phase) + 0.5 * osc_sine(phase_sub)
            
            # Simple lowpass filter with envelope modulation
            cutoff = 0.15 + 0.35 * env
            filter_state += cutoff * (raw - filter_state)
            
            out = filter_state * env * 0.38
            left_buffer[idx] += out
            right_buffer[idx] += out

# 3. CHORD ARPEGGIO SYNTHESIS (Chiptune Shimmering Arps)
print("Synthesizing chord arpeggios...")
ARPS = [
    # 0..3: C, G, Am, F
    ['C4', 'E4', 'G4', 'C5'],
    ['G3', 'B3', 'D4', 'G4'],
    ['A3', 'C4', 'E4', 'A4'],
    ['F3', 'A3', 'C4', 'F4'],
    # 4..7: C, Em, Am, F
    ['C4', 'E4', 'G4', 'C5'],
    ['E3', 'G3', 'B3', 'E4'],
    ['A3', 'C4', 'E4', 'A4'],
    ['F3', 'A3', 'C4', 'F4'],
    # 8..11: Dm, G, Em, Am
    ['D4', 'F4', 'A4', 'D5'],
    ['G3', 'B3', 'D4', 'G4'],
    ['E3', 'G3', 'B3', 'E4'],
    ['A3', 'C4', 'E4', 'A4'],
    # 12..15: Dm, F, G, G7
    ['D4', 'F4', 'A4', 'D5'],
    ['F3', 'A3', 'C4', 'F4'],
    ['G3', 'B3', 'D4', 'G4'],
    ['G3', 'B3', 'D4', 'F4']
]

for bar in range(TOTAL_BARS):
    chord_notes = ARPS[bar]
    for step in range(16):
        note = chord_notes[step % len(chord_notes)]
        # Octave up on second half of bar
        if (step // 4) % 2 == 1:
            note = note[:-1] + str(int(note[-1]) + 1)
            
        freq = note_to_freq(note)
        start_samp = int((bar * 16 + step) * SECONDS_PER_STEP * SAMPLE_RATE)
        dur = int(SECONDS_PER_STEP * 1.2 * SAMPLE_RATE)
        
        # Panning bounces back and forth
        pan_left = 0.7 if (step % 2 == 0) else 0.3
        pan_right = 1.0 - pan_left
        
        phase = 0.0
        for i in range(dur):
            idx = start_samp + i
            if idx >= TOTAL_SAMPLES: break
            t = i / SAMPLE_RATE
            env = math.exp(-22.0 * t)
            phase += 2.0 * math.pi * freq / SAMPLE_RATE
            val = osc_triangle(phase) * env * 0.16
            
            left_buffer[idx] += val * pan_left
            right_buffer[idx] += val * pan_right

# 4. LEAD MELODY SYNTHESIS (Bright, Catchy Neon Platformer Hook)
print("Synthesizing lead melody...")
# Melody format: (bar, step, note, duration_steps)
MELODY = [
    # Bar 0 (C)
    (0, 0, 'C5', 4), (0, 4, 'E5', 2), (0, 6, 'G5', 2), (0, 8, 'E5', 3), (0, 12, 'D5', 2), (0, 14, 'C5', 2),
    # Bar 1 (G)
    (1, 0, 'D5', 4), (1, 4, 'G5', 4), (1, 8, 'F5', 2), (1, 10, 'E5', 2), (1, 12, 'D5', 4),
    # Bar 2 (Am)
    (2, 0, 'C5', 4), (2, 4, 'E5', 2), (2, 6, 'A5', 2), (2, 8, 'G5', 4), (2, 12, 'E5', 2), (2, 14, 'D5', 2),
    # Bar 3 (F)
    (3, 0, 'C5', 3), (3, 4, 'D5', 2), (3, 6, 'E5', 2), (3, 8, 'D5', 8),
    
    # Bar 4 (C)
    (4, 0, 'C5', 4), (4, 4, 'E5', 2), (4, 6, 'G5', 2), (4, 8, 'C6', 4), (4, 12, 'B5', 2), (4, 14, 'A5', 2),
    # Bar 5 (Em)
    (5, 0, 'G5', 4), (5, 4, 'B5', 4), (5, 8, 'A5', 2), (5, 10, 'G5', 2), (5, 12, 'E5', 4),
    # Bar 6 (Am)
    (6, 0, 'A5', 2), (6, 2, 'B5', 2), (6, 4, 'C6', 2), (6, 6, 'B5', 2), (6, 8, 'A5', 4), (6, 12, 'G5', 2), (6, 14, 'E5', 2),
    # Bar 7 (F)
    (7, 0, 'F5', 4), (7, 4, 'G5', 2), (7, 6, 'A5', 2), (7, 8, 'G5', 8),
    
    # Bar 8 (Dm) - B Section
    (8, 0, 'D5', 4), (8, 4, 'F5', 2), (8, 6, 'A5', 2), (8, 8, 'D6', 4), (8, 12, 'C6', 2), (8, 14, 'A5', 2),
    # Bar 9 (G)
    (9, 0, 'B5', 4), (9, 4, 'D6', 4), (9, 8, 'C6', 2), (9, 10, 'B5', 2), (9, 12, 'G5', 4),
    # Bar 10 (Em)
    (10, 0, 'E5', 4), (10, 4, 'G5', 2), (10, 6, 'B5', 2), (10, 8, 'E6', 4), (10, 12, 'D6', 2), (10, 14, 'B5', 2),
    # Bar 11 (Am)
    (11, 0, 'C6', 4), (11, 4, 'E6', 4), (11, 8, 'D6', 2), (11, 10, 'C6', 2), (11, 12, 'A5', 4),
    
    # Bar 12 (Dm)
    (12, 0, 'F5', 4), (12, 4, 'A5', 2), (12, 6, 'D6', 2), (12, 8, 'C6', 3), (12, 12, 'A5', 2), (12, 14, 'F5', 2),
    # Bar 13 (F)
    (13, 0, 'A5', 4), (13, 4, 'C6', 2), (13, 6, 'F6', 2), (13, 8, 'E6', 4), (13, 12, 'D6', 2), (13, 14, 'C6', 2),
    # Bar 14 (G)
    (14, 0, 'D6', 4), (14, 4, 'G6', 4), (14, 8, 'F6', 2), (14, 10, 'E6', 2), (14, 12, 'D6', 4),
    # Bar 15 (G7 buildup)
    (15, 0, 'B5', 2), (15, 2, 'C6', 2), (15, 4, 'D6', 2), (15, 6, 'E6', 2), (15, 8, 'F6', 2), (15, 10, 'G6', 2), (15, 12, 'A6', 2), (15, 14, 'B6', 2)
]

for bar, step, note, dur_steps in MELODY:
    freq = note_to_freq(note)
    start_samp = int((bar * 16 + step) * SECONDS_PER_STEP * SAMPLE_RATE)
    dur_samp = int(dur_steps * SECONDS_PER_STEP * SAMPLE_RATE)
    release_samp = int(0.08 * SAMPLE_RATE)
    total_note_samp = dur_samp + release_samp
    
    phase = 0.0
    for i in range(total_note_samp):
        idx = start_samp + i
        if idx >= TOTAL_SAMPLES: break
        t = i / SAMPLE_RATE
        
        # Envelope: Attack 0.015s, Sustain, Release
        if i < int(0.015 * SAMPLE_RATE):
            env = i / (0.015 * SAMPLE_RATE)
        elif i < dur_samp:
            env = 1.0 - 0.15 * (i / dur_samp)
        else:
            rel_t = (i - dur_samp) / release_samp
            env = (1.0 - 0.15) * (1.0 - rel_t)
            
        # Vibrato (starts after 0.15s)
        vib = 0.0
        if t > 0.15:
            vib = math.sin(2.0 * math.pi * 5.5 * (t - 0.15)) * 0.018
            
        cur_freq = freq * (1.0 + vib)
        phase += 2.0 * math.pi * cur_freq / SAMPLE_RATE
        
        # Pulse wave (30% duty) + octave shimmer
        pulse = osc_square(phase, duty=0.3)
        sub = osc_saw(phase * 0.5) * 0.25
        val = (pulse * 0.75 + sub) * env * 0.28
        
        # Stereo delay / echo effect (feedback in buffer)
        left_buffer[idx] += val * 0.85
        right_buffer[idx] += val * 0.85
        
        # Add simple stereo delay echo (+3 16th notes)
        echo_idx = idx + int(3 * SECONDS_PER_STEP * SAMPLE_RATE)
        if echo_idx < TOTAL_SAMPLES:
            left_buffer[echo_idx] += val * 0.22
            right_buffer[echo_idx] += val * 0.12

# 5. MIXDOWN, SOFT CLIPPING & SEAMLESS LOOP CROSSFADE
print("Mastering and normalizing audio...")
# Loop crossfade: 1000 samples at start and end to guarantee seamless zero-crossing loop
CROSSFADE = 1024
for i in range(CROSSFADE):
    factor = i / CROSSFADE
    end_idx = TOTAL_SAMPLES - CROSSFADE + i
    # blend end into start
    left_buffer[i] = left_buffer[i] * factor + left_buffer[end_idx] * (1.0 - factor)
    right_buffer[i] = right_buffer[i] * factor + right_buffer[end_idx] * (1.0 - factor)

# Find peak
max_val = 0.0001
for i in range(TOTAL_SAMPLES):
    max_val = max(max_val, abs(left_buffer[i]), abs(right_buffer[i]))

print(f"Peak amplitude before normalization: {max_val:.3f}")
# Normalize to ~0.92
target_peak = 0.92
gain = target_peak / max_val

# Write WAV file
output_path = 'music/mu_tutorial.wav'
with wave.open(output_path, 'wb') as wav:
    wav.setnchannels(2)       # Stereo
    wav.setsampwidth(2)       # 16-bit
    wav.setframerate(SAMPLE_RATE)
    
    frames = bytearray()
    for i in range(TOTAL_SAMPLES):
        # Soft saturation / limiter
        l = left_buffer[i] * gain
        r = right_buffer[i] * gain
        l = max(-0.98, min(0.98, math.tanh(l)))
        r = max(-0.98, min(0.98, math.tanh(r)))
        
        int_l = int(l * 32767.0)
        int_r = int(r * 32767.0)
        frames.extend(struct.pack('<hh', int_l, int_r))
        
    wav.writeframes(frames)

print(f"Successfully generated: {output_path} ({len(frames)} bytes)")
