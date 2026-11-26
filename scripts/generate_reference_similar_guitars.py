import math
import struct
import wave
import random
import os

SAMPLE_RATE = 44100
BPM = 173.327
SPB = 60.0 / BPM  # ~0.34616s per beat
TOTAL_BEATS = 30  # ~10.385s matching user reference length
TOTAL_SAMPLES = int(TOTAL_BEATS * SPB * SAMPLE_RATE)

def note_to_freq(note_str):
    names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    flats = {'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#'}
    for f, s in flats.items():
        if note_str.startswith(f):
            octave = int(note_str[len(f):])
            return note_to_freq(s + str(octave))
    for i, n in enumerate(names):
        if note_str.startswith(n):
            oct_str = note_str[len(n):]
            if oct_str.isdigit():
                octave = int(oct_str)
                semis = (octave + 1) * 12 + i
                return 440.0 * (2.0 ** ((semis - 69) / 12.0))
    return 440.0

def synth_guitar_voice(f0, dur_s, is_palm_mute=False, brightness=0.85, damping_decay=0.995, vibrato_speed=0.0, vibrato_depth=0.0):
    """
    Physical-style Karplus-Strong string synthesis with dual pickup simulation,
    pick attack impulse, and optional vibrato modulation.
    """
    if f0 < 20.0:
        return [0.0] * int(dur_s * SAMPLE_RATE)
        
    nominal_period = int(SAMPLE_RATE / f0)
    if nominal_period < 2: nominal_period = 2
    
    n_samples = int(dur_s * SAMPLE_RATE)
    out = [0.0] * n_samples
    
    # Pick attack noise burst with low-end thump
    noise_burst = [(random.random() * 2.0 - 1.0) for _ in range(nominal_period)]
    for i in range(1, nominal_period):
        noise_burst[i] = noise_burst[i] * brightness + noise_burst[i-1] * (1.0 - brightness)
        
    ring_buf = list(noise_burst)
    p = 0
    prev = 0.0
    
    # Palm mute damping factor drops quickly
    base_damping = 0.955 if is_palm_mute else damping_decay
    pickup_delay = max(1, int(nominal_period * 0.18))
    
    for i in range(n_samples):
        # Time-varying damping for natural string decay
        t = i / SAMPLE_RATE
        cur_damping = base_damping * (0.97 if is_palm_mute and t > 0.04 else 1.0)
        
        cur_val = ring_buf[p]
        filtered = (cur_val + prev) * 0.5 * cur_damping
        prev = cur_val
        ring_buf[p] = filtered
        
        # Dual-pickup blend
        pickup_pos = (p - pickup_delay) % nominal_period
        sample_val = cur_val * 0.7 + ring_buf[pickup_pos] * 0.3
        
        # Add pick attack thump
        if i < int(0.008 * SAMPLE_RATE):
            sample_val += math.sin(2.0 * math.pi * 130.0 * t) * (1.0 - t / 0.008) * 0.8
            
        out[i] = sample_val
        p = (p + 1) % nominal_period
        
    # Vibrato / Squeal pitch modulation
    if vibrato_depth > 0.0 and vibrato_speed > 0.0:
        vib_out = [0.0] * n_samples
        for i in range(n_samples):
            t = i / SAMPLE_RATE
            depth = vibrato_depth * min(1.0, t / 0.08)
            mod = depth * math.sin(2.0 * math.pi * vibrato_speed * t)
            idx = i + int(mod)
            vib_out[i] = out[idx] if 0 <= idx < n_samples else out[i]
        out = vib_out
        
    return out

def apply_amp_cab_distortion(samples, gain=14.0, cab_cutoff=4800.0, bass_boost=1.4, presence=1.2):
    """
    High-gain tube preamp saturation + Marshall/Mesa 4x12 closed-back cabinet simulation.
    """
    n = len(samples)
    out = [0.0] * n
    
    # 1. Pre-amp high-pass (cuts sub-rumble below 80Hz) and presence boost
    hp = 0.0
    pre_boost = [0.0] * n
    for i in range(n):
        s = samples[i]
        hp += 0.94 * (s - hp)
        pre_boost[i] = (s - hp * 0.4) * presence
        
    # 2. Tube Preamp Non-linear Saturation (asymmetric soft clipping)
    sat = [0.0] * n
    for i in range(n):
        x = pre_boost[i] * gain
        # Tube curve: pleasant odd and even harmonic distortion
        if x >= 0.0:
            val = math.tanh(x * 1.2)
        else:
            val = math.tanh(x * 0.9) / (1.0 + 0.2 * abs(x))
        # Add subtle octave warmth
        sat[i] = val + 0.12 * math.tanh(x * 2.4)
        
    # 3. Cabinet simulation: Steep 2-pole lowpass around cab_cutoff (~4.8kHz)
    # plus resonant peak around 2.8kHz and low thump around 120Hz
    dt = 1.0 / SAMPLE_RATE
    rc = 1.0 / (2.0 * math.pi * cab_cutoff)
    alpha = dt / (rc + dt)
    
    lp1 = 0.0
    lp2 = 0.0
    res_band = 0.0
    res_center = 2800.0
    res_q = 0.25
    
    for i in range(n):
        v = sat[i]
        lp1 += alpha * (v - lp1)
        lp2 += alpha * (lp1 - lp2)
        
        # Bass resonance thump (120Hz)
        t = i / SAMPLE_RATE
        thump = v * 0.25 * math.sin(2.0 * math.pi * 120.0 * t)
        
        out[i] = lp2 * 0.85 + thump * 0.15
        
    return out

def render_power_chord(root_note, dur_s, is_palm_mute=False, gain=16.0, vibrato=False):
    f_root = note_to_freq(root_note)
    f_5th = f_root * 1.5
    f_oct = f_root * 2.0
    
    vib_s = 6.2 if vibrato else 0.0
    vib_d = 2.4 if vibrato else 0.0
    
    s_root = synth_guitar_voice(f_root, dur_s, is_palm_mute=is_palm_mute, brightness=0.75, damping_decay=0.993, vibrato_speed=vib_s, vibrato_depth=vib_d)
    s_5th = synth_guitar_voice(f_5th, dur_s, is_palm_mute=is_palm_mute, brightness=0.78, damping_decay=0.994, vibrato_speed=vib_s, vibrato_depth=vib_d)
    s_oct = synth_guitar_voice(f_oct, dur_s, is_palm_mute=is_palm_mute, brightness=0.82, damping_decay=0.995, vibrato_speed=vib_s, vibrato_depth=vib_d)
    
    n = min(len(s_root), len(s_5th), len(s_oct))
    mixed = [(s_root[i] * 0.55 + s_5th[i] * 0.35 + s_oct[i] * 0.25) for i in range(n)]
    
    # Apply amp distortion
    return apply_amp_cab_distortion(mixed, gain=gain)

def render_pinch_harmonic_squeal(note_str, dur_s, vibrato_speed=6.5, vibrato_depth=3.2, gain=18.0):
    """
    Screaming pinch harmonic squeal (Zakk Wylde / Dimebag / Pizza Tower metal squeal).
    """
    f0 = note_to_freq(note_str)
    # Pinch harmonics emphasize the 3rd and 4th harmonics with intense screaming resonance
    s_fund = synth_guitar_voice(f0, dur_s, is_palm_mute=False, brightness=0.95, damping_decay=0.998, vibrato_speed=vibrato_speed, vibrato_depth=vibrato_depth)
    s_oct = synth_guitar_voice(f0 * 2.0, dur_s, is_palm_mute=False, brightness=0.96, damping_decay=0.998, vibrato_speed=vibrato_speed, vibrato_depth=vibrato_depth * 1.5)
    
    n = min(len(s_fund), len(s_oct))
    mixed = [(s_fund[i] * 0.3 + s_oct[i] * 0.8) for i in range(n)]
    return apply_amp_cab_distortion(mixed, gain=gain, presence=1.6)

def add_drum(left, right, start_samp, is_kick=False, is_snare=False, is_hat=False, is_crash=False):
    tot = len(left)
    if is_kick:
        dur = int(0.18 * SAMPLE_RATE)
        for i in range(dur):
            idx = start_samp + i
            if idx >= tot: break
            t = i / SAMPLE_RATE
            f = 145.0 * math.exp(-32.0 * t) + 40.0
            s = (math.sin(2.0 * math.pi * f * t) + (random.random()*2-1)*math.exp(-65.0*t)*0.25) * math.exp(-12.0 * t) * 0.88
            left[idx] += s * 0.9; right[idx] += s * 0.9
    if is_snare:
        dur = int(0.22 * SAMPLE_RATE)
        for i in range(dur):
            idx = start_samp + i
            if idx >= tot: break
            t = i / SAMPLE_RATE
            tone = math.sin(2.0 * math.pi * 195.0 * t) * math.exp(-30.0 * t) * 0.4
            noise = (random.random() * 2.0 - 1.0) * math.exp(-18.0 * t) * 0.78
            s = (tone + noise) * 0.85
            left[idx] += s * 0.85; right[idx] += s * 0.85
    if is_hat:
        dur = int(0.045 * SAMPLE_RATE)
        for i in range(dur):
            idx = start_samp + i
            if idx >= tot: break
            t = i / SAMPLE_RATE
            h = (random.random() * 2.0 - 1.0) * math.exp(-70.0 * t) * 0.22
            left[idx] += h * 0.65; right[idx] += h * 1.0
    if is_crash:
        dur = int(1.8 * SAMPLE_RATE)
        for i in range(dur):
            idx = start_samp + i
            if idx >= tot: break
            t = i / SAMPLE_RATE
            c = (random.random() * 2.0 - 1.0) * math.exp(-2.2 * t) * 0.48
            left[idx] += c * 0.85; right[idx] += c * 1.0

def mix_track(dest_l, dest_r, sound_samples, start_samp, vol_l=0.7, vol_r=0.7, delay_r_samples=0):
    tot = len(dest_l)
    n = len(sound_samples)
    for i in range(n):
        idx_l = start_samp + i
        if 0 <= idx_l < tot:
            dest_l[idx_l] += sound_samples[i] * vol_l
        idx_r = start_samp + i + delay_r_samples
        if 0 <= idx_r < tot:
            dest_r[idx_r] += sound_samples[i] * vol_r

def save_mastered_wav(filepath, left, right):
    n = min(len(left), len(right))
    # Soft limiter & normalizer to -0.3dB (0.96)
    peak = max(max(abs(l), abs(r)) for l, r in zip(left[:n], right[:n]))
    gain = (0.95 / peak) if peak > 0.0 else 1.0
    
    out_bytes = bytearray()
    for l, r in zip(left[:n], right[:n]):
        sl = math.tanh(l * gain * 1.05)
        sr = math.tanh(r * gain * 1.05)
        vl = max(-32768, min(32767, int(sl * 32767)))
        vr = max(-32768, min(32767, int(sr * 32767)))
        out_bytes.extend(struct.pack('<hh', vl, vr))
        
    with wave.open(filepath, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SAMPLE_RATE)
        w.writeframes(out_bytes)
    sz = os.path.getsize(filepath)
    dur = n / SAMPLE_RATE
    print(f"Saved: {filepath} ({dur:.2f}s, {sz} bytes)")

# ==============================================================================
# OPTION 1: Heavy Drop-B Palm Mute Chug & Screaming Harmonics
# Exactly matches the rhythm, drop-B pitch, and squeals of user_guitar_chosen.wav
# ==============================================================================
def generate_option1_heavy_chug():
    left = [0.0] * TOTAL_SAMPLES
    right = [0.0] * TOTAL_SAMPLES
    
    # Drums: Heavy rock drive
    add_drum(left, right, 0, is_crash=True)
    add_drum(left, right, int(16 * SPB * SAMPLE_RATE), is_crash=True)
    for b in range(TOTAL_BEATS):
        sb = int(b * SPB * SAMPLE_RATE)
        add_drum(left, right, sb, is_kick=(b % 2 == 0), is_snare=(b % 2 != 0))
        for step in range(4):
            add_drum(left, right, sb + int(step * (SPB / 4.0) * SAMPLE_RATE), is_hat=True)
            
    # Guitar Riff Events: (beat_offset, type, note/chord, duration_beats)
    # Section A (Beats 0-8): B1 chugs, B2 punch, E2 power chord, B4 harmonic squeal
    events = [
        # Bar 1 (0 to 4 beats)
        (0.0, 'chug', 'B1', 0.4),
        (0.5, 'chug', 'B1', 0.4),
        (1.0, 'chord', 'B2', 0.5),
        (1.5, 'chord', 'E2', 0.5),
        (2.0, 'chug', 'B1', 0.4),
        (2.5, 'chug', 'B1', 0.4),
        (3.0, 'squeal', 'B4', 1.0),
        
        # Bar 2 (4 to 8 beats)
        (4.0, 'chug', 'B1', 0.4),
        (4.5, 'chord', 'C3', 0.5),
        (5.0, 'chug', 'B1', 0.4),
        (5.5, 'chord', 'C#3', 0.5),
        (6.0, 'chug', 'B1', 0.4),
        (6.5, 'chug', 'B1', 0.4),
        (7.0, 'squeal', 'C5', 1.0),
        
        # Bar 3 (8 to 12 beats): Chromatic metal drive
        (8.0, 'chord', 'B2', 0.5),
        (8.5, 'chug', 'B1', 0.4),
        (9.0, 'chord', 'F#2', 0.5),
        (9.5, 'chord', 'G2', 0.5),
        (10.0, 'chug', 'B1', 0.35),
        (10.35, 'chug', 'B1', 0.35),
        (10.7, 'chug', 'B1', 0.35),
        (11.0, 'squeal', 'D5', 1.0),
        
        # Bar 4 (12 to 16 beats): Galloping chug triplet
        (12.0, 'chug', 'B1', 0.4),
        (12.5, 'chord', 'E2', 0.5),
        (13.0, 'chug', 'B1', 0.4),
        (13.5, 'chord', 'F#2', 0.5),
        (14.0, 'chug', 'B1', 0.35),
        (14.35, 'chug', 'B1', 0.35),
        (14.7, 'chug', 'B1', 0.35),
        (15.0, 'squeal', 'F#5', 1.2),
        
        # Bar 5 (16 to 20 beats): High energy continuation
        (16.0, 'chord', 'B2', 0.5),
        (16.5, 'chug', 'B1', 0.4),
        (17.0, 'chord', 'E2', 0.5),
        (17.5, 'chug', 'B1', 0.4),
        (18.0, 'chord', 'G2', 0.5),
        (18.5, 'chord', 'F#2', 0.5),
        (19.0, 'squeal', 'G5', 1.0),
        
        # Bar 6 (20 to 24 beats): Aggressive chugging
        (20.0, 'chug', 'B1', 0.35),
        (20.35, 'chug', 'B1', 0.35),
        (20.7, 'chug', 'B1', 0.35),
        (21.0, 'chord', 'C3', 0.5),
        (21.5, 'chord', 'C#3', 0.5),
        (22.0, 'chug', 'B1', 0.4),
        (22.5, 'chord', 'D3', 0.5),
        (23.0, 'squeal', 'D5', 1.0),
        
        # Bar 7 (24 to 28 beats): Climax build-up
        (24.0, 'chord', 'B2', 0.5),
        (24.5, 'chug', 'B1', 0.4),
        (25.0, 'chord', 'F#2', 0.5),
        (25.5, 'chord', 'G2', 0.5),
        (26.0, 'chug', 'B1', 0.35),
        (26.35, 'chug', 'B1', 0.35),
        (26.7, 'chug', 'B1', 0.35),
        (27.0, 'squeal', 'G5', 1.0),
        
        # Bar 8 (28 to 30 beats): Grand finale crushing power chord slam
        (28.0, 'chord', 'E2', 0.6),
        (28.6, 'chord', 'F#2', 0.6),
        (29.2, 'chord', 'B1', 1.8),
    ]
    
    for b_off, ev_type, note, dur_b in events:
        s_start = int(b_off * SPB * SAMPLE_RATE)
        dur_s = dur_b * SPB
        
        if ev_type == 'chug':
            snd = render_power_chord(note, dur_s, is_palm_mute=True, gain=17.0)
            # Stereo spread with micro-timing
            mix_track(left, right, snd, s_start, vol_l=0.75, vol_r=0.72, delay_r_samples=12)
        elif ev_type == 'chord':
            snd = render_power_chord(note, dur_s, is_palm_mute=False, gain=15.0)
            mix_track(left, right, snd, s_start, vol_l=0.78, vol_r=0.75, delay_r_samples=16)
        elif ev_type == 'squeal':
            snd = render_pinch_harmonic_squeal(note, dur_s, vibrato_speed=6.5, vibrato_depth=3.0, gain=19.0)
            mix_track(left, right, snd, s_start, vol_l=0.82, vol_r=0.85, delay_r_samples=8)
            
    save_mastered_wav('sound/pizza_guitar_heavy_chug.wav', left, right)

# ==============================================================================
# OPTION 2: Pizza Tower Arcade Speed Metal
# Hyper-energetic driving lead melody + rhythm chugs in Pizza Tower escape style
# ==============================================================================
def generate_option2_arcade_metal():
    left = [0.0] * TOTAL_SAMPLES
    right = [0.0] * TOTAL_SAMPLES
    
    add_drum(left, right, 0, is_crash=True)
    add_drum(left, right, int(16 * SPB * SAMPLE_RATE), is_crash=True)
    for b in range(TOTAL_BEATS):
        sb = int(b * SPB * SAMPLE_RATE)
        add_drum(left, right, sb, is_kick=(b % 2 == 0), is_snare=(b % 2 != 0))
        for step in range(4):
            add_drum(left, right, sb + int(step * (SPB / 4.0) * SAMPLE_RATE), is_hat=True)
            
    # Driving rhythm chugs under melody
    for b in range(TOTAL_BEATS - 2):
        sb = int(b * SPB * SAMPLE_RATE)
        root = 'B1' if (b // 4) % 2 == 0 else ('G1' if (b % 4 < 2) else 'A1')
        chug = render_power_chord(root, SPB * 0.45, is_palm_mute=True, gain=15.0)
        mix_track(left, right, chug, sb, vol_l=0.55, vol_r=0.52, delay_r_samples=14)
        chug2 = render_power_chord(root, SPB * 0.45, is_palm_mute=True, gain=15.0)
        mix_track(left, right, chug2, sb + int(SPB * 0.5 * SAMPLE_RATE), vol_l=0.52, vol_r=0.55, delay_r_samples=10)
        
    # Searing arcade lead guitar melody (Drop-B high lead)
    melody = [
        (0.5, 'B4', 0.5), (1.0, 'D5', 0.5), (1.5, 'C#5', 0.5), (2.0, 'B4', 0.8),
        (3.0, 'F#4', 0.5), (3.5, 'A4', 0.5), (4.0, 'B4', 1.0),
        (5.0, 'B4', 0.4), (5.5, 'C#5', 0.4), (6.0, 'D5', 0.4), (6.5, 'E5', 0.4),
        (7.0, 'F#5', 1.2),
        (8.5, 'B4', 0.5), (9.0, 'D5', 0.5), (9.5, 'C#5', 0.5), (10.0, 'B4', 0.8),
        (11.0, 'G4', 0.5), (11.5, 'A4', 0.5), (12.0, 'B4', 1.0),
        # Shredding fast run
        (13.0, 'B4', 0.25), (13.25, 'C#5', 0.25), (13.5, 'D5', 0.25), (13.75, 'E5', 0.25),
        (14.0, 'F#5', 0.25), (14.25, 'G5', 0.25), (14.5, 'A5', 0.25), (14.75, 'B5', 0.5),
        (15.5, 'F#5', 1.5),
        # Second half soaring reprise
        (17.0, 'B5', 0.8), (18.0, 'A5', 0.6), (19.0, 'G5', 0.6), (20.0, 'F#5', 1.2),
        (21.5, 'D5', 0.5), (22.0, 'E5', 0.5), (22.5, 'F#5', 0.8),
        (23.5, 'G5', 0.5), (24.0, 'A5', 0.5), (24.5, 'B5', 1.5),
        (26.5, 'D6', 0.6), (27.2, 'C#6', 0.6), (28.0, 'B5', 2.0),
    ]
    
    for b_off, note, dur_b in melody:
        s_start = int(b_off * SPB * SAMPLE_RATE)
        dur_s = dur_b * SPB
        lead = synth_guitar_voice(note_to_freq(note), dur_s, is_palm_mute=False, brightness=0.92, damping_decay=0.997, vibrato_speed=6.0, vibrato_depth=2.2)
        lead_dist = apply_amp_cab_distortion(lead, gain=14.0, cab_cutoff=5200.0, presence=1.5)
        mix_track(left, right, lead_dist, s_start, vol_l=0.82, vol_r=0.80, delay_r_samples=8)
        
    save_mastered_wav('sound/pizza_guitar_arcade_metal.wav', left, right)

# ==============================================================================
# OPTION 3: Heavy Overdrive Power Chord Slam
# Massive wall-of-sound rhythm guitar chords with maximum gain, crunch and distortion
# ==============================================================================
def generate_option3_powerchord_drive():
    left = [0.0] * TOTAL_SAMPLES
    right = [0.0] * TOTAL_SAMPLES
    
    add_drum(left, right, 0, is_crash=True)
    add_drum(left, right, int(16 * SPB * SAMPLE_RATE), is_crash=True)
    for b in range(TOTAL_BEATS):
        sb = int(b * SPB * SAMPLE_RATE)
        add_drum(left, right, sb, is_kick=(b % 2 == 0), is_snare=(b % 2 != 0))
        for step in range(4):
            add_drum(left, right, sb + int(step * (SPB / 4.0) * SAMPLE_RATE), is_hat=True)
            
    # Heavy chord progression: B5 -> D5 -> E5 -> G5 -> F#5 -> C5 -> B5
    chords = [
        (0.0, 'B1', 1.5), (1.5, 'B1', 1.0), (2.5, 'D2', 1.5),
        (4.0, 'E2', 1.5), (5.5, 'E2', 1.0), (6.5, 'F#2', 1.5),
        (8.0, 'G2', 1.5), (9.5, 'A2', 1.0), (10.5, 'B2', 1.5),
        (12.0, 'C3', 1.5), (13.5, 'B2', 1.0), (14.5, 'F#2', 1.5),
        # Reprise with high energy
        (16.0, 'B1', 1.5), (17.5, 'B1', 1.0), (18.5, 'D2', 1.5),
        (20.0, 'E2', 1.5), (21.5, 'E2', 1.0), (22.5, 'G2', 1.5),
        (24.0, 'F#2', 1.5), (25.5, 'G2', 1.0), (26.5, 'A2', 1.5),
        (28.0, 'B1', 2.0),
    ]
    
    for b_off, root, dur_b in chords:
        s_start = int(b_off * SPB * SAMPLE_RATE)
        dur_s = dur_b * SPB
        # Track 1: Left heavy power chord
        c1 = render_power_chord(root, dur_s, is_palm_mute=False, gain=18.0)
        # Track 2: Right octave-thickened power chord
        c2 = render_power_chord(root, dur_s, is_palm_mute=False, gain=17.5)
        mix_track(left, right, c1, s_start, vol_l=0.88, vol_r=0.45, delay_r_samples=0)
        mix_track(left, right, c2, s_start, vol_l=0.45, vol_r=0.88, delay_r_samples=18)
        
    save_mastered_wav('sound/pizza_guitar_powerchord_drive.wav', left, right)

# ==============================================================================
# OPTION 4: Retro GBA / Arcade High-Gain Crunch (WL4 / Pizza Tower style)
# ==============================================================================
def generate_option4_retro_crunch():
    left = [0.0] * TOTAL_SAMPLES
    right = [0.0] * TOTAL_SAMPLES
    
    add_drum(left, right, 0, is_crash=True)
    add_drum(left, right, int(16 * SPB * SAMPLE_RATE), is_crash=True)
    for b in range(TOTAL_BEATS):
        sb = int(b * SPB * SAMPLE_RATE)
        add_drum(left, right, sb, is_kick=(b % 2 == 0), is_snare=(b % 2 != 0))
        for step in range(4):
            add_drum(left, right, sb + int(step * (SPB / 4.0) * SAMPLE_RATE), is_hat=True)
            
    # Retro syncopated riff in B minor
    pattern = [
        (0.0, 'B1', 0.4), (0.5, 'B1', 0.4), (1.0, 'D2', 0.4), (1.5, 'E2', 0.5),
        (2.0, 'F#2', 0.5), (2.75, 'F#2', 0.35), (3.25, 'G2', 0.35), (3.6, 'A2', 0.4),
        (4.0, 'B1', 0.4), (4.5, 'B1', 0.4), (5.0, 'D2', 0.4), (5.5, 'E2', 0.5),
        (6.0, 'F2', 0.5), (6.5, 'E2', 0.5), (7.0, 'D2', 0.5), (7.5, 'C2', 0.5),
        (8.0, 'B1', 0.4), (8.5, 'B1', 0.4), (9.0, 'D2', 0.4), (9.5, 'E2', 0.5),
        (10.0, 'F#2', 0.5), (10.75, 'F#2', 0.35), (11.25, 'G2', 0.35), (11.6, 'A2', 0.4),
        (12.0, 'B2', 0.4), (12.5, 'A2', 0.4), (13.0, 'G2', 0.4), (13.5, 'F#2', 0.5),
        (14.0, 'E2', 0.5), (14.5, 'D2', 0.5), (15.0, 'B1', 1.0),
        # Second half repetition with intense ending
        (16.0, 'B1', 0.4), (16.5, 'B1', 0.4), (17.0, 'D2', 0.4), (17.5, 'E2', 0.5),
        (18.0, 'F#2', 0.5), (18.75, 'F#2', 0.35), (19.25, 'G2', 0.35), (19.6, 'A2', 0.4),
        (20.0, 'B1', 0.4), (20.5, 'B1', 0.4), (21.0, 'D2', 0.4), (21.5, 'E2', 0.5),
        (22.0, 'F2', 0.5), (22.5, 'E2', 0.5), (23.0, 'D2', 0.5), (23.5, 'C2', 0.5),
        (24.0, 'B1', 0.4), (24.5, 'B1', 0.4), (25.0, 'D2', 0.4), (25.5, 'E2', 0.5),
        (26.0, 'F#2', 0.5), (26.5, 'G2', 0.5), (27.0, 'A2', 0.5), (27.5, 'B2', 0.5),
        (28.0, 'D3', 0.6), (28.6, 'C#3', 0.6), (29.2, 'B1', 1.8),
    ]
    
    for b_off, root, dur_b in pattern:
        s_start = int(b_off * SPB * SAMPLE_RATE)
        dur_s = dur_b * SPB
        c = render_power_chord(root, dur_s, is_palm_mute=(dur_b < 0.5), gain=16.0)
        mix_track(left, right, c, s_start, vol_l=0.82, vol_r=0.78, delay_r_samples=12)
        
    save_mastered_wav('sound/pizza_guitar_retro_crunch.wav', left, right)

if __name__ == '__main__':
    print(f"Generating 4 similar guitar variations (BPM={BPM:.1f}, Duration={TOTAL_BEATS * SPB:.2f}s)...")
    generate_option1_heavy_chug()
    generate_option2_arcade_metal()
    generate_option3_powerchord_drive()
    generate_option4_retro_crunch()
    print("All 4 variations generated successfully!")
