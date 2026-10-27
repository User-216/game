import math
import struct
import wave
import random
import os
import shutil

SAMPLE_RATE = 44100
BPM = 160.0
SECONDS_PER_BEAT = 60.0 / BPM  # 0.375s
TOTAL_SECONDS = 13.5  # ~13.5 seconds test track
TOTAL_SAMPLES = int(TOTAL_SECONDS * SAMPLE_RATE)

def midi_to_freq(m):
    return 440.0 * (2.0 ** ((m - 69) / 12.0))

# User's exact Scratch melody:
# Scratch notes with durations in seconds (at 80 BPM Scratch: 0.25 beat = 0.1875s)
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

# Load drum samples from source
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

def add_drums(left, right, style='breakbeat'):
    # Total bars: 9 bars (0 to 8: 0 is intro, 1-4 is phrase 1, 5-8 is phrase 2, bar 8 ends on big hit)
    total_bars = 9
    sec_per_step = SECONDS_PER_BEAT / 4.0
    
    for bar in range(total_bars):
        b_step = bar * 16
        for st in range(16):
            cur_st = b_step + st
            s_idx = int(cur_st * sec_per_step * SAMPLE_RATE)
            if s_idx >= TOTAL_SAMPLES: break
            
            # Crash cymbal on bar 1 and bar 5 downbeats
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
            if style == 'rock':
                if st in [0, 8, 10]:
                    mix_sample(left, right, s_idx, kick_l, kick_r, 1.25)
            else:
                if st in [0, 6, 10]:
                    mix_sample(left, right, s_idx, kick_l, kick_r, 1.15)
                elif st in [3, 14]:
                    mix_sample(left, right, s_idx, kick_l, kick_r, 0.95)
                    
            # Snares
            if st in [4, 12]:
                mix_sample(left, right, s_idx, snare_l, snare_r, 1.25)
            elif st in [7, 15] and style != 'rock':
                mix_sample(left, right, s_idx, ghost_l, ghost_r, 0.6)
                
            # Hi-hats
            hat_dur = int(0.04 * SAMPLE_RATE)
            is_open = (st in [2, 6, 10, 14]) and (style != 'rock')
            if is_open: hat_dur = int(0.12 * SAMPLE_RATE)
            decay = 25.0 if is_open else 80.0
            h_vol = 0.22 if is_open else 0.16
            for i in range(hat_dur):
                idx = s_idx + i
                if idx >= TOTAL_SAMPLES: break
                t = i / SAMPLE_RATE
                val = (random.random() * 2 - 1) * math.exp(-decay * t) * h_vol
                left[idx] += val * 0.85
                right[idx] += val * 1.15

def mix_sample(left, right, start_idx, smp_l, smp_r, vol=1.0):
    for i in range(len(smp_l)):
        idx = start_idx + i
        if idx >= TOTAL_SAMPLES: break
        left[idx] += smp_l[i] * vol
        right[idx] += smp_r[i] * vol

def add_bass(left, right, style='slap'):
    # 4 bars per phrase: Bar 1(Em), Bar 2(C->G), Bar 3(Em), Bar 4(C->D->Em)
    # Repeats across bars 1-4 and bars 5-8
    sec_per_step = SECONDS_PER_BEAT / 4.0
    for rep in [1, 5]:
        # Bar 1: Em
        render_bass_note(left, right, (rep+0)*16 + 0, 40, 2, style) # E1
        render_bass_note(left, right, (rep+0)*16 + 3, 52, 2, style) # E2
        render_bass_note(left, right, (rep+0)*16 + 6, 40, 2, style)
        render_bass_note(left, right, (rep+0)*16 + 10, 43, 2, style) # G1
        render_bass_note(left, right, (rep+0)*16 + 12, 45, 2, style) # A1
        render_bass_note(left, right, (rep+0)*16 + 14, 47, 2, style) # B1
        
        # Bar 2: C -> G
        render_bass_note(left, right, (rep+1)*16 + 0, 36, 4, style) # C1
        render_bass_note(left, right, (rep+1)*16 + 4, 48, 2, style) # C2
        render_bass_note(left, right, (rep+1)*16 + 8, 43, 4, style) # G1
        render_bass_note(left, right, (rep+1)*16 + 12, 47, 4, style) # B1
        
        # Bar 3: Em
        render_bass_note(left, right, (rep+2)*16 + 0, 40, 3, style)
        render_bass_note(left, right, (rep+2)*16 + 4, 52, 2, style)
        render_bass_note(left, right, (rep+2)*16 + 8, 40, 2, style)
        render_bass_note(left, right, (rep+2)*16 + 12, 43, 4, style)
        
        # Bar 4: C -> D -> Em stabs
        render_bass_note(left, right, (rep+3)*16 + 0, 36, 3, style) # C
        render_bass_note(left, right, (rep+3)*16 + 4, 38, 3, style) # D
        render_bass_note(left, right, (rep+3)*16 + 8, 40, 4, style) # E
        render_bass_note(left, right, (rep+3)*16 + 12, 40, 4, style) # E

def render_bass_note(left, right, step, midi_note, dur_steps, style):
    sec_per_step = SECONDS_PER_BEAT / 4.0
    start_samp = int(step * sec_per_step * SAMPLE_RATE)
    dur_samp = int(dur_steps * sec_per_step * SAMPLE_RATE) + int(0.04 * SAMPLE_RATE)
    f0 = midi_to_freq(midi_note - 12)
    
    for i in range(dur_samp):
        idx = start_samp + i
        if idx >= TOTAL_SAMPLES: break
        t = i / SAMPLE_RATE
        
        if style == 'rock':
            # Heavy fuzzy overdrive bass
            s = math.sin(2*math.pi*f0*t) + 0.6*math.sin(2*math.pi*2*f0*t) + 0.3*math.sin(2*math.pi*3*f0*t)
            env = math.exp(-4.5 * t)
            sample = math.tanh(s * env * 2.8) * 0.38
        else:
            # Slap bass with click
            h1 = math.sin(2 * math.pi * f0 * t) * math.exp(-7.0 * t)
            h2 = math.sin(2 * math.pi * 2 * f0 * t) * 0.7 * math.exp(-11.0 * t)
            click = math.exp(-110.0 * t) * math.sin(2 * math.pi * 900 * t) * 0.4
            sample = math.tanh((h1 + h2 + click) * 1.3) * 0.40
            
        left[idx] += sample * 0.95
        right[idx] += sample * 0.95

# ------------------------------------------------------------------------------
# RENDER FUNCTION FOR THE 4 STYLES
# ------------------------------------------------------------------------------
def generate_variant(name, lead_synth_func, bass_style='slap', drum_style='breakbeat', with_siren=False):
    left = [0.0] * TOTAL_SAMPLES
    right = [0.0] * TOTAL_SAMPLES
    
    # 1. Intro FX (0.0 to 1.5s = Bar 0)
    # Drum snare roll build up
    for s in range(16):
        s_idx = int(s * (SECONDS_PER_BEAT / 4.0) * SAMPLE_RATE)
        vol = 0.3 + 0.7 * (s / 16.0)
        mix_sample(left, right, s_idx, snare_l, snare_r, vol)
        if s % 4 == 0:
            mix_sample(left, right, s_idx, kick_l, kick_r, 1.0)
            
    # Siren in background if enabled
    if with_siren:
        for i in range(TOTAL_SAMPLES):
            t = i / SAMPLE_RATE
            freq = 1150.0 + 380.0 * math.sin(2 * math.pi * 2.8 * t)
            s_siren = math.sin(2 * math.pi * freq * t) * 0.08
            pan = 0.5 + 0.4 * math.sin(2 * math.pi * 1.2 * t)
            left[i] += s_siren * (1.0 - pan)
            right[i] += s_siren * pan
            
    # 2. Drums & Bass
    add_drums(left, right, style=drum_style)
    add_bass(left, right, style=bass_style)
    
    # 3. User Melody
    # Plays twice: First time (1.5s to 7.5s, Bars 1-4), Second time with extra punch/octave (7.5s to 13.5s, Bars 5-8)
    for rep_idx, start_time in enumerate([1.5, 7.5]):
        cur_t = start_time
        oct_shift = 1 if rep_idx == 1 and name != 'test_escape_3_arcade.wav' else 0
        
        for phrase in [PART1, PART2]:
            for kind, note, dur_s, has_vib in phrase:
                if kind == 'note':
                    f = midi_to_freq(note + oct_shift * 12)
                    lead_synth_func(left, right, cur_t, f, dur_s, has_vib, is_second_rep=(rep_idx == 1))
                cur_t += dur_s
                
    # 4. Master & Save
    max_val = max(max(abs(x) for x in left), max(abs(x) for x in right), 0.001)
    gain = 0.94 / max_val
    
    out_path = f'music/{name}'
    with wave.open(out_path, 'wb') as wav:
        wav.setnchannels(2)
        wav.setsampwidth(2)
        wav.setframerate(SAMPLE_RATE)
        frames = bytearray()
        for i in range(TOTAL_SAMPLES):
            l = left[i] * gain
            r = right[i] * gain
            l = max(-0.98, min(0.98, math.tanh(l * 1.05)))
            r = max(-0.98, min(0.98, math.tanh(r * 1.05)))
            frames.extend(struct.pack('<hh', int(l * 32767.0), int(r * 32767.0)))
        wav.writeframes(frames)
    print(f"Generated: {out_path} ({TOTAL_SECONDS:.1f}s)")

# ------------------------------------------------------------------------------
# SYNTH LEADS FOR THE 4 VARIANTS
# ------------------------------------------------------------------------------

# 1. CLASSIC CARTOON SYNTH (Pizza Tower 'It\'s Pizza Time' Lead)
def synth_classic(left, right, cur_time, base_freq, dur_s, has_vib, is_second_rep=False):
    start_samp = int(cur_time * SAMPLE_RATE)
    dur_samp = int(dur_s * SAMPLE_RATE)
    rel_samp = int(0.04 * SAMPLE_RATE)
    phase = 0.0
    vol = 0.28 if not is_second_rep else 0.32
    
    for i in range(dur_samp + rel_samp):
        idx = start_samp + i
        if idx >= TOTAL_SAMPLES: break
        t = i / SAMPLE_RATE
        
        # Attack / release
        env = (t / 0.008) if t < 0.008 else ((1.0 - 0.08*(t/dur_s)) if t < dur_s else max(0.0, 0.92*((dur_s + rel_samp - t)/rel_samp)))
        
        # Vibrato
        vib = 0.0
        if has_vib:
            ramp = min(1.0, max(0.0, (t - 0.03) / 0.12))
            vib = math.sin(2 * math.pi * 6.3 * t) * (base_freq * 0.034 * ramp)
        elif t > 0.12:
            vib = math.sin(2 * math.pi * 5.8 * t) * (base_freq * 0.008)
            
        phase += 2 * math.pi * (base_freq + vib) / SAMPLE_RATE
        saw = 2.0 * ((phase / (2*math.pi)) % 1.0) - 1.0
        sq = 1.0 if (phase % (2*math.pi)) < math.pi else -1.0
        sample = (saw * 0.58 + sq * 0.38) * env * vol
        
        left[idx] += sample * 0.95
        right[idx] += sample * 0.95
        # Echo
        echo = idx + int(0.1875 * SAMPLE_RATE)
        if echo < TOTAL_SAMPLES:
            left[echo] += sample * 0.18
            right[echo] += sample * 0.14

# 2. OVERDRIVE ROCK GUITAR (Distorted electric guitar with singing finger vibrato)
def synth_rock(left, right, cur_time, base_freq, dur_s, has_vib, is_second_rep=False):
    start_samp = int(cur_time * SAMPLE_RATE)
    dur_samp = int(dur_s * SAMPLE_RATE)
    rel_samp = int(0.06 * SAMPLE_RATE)
    phase1 = 0.0
    phase2 = 0.0
    vol = 0.30
    
    for i in range(dur_samp + rel_samp):
        idx = start_samp + i
        if idx >= TOTAL_SAMPLES: break
        t = i / SAMPLE_RATE
        env = (t / 0.006) if t < 0.006 else math.exp(-2.8 * (t - 0.006))
        
        vib = 0.0
        if has_vib:
            # Expressive rock finger vibrato (7.2 Hz, wide)
            ramp = min(1.0, max(0.0, (t - 0.02) / 0.10))
            vib = math.sin(2 * math.pi * 7.2 * t) * (base_freq * 0.045 * ramp)
            
        cur_f = base_freq + vib
        phase1 += 2 * math.pi * cur_f / SAMPLE_RATE
        phase2 += 2 * math.pi * (cur_f * 1.006) / SAMPLE_RATE
        
        # Heavy overdrive saturation
        raw = math.sin(phase1) + 0.7 * math.sin(phase2) + 0.4 * math.sin(phase1 * 2)
        dist = math.tanh(raw * 3.5) * env * vol
        
        left[idx] += dist * 0.9
        right[idx] += dist * 1.05

# 3. SCRATCH PIANO & ARCADE CHIPTUNE (Scratch sound & 8-bit charm)
def synth_arcade(left, right, cur_time, base_freq, dur_s, has_vib, is_second_rep=False):
    start_samp = int(cur_time * SAMPLE_RATE)
    dur_samp = int(dur_s * SAMPLE_RATE)
    rel_samp = int(0.08 * SAMPLE_RATE)
    phase = 0.0
    vol = 0.32
    
    for i in range(dur_samp + rel_samp):
        idx = start_samp + i
        if idx >= TOTAL_SAMPLES: break
        t = i / SAMPLE_RATE
        # Piano hammer percussive strike + warm decay
        env = (t / 0.004) if t < 0.004 else math.exp(-5.2 * (t - 0.004))
        
        vib = 0.0
        if has_vib:
            # Gentle retro wobble vibrato
            vib = math.sin(2 * math.pi * 6.0 * t) * (base_freq * 0.026)
            
        phase += 2 * math.pi * (base_freq + vib) / SAMPLE_RATE
        # Piano/Square blended harmonics
        h1 = math.sin(phase)
        h2 = 0.5 * math.sin(2 * phase)
        h3 = 0.25 * math.sin(3 * phase)
        sq = 0.3 * (1.0 if (phase % (2*math.pi)) < math.pi else -1.0)
        sample = (h1 + h2 + h3 + sq) * env * vol
        
        left[idx] += sample * 0.95
        right[idx] += sample * 0.95

# 4. BIG-BAND BRASS & EMERGENCY SIREN (Piercing brass stabs with horn vibrato)
def synth_brass(left, right, cur_time, base_freq, dur_s, has_vib, is_second_rep=False):
    start_samp = int(cur_time * SAMPLE_RATE)
    dur_samp = int(dur_s * SAMPLE_RATE)
    rel_samp = int(0.05 * SAMPLE_RATE)
    p1 = 0.0
    p2 = 0.0
    vol = 0.26
    
    for i in range(dur_samp + rel_samp):
        idx = start_samp + i
        if idx >= TOTAL_SAMPLES: break
        t = i / SAMPLE_RATE
        env = (t / 0.012) if t < 0.012 else ((1.0 - 0.1*(t/dur_s)) if t < dur_s else max(0.0, 0.9*((dur_s + rel_samp - t)/rel_samp)))
        
        vib = 0.0
        if has_vib:
            ramp = min(1.0, max(0.0, (t - 0.04) / 0.12))
            vib = math.sin(2 * math.pi * 6.0 * t) * (base_freq * 0.038 * ramp)
            
        cur_f = base_freq + vib
        p1 += 2 * math.pi * cur_f / SAMPLE_RATE
        p2 += 2 * math.pi * (cur_f * 1.005) / SAMPLE_RATE
        
        b1 = 2.0 * ((p1 / (2*math.pi)) % 1.0) - 1.0
        b2 = 2.0 * ((p2 / (2*math.pi)) % 1.0) - 1.0
        sample = (b1 + b2) * 0.5 * env * vol
        
        left[idx] += sample * 0.95
        right[idx] += sample * 0.95

# ------------------------------------------------------------------------------
# RUN GENERATION FOR ALL 4 VARIANTS
# ------------------------------------------------------------------------------
print("\n--- Generating 4 Test Variations for User to Compare ---")
generate_variant('test_escape_1_classic.wav', synth_classic, bass_style='slap', drum_style='breakbeat', with_siren=False)
generate_variant('test_escape_2_rock.wav', synth_rock, bass_style='rock', drum_style='rock', with_siren=False)
generate_variant('test_escape_3_arcade.wav', synth_arcade, bass_style='slap', drum_style='breakbeat', with_siren=False)
generate_variant('test_escape_4_brass.wav', synth_brass, bass_style='slap', drum_style='breakbeat', with_siren=True)

print("\nAll 4 test variations generated successfully!")
