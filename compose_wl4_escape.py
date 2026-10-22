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
BPM = 136.0
BEATS_PER_BAR = 4
STEPS_PER_BEAT = 4  # 16th notes
TOTAL_BARS = 85  # Exactly 150.00 seconds (2:30) at 136 BPM!
TOTAL_STEPS = TOTAL_BARS * BEATS_PER_BAR * STEPS_PER_BEAT  # 1360 steps

print(f"=== Composing Authentic Wario Land 4 Escape Track (Hurry Up!) ===")
print(f"Total Bars: {TOTAL_BARS} at {BPM} BPM ({TOTAL_STEPS} 16th steps)")

# Timing calculation with light funky GBA swing (53% swing on 16th notes)
SWING_RATIO = 0.53
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

print(f"Exact Target Duration: {TOTAL_SAMPLES / SAMPLE_RATE:.2f} seconds ({TOTAL_SAMPLES} samples)")

# Allocate stereo mixing buffers
left_buf = [0.0] * TOTAL_SAMPLES
right_buf = [0.0] * TOTAL_SAMPLES

# ------------------------------------------------------------------------------
# 1. LOAD EXTRACTED WARIO LAND 4 SAMPLES
# ------------------------------------------------------------------------------
print("Loading authentic Wario Land 4 samples...")

def load_wav_sample(path):
    with wave.open(path, 'rb') as w:
        frames = w.readframes(w.getnframes())
        raw = struct.unpack(f'<{len(frames)//2}h', frames)
        sr = w.getframerate()
        return [s / 32768.0 for s in raw], sr

# Instrument definitions: (filename, root_pitch, loop_start, loop_end)
wl4_samples_cfg = {
    'hurry_lead': ('wl4_samples/hurry_lead.wav', 76, 638, 4091),
    'daow':       ('wl4_samples/daow.wav',       60, 0, 0),
    'hurry_ep':   ('wl4_samples/hurry_ep.wav',   60, 0, 0),
    'chant':      ('wl4_samples/chant.wav',      76, 1967, 3450),
    'deow_bass':  ('wl4_samples/deow_bass.wav',  60, 0, 0),
    'boss_bass':  ('wl4_samples/boss_bass.wav',  60, 0, 0),
    'brass':      ('wl4_samples/brass.wav',      60, 0, 0),
    'toxic_gtr':  ('wl4_samples/toxic_gtr.wav',  83, 530, 1527),
    'fiery_gtr':  ('wl4_samples/fiery_gtr.wav',  76, 498, 1098),
    'boss_gate':  ('wl4_samples/boss_gate.wav',  48, 0, 0),
    'strings':    ('wl4_samples/strings.wav',    60, 0, 0),
    'pizz':       ('wl4_samples/pizz.wav',       60, 0, 0),
    'kick':       ('wl4_samples/kick.wav',       60, 0, 0),
    'snare':      ('wl4_samples/snare.wav',      60, 0, 0),
    'snare_rim':  ('wl4_samples/snare_rim.wav',  60, 0, 0),
    'clap':       ('wl4_samples/clap.wav',       60, 0, 0),
    'crash':      ('wl4_samples/crash.wav',      60, 0, 0),
    'shaker':     ('wl4_samples/shaker.wav',     60, 0, 0),
    'bongo_hi':   ('wl4_samples/bongo_hi.wav',   60, 0, 0),
    'bongo_lo':   ('wl4_samples/bongo_lo.wav',   60, 0, 0),
    'agogo_hi':   ('wl4_samples/agogo_hi.wav',   60, 0, 0),
    'agogo_lo':   ('wl4_samples/agogo_lo.wav',   60, 0, 0),
}

sample_data = {}
for name, (fname, root_p, l_start, l_end) in wl4_samples_cfg.items():
    data, actual_sr = load_wav_sample(fname)
    sample_data[name] = {
        'data': data,
        'root_pitch': root_p,
        'sr': actual_sr,
        'loop_start': l_start,
        'loop_end': l_end,
        'len': len(data)
    }

print("All WL4 samples loaded.")

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

def pan_gains(pan):
    angle = (pan + 1.0) * (math.pi / 4.0)
    return math.cos(angle), math.sin(angle)

def render_note(inst_name, note_val, start_step, step_len=1.0, vol=1.0, pan=0.0,
                attack_ms=3.0, release_ms=25.0, decay_rate=0.0):
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

    rel_samples = int((release_ms / 1000.0) * SAMPLE_RATE)
    att_samples = max(1, int((attack_ms / 1000.0) * SAMPLE_RATE))
    total_note_samples = (base_end_idx - start_idx) + rel_samples

    step_size = (2.0 ** ((midi_pitch - root) / 12.0)) * (s_sr / float(SAMPLE_RATE))

    gain_l, gain_r = pan_gains(pan)
    gain_l *= vol
    gain_r *= vol

    pos = 0.0
    has_loop = (l_end > l_start and l_end <= s_len)

    for i in range(total_note_samples):
        target_idx = start_idx + i
        if target_idx >= TOTAL_SAMPLES: break

        if has_loop:
            if pos >= l_end:
                pos = l_start + ((pos - l_start) % (l_end - l_start))
            idx0 = int(pos)
            idx1 = idx0 + 1 if idx0 + 1 < s_len else l_start
            frac = pos - idx0
            val = (1.0 - frac) * raw[idx0] + frac * raw[idx1]
        else:
            idx0 = int(pos)
            if idx0 >= s_len - 1: break
            frac = pos - idx0
            val = (1.0 - frac) * raw[idx0] + frac * raw[idx0 + 1]

        # ADSR
        env = 1.0
        if i < att_samples:
            env = i / float(att_samples)
        elif i >= (base_end_idx - start_idx):
            rel_i = i - (base_end_idx - start_idx)
            env = max(0.0, 1.0 - (rel_i / float(rel_samples)))

        if decay_rate > 0.0:
            env *= math.exp(-decay_rate * (i / float(SAMPLE_RATE)))

        left_buf[target_idx] += val * env * gain_l
        right_buf[target_idx] += val * env * gain_r
        pos += step_size

def render_drum(drum_name, start_step, vol=1.0, pan=0.0, pitch_shift=0):
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

# Voice clip helper (plays "DAOW!" or "chant" cleanly)
def play_daow(step, vol=1.0, pan=0.0):
    render_drum('daow', step, vol=vol, pan=pan)

def play_chant(step, vol=0.8, pan=-0.2):
    render_note('chant', 'E5', step, step_len=3.0, vol=vol, pan=pan, release_ms=40.0)

# ------------------------------------------------------------------------------
# 3. DRUM & GROOVE PATTERNS
# ------------------------------------------------------------------------------
def apply_escape_drums(bar, pattern_type):
    base_step = bar * 16
    if pattern_type == 'intro_countdown':
        # Fast ticking shaker and clock-like rim clicks
        for s in range(16):
            render_drum('shaker', base_step + s, vol=0.45 if s % 2 == 0 else 0.3, pan=0.35)
        render_drum('snare_rim', base_step + 4, vol=0.7, pan=-0.1)
        render_drum('snare_rim', base_step + 12, vol=0.7, pan=-0.1)

    elif pattern_type == 'full_escape':
        # High-speed Wario Land 4 Hurry Up breakbeat!
        # Kick: 0, 6, 8, 10
        render_drum('kick', base_step + 0, vol=0.95, pan=0.0)
        render_drum('kick', base_step + 6, vol=0.8, pan=0.0)
        render_drum('kick', base_step + 8, vol=0.9, pan=0.0)
        render_drum('kick', base_step + 10, vol=0.8, pan=0.0)
        # Snare + Clap on 4 and 12
        render_drum('snare', base_step + 4, vol=0.9, pan=-0.1)
        render_drum('clap', base_step + 4, vol=0.6, pan=0.1)
        render_drum('snare', base_step + 12, vol=0.95, pan=-0.1)
        render_drum('clap', base_step + 12, vol=0.65, pan=0.1)
        # Ghost snares
        render_drum('snare', base_step + 15, vol=0.45, pan=-0.1)

        # 16th Shaker motor
        for s in range(16):
            v = 0.55 if s in [2, 6, 10, 14] else 0.35
            render_drum('shaker', base_step + s, vol=v, pan=0.4)

        # Bongos & Agogo accents
        render_drum('bongo_hi', base_step + 2, vol=0.6, pan=-0.35)
        render_drum('bongo_lo', base_step + 6, vol=0.65, pan=0.35)
        render_drum('agogo_hi', base_step + 10, vol=0.55, pan=-0.3)
        render_drum('bongo_hi', base_step + 14, vol=0.6, pan=-0.35)

    elif pattern_type == 'escape_fill':
        render_drum('kick', base_step + 0, vol=0.95, pan=0.0)
        render_drum('snare', base_step + 4, vol=0.85, pan=-0.1)
        render_drum('kick', base_step + 6, vol=0.8, pan=0.0)
        render_drum('kick', base_step + 8, vol=0.9, pan=0.0)
        # Rapid tom/snare rolls on beats 3 and 4
        render_drum('snare', base_step + 10, vol=0.7, pan=-0.1)
        render_drum('snare', base_step + 11, vol=0.75, pan=-0.1)
        render_drum('snare', base_step + 12, vol=0.8, pan=-0.1)
        render_drum('snare', base_step + 13, vol=0.85, pan=-0.1)
        render_drum('snare', base_step + 14, vol=0.9, pan=-0.1)
        render_drum('snare', base_step + 15, vol=0.95, pan=-0.1)

    elif pattern_type == 'half_time':
        # Heavy slow stomp (half-time tension)
        render_drum('kick', base_step + 0, vol=1.0, pan=0.0)
        render_drum('snare', base_step + 8, vol=0.9, pan=-0.1)
        render_drum('clap', base_step + 8, vol=0.7, pan=0.1)
        for s in [0, 4, 8, 12]:
            render_drum('snare_rim', base_step + s, vol=0.5, pan=0.2)
        render_drum('shaker', base_step + 2, vol=0.4, pan=0.3)
        render_drum('shaker', base_step + 6, vol=0.4, pan=0.3)
        render_drum('shaker', base_step + 10, vol=0.4, pan=0.3)
        render_drum('shaker', base_step + 14, vol=0.4, pan=0.3)

# --- BASS HELPER (Authentic Deow Synth Bass) ---
def apply_deow_bass(bar, chord_name):
    base_step = bar * 16
    # Funky 16th-note driving bassline
    # [step, note, dur, vol]
    if chord_name == 'Dm':
        notes = [(0, 'D2', 1.5, 0.95), (2, 'D3', 1.2, 0.8), (4, 'F2', 1.5, 0.9),
                 (6, 'D3', 1.2, 0.8), (8, 'G2', 1.5, 0.85), (10, 'Ab2', 1.5, 0.85),
                 (12, 'A2', 1.5, 0.9), (14, 'C3', 1.5, 0.85)]
    elif chord_name == 'Gm':
        notes = [(0, 'G2', 1.5, 0.95), (2, 'G3', 1.2, 0.8), (4, 'Bb2', 1.5, 0.9),
                 (6, 'G3', 1.2, 0.8), (8, 'C3', 1.5, 0.85), (10, 'Db3', 1.5, 0.85),
                 (12, 'D3', 1.5, 0.9), (14, 'F3', 1.5, 0.85)]
    elif chord_name == 'Bb':
        notes = [(0, 'Bb2', 1.5, 0.95), (2, 'Bb3', 1.2, 0.8), (4, 'D3', 1.5, 0.9),
                 (6, 'Bb3', 1.2, 0.8), (8, 'F2', 1.5, 0.85), (10, 'Ab2', 1.5, 0.85),
                 (12, 'A2', 1.5, 0.9), (14, 'C3', 1.5, 0.85)]
    elif chord_name == 'A7':
        notes = [(0, 'A2', 1.5, 0.95), (2, 'A3', 1.2, 0.8), (4, 'C#3', 1.5, 0.9),
                 (6, 'A3', 1.2, 0.8), (8, 'E2', 1.5, 0.85), (10, 'G2', 1.5, 0.85),
                 (12, 'A2', 1.5, 0.9), (14, 'Bb2', 1.5, 0.85)]
    elif chord_name == 'F':
        notes = [(0, 'F2', 1.5, 0.95), (2, 'F3', 1.2, 0.8), (4, 'A2', 1.5, 0.9),
                 (6, 'F3', 1.2, 0.8), (8, 'C3', 1.5, 0.85), (10, 'Eb3', 1.5, 0.85),
                 (12, 'E3', 1.5, 0.9), (14, 'G3', 1.5, 0.85)]
    elif chord_name == 'C':
        notes = [(0, 'C2', 1.5, 0.95), (2, 'C3', 1.2, 0.8), (4, 'E2', 1.5, 0.9),
                 (6, 'C3', 1.2, 0.8), (8, 'G2', 1.5, 0.85), (10, 'Bb2', 1.5, 0.85),
                 (12, 'B2', 1.5, 0.9), (14, 'D3', 1.5, 0.85)]
    else:
        notes = [(0, 'D2', 1.5, 0.95), (2, 'D3', 1.2, 0.8), (4, 'F2', 1.5, 0.9),
                 (6, 'D3', 1.2, 0.8), (8, 'A2', 1.5, 0.85), (10, 'C3', 1.5, 0.85),
                 (12, 'D3', 1.5, 0.9), (14, 'E3', 1.5, 0.85)]

    for s, n, d, v in notes:
        render_note('deow_bass', n, base_step + s, step_len=d, vol=v, pan=0.0, release_ms=18.0)

# --- ELECTRIC PIANO CHORDS ---
def apply_hurry_ep_chords(bar, chord_name):
    base_step = bar * 16
    chord_map = {
        'Dm': ['F4', 'A4', 'C5', 'E5'],
        'Gm': ['G4', 'Bb4', 'D5', 'F5'],
        'Bb': ['F4', 'Bb4', 'D5', 'F5'],
        'A7': ['G4', 'A4', 'C#5', 'E5'],
        'F':  ['F4', 'A4', 'C5', 'E5'],
        'C':  ['E4', 'G4', 'B4', 'D5'],
    }
    notes = chord_map.get(chord_name, ['F4', 'A4', 'D5'])
    # Funky offbeat stabs on 2, 6, 10, 14
    for off in [2, 6, 10, 14]:
        for n in notes:
            render_note('hurry_ep', n, base_step + off, step_len=1.5, vol=0.5,
                        pan=-0.25, release_ms=25.0, decay_rate=2.5)

# ------------------------------------------------------------------------------
# 4. COMPOSITION OF THE 85 BARS (150 SECONDS)
# ------------------------------------------------------------------------------

# ===== INTRO: THE FROG SWITCH & COUNTDOWN (Bars 0 to 4) =====
print("Arranging Intro: Switch Triggered & Countdown (Bars 1-5)...")

# Bar 0: Massive "DAOW!" explosion hit + Crash
play_daow(0, vol=1.0, pan=0.0)
render_drum('crash', 0, vol=0.9, pan=-0.2)
render_note('toxic_gtr', 'D3', 0, step_len=6.0, vol=0.85, pan=-0.4, release_ms=50.0)
render_note('toxic_gtr', 'A3', 0, step_len=6.0, vol=0.85, pan=-0.4, release_ms=50.0)
render_note('deow_bass', 'D2', 0, step_len=8.0, vol=1.0, pan=0.0, release_ms=50.0)

for b in range(1, 5):
    if b < 4:
        apply_escape_drums(b, 'intro_countdown')
    else:
        apply_escape_drums(b, 'escape_fill')
        # Reverse cymbal / rising pitch
        render_note('hurry_lead', 'D5', b*16 + 8, step_len=1.5, vol=0.7, pan=0.2)
        render_note('hurry_lead', 'E5', b*16 + 10, step_len=1.5, vol=0.75, pan=0.2)
        render_note('hurry_lead', 'F5', b*16 + 12, step_len=1.5, vol=0.8, pan=0.2)
        render_note('hurry_lead', 'G#5', b*16 + 14, step_len=1.5, vol=0.85, pan=0.2)

# Chant in Intro
play_chant(1 * 16 + 4, vol=0.75, pan=-0.25)
play_chant(3 * 16 + 4, vol=0.8, pan=-0.25)

# Bass entering on Bars 3-4
apply_deow_bass(3, 'Dm')
apply_deow_bass(4, 'A7')


# ===== SECTION 1: HURRY UP! THE ESCAPE SPRINT (Bars 5 to 20, 16 bars) =====
print("Arranging Section 1: Hurry Up! Main Escape Sprint (Bars 6-21)...")
sec1_chords = [
    'Dm', 'Dm', 'Gm', 'Gm', 'Bb', 'C',  'Dm', 'A7',
    'Dm', 'Dm', 'Gm', 'Gm', 'Bb', 'A7', 'Dm', 'Dm'
]

for i, ch in enumerate(sec1_chords):
    bar = 5 + i
    is_fill = (i in [7, 15])
    apply_escape_drums(bar, 'escape_fill' if is_fill else 'full_escape')
    apply_deow_bass(bar, ch)
    apply_hurry_ep_chords(bar, ch)
    if i in [0, 8]:
        render_drum('crash', bar * 16, vol=0.85, pan=-0.2)
    if i in [4, 12]:
        play_daow(bar * 16 + 12, vol=0.8, pan=0.1)

# Authentic Wario Land 4 "Hurry Up!" Lead Melody (Bars 5 - 20)
# Fast, urgent, syncopated chromatic theme!
hurry_melody_sec1 = [
    # Phrase 1: Bars 5 - 8
    (5*16 + 0, 'D5', 1.5), (5*16 + 2, 'F5', 1.5), (5*16 + 4, 'A5', 2.0), (5*16 + 8, 'D6', 2.5),
    (5*16 + 12, 'C6', 1.8), (5*16 + 14, 'A5', 1.8),

    (6*16 + 0, 'G#5', 1.8), (6*16 + 2, 'A5', 1.8), (6*16 + 4, 'C6', 2.0), (6*16 + 8, 'A5', 3.0),
    (6*16 + 12, 'F5', 1.8), (6*16 + 14, 'D5', 1.8),

    (7*16 + 0, 'G5', 1.5), (7*16 + 2, 'Bb5', 1.5), (7*16 + 4, 'D6', 2.0), (7*16 + 8, 'G6', 2.5),
    (7*16 + 12, 'F6', 1.8), (7*16 + 14, 'D6', 1.8),

    (8*16 + 0, 'C#6', 1.8), (8*16 + 2, 'D6', 1.8), (8*16 + 4, 'F6', 2.0), (8*16 + 8, 'D6', 3.0),

    # Phrase 2: Bars 9 - 12
    (9*16 + 0, 'Bb5', 1.8), (9*16 + 2, 'D6', 1.8), (9*16 + 4, 'F6', 2.0), (9*16 + 8, 'G6', 2.5),
    (9*16 + 12, 'F6', 1.8), (9*16 + 14, 'D6', 1.8),

    (10*16 + 0, 'C6', 1.8), (10*16 + 2, 'E6', 1.8), (10*16 + 4, 'G6', 2.0), (10*16 + 8, 'A6', 3.0),

    (11*16 + 0, 'F6', 1.5), (11*16 + 2, 'D6', 1.5), (11*16 + 4, 'C6', 1.5), (11*16 + 6, 'A5', 1.5),
    (11*16 + 8, 'G#5', 1.5), (11*16 + 10, 'A5', 1.5), (11*16 + 12, 'D5', 3.0),

    (12*16 + 0, 'A5', 2.0), (12*16 + 4, 'C#6', 2.0), (12*16 + 8, 'E6', 2.0), (12*16 + 12, 'A6', 2.5),

    # Phrase 3: Bars 13 - 16 (Higher octave and chromatic variations)
    (13*16 + 0, 'D6', 1.5), (13*16 + 2, 'F6', 1.5), (13*16 + 4, 'A6', 2.0), (13*16 + 8, 'D7', 2.5),
    (13*16 + 12, 'C7', 1.8), (13*16 + 14, 'A6', 1.8),

    (14*16 + 0, 'G#6', 1.8), (14*16 + 2, 'A6', 1.8), (14*16 + 4, 'C7', 2.0), (14*16 + 8, 'A6', 3.0),

    (15*16 + 0, 'G6', 1.5), (15*16 + 2, 'Bb6', 1.5), (15*16 + 4, 'D7', 2.0), (15*16 + 8, 'G7', 2.5),
    (15*16 + 12, 'F7', 1.8), (15*16 + 14, 'D7', 1.8),

    (16*16 + 0, 'C#7', 1.8), (16*16 + 2, 'D7', 1.8), (16*16 + 4, 'F7', 2.0), (16*16 + 8, 'D7', 3.0),

    # Phrase 4: Bars 17 - 20 (Climbing cadence into Section 2)
    (17*16 + 0, 'Bb6', 1.8), (17*16 + 2, 'C7', 1.8), (17*16 + 4, 'D7', 2.0), (17*16 + 8, 'F7', 2.5),
    (18*16 + 0, 'E7', 1.8), (18*16 + 2, 'D7', 1.8), (18*16 + 4, 'C#7', 2.0), (18*16 + 8, 'A6', 3.0),

    (19*16 + 0, 'D7', 2.5), (19*16 + 4, 'A6', 2.0), (19*16 + 8, 'F6', 2.0), (19*16 + 12, 'D6', 2.5),
    (20*16 + 0, 'D5', 2.0)
]
for s, n, d in hurry_melody_sec1:
    render_note('hurry_lead', n, s, step_len=d, vol=0.85, pan=0.2, release_ms=30.0)

# Domino Row Brass stabs on turnarounds
brass_stabs_sec1 = [
    (6*16 + 12, 'D4'), (6*16 + 14, 'F4'),
    (8*16 + 12, 'G4'), (8*16 + 14, 'A4'),
    (10*16 + 12, 'C5'), (10*16 + 14, 'D5'),
    (14*16 + 12, 'D5'), (14*16 + 14, 'F5'),
    (18*16 + 12, 'A5'), (18*16 + 14, 'C#6'),
    (20*16 + 8, 'D5'), (20*16 + 10, 'F5'), (20*16 + 12, 'A5'), (20*16 + 14, 'D6')
]
for s, n in brass_stabs_sec1:
    render_note('brass', n, s, step_len=1.5, vol=0.75, pan=-0.2, release_ms=25.0)


# ===== SECTION 2: BRASS & TOXIC GUITAR FRENZY (Bars 21 to 36, 16 bars) =====
print("Arranging Section 2: Brass & Toxic Guitar Frenzy (Bars 22-37)...")
sec2_chords = [
    'Dm', 'F',  'G',  'Bb', 'Dm', 'F',  'G',  'A7',
    'Dm', 'F',  'G',  'Bb', 'Gm', 'A7', 'Dm', 'A7'
]

for i, ch in enumerate(sec2_chords):
    bar = 21 + i
    is_fill = (i in [7, 15])
    apply_escape_drums(bar, 'escape_fill' if is_fill else 'full_escape')
    apply_deow_bass(bar, ch)
    apply_hurry_ep_chords(bar, ch)

    # Toxic Distortion Guitar power chords on beats 0, 4, 8, 12
    root_pitch_map = {'Dm': 'D3', 'F': 'F3', 'G': 'G3', 'Bb': 'Bb3', 'A7': 'A3', 'Gm': 'G3'}
    fifth_pitch_map = {'Dm': 'A3', 'F': 'C4', 'G': 'D4', 'Bb': 'F4', 'A7': 'E4', 'Gm': 'D4'}
    rn = root_pitch_map.get(ch, 'D3')
    fn = fifth_pitch_map.get(ch, 'A3')
    for beat_step in [0, 6, 8, 14]:
        render_note('toxic_gtr', rn, bar * 16 + beat_step, step_len=1.8, vol=0.7, pan=-0.45, release_ms=30.0)
        render_note('toxic_gtr', fn, bar * 16 + beat_step, step_len=1.8, vol=0.7, pan=-0.45, release_ms=30.0)

    if i in [0, 8]:
        render_drum('crash', bar * 16, vol=0.9, pan=-0.2)
    if i in [3, 11]:
        play_daow(bar * 16 + 12, vol=0.85, pan=0.0)

# Domino Row Brass Fanfare Lead (Bars 21 - 36)
brass_lead_sec2 = [
    (21*16 + 0, 'D4', 2.0), (21*16 + 4, 'F4', 2.0), (21*16 + 8, 'A4', 2.0), (21*16 + 12, 'D5', 3.0),
    (22*16 + 0, 'C5', 2.0), (22*16 + 4, 'A4', 2.0), (22*16 + 8, 'F4', 2.0), (22*16 + 12, 'D4', 3.0),
    (23*16 + 0, 'G4', 2.0), (23*16 + 4, 'B4', 2.0), (23*16 + 8, 'D5', 2.0), (23*16 + 12, 'G5', 3.0),
    (24*16 + 0, 'F5', 2.0), (24*16 + 4, 'D5', 2.0), (24*16 + 8, 'Bb4', 2.0), (24*16 + 12, 'G4', 3.0),

    (25*16 + 0, 'D4', 2.0), (25*16 + 4, 'F4', 2.0), (25*16 + 8, 'A4', 2.0), (25*16 + 12, 'D5', 3.0),
    (26*16 + 0, 'C5', 2.0), (26*16 + 4, 'A4', 2.0), (26*16 + 8, 'F4', 2.0), (26*16 + 12, 'D4', 3.0),
    (27*16 + 0, 'G4', 2.0), (27*16 + 4, 'B4', 2.0), (27*16 + 8, 'D5', 2.0), (27*16 + 12, 'E5', 3.0),
    (28*16 + 0, 'F5', 2.0), (28*16 + 4, 'E5', 2.0), (28*16 + 8, 'C#5', 2.0), (28*16 + 12, 'A4', 3.0),

    # Octave up repetition with maximum punch
    (29*16 + 0, 'D5', 2.0), (29*16 + 4, 'F5', 2.0), (29*16 + 8, 'A5', 2.0), (29*16 + 12, 'D6', 3.0),
    (30*16 + 0, 'C6', 2.0), (30*16 + 4, 'A5', 2.0), (30*16 + 8, 'F5', 2.0), (30*16 + 12, 'D5', 3.0),
    (31*16 + 0, 'G5', 2.0), (31*16 + 4, 'B5', 2.0), (31*16 + 8, 'D6', 2.0), (31*16 + 12, 'G6', 3.0),
    (32*16 + 0, 'F6', 2.0), (32*16 + 4, 'D6', 2.0), (32*16 + 8, 'Bb5', 2.0), (32*16 + 12, 'G5', 3.0),

    (33*16 + 0, 'Bb5', 2.0), (33*16 + 4, 'D6', 2.0), (33*16 + 8, 'F6', 2.0), (33*16 + 12, 'G6', 3.0),
    (34*16 + 0, 'A6', 2.0), (34*16 + 4, 'G6', 2.0), (34*16 + 8, 'E6', 2.0), (34*16 + 12, 'C#6', 3.0),
    (35*16 + 0, 'D6', 3.0), (35*16 + 6, 'A5', 2.0), (35*16 + 10, 'F5', 2.0), (35*16 + 14, 'D5', 2.0),
    (36*16 + 0, 'A4', 3.0)
]
for s, n, d in brass_lead_sec2:
    render_note('brass', n, s, step_len=d, vol=0.85, pan=0.0, release_ms=30.0)

# Lead synth fast 16th arpeggios counterpoint behind Brass
for b in range(21, 37):
    base_s = b * 16
    arp_notes = ['D5', 'F5', 'A5', 'D6', 'F6', 'D6', 'A5', 'F5', 'D5', 'F5', 'A5', 'D6', 'F6', 'D6', 'A5', 'F5']
    for idx, n in enumerate(arp_notes):
        render_note('hurry_lead', n, base_s + idx, step_len=1.2, vol=0.45, pan=0.3, release_ms=15.0)


# ===== SECTION 3: HALF-TIME TENSION BREAKDOWN (Bars 37 to 52, 16 bars) =====
print("Arranging Section 3: Half-Time Collapse Breakdown (Bars 38-53)...")
sec3_chords = [
    'Dm', 'Dm', 'Gm', 'Gm', 'Bb', 'Bb', 'A7', 'A7',
    'Dm', 'Dm', 'Gm', 'Gm', 'Bb', 'C',  'Dm', 'A7'
]

for i, ch in enumerate(sec3_chords):
    bar = 37 + i
    apply_escape_drums(bar, 'half_time')

    # Deep Byow Boss Sub Bass (heavy 808-style low end)
    b_step = bar * 16
    root_map = {'Dm': 'D2', 'Gm': 'G1', 'Bb': 'Bb1', 'A7': 'A1', 'C': 'C2'}
    bn = root_map.get(ch, 'D2')
    render_note('boss_bass', bn, b_step + 0, step_len=7.0, vol=0.9, pan=0.0, release_ms=50.0)
    render_note('boss_bass', bn, b_step + 8, step_len=6.0, vol=0.85, pan=0.0, release_ms=50.0)

    # Suspenseful Strings in background
    string_map = {
        'Dm': ['D4', 'F4', 'A4'],
        'Gm': ['D4', 'G4', 'Bb4'],
        'Bb': ['D4', 'F4', 'Bb4'],
        'A7': ['C#4', 'E4', 'A4'],
        'C':  ['C4', 'E4', 'G4']
    }
    for sn in string_map.get(ch, ['D4', 'F4', 'A4']):
        render_note('strings', sn, b_step + 0, step_len=14.0, vol=0.45, pan=0.3, release_ms=60.0)

    # Pizzicato clock ticking
    render_note('pizz', 'D4', b_step + 0, step_len=1.5, vol=0.6, pan=-0.3, release_ms=20.0)
    render_note('pizz', 'D4', b_step + 4, step_len=1.5, vol=0.5, pan=0.3, release_ms=20.0)
    render_note('pizz', 'D4', b_step + 8, step_len=1.5, vol=0.6, pan=-0.3, release_ms=20.0)
    render_note('pizz', 'D4', b_step + 12, step_len=1.5, vol=0.5, pan=0.3, release_ms=20.0)

    # Chant echoes in breakdown
    if i in [2, 6, 10]:
        play_chant(b_step + 4, vol=0.8, pan=-0.3)

# Fiery Cavern Distortion Guitar Solos (Bluesy, weeping Wario guitar!)
fiery_solo_sec3 = [
    (38*16 + 0, 'D4', 3.0), (38*16 + 6, 'F4', 2.0), (38*16 + 10, 'G4', 3.0),
    (39*16 + 0, 'Ab4', 2.0), (39*16 + 4, 'A4', 4.0), (39*16 + 12, 'G4', 2.0), (39*16 + 14, 'F4', 2.0),

    (40*16 + 0, 'G4', 4.0), (40*16 + 6, 'Bb4', 2.0), (40*16 + 10, 'C5', 3.0),
    (41*16 + 0, 'D5', 5.0), (41*16 + 10, 'C5', 2.0), (41*16 + 12, 'Bb4', 2.0), (41*16 + 14, 'G4', 2.0),

    (42*16 + 0, 'F4', 3.0), (42*16 + 6, 'G4', 2.0), (42*16 + 10, 'Bb4', 3.0),
    (43*16 + 0, 'C5', 4.0), (43*16 + 6, 'D5', 2.0), (43*16 + 10, 'E5', 3.0),

    (44*16 + 0, 'F5', 4.0), (44*16 + 6, 'E5', 2.0), (44*16 + 10, 'C#5', 3.0),
    (45*16 + 0, 'D5', 6.0),

    # Higher register weeping bends
    (46*16 + 0, 'A5', 4.0), (46*16 + 6, 'C6', 2.0), (46*16 + 10, 'D6', 4.0),
    (47*16 + 0, 'E6', 3.0), (47*16 + 6, 'F6', 3.0), (47*16 + 12, 'E6', 2.0), (47*16 + 14, 'D6', 2.0),

    (48*16 + 0, 'G6', 4.0), (48*16 + 6, 'F6', 2.0), (48*16 + 10, 'D6', 4.0),
    (49*16 + 0, 'C6', 3.0), (49*16 + 6, 'Bb5', 2.0), (49*16 + 10, 'A5', 4.0),

    (50*16 + 0, 'G#5', 2.0), (50*16 + 4, 'A5', 2.0), (50*16 + 8, 'C6', 2.0), (50*16 + 12, 'D6', 2.0),
    (51*16 + 0, 'E6', 2.0), (51*16 + 4, 'F6', 2.0), (51*16 + 8, 'G6', 2.0), (51*16 + 12, 'A6', 3.0),
]
for s, n, d in fiery_solo_sec3:
    render_note('fiery_gtr', n, s, step_len=d, vol=0.8, pan=0.4, release_ms=35.0)

# Build up back to full speed (Bar 52)
render_drum('crash', 52 * 16 + 0, vol=0.85, pan=-0.2)
play_daow(52 * 16 + 8, vol=1.0, pan=0.0)
for s in range(8, 16):
    render_drum('snare', 52 * 16 + s, vol=0.6 + (s - 8) * 0.05, pan=-0.1)


# ===== SECTION 4: BOSS GATE CLIMAX (Bars 53 to 68, 16 bars) =====
print("Arranging Section 4: Boss Gate Climax (Bars 54-69)...")
sec4_chords = [
    'Dm', 'Gm', 'Bb', 'A7', 'Dm', 'Gm', 'C',  'F',
    'Dm', 'Gm', 'Bb', 'A7', 'Gm', 'A7', 'Dm', 'A7'
]

for i, ch in enumerate(sec4_chords):
    bar = 53 + i
    is_fill = (i in [7, 15])
    apply_escape_drums(bar, 'escape_fill' if is_fill else 'full_escape')
    apply_deow_bass(bar, ch)
    apply_hurry_ep_chords(bar, ch)

    # Boss Gate Synth rapid arpeggios
    root_pitch = note_to_midi('D4' if ch == 'Dm' else ('G4' if ch == 'Gm' else ('Bb4' if ch == 'Bb' else 'A4')))
    for step_in_bar in range(16):
        deg = [0, 3, 7, 10, 12, 10, 7, 3][step_in_bar % 8]
        render_note('boss_gate', root_pitch + deg, bar * 16 + step_in_bar, step_len=1.1, vol=0.55,
                    pan=-0.35 if step_in_bar % 2 == 0 else 0.35, release_ms=15.0)

    if i in [0, 8]:
        render_drum('crash', bar * 16, vol=0.9, pan=-0.2)
    if i in [4, 12]:
        play_daow(bar * 16 + 12, vol=0.9, pan=0.0)

# Lead synth frantic virtuoso line in Section 4
for b in range(53, 69):
    base_s = b * 16
    ch = sec4_chords[b - 53]
    if b % 2 == 0:
        lead_line = [
            (0, 'D6', 1.5), (2, 'F6', 1.5), (4, 'A6', 2.0), (8, 'D7', 2.5),
            (12, 'C7', 1.8), (14, 'A6', 1.8)
        ]
    else:
        lead_line = [
            (0, 'G#6', 1.8), (2, 'A6', 1.8), (4, 'C7', 2.0), (8, 'A6', 2.5),
            (12, 'F6', 1.8), (14, 'D6', 1.8)
        ]
    for s_off, n, d in lead_line:
        render_note('hurry_lead', n, base_s + s_off, step_len=d, vol=0.85, pan=0.2, release_ms=25.0)


# ===== SECTION 5: FINAL 10 SECONDS - OUTRUN THE EXPLOSION (Bars 69 to 80, 12 bars) =====
print("Arranging Section 5: Final Outrun Tutti (Bars 70-81)...")
sec5_chords = [
    'Dm', 'Gm', 'Bb', 'A7',
    'Dm', 'Gm', 'Bb', 'A7',
    'Dm', 'Eb', 'E',  'F'
]

for i, ch in enumerate(sec5_chords):
    bar = 69 + i
    is_fill = (i >= 8) # Chromatic climb fill at end
    apply_escape_drums(bar, 'escape_fill' if is_fill else 'full_escape')
    apply_deow_bass(bar, ch if ch in ['Dm', 'Gm', 'Bb', 'A7'] else 'Dm')
    apply_hurry_ep_chords(bar, ch if ch in ['Dm', 'Gm', 'Bb', 'A7'] else 'Dm')

    # Double crash cymbals for massive urgency
    if i % 2 == 0:
        render_drum('crash', bar * 16, vol=0.95, pan=-0.2)

    # Guitar rhythm chugging
    for beat in [0, 4, 8, 12]:
        render_note('toxic_gtr', 'D3', bar * 16 + beat, step_len=1.8, vol=0.8, pan=-0.4, release_ms=20.0)
        render_note('toxic_gtr', 'A3', bar * 16 + beat, step_len=1.8, vol=0.8, pan=-0.4, release_ms=20.0)

# Tutti melody in Bars 69 - 77
for s, n, d in [
    (69*16 + 0, 'D6', 2.0), (69*16 + 4, 'F6', 2.0), (69*16 + 8, 'A6', 2.0), (69*16 + 12, 'D7', 3.0),
    (70*16 + 0, 'G6', 2.0), (70*16 + 4, 'Bb6', 2.0), (70*16 + 8, 'D7', 2.0), (70*16 + 12, 'G7', 3.0),
    (71*16 + 0, 'F7', 2.0), (71*16 + 4, 'D7', 2.0), (71*16 + 8, 'Bb6', 2.0), (71*16 + 12, 'G6', 3.0),
    (72*16 + 0, 'A6', 2.0), (72*16 + 4, 'C#7', 2.0), (72*16 + 8, 'E7', 2.0), (72*16 + 12, 'A7', 3.0),

    (73*16 + 0, 'D7', 2.5), (73*16 + 4, 'C7', 2.0), (73*16 + 8, 'Bb6', 2.0), (73*16 + 12, 'A6', 2.0),
    (74*16 + 0, 'G6', 2.5), (74*16 + 4, 'F6', 2.0), (74*16 + 8, 'E6', 2.0), (74*16 + 12, 'D6', 2.0),
    (75*16 + 0, 'C#6', 2.5), (75*16 + 4, 'D6', 2.0), (75*16 + 8, 'E6', 2.0), (75*16 + 12, 'F6', 2.0),
    (76*16 + 0, 'G6', 2.0), (76*16 + 4, 'G#6', 2.0), (76*16 + 8, 'A6', 2.0), (76*16 + 12, 'A#6', 3.0),
]:
    render_note('hurry_lead', n, s, step_len=d, vol=0.9, pan=0.2, release_ms=30.0)
    render_note('brass', n, s, step_len=d, vol=0.85, pan=-0.2, release_ms=30.0)

# Bars 77 - 80: High-Tension Chromatic Ascending Run (Unbearable adrenaline!)
chromatic_run = [
    'D5', 'D#5', 'E5', 'F5', 'F#5', 'G5', 'G#5', 'A5',
    'A#5', 'B5', 'C6', 'C#6', 'D6', 'D#6', 'E6', 'F6',
    'F#6', 'G6', 'G#6', 'A6', 'A#6', 'B6', 'C7', 'C#7',
    'D7', 'D#7', 'E7', 'F7', 'F#7', 'G7', 'G#7', 'A7'
]
for idx, cn in enumerate(chromatic_run):
    step_pos = 77 * 16 + idx
    render_note('hurry_lead', cn, step_pos, step_len=1.2, vol=0.85, pan=0.25, release_ms=20.0)
    render_note('brass', cn, step_pos, step_len=1.2, vol=0.8, pan=-0.25, release_ms=20.0)
    render_note('toxic_gtr', cn, step_pos, step_len=1.2, vol=0.75, pan=0.0, release_ms=20.0)
    # Accelerating snare roll underneath
    render_drum('snare', step_pos, vol=0.6 + (idx / float(len(chromatic_run))) * 0.35, pan=-0.1)


# ===== OUTRO: TURNAROUND & SEAMLESS LOOP RESOLUTION (Bars 81 to 84, 4 bars) =====
print("Arranging Outro: Turnaround & Seamless Loop Cadence (Bars 82-85)...")

# Bar 81: Huge Unison Hit on D!
play_daow(81 * 16 + 0, vol=1.0, pan=0.0)
render_drum('crash', 81 * 16 + 0, vol=1.0, pan=0.0)
render_note('brass', 'D6', 81 * 16 + 0, step_len=4.0, vol=0.95, pan=0.0, release_ms=30.0)
render_note('hurry_lead', 'D7', 81 * 16 + 0, step_len=4.0, vol=0.95, pan=0.0, release_ms=30.0)
render_note('deow_bass', 'D2', 81 * 16 + 0, step_len=4.0, vol=1.0, pan=0.0, release_ms=30.0)

# Bar 81 - 83: Fast descending pentatonic slap/brass cadence
cadence_notes = [
    (81*16 + 6, 'A6', 1.5), (81*16 + 8, 'F6', 1.5), (81*16 + 10, 'D6', 1.5), (81*16 + 12, 'C6', 1.5), (81*16 + 14, 'A5', 1.5),
    (82*16 + 0, 'D5', 2.0), (82*16 + 4, 'F5', 1.5), (82*16 + 6, 'G5', 1.5), (82*16 + 8, 'G#5', 1.5), (82*16 + 10, 'A5', 2.0),
    (82*16 + 12, 'C6', 1.8), (82*16 + 14, 'D6', 2.0),
    (83*16 + 0, 'F6', 2.0), (83*16 + 4, 'D6', 2.0), (83*16 + 8, 'A5', 2.0), (83*16 + 12, 'D5', 3.0),
]
for s, n, d in cadence_notes:
    render_note('hurry_lead', n, s, step_len=d, vol=0.85, pan=0.2, release_ms=25.0)
    render_note('brass', n, s, step_len=d, vol=0.8, pan=-0.2, release_ms=25.0)
    render_note('deow_bass', n, s, step_len=d, vol=0.85, pan=0.0, release_ms=20.0)

# Bar 84: Drum flams + final "DAOW!" right before looping back into Bar 0!
render_drum('snare', 84 * 16 + 0, vol=0.85, pan=-0.1)
render_drum('snare', 84 * 16 + 4, vol=0.9, pan=-0.1)
render_drum('snare', 84 * 16 + 8, vol=0.95, pan=-0.1)
render_drum('snare', 84 * 16 + 10, vol=0.95, pan=-0.1)
render_drum('snare', 84 * 16 + 12, vol=1.0, pan=-0.1)
render_drum('snare', 84 * 16 + 14, vol=1.0, pan=-0.1)

# Final lead slide into the loop
render_note('hurry_lead', 'A6', 84 * 16 + 8, step_len=2.0, vol=0.9, pan=0.2, release_ms=25.0)
render_note('hurry_lead', 'D7', 84 * 16 + 12, step_len=3.0, vol=0.95, pan=0.2, release_ms=40.0)

print("Musical arrangement complete!")

# ------------------------------------------------------------------------------
# 5. SPATIAL REVERB & DELAY SEND (GBA Stereo Ambience)
# ------------------------------------------------------------------------------
print("Applying GBA stereo spatial echo & delay...")
delay_samples = int(0.22 * SAMPLE_RATE) # ~220ms delay
delay_feedback = 0.20

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
target_peak = 0.95
norm_gain = target_peak / max(max_val, 1e-6)

# Smooth loop boundary crossfade (last 50ms into first 50ms) to ensure 100% zero-click loop
xfade_len = int(0.05 * SAMPLE_RATE)
for i in range(xfade_len):
    weight = i / float(xfade_len)
    end_idx = TOTAL_SAMPLES - xfade_len + i
    blended_l = left_buf[i] * weight + left_buf[end_idx] * (1.0 - weight)
    blended_r = right_buf[i] * weight + right_buf[end_idx] * (1.0 - weight)
    left_buf[i] = blended_l
    right_buf[i] = blended_r
    left_buf[end_idx] = blended_l
    right_buf[end_idx] = blended_r

print("Packing 16-bit PCM WAV data...")
out_wav_path = 'music/mu_escape.wav'
with wave.open(out_wav_path, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SAMPLE_RATE)

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

# Also copy to mu_pizzatime.wav and mu_breakingnews.wav
for target_name in ['music/mu_pizzatime.wav', 'music/mu_breakingnews.wav']:
    shutil.copyfile(out_wav_path, target_name)
    print(f"Copied to: {target_name}")

elapsed = time.time() - t_start
print(f"=== Wario Land 4 Escape Track successfully generated in {elapsed:.2f}s ===")
