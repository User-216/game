import math
import struct
import wave
import random
import os
import shutil
import time

t_start = time.time()

SAMPLE_RATE = 44100
BPM = 168
BEATS_PER_BAR = 4
STEPS_PER_BEAT = 4  # 16th notes
TOTAL_BARS = 140    # 140 bars * (4 * 60 / 168) = exactly 200.0 seconds = 3 minutes 20 seconds!

TOTAL_STEPS = TOTAL_BARS * BEATS_PER_BAR * STEPS_PER_BEAT  # 2240 steps
SECONDS_PER_BEAT = 60.0 / BPM
SECONDS_PER_STEP = SECONDS_PER_BEAT / STEPS_PER_BEAT
TOTAL_SECONDS = TOTAL_STEPS * SECONDS_PER_STEP  # 200.0s
TOTAL_SAMPLES = int(TOTAL_SECONDS * SAMPLE_RATE)

print(f"=== Composing 3:20 Pizza Tower Style Escape Masterpiece ===")
print(f"BPM: {BPM} | Total Bars: {TOTAL_BARS} | Total Duration: {TOTAL_SECONDS:.2f}s ({TOTAL_SECONDS/60:.2f} min) | Samples: {TOTAL_SAMPLES}")

# ------------------------------------------------------------------------------
# 1. EXTRACT REAL PUNCHY SAMPLED DRUMS FROM SOURCE MATERIAL
# ------------------------------------------------------------------------------
print("Extracting acoustic breakbeat drum samples...")
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

# Punchy kick, snappy snare, ghost snare
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
# 3. EMERGENCY ALARM & SIREN HOOKS (Pizza Time Alert)
# ------------------------------------------------------------------------------
print("Synthesizing emergency siren sweeps and broadcast alerts...")

def trigger_alert_beeps(start_samp, count=4):
    beep_len = int(0.045 * SAMPLE_RATE)
    gap_len = int(0.035 * SAMPLE_RATE)
    for b in range(count):
        b_start = start_samp + b * (beep_len + gap_len)
        for i in range(beep_len):
            idx = b_start + i
            if idx >= TOTAL_SAMPLES: break
            t = i / SAMPLE_RATE
            tone = (math.sin(2 * math.pi * 1046.5 * t) + 0.8 * math.sin(2 * math.pi * 1318.5 * t)) * 0.16
            env = math.sin(math.pi * (i / beep_len))
            left_buffer[idx] += tone * env
            right_buffer[idx] += tone * env

# Alert beeps at major section entrances: Bar 0, Bar 32, Bar 64, Bar 96, Bar 128
for alert_bar in [0, 32, 64, 96, 128]:
    trigger_alert_beeps(int(alert_bar * 16 * SECONDS_PER_STEP * SAMPLE_RATE), count=4)

# Doppler siren in energetic sections
SIREN_BAR_RANGES = [
    (0, 4, 2.5, 0.10),
    (16, 20, 2.8, 0.11),
    (32, 36, 3.0, 0.12),
    (64, 72, 3.2, 0.13),
    (96, 112, 3.5, 0.15),
    (124, 140, 4.0, 0.17)
]
for start_bar, end_bar, rate, vol in SIREN_BAR_RANGES:
    b_start = int(start_bar * 16 * SECONDS_PER_STEP * SAMPLE_RATE)
    b_len = int((end_bar - start_bar) * 16 * SECONDS_PER_STEP * SAMPLE_RATE)
    for i in range(b_len):
        idx = b_start + i
        if idx >= TOTAL_SAMPLES: break
        t = i / SAMPLE_RATE
        freq = 1000.0 + 380.0 * math.sin(2 * math.pi * rate * t)
        s1 = math.sin(2 * math.pi * freq * t)
        s2 = math.sin(2 * math.pi * (freq * 1.008) * t)
        pan = 0.5 + 0.4 * math.sin(2 * math.pi * 1.4 * t)
        sample = (s1 + s2) * 0.5 * vol
        left_buffer[idx] += sample * (1.0 - pan)
        right_buffer[idx] += sample * pan

# ------------------------------------------------------------------------------
# 4. HIGH-VELOCITY BREAKBEAT DRUM TRACK (168 BPM)
# ------------------------------------------------------------------------------
print("Arranging 140 bars of dynamic Pizza Tower breakbeats & fills...")

def trigger_drum(start_samp, smp_l, smp_r, vol=1.0):
    for i in range(len(smp_l)):
        idx = start_samp + i
        if idx >= TOTAL_SAMPLES: break
        left_buffer[idx] += smp_l[i] * vol
        right_buffer[idx] += smp_r[i] * vol

def trigger_hat(start_samp, is_open=False, vol=0.22):
    dur = int((0.15 if is_open else 0.04) * SAMPLE_RATE)
    decay = 24.0 if is_open else 75.0
    for i in range(dur):
        idx = start_samp + i
        if idx >= TOTAL_SAMPLES: break
        t = i / SAMPLE_RATE
        n = (random.random() * 2 - 1) * math.exp(-decay * t) * vol
        left_buffer[idx] += n * 0.85
        right_buffer[idx] += n * 1.15

def trigger_crash(start_samp, vol=0.52):
    dur = int(1.8 * SAMPLE_RATE)
    for i in range(dur):
        idx = start_samp + i
        if idx >= TOTAL_SAMPLES: break
        t = i / SAMPLE_RATE
        m = (math.sin(2*math.pi*480*t) + math.sin(2*math.pi*720*t) + math.sin(2*math.pi*960*t) + math.sin(2*math.pi*1240*t)) * 0.22
        n = (random.random() * 2 - 1) * 0.78
        sample = (m + n) * math.exp(-2.4 * t) * vol
        left_buffer[idx] += sample * 0.95
        right_buffer[idx] += sample * 1.05

for bar in range(TOTAL_BARS):
    base_step = bar * 16
    is_buildup_bar = (bar in [15, 31, 47, 63, 79, 95, 111, 127, 138, 139])
    is_breakdown_section = (48 <= bar < 64)
    
    for step in range(16):
        cur_step = base_step + step
        start_samp = int(cur_step * SECONDS_PER_STEP * SAMPLE_RATE)
        
        # Crash cymbals on sectional drops
        if step == 0 and (bar in [0, 16, 32, 48, 64, 80, 96, 112, 128]):
            trigger_crash(start_samp, 0.58)
            
        if is_buildup_bar:
            # Snare Roll Crescendo
            sub_count = 2 if step >= 8 else 1
            for sub in range(sub_count):
                sub_samp = start_samp + int(sub * (SECONDS_PER_STEP / sub_count) * SAMPLE_RATE)
                roll_vol = 0.5 + 0.7 * (step / 16.0)
                trigger_drum(sub_samp, snare_l, snare_r, roll_vol)
            if step % 4 == 0:
                trigger_drum(start_samp, kick_l, kick_r, 1.1)
            trigger_hat(start_samp, is_open=(step % 2 == 1), vol=0.25)
            continue
            
        if is_breakdown_section:
            # Raw Funky Breakbeat (Slap Bass Feature)
            if step in [0, 8, 10]:
                trigger_drum(start_samp, kick_l, kick_r, 1.1)
            if step in [4, 12]:
                trigger_drum(start_samp, snare_l, snare_r, 1.2)
            elif step in [6, 14]:
                trigger_drum(start_samp, ghost_l, ghost_r, 0.6)
            if step in [2, 6, 10, 14]:
                trigger_hat(start_samp, is_open=True, vol=0.24)
            else:
                trigger_hat(start_samp, is_open=False, vol=0.18)
            continue

        # Standard High-Speed Escape Breakbeat
        if step in [0, 6, 10]:
            trigger_drum(start_samp, kick_l, kick_r, 1.18)
        elif step in [3, 14]:
            trigger_drum(start_samp, kick_l, kick_r, 0.95)
            
        if step in [4, 12]:
            trigger_drum(start_samp, snare_l, snare_r, 1.25)
        elif step in [7, 15]:
            trigger_drum(start_samp, ghost_l, ghost_r, 0.65)
        elif step == 11 and (bar % 2 == 1):
            trigger_drum(start_samp, ghost_l, ghost_r, 0.55)
            
        if step in [2, 6, 10, 14]:
            trigger_hat(start_samp, is_open=True, vol=0.26)
        else:
            acc = 0.28 if (step % 4 == 0) else 0.18
            trigger_hat(start_samp, is_open=False, vol=acc)

# ------------------------------------------------------------------------------
# 5. VIRTUOSIC SLAP & POP BASSLINE
# ------------------------------------------------------------------------------
print("Synthesizing 140 bars of authentic cartoon slap & pop bass...")

BASS_PATTERNS = {
    'Dm_Slap': [
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
    'Funky_Solo_1': [
        ('D1', 1), ('D2', 1), ('-', 1), ('D2', 1), ('F2', 2), ('G2', 1), ('Ab2', 1),
        ('A2', 2), ('C3', 2), ('D3', 2), ('C3', 1), ('A2', 1)
    ],
    'Funky_Solo_2': [
        ('D1', 2), ('-', 1), ('F1', 1), ('G1', 2), ('Ab1', 1), ('A1', 1),
        ('C2', 2), ('D2', 2), ('F2', 2), ('G2', 1), ('Ab2', 1)
    ],
    'Chromatic_Panic': [
        ('G0', 2), ('Ab0', 2), ('A0', 2), ('Bb0', 2),
        ('B0', 2), ('C1', 2), ('C#1', 2), ('D1', 2)
    ],
    'Turnaround_Climb': [
        ('Eb1', 2), ('E1', 2), ('F1', 2), ('F#1', 2),
        ('G1', 2), ('Ab1', 2), ('A1', 2), ('C#2', 2)
    ]
}

def get_bass_pattern_for_bar(bar):
    # Bars 0-15 (Intro & Alert)
    if bar < 16:
        seq = ['Dm_Slap', 'Dm_Run', 'Dm_Slap', 'Dm_Run',
               'Dm_Slap', 'Bb_Chug', 'C_Chug', 'A7_Punch',
               'Dm_Slap', 'Bb_Chug', 'Gm_Chug', 'A7_Punch',
               'Bb_Chug', 'C_Chug', 'Dm_Run', 'A7_Punch']
        return seq[bar]
    # Bars 16-31 (Main Escape Theme)
    elif bar < 32:
        seq = ['Dm_Slap', 'Dm_Run', 'Dm_Slap', 'Dm_Run',
               'Dm_Slap', 'Bb_Chug', 'C_Chug', 'A7_Punch',
               'Dm_Slap', 'F_Chug', 'C_Chug', 'Gm_Chug',
               'Bb_Chug', 'C_Chug', 'Dm_Run', 'A7_Punch']
        return seq[bar - 16]
    # Bars 32-47 (Mach 3 Sprint)
    elif bar < 48:
        seq = ['F_Chug', 'C_Chug', 'Dm_Run', 'Bb_Chug',
               'F_Chug', 'C_Chug', 'Bb_Chug', 'A7_Punch',
               'Dm_Slap', 'Bb_Chug', 'C_Chug', 'A7_Punch',
               'Bb_Chug', 'C_Chug', 'Dm_Run', 'A7_Punch']
        return seq[bar - 32]
    # Bars 48-63 (Slap Bass Feature Solo)
    elif bar < 64:
        seq = ['Funky_Solo_1', 'Funky_Solo_2', 'Funky_Solo_1', 'Funky_Solo_2',
               'Dm_Slap', 'Bb_Chug', 'C_Chug', 'A7_Punch',
               'Funky_Solo_1', 'Funky_Solo_2', 'Gm_Chug', 'A7_Punch',
               'Bb_Chug', 'C_Chug', 'Dm_Run', 'Turnaround_Climb']
        return seq[bar - 48]
    # Bars 64-79 (The Death That I Deservioli theme)
    elif bar < 80:
        seq = ['Dm_Slap', 'Bb_Chug', 'Gm_Chug', 'A7_Punch',
               'Dm_Slap', 'Bb_Chug', 'C_Chug', 'A7_Punch',
               'F_Chug', 'C_Chug', 'Dm_Run', 'Bb_Chug',
               'Gm_Chug', 'A7_Punch', 'Dm_Run', 'A7_Punch']
        return seq[bar - 64]
    # Bars 80-95 (Big Band Swing)
    elif bar < 96:
        seq = ['Dm_Slap', 'Dm_Run', 'Bb_Chug', 'C_Chug',
               'Dm_Slap', 'F_Chug', 'Gm_Chug', 'A7_Punch',
               'Dm_Slap', 'Bb_Chug', 'C_Chug', 'A7_Punch',
               'Bb_Chug', 'C_Chug', 'Dm_Run', 'Turnaround_Climb']
        return seq[bar - 80]
    # Bars 96-111 (Countdown Panic)
    elif bar < 112:
        seq = ['Gm_Chug', 'F_Chug', 'Bb_Chug', 'C_Chug',
               'Chromatic_Panic', 'Chromatic_Panic', 'Turnaround_Climb', 'A7_Punch',
               'Gm_Chug', 'F_Chug', 'Bb_Chug', 'C_Chug',
               'Chromatic_Panic', 'Chromatic_Panic', 'Turnaround_Climb', 'Turnaround_Climb']
        return seq[bar - 96]
    # Bars 112-127 (Mach 4 Super-Sprint)
    elif bar < 128:
        seq = ['Dm_Slap', 'Dm_Run', 'Dm_Slap', 'Dm_Run',
               'Dm_Slap', 'Bb_Chug', 'C_Chug', 'A7_Punch',
               'Dm_Slap', 'F_Chug', 'C_Chug', 'Gm_Chug',
               'Bb_Chug', 'C_Chug', 'Dm_Run', 'A7_Punch']
        return seq[bar - 112]
    # Bars 128-139 (Grand Finale Buildup & Seamless Loop)
    else:
        seq = ['Dm_Slap', 'Dm_Run', 'Bb_Chug', 'C_Chug',
               'Chromatic_Panic', 'Chromatic_Panic', 'Turnaround_Climb', 'A7_Punch',
               'Chromatic_Panic', 'Chromatic_Panic', 'Turnaround_Climb', 'Turnaround_Climb']
        return seq[bar - 128]

for bar in range(TOTAL_BARS):
    pattern_name = get_bass_pattern_for_bar(bar)
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
                
                h1 = math.sin(2 * math.pi * f0 * t) * math.exp(-8.0 * t)
                h2 = math.sin(2 * math.pi * 2 * f0 * t) * 0.75 * math.exp(-12.0 * t)
                h3 = math.sin(2 * math.pi * 3 * f0 * t) * 0.45 * math.exp(-18.0 * t)
                h4 = math.sin(2 * math.pi * 4 * f0 * t) * 0.28 * math.exp(-24.0 * t)
                click = math.exp(-110.0 * t) * math.sin(2 * math.pi * 850 * t) * 0.45
                
                raw = (h1 + h2 + h3 + h4 + click) * 0.42
                sample = math.tanh(raw * 1.35) * 0.40
                left_buffer[idx] += sample
                right_buffer[idx] += sample
                
        step_offset += dur_steps

# ------------------------------------------------------------------------------
# 6. FUNK CLAVINET & WAH CHORDS
# ------------------------------------------------------------------------------
print("Synthesizing funk clavinet / wah rhythm chops...")

CHORDS_DM = ['D4', 'F4', 'A4', 'C5']
CHORDS_BB = ['D4', 'F4', 'Bb4', 'D5']
CHORDS_C  = ['E4', 'G4', 'C5', 'E5']
CHORDS_A7 = ['E4', 'G4', 'A4', 'C#5']
CHORDS_GM = ['D4', 'G4', 'Bb4', 'D5']
CHORDS_F  = ['C4', 'F4', 'A4', 'C5']

CLAV_HITS = [2, 6, 10, 14]

for bar in range(TOTAL_BARS):
    # Choose chord based on progression
    b_mod = bar % 4
    if b_mod == 0: chord = CHORDS_DM
    elif b_mod == 1: chord = CHORDS_BB
    elif b_mod == 2: chord = CHORDS_C
    else: chord = CHORDS_A7
    
    for step in CLAV_HITS:
        start_samp = int((bar * 16 + step) * SECONDS_PER_STEP * SAMPLE_RATE)
        dur = int(0.12 * SAMPLE_RATE)
        for note in chord:
            freq = note_to_freq(note)
            for i in range(dur):
                idx = start_samp + i
                if idx >= TOTAL_SAMPLES: break
                t = i / SAMPLE_RATE
                env = math.exp(-25.0 * t)
                # Wah filter effect
                wah = 1.0 + 0.5 * math.sin(2 * math.pi * 3.5 * t)
                s = (math.sin(2 * math.pi * freq * t) + 0.5 * math.sin(2 * math.pi * 2 * freq * t)) * env * 0.04 * wah
                left_buffer[idx] += s * 0.8
                right_buffer[idx] += s * 1.2

# ------------------------------------------------------------------------------
# 7. CARTOON BIG-BAND BRASS STABS & FALLS
# ------------------------------------------------------------------------------
print("Synthesizing cartoon brass horn punches & pitch falls...")

BRASS_HIT_TIMES = [
    # Bar offsets and steps
    (4, ['D4', 'F4', 'A4', 'D5'], False),
    (10, ['F4', 'A4', 'D5', 'F5'], True),
    (14, ['A4', 'C5', 'E5', 'A5'], False)
]

for bar in range(0, TOTAL_BARS, 2):
    # Every 2 bars, hit punchy brass
    if bar % 4 == 0:
        c1 = ['D4', 'F4', 'A4', 'D5']
        c2 = ['F4', 'A4', 'D5', 'F5']
    else:
        c1 = ['E4', 'G4', 'C5', 'E5']
        c2 = ['G4', 'A4', 'C#5', 'A5']
        
    for step, is_fall in [(4, False), (10, True)]:
        chord = c1 if step == 4 else c2
        start_samp = int((bar * 16 + step) * SECONDS_PER_STEP * SAMPLE_RATE)
        dur_samp = int(0.24 * SAMPLE_RATE)
        for note in chord:
            base_f = note_to_freq(note)
            p1 = random.random() * 2 * math.pi
            p2 = random.random() * 2 * math.pi
            for i in range(dur_samp):
                idx = start_samp + i
                if idx >= TOTAL_SAMPLES: break
                t = i / SAMPLE_RATE
                env = (t / 0.012) if t < 0.012 else math.exp(-6.0 * (t - 0.012))
                cur_f = base_f
                if is_fall and t > 0.07:
                    cur_f *= math.exp(-8.0 * (t - 0.07))
                p1 += 2 * math.pi * cur_f / SAMPLE_RATE
                p2 += 2 * math.pi * (cur_f * 1.005) / SAMPLE_RATE
                b1 = 2.0 * ((p1 / (2*math.pi)) % 1.0) - 1.0
                b2 = 2.0 * ((p2 / (2*math.pi)) % 1.0) - 1.0
                sample = (b1 + b2) * 0.5 * env * 0.11
                left_buffer[idx] += sample * 0.95
                right_buffer[idx] += sample * 0.95

# ------------------------------------------------------------------------------
# 8. CATCHY PIZZA TOWER ESCAPE LEAD MELODIES (3:20 JOURNEY)
# ------------------------------------------------------------------------------
print("Synthesizing rich, catchy 200-second Pizza Tower melodic journey...")

# We compose dynamic melodic phrases across all sections:
THEME_A_ALARM = [
    (0, 'D5', 2), (2, 'F5', 2), (4, 'A5', 3), (7, 'C6', 2), (9, 'D6', 3), (12, 'C6', 2), (14, 'A5', 2),
    (16+0, 'F5', 3), (16+3, 'G5', 2), (16+5, 'Ab5', 2), (16+7, 'A5', 4), (16+11, 'F5', 2), (16+13, 'D5', 3),
    (32+0, 'D5', 2), (32+2, 'F5', 2), (32+4, 'A5', 3), (32+7, 'C6', 2), (32+9, 'D6', 3), (32+12, 'F6', 2), (32+14, 'E6', 2),
    (48+0, 'D6', 3), (48+3, 'C6', 2), (48+5, 'A5', 3), (48+8, 'G5', 2), (48+10, 'A5', 6)
]

THEME_B_PIZZA_TIME = [
    (0, 'D5', 2), (2, 'F5', 2), (4, 'A5', 4), (8, 'D6', 3), (11, 'C6', 2), (13, 'A5', 3),
    (16+0, 'Bb5', 3), (16+3, 'D6', 2), (16+5, 'F6', 4), (16+9, 'E6', 2), (16+11, 'D6', 2), (16+13, 'C6', 3),
    (32+0, 'G5', 2), (32+2, 'C6', 2), (32+4, 'E6', 4), (32+8, 'D6', 2), (32+10, 'C6', 2), (32+12, 'B5', 4),
    (48+0, 'A5', 2), (48+2, 'C#6', 2), (48+4, 'E6', 4), (48+8, 'G6', 3), (48+11, 'F6', 2), (48+13, 'E6', 3)
]

THEME_C_MACH_SPRINT = [
    (0, 'F6', 3), (3, 'D6', 2), (5, 'A5', 3), (8, 'D6', 2), (10, 'F6', 4), (14, 'G6', 2),
    (16+0, 'F6', 2), (16+2, 'D6', 2), (16+4, 'Bb5', 4), (16+8, 'D6', 2), (16+10, 'F6', 4), (16+14, 'A6', 2),
    (32+0, 'G6', 2), (32+2, 'E6', 2), (32+4, 'C6', 4), (32+8, 'E6', 2), (32+10, 'G6', 4), (32+14, 'Bb6', 2),
    (48+0, 'A6', 3), (48+3, 'G6', 2), (48+5, 'F6', 2), (48+7, 'E6', 2), (48+9, 'D6', 2), (48+11, 'C#6', 2), (48+13, 'E6', 3)
]

THEME_D_DESERVIOLI = [
    (0, 'D6', 2), (2, 'F6', 2), (4, 'A6', 4), (8, 'D7', 4), (12, 'C7', 4),
    (16+0, 'A6', 3), (16+3, 'F6', 2), (16+5, 'D6', 3), (16+8, 'F6', 2), (16+10, 'A6', 6),
    (32+0, 'G6', 2), (32+2, 'E6', 2), (32+4, 'C6', 4), (32+8, 'E6', 4), (32+12, 'G6', 4),
    (48+0, 'F6', 3), (48+3, 'D6', 2), (48+5, 'B5', 3), (48+8, 'D6', 2), (48+10, 'F6', 6)
]

THEME_E_PANIC_CLIMB = [
    (0, 'G6', 2), (2, 'Bb6', 2), (4, 'D7', 2), (6, 'G6', 2), (8, 'Bb6', 2), (10, 'D7', 2), (12, 'G6', 2), (14, 'Bb6', 2),
    (16+0, 'A6', 2), (16+2, 'C7', 2), (16+4, 'E7', 2), (16+6, 'A6', 2), (16+8, 'C7', 2), (16+10, 'E7', 2), (16+12, 'A6', 2), (16+14, 'C7', 2),
    (32+0, 'Bb6', 2), (32+2, 'D7', 2), (32+4, 'F7', 2), (32+6, 'Bb6', 2), (32+8, 'D7', 2), (32+10, 'F7', 2), (32+12, 'Bb6', 2), (32+14, 'D7', 2),
    (48+0, 'C7', 2), (48+2, 'E7', 2), (48+4, 'G7', 2), (48+6, 'C7', 2), (48+8, 'E7', 2), (48+10, 'G7', 2), (48+12, 'C7', 2), (48+14, 'E7', 2)
]

THEME_FINALE = [
    (0, 'C#7', 2), (2, 'E7', 2), (4, 'G7', 2), (6, 'A#7', 2), (8, 'G7', 2), (10, 'E7', 2), (12, 'C#7', 4),
    (16+0, 'D7', 2), (16+2, 'F7', 2), (16+4, 'A7', 2), (16+6, 'C8', 2), (16+8, 'A7', 2), (16+10, 'F7', 2), (16+12, 'D7', 4),
    (32+0, 'Eb7', 2), (32+2, 'G7', 2), (32+4, 'Bb7', 2), (32+6, 'Db8', 2), (32+8, 'Bb7', 2), (32+10, 'G7', 2), (32+12, 'Eb7', 4),
    (48+0, 'E7', 1), (48+1, 'F7', 1), (48+2, 'F#7', 1), (48+3, 'G7', 1),
    (48+4, 'G#7', 1), (48+5, 'A7', 1), (48+6, 'A#7', 1), (48+7, 'B7', 1),
    (48+8, 'C8', 2), (48+10, 'C#8', 2), (48+12, 'D8', 4)
]

# Section mapping to form 140 bars:
SECTIONS = [
    (0, THEME_A_ALARM),
    (4, THEME_B_PIZZA_TIME),
    (8, THEME_C_MACH_SPRINT),
    (12, THEME_FINALE),
    (16, THEME_A_ALARM),
    (20, THEME_B_PIZZA_TIME),
    (24, THEME_C_MACH_SPRINT),
    (28, THEME_D_DESERVIOLI),
    (32, THEME_C_MACH_SPRINT),
    (36, THEME_B_PIZZA_TIME),
    (40, THEME_D_DESERVIOLI),
    (44, THEME_FINALE),
    # 48-63: Bass Solo (Lead stays subtle or rests to highlight slap bass)
    (56, THEME_B_PIZZA_TIME),
    (60, THEME_FINALE),
    # 64-79: "The Death That I Deservioli" heroic climax
    (64, THEME_D_DESERVIOLI),
    (68, THEME_C_MACH_SPRINT),
    (72, THEME_D_DESERVIOLI),
    (76, THEME_FINALE),
    # 80-95: Full Big Band Swing
    (80, THEME_B_PIZZA_TIME),
    (84, THEME_C_MACH_SPRINT),
    (88, THEME_D_DESERVIOLI),
    (92, THEME_FINALE),
    # 96-111: Countdown Panic
    (96, THEME_E_PANIC_CLIMB),
    (100, THEME_E_PANIC_CLIMB),
    (104, THEME_E_PANIC_CLIMB),
    (108, THEME_FINALE),
    # 112-127: Maximum Overdrive
    (112, THEME_A_ALARM),
    (116, THEME_B_PIZZA_TIME),
    (120, THEME_C_MACH_SPRINT),
    (124, THEME_D_DESERVIOLI),
    # 128-139: Grand Finale Buildup & Seamless Loop
    (128, THEME_E_PANIC_CLIMB),
    (132, THEME_FINALE),
    (136, THEME_FINALE)
]

for base_bar, phrase in SECTIONS:
    for rel_step, note, dur_steps in phrase:
        cur_step = base_bar * 16 + rel_step
        if cur_step >= TOTAL_STEPS: break
        base_f = note_to_freq(note)
        start_samp = int(cur_step * SECONDS_PER_STEP * SAMPLE_RATE)
        dur_samp = int(dur_steps * SECONDS_PER_STEP * SAMPLE_RATE)
        rel_samp = int(0.05 * SAMPLE_RATE)
        
        phase = 0.0
        for i in range(dur_samp + rel_samp):
            idx = start_samp + i
            if idx >= TOTAL_SAMPLES: break
            t = i / SAMPLE_RATE
            
            if i < int(0.01 * SAMPLE_RATE):
                env = i / (0.01 * SAMPLE_RATE)
            elif i < dur_samp:
                env = 1.0 - 0.1 * (i / dur_samp)
            else:
                env = 0.9 * ((dur_samp + rel_samp - i) / rel_samp)
                
            vib = 0.0
            if t > 0.06:
                vib = math.sin(2 * math.pi * 6.5 * t) * (base_f * 0.015)
                
            phase += 2 * math.pi * (base_f + vib) / SAMPLE_RATE
            saw = 2.0 * ((phase / (2*math.pi)) % 1.0) - 1.0
            sq = 1.0 if (phase % (2*math.pi)) < math.pi else -1.0
            sample = (saw * 0.6 + sq * 0.4) * env * 0.22
            
            left_buffer[idx] += sample * 0.9
            right_buffer[idx] += sample * 0.9
            
            echo = idx + int(3 * SECONDS_PER_STEP * SAMPLE_RATE)
            if echo < TOTAL_SAMPLES:
                left_buffer[echo] += sample * 0.16
                right_buffer[echo] += sample * 0.12

# ------------------------------------------------------------------------------
# 9. MASTERING & SEAMLESS 200-SECOND LOOP
# ------------------------------------------------------------------------------
print("Mastering and normalizing audio with seamless loop crossfade...")
CROSSFADE = 2000
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
        # Warm analog tape saturation limiter
        l = max(-0.98, min(0.98, math.tanh(l * 1.08)))
        r = max(-0.98, min(0.98, math.tanh(r * 1.08)))
        
        int_l = int(l * 32767.0)
        int_r = int(r * 32767.0)
        frames.extend(struct.pack('<hh', int_l, int_r))
        
    wav.writeframes(frames)

# Duplicate as mu_breakingnews.wav and mu_pizzatime.wav
shutil.copyfile('music/mu_escape.wav', 'music/mu_breakingnews.wav')
shutil.copyfile('music/mu_escape.wav', 'music/mu_pizzatime.wav')

t_end = time.time()
print(f"=== Composition Complete in {t_end - t_start:.2f}s! ===")
print(f"  1. {output_wav} ({len(frames)} bytes, {TOTAL_SECONDS:.2f}s / {TOTAL_SECONDS/60:.2f} min, {BPM} BPM)")
print(f"  2. music/mu_breakingnews.wav")
print(f"  3. music/mu_pizzatime.wav")
