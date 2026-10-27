import math
import struct
import wave
import random
import os

SAMPLE_RATE = 44100
BPM = 160.0
SECONDS_PER_BEAT = 60.0 / BPM
TOTAL_SECONDS = 13.5
TOTAL_SAMPLES = int(TOTAL_SECONDS * SAMPLE_RATE)

def midi_to_freq(m):
    return 440.0 * (2.0 ** ((m - 69) / 12.0))

# User's exact Scratch melody
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
    ('note', 67, 0.4125, True),   # G4 with Vibrato!
    ('note', 64, 0.1500, False),  # E4
    ('note', 62, 0.1500, False),  # D4
    ('rest', 0,  0.0375, False),
    ('note', 62, 0.1500, True),   # D4 with Vibrato!
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

# Load SM64 sample_34
s34_path = 'sm64_samples/sample_34_Sample_8-3.wav'
with wave.open(s34_path, 'rb') as w:
    frames = w.readframes(w.getnframes())
    raw = struct.unpack(f'<{len(frames)//2}h', frames)
    s34_data = [s / 32768.0 for s in raw]
    s34_sr = w.getframerate()
    s34_len = len(s34_data)
    s34_lstart = 1313
    s34_lend = 1377
    s34_root = 72 # C5

# Load drum samples from mu_tutorial.wav
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

left = [0.0] * TOTAL_SAMPLES
right = [0.0] * TOTAL_SAMPLES

# Intro Snare Roll (0.0 to 1.5s)
for s in range(16):
    s_idx = int(s * (SECONDS_PER_BEAT / 4.0) * SAMPLE_RATE)
    vol = 0.3 + 0.7 * (s / 16.0)
    for i in range(len(snare_l)):
        idx = s_idx + i
        if idx >= TOTAL_SAMPLES: break
        left[idx] += snare_l[i] * vol
        right[idx] += snare_r[i] * vol
    if s % 4 == 0:
        for i in range(len(kick_l)):
            idx = s_idx + i
            if idx >= TOTAL_SAMPLES: break
            left[idx] += kick_l[i] * 1.0
            right[idx] += kick_r[i] * 1.0

# Drums across bars 1-8
sec_per_step = SECONDS_PER_BEAT / 4.0
for bar in range(1, 9):
    b_step = bar * 16
    for st in range(16):
        cur_st = b_step + st
        s_idx = int(cur_st * sec_per_step * SAMPLE_RATE)
        if s_idx >= TOTAL_SAMPLES: break
        
        # Crash on bar 1 and 5
        if st == 0 and (bar == 1 or bar == 5):
            dur_cr = int(1.5 * SAMPLE_RATE)
            for i in range(dur_cr):
                idx = s_idx + i
                if idx >= TOTAL_SAMPLES: break
                t = i / SAMPLE_RATE
                c_smp = (math.sin(2*math.pi*480*t) + (random.random()*2-1)*0.8) * math.exp(-2.8*t) * 0.45
                left[idx] += c_smp * 0.95
                right[idx] += c_smp * 1.05
                
        # Kicks
        if st in [0, 6, 10]:
            for i in range(len(kick_l)):
                idx = s_idx + i
                if idx >= TOTAL_SAMPLES: break
                left[idx] += kick_l[i] * 1.15
                right[idx] += kick_r[i] * 1.15
        elif st in [3, 14]:
            for i in range(len(kick_l)):
                idx = s_idx + i
                if idx >= TOTAL_SAMPLES: break
                left[idx] += kick_l[i] * 0.95
                right[idx] += kick_r[i] * 0.95
                
        # Snares
        if st in [4, 12]:
            for i in range(len(snare_l)):
                idx = s_idx + i
                if idx >= TOTAL_SAMPLES: break
                left[idx] += snare_l[i] * 1.25
                right[idx] += snare_r[i] * 1.25
        elif st in [7, 15]:
            for i in range(len(ghost_l)):
                idx = s_idx + i
                if idx >= TOTAL_SAMPLES: break
                left[idx] += ghost_l[i] * 0.6
                right[idx] += ghost_r[i] * 0.6
                
        # Hi-hats
        hat_dur = int(0.12 * SAMPLE_RATE) if (st in [2, 6, 10, 14]) else int(0.04 * SAMPLE_RATE)
        decay = 25.0 if (st in [2, 6, 10, 14]) else 80.0
        h_vol = 0.22 if (st in [2, 6, 10, 14]) else 0.16
        for i in range(hat_dur):
            idx = s_idx + i
            if idx >= TOTAL_SAMPLES: break
            t = i / SAMPLE_RATE
            val = (random.random() * 2 - 1) * math.exp(-decay * t) * h_vol
            left[idx] += val * 0.85
            right[idx] += val * 1.15

# Slap bass
def add_bass_note(step, midi_p, dur_st):
    start_s = int(step * sec_per_step * SAMPLE_RATE)
    dur_s = int(dur_st * sec_per_step * SAMPLE_RATE) + int(0.04 * SAMPLE_RATE)
    f0 = midi_to_freq(midi_p - 12)
    for i in range(dur_s):
        idx = start_s + i
        if idx >= TOTAL_SAMPLES: break
        t = i / SAMPLE_RATE
        h1 = math.sin(2 * math.pi * f0 * t) * math.exp(-7.0 * t)
        h2 = math.sin(2 * math.pi * 2 * f0 * t) * 0.7 * math.exp(-11.0 * t)
        click = math.exp(-110.0 * t) * math.sin(2 * math.pi * 900 * t) * 0.4
        sample = math.tanh((h1 + h2 + click) * 1.3) * 0.40
        left[idx] += sample * 0.95
        right[idx] += sample * 0.95

for rep in [1, 5]:
    add_bass_note((rep+0)*16 + 0, 40, 2)
    add_bass_note((rep+0)*16 + 3, 52, 2)
    add_bass_note((rep+0)*16 + 6, 40, 2)
    add_bass_note((rep+0)*16 + 10, 43, 2)
    add_bass_note((rep+0)*16 + 12, 45, 2)
    add_bass_note((rep+0)*16 + 14, 47, 2)
    add_bass_note((rep+1)*16 + 0, 36, 4)
    add_bass_note((rep+1)*16 + 4, 48, 2)
    add_bass_note((rep+1)*16 + 8, 43, 4)
    add_bass_note((rep+1)*16 + 12, 47, 4)
    add_bass_note((rep+2)*16 + 0, 40, 3)
    add_bass_note((rep+2)*16 + 4, 52, 2)
    add_bass_note((rep+2)*16 + 8, 40, 2)
    add_bass_note((rep+2)*16 + 12, 43, 4)
    add_bass_note((rep+3)*16 + 0, 36, 3)
    add_bass_note((rep+3)*16 + 4, 38, 3)
    add_bass_note((rep+3)*16 + 8, 40, 4)
    add_bass_note((rep+3)*16 + 12, 40, 4)

# Render SM64 sample_34 Lead for the user's melody
def render_sm64_note(cur_t, midi_pitch, dur_sec, has_vib, vol=0.35):
    start_s = int(cur_t * SAMPLE_RATE)
    dur_s = int(dur_sec * SAMPLE_RATE)
    rel_s = int(0.04 * SAMPLE_RATE)
    tot_s = dur_s + rel_s
    
    pos = 0.0
    for i in range(tot_s):
        idx = start_s + i
        if idx >= TOTAL_SAMPLES: break
        t = i / SAMPLE_RATE
        
        # Envelope
        if t < 0.005: env = t / 0.005
        elif t < dur_sec: env = 1.0 - 0.05 * (t / dur_sec)
        else: env = max(0.0, 0.95 * ((dur_sec + rel_s - t) / rel_s))
        
        # Vibrato
        vib = 0.0
        if has_vib:
            ramp = min(1.0, max(0.0, (t - 0.03) / 0.10))
            vib = math.sin(2 * math.pi * 6.2 * t) * (0.65 * ramp) # 0.65 semitones vibrato
            
        cur_pitch = midi_pitch + vib
        step_sz = (2.0 ** ((cur_pitch - s34_root) / 12.0)) * (s34_sr / float(SAMPLE_RATE))
        
        # Loop pos
        if pos >= s34_lend:
            pos = s34_lstart + ((pos - s34_lstart) % (s34_lend - s34_lstart))
        idx0 = int(pos)
        idx1 = idx0 + 1 if idx0 + 1 < s34_len else s34_lstart
        frac = pos - idx0
        sample_val = (s34_data[idx0] * (1.0 - frac) + s34_data[idx1] * frac) * env * vol
        
        left[idx] += sample_val * 0.95
        right[idx] += sample_val * 0.95
        
        # Stereo Echo
        echo = idx + int(0.1875 * SAMPLE_RATE)
        if echo < TOTAL_SAMPLES:
            left[echo] += sample_val * 0.18
            right[echo] += sample_val * 0.14
            
        pos += step_sz

# Render user's melody twice (Phrase 1 at 1.5s, Phrase 2 at 7.5s)
for rep_idx, st_time in enumerate([1.5, 7.5]):
    cur_t = st_time
    oct_shift = 1 if rep_idx == 1 else 0
    for phrase in [PART1, PART2]:
        for kind, note, dur_s, has_vib in phrase:
            if kind == 'note':
                render_sm64_note(cur_t, note + oct_shift * 12, dur_s, has_vib, vol=0.38)
            cur_t += dur_s

# Master & save
max_val = max(max(abs(x) for x in left), max(abs(x) for x in right), 0.001)
gain = 0.94 / max_val
out_path = 'music/test_escape_5_sm64_sample34.wav'
with wave.open(out_path, 'wb') as wav:
    wav.setnchannels(2)
    wav.setsampwidth(2)
    wav.setframerate(SAMPLE_RATE)
    frames = bytearray()
    for i in range(TOTAL_SAMPLES):
        l = max(-0.98, min(0.98, math.tanh(left[i] * gain * 1.05)))
        r = max(-0.98, min(0.98, math.tanh(right[i] * gain * 1.05)))
        frames.extend(struct.pack('<hh', int(l * 32767.0), int(r * 32767.0)))
    wav.writeframes(frames)

print(f"Generated SM64 sample_34 track: {out_path} ({TOTAL_SECONDS:.1f}s)")
