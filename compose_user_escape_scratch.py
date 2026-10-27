import math
import struct
import wave
import random
import os
import shutil
import time

t_start = time.time()

SAMPLE_RATE = 44100
# User defined BPM: 80 in Scratch, with 0.25 beats = 0.1875s (equivalent to 160 BPM in standard 4/4 notation)
BPM = 160.0
SECONDS_PER_BEAT = 60.0 / BPM  # 0.375s
SECONDS_PER_STEP = SECONDS_PER_BEAT / 4.0  # 16th note = 0.09375s

# 80 bars at 160 BPM = 120.0 seconds (exactly 2 minutes)
TOTAL_BARS = 80
TOTAL_STEPS = TOTAL_BARS * 16
TOTAL_SECONDS = TOTAL_BARS * (4.0 * SECONDS_PER_BEAT)  # 120.0s
TOTAL_SAMPLES = int(TOTAL_SECONDS * SAMPLE_RATE)

print(f"=== Composing Brand New Custom Escape Music From Scratch ===")
print(f"Total Duration: {TOTAL_SECONDS:.2f}s | Sample Rate: {SAMPLE_RATE} Hz | Total Samples: {TOTAL_SAMPLES}")

left_buffer = [0.0] * TOTAL_SAMPLES
right_buffer = [0.0] * TOTAL_SAMPLES

# ------------------------------------------------------------------------------
# 1. MUSICAL HELPERS & USER MELODY SPECIFICATION
# ------------------------------------------------------------------------------
def midi_to_freq(m):
    return 440.0 * (2.0 ** ((m - 69) / 12.0))

# User's exact Scratch melody:
# In Scratch (at 80 BPM):
# Part 1 is 4.0 beats (3.0s) = 8 beats at 160 BPM = 2 bars of 4/4!
# Part 2 is 4.0 beats (3.0s) = 8 beats at 160 BPM = 2 bars of 4/4!
# Total phrase (Part 1 + Part 2) = 4 bars of 4/4 (6.0s)!

# Scratch notes converted to (kind, midi_note, duration_in_scratch_beats, has_vibrato)
SCRATCH_PART1 = [
    ('note', 59, 0.25, False),  # B3
    ('note', 67, 0.25, False),  # G4
    ('note', 60, 0.25, False),  # C4
    ('note', 62, 0.25, False),  # D4
    ('note', 64, 0.25, False),  # E4
    ('rest', 0,  0.25, False),
    ('note', 62, 0.25, False),  # D4
    ('note', 60, 0.25, False),  # C4
    ('note', 59, 0.25, False),  # B3
    ('rest', 0,  0.50, False),
    ('note', 67, 0.55, True),   # G4 with rich Vibrato!
    ('note', 64, 0.20, False),  # E4
    ('note', 62, 0.20, False),  # D4
    ('rest', 0,  0.05, False),
    ('note', 62, 0.20, True),   # D4 with Vibrato!
    ('rest', 0,  0.05, False)
]

SCRATCH_PART2 = [
    ('note', 59, 0.25, False),  # B3
    ('note', 67, 0.25, False),  # G4
    ('note', 60, 0.25, False),  # C4
    ('note', 62, 0.25, False),  # D4
    ('note', 64, 0.25, False),  # E4
    ('rest', 0,  0.25, False),
    ('note', 62, 0.25, False),  # D4
    ('note', 60, 0.25, False),  # C4
    ('note', 59, 0.25, False),  # B3
    ('rest', 0,  0.25, False),
    ('note', 60, 0.25, False),  # C4
    ('rest', 0,  0.25, False),
    ('note', 62, 0.25, False),  # D4
    ('rest', 0,  0.25, False),
    ('note', 64, 0.25, False),  # E4
    ('note', 64, 0.25, True)    # E4 with Vibrato!
]

# ------------------------------------------------------------------------------
# 2. EXTRACT ACOUSTIC DRUM SAMPLES FROM SOURCE
# ------------------------------------------------------------------------------
print("Extracting acoustic punchy drum samples...")
src_wav = 'music/mu_tutorial.wav'
with wave.open(src_wav, 'rb') as w:
    src_sr = w.getframerate()
    src_frames = w.readframes(src_sr * 8)
    src_samples = struct.unpack('<' + 'h' * (len(src_frames) // 2), src_frames)
    src_l = [src_samples[i*2] / 32768.0 for i in range(len(src_samples) // 2)]
    src_r = [src_samples[i*2+1] / 32768.0 for i in range(len(src_samples) // 2)]

def extract_sample(start_sec, dur_sec, fade_out=0.03):
    start_idx = int(start_sec * src_sr)
    dur_idx = int(dur_sec * src_sr)
    out_l = []
    out_r = []
    fade_len = int(fade_out * src_sr)
    for i in range(dur_idx):
        idx = start_idx + i
        if idx >= len(src_l): break
        env = (dur_idx - i) / float(fade_len) if i >= dur_idx - fade_len else 1.0
        out_l.append(src_l[idx] * env)
        out_r.append(src_r[idx] * env)
    return out_l, out_r

kick_l, kick_r = extract_sample(2.305, 0.26, fade_out=0.04)
snare_l, snare_r = extract_sample(2.665, 0.25, fade_out=0.05)
ghost_l, ghost_r = extract_sample(2.850, 0.12, fade_out=0.03)

def trigger_drum(start_samp, smp_l, smp_r, vol=1.0):
    for i in range(len(smp_l)):
        idx = start_samp + i
        if idx >= TOTAL_SAMPLES: break
        left_buffer[idx] += smp_l[i] * vol
        right_buffer[idx] += smp_r[i] * vol

def trigger_hat(start_samp, is_open=False, vol=0.22):
    dur = int((0.14 if is_open else 0.04) * SAMPLE_RATE)
    decay = 24.0 if is_open else 75.0
    for i in range(dur):
        idx = start_samp + i
        if idx >= TOTAL_SAMPLES: break
        t = i / SAMPLE_RATE
        n = (random.random() * 2 - 1) * math.exp(-decay * t) * vol
        left_buffer[idx] += n * 0.85
        right_buffer[idx] += n * 1.15

def trigger_crash(start_samp, vol=0.55):
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

# ------------------------------------------------------------------------------
# 3. ATMOSPHERIC EMERGENCY FX (SIRENS, BROADCAST BEEPS, CLOCK)
# ------------------------------------------------------------------------------
print("Synthesizing emergency siren & broadcast atmosphere...")

# Broadcast beeps in intro (Bars 0-1) and drop lead-in (Bar 39)
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

trigger_alert_beeps(0, count=6)
trigger_alert_beeps(int(38 * 16 * SECONDS_PER_STEP * SAMPLE_RATE), count=4)

# Emergency Doppler Siren Hook across specific bars (intro, climax, finale)
SIREN_BARS = list(range(0, 4)) + list(range(20, 24)) + list(range(36, 40)) + list(range(68, 76))
for bar in SIREN_BARS:
    b_start = int(bar * 16 * SECONDS_PER_STEP * SAMPLE_RATE)
    b_len = int(16 * SECONDS_PER_STEP * SAMPLE_RATE)
    for i in range(b_len):
        idx = b_start + i
        if idx >= TOTAL_SAMPLES: break
        t = i / SAMPLE_RATE
        siren_rate = 3.2 if bar >= 68 else 2.5
        freq = 1100.0 + 360.0 * math.sin(2 * math.pi * siren_rate * t)
        
        s1 = math.sin(2 * math.pi * freq * t)
        s2 = math.sin(2 * math.pi * (freq * 1.008) * t)
        pan = 0.5 + 0.4 * math.sin(2 * math.pi * 1.5 * t)
        vol = 0.10 if bar < 68 else 0.15
        
        sample = (s1 + s2) * 0.5 * vol
        left_buffer[idx] += sample * (1.0 - pan)
        right_buffer[idx] += sample * pan

# Clock ticks in Breakdown section (Bars 48 to 64)
for bar in range(48, 64):
    for beat in range(4):
        step = bar * 16 + beat * 4
        s_start = int(step * SECONDS_PER_STEP * SAMPLE_RATE)
        tick_dur = int(0.015 * SAMPLE_RATE)
        is_tock = (beat % 2 == 1)
        freq = 1450.0 if not is_tock else 980.0
        for i in range(tick_dur):
            idx = s_start + i
            if idx >= TOTAL_SAMPLES: break
            t = i / SAMPLE_RATE
            click = math.sin(2 * math.pi * freq * t) * math.exp(-320.0 * t) * 0.28
            left_buffer[idx] += click * 0.9
            right_buffer[idx] += click * 1.1

# ------------------------------------------------------------------------------
# 4. HIGH-ENERGY BREAKBEAT DRUM ARRANGEMENT (160 BPM)
# ------------------------------------------------------------------------------
print("Synthesizing dynamic breakbeats & drum arrangement...")

for bar in range(TOTAL_BARS):
    base_step = bar * 16
    is_intro = (bar < 4)
    is_breakdown = (48 <= bar < 60)
    is_buildup = (bar in [3, 19, 35, 47, 59, 79])
    
    # Sectional crash drops
    if bar in [0, 4, 12, 20, 28, 36, 44, 60, 68]:
        start_samp = int(base_step * SECONDS_PER_STEP * SAMPLE_RATE)
        trigger_crash(start_samp, 0.60)
        
    for step in range(16):
        cur_step = base_step + step
        start_samp = int(cur_step * SECONDS_PER_STEP * SAMPLE_RATE)
        
        if is_intro:
            # Simple kick pulse on beats in intro bar 0-3
            if step % 4 == 0 and bar >= 2:
                trigger_drum(start_samp, kick_l, kick_r, 0.95)
            if bar == 3 and step >= 8:
                # Intro snare roll build
                roll_vol = 0.4 + 0.6 * ((step - 8) / 8.0)
                trigger_drum(start_samp, snare_l, snare_r, roll_vol)
            continue
            
        if is_buildup:
            # 32nd note snare roll crescendo into drop
            sub_count = 2 if step >= 8 else 1
            for sub in range(sub_count):
                sub_samp = start_samp + int(sub * (SECONDS_PER_STEP / sub_count) * SAMPLE_RATE)
                roll_vol = 0.5 + 0.7 * (step / 16.0)
                trigger_drum(sub_samp, snare_l, snare_r, roll_vol)
            if step % 4 == 0:
                trigger_drum(start_samp, kick_l, kick_r, 1.1)
            trigger_hat(start_samp, is_open=(step % 2 == 1), vol=0.25)
            continue
            
        if is_breakdown:
            # Sparse tension beat during ticking clock
            if step == 0:
                trigger_drum(start_samp, kick_l, kick_r, 1.1)
            elif step == 8:
                trigger_drum(start_samp, snare_l, snare_r, 0.9)
            if step % 4 == 2:
                trigger_hat(start_samp, is_open=False, vol=0.15)
            continue
            
        # Standard Driving Breakbeat Pattern
        # Kicks: 0, 3 (syncopation), 6, 10, 14
        if step in [0, 6, 10]:
            trigger_drum(start_samp, kick_l, kick_r, 1.2)
        elif step in [3, 14]:
            trigger_drum(start_samp, kick_l, kick_r, 1.0)
            
        # Snares on beats 2 and 4 (steps 4 and 12)
        if step in [4, 12]:
            trigger_drum(start_samp, snare_l, snare_r, 1.3)
        elif step in [7, 15]:
            trigger_drum(start_samp, ghost_l, ghost_r, 0.65)
        elif step == 11 and (bar % 2 == 1):
            trigger_drum(start_samp, ghost_l, ghost_r, 0.55)
            
        # Hi-Hats: 16th notes with open hats on offbeats
        if step in [2, 6, 10, 14]:
            trigger_hat(start_samp, is_open=True, vol=0.26)
        else:
            acc = 0.28 if (step % 4 == 0) else 0.18
            trigger_hat(start_samp, is_open=False, vol=acc)

# ------------------------------------------------------------------------------
# 5. AGGRESSIVE SLAP BASSLINE (E Minor / C / D Groove)
# ------------------------------------------------------------------------------
print("Synthesizing driving slap bass with thumb pops...")

# Harmonic progression matching user's melody:
# 4 bars per phrase cycle:
# Bar 0: Em (E1 groove)
# Bar 1: C (C1 groove) -> G/B
# Bar 2: Em (E1 groove)
# Bar 3: C -> D -> Em (Stabs!)
BASS_PATTERN_4BAR = [
    # Bar 0 (Em)
    [('E1', 2), ('-', 1), ('E2', 1), ('-', 1), ('E1', 2), ('-', 1), ('G1', 2), ('A1', 2), ('Bb1', 1), ('B1', 2), ('D2', 2)],
    # Bar 1 (C / G)
    [('C1', 2), ('-', 1), ('C2', 2), ('-', 1), ('C1', 2), ('B0', 1), ('C1', 1), ('D1', 2), ('G1', 2), ('B1', 2)],
    # Bar 2 (Em)
    [('E1', 2), ('-', 1), ('E2', 2), ('-', 1), ('E1', 2), ('D2', 1), ('E2', 1), ('G2', 2), ('F#2', 2), ('D2', 2)],
    # Bar 3 (C -> D -> Em stabs)
    [('C1', 4), ('C2', 2), ('-', 2), ('D1', 4), ('D2', 2), ('E1', 2)]
]

for bar in range(4, TOTAL_BARS):
    if 48 <= bar < 60:
        # Simplified bass chugs during breakdown
        p_bar = [('E1', 4), ('-', 4), ('E1', 4), ('-', 4)]
    else:
        p_idx = (bar - 4) % 4
        p_bar = BASS_PATTERN_4BAR[p_idx]
        
    step_offset = 0
    for note, dur_steps in p_bar:
        if note != '-':
            f0 = midi_to_freq(28 if note == 'E1' else (36 if note == 'C1' else (38 if note == 'D1' else (40 if note == 'E2' else (43 if note == 'G1' else 35)))))
            if '0' in note: f0 *= 0.5
            elif '2' in note: f0 *= 2.0
            
            cur_step = bar * 16 + step_offset
            start_samp = int(cur_step * SECONDS_PER_STEP * SAMPLE_RATE)
            dur_samp = int(dur_steps * SECONDS_PER_STEP * SAMPLE_RATE) + int(0.04 * SAMPLE_RATE)
            
            for i in range(dur_samp):
                idx = start_samp + i
                if idx >= TOTAL_SAMPLES: break
                t = i / SAMPLE_RATE
                
                h1 = math.sin(2 * math.pi * f0 * t) * math.exp(-7.5 * t)
                h2 = math.sin(2 * math.pi * 2 * f0 * t) * 0.75 * math.exp(-11.0 * t)
                h3 = math.sin(2 * math.pi * 3 * f0 * t) * 0.40 * math.exp(-17.0 * t)
                click = math.exp(-120.0 * t) * math.sin(2 * math.pi * 920 * t) * 0.45
                
                raw = (h1 + h2 + h3 + click) * 0.45
                sample = math.tanh(raw * 1.4) * 0.42
                left_buffer[idx] += sample * 0.95
                right_buffer[idx] += sample * 0.95
                
        step_offset += dur_steps

# ------------------------------------------------------------------------------
# 6. BRASS POWER CHORDS & CARTOON BIG-BAND STABS
# ------------------------------------------------------------------------------
print("Synthesizing big-band horn stabs & accompaniment chords...")

CHORD_SECTIONS = [
    # Em punch (E4, G4, B4, E5)
    (['E4', 'G4', 'B4', 'E5']),
    # C major punch (E4, G4, C5, E5)
    (['E4', 'G4', 'C5', 'E5']),
    # D major punch (F#4, A4, D5, F#5)
    (['F#4', 'A4', 'D5', 'F#5']),
    # G major punch (G4, B4, D5, G5)
    (['G4', 'B4', 'D5', 'G5'])
]

# Stabs on beats in energetic sections
for bar in range(4, TOTAL_BARS):
    if 48 <= bar < 60: continue # quiet in breakdown
    p_idx = (bar - 4) % 4
    chord = CHORD_SECTIONS[p_idx % len(CHORD_SECTIONS)]
    
    # Stabs on steps 4, 10, 14
    for st in [4, 10, 14]:
        start_samp = int((bar * 16 + st) * SECONDS_PER_STEP * SAMPLE_RATE)
        dur_samp = int(2 * SECONDS_PER_STEP * SAMPLE_RATE) + int(0.04 * SAMPLE_RATE)
        for cnote in chord:
            base_f = midi_to_freq(64 if cnote.startswith('E') else (67 if cnote.startswith('G') else (62 if cnote.startswith('D') else 71)))
            p1 = random.random() * 2 * math.pi
            for i in range(dur_samp):
                idx = start_samp + i
                if idx >= TOTAL_SAMPLES: break
                t = i / SAMPLE_RATE
                env = (t / 0.01) if t < 0.01 else math.exp(-6.5 * (t - 0.01))
                p1 += 2 * math.pi * base_f / SAMPLE_RATE
                saw = 2.0 * ((p1 / (2*math.pi)) % 1.0) - 1.0
                sample = saw * env * 0.06
                left_buffer[idx] += sample * 0.95
                right_buffer[idx] += sample * 0.95

# ------------------------------------------------------------------------------
# 7. USER'S EXACT MELODY (WITH VIBRATO) AS ICONIC ESCAPE LEAD
# ------------------------------------------------------------------------------
print("Synthesizing User's Escape Melody with Expressive Vibrato...")

# Each phrase (Part 1 then Part 2) takes 6.0 seconds = 4 bars!
# We arrange the melody across the track:
# - Bars 4-19: Main Theme (4 repetitions)
# - Bars 20-35: Harmony Theme (Lead + 3rd Harmony + Stereo Echo)
# - Bars 36-47: High Octave Scream Lead (+1 Octave, piercing energy)
# - Bars 48-59: Breakdown (Muted / Solo Lead with deeper Vibrato)
# - Bars 60-75: Ultimate Grand Climax (Full Ensemble + Octave Stack)
# - Bars 76-79: Triumphant Outro Stabs

def render_melody_phrase(bar_start, octave_shift=0, with_harmony=False, vol=0.24):
    start_time_base = bar_start * 4.0 * SECONDS_PER_BEAT
    
    cur_time = start_time_base
    for phrase in [SCRATCH_PART1, SCRATCH_PART2]:
        for kind, note, scratch_beats, has_vib in phrase:
            # 1 Scratch beat = 0.75s (at 80 BPM). In our 160 BPM grid, dur_s = scratch_beats * 0.75s!
            dur_s = scratch_beats * 0.75
            
            if kind == 'note':
                base_freq = midi_to_freq(note + octave_shift * 12)
                start_samp = int(cur_time * SAMPLE_RATE)
                dur_samp = int(dur_s * SAMPLE_RATE)
                rel_samp = int(0.04 * SAMPLE_RATE)
                
                # Render lead
                phase = 0.0
                phase_harm = 0.0
                harm_freq = midi_to_freq(note + octave_shift * 12 + 4) # Major/minor third harmony
                
                for i in range(dur_samp + rel_samp):
                    idx = start_samp + i
                    if idx >= TOTAL_SAMPLES: break
                    t = i / SAMPLE_RATE
                    
                    # Attack & Release envelope
                    if t < 0.008:
                        env = t / 0.008
                    elif t < dur_s:
                        env = 1.0 - 0.08 * (t / dur_s)
                    else:
                        env = max(0.0, 0.92 * ((dur_s + rel_samp - t) / rel_samp))
                        
                    # Expressive Vibrato!
                    vib = 0.0
                    if has_vib:
                        # Vibrato rate 6.2 Hz, depth ramps up smoothly after attack
                        vib_ramp = min(1.0, max(0.0, (t - 0.03) / 0.12))
                        vib_depth = base_freq * 0.032 * vib_ramp
                        vib = math.sin(2 * math.pi * 6.2 * t) * vib_depth
                    elif t > 0.12:
                        # Subtle natural vibrato on any note longer than 0.12s
                        vib = math.sin(2 * math.pi * 5.8 * t) * (base_freq * 0.008)
                        
                    cur_f = base_freq + vib
                    phase += 2 * math.pi * cur_f / SAMPLE_RATE
                    
                    # Punchy Lead Tone: Blend of bright sawtooth, pulse wave and sub
                    saw = 2.0 * ((phase / (2*math.pi)) % 1.0) - 1.0
                    sq = 1.0 if (phase % (2*math.pi)) < math.pi else -1.0
                    sub = math.sin(phase * 0.5) * 0.25
                    lead_raw = (saw * 0.55 + sq * 0.35 + sub) * env * vol
                    
                    # Optional twin harmony
                    harm_sample = 0.0
                    if with_harmony:
                        cur_fh = harm_freq + vib * (harm_freq / base_freq)
                        phase_harm += 2 * math.pi * cur_fh / SAMPLE_RATE
                        saw_h = 2.0 * ((phase_harm / (2*math.pi)) % 1.0) - 1.0
                        harm_sample = saw_h * env * (vol * 0.45)
                    
                    left_buffer[idx] += lead_raw * 0.95 + harm_sample * 0.4
                    right_buffer[idx] += lead_raw * 0.95 + harm_sample * 0.9
                    
                    # Rhythmic Tape Echo (echoes 3 sixteenth steps later)
                    echo_idx = idx + int(3 * SECONDS_PER_STEP * SAMPLE_RATE)
                    if echo_idx < TOTAL_SAMPLES:
                        left_buffer[echo_idx] += lead_raw * 0.20
                        right_buffer[echo_idx] += lead_raw * 0.15
                        
            cur_time += dur_s

# Render phrases across the track
# Section 1: Main Theme (Bars 4, 8, 12, 16)
for b in [4, 8, 12, 16]:
    render_melody_phrase(b, octave_shift=0, with_harmony=(b >= 12), vol=0.23)

# Section 2: Twin Harmony + Extra Energy (Bars 20, 24, 28, 32)
for b in [20, 24, 28, 32]:
    render_melody_phrase(b, octave_shift=0, with_harmony=True, vol=0.25)

# Section 3: High Octave Screamer (+1 Octave, Bars 36, 40, 44)
for b in [36, 40, 44]:
    render_melody_phrase(b, octave_shift=1, with_harmony=True, vol=0.22)

# Section 4: Breakdown (Bars 48, 52, 56)
for b in [48, 52, 56]:
    render_melody_phrase(b, octave_shift=0, with_harmony=False, vol=0.19)

# Section 5: Ultimate Grand Climax (Bars 60, 64, 68, 72)
for b in [60, 64, 68, 72]:
    render_melody_phrase(b, octave_shift=0, with_harmony=True, vol=0.25)
    render_melody_phrase(b, octave_shift=1, with_harmony=False, vol=0.18) # Stacked octaves!

# ------------------------------------------------------------------------------
# 8. MASTERING, PEAK LIMITING & SEAMLESS LOOP CROSSFADE
# ------------------------------------------------------------------------------
print("Mastering audio (analog tape limiter & seamless loop crossfade)...")

# Seamless crossfade at the boundaries
CROSSFADE = 2000
for i in range(CROSSFADE):
    factor = i / float(CROSSFADE)
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
        # Warm analog tape saturation
        l = max(-0.98, min(0.98, math.tanh(l * 1.06)))
        r = max(-0.98, min(0.98, math.tanh(r * 1.06)))
        
        int_l = int(l * 32767.0)
        int_r = int(r * 32767.0)
        frames.extend(struct.pack('<hh', int_l, int_r))
        
    wav.writeframes(frames)

# Duplicate as breaking news and pizzatime files so all triggers use the new theme!
shutil.copyfile('music/mu_escape.wav', 'music/mu_breakingnews.wav')
shutil.copyfile('music/mu_escape.wav', 'music/mu_pizzatime.wav')

print(f"=== Custom Escape Theme Complete in {time.time() - t_start:.2f}s! ===")
print(f"Saved: {output_wav} ({TOTAL_SECONDS:.2f}s, {len(frames)} bytes)")
