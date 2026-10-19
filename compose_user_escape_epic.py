import math
import struct
import wave
import random
import os
import shutil
import time
import array

t_start = time.time()

SAMPLE_RATE = 44100
TOTAL_SECONDS = 200.0  # Exactly 3 minutes 20 seconds!
TOTAL_SAMPLES = int(TOTAL_SECONDS * SAMPLE_RATE)

print(f"=== Composing Epic Custom Escape Track (Distortion/Overdrive Guitar + Sirens + Clock + Dynamic Tempo) ===")
print(f"Total Duration: {TOTAL_SECONDS:.2f}s | Sample Rate: {SAMPLE_RATE} Hz | Total Samples: {TOTAL_SAMPLES}")

# Buffers for left and right channels
left_buf = [0.0] * TOTAL_SAMPLES
right_buf = [0.0] * TOTAL_SAMPLES

# ------------------------------------------------------------------------------
# 1. MUSICAL & NOTE UTILITIES
# ------------------------------------------------------------------------------
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
# 2. REAL PUNCHY ACOUSTIC DRUM EXTRACTOR
# ------------------------------------------------------------------------------
print("Loading real punchy drum samples...")
src_wav = 'music/mu_tutorial.wav'
with wave.open(src_wav, 'rb') as w:
    src_sr = w.getframerate()
    src_frames = w.readframes(src_sr * 8)
    src_samples = struct.unpack('<' + 'h' * (len(src_frames) // 2), src_frames)
    src_l = [src_samples[i*2] / 32768.0 for i in range(len(src_samples) // 2)]
    src_r = [src_samples[i*2+1] / 32768.0 for i in range(len(src_samples) // 2)]

def extract_drum(start_s, dur_s, fade_out=0.03):
    start_i = int(start_s * src_sr)
    dur_i = int(dur_s * src_sr)
    fade_i = int(fade_out * src_sr)
    out_l = []
    out_r = []
    for i in range(dur_i):
        idx = start_i + i
        if idx >= len(src_l): break
        env = (dur_i - i) / float(fade_i) if i >= dur_i - fade_i else 1.0
        out_l.append(src_l[idx] * env)
        out_r.append(src_r[idx] * env)
    return out_l, out_r

kick_l, kick_r = extract_drum(2.305, 0.28, fade_out=0.04)
snare_l, snare_r = extract_drum(2.665, 0.28, fade_out=0.05)
ghost_l, ghost_r = extract_drum(2.850, 0.12, fade_out=0.03)

def play_drum(start_samp, smp_l, smp_r, vol=1.0, pan=0.5):
    l_vol = vol * (1.0 - pan * 0.5)
    r_vol = vol * (0.5 + pan * 0.5)
    for i in range(len(smp_l)):
        idx = start_samp + i
        if idx >= TOTAL_SAMPLES: break
        left_buf[idx] += smp_l[i] * l_vol
        right_buf[idx] += smp_r[i] * r_vol

def play_hat(start_samp, is_open=False, vol=0.22, pan=0.6):
    dur = int((0.18 if is_open else 0.045) * SAMPLE_RATE)
    decay = 20.0 if is_open else 75.0
    for i in range(dur):
        idx = start_samp + i
        if idx >= TOTAL_SAMPLES: break
        t = i / SAMPLE_RATE
        n = (random.random() * 2 - 1) * math.exp(-decay * t) * vol
        left_buf[idx] += n * (1.0 - pan * 0.5)
        right_buf[idx] += n * (0.5 + pan * 0.5)

def play_crash(start_samp, vol=0.6, pan=0.5):
    dur = int(2.2 * SAMPLE_RATE)
    for i in range(dur):
        idx = start_samp + i
        if idx >= TOTAL_SAMPLES: break
        t = i / SAMPLE_RATE
        metallic = (math.sin(2*math.pi*480*t) + math.sin(2*math.pi*710*t) + math.sin(2*math.pi*950*t) + math.sin(2*math.pi*1280*t)) * 0.22
        noise = (random.random() * 2 - 1) * 0.78
        sample = (metallic + noise) * math.exp(-2.2 * t) * vol
        left_buf[idx] += sample * (1.0 - pan * 0.4)
        right_buf[idx] += sample * (0.6 + pan * 0.4)

# ------------------------------------------------------------------------------
# 3. MECHANICAL CLOCK SOUND (TICK-TOCK)
# ------------------------------------------------------------------------------
print("Preparing mechanical clock ticks & escapement sound...")

def make_clock_tick_sample(is_tock=False):
    dur = int(0.04 * SAMPLE_RATE)
    freq_metal = 2500 if is_tock else 3300
    freq_body = 680 if is_tock else 880
    samples = []
    for i in range(dur):
        t = i / SAMPLE_RATE
        click = (random.random() * 2 - 1) * math.exp(-650.0 * t)
        metal = math.sin(2 * math.pi * freq_metal * t) * math.exp(-240.0 * t)
        body = math.sin(2 * math.pi * freq_body * t) * math.exp(-100.0 * t)
        samples.append((click * 0.45 + metal * 0.4 + body * 0.3) * 0.38)
    return samples

clock_tick_smp = make_clock_tick_sample(False)
clock_tock_smp = make_clock_tick_sample(True)

def play_clock(start_samp, is_tock=False, vol=1.0, pan=0.5):
    smp = clock_tock_smp if is_tock else clock_tick_smp
    for i in range(len(smp)):
        idx = start_samp + i
        if idx >= TOTAL_SAMPLES: break
        s = smp[i] * vol
        left_buf[idx] += s * (1.0 - pan * 0.4)
        right_buf[idx] += s * (0.6 + pan * 0.4)

# ------------------------------------------------------------------------------
# 4. EMERGENCY DOPPLER SIREN
# ------------------------------------------------------------------------------
print("Synthesizing emergency wailing sirens...")

def add_siren(start_samp, dur_samp, base_f=850.0, sweep_f=420.0, sweep_rate=2.8, vol=0.15, pan_center=0.5):
    phase1 = random.random() * 2 * math.pi
    phase2 = random.random() * 2 * math.pi
    for i in range(dur_samp):
        idx = start_samp + i
        if idx >= TOTAL_SAMPLES: break
        t = i / SAMPLE_RATE
        # Envelope: smooth fade in and out
        fade_in = min(1.0, t / 0.3)
        fade_out = min(1.0, (dur_samp - i) / (0.4 * SAMPLE_RATE))
        env = fade_in * fade_out * vol
        
        # Dual detuned swept siren
        cur_f = base_f + sweep_f * math.sin(2 * math.pi * sweep_rate * t)
        phase1 += 2 * math.pi * cur_f / SAMPLE_RATE
        phase2 += 2 * math.pi * (cur_f * 1.008) / SAMPLE_RATE
        
        s1 = math.sin(phase1)
        s2 = math.sin(phase2)
        sample = (s1 + s2) * 0.5 * env
        
        # Doppler stereo movement
        pan = pan_center + 0.35 * math.sin(2 * math.pi * 0.8 * t)
        pan = max(0.05, min(0.95, pan))
        left_buf[idx] += sample * (1.0 - pan)
        right_buf[idx] += sample * pan

# ------------------------------------------------------------------------------
# 5. KARPLUS-STRONG PHYSICAL GUITAR STRING SYNTHESIS
# ------------------------------------------------------------------------------
print("Building Karplus-Strong string engine for Distortion & Overdrive Guitars...")

def synth_guitar_string(f0, dur_s, damping=0.994, brightness=0.65, vibrato_speed=0.0, vibrato_depth=0.0, vibrato_delay=0.15):
    """
    Physical modeling of plucked steel guitar string with pickup comb-filtering and vibrato.
    """
    if f0 <= 10.0:
        return [0.0] * int(dur_s * SAMPLE_RATE)
        
    nominal_period = int(SAMPLE_RATE / f0)
    if nominal_period < 2: nominal_period = 2
    
    # Pick strike noise burst (string excitation)
    noise_burst = [(random.random() * 2 - 1) for _ in range(nominal_period)]
    for i in range(1, nominal_period):
        noise_burst[i] = noise_burst[i] * brightness + noise_burst[i-1] * (1.0 - brightness)
        
    n_samples = int(dur_s * SAMPLE_RATE)
    out = [0.0] * n_samples
    ring_buf = list(noise_burst)
    p = 0
    prev = 0.0
    
    # Dual pickup comb filter delay (simulates bridge + neck pickup distance)
    pickup_delay = max(1, int(nominal_period * 0.18))
    
    for i in range(n_samples):
        # String physics with low-pass damping
        cur_val = ring_buf[p]
        filtered = (cur_val + prev) * 0.5 * damping
        prev = cur_val
        ring_buf[p] = filtered
        
        # Pickup mix (fundamental + comb harmonic response)
        pickup_pos = (p - pickup_delay) % nominal_period
        string_out = cur_val * 0.7 + ring_buf[pickup_pos] * 0.3
        
        out[i] = string_out
        p = (p + 1) % nominal_period
        
    # Optional dynamic vibrato (singer/lead guitar vibrato starting after delay)
    if vibrato_depth > 0.0 and vibrato_speed > 0.0:
        vib_out = [0.0] * n_samples
        delay_samp = int(vibrato_delay * SAMPLE_RATE)
        for i in range(n_samples):
            t = i / SAMPLE_RATE
            if i < delay_samp:
                depth = 0.0
            else:
                depth = min(vibrato_depth, vibrato_depth * ((i - delay_samp) / (0.25 * SAMPLE_RATE)))
            mod = depth * math.sin(2 * math.pi * vibrato_speed * t)
            read_idx = i - mod * (SAMPLE_RATE / 1000.0)
            i0 = int(read_idx)
            i1 = i0 + 1
            frac = read_idx - i0
            if 0 <= i0 and i1 < n_samples:
                vib_out[i] = out[i0] * (1.0 - frac) + out[i1] * frac
            else:
                vib_out[i] = out[i] if 0 <= i < n_samples else 0.0
        return vib_out
        
    return out

# ------------------------------------------------------------------------------
# 6. DISTORTION RHYTHM GUITAR (Power Chords, Palm Mutes, Cabinet Filter)
# ------------------------------------------------------------------------------
print("Synthesizing Distortion Guitar (High-Gain Rhythm Chugs & Power Chords)...")

def play_distortion_power_chord(start_samp, root_note, dur_s, is_palm_mute=False, vol=0.8, pan=0.35):
    """
    Renders high-gain distortion power chord (Root + 5th + Octave) with Marshall-style
    asymmetric diode clipping and 4x12 cabinet filtering.
    """
    f_root = note_to_freq(root_note)
    f_5th = f_root * (1.5)  # Perfect 5th
    f_oct = f_root * 2.0    # Octave
    
    damping = 0.965 if is_palm_mute else 0.995
    brightness = 0.45 if is_palm_mute else 0.75
    chord_dur = min(dur_s, 0.18 if is_palm_mute else dur_s)
    
    # 3-string power chord
    s1 = synth_guitar_string(f_root, chord_dur + 0.05, damping=damping, brightness=brightness)
    s2 = synth_guitar_string(f_5th, chord_dur + 0.05, damping=damping, brightness=brightness)
    s3 = synth_guitar_string(f_oct, chord_dur + 0.05, damping=damping, brightness=brightness)
    
    n_s = min(len(s1), len(s2), len(s3))
    
    # Marshall high-gain tube distortion + asymmetric diode clipping
    GAIN = 11.0 if not is_palm_mute else 14.0
    
    # 2-pole Cabinet Low-Pass (4.2 kHz) + High-Pass (85 Hz)
    lp1 = 0.0
    lp2 = 0.0
    hp = 0.0
    
    for i in range(n_s):
        idx = start_samp + i
        if idx >= TOTAL_SAMPLES: break
        
        # Raw summed string signal
        raw = s1[i] * 0.5 + s2[i] * 0.35 + s3[i] * 0.3
        
        # Pre-emphasis high-pass (cuts sub-rumble before distortion)
        hp += 0.92 * (raw - hp)
        dist_in = (raw - hp * 0.5) * GAIN
        
        # Asymmetrical tube/diode distortion
        if dist_in >= 0:
            clipped = math.tanh(dist_in)
        else:
            clipped = math.tanh(dist_in * 0.85) / (1.0 + 0.25 * abs(dist_in))
            
        # Cabinet filtering: removes fizz above 4.2 kHz and enhances punch
        lp1 += 0.36 * (clipped - lp1)
        lp2 += 0.36 * (lp1 - lp2)
        
        sample = lp2 * vol * 0.38
        
        # Stereo panning
        left_buf[idx] += sample * (1.0 - pan * 0.5)
        right_buf[idx] += sample * (0.5 + pan * 0.5)

# ------------------------------------------------------------------------------
# 7. OVERDRIVEN LEAD GUITAR (Singing Solos, Bends, Vibrato, Stereo Delay)
# ------------------------------------------------------------------------------
print("Synthesizing Overdriven Guitar (Searing Leads, Vibrato & Solos)...")

def play_overdrive_lead_note(start_samp, note_str, dur_s, vol=0.75, pan=0.65, vibrato=True):
    """
    Renders overdriven singing lead guitar with soft tube saturation, expressive vibrato,
    and a stereo ambient delay tap.
    """
    f0 = note_to_freq(note_str)
    if f0 <= 0: return
    
    vib_depth = 2.4 if vibrato else 0.0
    vib_speed = 5.6 if vibrato else 0.0
    
    s = synth_guitar_string(f0, dur_s + 0.1, damping=0.996, brightness=0.72,
                            vibrato_speed=vib_speed, vibrato_depth=vib_depth, vibrato_delay=0.14)
    
    n_s = len(s)
    GAIN = 6.5
    
    # Speaker cabinet filter for lead guitar (4.8 kHz lowpass, 110 Hz highpass)
    lp = 0.0
    hp = 0.0
    
    # Delay tap parameters (180ms delay)
    delay_samples = int(0.18 * SAMPLE_RATE)
    delay_vol = 0.32
    
    for i in range(n_s):
        idx = start_samp + i
        if idx >= TOTAL_SAMPLES: break
        
        raw = s[i] * GAIN
        # Soft tube overdrive saturation
        sat = raw / math.sqrt(1.0 + 0.35 * raw * raw)
        
        # Cabinet smooth filter
        lp += 0.42 * (sat - lp)
        sample = lp * vol * 0.35
        
        # Direct sound (panned)
        left_buf[idx] += sample * (1.0 - pan * 0.6)
        right_buf[idx] += sample * (0.4 + pan * 0.6)
        
        # Stereo delay tap (echo on opposite ear)
        d_idx = idx + delay_samples
        if d_idx < TOTAL_SAMPLES:
            left_buf[d_idx] += sample * delay_vol * (pan)
            right_buf[d_idx] += sample * delay_vol * (1.0 - pan)

# ------------------------------------------------------------------------------
# 8. ROCK BASS ENGINE (Doubling Power Chords for Low-End Punch)
# ------------------------------------------------------------------------------
def play_rock_bass(start_samp, note_str, dur_s, vol=0.55):
    f0 = note_to_freq(note_str)
    if f0 <= 0: return
    dur_samp = int(dur_s * SAMPLE_RATE)
    for i in range(dur_samp):
        idx = start_samp + i
        if idx >= TOTAL_SAMPLES: break
        t = i / SAMPLE_RATE
        h1 = math.sin(2 * math.pi * f0 * t) * math.exp(-3.5 * t)
        h2 = math.sin(2 * math.pi * 2 * f0 * t) * 0.6 * math.exp(-6.0 * t)
        h3 = math.sin(2 * math.pi * 3 * f0 * t) * 0.3 * math.exp(-9.0 * t)
        sample = math.tanh((h1 + h2 + h3) * 2.2) * vol * 0.35
        left_buf[idx] += sample * 0.5
        right_buf[idx] += sample * 0.5

# ------------------------------------------------------------------------------
# 9. COMPOSING THE 7 DYNAMIC PROGRESSIVE SECTIONS (NO REPETITIVE LOOPS!)
# ------------------------------------------------------------------------------
print("Arranging 200-second journey across 7 dynamic narrative sections...")

# We will build a continuous beat/step tracker.
# Section 1: Intro (0s - 28s) @ 130 BPM
# Section 2: Distortion Drop (28s - 58s) @ 155 BPM
# Section 3: High-Voltage Solo (58s - 92s) @ 165 BPM
# Section 4: Desperate Climax (92s - 125s) @ 175 BPM
# Section 5: Accelerando Phase 1 (125s - 158s) @ 175 -> 205 BPM
# Section 6: Hyper-Speed Overdrive (158s - 184s) @ 205 -> 240+ BPM
# Section 7: Slow-Motion Breakdown (184s - 200s) @ 240 -> 85 BPM

# ==============================================================================
# SECTION 1: 긴장감 있는 인트로 (Tension, Ticking Clock & Distant Siren) [0.0s - 28.0s]
# ==============================================================================
print("  -> Section 1: Tension, Ticking Clock & Distant Siren (130 BPM)...")
SEC1_START = 0.0
SEC1_END = 28.0
BPM_SEC1 = 130.0
SPB_1 = 60.0 / BPM_SEC1  # Seconds per beat: ~0.4615s

# 1. Ticking clock on EVERY beat throughout Intro!
cur_t = SEC1_START
tick_count = 0
while cur_t < SEC1_END - 0.5:
    s_idx = int(cur_t * SAMPLE_RATE)
    is_tock = (tick_count % 2 == 1)
    # Clock gets slightly louder and more urgent towards the end of intro
    c_vol = 0.65 + 0.35 * (cur_t / SEC1_END)
    play_clock(s_idx, is_tock=is_tock, vol=c_vol, pan=0.48)
    cur_t += SPB_1
    tick_count += 1

# 2. Distant emergency sirens echoing
add_siren(int(3.0 * SAMPLE_RATE), int(7.0 * SAMPLE_RATE), base_f=820, sweep_f=350, sweep_rate=2.2, vol=0.12, pan_center=0.3)
add_siren(int(12.0 * SAMPLE_RATE), int(8.0 * SAMPLE_RATE), base_f=900, sweep_f=400, sweep_rate=2.6, vol=0.16, pan_center=0.7)
add_siren(int(22.0 * SAMPLE_RATE), int(6.0 * SAMPLE_RATE), base_f=1000, sweep_f=450, sweep_rate=3.2, vol=0.22, pan_center=0.5)

# 3. Dark arpeggiated Overdrive Guitar melody in D minor
INTRO_GUITAR_RIFF = [
    # (beat_offset, note, dur_beats)
    (0, 'D3', 1.0), (1, 'F3', 1.0), (2, 'A3', 1.0), (3, 'D4', 1.0),
    (4, 'C4', 1.0), (5, 'A3', 1.0), (6, 'F3', 1.0), (7, 'D3', 1.0),
    (8, 'Bb2', 1.0), (9, 'D3', 1.0), (10, 'F3', 1.0), (11, 'Bb3', 1.0),
    (12, 'A3', 1.0), (13, 'F3', 1.0), (14, 'E3', 1.0), (15, 'C#3', 1.0),
    
    (16, 'D3', 1.0), (17, 'F3', 1.0), (18, 'A3', 1.0), (19, 'D4', 1.5),
    (20.5, 'C4', 0.5), (21, 'D4', 1.0), (22, 'F4', 1.0), (23, 'E4', 1.0),
    (24, 'D4', 1.0), (25, 'C4', 1.0), (26, 'Bb3', 1.0), (27, 'A3', 1.0),
    (28, 'G3', 1.0), (29, 'F3', 1.0), (30, 'E3', 1.0), (31, 'C#3', 1.0),
    
    # Tension build-up chords (Bars 8-14)
    (32, 'D3', 2.0), (34, 'F3', 2.0), (36, 'G3', 2.0), (38, 'Ab3', 2.0),
    (40, 'A3', 2.0), (42, 'C4', 2.0), (44, 'D4', 2.0), (46, 'F4', 2.0),
    (48, 'E4', 1.5), (49.5, 'D4', 0.5), (50, 'C#4', 2.0), (52, 'D4', 4.0)
]

for b_off, note, dur_b in INTRO_GUITAR_RIFF:
    note_t = SEC1_START + b_off * SPB_1
    if note_t >= SEC1_END - 1.0: break
    play_overdrive_lead_note(int(note_t * SAMPLE_RATE), note, dur_b * SPB_1, vol=0.68, pan=0.6, vibrato=True)

# 4. Heartbeat kick drums entering at 14.0s
cur_t = 14.77
while cur_t < 24.0:
    s_idx = int(cur_t * SAMPLE_RATE)
    play_drum(s_idx, kick_l, kick_r, vol=0.95, pan=0.5)
    cur_t += SPB_1 * 2  # Heartbeat on every 2 beats

# 5. Snare Roll Crescendo & Crash at 24s-28s
for step in range(16):
    roll_t = 24.0 + step * (SPB_1 / 4.0)
    if roll_t >= SEC1_END: break
    s_idx = int(roll_t * SAMPLE_RATE)
    vol = 0.4 + 0.8 * (step / 16.0)
    play_drum(s_idx, snare_l, snare_r, vol=vol, pan=0.5)
    if step % 4 == 0:
        play_drum(s_idx, kick_l, kick_r, vol=1.0, pan=0.5)

# ==============================================================================
# SECTION 2: 디스토션 파워코드 폭발 & 질주 시작 (155 BPM) [28.0s - 58.0s]
# ==============================================================================
print("  -> Section 2: Distortion Power Chords & Groove Drop (155 BPM)...")
SEC2_START = 28.0
SEC2_END = 58.0
BPM_SEC2 = 155.0
SPB_2 = 60.0 / BPM_SEC2  # ~0.387s
SP_STEP_2 = SPB_2 / 4.0   # 16th note

# Crash Cymbal on drop!
play_crash(int(SEC2_START * SAMPLE_RATE), vol=0.85, pan=0.5)

# Siren in background
add_siren(int((SEC2_START + 2.0) * SAMPLE_RATE), int(14.0 * SAMPLE_RATE), base_f=880, sweep_f=420, sweep_rate=2.8, vol=0.18, pan_center=0.4)

# Drum pattern & Distortion Rhythm Chugs
SEC2_BARS = int((SEC2_END - SEC2_START) / (SPB_2 * 4))
SEC2_CHORD_PROG = ['D2', 'F2', 'G2', 'Ab2', 'A2', 'C3', 'D3', 'A2']

for bar in range(SEC2_BARS):
    bar_start_t = SEC2_START + bar * 4 * SPB_2
    root = SEC2_CHORD_PROG[bar % len(SEC2_CHORD_PROG)]
    
    # Drums: Driving Rock Beat
    for step in range(16):
        step_t = bar_start_t + step * SP_STEP_2
        if step_t >= SEC2_END: break
        s_idx = int(step_t * SAMPLE_RATE)
        
        # Kick on 0, 6, 10
        if step in [0, 6, 10]:
            play_drum(s_idx, kick_l, kick_r, vol=1.2, pan=0.5)
        # Snare on 4, 12
        if step in [4, 12]:
            play_drum(s_idx, snare_l, snare_r, vol=1.3, pan=0.5)
        elif step in [7, 15]:
            play_drum(s_idx, ghost_l, ghost_r, vol=0.6, pan=0.5)
        # Hi-hat on 8th notes
        if step % 2 == 0:
            play_hat(s_idx, is_open=(step % 4 == 2), vol=0.28, pan=0.6)
            
        # Distortion Guitar: Open hit on beat 1, palm-mute chugs on 16th notes!
        if step == 0:
            play_distortion_power_chord(s_idx, root, SPB_2 * 1.5, is_palm_mute=False, vol=0.9, pan=0.35)
            play_rock_bass(s_idx, root, SPB_2 * 1.8, vol=0.7)
        elif step in [4, 8, 12]:
            play_distortion_power_chord(s_idx, root, SPB_2 * 0.8, is_palm_mute=False, vol=0.85, pan=0.35)
        else:
            # Palm mute chugs!
            play_distortion_power_chord(s_idx, root, SP_STEP_2 * 1.2, is_palm_mute=True, vol=0.75, pan=0.35)

# Overdrive Lead Guitar: MELODIC THEME 1 (Bold, Swaggering Heroic Escape Riff)
THEME_1_LEAD = [
    (0, 'D4', 1.0), (1, 'F4', 1.0), (2, 'A4', 1.5), (3.5, 'C5', 0.5),
    (4, 'D5', 2.0), (6, 'C5', 1.0), (7, 'A4', 1.0),
    (8, 'G4', 1.0), (9, 'Ab4', 1.0), (10, 'A4', 2.0),
    (12, 'F4', 1.5), (13.5, 'D4', 0.5), (14, 'D4', 2.0),
    
    (16, 'F4', 1.0), (17, 'G4', 1.0), (18, 'A4', 1.5), (19.5, 'D5', 0.5),
    (20, 'F5', 2.0), (22, 'E5', 1.0), (23, 'C5', 1.0),
    (24, 'D5', 3.0), (27, 'A4', 1.0),
    (28, 'G4', 1.0), (29, 'F4', 1.0), (30, 'E4', 1.0), (31, 'C#4', 1.0),
    
    (32, 'D4', 1.5), (33.5, 'F4', 0.5), (34, 'A4', 1.0), (35, 'D5', 1.0),
    (36, 'E5', 1.0), (37, 'F5', 1.5), (38.5, 'E5', 0.5), (39, 'D5', 1.0),
    (40, 'C5', 1.0), (41, 'A4', 1.0), (42, 'G4', 1.0), (43, 'F4', 1.0),
    (44, 'E4', 1.0), (45, 'F4', 1.0), (46, 'A4', 2.0)
]

for b_off, note, dur_b in THEME_1_LEAD:
    note_t = SEC2_START + b_off * SPB_2
    if note_t >= SEC2_END - 0.5: break
    play_overdrive_lead_note(int(note_t * SAMPLE_RATE), note, dur_b * SPB_2, vol=0.82, pan=0.68, vibrato=True)

# ==============================================================================
# SECTION 3: 현란한 오버드라이브 리드 솔로 & 멜로디 체인지 (165 BPM) [58.0s - 92.0s]
# ==============================================================================
print("  -> Section 3: High-Voltage Solo & Melodic Theme 2 (165 BPM)...")
SEC3_START = 58.0
SEC3_END = 92.0
BPM_SEC3 = 165.0
SPB_3 = 60.0 / BPM_SEC3  # ~0.363s
SP_STEP_3 = SPB_3 / 4.0

play_crash(int(SEC3_START * SAMPLE_RATE), vol=0.8, pan=0.5)

# Fast Doppler Siren sweeps
add_siren(int((SEC3_START + 6.0) * SAMPLE_RATE), int(12.0 * SAMPLE_RATE), base_f=950, sweep_f=450, sweep_rate=3.2, vol=0.20, pan_center=0.7)
add_siren(int((SEC3_START + 20.0) * SAMPLE_RATE), int(10.0 * SAMPLE_RATE), base_f=1020, sweep_f=480, sweep_rate=3.5, vol=0.22, pan_center=0.3)

# Rhythmic Distortion Chugs with Syncopation
SEC3_BARS = int((SEC3_END - SEC3_START) / (SPB_3 * 4))
SEC3_CHORDS = ['Bb1', 'C2', 'D2', 'F2', 'G2', 'A2', 'D2', 'C2']

for bar in range(SEC3_BARS):
    bar_start_t = SEC3_START + bar * 4 * SPB_3
    root = SEC3_CHORDS[bar % len(SEC3_CHORDS)]
    
    for step in range(16):
        step_t = bar_start_t + step * SP_STEP_3
        if step_t >= SEC3_END: break
        s_idx = int(step_t * SAMPLE_RATE)
        
        # Double Kick Breakbeat
        if step in [0, 3, 6, 10, 14]:
            play_drum(s_idx, kick_l, kick_r, vol=1.15, pan=0.5)
        if step in [4, 12]:
            play_drum(s_idx, snare_l, snare_r, vol=1.3, pan=0.5)
        elif step in [8, 15]:
            play_drum(s_idx, ghost_l, ghost_r, vol=0.6, pan=0.5)
        if step % 2 == 0:
            play_hat(s_idx, is_open=(step in [2, 10]), vol=0.26, pan=0.6)
            
        if step in [0, 6, 12]:
            play_distortion_power_chord(s_idx, root, SPB_3 * 1.0, is_palm_mute=False, vol=0.85, pan=0.32)
            play_rock_bass(s_idx, root, SPB_3 * 1.2, vol=0.65)
        else:
            play_distortion_power_chord(s_idx, root, SP_STEP_3 * 1.1, is_palm_mute=True, vol=0.7, pan=0.32)

# Overdrive Guitar: MELODIC THEME 2 (Virtuosic Rock Solo & Expressive Bends)
THEME_2_SOLO = [
    # Rapid Blues Run
    (0, 'A4', 0.5), (0.5, 'C5', 0.5), (1, 'D5', 1.0), (2, 'E5', 0.5), (2.5, 'F5', 0.5),
    (3, 'G5', 1.5), (4.5, 'F5', 0.5), (5, 'E5', 1.0), (6, 'D5', 2.0),
    
    # Octave Jump Squeal
    (8, 'D5', 0.5), (8.5, 'F5', 0.5), (9, 'A5', 1.0), (10, 'C6', 1.5), (11.5, 'D6', 0.5),
    (12, 'D6', 2.0), (14, 'C6', 1.0), (15, 'A5', 1.0),
    
    # Fast Shredding Run (16th notes!)
    (16, 'A5', 0.25), (16.25, 'G5', 0.25), (16.5, 'F5', 0.25), (16.75, 'E5', 0.25),
    (17, 'D5', 0.25), (17.25, 'C5', 0.25), (17.5, 'Bb4', 0.25), (17.75, 'A4', 0.25),
    (18, 'G4', 0.5), (18.5, 'Bb4', 0.5), (19, 'D5', 1.0), (20, 'F5', 2.0),
    
    # Heroic Climax
    (24, 'F5', 1.0), (25, 'G5', 1.0), (26, 'A5', 2.0),
    (28, 'Bb5', 1.5), (29.5, 'A5', 0.5), (30, 'G5', 1.0), (31, 'F5', 1.0),
    (32, 'G5', 1.5), (33.5, 'F5', 0.5), (34, 'E5', 2.0),
    (36, 'D5', 4.0)
]

for b_off, note, dur_b in THEME_2_SOLO:
    note_t = SEC3_START + b_off * SPB_3
    if note_t >= SEC3_END - 0.5: break
    play_overdrive_lead_note(int(note_t * SAMPLE_RATE), note, dur_b * SPB_3, vol=0.88, pan=0.68, vibrato=True)

# ==============================================================================
# SECTION 4: 절체절명의 위기 & 드라마틱한 멜로디 전개 (175 BPM) [92.0s - 125.0s]
# ==============================================================================
print("  -> Section 4: Desperate Climax & Twin Guitar Harmony (175 BPM)...")
SEC4_START = 92.0
SEC4_END = 125.0
BPM_SEC4 = 175.0
SPB_4 = 60.0 / BPM_SEC4  # ~0.342s
SP_STEP_4 = SPB_4 / 4.0

play_crash(int(SEC4_START * SAMPLE_RATE), vol=0.85, pan=0.5)

# Desperate siren
add_siren(int((SEC4_START + 4.0) * SAMPLE_RATE), int(16.0 * SAMPLE_RATE), base_f=1050, sweep_f=500, sweep_rate=3.6, vol=0.22, pan_center=0.5)

SEC4_BARS = int((SEC4_END - SEC4_START) / (SPB_4 * 4))
SEC4_PROG = ['D2', 'Bb1', 'G1', 'A1', 'D2', 'Bb1', 'C2', 'A1']

for bar in range(SEC4_BARS):
    bar_start_t = SEC4_START + bar * 4 * SPB_4
    root = SEC4_PROG[bar % len(SEC4_PROG)]
    
    for step in range(16):
        step_t = bar_start_t + step * SP_STEP_4
        if step_t >= SEC4_END: break
        s_idx = int(step_t * SAMPLE_RATE)
        
        # Heavy Mach-3 Kick
        if step in [0, 4, 8, 12]:
            play_drum(s_idx, kick_l, kick_r, vol=1.25, pan=0.5)
        if step in [4, 12]:
            play_drum(s_idx, snare_l, snare_r, vol=1.35, pan=0.5)
        if step % 2 == 1:
            play_hat(s_idx, is_open=True, vol=0.28, pan=0.55)
            
        play_distortion_power_chord(s_idx, root, SP_STEP_4 * 1.5, is_palm_mute=(step % 4 != 0), vol=0.85, pan=0.3)
        if step % 4 == 0:
            play_rock_bass(s_idx, root, SPB_4 * 1.2, vol=0.7)

# MELODIC THEME 3: Twin Guitar Harmony ("The Death That I Deservioli" Homage)
THEME_3_LEAD_A = [
    (0, 'D5', 2.0), (2, 'F5', 2.0), (4, 'A5', 3.0), (7, 'D6', 2.0), (9, 'C6', 2.0),
    (11, 'A5', 2.0), (13, 'F5', 3.0),
    (16, 'G5', 2.0), (18, 'Bb5', 2.0), (20, 'D6', 3.0), (23, 'F6', 2.0), (25, 'E6', 2.0),
    (27, 'C#6', 2.0), (29, 'A5', 3.0),
    
    (32, 'D6', 2.0), (34, 'C6', 1.0), (35, 'Bb5', 1.0), (36, 'A5', 2.0), (38, 'G5', 2.0),
    (40, 'F5', 2.0), (42, 'E5', 2.0), (44, 'D5', 4.0)
]

for b_off, note, dur_b in THEME_3_LEAD_A:
    note_t = SEC4_START + b_off * SPB_4
    if note_t >= SEC4_END - 0.5: break
    play_overdrive_lead_note(int(note_t * SAMPLE_RATE), note, dur_b * SPB_4, vol=0.85, pan=0.7, vibrato=True)

# ==============================================================================
# SECTION 5: 가속 시작! ("빨라졌다" - 175 -> 205 BPM) [125.0s - 158.0s]
# ==============================================================================
print("  -> Section 5: Accelerando! Speeding up from 175 to 205 BPM with Accelerating Clock...")
SEC5_START = 125.0
SEC5_END = 158.0
SEC5_DUR = SEC5_END - SEC5_START  # 33.0s

# Continuous tempo ramp: 175 to 205 BPM
cur_t = SEC5_START
beat_idx = 0

# Ticking clock ACCELERATES prominently here!
while cur_t < SEC5_END - 0.3:
    progress = (cur_t - SEC5_START) / SEC5_DUR
    cur_bpm = 175.0 + 30.0 * progress  # 175 -> 205 BPM
    spb = 60.0 / cur_bpm
    s_idx = int(cur_t * SAMPLE_RATE)
    
    # Loud, urgent ticking clock!
    is_tock = (beat_idx % 2 == 1)
    play_clock(s_idx, is_tock=is_tock, vol=0.85, pan=0.5)
    
    # Drums accelerating
    play_drum(s_idx, kick_l, kick_r, vol=1.2, pan=0.5)
    if beat_idx % 2 == 1:
        play_drum(s_idx, snare_l, snare_r, vol=1.3, pan=0.5)
    play_hat(s_idx, is_open=(beat_idx % 2 == 0), vol=0.3, pan=0.6)
    
    # Distortion Guitar Gallop Riff
    chord = 'D2' if (beat_idx // 4) % 2 == 0 else 'C2'
    play_distortion_power_chord(s_idx, chord, spb * 0.9, is_palm_mute=True, vol=0.88, pan=0.35)
    
    cur_t += spb
    beat_idx += 1

# Sirens speeding up in Section 5
add_siren(int(128.0 * SAMPLE_RATE), int(14.0 * SAMPLE_RATE), base_f=1100, sweep_f=550, sweep_rate=4.2, vol=0.25, pan_center=0.4)
add_siren(int(144.0 * SAMPLE_RATE), int(12.0 * SAMPLE_RATE), base_f=1180, sweep_f=600, sweep_rate=4.8, vol=0.28, pan_center=0.6)

# MELODIC THEME 4 (Ascending Urgency, Rising Panic)
THEME_4_LEAD = [
    (0, 'D5', 1.0), (1, 'E5', 1.0), (2, 'F5', 1.0), (3, 'G5', 1.0),
    (4, 'A5', 1.5), (5.5, 'Bb5', 0.5), (6, 'C6', 1.5), (7.5, 'C#6', 0.5),
    (8, 'D6', 2.0), (10, 'C6', 1.0), (11, 'Bb5', 1.0), (12, 'A5', 2.0),
    (14, 'G5', 1.0), (15, 'F5', 1.0),
    
    (16, 'E5', 1.0), (17, 'F5', 1.0), (18, 'G5', 1.0), (19, 'A5', 1.0),
    (20, 'Bb5', 1.5), (21.5, 'C6', 0.5), (22, 'D6', 1.5), (23.5, 'E6', 0.5),
    (24, 'F6', 2.0), (26, 'E6', 1.0), (27, 'D6', 1.0), (28, 'C#6', 3.0)
]

for b_off, note, dur_b in THEME_4_LEAD:
    # Scale offset dynamically according to accelerating curve
    approx_t = SEC5_START + b_off * (60.0 / 190.0)
    if approx_t >= SEC5_END - 0.5: break
    play_overdrive_lead_note(int(approx_t * SAMPLE_RATE), note, dur_b * 0.32, vol=0.88, pan=0.68, vibrato=True)

# ==============================================================================
# SECTION 6: 극한의 광기 질주 ("내무 빨라졌다가" - 205 -> 240+ BPM) [158.0s - 184.0s]
# ==============================================================================
print("  -> Section 6: Maximum Hyper Overdrive (205 -> 240+ BPM, Insane Tremolo Solo & Siren Storm)...")
SEC6_START = 158.0
SEC6_END = 184.0
SEC6_DUR = SEC6_END - SEC6_START  # 26.0s

play_crash(int(SEC6_START * SAMPLE_RATE), vol=0.9, pan=0.5)

# Rapid wailing sirens at maximum frenzy
add_siren(int(SEC6_START * SAMPLE_RATE), int(SEC6_DUR * SAMPLE_RATE), base_f=1300, sweep_f=650, sweep_rate=5.5, vol=0.32, pan_center=0.5)

cur_t = SEC6_START
beat_idx = 0

# HYPER ACCELERATION: 205 -> 245 BPM!
# Clock ticks at machine-gun speed!
while cur_t < SEC6_END - 0.2:
    progress = (cur_t - SEC6_START) / SEC6_DUR
    cur_bpm = 205.0 + 40.0 * progress  # 205 -> 245 BPM!
    spb = 60.0 / cur_bpm
    s_idx = int(cur_t * SAMPLE_RATE)
    
    # Super-fast clock tick!
    is_tock = (beat_idx % 2 == 1)
    play_clock(s_idx, is_tock=is_tock, vol=0.95, pan=0.5)
    
    # Blast-beat / Mach-4 high-speed drums
    play_drum(s_idx, kick_l, kick_r, vol=1.3, pan=0.5)
    play_drum(s_idx + int(spb * 0.5 * SAMPLE_RATE), snare_l, snare_r, vol=1.35, pan=0.5)
    play_hat(s_idx, is_open=True, vol=0.32, pan=0.55)
    
    # Rapid distortion power chord shred
    root = 'D2' if (beat_idx % 8 < 4) else 'F2'
    play_distortion_power_chord(s_idx, root, spb * 0.8, is_palm_mute=False, vol=0.92, pan=0.35)
    
    cur_t += spb
    beat_idx += 1

# MELODIC THEME 5: Lightning-Fast Tremolo Picking Guitar Solo (High Screaming Lead)
SHRED_NOTES = [
    'D6', 'F6', 'A6', 'D7', 'C7', 'A6', 'F6', 'D6',
    'E6', 'G6', 'Bb6', 'E7', 'D7', 'Bb6', 'G6', 'E6',
    'F6', 'A6', 'C7', 'F7', 'E7', 'C7', 'A6', 'F6',
    'C#6', 'E6', 'G6', 'A#6', 'A6', 'G6', 'E6', 'C#6',
    'D6', 'D7', 'C7', 'Bb6', 'A6', 'G6', 'F6', 'E6', 'D6'
]

shred_step_dur = (SEC6_DUR - 2.0) / len(SHRED_NOTES)
for i, n in enumerate(SHRED_NOTES):
    note_t = SEC6_START + i * shred_step_dur
    if note_t >= SEC6_END - 0.5: break
    play_overdrive_lead_note(int(note_t * SAMPLE_RATE), n, shred_step_dur * 1.2, vol=0.92, pan=0.72, vibrato=False)

# ==============================================================================
# SECTION 7: 거의 마지막엔 느려지게 ("거의 마지막엔 느려지게" - 85 BPM Breakdown) [184.0s - 200.0s]
# ==============================================================================
print("  -> Section 7: Extreme Slowdown Breakdown (Ritardando down to 85 BPM)...")
SEC7_START = 184.0
SEC7_END = 200.0

# COLOSSAL CRASH & TIME-DILATION IMPACT AT 184.0s!
play_crash(int(SEC7_START * SAMPLE_RATE), vol=1.0, pan=0.5)
play_drum(int(SEC7_START * SAMPLE_RATE), kick_l, kick_r, vol=1.5, pan=0.5)

# Descending Pitch Siren Fall (Winding down)
siren_len = int((SEC7_END - SEC7_START) * SAMPLE_RATE)
for i in range(siren_len):
    idx = int(SEC7_START * SAMPLE_RATE) + i
    if idx >= TOTAL_SAMPLES: break
    t = i / SAMPLE_RATE
    # Siren pitch dying down from 1400Hz to 200Hz
    freq = 1400.0 * math.exp(-0.25 * t)
    sample = math.sin(2 * math.pi * freq * t) * math.exp(-0.28 * t) * 0.25
    left_buf[idx] += sample * 0.6
    right_buf[idx] += sample * 0.4

# SLOW-MOTION TEMPO (85 BPM Half-Time Doom Breakdown)
BPM_SEC7 = 85.0
SPB_7 = 60.0 / BPM_SEC7  # ~0.706s

# Heavy slow distortion power chords ringing out with massive sustain!
SLOW_CHORDS = [
    (0, 'D1', 3.0),
    (4, 'Bb0', 3.0),
    (8, 'A0', 3.0),
    (12, 'D1', 6.0)
]

for b_off, chord, dur_b in SLOW_CHORDS:
    chord_t = SEC7_START + b_off * SPB_7
    if chord_t >= SEC7_END - 1.0: break
    s_idx = int(chord_t * SAMPLE_RATE)
    play_distortion_power_chord(s_idx, chord, dur_b * SPB_7, is_palm_mute=False, vol=1.0, pan=0.35)
    play_rock_bass(s_idx, chord, dur_b * SPB_7 * 1.2, vol=0.85)
    play_drum(s_idx, kick_l, kick_r, vol=1.4, pan=0.5)
    play_crash(s_idx, vol=0.75, pan=0.5)
    
    # Heavy snare on beat 2
    snare_idx = s_idx + int(SPB_7 * 2 * SAMPLE_RATE)
    if snare_idx < TOTAL_SAMPLES:
        play_drum(snare_idx, snare_l, snare_r, vol=1.4, pan=0.5)

# Crying, dramatic final Overdrive Guitar lead melody
SLOW_LEAD = [
    (0.5, 'D5', 2.5),
    (3.5, 'F5', 1.0),
    (4.5, 'E5', 2.5),
    (7.5, 'C#5', 1.0),
    (8.5, 'D5', 3.0),
    (12.0, 'D6', 6.0)
]

for b_off, note, dur_b in SLOW_LEAD:
    lead_t = SEC7_START + b_off * SPB_7
    if lead_t >= SEC7_END - 0.5: break
    play_overdrive_lead_note(int(lead_t * SAMPLE_RATE), note, dur_b * SPB_7, vol=0.92, pan=0.65, vibrato=True)

# CLOCK WINDING DOWN & FINAL STOP!
# The clock ticks slow down drastically: tick....... tock....... tick........ [STOP]
CLOCK_SLOW_TIMES = [184.5, 185.8, 187.3, 189.1, 191.2, 193.6, 196.3]
for idx, ct in enumerate(CLOCK_SLOW_TIMES):
    s_idx = int(ct * SAMPLE_RATE)
    is_tock = (idx % 2 == 1)
    # Becomes deeper and more isolated
    play_clock(s_idx, is_tock=is_tock, vol=0.85 - idx * 0.08, pan=0.5)

# Final mechanical click / lock sound at 198.5s!
final_click_idx = int(198.5 * SAMPLE_RATE)
for i in range(int(0.08 * SAMPLE_RATE)):
    idx = final_click_idx + i
    if idx >= TOTAL_SAMPLES: break
    t = i / SAMPLE_RATE
    c = (random.random() * 2 - 1) * math.exp(-120.0 * t) * 0.4
    left_buf[idx] += c
    right_buf[idx] += c

# ------------------------------------------------------------------------------
# 10. MASTERING & SEAMLESS LOOP CROSSFADE
# ------------------------------------------------------------------------------
print("Mastering audio (peak limiting & seamless crossfade)...")

# Smooth 1.0s crossfade from end to start for seamless in-game loop
FADE_SAMPLES = int(1.2 * SAMPLE_RATE)
for i in range(FADE_SAMPLES):
    ratio = i / float(FADE_SAMPLES)
    end_idx = TOTAL_SAMPLES - FADE_SAMPLES + i
    left_buf[end_idx] = left_buf[end_idx] * (1.0 - ratio) + left_buf[i] * ratio
    right_buf[end_idx] = right_buf[end_idx] * (1.0 - ratio) + right_buf[i] * ratio

# Find peak
max_peak = 0.0
for i in range(TOTAL_SAMPLES):
    al = abs(left_buf[i])
    ar = abs(right_buf[i])
    if al > max_peak: max_peak = al
    if ar > max_peak: max_peak = ar

print(f"Peak amplitude before mastering: {max_peak:.3f}")

# Normalize to -0.3 dB (0.96)
norm_factor = 0.96 / max_peak if max_peak > 0 else 1.0

# Pack into 16-bit stereo PCM using array for speed
packed_arr = array.array('h')
for i in range(TOTAL_SAMPLES):
    sl = math.tanh(left_buf[i] * norm_factor)
    sr_val = math.tanh(right_buf[i] * norm_factor)
    packed_arr.append(max(-32767, min(32767, int(sl * 32767))))
    packed_arr.append(max(-32767, min(32767, int(sr_val * 32767))))

raw_bytes = packed_arr.tobytes()

# Write output files
for fname in ['music/mu_escape.wav', 'music/mu_breakingnews.wav']:
    with wave.open(fname, 'wb') as out_f:
        out_f.setnchannels(2)
        out_f.setsampwidth(2)
        out_f.setframerate(SAMPLE_RATE)
        out_f.writeframes(raw_bytes)
    print(f"Generated {fname}: {os.path.getsize(fname)} bytes ({TOTAL_SECONDS:.2f}s)")

print(f"=== Epic Custom Escape Track Complete in {time.time() - t_start:.2f}s! ===")
