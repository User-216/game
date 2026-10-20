import math
import struct
import wave
import random
import os
import shutil
import time

t_start = time.time()

# Audio settings
SAMPLE_RATE = 44100
BPM = 116.0
BEATS_PER_BAR = 4
STEPS_PER_BEAT = 4  # 16th notes
TOTAL_BARS = 80
TOTAL_STEPS = TOTAL_BARS * BEATS_PER_BAR * STEPS_PER_BEAT  # 1280 steps

print(f"=== Composing Authentic Super Mario 64 Tutorial Soundtrack ===")
print(f"Total Bars: {TOTAL_BARS} at {BPM} BPM ({TOTAL_STEPS} 16th steps)")

# Timing calculation with authentic SM64 swing (57% swing on 16th notes)
SWING_RATIO = 0.57
SECONDS_PER_BEAT = 60.0 / BPM
EVEN_16TH_DUR = (SECONDS_PER_BEAT / 4.0) * (SWING_RATIO * 2.0)
ODD_16TH_DUR  = (SECONDS_PER_BEAT / 4.0) * ((1.0 - SWING_RATIO) * 2.0)

step_start_samples = [0] * (TOTAL_STEPS + 1)
accum_time = 0.0
for s in range(TOTAL_STEPS):
    step_start_samples[s] = int(accum_time * SAMPLE_RATE)
    dur = EVEN_16TH_DUR if (s % 2 == 0) else ODD_16TH_DUR
    accum_time += dur
step_start_samples[TOTAL_STEPS] = int(accum_time * SAMPLE_RATE)
TOTAL_SAMPLES = step_start_samples[TOTAL_STEPS]

print(f"Total Duration: {TOTAL_SAMPLES / SAMPLE_RATE:.2f} seconds ({TOTAL_SAMPLES} samples)")

# Allocate stereo mixing buffers
left_buf = [0.0] * TOTAL_SAMPLES
right_buf = [0.0] * TOTAL_SAMPLES

# ------------------------------------------------------------------------------
# 1. LOAD SM64 SAMPLES
# ------------------------------------------------------------------------------
print("Loading official SM64 soundfont samples...")

def load_wav_sample(path):
    with wave.open(path, 'rb') as w:
        frames = w.readframes(w.getnframes())
        raw = struct.unpack(f'<{len(frames)//2}h', frames)
        sr = w.getframerate()
        # Normalize to float -1.0 to 1.0
        return [s / 32768.0 for s in raw], sr

# Instrument definitions: (filename, root_pitch, sample_rate, loop_start, loop_end)
samples_info = {
    'bass':        ('sm64_samples/sample_12_Sample_2.wav', 44, 16014, 7649, 10889),
    'steel':       ('sm64_samples/sample_22_Sample_4-1.wav', 61, 32027, 14649, 19353),
    'brass':       ('sm64_samples/sample_30_Sample_2-1.wav', 63, 32011, 5361, 19537),
    'accordion':   ('sm64_samples/sample_21_Sample_11.wav', 72, 32007, 6777, 20297),
    'whistle':     ('sm64_samples/sample_27_Sample_9-1.wav', 60, 32005, 19513, 30449),
    'pizz':        ('sm64_samples/sample_39_Sample_4-4.wav', 58, 32000, 0, 0), # one-shot
    'flute':       ('sm64_samples/sample_20_Sample_10.wav', 60, 32017, 7745, 15113),
    'epiano':      ('sm64_samples/sample_62_Electric_Piano.wav', 64, 44100, 0, 0), # one-shot
    'kick':        ('sm64_samples/sample_19_Sample_9.wav', 36, 16000, 0, 0),
    'snare':       ('sm64_samples/sample_18_Sample_8.wav', 30, 24000, 0, 0),
    'hihat_c':     ('sm64_samples/sample_01_Sample_1.wav', 40, 32000, 0, 0),
    'hihat_o':     ('sm64_samples/sample_02_Sample_2.wav', 46, 32000, 0, 0),
    'crash':       ('sm64_samples/sample_07_Sample_7.wav', 51, 32000, 0, 0),
    'tamb':        ('sm64_samples/sample_55_Sample_6-1.wav', 51, 32000, 0, 0),
    'bongo':       ('sm64_samples/sample_11_Sample_1.wav', 76, 32000, 0, 0),
    'agogo':       ('sm64_samples/sample_57_Sample_4-6.wav', 84, 32000, 0, 0),
    'hit':         ('sm64_samples/sample_32_Sample_3-2.wav', 60, 32000, 0, 0),
    'rev_cymbal':  ('sm64_samples/sample_63_Reverse_Cymbal.wav', 64, 44100, 0, 0),
}

sample_data = {}
for name, (fname, root_p, sr, l_start, l_end) in samples_info.items():
    data, actual_sr = load_wav_sample(fname)
    sample_data[name] = {
        'data': data,
        'root_pitch': root_p,
        'sr': actual_sr,
        'loop_start': l_start,
        'loop_end': l_end,
        'len': len(data)
    }

print("All SM64 samples loaded successfully.")

# ------------------------------------------------------------------------------
# 2. NOTE UTILITIES & RESAMPLER
# ------------------------------------------------------------------------------
NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
FLAT_MAP = {'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#'}

def note_to_midi(note_str):
    if not note_str or note_str == '-': return None
    name = note_str[:-1]
    octave = int(note_str[-1])
    if name in FLAT_MAP: name = FLAT_MAP[name]
    semitone = NOTE_NAMES.index(name)
    return (octave + 1) * 12 + semitone

# Stereo Panning constant power gains (-1.0 left, 0.0 center, +1.0 right)
def pan_gains(pan):
    # pan in [-1.0, 1.0] -> angle in [0, pi/2]
    angle = (pan + 1.0) * (math.pi / 4.0)
    return math.cos(angle), math.sin(angle)

def render_note(inst_name, note_val, start_step, step_len=1.0, vol=1.0, pan=0.0,
                attack_ms=5.0, release_ms=30.0, is_decay=False):
    """Render a melodic note using sample resampling and ADSR envelope."""
    if note_val is None or note_val == '-': return
    midi_pitch = note_to_midi(note_val) if isinstance(note_val, str) else note_val
    if midi_pitch is None: return

    s_info = sample_data[inst_name]
    raw = s_info['data']
    root = s_info['root_pitch']
    s_sr = s_info['sr']
    l_start = s_info['loop_start']
    l_end = s_info['loop_end']
    s_len = s_info['len']

    start_idx = step_start_samples[min(start_step, TOTAL_STEPS)]
    end_step = min(start_step + step_len, TOTAL_STEPS)
    base_end_idx = step_start_samples[int(end_step)]
    if end_step > int(end_step):
        frac_step = end_step - int(end_step)
        next_step = min(int(end_step) + 1, TOTAL_STEPS)
        base_end_idx += int(frac_step * (step_start_samples[next_step] - step_start_samples[int(end_step)]))

    # Release samples
    rel_samples = int((release_ms / 1000.0) * SAMPLE_RATE)
    att_samples = max(1, int((attack_ms / 1000.0) * SAMPLE_RATE))
    total_note_samples = (base_end_idx - start_idx) + rel_samples

    # Playback step size
    step_size = (2.0 ** ((midi_pitch - root) / 12.0)) * (s_sr / float(SAMPLE_RATE))

    gain_l, gain_r = pan_gains(pan)
    gain_l *= vol
    gain_r *= vol

    pos = 0.0
    has_loop = (l_end > l_start and l_end <= s_len)

    for i in range(total_note_samples):
        target_idx = start_idx + i
        if target_idx >= TOTAL_SAMPLES: break

        # Handle sample looping vs one-shot
        if has_loop:
            if pos >= l_end:
                pos = l_start + ((pos - l_start) % (l_end - l_start))
            idx0 = int(pos)
            idx1 = idx0 + 1 if idx0 + 1 < s_len else l_start
            frac = pos - idx0
            val = (1.0 - frac) * raw[idx0] + frac * raw[idx1]
        else:
            idx0 = int(pos)
            if idx0 >= s_len - 1:
                break
            frac = pos - idx0
            val = (1.0 - frac) * raw[idx0] + frac * raw[idx0 + 1]

        # Envelope
        env = 1.0
        if i < att_samples:
            env = i / float(att_samples)
        elif i >= (base_end_idx - start_idx):
            # Release fade
            rel_i = i - (base_end_idx - start_idx)
            env = max(0.0, 1.0 - (rel_i / float(rel_samples)))
        
        if is_decay:
            # Perceptual decay for plucked instruments like pizzicato / EPiano
            decay_env = math.exp(-3.5 * (i / float(SAMPLE_RATE)))
            env *= decay_env

        sample_out = val * env
        left_buf[target_idx] += sample_out * gain_l
        right_buf[target_idx] += sample_out * gain_r

        pos += step_size

def render_drum(drum_name, start_step, vol=1.0, pan=0.0, pitch_shift=0):
    """Render a drum one-shot sample."""
    s_info = sample_data[drum_name]
    raw = s_info['data']
    s_sr = s_info['sr']
    s_len = s_info['len']

    start_idx = step_start_samples[min(start_step, TOTAL_STEPS)]
    gain_l, gain_r = pan_gains(pan)
    gain_l *= vol
    gain_r *= vol

    step_size = (2.0 ** (pitch_shift / 12.0)) * (s_sr / float(SAMPLE_RATE))
    pos = 0.0

    while True:
        idx0 = int(pos)
        if idx0 >= s_len - 1: break
        target_idx = start_idx + int(pos / step_size)
        if target_idx >= TOTAL_SAMPLES: break

        frac = pos - idx0
        val = (1.0 - frac) * raw[idx0] + frac * raw[idx0 + 1]

        left_buf[target_idx] += val * gain_l
        right_buf[target_idx] += val * gain_r
        pos += step_size

print("Resampler and drum synth ready.")

# ------------------------------------------------------------------------------
# 3. COMPOSITION PATTERNS
# ------------------------------------------------------------------------------
print("Arranging musical sections...")

# --- DRUM GENERATOR HELPER ---
def apply_drums(bar, pattern_type):
    base_step = bar * 16
    if pattern_type == 'intro_light':
        # Bongos & Tambourine & Hi-Hat
        for beat in range(4):
            # Hi-hat on 8ths
            render_drum('hihat_c', base_step + beat * 4, vol=0.55, pan=0.3)
            render_drum('hihat_c', base_step + beat * 4 + 2, vol=0.45, pan=0.3)
        # Tambourine on 2 and 4
        render_drum('tamb', base_step + 4, vol=0.6, pan=0.4)
        render_drum('tamb', base_step + 12, vol=0.6, pan=0.4)
        # Bongos
        render_drum('bongo', base_step + 0, vol=0.7, pan=-0.4, pitch_shift=0)  # High
        render_drum('bongo', base_step + 6, vol=0.65, pan=-0.4, pitch_shift=0) # High
        render_drum('bongo', base_step + 8, vol=0.7, pan=0.4, pitch_shift=-5)  # Low
        render_drum('bongo', base_step + 14, vol=0.6, pan=-0.4, pitch_shift=0) # High

    elif pattern_type == 'full_groove':
        # Bob-omb Battlefield signature groove!
        # Kick on 1, 2&, 3
        render_drum('kick', base_step + 0, vol=0.9, pan=0.0)
        render_drum('kick', base_step + 6, vol=0.75, pan=0.0)
        render_drum('kick', base_step + 8, vol=0.85, pan=0.0)
        # Snare on 2 and 4
        render_drum('snare', base_step + 4, vol=0.85, pan=-0.1)
        render_drum('snare', base_step + 12, vol=0.9, pan=-0.1)
        # Ghost snare on 15 occasionally
        if bar % 2 == 1:
            render_drum('snare', base_step + 15, vol=0.45, pan=-0.1)

        # Hi-hats
        for s in [0, 2, 4, 8, 10, 12]:
            render_drum('hihat_c', base_step + s, vol=0.6, pan=0.3)
        # Open Hi-hat on offbeats
        render_drum('hihat_o', base_step + 6, vol=0.5, pan=0.35)
        render_drum('hihat_o', base_step + 14, vol=0.55, pan=0.35)

        # Tambourine 8th pulse
        for s in [0, 2, 4, 6, 8, 10, 12, 14]:
            v = 0.65 if s in [4, 12] else 0.4
            render_drum('tamb', base_step + s, vol=v, pan=0.45)

        # Bongos
        render_drum('bongo', base_step + 2, vol=0.6, pan=-0.4, pitch_shift=0)
        render_drum('bongo', base_step + 6, vol=0.65, pan=0.4, pitch_shift=-5)
        render_drum('bongo', base_step + 10, vol=0.6, pan=-0.4, pitch_shift=0)
        render_drum('bongo', base_step + 14, vol=0.65, pan=0.4, pitch_shift=-5)

    elif pattern_type == 'full_groove_fill':
        # Energetic fill bar
        render_drum('kick', base_step + 0, vol=0.9, pan=0.0)
        render_drum('snare', base_step + 4, vol=0.85, pan=-0.1)
        render_drum('kick', base_step + 6, vol=0.75, pan=0.0)
        render_drum('kick', base_step + 8, vol=0.85, pan=0.0)
        # Snare rolls
        render_drum('snare', base_step + 10, vol=0.6, pan=-0.1)
        render_drum('snare', base_step + 12, vol=0.75, pan=-0.1)
        render_drum('snare', base_step + 13, vol=0.8, pan=-0.1)
        render_drum('snare', base_step + 14, vol=0.85, pan=-0.1)
        render_drum('snare', base_step + 15, vol=0.9, pan=-0.1)
        render_drum('tamb', base_step + 12, vol=0.8, pan=0.45)

    elif pattern_type == 'chill_water':
        # Gentle half-time Dire Dire Docks groove
        render_drum('kick', base_step + 0, vol=0.65, pan=0.0)
        render_drum('kick', base_step + 8, vol=0.55, pan=0.0)
        # Soft hihat taps on 4, 12
        render_drum('hihat_c', base_step + 4, vol=0.35, pan=0.3)
        render_drum('hihat_c', base_step + 12, vol=0.35, pan=0.3)
        # Soft bongo
        if bar % 2 == 0:
            render_drum('bongo', base_step + 6, vol=0.45, pan=-0.3, pitch_shift=0)
            render_drum('bongo', base_step + 14, vol=0.4, pan=0.3, pitch_shift=-5)

# --- BASS HELPER ---
def apply_slap_bass(bar, root_chord):
    base_step = bar * 16
    # Slap thumb on low root/fifth, pluck pop on octave!
    # Pattern: [step, note, dur, vol]
    if root_chord == 'C':
        notes = [(0, 'C2', 1.8, 0.9), (2, 'C3', 1.2, 0.75), (4, 'G2', 1.8, 0.85),
                 (6, 'C3', 1.2, 0.75), (8, 'E2', 1.8, 0.85), (10, 'G2', 1.8, 0.85),
                 (12, 'Bb2', 1.5, 0.8), (14, 'B2', 1.5, 0.8)]
    elif root_chord == 'F':
        notes = [(0, 'F2', 1.8, 0.9), (2, 'F3', 1.2, 0.75), (4, 'C3', 1.8, 0.85),
                 (6, 'F3', 1.2, 0.75), (8, 'A2', 1.8, 0.85), (10, 'C3', 1.8, 0.85),
                 (12, 'D3', 1.5, 0.8), (14, 'D#3', 1.5, 0.8)]
    elif root_chord == 'G':
        notes = [(0, 'G2', 1.8, 0.9), (2, 'G3', 1.2, 0.75), (4, 'D3', 1.8, 0.85),
                 (6, 'G3', 1.2, 0.75), (8, 'B2', 1.8, 0.85), (10, 'D3', 1.8, 0.85),
                 (12, 'F3', 1.5, 0.8), (14, 'F#3', 1.5, 0.8)]
    elif root_chord == 'Am':
        notes = [(0, 'A2', 1.8, 0.9), (2, 'A3', 1.2, 0.75), (4, 'E3', 1.8, 0.85),
                 (6, 'A3', 1.2, 0.75), (8, 'C3', 1.8, 0.85), (10, 'E3', 1.8, 0.85),
                 (12, 'G3', 1.5, 0.8), (14, 'G#3', 1.5, 0.8)]
    elif root_chord in ['Dm', 'D']:
        notes = [(0, 'D2', 1.8, 0.9), (2, 'D3', 1.2, 0.75), (4, 'A2', 1.8, 0.85),
                 (6, 'D3', 1.2, 0.75), (8, 'F#2' if root_chord == 'D' else 'F2', 1.8, 0.85),
                 (10, 'A2', 1.8, 0.85), (12, 'C3', 1.5, 0.8), (14, 'C#3', 1.5, 0.8)]
    elif root_chord == 'Em':
        notes = [(0, 'E2', 1.8, 0.9), (2, 'E3', 1.2, 0.75), (4, 'B2', 1.8, 0.85),
                 (6, 'E3', 1.2, 0.75), (8, 'G2', 1.8, 0.85), (10, 'B2', 1.8, 0.85),
                 (12, 'D3', 1.5, 0.8), (14, 'D#3', 1.5, 0.8)]
    else:
        notes = [(0, 'C2', 1.8, 0.9), (2, 'C3', 1.2, 0.75), (4, 'G2', 1.8, 0.85),
                 (6, 'C3', 1.2, 0.75), (8, 'E2', 1.8, 0.85), (10, 'G2', 1.8, 0.85),
                 (12, 'Bb2', 1.5, 0.8), (14, 'B2', 1.5, 0.8)]
    for s, n, d, v in notes:
        render_note('bass', n, base_step + s, step_len=d, vol=v, pan=0.0, release_ms=15.0)

# --- PIZZICATO OFFBEAT CHORDS ---
def apply_pizz_chords(bar, chord_name):
    base_step = bar * 16
    chord_map = {
        'C':  ['E4', 'G4', 'C5'],
        'Am': ['C4', 'E4', 'A4'],
        'Dm': ['D4', 'F4', 'A4'],
        'G':  ['D4', 'F4', 'B4'],
        'F':  ['C4', 'F4', 'A4'],
        'Em': ['E4', 'G4', 'B4'],
        'D':  ['F#4', 'A4', 'D5'],
    }
    notes = chord_map.get(chord_name, ['C4', 'E4', 'G4'])
    # Comping on the offbeats: 2, 6, 10, 14
    for offbeat in [2, 6, 10, 14]:
        for n in notes:
            render_note('pizz', n, base_step + offbeat, step_len=1.5, vol=0.45,
                        pan=0.2 if offbeat % 4 == 2 else -0.2, is_decay=True)

# ------------------------------------------------------------------------------
# 4. SECTION ARRANGEMENT
# ------------------------------------------------------------------------------

# ===== SECTION 1: INTRO (Bars 0 to 7) =====
print("Writing Section 1: Intro (Bars 1-8)...")
for b in range(8):
    if b < 6:
        apply_drums(b, 'intro_light')
    elif b == 6:
        apply_drums(b, 'full_groove')
    elif b == 7:
        apply_drums(b, 'full_groove_fill')
        # Reverse cymbal sweep into Section 2
        render_drum('rev_cymbal', b * 16 + 6, vol=0.85, pan=0.0)

# Electric Piano intro arpeggio (Bars 0 - 3)
epiano_intro = [
    # Bar 0: Cmaj7 arpeggio
    (0, 'C4'), (2, 'E4'), (4, 'G4'), (6, 'B4'), (8, 'C5'), (10, 'G4'), (12, 'E4'), (14, 'C4'),
    # Bar 1: Fmaj7 arpeggio
    (16+0, 'F3'), (16+2, 'C4'), (16+4, 'E4'), (16+6, 'A4'), (16+8, 'C5'), (16+10, 'A4'), (16+12, 'E4'), (16+14, 'C4'),
    # Bar 2: G7 arpeggio
    (32+0, 'G3'), (32+2, 'D4'), (32+4, 'F4'), (32+6, 'B4'), (32+8, 'D5'), (32+10, 'B4'), (32+12, 'F4'), (32+14, 'D4'),
    # Bar 3: C arpeggio sustain
    (48+0, 'C4'), (48+2, 'G4'), (48+4, 'C5'), (48+6, 'E5'), (48+8, 'G5'),
]
for s, n in epiano_intro:
    render_note('epiano', n, s, step_len=2.0, vol=0.6, pan=-0.2, is_decay=True)

# Slap bass enters in Bars 4 - 7
apply_slap_bass(4, 'C')
apply_slap_bass(5, 'F')
apply_slap_bass(6, 'G')
apply_slap_bass(7, 'G')

# Steel Drums intro teaser (Bars 4 - 7)
steel_teaser = [
    (4*16 + 0, 'G5', 1.8), (4*16 + 2, 'A5', 1.8), (4*16 + 4, 'G5', 2.0), (4*16 + 8, 'E5', 3.5),
    (5*16 + 0, 'A5', 1.8), (5*16 + 4, 'C6', 2.0), (5*16 + 8, 'A5', 2.0), (5*16 + 12, 'G5', 3.5),
    (6*16 + 0, 'D5', 1.8), (6*16 + 2, 'E5', 1.8), (6*16 + 4, 'F5', 1.8), (6*16 + 8, 'G5', 2.0),
    (6*16 + 12, 'A5', 1.8), (6*16 + 14, 'B5', 1.8),
    (7*16 + 0, 'C6', 2.0)
]
for s, n, d in steel_teaser:
    render_note('steel', n, s, step_len=d, vol=0.75, pan=0.25, release_ms=30.0)


# ===== SECTION 2: MAIN THEME A (Bars 8 to 23, 16 bars) =====
print("Writing Section 2: Main Theme A (Bars 9-24)...")
chords_sec2 = [
    'C', 'Am', 'Dm', 'G',  'C', 'Am', 'Dm', 'G',
    'F', 'G',  'Em', 'Am', 'Dm', 'G',  'C', 'G'
]

for i, ch in enumerate(chords_sec2):
    bar = 8 + i
    is_fill = (i in [7, 15])
    apply_drums(bar, 'full_groove_fill' if is_fill else 'full_groove')
    apply_slap_bass(bar, ch)
    apply_pizz_chords(bar, ch)
    if i == 0 or i == 8:
        render_drum('crash', bar * 16, vol=0.8, pan=-0.2)

# Steel Drums Main Sunny Melody (Bars 8 - 23)
steel_melody = [
    # Phrase 1: Bars 8 - 11
    (8*16 + 0, 'E5', 1.8), (8*16 + 2, 'G5', 1.8), (8*16 + 4, 'A5', 1.8), (8*16 + 6, 'G5', 1.8),
    (8*16 + 8, 'E5', 2.5), (8*16 + 12, 'D5', 1.8), (8*16 + 14, 'C5', 1.8),

    (9*16 + 0, 'D5', 1.8), (9*16 + 2, 'E5', 1.8), (9*16 + 4, 'G5', 2.5), (9*16 + 8, 'E5', 2.0),
    (9*16 + 12, 'D5', 3.0),

    (10*16 + 0, 'C5', 1.8), (10*16 + 2, 'D5', 1.8), (10*16 + 4, 'E5', 1.8), (10*16 + 6, 'G5', 1.8),
    (10*16 + 8, 'A5', 2.5), (10*16 + 12, 'C6', 2.0), (10*16 + 14, 'A5', 1.8),

    (11*16 + 0, 'G5', 2.0), (11*16 + 4, 'E5', 2.0), (11*16 + 8, 'D5', 3.0),

    # Phrase 2: Bars 12 - 15
    (12*16 + 0, 'E5', 1.8), (12*16 + 2, 'G5', 1.8), (12*16 + 4, 'C6', 2.5), (12*16 + 8, 'B5', 2.0),
    (12*16 + 12, 'A5', 1.8), (12*16 + 14, 'G5', 1.8),

    (13*16 + 0, 'F5', 1.8), (13*16 + 2, 'A5', 1.8), (13*16 + 4, 'D6', 2.5), (13*16 + 8, 'C6', 2.0),
    (13*16 + 12, 'A5', 2.0), (13*16 + 14, 'F5', 1.8),

    (14*16 + 0, 'G5', 1.8), (14*16 + 2, 'B5', 1.8), (14*16 + 4, 'D6', 2.0), (14*16 + 8, 'F6', 2.0),
    (14*16 + 12, 'E6', 1.8), (14*16 + 14, 'D6', 1.8),

    (15*16 + 0, 'C6', 4.0),

    # Phrase 3: Bars 16 - 19 (Higher register)
    (16*16 + 0, 'C6', 1.8), (16*16 + 2, 'B5', 1.8), (16*16 + 4, 'A5', 1.8), (16*16 + 6, 'G5', 1.8),
    (16*16 + 8, 'F5', 1.8), (16*16 + 10, 'E5', 1.8), (16*16 + 12, 'D5', 1.8), (16*16 + 14, 'C5', 1.8),

    (17*16 + 0, 'D5', 1.8), (17*16 + 2, 'F5', 1.8), (17*16 + 4, 'A5', 2.0), (17*16 + 8, 'C6', 2.0),
    (17*16 + 12, 'B5', 3.0),

    (18*16 + 0, 'E5', 1.8), (18*16 + 2, 'G5', 1.8), (18*16 + 4, 'B5', 2.0), (18*16 + 8, 'D6', 2.0),
    (18*16 + 12, 'C6', 3.0),

    (19*16 + 0, 'F5', 1.8), (19*16 + 2, 'A5', 1.8), (19*16 + 4, 'C6', 2.0), (19*16 + 8, 'E6', 2.0),
    (19*16 + 12, 'D6', 3.0),

    # Phrase 4: Bars 20 - 23 (Turnaround to Section 3)
    (20*16 + 0, 'G5', 1.8), (20*16 + 2, 'A5', 1.8), (20*16 + 4, 'B5', 1.8), (20*16 + 6, 'C6', 1.8),
    (20*16 + 8, 'D6', 1.8), (20*16 + 10, 'E6', 1.8), (20*16 + 12, 'F6', 2.0),

    (21*16 + 0, 'G6', 2.5), (21*16 + 4, 'E6', 2.0), (21*16 + 8, 'C6', 2.0), (21*16 + 12, 'A5', 2.0),

    (22*16 + 0, 'D5', 1.8), (22*16 + 2, 'E5', 1.8), (22*16 + 4, 'F5', 1.8), (22*16 + 8, 'G5', 1.8),
    (22*16 + 12, 'A5', 1.8), (22*16 + 14, 'B5', 1.8),

    (23*16 + 0, 'C6', 2.0)
]
for s, n, d in steel_melody:
    render_note('steel', n, s, step_len=d, vol=0.85, pan=0.25, release_ms=35.0)

# Accordion counter-melody on Bars 16 - 23
for s, n, d in [
    (16*16 + 0, 'E4', 3.5), (16*16 + 8, 'A4', 3.5),
    (17*16 + 0, 'F4', 3.5), (17*16 + 8, 'G4', 3.5),
    (18*16 + 0, 'G4', 3.5), (18*16 + 8, 'C5', 3.5),
    (19*16 + 0, 'A4', 3.5), (19*16 + 8, 'B4', 3.5),
    (20*16 + 0, 'B4', 3.5), (20*16 + 8, 'C5', 3.5),
    (21*16 + 0, 'C5', 3.5), (21*16 + 8, 'E5', 3.5),
    (22*16 + 0, 'F5', 3.5), (22*16 + 8, 'G5', 3.5),
    (23*16 + 0, 'G5', 2.0)
]:
    render_note('accordion', n, s, step_len=d, vol=0.6, pan=0.35, release_ms=30.0)

# Whistle call-and-response on Bars 17, 19, 21, 23
whistle_calls = [
    (17*16 + 10, 'G6', 1.5), (17*16 + 12, 'A6', 1.5), (17*16 + 14, 'G6', 1.5),
    (19*16 + 10, 'A6', 1.5), (19*16 + 12, 'B6', 1.5), (19*16 + 14, 'C7', 2.0),
    (21*16 + 10, 'E6', 1.5), (21*16 + 12, 'D6', 1.5), (21*16 + 14, 'C6', 2.0),
    # Ascending run into Section 3
    (23*16 + 6, 'G5', 1.2), (23*16 + 8, 'A5', 1.2), (23*16 + 10, 'B5', 1.2),
    (23*16 + 12, 'C6', 1.5), (23*16 + 14, 'D6', 1.5)
]
for s, n, d in whistle_calls:
    render_note('whistle', n, s, step_len=d, vol=0.75, pan=-0.3, release_ms=40.0)


# ===== SECTION 3: BRASS & WHISTLE HIGH SPIRITS (Bars 24 to 39, 16 bars) =====
print("Writing Section 3: Brass Fanfare (Bars 25-40)...")
chords_sec3 = [
    'C', 'G', 'Am', 'F', 'C', 'G', 'F', 'G',
    'C', 'G', 'Am', 'F', 'D', 'G', 'C', 'G'
]

for i, ch in enumerate(chords_sec3):
    bar = 24 + i
    is_fill = (i in [7, 15])
    apply_drums(bar, 'full_groove_fill' if is_fill else 'full_groove')
    apply_slap_bass(bar, ch)
    apply_pizz_chords(bar, ch)

    # Add Agogo bells pinging on beats
    render_drum('agogo', bar * 16 + 0, vol=0.6, pan=0.35, pitch_shift=0)  # High
    render_drum('agogo', bar * 16 + 6, vol=0.55, pan=-0.35, pitch_shift=-4) # Low
    render_drum('agogo', bar * 16 + 10, vol=0.6, pan=0.35, pitch_shift=0) # High

    if i == 0 or i == 8:
        render_drum('crash', bar * 16, vol=0.85, pan=-0.2)
    if i == 15:
        # Orchestra Hit on Bar 39 Beat 4 leading into chill breakdown!
        render_drum('hit', bar * 16 + 12, vol=0.9, pan=0.0)
        render_drum('rev_cymbal', bar * 16 + 8, vol=0.8, pan=0.0)

# Soaring Brass Fanfare Melody (Bars 24 - 39)
brass_melody = [
    # Phrase 1: Bars 24 - 27
    (24*16 + 0, 'C5', 1.8), (24*16 + 2, 'E5', 1.8), (24*16 + 4, 'G5', 2.0), (24*16 + 8, 'C6', 4.0),
    (25*16 + 0, 'B5', 1.8), (25*16 + 2, 'A5', 1.8), (25*16 + 4, 'G5', 2.0), (25*16 + 8, 'E5', 2.0),
    (25*16 + 12, 'G5', 3.0),

    (26*16 + 0, 'A5', 1.8), (26*16 + 2, 'C6', 1.8), (26*16 + 4, 'E6', 2.5), (26*16 + 8, 'D6', 4.0),
    (27*16 + 0, 'C6', 1.8), (27*16 + 2, 'A5', 1.8), (27*16 + 4, 'G5', 2.0), (27*16 + 8, 'E5', 2.0),
    (27*16 + 12, 'D5', 3.0),

    # Phrase 2: Bars 28 - 31
    (28*16 + 0, 'C5', 1.8), (28*16 + 2, 'E5', 1.8), (28*16 + 4, 'G5', 1.8), (28*16 + 6, 'A5', 1.8),
    (28*16 + 8, 'C6', 2.5), (28*16 + 12, 'D6', 2.0),

    (29*16 + 0, 'E6', 2.0), (29*16 + 4, 'D6', 1.8), (29*16 + 6, 'C6', 1.8), (29*16 + 8, 'A5', 2.0),
    (29*16 + 12, 'G5', 3.0),

    (30*16 + 0, 'F5', 1.8), (30*16 + 2, 'G5', 1.8), (30*16 + 4, 'A5', 1.8), (30*16 + 6, 'B5', 1.8),
    (30*16 + 8, 'C6', 1.8), (30*16 + 10, 'D6', 1.8), (30*16 + 12, 'E6', 2.0), (30*16 + 14, 'F6', 2.0),

    (31*16 + 0, 'G6', 3.0), (31*16 + 6, 'F6', 1.8), (31*16 + 8, 'E6', 2.0), (31*16 + 12, 'D6', 3.0),

    # Phrase 3: Bars 32 - 35 (Higher Brass punch)
    (32*16 + 0, 'C5', 1.8), (32*16 + 2, 'E5', 1.8), (32*16 + 4, 'G5', 2.0), (32*16 + 8, 'C6', 4.0),
    (33*16 + 0, 'D6', 1.8), (33*16 + 2, 'C6', 1.8), (33*16 + 4, 'B5', 2.0), (33*16 + 8, 'A5', 2.0),
    (33*16 + 12, 'G5', 3.0),

    (34*16 + 0, 'C6', 1.8), (34*16 + 2, 'D6', 1.8), (34*16 + 4, 'E6', 2.5), (34*16 + 8, 'F6', 4.0),
    (35*16 + 0, 'E6', 1.8), (35*16 + 2, 'D6', 1.8), (35*16 + 4, 'C6', 2.0), (35*16 + 8, 'B5', 2.0),
    (35*16 + 12, 'A5', 3.0),

    # Phrase 4: Bars 36 - 39 (Grand build up)
    (36*16 + 0, 'D6', 2.0), (36*16 + 4, 'E6', 2.0), (36*16 + 8, 'F6', 2.0), (36*16 + 12, 'G6', 2.0),
    (37*16 + 0, 'A6', 2.5), (37*16 + 6, 'G6', 2.0), (37*16 + 10, 'F6', 2.0), (37*16 + 14, 'E6', 2.0),
    (38*16 + 0, 'D6', 1.8), (38*16 + 2, 'E6', 1.8), (38*16 + 4, 'F6', 1.8), (38*16 + 6, 'G6', 1.8),
    (38*16 + 8, 'A6', 1.8), (38*16 + 10, 'B6', 1.8), (38*16 + 12, 'C7', 2.0), (38*16 + 14, 'D7', 2.0),
    (39*16 + 0, 'C7', 3.0)
]
for s, n, d in brass_melody:
    render_note('brass', n, s, step_len=d, vol=0.85, pan=-0.2, release_ms=40.0)

# Whistle ornaments on Brass section
for s, n, d in [
    (25*16 + 10, 'G6', 1.5), (25*16 + 12, 'A6', 1.5), (25*16 + 14, 'B6', 1.5),
    (27*16 + 10, 'E6', 1.5), (27*16 + 12, 'F6', 1.5), (27*16 + 14, 'G6', 1.5),
    (29*16 + 10, 'A6', 1.5), (29*16 + 12, 'B6', 1.5), (29*16 + 14, 'C7', 2.0),
    (33*16 + 10, 'D7', 1.5), (33*16 + 12, 'C7', 1.5), (33*16 + 14, 'B6', 2.0),
    (35*16 + 10, 'G6', 1.5), (35*16 + 12, 'A6', 1.5), (35*16 + 14, 'C7', 2.0),
]:
    render_note('whistle', n, s, step_len=d, vol=0.7, pan=-0.35, release_ms=35.0)


# ===== SECTION 4: DIRE DIRE DOCKS CHILL BREAKDOWN (Bars 40 to 55, 16 bars) =====
print("Writing Section 4: Dire Dire Docks Chill Breakdown (Bars 41-56)...")
chords_sec4 = [
    'C', 'F', 'Em', 'Am', 'Dm', 'G', 'C', 'C',
    'F', 'G', 'Em', 'Am', 'Dm', 'G', 'C', 'G'
]

for i, ch in enumerate(chords_sec4):
    bar = 40 + i
    apply_drums(bar, 'chill_water')

    # Soft bass root notes (warm and deep, no slap pop)
    b_step = bar * 16
    bass_notes = {'C': 'C2', 'F': 'F2', 'Em': 'E2', 'Am': 'A2', 'Dm': 'D2', 'G': 'G2'}
    bn = bass_notes.get(ch, 'C2')
    render_note('bass', bn, b_step + 0, step_len=7.0, vol=0.6, pan=0.0, release_ms=50.0)
    render_note('bass', bn, b_step + 8, step_len=6.0, vol=0.55, pan=0.0, release_ms=50.0)

    # Warm sustained Accordion pad in background
    acc_pads = {
        'C':  ['E4', 'G4', 'C5'],
        'F':  ['C4', 'F4', 'A4'],
        'Em': ['B3', 'E4', 'G4'],
        'Am': ['C4', 'E4', 'A4'],
        'Dm': ['D4', 'F4', 'A4'],
        'G':  ['D4', 'G4', 'B4'],
    }
    for pn in acc_pads.get(ch, ['E4', 'G4', 'C5']):
        render_note('accordion', pn, b_step + 0, step_len=14.0, vol=0.35, pan=0.3, release_ms=60.0)

# Electric Piano flowing 16th arpeggios (Dire Dire Docks style)
arpeggios_sec4 = {
    'C':  ['C4', 'G4', 'B4', 'E5', 'C4', 'G4', 'B4', 'E5', 'C4', 'G4', 'B4', 'E5', 'G5', 'E5', 'B4', 'G4'],
    'F':  ['F3', 'C4', 'E4', 'A4', 'F3', 'C4', 'E4', 'A4', 'F3', 'C4', 'E4', 'A4', 'C5', 'A4', 'E4', 'C4'],
    'Em': ['E3', 'B3', 'D4', 'G4', 'E3', 'B3', 'D4', 'G4', 'E3', 'B3', 'D4', 'G4', 'B4', 'G4', 'D4', 'B3'],
    'Am': ['A3', 'E4', 'G4', 'C5', 'A3', 'E4', 'G4', 'C5', 'A3', 'E4', 'G4', 'C5', 'E5', 'C5', 'G4', 'E4'],
    'Dm': ['D3', 'A3', 'C4', 'F4', 'D3', 'A3', 'C4', 'F4', 'D3', 'A3', 'C4', 'F4', 'A4', 'F4', 'C4', 'A3'],
    'G':  ['G3', 'D4', 'F4', 'B4', 'G3', 'D4', 'F4', 'B4', 'G3', 'D4', 'F4', 'B4', 'D5', 'B4', 'F4', 'D4'],
}

for i, ch in enumerate(chords_sec4):
    bar = 40 + i
    arp = arpeggios_sec4.get(ch, arpeggios_sec4['C'])
    for step_idx, n in enumerate(arp):
        render_note('epiano', n, bar * 16 + step_idx, step_len=1.8, vol=0.55,
                    pan=-0.25 if step_idx % 2 == 0 else 0.25, is_decay=True)

# Lyrical Pan Flute Melody (Bars 42 - 54)
pan_flute_melody = [
    # Phrase 1
    (42*16 + 0, 'E5', 3.5), (42*16 + 6, 'G5', 2.0), (42*16 + 10, 'A5', 2.5), (42*16 + 14, 'G5', 2.0),
    (43*16 + 0, 'E5', 3.0), (43*16 + 4, 'D5', 3.0), (43*16 + 8, 'C5', 6.0),

    (44*16 + 0, 'A4', 3.5), (44*16 + 6, 'C5', 2.0), (44*16 + 10, 'E5', 3.0),
    (45*16 + 0, 'D5', 6.0), (45*16 + 8, 'C5', 2.0), (45*16 + 12, 'D5', 2.0),

    (46*16 + 0, 'E5', 3.5), (46*16 + 6, 'G5', 2.0), (46*16 + 10, 'A5', 3.0),
    (47*16 + 0, 'C6', 4.0), (47*16 + 6, 'B5', 2.5), (47*16 + 10, 'G5', 4.0),

    # Phrase 2 (Soaring higher)
    (48*16 + 0, 'A5', 3.5), (48*16 + 6, 'C6', 2.0), (48*16 + 10, 'E6', 4.0),
    (49*16 + 0, 'D6', 4.0), (49*16 + 6, 'C6', 2.5), (49*16 + 10, 'A5', 4.0),

    (50*16 + 0, 'G5', 3.5), (50*16 + 6, 'B5', 2.0), (50*16 + 10, 'D6', 4.0),
    (51*16 + 0, 'C6', 6.0), (51*16 + 8, 'D6', 2.0), (51*16 + 12, 'E6', 2.0),

    (52*16 + 0, 'F6', 3.5), (52*16 + 6, 'E6', 2.0), (52*16 + 10, 'D6', 3.0),
    (53*16 + 0, 'C6', 4.0), (53*16 + 6, 'B5', 2.5), (53*16 + 10, 'A5', 3.0),

    (54*16 + 0, 'G5', 3.5), (54*16 + 6, 'A5', 2.0), (54*16 + 10, 'B5', 3.0),
    (55*16 + 0, 'C6', 6.0)
]
for s, n, d in pan_flute_melody:
    render_note('flute', n, s, step_len=d, vol=0.8, pan=0.0, release_ms=50.0)

# Build up at end of chill section (Bar 55)
render_drum('rev_cymbal', 55 * 16 + 8, vol=0.85, pan=0.0)
render_drum('snare', 55 * 16 + 12, vol=0.7, pan=-0.1)
render_drum('snare', 55 * 16 + 14, vol=0.8, pan=-0.1)
render_drum('snare', 55 * 16 + 15, vol=0.9, pan=-0.1)


# ===== SECTION 5: COOL, COOL MOUNTAIN SLIDE JAM (Bars 56 to 71, 16 bars) =====
print("Writing Section 5: Cool Cool Mountain Slide Jam (Bars 57-72)...")
chords_sec5 = [
    'C', 'Dm', 'Em', 'F', 'C', 'Am', 'Dm', 'G',
    'C', 'Dm', 'Em', 'F', 'Am', 'F', 'G', 'G'
]

for i, ch in enumerate(chords_sec5):
    bar = 56 + i
    is_fill = (i in [7, 15])
    apply_drums(bar, 'full_groove_fill' if is_fill else 'full_groove')
    apply_slap_bass(bar, ch)
    apply_pizz_chords(bar, ch)
    if i == 0 or i == 8:
        render_drum('crash', bar * 16, vol=0.85, pan=-0.2)

# Accordion Bouncy Polka Slide Melody (Bars 56 - 71)
accordion_jam = [
    # Phrase 1: Bars 56 - 59
    (56*16 + 0, 'C5', 1.5), (56*16 + 2, 'E5', 1.5), (56*16 + 4, 'G5', 1.5), (56*16 + 6, 'E5', 1.5),
    (56*16 + 8, 'C5', 1.5), (56*16 + 10, 'E5', 1.5), (56*16 + 12, 'G5', 1.5), (56*16 + 14, 'E5', 1.5),

    (57*16 + 0, 'D5', 1.5), (57*16 + 2, 'F5', 1.5), (57*16 + 4, 'A5', 1.5), (57*16 + 6, 'F5', 1.5),
    (57*16 + 8, 'D5', 1.5), (57*16 + 10, 'F5', 1.5), (57*16 + 12, 'A5', 1.5), (57*16 + 14, 'F5', 1.5),

    (58*16 + 0, 'E5', 1.5), (58*16 + 2, 'G5', 1.5), (58*16 + 4, 'B5', 1.5), (58*16 + 6, 'G5', 1.5),
    (58*16 + 8, 'E5', 1.5), (58*16 + 10, 'G5', 1.5), (58*16 + 12, 'B5', 1.5), (58*16 + 14, 'G5', 1.5),

    (59*16 + 0, 'F5', 1.5), (59*16 + 2, 'G5', 1.5), (59*16 + 4, 'A5', 1.5), (59*16 + 6, 'B5', 1.5),
    (59*16 + 8, 'C6', 2.0), (59*16 + 12, 'B5', 1.5), (59*16 + 14, 'A5', 1.5),

    # Phrase 2: Bars 60 - 63
    (60*16 + 0, 'C5', 1.5), (60*16 + 2, 'E5', 1.5), (60*16 + 4, 'G5', 1.5), (60*16 + 6, 'C6', 1.5),
    (60*16 + 8, 'E6', 2.0), (60*16 + 12, 'C6', 1.5), (60*16 + 14, 'G5', 1.5),

    (61*16 + 0, 'A5', 1.5), (61*16 + 2, 'C6', 1.5), (61*16 + 4, 'E6', 2.0), (61*16 + 8, 'D6', 2.0),
    (61*16 + 12, 'C6', 1.5), (61*16 + 14, 'A5', 1.5),

    (62*16 + 0, 'D5', 1.5), (62*16 + 2, 'E5', 1.5), (62*16 + 4, 'F5', 1.5), (62*16 + 6, 'G5', 1.5),
    (62*16 + 8, 'A5', 1.5), (62*16 + 10, 'B5', 1.5), (62*16 + 12, 'C6', 1.5), (62*16 + 14, 'D6', 1.5),

    (63*16 + 0, 'C6', 2.0), (63*16 + 4, 'G5', 1.8), (63*16 + 8, 'E5', 1.8), (63*16 + 12, 'C5', 2.0),

    # Phrase 3: Bars 64 - 67 (Double-time feel)
    (64*16 + 0, 'G5', 1.5), (64*16 + 2, 'C6', 1.5), (64*16 + 4, 'E6', 1.5), (64*16 + 6, 'G6', 2.0),
    (64*16 + 10, 'F6', 1.5), (64*16 + 12, 'E6', 1.5), (64*16 + 14, 'D6', 1.5),

    (65*16 + 0, 'F5', 1.5), (65*16 + 2, 'A5', 1.5), (65*16 + 4, 'D6', 1.5), (65*16 + 6, 'F6', 2.0),
    (65*16 + 10, 'E6', 1.5), (65*16 + 12, 'D6', 1.5), (65*16 + 14, 'C6', 1.5),

    (66*16 + 0, 'E5', 1.5), (66*16 + 2, 'G5', 1.5), (66*16 + 4, 'C6', 1.5), (66*16 + 6, 'E6', 2.0),
    (66*16 + 10, 'D6', 1.5), (66*16 + 12, 'C6', 1.5), (66*16 + 14, 'B5', 1.5),

    (67*16 + 0, 'A5', 1.5), (67*16 + 2, 'C6', 1.5), (67*16 + 4, 'F6', 1.5), (67*16 + 6, 'A6', 2.0),
    (67*16 + 10, 'G6', 1.5), (67*16 + 12, 'F6', 1.5), (67*16 + 14, 'E6', 1.5),

    # Phrase 4: Bars 68 - 71 (Ascending chromatic climb to climax)
    (68*16 + 0, 'C6', 1.8), (68*16 + 4, 'E6', 1.8), (68*16 + 8, 'G6', 2.0), (68*16 + 12, 'E6', 1.8),
    (69*16 + 0, 'F6', 1.8), (69*16 + 4, 'A6', 1.8), (69*16 + 8, 'D7', 2.0), (69*16 + 12, 'C7', 1.8),
    (70*16 + 0, 'B6', 1.8), (70*16 + 4, 'G6', 1.8), (70*16 + 8, 'F6', 1.8), (70*16 + 12, 'D6', 1.8),
    # Chromatic run on Bar 71
    (71*16 + 0, 'F#5', 1.2), (71*16 + 2, 'G5', 1.2), (71*16 + 4, 'G#5', 1.2), (71*16 + 6, 'A5', 1.2),
    (71*16 + 8, 'A#5', 1.2), (71*16 + 10, 'B5', 1.2), (71*16 + 12, 'C6', 1.5), (71*16 + 14, 'D6', 1.5),
]
for s, n, d in accordion_jam:
    render_note('accordion', n, s, step_len=d, vol=0.85, pan=0.3, release_ms=25.0)

# Steel Drums harmony on Bars 64 - 71 (3rds above/below)
for s, n, d in [
    (64*16 + 0, 'E5', 1.5), (64*16 + 2, 'G5', 1.5), (64*16 + 4, 'C6', 1.5), (64*16 + 6, 'E6', 2.0),
    (65*16 + 0, 'D5', 1.5), (65*16 + 2, 'F5', 1.5), (65*16 + 4, 'A5', 1.5), (65*16 + 6, 'D6', 2.0),
    (66*16 + 0, 'C5', 1.5), (66*16 + 2, 'E5', 1.5), (66*16 + 4, 'G5', 1.5), (66*16 + 6, 'C6', 2.0),
    (67*16 + 0, 'F5', 1.5), (67*16 + 2, 'A5', 1.5), (67*16 + 4, 'C6', 1.5), (67*16 + 6, 'F6', 2.0),
    (68*16 + 0, 'E5', 1.8), (68*16 + 4, 'G5', 1.8), (68*16 + 8, 'C6', 2.0),
    (69*16 + 0, 'A5', 1.8), (69*16 + 4, 'C6', 1.8), (69*16 + 8, 'F6', 2.0),
    (70*16 + 0, 'G5', 1.8), (70*16 + 4, 'B5', 1.8), (70*16 + 8, 'D6', 2.0),
    # Chromatic run harmony
    (71*16 + 0, 'A5', 1.2), (71*16 + 2, 'A#5', 1.2), (71*16 + 4, 'B5', 1.2), (71*16 + 6, 'C6', 1.2),
    (71*16 + 8, 'C#6', 1.2), (71*16 + 10, 'D6', 1.2), (71*16 + 12, 'D#6', 1.5), (71*16 + 14, 'E6', 1.5),
]:
    render_note('steel', n, s, step_len=d, vol=0.7, pan=-0.25, release_ms=30.0)

# Whistle punctuation chirps in Section 5
for s, n, d in [
    (57*16 + 12, 'C7', 1.5), (59*16 + 12, 'D7', 1.5),
    (61*16 + 12, 'E7', 1.5), (63*16 + 12, 'C7', 2.0),
    (65*16 + 12, 'A6', 1.5), (67*16 + 12, 'C7', 1.5),
    (69*16 + 12, 'D7', 1.5), (71*16 + 12, 'G6', 1.8)
]:
    render_note('whistle', n, s, step_len=d, vol=0.75, pan=-0.35, release_ms=35.0)


# ===== SECTION 6: GRAND TUTTI CLIMAX & SEAMLESS OUTRO (Bars 72 to 79, 8 bars) =====
print("Writing Section 6: Grand Tutti Climax (Bars 73-80)...")
chords_sec6 = ['C', 'Am', 'Dm', 'G', 'C', 'F', 'G', 'C']

for i, ch in enumerate(chords_sec6):
    bar = 72 + i
    is_fill = (i in [3, 7])
    apply_drums(bar, 'full_groove_fill' if is_fill else 'full_groove')
    apply_slap_bass(bar, ch)
    apply_pizz_chords(bar, ch)

    # Tambourine maximum intensity
    for s in [0, 2, 4, 6, 8, 10, 12, 14]:
        render_drum('tamb', bar * 16 + s, vol=0.65, pan=0.45)

    if i == 0 or i == 4:
        render_drum('crash', bar * 16, vol=0.9, pan=-0.2)

# Tutti Climax Brass Fanfare (Bars 72 - 77)
climax_brass = [
    (72*16 + 0, 'C5', 1.8), (72*16 + 2, 'E5', 1.8), (72*16 + 4, 'G5', 2.0), (72*16 + 8, 'C6', 4.0),
    (73*16 + 0, 'B5', 1.8), (73*16 + 2, 'A5', 1.8), (73*16 + 4, 'G5', 2.0), (73*16 + 8, 'E5', 2.0),
    (73*16 + 12, 'G5', 3.0),

    (74*16 + 0, 'A5', 1.8), (74*16 + 2, 'C6', 1.8), (74*16 + 4, 'E6', 2.5), (74*16 + 8, 'D6', 4.0),
    (75*16 + 0, 'C6', 1.8), (75*16 + 2, 'A5', 1.8), (75*16 + 4, 'G5', 2.0), (75*16 + 8, 'E5', 2.0),
    (75*16 + 12, 'D5', 3.0),

    (76*16 + 0, 'E5', 1.8), (76*16 + 2, 'G5', 1.8), (76*16 + 4, 'C6', 2.5), (76*16 + 8, 'B5', 2.0),
    (76*16 + 12, 'A5', 1.8), (76*16 + 14, 'G5', 1.8),

    (77*16 + 0, 'F5', 1.8), (77*16 + 2, 'A5', 1.8), (77*16 + 4, 'D6', 2.5), (77*16 + 8, 'C6', 2.0),
    (77*16 + 12, 'A5', 2.0), (77*16 + 14, 'F5', 1.8),
]
for s, n, d in climax_brass:
    render_note('brass', n, s, step_len=d, vol=0.85, pan=-0.2, release_ms=35.0)
    # Double with Steel Drums for maximum punch!
    render_note('steel', n, s, step_len=d, vol=0.75, pan=0.25, release_ms=30.0)

# Whistle soaring counter-melody on Climax
for s, n, d in [
    (72*16 + 8, 'C7', 4.0), (73*16 + 8, 'G6', 3.0),
    (74*16 + 8, 'D7', 4.0), (75*16 + 8, 'E7', 3.0),
    (76*16 + 8, 'C7', 4.0), (77*16 + 8, 'A6', 3.0),
]:
    render_note('whistle', n, s, step_len=d, vol=0.75, pan=-0.35, release_ms=45.0)

# Bars 78 - 79: The Iconic Mario 64 Outro Cadence & Loop Resolution
print("Writing Turnaround Cadence (Bars 79-80)...")
# Bar 78: Tutti punch + cadence run
render_drum('hit', 78 * 16 + 0, vol=0.95, pan=0.0)
render_drum('crash', 78 * 16 + 0, vol=0.9, pan=0.0)

cadence_brass = [
    (78*16 + 0, 'C6', 2.0),
    (78*16 + 4, 'G5', 1.5), (78*16 + 6, 'G5', 1.5), (78*16 + 8, 'G5', 1.5),
    (78*16 + 10, 'A5', 1.5), (78*16 + 12, 'B5', 1.5), (78*16 + 14, 'C6', 2.0),

    # Bar 79: Staccato turnaround resolution
    (79*16 + 0, 'D6', 1.8), (79*16 + 4, 'C6', 1.8), (79*16 + 8, 'G5', 2.0),
]
for s, n, d in cadence_brass:
    render_note('brass', n, s, step_len=d, vol=0.85, pan=-0.2, release_ms=25.0)
    render_note('steel', n, s, step_len=d, vol=0.8, pan=0.25, release_ms=25.0)
    render_note('accordion', n, s, step_len=d, vol=0.75, pan=0.3, release_ms=25.0)

# Final Bar 79 Solo Whistle Hook leading back to Bar 0!
render_note('whistle', 'G6', 79 * 16 + 10, step_len=1.5, vol=0.85, pan=-0.3, release_ms=25.0)
render_note('whistle', 'C7', 79 * 16 + 12, step_len=2.5, vol=0.9, pan=-0.3, release_ms=40.0)

# Snare & tom roll on Bar 79 beats 3 and 4
render_drum('snare', 79 * 16 + 8, vol=0.7, pan=-0.1)
render_drum('snare', 79 * 16 + 10, vol=0.75, pan=-0.1)
render_drum('snare', 79 * 16 + 12, vol=0.85, pan=-0.1)
render_drum('snare', 79 * 16 + 14, vol=0.9, pan=-0.1)

print("Musical arrangement complete!")

# ------------------------------------------------------------------------------
# 5. SPATIAL REVERB & DELAY SEND (Classic N64 Echo)
# ------------------------------------------------------------------------------
print("Applying N64 stereo spatial echo & delay...")
delay_samples = int(0.26 * SAMPLE_RATE) # ~260ms delay
delay_feedback = 0.22

# Simple feed-forward echo for left and right
for i in range(delay_samples, TOTAL_SAMPLES):
    left_buf[i]  += right_buf[i - delay_samples] * delay_feedback
    right_buf[i] += left_buf[i - delay_samples]  * delay_feedback

# ------------------------------------------------------------------------------
# 6. NORMALIZATION & EXPORT
# ------------------------------------------------------------------------------
print("Normalizing audio...")
max_val = 0.0
for i in range(TOTAL_SAMPLES):
    if abs(left_buf[i]) > max_val: max_val = abs(left_buf[i])
    if abs(right_buf[i]) > max_val: max_val = abs(right_buf[i])

print(f"Peak amplitude before normalization: {max_val:.4f}")
target_peak = 0.94
norm_gain = target_peak / max(max_val, 1e-6)

# Smooth loop boundary crossfade (last 50ms into first 50ms) to ensure 100% zero-click loop
xfade_len = int(0.05 * SAMPLE_RATE)
for i in range(xfade_len):
    weight = i / float(xfade_len)
    end_idx = TOTAL_SAMPLES - xfade_len + i
    # Blend end into start and start into end
    blended_l = left_buf[i] * weight + left_buf[end_idx] * (1.0 - weight)
    blended_r = right_buf[i] * weight + right_buf[end_idx] * (1.0 - weight)
    left_buf[i] = blended_l
    right_buf[i] = blended_r
    left_buf[end_idx] = blended_l
    right_buf[end_idx] = blended_r

print("Packing 16-bit PCM WAV data...")
out_wav_path = 'music/mu_tutorial.wav'
with wave.open(out_wav_path, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SAMPLE_RATE)

    # Pack in chunks of 32768 samples for speed
    chunk_size = 32768
    num_chunks = (TOTAL_SAMPLES + chunk_size - 1) // chunk_size
    for c in range(num_chunks):
        s_start = c * chunk_size
        s_end = min(TOTAL_SAMPLES, s_start + chunk_size)
        raw_bytes = bytearray()
        for i in range(s_start, s_end):
            sl = int(max(-32767, min(32767, left_buf[i] * norm_gain * 32767)))
            sr = int(max(-32767, min(32767, right_buf[i] * norm_gain * 32767)))
            raw_bytes.extend(struct.pack('<hh', sl, sr))
        w.writeframes(raw_bytes)

print(f"Exported: {out_wav_path} ({os.path.getsize(out_wav_path)} bytes)")

# Copy to mu_tutorial_chill.wav and mu_tutorial_fast.wav
chill_path = 'music/mu_tutorial_chill.wav'
shutil.copyfile(out_wav_path, chill_path)
print(f"Copied to: {chill_path}")

fast_path = 'music/mu_tutorial_fast.wav'
shutil.copyfile(out_wav_path, fast_path)
print(f"Copied to: {fast_path}")

elapsed = time.time() - t_start
print(f"=== Composition successfully finished in {elapsed:.2f}s ===")
