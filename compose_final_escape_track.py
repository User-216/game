import math
import struct
import wave
import random
import os
import shutil
import time

t_start = time.time()

SAMPLE_RATE = 44100
# User's tempo: 80 BPM in Scratch with 0.25-beat base = 160 BPM in 4/4 notation!
BPM = 160.0
SECONDS_PER_BEAT = 60.0 / BPM  # 0.375s
SECONDS_PER_STEP = SECONDS_PER_BEAT / 4.0  # 16th note = 0.09375s

# 1 phrase of user's melody (Part 1 + Part 2) = 6.0 seconds (4 bars at 160 BPM)
# We compose 48 bars = exactly 72.0 seconds of non-stop high-energy escape track!
TOTAL_BARS = 48
TOTAL_SECONDS = TOTAL_BARS * (4.0 * SECONDS_PER_BEAT)  # 72.0s
TOTAL_SAMPLES = int(TOTAL_SECONDS * SAMPLE_RATE)

print(f"=== Composing Full Escape Masterpiece around User's Main Melody ===")
print(f"BPM: {BPM} | Duration: {TOTAL_SECONDS:.2f}s | Total Samples: {TOTAL_SAMPLES}")

left_buffer = [0.0] * TOTAL_SAMPLES
right_buffer = [0.0] * TOTAL_SAMPLES

def midi_to_freq(m):
    return 440.0 * (2.0 ** ((m - 69) / 12.0))

# ------------------------------------------------------------------------------
# 1. USER'S EXACT SCRATCH MELODY (PART 1 & PART 2)
# ------------------------------------------------------------------------------
# Scratch notes with exact durations (0.25 beat = 0.1875s)
PART1 = [
    ('note', 59, 0.1875, False),  # B3
    ('note', 67, 0.1875, False),  # G4
    ('note', 60, 0.1875, False),  # C4
    ('note', 62, 0.1875, False),  # D4
    ('note', 64, 0.1875, False),  # E4
    ('rest', 0,  0.1875, False),
    ('note', 62, 0.1875, False),  # D4
    ('note', 60, 0.1875, False),  # C4
    ('note', 59, 0.1875, False),  # B3
    ('rest', 0,  0.3750, False),
    ('note', 67, 0.4125, True),   # G4 with Vibrato! (0.55 Scratch beats)
    ('note', 64, 0.1500, False),  # E4 (0.20 beats)
    ('note', 62, 0.1500, False),  # D4 (0.20 beats)
    ('rest', 0,  0.0375, False),
    ('note', 62, 0.1500, True),   # D4 with Vibrato! (0.20 beats)
    ('rest', 0,  0.0375, False)
]

PART2 = [
    ('note', 59, 0.1875, False),  # B3
    ('note', 67, 0.1875, False),  # G4
    ('note', 60, 0.1875, False),  # C4
    ('note', 62, 0.1875, False),  # D4
    ('note', 64, 0.1875, False),  # E4
    ('rest', 0,  0.1875, False),
    ('note', 62, 0.1875, False),  # D4
    ('note', 60, 0.1875, False),  # C4
    ('note', 59, 0.1875, False),  # B3
    ('rest', 0,  0.1875, False),
    ('note', 60, 0.1875, False),  # C4
    ('rest', 0,  0.1875, False),
    ('note', 62, 0.1875, False),  # D4
    ('rest', 0,  0.1875, False),
    ('note', 64, 0.1875, False),  # E4
    ('note', 64, 0.1875, True)    # E4 with Vibrato!
]

# ------------------------------------------------------------------------------
# 2. LOAD SM64 sample_34 & ACOUSTIC DRUM SAMPLES
# ------------------------------------------------------------------------------
s34_path = 'sm64_samples/sample_34_Sample_8-3.wav'
with wave.open(s34_path, 'rb') as w:
    frames = w.readframes(w.getnframes())
    raw = struct.unpack(f'<{len(frames)//2}h', frames)
    s34_data = [s / 32768.0 for s in raw]
    s34_sr = w.getframerate()
    s34_len = len(s34_data)
    s34_lstart = 1313
    s34_lend = 1377
    s34_root = 72  # C5

with wave.open('music/mu_tutorial.wav', 'rb') as w:
    src_sr = w.getframerate()
    src_frames = w.readframes(src_sr * 8)
    src_samples = struct.unpack('<' + 'h' * (len(src_frames) // 2), src_frames)
    src_l = [src_samples[i*2] / 32768.0 for i in range(len(src_samples) // 2)]
    src_r = [src_samples[i*2+1] / 32768.0 for i in range(len(src_samples) // 2)]

def extract_sample(start_sec, dur_sec, fade_out=0.03):
    start_idx = int(start_sec * src_sr)
    dur_idx = int(dur_sec * src_sr)
    out_l, out_r = [], []
    fade_len = int(fade_out * src_sr)
    for i in range(dur_idx):
        idx = start_idx + i
        if idx >= len(src_l): break
        env = (dur_idx - i) / float(fade_len) if i >= dur_idx - fade_len else 1.0
        out_l.append(src_l[idx] * env)
        out_r.append(src_r[idx] * env)
    return out_l, out_r

kick_l, kick_r = extract_sample(2.305, 0.25, fade_out=0.04)
snare_l, snare_r = extract_sample(2.665, 0.24, fade_out=0.05)
ghost_l, ghost_r = extract_sample(2.850, 0.12, fade_out=0.03)

def mix_sample(start_idx, smp_l, smp_r, vol=1.0):
    for i in range(len(smp_l)):
        idx = start_idx + i
        if idx >= TOTAL_SAMPLES: break
        left_buffer[idx] += smp_l[i] * vol
        right_buffer[idx] += smp_r[i] * vol

def trigger_crash(start_idx, vol=0.55):
    dur = int(1.6 * SAMPLE_RATE)
    for i in range(dur):
        idx = start_idx + i
        if idx >= TOTAL_SAMPLES: break
        t = i / SAMPLE_RATE
        val = (math.sin(2*math.pi*480*t) + (random.random()*2-1)*0.85) * math.exp(-2.6 * t) * vol
        left_buffer[idx] += val * 0.95
        right_buffer[idx] += val * 1.05

def trigger_hat(start_idx, is_open=False, vol=0.18):
    dur = int((0.12 if is_open else 0.04) * SAMPLE_RATE)
    decay = 26.0 if is_open else 75.0
    for i in range(dur):
        idx = start_idx + i
        if idx >= TOTAL_SAMPLES: break
        t = i / SAMPLE_RATE
        val = (random.random() * 2 - 1) * math.exp(-decay * t) * vol
        left_buffer[idx] += val * 0.85
        right_buffer[idx] += val * 1.15

# ------------------------------------------------------------------------------
# 3. ATMOSPHERIC ALARM & SIREN
# ------------------------------------------------------------------------------
print("Adding emergency sirens and alert cues...")

# Emergency siren sweeps across bars 0-3, 20-23, 44-47
SIREN_BARS = list(range(0, 4)) + list(range(20, 24)) + list(range(40, 48))
for bar in SIREN_BARS:
    b_start = int(bar * 16 * SECONDS_PER_STEP * SAMPLE_RATE)
    b_len = int(16 * SECONDS_PER_STEP * SAMPLE_RATE)
    for i in range(b_len):
        idx = b_start + i
        if idx >= TOTAL_SAMPLES: break
        t = i / SAMPLE_RATE
        siren_rate = 3.0 if bar >= 40 else 2.4
        freq = 1120.0 + 350.0 * math.sin(2 * math.pi * siren_rate * t)
        val = math.sin(2 * math.pi * freq * t) * 0.075
        pan = 0.5 + 0.35 * math.sin(2 * math.pi * 1.2 * t)
        left_buffer[idx] += val * (1.0 - pan)
        right_buffer[idx] += val * pan

# Emergency beeps at Bar 0
def trigger_beeps(start_samp, count=4):
    beep_len = int(0.04 * SAMPLE_RATE)
    gap_len = int(0.03 * SAMPLE_RATE)
    for b in range(count):
        b_start = start_samp + b * (beep_len + gap_len)
        for i in range(beep_len):
            idx = b_start + i
            if idx >= TOTAL_SAMPLES: break
            t = i / SAMPLE_RATE
            tone = (math.sin(2*math.pi*1046.5*t) + 0.8*math.sin(2*math.pi*1318.5*t)) * 0.14
            env = math.sin(math.pi * (i / beep_len))
            left_buffer[idx] += tone * env
            right_buffer[idx] += tone * env

trigger_beeps(0, count=4)

# ------------------------------------------------------------------------------
# 4. HIGH-ENERGY BREAKBEAT DRUM ARRANGEMENT
# ------------------------------------------------------------------------------
print("Arranging high-speed driving drums (160 BPM)...")

for bar in range(TOTAL_BARS):
    b_step = bar * 16
    is_buildup = (bar in [3, 19, 31, 47])
    
    # Sectional crash drops
    if bar in [0, 4, 12, 20, 28, 36, 44]:
        trigger_crash(int(b_step * SECONDS_PER_STEP * SAMPLE_RATE), 0.55)
        
    for st in range(16):
        cur_st = b_step + st
        s_idx = int(cur_st * SECONDS_PER_STEP * SAMPLE_RATE)
        if s_idx >= TOTAL_SAMPLES: break
        
        if is_buildup:
            # 32nd note snare roll crescendo
            sub_count = 2 if st >= 8 else 1
            for sub in range(sub_count):
                sub_samp = s_idx + int(sub * (SECONDS_PER_STEP / sub_count) * SAMPLE_RATE)
                roll_vol = 0.4 + 0.7 * (st / 16.0)
                mix_sample(sub_samp, snare_l, snare_r, roll_vol)
            if st % 4 == 0:
                mix_sample(s_idx, kick_l, kick_r, 1.1)
            trigger_hat(s_idx, is_open=(st % 2 == 1), vol=0.22)
            continue
            
        if bar < 2:
            # Simple kick pulse in very intro
            if st % 4 == 0:
                mix_sample(s_idx, kick_l, kick_r, 0.9)
            continue
            
        # Standard Driving Escape Breakbeat (Pizza Tower Syncopation)
        if st in [0, 6, 10]:
            mix_sample(s_idx, kick_l, kick_r, 1.15)
        elif st in [3, 14]:
            mix_sample(s_idx, kick_l, kick_r, 0.95)
            
        if st in [4, 12]:
            mix_sample(s_idx, snare_l, snare_r, 1.25)
        elif st in [7, 15]:
            mix_sample(s_idx, ghost_l, ghost_r, 0.6)
            
        is_open = (st in [2, 6, 10, 14])
        trigger_hat(s_idx, is_open=is_open, vol=0.22 if is_open else 0.16)

# ------------------------------------------------------------------------------
# 5. AGGRESSIVE SLAP BASSLINE (Em / C / G / D Progression)
# ------------------------------------------------------------------------------
print("Synthesizing driving slap bass...")

def add_bass_note(step, midi_p, dur_st):
    start_s = int(step * SECONDS_PER_STEP * SAMPLE_RATE)
    dur_s = int(dur_st * SECONDS_PER_STEP * SAMPLE_RATE) + int(0.04 * SAMPLE_RATE)
    f0 = midi_to_freq(midi_p - 12)
    for i in range(dur_s):
        idx = start_s + i
        if idx >= TOTAL_SAMPLES: break
        t = i / SAMPLE_RATE
        h1 = math.sin(2 * math.pi * f0 * t) * math.exp(-7.0 * t)
        h2 = math.sin(2 * math.pi * 2 * f0 * t) * 0.7 * math.exp(-11.0 * t)
        click = math.exp(-110.0 * t) * math.sin(2 * math.pi * 900 * t) * 0.4
        sample = math.tanh((h1 + h2 + click) * 1.3) * 0.38
        left_buffer[idx] += sample * 0.95
        right_buffer[idx] += sample * 0.95

# 4-bar phrase bass patterns (Em -> C/G -> Em -> C D Em stabs)
for b in range(2, TOTAL_BARS, 4):
    add_bass_note((b+0)*16 + 0, 40, 2)   # E1
    add_bass_note((b+0)*16 + 3, 52, 2)   # E2
    add_bass_note((b+0)*16 + 6, 40, 2)
    add_bass_note((b+0)*16 + 10, 43, 2)  # G1
    add_bass_note((b+0)*16 + 12, 45, 2)  # A1
    add_bass_note((b+0)*16 + 14, 47, 2)  # B1
    
    add_bass_note((b+1)*16 + 0, 36, 4)   # C1
    add_bass_note((b+1)*16 + 4, 48, 2)   # C2
    add_bass_note((b+1)*16 + 8, 43, 4)   # G1
    add_bass_note((b+1)*16 + 12, 47, 4)  # B1
    
    add_bass_note((b+2)*16 + 0, 40, 3)   # E1
    add_bass_note((b+2)*16 + 4, 52, 2)   # E2
    add_bass_note((b+2)*16 + 8, 40, 2)
    add_bass_note((b+2)*16 + 12, 43, 4)  # G1
    
    add_bass_note((b+3)*16 + 0, 36, 3)   # C1
    add_bass_note((b+3)*16 + 4, 38, 3)   # D1
    add_bass_note((b+3)*16 + 8, 40, 4)   # E1
    add_bass_note((b+3)*16 + 12, 40, 4)  # E1

# ------------------------------------------------------------------------------
# 6. RENDER USER'S EXACT MELODY (WITH VIBRATO) AS PROMINENT MAIN LEAD
# ------------------------------------------------------------------------------
print("Synthesizing User's Main Melody across all sections (loud & clear!)...")

# Function to render a note with combined SM64 sample_34 + Bright Cartoon Synth Lead
def render_main_melody_note(cur_t, midi_pitch, dur_sec, has_vib, vol=0.48):
    start_s = int(cur_t * SAMPLE_RATE)
    dur_s = int(dur_sec * SAMPLE_RATE)
    rel_s = int(0.045 * SAMPLE_RATE)
    tot_s = dur_s + rel_s
    
    base_f = midi_to_freq(midi_pitch)
    phase_synth = 0.0
    pos_sm64 = 0.0
    
    for i in range(tot_s):
        idx = start_s + i
        if idx >= TOTAL_SAMPLES: break
        t = i / SAMPLE_RATE
        
        # Envelope: snappy attack & smooth release
        if t < 0.006:
            env = t / 0.006
        elif t < dur_sec:
            env = 1.0 - 0.06 * (t / dur_sec)
        else:
            env = max(0.0, 0.94 * ((dur_sec + rel_s - t) / rel_s))
            
        # Expressive Vibrato!
        vib_semitones = 0.0
        if has_vib:
            # 6.2 Hz vibrato, smoothly ramping up depth on sustained notes
            ramp = min(1.0, max(0.0, (t - 0.025) / 0.10))
            vib_semitones = math.sin(2 * math.pi * 6.2 * t) * (0.65 * ramp)
        elif t > 0.12:
            vib_semitones = math.sin(2 * math.pi * 5.8 * t) * 0.15
            
        # 1. SM64 sample_34 oscillator
        cur_pitch = midi_pitch + vib_semitones
        step_sz = (2.0 ** ((cur_pitch - s34_root) / 12.0)) * (s34_sr / float(SAMPLE_RATE))
        if pos_sm64 >= s34_lend:
            pos_sm64 = s34_lstart + ((pos_sm64 - s34_lstart) % (s34_lend - s34_lstart))
        idx0 = int(pos_sm64)
        idx1 = idx0 + 1 if idx0 + 1 < s34_len else s34_lstart
        frac = pos_sm64 - idx0
        sm64_val = (s34_data[idx0] * (1.0 - frac) + s34_data[idx1] * frac)
        pos_sm64 += step_sz
        
        # 2. Bright Cartoon Synth Lead oscillator (adds bite & cutting presence)
        cur_f = base_f * (2.0 ** (vib_semitones / 12.0))
        phase_synth += 2 * math.pi * cur_f / SAMPLE_RATE
        saw = 2.0 * ((phase_synth / (2*math.pi)) % 1.0) - 1.0
        sq = 1.0 if (phase_synth % (2*math.pi)) < math.pi else -1.0
        synth_val = (saw * 0.55 + sq * 0.45)
        
        # Blended lead sample (60% SM64 sample_34 + 40% Cartoon Synth)
        lead_sample = (sm64_val * 0.60 + synth_val * 0.40) * env * vol
        
        left_buffer[idx] += lead_sample * 0.95
        right_buffer[idx] += lead_sample * 0.95
        
        # Stereo Tape Echo (echoes 0.1875s later)
        echo_idx = idx + int(0.1875 * SAMPLE_RATE)
        if echo_idx < TOTAL_SAMPLES:
            left_buffer[echo_idx] += lead_sample * 0.18
            right_buffer[echo_idx] += lead_sample * 0.14

# Render user's melody continuously across the entire track!
# Starts right after the 2-bar intro (Bar 2 = 3.0s) and runs through the entire 72 seconds!
# 11 full repetitions of Part 1 & Part 2:
# Rep 0-1 (Bars 2-9): Main Melody Entrance (clear & prominent, mid octave)
# Rep 2-3 (Bars 10-17): Melody with twin harmony stabs
# Rep 4-5 (Bars 18-25): High-register scream lead (+1 octave)
# Rep 6-7 (Bars 26-33): Melody over soaring breakbeat drive
# Rep 8-9 (Bars 34-41): Twin octaves (stacked!)
# Rep 10 (Bars 42-45): Grand Finale!

rep_count = 11
start_bar = 2

for rep in range(rep_count):
    cur_t = (start_bar + rep * 4) * 4.0 * SECONDS_PER_BEAT
    if cur_t >= TOTAL_SECONDS - 2.0: break
    
    # Octave variations across sections
    oct_shift = 0
    if rep in [4, 5, 8, 9, 10]:
        oct_shift = 1 # Octave up for climax!
        
    for phrase in [PART1, PART2]:
        for kind, note, dur_s, has_vib in phrase:
            if kind == 'note':
                render_main_melody_note(cur_t, note + oct_shift * 12, dur_s, has_vib, vol=0.46)
                # If grand climax, add sub-octave layer for huge wall of sound
                if rep in [8, 9, 10]:
                    render_main_melody_note(cur_t, note, dur_s, has_vib, vol=0.28)
            cur_t += dur_s

# ------------------------------------------------------------------------------
# 7. MASTERING, ANALOG LIMITER & SEAMLESS LOOP CROSSFADE
# ------------------------------------------------------------------------------
print("Mastering audio (analog saturation & seamless loop crossfade)...")

CROSSFADE = 2500
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
        l = max(-0.98, min(0.98, math.tanh(left_buffer[i] * gain * 1.04)))
        r = max(-0.98, min(0.98, math.tanh(right_buffer[i] * gain * 1.04)))
        frames.extend(struct.pack('<hh', int(l * 32767.0), int(r * 32767.0)))
    wav.writeframes(frames)

# Overwrite mu_breakingnews.wav and mu_pizzatime.wav too!
shutil.copyfile('music/mu_escape.wav', 'music/mu_breakingnews.wav')
shutil.copyfile('music/mu_escape.wav', 'music/mu_pizzatime.wav')

print(f"=== Escape Masterpiece Generated in {time.time() - t_start:.2f}s! ===")
print(f"Saved: {output_wav} ({TOTAL_SECONDS:.2f}s, {len(frames)} bytes)")
