import math
import struct
import wave
import random
import os

SAMPLE_RATE = 44100

def note_to_freq(note_str):
    names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    if note_str.endswith('b'):
        # handle flat
        base = note_str[:-2]
        octave = int(note_str[-2])
    # parse standard
    for i, n in enumerate(names):
        if note_str.startswith(n):
            oct_str = note_str[len(n):]
            if oct_str.isdigit():
                octave = int(oct_str)
                semis = (octave + 1) * 12 + i
                return 440.0 * (2.0 ** ((semis - 69) / 12.0))
    # Handle flats
    flats = {'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#'}
    for f, s in flats.items():
        if note_str.startswith(f):
            octave = int(note_str[len(f):])
            return note_to_freq(s + str(octave))
    return 440.0

def synth_guitar_string(f0, dur_s, damping=0.994, brightness=0.65, vibrato_speed=0.0, vibrato_depth=0.0, vibrato_delay=0.15):
    if f0 <= 10.0:
        return [0.0] * int(dur_s * SAMPLE_RATE)
        
    nominal_period = int(SAMPLE_RATE / f0)
    if nominal_period < 2: nominal_period = 2
    
    noise_burst = [(random.random() * 2 - 1) for _ in range(nominal_period)]
    for i in range(1, nominal_period):
        noise_burst[i] = noise_burst[i] * brightness + noise_burst[i-1] * (1.0 - brightness)
        
    n_samples = int(dur_s * SAMPLE_RATE)
    out = [0.0] * n_samples
    ring_buf = list(noise_burst)
    p = 0
    prev = 0.0
    
    pickup_delay = max(1, int(nominal_period * 0.18))
    
    for i in range(n_samples):
        cur_val = ring_buf[p]
        filtered = (cur_val + prev) * 0.5 * damping
        prev = cur_val
        ring_buf[p] = filtered
        
        pickup_pos = (p - pickup_delay) % nominal_period
        string_out = cur_val * 0.7 + ring_buf[pickup_pos] * 0.3
        
        out[i] = string_out
        p = (p + 1) % nominal_period
        
    if vibrato_depth > 0.0 and vibrato_speed > 0.0:
        vib_out = [0.0] * n_samples
        delay_samp = int(vibrato_delay * SAMPLE_RATE)
        for i in range(n_samples):
            t = i / SAMPLE_RATE
            if i < delay_samp:
                depth = 0.0
            else:
                depth = min(vibrato_depth, vibrato_depth * ((i - delay_samp) / (0.2 * SAMPLE_RATE)))
            mod = depth * math.sin(2 * math.pi * vibrato_speed * t)
            idx_mod = i + int(mod)
            if 0 <= idx_mod < n_samples:
                vib_out[i] = out[idx_mod]
            else:
                vib_out[i] = out[i]
        out = vib_out
        
    return out

def render_power_chord(root_note, dur_s, is_palm_mute=False, gain=12.0):
    f_root = note_to_freq(root_note)
    f_5th = f_root * 1.5
    f_oct = f_root * 2.0
    
    damping = 0.965 if is_palm_mute else 0.995
    brightness = 0.45 if is_palm_mute else 0.78
    chord_dur = min(dur_s, 0.16 if is_palm_mute else dur_s)
    
    s1 = synth_guitar_string(f_root, chord_dur + 0.04, damping=damping, brightness=brightness)
    s2 = synth_guitar_string(f_5th, chord_dur + 0.04, damping=damping, brightness=brightness)
    s3 = synth_guitar_string(f_oct, chord_dur + 0.04, damping=damping, brightness=brightness)
    
    n_s = min(len(s1), len(s2), len(s3))
    out = [0.0] * n_s
    lp1 = 0.0
    hp = 0.0
    
    for i in range(n_s):
        raw = s1[i] * 0.5 + s2[i] * 0.35 + s3[i] * 0.3
        hp += 0.92 * (raw - hp)
        dist_in = (raw - hp * 0.5) * gain
        
        if dist_in >= 0:
            clipped = math.tanh(dist_in)
        else:
            clipped = math.tanh(dist_in * 0.85) / (1.0 + 0.25 * abs(dist_in))
            
        lp1 += 0.46 * (clipped - lp1)
        out[i] = lp1
    return out

def render_lead_note(note_str, dur_s, vibrato=True, gain=7.0):
    f0 = note_to_freq(note_str)
    vib_depth = 2.4 if vibrato else 0.0
    vib_speed = 5.8 if vibrato else 0.0
    
    s = synth_guitar_string(f0, dur_s + 0.08, damping=0.996, brightness=0.75,
                            vibrato_speed=vib_speed, vibrato_depth=vib_depth, vibrato_delay=0.12)
    n_s = len(s)
    out = [0.0] * n_s
    lp = 0.0
    
    for i in range(n_s):
        raw = s[i] * gain
        sat = raw / math.sqrt(1.0 + 0.35 * raw * raw)
        lp += 0.48 * (sat - lp)
        out[i] = lp
    return out

def save_stereo_wav(path, left, right):
    n_s = min(len(left), len(right))
    peak = max(max(abs(l), abs(r)) for l, r in zip(left[:n_s], right[:n_s]))
    scale = (0.90 / peak) if peak > 0 else 1.0
    
    out_bytes = bytearray()
    for l, r in zip(left[:n_s], right[:n_s]):
        vl = max(-32768, min(32767, int(l * scale * 32767)))
        vr = max(-32768, min(32767, int(r * scale * 32767)))
        out_bytes.extend(struct.pack('<hh', vl, vr))
        
    with wave.open(path, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SAMPLE_RATE)
        w.writeframes(out_bytes)
    print(f"Saved {path} ({n_s / SAMPLE_RATE:.2f}s)")

# Simple drum helper for energetic backing rhythm
def add_drum_beat(left, right, start_samp, is_kick=False, is_snare=False, is_hat=False, is_crash=False):
    if is_kick:
        dur = int(0.18 * SAMPLE_RATE)
        for i in range(dur):
            idx = start_samp + i
            if idx >= len(left): break
            t = i / SAMPLE_RATE
            f = 135 * math.exp(-28.0 * t) + 40
            click = (random.random() * 2 - 1) * math.exp(-80.0 * t) * 0.4
            sub = math.sin(2 * math.pi * f * t) * math.exp(-12.0 * t)
            s = (click + sub) * 0.85
            left[idx] += s
            right[idx] += s
    if is_snare:
        dur = int(0.22 * SAMPLE_RATE)
        for i in range(dur):
            idx = start_samp + i
            if idx >= len(left): break
            t = i / SAMPLE_RATE
            thud = math.sin(2 * math.pi * 185 * t) * math.exp(-32.0 * t) * 0.5
            noise = (random.random() * 2 - 1) * math.exp(-18.0 * t) * 0.7
            s = (thud + noise) * 0.75
            left[idx] += s
            right[idx] += s
    if is_hat:
        dur = int(0.045 * SAMPLE_RATE)
        for i in range(dur):
            idx = start_samp + i
            if idx >= len(left): break
            t = i / SAMPLE_RATE
            n = (random.random() * 2 - 1) * math.exp(-65.0 * t) * 0.22
            left[idx] += n * 0.7
            right[idx] += n * 1.1
    if is_crash:
        dur = int(1.5 * SAMPLE_RATE)
        for i in range(dur):
            idx = start_samp + i
            if idx >= len(left): break
            t = i / SAMPLE_RATE
            c = (random.random() * 2 - 1) * math.exp(-2.5 * t) * 0.5
            left[idx] += c * 0.9
            right[idx] += c * 1.0

# ------------------------------------------------------------------------------
# 1. Riff 1: Pizza Tower Escape Metal Riff ("It's Pizza Time!" / "Death Deservioli")
# ------------------------------------------------------------------------------
def create_pizza_escape_riff():
    BPM = 175.0
    SPB = 60.0 / BPM
    TOTAL_BEATS = 24  # 6 bars of 4/4
    total_samples = int(TOTAL_BEATS * SPB * SAMPLE_RATE)
    left = [0.0] * total_samples
    right = [0.0] * total_samples
    
    # Drums & Cymbals
    add_drum_beat(left, right, 0, is_crash=True)
    for b in range(TOTAL_BEATS):
        s_beat = int(b * SPB * SAMPLE_RATE)
        # Kick on 0, 2; Snare on 1, 3
        if b % 2 == 0:
            add_drum_beat(left, right, s_beat, is_kick=True)
        else:
            add_drum_beat(left, right, s_beat, is_snare=True)
        # 16th note hi-hats
        for step in range(4):
            add_drum_beat(left, right, s_beat + int(step * (SPB / 4) * SAMPLE_RATE), is_hat=True)
            
    # Rhythm Guitar (High-gain Marshall power chord chugs)
    # Chords: D5 (4 bars), Bb5 (1 bar), C5 (1 bar)
    chord_seq = [
        ('D3', 16),
        ('Bb2', 4),
        ('C3', 4)
    ]
    cur_beat = 0
    for root, num_beats in chord_seq:
        for b in range(num_beats):
            s_b = int((cur_beat + b) * SPB * SAMPLE_RATE)
            for step in range(4):
                s_step = s_b + int(step * (SPB / 4) * SAMPLE_RATE)
                is_pm = (step % 2 != 0)
                chord_smp = render_power_chord(root, SPB / 4 * (1.2 if is_pm else 1.8), is_palm_mute=is_pm, gain=13.0)
                vol = 0.45 if is_pm else 0.65
                pan = 0.35
                for i, v in enumerate(chord_smp):
                    idx = s_step + i
                    if idx < total_samples:
                        left[idx] += v * vol * (1.0 - pan * 0.5)
                        right[idx] += v * vol * (pan * 0.5)
        cur_beat += num_beats
        
    # Lead Guitar Melody (The iconic heroic Pizza Tower escape theme)
    lead_melody = [
        # Bar 1-2
        (0.0, 'D4', 0.8), (1.0, 'F4', 0.8), (2.0, 'A4', 1.6), (3.5, 'C5', 0.5),
        (4.0, 'D5', 1.8), (6.0, 'C5', 0.8), (7.0, 'A4', 0.8),
        # Bar 3-4
        (8.0, 'G4', 0.8), (9.0, 'Ab4', 0.8), (10.0, 'A4', 1.8),
        (12.0, 'F4', 1.2), (13.5, 'D4', 0.5), (14.0, 'D4', 1.8),
        # Bar 5-6 (Climax to Bb -> C -> High D)
        (16.0, 'F4', 0.8), (17.0, 'G4', 0.8), (18.0, 'Bb4', 1.5), (19.5, 'D5', 0.5),
        (20.0, 'C5', 0.8), (21.0, 'E5', 0.8), (22.0, 'D5', 2.0)
    ]
    
    delay_samp = int(0.18 * SAMPLE_RATE)
    for b_off, note, dur_b in lead_melody:
        s_start = int(b_off * SPB * SAMPLE_RATE)
        dur_s = dur_b * SPB
        lead_smp = render_lead_note(note, dur_s, vibrato=(dur_b >= 1.0), gain=7.5)
        vol = 0.70
        pan = 0.65
        for i, v in enumerate(lead_smp):
            idx = s_start + i
            if idx < total_samples:
                left[idx] += v * vol * (1.0 - pan * 0.6)
                right[idx] += v * vol * (0.4 + pan * 0.6)
                # Stereo delay tap
                d_idx = idx + delay_samp
                if d_idx < total_samples:
                    left[d_idx] += v * vol * 0.3 * pan
                    right[d_idx] += v * vol * 0.3 * (1.0 - pan)
                    
    save_stereo_wav('sound/pizza_guitar_escape_riff.wav', left, right)

# ------------------------------------------------------------------------------
# 2. Riff 2: Pizza Tower Speed Metal Chug ("Unexpectancy Part 3" Style)
# ------------------------------------------------------------------------------
def create_pizza_speed_chug():
    BPM = 190.0
    SPB = 60.0 / BPM
    TOTAL_BEATS = 16  # 4 bars
    total_samples = int(TOTAL_BEATS * SPB * SAMPLE_RATE)
    left = [0.0] * total_samples
    right = [0.0] * total_samples
    
    add_drum_beat(left, right, 0, is_crash=True)
    for b in range(TOTAL_BEATS):
        s_beat = int(b * SPB * SAMPLE_RATE)
        add_drum_beat(left, right, s_beat, is_kick=(b % 2 == 0), is_snare=(b % 2 != 0))
        for step in range(4):
            add_drum_beat(left, right, s_beat + int(step * (SPB / 4) * SAMPLE_RATE), is_hat=True)
            
    # Relentless 16th note E minor / D minor gallop
    pattern = [
        ('E2', 0), ('E2', 1), ('E2', 2), ('E2', 3),
        ('E2', 4), ('E2', 5), ('G2', 6), ('A2', 7),
        ('E2', 8), ('E2', 9), ('E2', 10), ('E2', 11),
        ('D3', 12), ('Bb2', 14)
    ]
    for b in range(TOTAL_BEATS):
        s_b = int(b * SPB * SAMPLE_RATE)
        root = 'E2' if b < 8 else 'D2'
        for step in range(4):
            s_step = s_b + int(step * (SPB / 4) * SAMPLE_RATE)
            is_accent = (step == 0 or (b % 4 == 3 and step == 2))
            chord_smp = render_power_chord(root, SPB / 4 * (1.6 if is_accent else 1.0), is_palm_mute=not is_accent, gain=14.5)
            vol = 0.75 if is_accent else 0.50
            for i, v in enumerate(chord_smp):
                idx = s_step + i
                if idx < total_samples:
                    left[idx] += v * vol * 0.8
                    right[idx] += v * vol * 0.4
                    
    # Screaming Harmonic Squeals & Bends on top (Unexpectancy style)
    squeals = [
        (3.5, 'E5', 0.8), (7.0, 'G5', 1.2), (11.5, 'Bb5', 0.8), (14.0, 'E6', 1.8)
    ]
    for b_off, note, dur_b in squeals:
        s_start = int(b_off * SPB * SAMPLE_RATE)
        lead = render_lead_note(note, dur_b * SPB, vibrato=True, gain=9.0)
        vol = 0.80
        for i, v in enumerate(lead):
            idx = s_start + i
            if idx < total_samples:
                left[idx] += v * vol * 0.4
                right[idx] += v * vol * 0.85
                
    save_stereo_wav('sound/pizza_guitar_speed_chug.wav', left, right)

# ------------------------------------------------------------------------------
# 3. Riff 3: Funky Distortion Groove ("Cold Spaghetti / Pizza Deluxe" Style)
# ------------------------------------------------------------------------------
def create_pizza_funky_groove():
    BPM = 132.0
    SPB = 60.0 / BPM
    TOTAL_BEATS = 16
    total_samples = int(TOTAL_BEATS * SPB * SAMPLE_RATE)
    left = [0.0] * total_samples
    right = [0.0] * total_samples
    
    add_drum_beat(left, right, 0, is_crash=True)
    for b in range(TOTAL_BEATS):
        s_beat = int(b * SPB * SAMPLE_RATE)
        add_drum_beat(left, right, s_beat, is_kick=(b % 4 == 0 or b % 4 == 2.5), is_snare=(b % 4 == 1 or b % 4 == 3))
        for step in range(4):
            add_drum_beat(left, right, s_beat + int(step * (SPB / 4) * SAMPLE_RATE), is_hat=True)
            
    # Funky wah chops and muted chicken picking
    chops = [
        (0.0, 'E3', 0.35), (0.75, 'E3', 0.25), (1.5, 'G3', 0.35), (2.0, 'A3', 0.4),
        (3.0, 'D3', 0.3), (3.5, 'E3', 0.4),
        (4.0, 'E3', 0.35), (4.75, 'E3', 0.25), (5.5, 'G3', 0.35), (6.0, 'A3', 0.4),
        (7.0, 'B3', 0.4), (7.5, 'D4', 0.4),
        # Repetition with lick
        (8.0, 'E3', 0.35), (8.75, 'E3', 0.25), (9.5, 'G3', 0.35), (10.0, 'A3', 0.4),
        (11.0, 'D3', 0.3), (11.5, 'E3', 0.4),
        (12.0, 'G3', 0.4), (12.5, 'A3', 0.4), (13.0, 'Bb3', 0.4), (13.5, 'B3', 0.4),
        (14.0, 'E4', 1.8)
    ]
    for b_off, note, dur_b in chops:
        s_start = int(b_off * SPB * SAMPLE_RATE)
        chord_smp = render_power_chord(note, dur_b * SPB, is_palm_mute=(dur_b < 0.5), gain=9.5)
        vol = 0.70
        for i, v in enumerate(chord_smp):
            idx = s_start + i
            if idx < total_samples:
                left[idx] += v * vol * 0.6
                right[idx] += v * vol * 0.65
                
    save_stereo_wav('sound/pizza_guitar_funky_wah.wav', left, right)

# ------------------------------------------------------------------------------
# 4. Riff 4: Wario Land 4 Retro GBA Distortion Riff (Toxic & Fiery Soundfont)
# ------------------------------------------------------------------------------
def create_pizza_wl4_retro_riff():
    # Load extracted sample from sound/guitar_sample_toxic.wav
    with wave.open('sound/guitar_sample_toxic.wav', 'rb') as w:
        toxic_raw = w.readframes(w.getnframes())
        toxic_sr = w.getframerate()
    toxic_smp = [struct.unpack_from('<h', toxic_raw, i*2)[0] / 32768.0 for i in range(len(toxic_raw)//2)]
    
    with wave.open('sound/guitar_sample_fiery.wav', 'rb') as w:
        fiery_raw = w.readframes(w.getnframes())
        fiery_sr = w.getframerate()
    fiery_smp = [struct.unpack_from('<h', fiery_raw, i*2)[0] / 32768.0 for i in range(len(fiery_raw)//2)]
    
    # Pitch shift sample playback
    def pitch_sample(smp, orig_sr, orig_pitch, target_pitch, dur_s):
        ratio = (440.0 * (2.0 ** ((target_pitch - 69) / 12.0))) / (440.0 * (2.0 ** ((orig_pitch - 69) / 12.0)))
        step = ratio * (orig_sr / SAMPLE_RATE)
        n_out = int(dur_s * SAMPLE_RATE)
        out = [0.0] * n_out
        pos = 0.0
        loop_start = int(len(smp) * 0.3)
        loop_len = len(smp) - loop_start
        for i in range(n_out):
            idx = int(pos)
            if idx >= len(smp):
                pos = loop_start + (pos - loop_start) % loop_len
                idx = int(pos)
            out[i] = smp[idx]
            pos += step
        return out
        
    BPM = 160.0
    SPB = 60.0 / BPM
    TOTAL_BEATS = 16
    total_samples = int(TOTAL_BEATS * SPB * SAMPLE_RATE)
    left = [0.0] * total_samples
    right = [0.0] * total_samples
    
    add_drum_beat(left, right, 0, is_crash=True)
    for b in range(TOTAL_BEATS):
        s_beat = int(b * SPB * SAMPLE_RATE)
        add_drum_beat(left, right, s_beat, is_kick=(b % 2 == 0), is_snare=(b % 2 != 0))
        for step in range(4):
            add_drum_beat(left, right, s_beat + int(step * (SPB / 4) * SAMPLE_RATE), is_hat=True)
            
    # Classic WL4 / Pizza Tower GBA rock riff in D minor: D -> F -> G -> Ab -> A
    riff_notes = [
        (0.0, 50, 0.4), (0.5, 50, 0.4), (1.0, 53, 0.4), (1.5, 55, 0.4),
        (2.0, 56, 0.4), (2.5, 57, 0.8), (3.5, 55, 0.4),
        (4.0, 50, 0.4), (4.5, 50, 0.4), (5.0, 53, 0.4), (5.5, 55, 0.4),
        (6.0, 57, 0.6), (6.75, 60, 0.6), (7.5, 62, 0.8),
        # Second half with Fiery guitar lead
        (8.0, 50, 0.4), (8.5, 50, 0.4), (9.0, 53, 0.4), (9.5, 55, 0.4),
        (10.0, 56, 0.4), (10.5, 57, 0.8), (11.5, 55, 0.4),
        (12.0, 62, 0.5), (12.5, 60, 0.5), (13.0, 57, 0.5), (13.5, 55, 0.5),
        (14.0, 50, 1.8)
    ]
    for b_off, pitch, dur_b in riff_notes:
        s_start = int(b_off * SPB * SAMPLE_RATE)
        dur_s = dur_b * SPB
        # Toxic for rhythm, Fiery for high notes
        if pitch >= 57:
            smp = pitch_sample(fiery_smp, fiery_sr, 76, pitch, dur_s)
        else:
            smp = pitch_sample(toxic_smp, toxic_sr, 83, pitch, dur_s)
        vol = 0.75
        for i, v in enumerate(smp):
            idx = s_start + i
            if idx < total_samples:
                # Add crunchy distortion saturation
                dist = math.tanh(v * 2.2)
                left[idx] += dist * vol * 0.65
                right[idx] += dist * vol * 0.65
                
    save_stereo_wav('sound/pizza_guitar_wl4_toxic.wav', left, right)

# ------------------------------------------------------------------------------
# 5. One-Shot SFX: Heavy Marshall Distortion Power Chord Hit
# ------------------------------------------------------------------------------
def create_powerchord_hit():
    dur_s = 1.3
    chord = render_power_chord('D3', dur_s, is_palm_mute=False, gain=14.0)
    left = [v * 0.85 for v in chord]
    right = [v * 0.88 for v in chord]
    save_stereo_wav('sound/pizza_guitar_powerchord_hit.wav', left, right)

# ------------------------------------------------------------------------------
# 6. One-Shot SFX: Screaming Rock Guitar Squeal & Whammy Bend
# ------------------------------------------------------------------------------
def create_squeal_hit():
    dur_s = 1.1
    lead = render_lead_note('D6', dur_s, vibrato=True, gain=9.5)
    left = [v * 0.85 for v in lead]
    right = [v * 0.88 for v in lead]
    save_stereo_wav('sound/pizza_guitar_squeal_hit.wav', left, right)

if __name__ == '__main__':
    print("=== Generating Pizza Tower Style Guitar Sounds for Testing ===")
    create_pizza_escape_riff()
    create_pizza_speed_chug()
    create_pizza_funky_groove()
    create_pizza_wl4_retro_riff()
    create_powerchord_hit()
    create_squeal_hit()
    print("=== All Pizza Tower Guitar Sounds Created Successfully! ===")
