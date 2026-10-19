import math
import struct
import wave
import random
import os
import shutil

SAMPLE_RATE = 44100
BPM = 168
BEATS_PER_BAR = 4
STEPS_PER_BEAT = 4  # 16th notes
TOTAL_BARS = 32

TOTAL_STEPS = TOTAL_BARS * BEATS_PER_BAR * STEPS_PER_BEAT  # 512 steps
SECONDS_PER_BEAT = 60.0 / BPM
SECONDS_PER_STEP = SECONDS_PER_BEAT / STEPS_PER_BEAT
TOTAL_SECONDS = TOTAL_STEPS * SECONDS_PER_STEP
TOTAL_SAMPLES = int(TOTAL_SECONDS * SAMPLE_RATE)

print(f"=== Composing 'BREAKING NEWS' Escape Theme ===")
print(f"Structure: {TOTAL_BARS} Bars at {BPM} BPM ({TOTAL_SECONDS:.2f} seconds, {TOTAL_SAMPLES} samples)")

# ------------------------------------------------------------------------------
# 1. EXTRACT REAL PUNCHY SAMPLED DRUMS FROM TUTORIAL TRACK
# ------------------------------------------------------------------------------
print("Extracting drum samples from source material...")
src_wav = 'music/mu_tutorial.wav'
with wave.open(src_wav, 'rb') as w:
    src_sr = w.getframerate()
    src_frames = w.readframes(src_sr * 8)
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

# Punchy kick and snare
kick_l, kick_r = extract_sample(2.305, 0.25, fade_out=0.04)
snare_l, snare_r = extract_sample(2.665, 0.24, fade_out=0.05)
ghost_l, ghost_r = extract_sample(2.850, 0.12, fade_out=0.03)

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
# 3. BREAKING NEWS EMERGENCY SIREN & BROADCAST ALERTS
# ------------------------------------------------------------------------------
print("Synthesizing urgent Breaking News emergency siren & broadcast alarms...")

# Emergency news broadcast beeps (pulsing alert at start of sections: bar 0 and bar 16)
def trigger_news_alert(start_samp, count=4):
    beep_len = int(0.045 * SAMPLE_RATE)
    gap_len = int(0.035 * SAMPLE_RATE)
    for b in range(count):
        b_start = start_samp + b * (beep_len + gap_len)
        for i in range(beep_len):
            idx = b_start + i
            if idx >= TOTAL_SAMPLES: break
            t = i / SAMPLE_RATE
            # Dual alert tones (1046 Hz C6 + 1318 Hz E6)
            tone = (math.sin(2 * math.pi * 1046.5 * t) + 0.8 * math.sin(2 * math.pi * 1318.5 * t)) * 0.18
            env = math.sin(math.pi * (i / beep_len))
            left_buffer[idx] += tone * env
            right_buffer[idx] += tone * env

trigger_news_alert(0, count=6)
trigger_news_alert(int(16 * 16 * SECONDS_PER_STEP * SAMPLE_RATE), count=4)

# Emergency Doppler Siren Hook across specific bars
# Bars 0-3 (Intro siren), Bars 8-11 (Lead siren), Bars 16-19 (Climax siren), Bars 28-31 (Panic finale)
SIREN_BARS = list(range(0, 4)) + list(range(8, 12)) + list(range(16, 20)) + list(range(28, 32))
for bar in SIREN_BARS:
    b_start = int(bar * 16 * SECONDS_PER_STEP * SAMPLE_RATE)
    b_len = int(16 * SECONDS_PER_STEP * SAMPLE_RATE)
    for i in range(b_len):
        idx = b_start + i
        if idx >= TOTAL_SAMPLES: break
        t = i / SAMPLE_RATE
        # Siren oscillates between 850Hz and 1400Hz at 2.8Hz cycle
        siren_rate = 3.2 if bar >= 28 else 2.6
        freq = 1050.0 + 380.0 * math.sin(2 * math.pi * siren_rate * t)
        
        # Dual-detuned oscillator for thick emergency alarm
        s1 = math.sin(2 * math.pi * freq * t)
        s2 = math.sin(2 * math.pi * (freq * 1.008) * t)
        # Panning sweep
        pan = 0.5 + 0.4 * math.sin(2 * math.pi * 1.5 * t)
        vol = 0.11 if bar < 28 else 0.16
        
        sample = (s1 + s2) * 0.5 * vol
        left_buffer[idx] += sample * (1.0 - pan)
        right_buffer[idx] += sample * pan

# ------------------------------------------------------------------------------
# 4. HIGH-OCTANE BREAKBEAT DRUM ARRANGEMENT (168 BPM)
# ------------------------------------------------------------------------------
print("Arranging high-speed frantic breakbeats and crash cymbals...")

def trigger_drum(start_samp, smp_l, smp_r, vol=1.0):
    for i in range(len(smp_l)):
        idx = start_samp + i
        if idx >= TOTAL_SAMPLES: break
        left_buffer[idx] += smp_l[i] * vol
        right_buffer[idx] += smp_r[i] * vol

def trigger_hat(start_samp, is_open=False, vol=0.22):
    dur = int((0.15 if is_open else 0.04) * SAMPLE_RATE)
    for i in range(dur):
        idx = start_samp + i
        if idx >= TOTAL_SAMPLES: break
        t = i / SAMPLE_RATE
        decay = 22.0 if is_open else 75.0
        n = (random.random() * 2 - 1) * math.exp(-decay * t) * vol
        left_buffer[idx] += n * 0.85
        right_buffer[idx] += n * 1.15

def trigger_crash(start_samp, vol=0.5):
    dur = int(1.8 * SAMPLE_RATE)
    for i in range(dur):
        idx = start_samp + i
        if idx >= TOTAL_SAMPLES: break
        t = i / SAMPLE_RATE
        m = (math.sin(2*math.pi*480*t) + math.sin(2*math.pi*720*t) + math.sin(2*math.pi*960*t) + math.sin(2*math.pi*1240*t)) * 0.22
        n = (random.random() * 2 - 1) * 0.78
        sample = (m + n) * math.exp(-2.5 * t) * vol
        left_buffer[idx] += sample * 0.95
        right_buffer[idx] += sample * 1.05

for bar in range(TOTAL_BARS):
    base_step = bar * 16
    is_buildup_bar = (bar == 15 or bar == 31)
    
    for step in range(16):
        cur_step = base_step + step
        start_samp = int(cur_step * SECONDS_PER_STEP * SAMPLE_RATE)
        
        # Crash cymbals on sectional drops
        if step == 0 and (bar in [0, 8, 16, 24]):
            trigger_crash(start_samp, 0.55)
            
        if is_buildup_bar:
            # Massive Snare Roll Crescendo
            roll_subdiv = 2  # 32nd notes in last half of bar
            sub_count = 2 if step >= 8 else 1
            for sub in range(sub_count):
                sub_samp = start_samp + int(sub * (SECONDS_PER_STEP / sub_count) * SAMPLE_RATE)
                roll_vol = 0.5 + 0.7 * (step / 16.0)
                trigger_drum(sub_samp, snare_l, snare_r, roll_vol)
            if step % 4 == 0:
                trigger_drum(start_samp, kick_l, kick_r, 1.1)
            trigger_hat(start_samp, is_open=(step % 2 == 1), vol=0.25)
            continue
            
        # Standard Escape Breakbeat Pattern (Fast, Driving, Syncopated)
        # Kicks: 0, 3 (syncopation), 6, 10, 14
        if step in [0, 6, 10]:
            trigger_drum(start_samp, kick_l, kick_r, 1.15)
        elif step in [3, 14]:
            trigger_drum(start_samp, kick_l, kick_r, 0.95)
            
        # Snares: Hard hits on 4 and 12 (beats 2 and 4)
        if step in [4, 12]:
            trigger_drum(start_samp, snare_l, snare_r, 1.25)
        elif step in [7, 15]:
            # Ghost snares
            trigger_drum(start_samp, ghost_l, ghost_r, 0.65)
        elif step in [11] and (bar % 2 == 1):
            trigger_drum(start_samp, ghost_l, ghost_r, 0.55)
            
        # Hi-hats: 16th notes with open hats on upbeats
        if step in [2, 6, 10, 14]:
            trigger_hat(start_samp, is_open=True, vol=0.26)
        else:
            acc = 0.28 if (step % 4 == 0) else 0.18
            trigger_hat(start_samp, is_open=False, vol=acc)

# ------------------------------------------------------------------------------
# 5. AGGRESSIVE SLAP BASSLINE (D Minor Escape Funk)
# ------------------------------------------------------------------------------
print("Synthesizing aggressive slap bass with octave popping...")

# 32-Bar Harmonic Structure in D Minor:
# Bars 0-3: Dm -> Dm -> Dm -> C - C# (Tense groove)
# Bars 4-7: Dm -> Bb -> C -> A7 (Classic Pizza Time progression!)
# Bars 8-11: Dm -> Bb -> Gm -> A7 (Sprint!)
# Bars 12-15: Bb -> C -> Dm -> A7alt (Crescendo to drop)
# Bars 16-19: Dm -> F -> C -> G (Heroic Escape!)
# Bars 20-23: Bb -> C -> Dm -> A7
# Bars 24-27: Gm -> Am -> Bb -> C (Rising panic)
# Bars 28-31: C#dim -> Dm -> Eb -> A7alt (Chromatic countdown finale)

BASS_PATTERNS = {
    'Dm_Groove': [
        ('D1', 2), ('-', 1), ('D2', 1), ('-', 1), ('D1', 2), ('-', 1),
        ('F1', 2), ('G1', 2), ('Ab1', 1), ('A1', 2), ('C2', 2)
    ],
    'Dm_Run': [
        ('D1', 2), ('-', 1), ('D2', 2), ('-', 1), ('D1', 2),
        ('C2', 1), ('D2', 1), ('F2', 2), ('E2', 2), ('C2', 2)
    ],
    'Bb_Chug': [
        ('Bb0', 2), ('-', 1), ('Bb1', 2), ('-', 1), ('Bb0', 2),
        ('A0', 1), ('Bb0', 1), ('D1', 2), ('F1', 2), ('Bb1', 2)
    ],
    'C_Chug': [
        ('C1', 2), ('-', 1), ('C2', 2), ('-', 1), ('C1', 2),
        ('B0', 1), ('C1', 1), ('E1', 2), ('G1', 2), ('C2', 2)
    ],
    'A7_Punch': [
        ('A0', 2), ('-', 1), ('A1', 2), ('-', 1), ('A0', 2),
        ('G1', 2), ('A1', 2), ('C#2', 2), ('E2', 2)
    ],
    'Gm_Chug': [
        ('G0', 2), ('-', 1), ('G1', 2), ('-', 1), ('G0', 2),
        ('F1', 2), ('G1', 2), ('Bb1', 2), ('D2', 2)
    ],
    'F_Chug': [
        ('F1', 2), ('-', 1), ('F2', 2), ('-', 1), ('F1', 2),
        ('E2', 2), ('F2', 2), ('A1', 2), ('C2', 2)
    ],
    'Panic_Climb': [
        ('G0', 2), ('A0', 2), ('Bb0', 2), ('B0', 2),
        ('C1', 2), ('C#1', 2), ('D1', 2), ('Eb1', 2)
    ],
    'Final_Turn': [
        ('Eb1', 2), ('E1', 2), ('F1', 2), ('F#1', 2),
        ('G1', 2), ('Ab1', 2), ('A1', 2), ('C#2', 2)
    ]
}

BAR_TO_BASS = [
    'Dm_Groove', 'Dm_Run', 'Dm_Groove', 'Dm_Run',
    'Dm_Groove', 'Bb_Chug', 'C_Chug', 'A7_Punch',
    'Dm_Groove', 'Bb_Chug', 'Gm_Chug', 'A7_Punch',
    'Bb_Chug', 'C_Chug', 'Dm_Run', 'A7_Punch',
    'Dm_Groove', 'F_Chug', 'C_Chug', 'Gm_Chug',
    'Bb_Chug', 'C_Chug', 'Dm_Run', 'A7_Punch',
    'Gm_Chug', 'F_Chug', 'Bb_Chug', 'C_Chug',
    'Panic_Climb', 'Panic_Climb', 'Final_Turn', 'Final_Turn'
]

for bar in range(TOTAL_BARS):
    pattern_name = BAR_TO_BASS[bar]
    pattern = BASS_PATTERNS[pattern_name]
    step_offset = 0
    for note, dur_steps in pattern:
        if note != '-':
            f0 = note_to_freq(note)
            cur_step = bar * 16 + step_offset
            start_samp = int(cur_step * SECONDS_PER_STEP * SAMPLE_RATE)
            dur_samp = int(dur_steps * SECONDS_PER_STEP * SAMPLE_RATE) + int(0.04 * SAMPLE_RATE)
            
            for i in range(dur_samp):
                idx = start_samp + i
                if idx >= TOTAL_SAMPLES: break
                t = i / SAMPLE_RATE
                
                # Punchy slap harmonics with overdrive
                h1 = math.sin(2 * math.pi * f0 * t) * math.exp(-8.0 * t)
                h2 = math.sin(2 * math.pi * 2 * f0 * t) * 0.75 * math.exp(-12.0 * t)
                h3 = math.sin(2 * math.pi * 3 * f0 * t) * 0.45 * math.exp(-18.0 * t)
                h4 = math.sin(2 * math.pi * 4 * f0 * t) * 0.28 * math.exp(-24.0 * t)
                
                # Slap thumb pop click transient
                click = math.exp(-110.0 * t) * math.sin(2 * math.pi * 850 * t) * 0.45
                
                raw = (h1 + h2 + h3 + h4 + click) * 0.42
                # Overdrive saturation for aggressive grit
                sample = math.tanh(raw * 1.35) * 0.42
                
                left_buffer[idx] += sample
                right_buffer[idx] += sample
                
        step_offset += dur_steps

# ------------------------------------------------------------------------------
# 6. PIERCING BIG-BAND BRASS STABS ("BREAKING NEWS" HITS)
# ------------------------------------------------------------------------------
print("Synthesizing cartoon big-band horn stabs & falls...")

# Rapid syncopated brass stabs on key punch points
BRASS_SECTIONS = [
    # Bar 0 (Intro punches: hits on 4, 7, 10, 14)
    (0, 4, ['D4', 'F4', 'A4', 'D5'], 2, False),
    (0, 7, ['F4', 'A4', 'C5', 'F5'], 2, False),
    (0, 10, ['A4', 'C5', 'E5', 'A5'], 3, True),
    (0, 14, ['C5', 'E5', 'G5', 'C6'], 2, False),

    # Bar 1
    (1, 4, ['D4', 'F4', 'A4', 'D5'], 2, False),
    (1, 10, ['F4', 'A4', 'D5', 'F5'], 3, True),

    # Bar 4-7 (Pizza Time theme stabs)
    (4, 4, ['D4', 'F4', 'A4', 'D5'], 2, False),
    (4, 10, ['F4', 'A4', 'D5', 'F5'], 3, True),
    (5, 4, ['D4', 'F4', 'Bb4', 'D5'], 2, False),
    (5, 10, ['F4', 'Bb4', 'D5', 'F5'], 3, True),
    (6, 4, ['E4', 'G4', 'C5', 'E5'], 2, False),
    (6, 10, ['G4', 'C5', 'E5', 'G5'], 3, True),
    (7, 4, ['E4', 'G4', 'A4', 'C#5'], 2, False),
    (7, 8, ['G4', 'A4', 'C#5', 'E5'], 2, False),
    (7, 12, ['A4', 'C#5', 'E5', 'A5'], 3, True),

    # Bar 12-15 (Ascending horn power chords)
    (12, 4, ['D4', 'F4', 'Bb4', 'D5'], 2, False),
    (12, 10, ['F4', 'Bb4', 'D5', 'F5'], 3, False),
    (13, 4, ['E4', 'G4', 'C5', 'E5'], 2, False),
    (13, 10, ['G4', 'C5', 'E5', 'G5'], 3, False),
    (14, 4, ['F4', 'A4', 'D5', 'F5'], 2, False),
    (14, 10, ['A4', 'D5', 'F5', 'A5'], 3, True),
    (15, 0, ['G4', 'C#5', 'E5', 'G5'], 2, False),
    (15, 4, ['A4', 'C#5', 'E5', 'A5'], 2, False),
    (15, 8, ['C#5', 'E5', 'G5', 'C#6'], 3, False),
    (15, 12, ['E5', 'G5', 'A5', 'E6'], 4, True),

    # Bar 20-23
    (20, 4, ['D4', 'F4', 'Bb4', 'D5'], 2, False),
    (20, 10, ['F4', 'Bb4', 'D5', 'F5'], 3, True),
    (21, 4, ['E4', 'G4', 'C5', 'E5'], 2, False),
    (21, 10, ['G4', 'C5', 'E5', 'G5'], 3, True),
    (22, 4, ['F4', 'A4', 'D5', 'F5'], 2, False),
    (22, 10, ['A4', 'D5', 'F5', 'A5'], 3, True),
    (23, 4, ['G4', 'A4', 'C#5', 'E5'], 2, False),
    (23, 10, ['A4', 'C#5', 'E5', 'A5'], 3, True),

    # Bar 28-31 (Dramatic chromatic horn builds)
    (28, 4, ['G4', 'Bb4', 'D5', 'G5'], 2, False),
    (28, 10, ['A4', 'C5', 'E5', 'A5'], 3, False),
    (29, 4, ['Bb4', 'D5', 'F5', 'Bb5'], 2, False),
    (29, 10, ['B4', 'D#5', 'F#5', 'B5'], 3, False),
    (30, 4, ['C5', 'E5', 'G5', 'C6'], 2, False),
    (30, 10, ['C#5', 'E5', 'G5', 'C#6'], 3, False),
    (31, 0, ['D5', 'F5', 'A5', 'D6'], 2, False),
    (31, 4, ['D#5', 'F#5', 'A5', 'D#6'], 2, False),
    (31, 8, ['E5', 'G#5', 'B5', 'E6'], 3, False),
    (31, 12, ['A5', 'C#6', 'E6', 'A6'], 4, True)
]

for bar, step, chord, dur_steps, is_fall in BRASS_SECTIONS:
    start_samp = int((bar * 16 + step) * SECONDS_PER_STEP * SAMPLE_RATE)
    dur_samp = int(dur_steps * SECONDS_PER_STEP * SAMPLE_RATE) + int(0.06 * SAMPLE_RATE)
    
    for note in chord:
        base_f = note_to_freq(note)
        p1 = random.random() * 2 * math.pi
        p2 = random.random() * 2 * math.pi
        
        for i in range(dur_samp):
            idx = start_samp + i
            if idx >= TOTAL_SAMPLES: break
            t = i / SAMPLE_RATE
            
            # Fast punchy attack
            if t < 0.012:
                env = t / 0.012
            else:
                env = math.exp(-5.8 * (t - 0.012))
                
            cur_f = base_f
            if is_fall and t > 0.08:
                cur_f *= math.exp(-8.5 * (t - 0.08)) # Cartoon pitch fall!
                
            p1 += 2 * math.pi * cur_f / SAMPLE_RATE
            p2 += 2 * math.pi * (cur_f * 1.005) / SAMPLE_RATE
            
            # Saw + square horn brass synthesis
            b1 = 2.0 * ((p1 / (2*math.pi)) % 1.0) - 1.0
            b2 = 2.0 * ((p2 / (2*math.pi)) % 1.0) - 1.0
            sample = (b1 + b2) * 0.5 * env * 0.13
            
            left_buffer[idx] += sample * 0.95
            right_buffer[idx] += sample * 0.95

# ------------------------------------------------------------------------------
# 7. FRANTIC PIZZA TIME / BREAKING NEWS LEAD MELODY
# ------------------------------------------------------------------------------
print("Synthesizing iconic high-speed escape lead melody...")

# Iconic, adrenaline-fueled, catchy escape theme
# Part A (Bars 0-7): The Alarm & Danger motif
# Part B (Bars 8-15): Mach 3 Sprint theme
# Part C (Bars 16-23): Heroic Flight theme
# Part D (Bars 24-31): Countdown Panic & Resolution
ESCAPE_MELODY = [
    # Bars 0-3 (Urgent alarm motif: D5 -> F5 -> A5 -> D6 -> C6 -> A5)
    (0, 0, 'D5', 2), (0, 2, 'F5', 2), (0, 4, 'A5', 3), (0, 7, 'C6', 2), (0, 9, 'D6', 3), (0, 12, 'C6', 2), (0, 14, 'A5', 2),
    (1, 0, 'F5', 3), (1, 3, 'G5', 2), (1, 5, 'Ab5', 2), (1, 7, 'A5', 4), (1, 11, 'F5', 2), (1, 13, 'D5', 3),
    (2, 0, 'D5', 2), (2, 2, 'F5', 2), (2, 4, 'A5', 3), (2, 7, 'C6', 2), (2, 9, 'D6', 3), (2, 12, 'F6', 2), (2, 14, 'E6', 2),
    (3, 0, 'D6', 3), (3, 3, 'C6', 2), (3, 5, 'A5', 3), (3, 8, 'G5', 2), (3, 10, 'A5', 6),

    # Bars 4-7 (The Classic Pizza Time Escape Gallop)
    (4, 0, 'D5', 2), (4, 2, 'F5', 2), (4, 4, 'A5', 4), (4, 8, 'D6', 3), (4, 11, 'C6', 2), (4, 13, 'A5', 3),
    (5, 0, 'Bb5', 3), (5, 3, 'D6', 2), (5, 5, 'F6', 4), (5, 9, 'E6', 2), (5, 11, 'D6', 2), (5, 13, 'C6', 3),
    (6, 0, 'G5', 2), (6, 2, 'C6', 2), (6, 4, 'E6', 4), (6, 8, 'D6', 2), (6, 10, 'C6', 2), (6, 12, 'B5', 4),
    (7, 0, 'A5', 2), (7, 2, 'C#6', 2), (7, 4, 'E6', 4), (7, 8, 'G6', 3), (7, 11, 'F6', 2), (7, 13, 'E6', 3),

    # Bars 8-11 (Mach 3 Sprint - High Velocity!)
    (8, 0, 'F6', 3), (8, 3, 'D6', 2), (8, 5, 'A5', 3), (8, 8, 'D6', 2), (8, 10, 'F6', 4), (8, 14, 'G6', 2),
    (9, 0, 'F6', 2), (9, 2, 'D6', 2), (9, 4, 'Bb5', 4), (9, 8, 'D6', 2), (9, 10, 'F6', 4), (9, 14, 'A6', 2),
    (10, 0, 'G6', 2), (10, 2, 'E6', 2), (10, 4, 'C6', 4), (10, 8, 'E6', 2), (10, 10, 'G6', 4), (10, 14, 'Bb6', 2),
    (11, 0, 'A6', 3), (11, 3, 'G6', 2), (11, 5, 'F6', 2), (11, 7, 'E6', 2), (11, 9, 'D6', 2), (11, 11, 'C#6', 2), (11, 13, 'E6', 3),

    # Bars 12-15 (Climax to Breakout Drop)
    (12, 0, 'D6', 3), (12, 3, 'F6', 2), (12, 5, 'Bb6', 4), (12, 9, 'A6', 2), (12, 11, 'G6', 2), (12, 13, 'F6', 3),
    (13, 0, 'E6', 3), (13, 3, 'G6', 2), (13, 5, 'C7', 4), (13, 9, 'Bb6', 2), (13, 11, 'A6', 2), (13, 13, 'G6', 3),
    (14, 0, 'F6', 3), (14, 3, 'A6', 2), (14, 5, 'D7', 4), (14, 9, 'C7', 2), (14, 11, 'Bb6', 2), (14, 13, 'A6', 3),
    (15, 0, 'A6', 2), (15, 2, 'Bb6', 2), (15, 4, 'B6', 2), (15, 6, 'C7', 2), (15, 8, 'C#7', 3), (15, 11, 'D7', 5),

    # Bars 16-19 (Heroic Sprint Flight Section)
    (16, 0, 'D6', 2), (16, 2, 'F6', 2), (16, 4, 'A6', 4), (16, 8, 'D7', 4), (16, 12, 'C7', 4),
    (17, 0, 'A6', 3), (17, 3, 'F6', 2), (17, 5, 'D6', 3), (17, 8, 'F6', 2), (17, 10, 'A6', 6),
    (18, 0, 'G6', 2), (18, 2, 'E6', 2), (18, 4, 'C6', 4), (18, 8, 'E6', 4), (18, 12, 'G6', 4),
    (19, 0, 'F6', 3), (19, 3, 'D6', 2), (19, 5, 'B5', 3), (19, 8, 'D6', 2), (19, 10, 'F6', 6),

    # Bars 20-23 (Blazing Counterpoint)
    (20, 0, 'Bb5', 2), (20, 2, 'D6', 2), (20, 4, 'F6', 4), (20, 8, 'Bb6', 3), (20, 11, 'A6', 2), (20, 13, 'G6', 3),
    (21, 0, 'C6', 2), (21, 2, 'E6', 2), (21, 4, 'G6', 4), (21, 8, 'C7', 3), (21, 11, 'Bb6', 2), (21, 13, 'A6', 3),
    (22, 0, 'D6', 2), (22, 2, 'F6', 2), (22, 4, 'A6', 4), (22, 8, 'D7', 3), (22, 11, 'C7', 2), (22, 13, 'Bb6', 3),
    (23, 0, 'A6', 3), (23, 3, 'C#7', 2), (23, 5, 'E7', 4), (23, 9, 'G7', 3), (23, 12, 'A7', 4),

    # Bars 24-27 (Urgent Countdown Panic - Fast Staccato 16ths)
    (24, 0, 'G6', 2), (24, 2, 'Bb6', 2), (24, 4, 'D7', 2), (24, 6, 'G6', 2), (24, 8, 'Bb6', 2), (24, 10, 'D7', 2), (24, 12, 'G6', 2), (24, 14, 'Bb6', 2),
    (25, 0, 'A6', 2), (25, 2, 'C7', 2), (25, 4, 'E7', 2), (25, 6, 'A6', 2), (25, 8, 'C7', 2), (25, 10, 'E7', 2), (25, 12, 'A6', 2), (25, 14, 'C7', 2),
    (26, 0, 'Bb6', 2), (26, 2, 'D7', 2), (26, 4, 'F7', 2), (26, 6, 'Bb6', 2), (26, 8, 'D7', 2), (26, 10, 'F7', 2), (26, 12, 'Bb6', 2), (26, 14, 'D7', 2),
    (27, 0, 'C7', 2), (27, 2, 'E7', 2), (27, 4, 'G7', 2), (27, 6, 'C7', 2), (27, 8, 'E7', 2), (27, 10, 'G7', 2), (27, 12, 'C7', 2), (27, 14, 'E7', 2),

    # Bars 28-31 (Chromatic Finale & Drop Resolution)
    (28, 0, 'C#7', 2), (28, 2, 'E7', 2), (28, 4, 'G7', 2), (28, 6, 'A#7', 2), (28, 8, 'G7', 2), (28, 10, 'E7', 2), (28, 12, 'C#7', 4),
    (29, 0, 'D7', 2), (29, 2, 'F7', 2), (29, 4, 'A7', 2), (29, 6, 'C8', 2), (29, 8, 'A7', 2), (29, 10, 'F7', 2), (29, 12, 'D7', 4),
    (30, 0, 'Eb7', 2), (30, 2, 'G7', 2), (30, 4, 'Bb7', 2), (30, 6, 'Db8', 2), (30, 8, 'Bb7', 2), (30, 10, 'G7', 2), (30, 12, 'Eb7', 4),
    (31, 0, 'E7', 1), (31, 1, 'F7', 1), (31, 2, 'F#7', 1), (31, 3, 'G7', 1),
    (31, 4, 'G#7', 1), (31, 5, 'A7', 1), (31, 6, 'A#7', 1), (31, 7, 'B7', 1),
    (31, 8, 'C8', 2), (31, 10, 'C#8', 2), (31, 12, 'D8', 4)
]

for bar, step, note, dur_steps in ESCAPE_MELODY:
    base_f = note_to_freq(note)
    start_samp = int((bar * 16 + step) * SECONDS_PER_STEP * SAMPLE_RATE)
    dur_samp = int(dur_steps * SECONDS_PER_STEP * SAMPLE_RATE)
    rel_samp = int(0.05 * SAMPLE_RATE)
    
    phase = 0.0
    for i in range(dur_samp + rel_samp):
        idx = start_samp + i
        if idx >= TOTAL_SAMPLES: break
        t = i / SAMPLE_RATE
        
        # Punchy, bright synth lead envelope
        if i < int(0.01 * SAMPLE_RATE):
            env = i / (0.01 * SAMPLE_RATE)
        elif i < dur_samp:
            env = 1.0 - 0.1 * (i / dur_samp)
        else:
            env = 0.9 * ((dur_samp + rel_samp - i) / rel_samp)
            
        # Vibrato
        vib = 0.0
        if t > 0.06:
            vib = math.sin(2 * math.pi * 6.5 * t) * (base_f * 0.016)
            
        phase += 2 * math.pi * (base_f + vib) / SAMPLE_RATE
        # Bright square + saw blend for that energetic Pizza Tower / Bacon2gether lead
        saw = 2.0 * ((phase / (2*math.pi)) % 1.0) - 1.0
        sq = 1.0 if (phase % (2*math.pi)) < math.pi else -1.0
        sample = (saw * 0.6 + sq * 0.4) * env * 0.22
        
        left_buffer[idx] += sample * 0.9
        right_buffer[idx] += sample * 0.9
        
        # Tape echo delay (3 sixteenth notes)
        echo = idx + int(3 * SECONDS_PER_STEP * SAMPLE_RATE)
        if echo < TOTAL_SAMPLES:
            left_buffer[echo] += sample * 0.18
            right_buffer[echo] += sample * 0.12

# ------------------------------------------------------------------------------
# 8. MASTERING & SEAMLESS 32-BAR LOOP CROSSFADE
# ------------------------------------------------------------------------------
print("Mastering and normalizing audio with seamless loop crossfade...")
CROSSFADE = 1500
for i in range(CROSSFADE):
    factor = i / CROSSFADE
    end_idx = TOTAL_SAMPLES - CROSSFADE + i
    left_buffer[i] = left_buffer[i] * factor + left_buffer[end_idx] * (1.0 - factor)
    right_buffer[i] = right_buffer[i] * factor + right_buffer[end_idx] * (1.0 - factor)

max_val = max(max(abs(x) for x in left_buffer), max(abs(x) for x in right_buffer), 0.001)
print(f"Peak amplitude before normalization: {max_val:.3f}")
gain = 0.95 / max_val

output_wav = 'music/mu_escape.wav'
with wave.open(output_wav, 'wb') as wav:
    wav.setnchannels(2)
    wav.setsampwidth(2)
    wav.setframerate(SAMPLE_RATE)
    
    frames = bytearray()
    for i in range(TOTAL_SAMPLES):
        l = left_buffer[i] * gain
        r = right_buffer[i] * gain
        # Analog warm tape limiter
        l = max(-0.98, min(0.98, math.tanh(l * 1.08)))
        r = max(-0.98, min(0.98, math.tanh(r * 1.08)))
        
        int_l = int(l * 32767.0)
        int_r = int(r * 32767.0)
        frames.extend(struct.pack('<hh', int_l, int_r))
        
    wav.writeframes(frames)

# Also copy as mu_breakingnews.wav so either name works!
shutil.copyfile('music/mu_escape.wav', 'music/mu_breakingnews.wav')

print(f"Successfully generated:")
print(f"  1. {output_wav} ({len(frames)} bytes, {TOTAL_SECONDS:.2f}s, {BPM} BPM)")
print(f"  2. music/mu_breakingnews.wav ({len(frames)} bytes)")
