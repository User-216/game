import math
import struct
import wave
import random

SAMPLE_RATE = 44100
BPM = 177.0
SPB = 60.0 / BPM  # ~0.33898s
SP_STEP = SPB / 4.0  # 16th note = ~0.08475s

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

def synth_guitar_string(f0, dur_s, damping=0.995, brightness=0.82, vibrato_speed=0.0, vibrato_depth=0.0, vibrato_delay=0.12):
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
    
    pickup_delay = max(1, int(nominal_period * 0.16))
    
    for i in range(n_samples):
        cur_val = ring_buf[p]
        filtered = (cur_val + prev) * 0.5 * damping
        prev = cur_val
        ring_buf[p] = filtered
        
        pickup_pos = (p - pickup_delay) % nominal_period
        string_out = cur_val * 0.75 + ring_buf[pickup_pos] * 0.25
        out[i] = string_out
        p = (p + 1) % nominal_period
        
    if vibrato_depth > 0.0 and vibrato_speed > 0.0:
        vib_out = [0.0] * n_samples
        delay_samp = int(vibrato_delay * SAMPLE_RATE)
        for i in range(n_samples):
            t = i / SAMPLE_RATE
            depth = 0.0 if i < delay_samp else min(vibrato_depth, vibrato_depth * ((i - delay_samp) / (0.15 * SAMPLE_RATE)))
            mod = depth * math.sin(2 * math.pi * vibrato_speed * t)
            idx_mod = i + int(mod)
            vib_out[i] = out[idx_mod] if 0 <= idx_mod < n_samples else out[i]
        out = vib_out
        
    return out

def render_arcade_lead_note(note_str, dur_s, vibrato=False, gain=8.5):
    f0 = note_to_freq(note_str)
    vib_d = 2.2 if vibrato else 0.0
    vib_s = 6.2 if vibrato else 0.0
    
    # Bright biting attack
    s = synth_guitar_string(f0, dur_s + 0.04, damping=0.996, brightness=0.88,
                            vibrato_speed=vib_s, vibrato_depth=vib_d, vibrato_delay=0.08)
    n_s = len(s)
    out = [0.0] * n_s
    lp = 0.0
    
    for i in range(n_s):
        raw = s[i] * gain
        # Tube saturation with presence bite
        sat = math.tanh(raw * 1.3) + 0.15 * math.tanh(raw * 2.8)
        lp += 0.58 * (sat - lp)
        out[i] = lp * 0.85
    return out

def render_power_chord_chug(root_note, dur_s, is_palm_mute=True, gain=13.0):
    f_root = note_to_freq(root_note)
    f_5th = f_root * 1.5
    f_oct = f_root * 2.0
    damping = 0.965 if is_palm_mute else 0.994
    brightness = 0.48 if is_palm_mute else 0.80
    chord_dur = min(dur_s, 0.14 if is_palm_mute else dur_s)
    
    s1 = synth_guitar_string(f_root, chord_dur + 0.03, damping=damping, brightness=brightness)
    s2 = synth_guitar_string(f_5th, chord_dur + 0.03, damping=damping, brightness=brightness)
    s3 = synth_guitar_string(f_oct, chord_dur + 0.03, damping=damping, brightness=brightness)
    n_s = min(len(s1), len(s2), len(s3))
    out = [0.0] * n_s
    lp = 0.0
    hp = 0.0
    for i in range(n_s):
        raw = s1[i] * 0.5 + s2[i] * 0.35 + s3[i] * 0.3
        hp += 0.92 * (raw - hp)
        dist_in = (raw - hp * 0.5) * gain
        clipped = math.tanh(dist_in) if dist_in >= 0 else (math.tanh(dist_in * 0.85) / (1.0 + 0.25 * abs(dist_in)))
        lp += 0.45 * (clipped - lp)
        out[i] = lp
    return out

def add_drum(left, right, start_samp, is_kick=False, is_snare=False, is_hat=False, is_crash=False):
    tot = len(left)
    if is_kick:
        dur = int(0.18 * SAMPLE_RATE)
        for i in range(dur):
            idx = start_samp + i
            if idx >= tot: break
            t = i / SAMPLE_RATE
            f = 140 * math.exp(-30.0 * t) + 42
            s = (math.sin(2 * math.pi * f * t) + (random.random()*2-1)*math.exp(-70.0*t)*0.3) * math.exp(-11.0 * t) * 0.85
            left[idx] += s; right[idx] += s
    if is_snare:
        dur = int(0.22 * SAMPLE_RATE)
        for i in range(dur):
            idx = start_samp + i
            if idx >= tot: break
            t = i / SAMPLE_RATE
            s = (math.sin(2*math.pi*190*t)*math.exp(-30.0*t)*0.4 + (random.random()*2-1)*math.exp(-18.0*t)*0.75) * 0.85
            left[idx] += s; right[idx] += s
    if is_hat:
        dur = int(0.045 * SAMPLE_RATE)
        for i in range(dur):
            idx = start_samp + i
            if idx >= tot: break
            t = i / SAMPLE_RATE
            h = (random.random()*2-1) * math.exp(-65.0 * t) * 0.25
            left[idx] += h * 0.7; right[idx] += h * 1.1
    if is_crash:
        dur = int(1.6 * SAMPLE_RATE)
        for i in range(dur):
            idx = start_samp + i
            if idx >= tot: break
            t = i / SAMPLE_RATE
            c = (random.random()*2-1) * math.exp(-2.4 * t) * 0.5
            left[idx] += c * 0.9; right[idx] += c * 1.0

def save_wav(path, left, right):
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
    print(f"Saved {path} ({n_s / SAMPLE_RATE:.2f}s, peak={peak:.2f})")

# ------------------------------------------------------------------------------
# EXACT THEME RECONSTRUCTION FROM USER REFERENCE AUDIO
# The 1-phrase pattern is 16 beats (4 bars at 177 BPM = ~5.42s), repeated twice (= ~10.85s)
# ------------------------------------------------------------------------------
USER_VIBE_PHRASE_1 = [
    # Bar 1 (0 to 4 beats): B5 staccato -> F#5 -> A5
    (0.5, 'B5', 0.6, False),
    (1.25, 'B5', 0.45, False),
    (1.75, 'F#5', 0.65, False),
    (2.5, 'F#5', 0.45, False),
    (3.0, 'A5', 0.85, False),
    
    # Bar 2 (4 to 8 beats): B5 -> C#6 -> B5 -> C#6 -> B5 -> A5
    (4.5, 'B5', 0.45, False),
    (5.0, 'C#6', 0.5, False),
    (5.5, 'B5', 0.45, False),
    (6.0, 'C#6', 0.5, False),
    (6.5, 'B5', 0.45, False),
    (7.0, 'A5', 0.8, False),
    
    # Bar 3 (8 to 12 beats): F#5 -> fast tremolo trill (F#5 <-> G5)
    (8.0, 'F#5', 0.6, False),
    # Rapid 16th-note trill / shredding
    (8.75, 'F#5', 0.22, False), (9.0, 'G5', 0.22, False),
    (9.25, 'F#5', 0.22, False), (9.5, 'G5', 0.22, False),
    (9.75, 'F#5', 0.22, False), (10.0, 'G5', 0.22, False),
    (10.25, 'F#5', 0.22, False), (10.5, 'G5', 0.22, False),
    (10.75, 'F#5', 0.5, True),
    
    # Bar 4 (12 to 16 beats): Desperate soaring finish B5 -> C#6 -> D6
    (12.0, 'B5', 0.5, False),
    (12.75, 'C#6', 0.5, False),
    (13.5, 'D6', 1.8, True),
]

USER_VIBE_PHRASE_2 = [
    # Bar 5 (16 to 20 beats)
    (16.5, 'B5', 0.6, False),
    (17.25, 'B5', 0.45, False),
    (17.75, 'F#5', 0.65, False),
    (18.5, 'F#5', 0.45, False),
    (19.0, 'A5', 0.85, False),
    
    # Bar 6 (20 to 24 beats)
    (20.5, 'B5', 0.45, False),
    (21.0, 'C#6', 0.5, False),
    (21.5, 'B5', 0.45, False),
    (22.0, 'C#6', 0.5, False),
    (22.5, 'B5', 0.45, False),
    (23.0, 'A5', 0.8, False),
    
    # Bar 7 (24 to 28 beats): Rapid trill climax
    (24.0, 'F#5', 0.6, False),
    (24.75, 'F#5', 0.22, False), (25.0, 'G5', 0.22, False),
    (25.25, 'F#5', 0.22, False), (25.5, 'G5', 0.22, False),
    (25.75, 'F#5', 0.22, False), (26.0, 'G5', 0.22, False),
    (26.25, 'F#5', 0.22, False), (26.5, 'G5', 0.22, False),
    (26.75, 'F#5', 0.5, True),
    
    # Bar 8 (28 to 32 beats): Grand climax High F#6 squeal!
    (28.0, 'D6', 0.6, False),
    (28.75, 'E6', 0.6, False),
    (29.5, 'F#6', 2.4, True),
]

TOTAL_BEATS = 34  # ~11.52 seconds
TOTAL_SAMPLES = int(TOTAL_BEATS * SPB * SAMPLE_RATE)

# ------------------------------------------------------------------------------
# 1. sound/pizza_guitar_vibe_match.wav
# ------------------------------------------------------------------------------
def create_vibe_match():
    left = [0.0] * TOTAL_SAMPLES
    right = [0.0] * TOTAL_SAMPLES
    
    # Drums
    add_drum(left, right, 0, is_crash=True)
    add_drum(left, right, int(16 * SPB * SAMPLE_RATE), is_crash=True)
    for b in range(TOTAL_BEATS):
        s_beat = int(b * SPB * SAMPLE_RATE)
        add_drum(left, right, s_beat, is_kick=(b % 2 == 0), is_snare=(b % 2 != 0))
        for step in range(4):
            add_drum(left, right, s_beat + int(step * SP_STEP * SAMPLE_RATE), is_hat=True)
            
    # Rhythm Bass & Guitar Chug (B minor -> G -> A -> F#)
    chords = [
        ('B2', 8), ('G2', 4), ('A2', 4),
        ('B2', 8), ('G2', 4), ('F#2', 4), ('B2', 2)
    ]
    cur_b = 0
    for root, dur_beats in chords:
        for b in range(dur_beats):
            s_b = int((cur_b + b) * SPB * SAMPLE_RATE)
            for step in range(4):
                s_step = s_b + int(step * SP_STEP * SAMPLE_RATE)
                is_accent = (step == 0)
                chord_smp = render_power_chord_chug(root, SP_STEP * (1.8 if is_accent else 1.1), is_palm_mute=not is_accent)
                vol = 0.55 if is_accent else 0.40
                for i, v in enumerate(chord_smp):
                    idx = s_step + i
                    if idx < TOTAL_SAMPLES:
                        left[idx] += v * vol * 0.75
                        right[idx] += v * vol * 0.35
        cur_b += dur_beats
        
    # Lead Guitar Melody
    delay_samp = int(0.18 * SAMPLE_RATE)
    for b_off, note, dur_b, vib in (USER_VIBE_PHRASE_1 + USER_VIBE_PHRASE_2):
        s_start = int(b_off * SPB * SAMPLE_RATE)
        dur_s = dur_b * SPB
        lead = render_arcade_lead_note(note, dur_s, vibrato=vib, gain=8.8)
        vol = 0.75
        for i, v in enumerate(lead):
            idx = s_start + i
            if idx < TOTAL_SAMPLES:
                left[idx] += v * vol * 0.55
                right[idx] += v * vol * 0.85
                d_idx = idx + delay_samp
                if d_idx < TOTAL_SAMPLES:
                    left[d_idx] += v * vol * 0.28
                    right[d_idx] += v * vol * 0.15
                    
    save_wav('sound/pizza_guitar_vibe_match.wav', left, right)

# ------------------------------------------------------------------------------
# 2. sound/pizza_guitar_vibe_harmony.wav (Twin Guitar Harmony)
# ------------------------------------------------------------------------------
def create_vibe_harmony():
    left = [0.0] * TOTAL_SAMPLES
    right = [0.0] * TOTAL_SAMPLES
    
    # Drums
    add_drum(left, right, 0, is_crash=True)
    add_drum(left, right, int(16 * SPB * SAMPLE_RATE), is_crash=True)
    for b in range(TOTAL_BEATS):
        s_beat = int(b * SPB * SAMPLE_RATE)
        add_drum(left, right, s_beat, is_kick=(b % 2 == 0), is_snare=(b % 2 != 0))
        for step in range(4):
            add_drum(left, right, s_beat + int(step * SP_STEP * SAMPLE_RATE), is_hat=True)
            
    # Rhythm Power Chords
    chords = [
        ('B2', 8), ('G2', 4), ('A2', 4),
        ('B2', 8), ('G2', 4), ('F#2', 4), ('B2', 2)
    ]
    cur_b = 0
    for root, dur_beats in chords:
        for b in range(dur_beats):
            s_b = int((cur_b + b) * SPB * SAMPLE_RATE)
            for step in range(4):
                s_step = s_b + int(step * SP_STEP * SAMPLE_RATE)
                is_accent = (step == 0)
                chord_smp = render_power_chord_chug(root, SP_STEP * (1.8 if is_accent else 1.1), is_palm_mute=not is_accent)
                vol = 0.52 if is_accent else 0.38
                for i, v in enumerate(chord_smp):
                    idx = s_step + i
                    if idx < TOTAL_SAMPLES:
                        left[idx] += v * vol * 0.5
                        right[idx] += v * vol * 0.5
        cur_b += dur_beats
        
    # Twin Guitar Harmony: Lead 1 (panned right) + Harmony 1 (3rd above, panned left)
    harmony_map = {
        'B5': 'D6', 'F#5': 'A5', 'A5': 'C#6', 'C#6': 'E6', 'G5': 'B5',
        'D6': 'F#6', 'E6': 'G6', 'F#6': 'A6'
    }
    
    for b_off, note, dur_b, vib in (USER_VIBE_PHRASE_1 + USER_VIBE_PHRASE_2):
        s_start = int(b_off * SPB * SAMPLE_RATE)
        dur_s = dur_b * SPB
        
        # Lead (Right)
        lead = render_arcade_lead_note(note, dur_s, vibrato=vib, gain=8.5)
        for i, v in enumerate(lead):
            idx = s_start + i
            if idx < TOTAL_SAMPLES:
                left[idx] += v * 0.35
                right[idx] += v * 0.85
                
        # Harmony (Left)
        harm_note = harmony_map.get(note, note)
        harm = render_arcade_lead_note(harm_note, dur_s, vibrato=vib, gain=8.0)
        for i, v in enumerate(harm):
            idx = s_start + i
            if idx < TOTAL_SAMPLES:
                left[idx] += v * 0.80
                right[idx] += v * 0.30
                
    save_wav('sound/pizza_guitar_vibe_harmony.wav', left, right)

# ------------------------------------------------------------------------------
# 3. sound/pizza_guitar_vibe_speed_metal.wav (190 BPM Hyper Chug & Squeals)
# ------------------------------------------------------------------------------
def create_vibe_speed_metal():
    BPM_M = 188.0
    SPB_M = 60.0 / BPM_M
    SP_STEP_M = SPB_M / 4.0
    tot_samples = int(32 * SPB_M * SAMPLE_RATE)
    left = [0.0] * tot_samples
    right = [0.0] * tot_samples
    
    add_drum(left, right, 0, is_crash=True)
    for b in range(32):
        s_beat = int(b * SPB_M * SAMPLE_RATE)
        add_drum(left, right, s_beat, is_kick=(b % 2 == 0), is_snare=(b % 2 != 0))
        for step in range(4):
            add_drum(left, right, s_beat + int(step * SP_STEP_M * SAMPLE_RATE), is_hat=True)
            
    # Relentless 16th-note B minor palm mute gallop
    for b in range(32):
        s_b = int(b * SPB_M * SAMPLE_RATE)
        root = 'B2' if b < 16 else ('G2' if b < 24 else 'F#2')
        for step in range(4):
            s_step = s_b + int(step * SP_STEP_M * SAMPLE_RATE)
            is_acc = (step == 0 or (b % 4 == 3 and step == 2))
            c = render_power_chord_chug(root, SP_STEP_M * (1.6 if is_acc else 1.0), is_palm_mute=not is_acc, gain=14.5)
            vol = 0.70 if is_acc else 0.45
            for i, v in enumerate(c):
                idx = s_step + i
                if idx < tot_samples:
                    left[idx] += v * vol * 0.8
                    right[idx] += v * vol * 0.4
                    
    # Screaming Lead Squeals
    for b_off, note, dur_b, vib in (USER_VIBE_PHRASE_1 + USER_VIBE_PHRASE_2):
        s_start = int(b_off * SPB_M * SAMPLE_RATE)
        dur_s = dur_b * SPB_M
        lead = render_arcade_lead_note(note, dur_s, vibrato=True, gain=9.2)
        vol = 0.82
        for i, v in enumerate(lead):
            idx = s_start + i
            if idx < tot_samples:
                left[idx] += v * vol * 0.45
                right[idx] += v * vol * 0.90
                
    save_wav('sound/pizza_guitar_vibe_speed_metal.wav', left, right)

if __name__ == '__main__':
    print("=== Generating '이런 느낌' Pizza Tower Guitar Sound Variations ===")
    create_vibe_match()
    create_vibe_harmony()
    create_vibe_speed_metal()
    print("=== All Variations Generated Successfully! ===")
