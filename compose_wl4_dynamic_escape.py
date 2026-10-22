# ==============================================================================
# WARIO LAND 4 x PIZZA TOWER HIGH-ENERGY ESCAPE SOUNDTRACK
# "IT'S PIZZA TIME!" ATMOSPHERE (Inspired by MuseScore 10221547 / Mr. Sauceman)
# Featuring:
# - Authentic "It's Pizza Time!" Style: Ultra-funky breakbeats, slap bass,
#   big-band brass hits, funky Rhodes EP jazz chords, Latin percussion (no sirens, no DAOW!)
# - Central Theme: The 0:00 Tutorial Piano Arpeggio (Cmaj7 -> Fmaj7 -> G7 -> C)
# - Authentic Soundfont: Wario Land 4 Sample 556 deow_bass, hurry_lead, brass, hurry_ep, etc.
# - Continuous Clock Ticking (clock_tick.wav) throughout all 150 seconds
# - Dynamic Tempo Curve:
#     Phase 1: Slow Funky Countdown (0:00 ~ 0:27.96, 103 BPM, 12 bars)
#     Phase 2: "It's Pizza Time!" Fast Escape Sprint (0:28 ~ 1:25.56, 150 BPM, 36 bars)
#     Phase 3: "Lap 2" Hyper Panic Sprint! (1:25.56 ~ 2:13.03, 182 BPM, 36 bars)
#     Phase 4: Heavy Big-Band Half-Time Slowdown (2:13.03 ~ 2:30.76, 88 BPM, 6.5 bars)
# - Total Duration: 150.76s (~2:30)
# ==============================================================================

import math
import struct
import wave
import random
import os
import shutil
import time

t_start = time.time()

SAMPLE_RATE = 44100

# ------------------------------------------------------------------------------
# 4 DYNAMIC TEMPO PHASES
# ------------------------------------------------------------------------------
PHASES = [
    {'name': 'Phase 1: Slow Funky Countdown',   'bpm': 103.0, 'bars': 12,  'swing': 0.54},
    {'name': 'Phase 2: It\'s Pizza Time! Sprint', 'bpm': 150.0, 'bars': 36,  'swing': 0.53},
    {'name': 'Phase 3: Lap 2 Hyper Panic!',      'bpm': 182.0, 'bars': 36,  'swing': 0.51},
    {'name': 'Phase 4: Big-Band Slowdown',       'bpm': 88.0,  'bars': 6.5, 'swing': 0.50},
]

print("=== Composing Pizza Time Style Escape Track (0:00 Arpeggio Theme) ===")

phase_info = []
accum_samples = 0

for p_idx, p in enumerate(PHASES):
    bpm = p['bpm']
    bars = p['bars']
    swing = p['swing']
    steps = int(bars * 16)
    sec_per_beat = 60.0 / bpm
    even_dur = (sec_per_beat / 4.0) * (swing * 2.0)
    odd_dur  = (sec_per_beat / 4.0) * ((1.0 - swing) * 2.0)
    
    step_samples = [0] * (steps + 1)
    acc_t = 0.0
    for s in range(steps):
        step_samples[s] = accum_samples + int(acc_t * SAMPLE_RATE)
        dur = even_dur if (s % 2 == 0) else odd_dur
        acc_t += dur
    step_samples[steps] = accum_samples + int(acc_t * SAMPLE_RATE)
    
    p_len = step_samples[steps] - accum_samples
    phase_info.append({
        'name': p['name'],
        'bpm': bpm,
        'bars': bars,
        'steps': steps,
        'start_sample': accum_samples,
        'end_sample': step_samples[steps],
        'step_samples': step_samples,
        'dur_sec': p_len / float(SAMPLE_RATE)
    })
    print(f"[{p['name']}] BPM: {bpm} | Bars: {bars} | Duration: {p_len/float(SAMPLE_RATE):.2f}s | Start: {accum_samples/float(SAMPLE_RATE):.2f}s")
    accum_samples = step_samples[steps]

TOTAL_SAMPLES = accum_samples
print(f"Total Composition Duration: {TOTAL_SAMPLES / SAMPLE_RATE:.2f}s ({TOTAL_SAMPLES} samples)")

left_buf = [0.0] * TOTAL_SAMPLES
right_buf = [0.0] * TOTAL_SAMPLES

# ------------------------------------------------------------------------------
# 1. LOAD WARIO LAND 4 SOUNDFONT SAMPLES
# ------------------------------------------------------------------------------
print("Loading soundfont samples...")

def load_wav_sample(path):
    with wave.open(path, 'rb') as w:
        frames = w.readframes(w.getnframes())
        raw = struct.unpack(f'<{len(frames)//2}h', frames)
        sr = w.getframerate()
        return [s / 32768.0 for s in raw], sr

wl4_samples_cfg = {
    'deow_bass':  ('wl4_samples/deow_bass.wav',  60, 0, 0),
    'boss_bass':  ('wl4_samples/boss_bass.wav',  60, 0, 0),
    'hurry_lead': ('wl4_samples/hurry_lead.wav', 76, 638, 4091),
    'brass':      ('wl4_samples/brass.wav',      60, 0, 0),
    'toxic_gtr':  ('wl4_samples/toxic_gtr.wav',  60, 0, 0),
    'fiery_gtr':  ('wl4_samples/fiery_gtr.wav',  60, 0, 0),
    'hurry_ep':   ('wl4_samples/hurry_ep.wav',   60, 0, 0),
    'boss_gate':  ('wl4_samples/boss_gate.wav',  60, 0, 0),
    'strings':    ('wl4_samples/strings.wav',    60, 0, 0),
    'chant':      ('wl4_samples/chant.wav',      72, 0, 0),
    'clock_tick': ('wl4_samples/clock_tick.wav', 72, 0, 0),
    'kick':       ('wl4_samples/kick.wav',       36, 0, 0),
    'snare':      ('wl4_samples/snare.wav',      38, 0, 0),
    'snare_rim':  ('wl4_samples/snare_rim.wav',  37, 0, 0),
    'clap':       ('wl4_samples/clap.wav',       39, 0, 0),
    'crash':      ('wl4_samples/crash.wav',      49, 0, 0),
    'shaker':     ('wl4_samples/shaker.wav',     42, 0, 0),
    'bongo_hi':   ('wl4_samples/bongo_hi.wav',   60, 0, 0),
    'bongo_lo':   ('wl4_samples/bongo_lo.wav',   53, 0, 0),
    'agogo_hi':   ('wl4_samples/agogo_hi.wav',   67, 0, 0),
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

print("Samples loaded successfully.")

# ------------------------------------------------------------------------------
# 2. NOTE RESAMPLER & RENDER ENGINE
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

def render_sample_at(sample_name, start_idx, midi_pitch=None, dur_samples=None, vol=1.0, pan=0.0,
                     attack_ms=2.0, release_ms=25.0, decay_rate=0.0):
    s_info = sample_data[sample_name]
    raw = s_info['data']
    root = s_info['root_pitch']
    s_sr = s_info['sr']
    l_start = s_info['loop_start']
    l_end = s_info['loop_end']
    s_len = s_info['len']

    if midi_pitch is None:
        midi_pitch = root
    elif isinstance(midi_pitch, str):
        midi_pitch = note_to_midi(midi_pitch)
    if midi_pitch is None: return

    step_size = (2.0 ** ((midi_pitch - root) / 12.0)) * (s_sr / float(SAMPLE_RATE))
    gain_l, gain_r = pan_gains(pan)
    gain_l *= vol
    gain_r *= vol

    has_loop = (l_end > l_start and l_end <= s_len)
    
    if dur_samples is None:
        if has_loop:
            dur_samples = int(0.5 * SAMPLE_RATE)
        else:
            dur_samples = int((s_len / step_size))

    att_samples = max(1, int((attack_ms / 1000.0) * SAMPLE_RATE))
    rel_samples = int((release_ms / 1000.0) * SAMPLE_RATE)
    total_samples = dur_samples + rel_samples

    pos = 0.0
    for i in range(total_samples):
        target_idx = start_idx + i
        if target_idx >= TOTAL_SAMPLES: break

        idx = int(pos)
        if has_loop and idx >= l_end:
            loop_len = l_end - l_start
            idx = l_start + ((idx - l_start) % loop_len)
            pos = idx + (pos - int(pos))

        if idx + 1 >= s_len:
            if not has_loop: break
            idx = l_start

        frac = pos - idx
        val = raw[idx] * (1.0 - frac) + raw[min(idx + 1, s_len - 1)] * frac

        env = 1.0
        if i < att_samples:
            env = i / float(att_samples)
        elif i >= dur_samples:
            env = max(0.0, 1.0 - (i - dur_samples) / float(rel_samples))

        if decay_rate > 0.0:
            env *= math.exp(-decay_rate * (i / float(SAMPLE_RATE)))

        left_buf[target_idx]  += val * gain_l * env
        right_buf[target_idx] += val * gain_r * env

        pos += step_size

def play_phase_note(phase_idx, inst_name, note_val, start_step, step_len=1.0, vol=1.0, pan=0.0,
                    attack_ms=3.0, release_ms=25.0, decay_rate=0.0):
    p = phase_info[phase_idx]
    if start_step >= p['steps']: return
    start_idx = p['step_samples'][int(start_step)]
    end_s = min(start_step + step_len, p['steps'])
    base_end_idx = p['step_samples'][int(end_s)]
    if end_s > int(end_s):
        frac = end_s - int(end_s)
        next_s = min(int(end_s) + 1, p['steps'])
        base_end_idx += int(frac * (p['step_samples'][next_s] - p['step_samples'][int(end_s)]))
    dur_samples = base_end_idx - start_idx
    render_sample_at(inst_name, start_idx, midi_pitch=note_val, dur_samples=dur_samples, vol=vol, pan=pan,
                     attack_ms=attack_ms, release_ms=release_ms, decay_rate=decay_rate)

def play_phase_drum(phase_idx, drum_name, start_step, vol=1.0, pan=0.0, pitch_shift=0):
    p = phase_info[phase_idx]
    if start_step >= p['steps']: return
    start_idx = p['step_samples'][int(start_step)]
    root = sample_data[drum_name]['root_pitch']
    render_sample_at(drum_name, start_idx, midi_pitch=root + pitch_shift, vol=vol, pan=pan)

def play_phase_chant(phase_idx, start_step, vol=0.8, pan=-0.2):
    play_phase_note(phase_idx, 'chant', 'E5', start_step, step_len=3.0, vol=vol, pan=pan, release_ms=40.0)

# ------------------------------------------------------------------------------
# 3. CONTINUOUS CLOCK TICKING ACROSS ALL 150 SECONDS
# ------------------------------------------------------------------------------
print("Applying CONTINUOUS clock ticking across the entire 150 seconds...")

for p_idx, p in enumerate(phase_info):
    steps = p['steps']
    for s in range(0, steps, 2):
        start_samp = p['step_samples'][s]
        is_tick = ((s // 2) % 2 == 0)
        pitch = 75 if is_tick else 69
        pan = -0.15 if is_tick else 0.15
        
        vol = 0.85
        if p_idx == 0:   vol = 0.90
        elif p_idx == 1: vol = 0.76
        elif p_idx == 2: vol = 0.82
        elif p_idx == 3: vol = 0.95

        render_sample_at('clock_tick', start_samp, midi_pitch=pitch, vol=vol, pan=pan)

print("Continuous clock ticking applied from 0:00 to 2:30!")

# ------------------------------------------------------------------------------
# 4. TUTORIAL 0:00 ELECTRIC PIANO ARPEGGIO THEME BUILDER
# The exact, iconic arpeggio from 0:00 of compose_sm64_tutorial.py:
# Bar 0: C4 - E4 - G4 - B4 - C5 - G4 - E4 - C4 (Cmaj7)
# Bar 1: F3 - C4 - E4 - A4 - C5 - A4 - E4 - C4 (Fmaj7)
# Bar 2: G3 - D4 - F4 - B4 - D5 - B4 - F4 - D4 (G7)
# Bar 3: C4 - G4 - C5 - E5 - G5 (C Resolution)
# ------------------------------------------------------------------------------
def make_000_arpeggio(octave=4, mode='classic'):
    o = octave
    o_h = octave + 1
    if mode == 'classic':
        return [
            # Bar 0: Cmaj7 arpeggio
            (0*16 + 0, f'C{o}', 1.8), (0*16 + 2, f'E{o}', 1.8), (0*16 + 4, f'G{o}', 1.8), (0*16 + 6, f'B{o}', 1.8),
            (0*16 + 8, f'C{o_h}', 1.8), (0*16 + 10, f'G{o}', 1.8), (0*16 + 12, f'E{o}', 1.8), (0*16 + 14, f'C{o}', 1.8),
            # Bar 1: Fmaj7 arpeggio
            (1*16 + 0, f'F{o-1}', 1.8), (1*16 + 2, f'C{o}', 1.8), (1*16 + 4, f'E{o}', 1.8), (1*16 + 6, f'A{o}', 1.8),
            (1*16 + 8, f'C{o_h}', 1.8), (1*16 + 10, f'A{o}', 1.8), (1*16 + 12, f'E{o}', 1.8), (1*16 + 14, f'C{o}', 1.8),
            # Bar 2: G7 arpeggio
            (2*16 + 0, f'G{o-1}', 1.8), (2*16 + 2, f'D{o}', 1.8), (2*16 + 4, f'F{o}', 1.8), (2*16 + 6, f'B{o}', 1.8),
            (2*16 + 8, f'D{o_h}', 1.8), (2*16 + 10, f'B{o}', 1.8), (2*16 + 12, f'F{o}', 1.8), (2*16 + 14, f'D{o}', 1.8),
            # Bar 3: C sustain arpeggio
            (3*16 + 0, f'C{o}', 1.8), (3*16 + 2, f'G{o}', 1.8), (3*16 + 4, f'C{o_h}', 1.8), (3*16 + 6, f'E{o_h}', 2.0),
            (3*16 + 8, f'G{o_h}', 3.5),
        ]
    else: # 'tension' mode (C -> Bb -> Ab -> G)
        return [
            # Bar 0: Cmaj7
            (0*16 + 0, f'C{o}', 1.8), (0*16 + 2, f'E{o}', 1.8), (0*16 + 4, f'G{o}', 1.8), (0*16 + 6, f'B{o}', 1.8),
            (0*16 + 8, f'C{o_h}', 1.8), (0*16 + 10, f'G{o}', 1.8), (0*16 + 12, f'E{o}', 1.8), (0*16 + 14, f'C{o}', 1.8),
            # Bar 1: Bb7
            (1*16 + 0, f'Bb{o-1}', 1.8), (1*16 + 2, f'D{o}', 1.8), (1*16 + 4, f'F{o}', 1.8), (1*16 + 6, f'Ab{o}', 1.8),
            (1*16 + 8, f'Bb{o}', 1.8), (1*16 + 10, f'F{o}', 1.8), (1*16 + 12, f'D{o}', 1.8), (1*16 + 14, f'Bb{o-1}', 1.8),
            # Bar 2: Abmaj7
            (2*16 + 0, f'Ab{o-1}', 1.8), (2*16 + 2, f'C{o}', 1.8), (2*16 + 4, f'Eb{o}', 1.8), (2*16 + 6, f'G{o}', 1.8),
            (2*16 + 8, f'Ab{o}', 1.8), (2*16 + 10, f'Eb{o}', 1.8), (2*16 + 12, f'C{o}', 1.8), (2*16 + 14, f'Ab{o-1}', 1.8),
            # Bar 3: G7
            (3*16 + 0, f'G{o-1}', 1.8), (3*16 + 2, f'D{o}', 1.8), (3*16 + 4, f'F{o}', 1.8), (3*16 + 6, f'B{o}', 1.8),
            (3*16 + 8, f'D{o_h}', 1.8), (3*16 + 10, f'B{o}', 1.8), (3*16 + 12, f'F{o}', 1.8), (3*16 + 14, f'D{o}', 1.8),
        ]

# Authentic Pizza Time slap bass patterns (Syncopated Funk with Octave Plucks):
deow_pizza_time = {
    'C':  [(0, 'C2', 1.2), (2, 'C3', 0.8), (3, 'C3', 0.7), (4, 'G2', 1.0), (6, 'C3', 0.8), (7, 'G2', 0.7),
           (8, 'C2', 1.2), (10, 'C3', 0.8), (11, 'Bb2', 0.7), (12, 'Bb2', 0.9), (14, 'B2', 0.8), (15, 'C2', 0.7)],
    'F':  [(0, 'F1', 1.2), (2, 'F2', 0.8), (3, 'F2', 0.7), (4, 'C2', 1.0), (6, 'F2', 0.8), (7, 'C2', 0.7),
           (8, 'F1', 1.2), (10, 'F2', 0.8), (11, 'Eb2', 0.7), (12, 'Eb2', 0.9), (14, 'E2', 0.8), (15, 'F1', 0.7)],
    'G':  [(0, 'G1', 1.2), (2, 'G2', 0.8), (3, 'G2', 0.7), (4, 'D2', 1.0), (6, 'G2', 0.8), (7, 'D2', 0.7),
           (8, 'G1', 1.2), (10, 'G2', 0.8), (11, 'F2', 0.7), (12, 'F2', 0.9), (14, 'F#2', 0.8), (15, 'G1', 0.7)],
    'Bb': [(0, 'Bb1', 1.2), (2, 'Bb2', 0.8), (3, 'Bb2', 0.7), (4, 'F2', 1.0), (6, 'Bb2', 0.8), (7, 'F2', 0.7),
           (8, 'Bb1', 1.2), (10, 'Bb2', 0.8), (11, 'Ab2', 0.7), (12, 'Ab2', 0.9), (14, 'A2', 0.8), (15, 'Bb1', 0.7)],
    'Ab': [(0, 'Ab1', 1.2), (2, 'Ab2', 0.8), (3, 'Ab2', 0.7), (4, 'Eb2', 1.0), (6, 'Ab2', 0.8), (7, 'Eb2', 0.7),
           (8, 'Ab1', 1.2), (10, 'Ab2', 0.8), (11, 'Gb2', 0.7), (12, 'Gb2', 0.9), (14, 'G2', 0.8), (15, 'Ab1', 0.7)],
}

# Funky Rhodes 9th/13th chord voicings (Pizza Time signature comping):
rhodes_funk_voicings = {
    'C':  ['E4', 'G4', 'B4', 'D5'],  # Cmaj9
    'F':  ['Eb4', 'G4', 'A4', 'C5'], # F9
    'G':  ['F4', 'A4', 'B4', 'E5'],  # G13
    'Bb': ['D4', 'F4', 'Ab4', 'C5'], # Bb9
    'Ab': ['C4', 'Eb4', 'G4', 'Bb4'],# Abmaj9
}

# ==============================================================================
# PHASE 1: SLOW FUNKY COUNTDOWN (103 BPM, 12 bars, 0:00 -> 0:27.96s)
# Atmospheric Pizza Time start: Ticking clock, Rhodes chords, bongo groove,
# 0:00 Arpeggio rising into a crisp big-band drum roll build!
# ==============================================================================
print("Composing Phase 1: Slow Funky Countdown (103 BPM)...")
p1_idx = 0

p1_chords = [
    'C', 'F', 'G', 'C',  # Bars 0-3: Rhodes 0:00 Arpeggio + Bongos & Ticking (0:00 ~ 0:09.3)
    'C', 'F', 'G', 'C',  # Bars 4-7: Deow Bass enters with Funky EP comping (0:09.3 ~ 0:18.6)
    'C', 'F', 'G', 'C',  # Bars 8-11: Brass + Lead Tutti Arpeggio Build (0:18.6 ~ 0:27.96)
]

for bar in range(12):
    b_step = bar * 16
    ch = p1_chords[bar]

    # --- Deow Bass Groove ---
    if 4 <= bar < 11:
        for off, bn, d in deow_pizza_time.get(ch, deow_pizza_time['C']):
            play_phase_note(p1_idx, 'deow_bass', bn, b_step + off, step_len=d, vol=0.95, pan=0.0, release_ms=12.0)
    elif bar == 11:
        # Bar 11 (0:25.6 ~ 0:27.96): Chromatic walk-up into 0:28 drop
        for off, bn, d in [(0, 'G1', 1.0), (4, 'G#1', 1.0), (8, 'A1', 1.0), (10, 'Bb1', 0.9), (12, 'B1', 0.9), (14, 'C2', 0.9)]:
            play_phase_note(p1_idx, 'deow_bass', bn, b_step + off, step_len=d, vol=1.05, pan=0.0, release_ms=12.0)

    # --- Funky Drums & Latin Percussion ---
    if bar < 4:
        # Light funky swing: Kick on 1 and 3, rimshot on 2 and 4, bongos
        play_phase_drum(p1_idx, 'kick', b_step + 0, vol=0.82, pan=0.0)
        play_phase_drum(p1_idx, 'kick', b_step + 8, vol=0.75, pan=0.0)
        if bar >= 2:
            play_phase_drum(p1_idx, 'snare_rim', b_step + 4, vol=0.70, pan=0.2)
            play_phase_drum(p1_idx, 'snare_rim', b_step + 12, vol=0.70, pan=0.2)
        play_phase_drum(p1_idx, 'bongo_hi', b_step + 2, vol=0.55, pan=-0.35)
        play_phase_drum(p1_idx, 'bongo_lo', b_step + 6, vol=0.60, pan=0.35)
        play_phase_drum(p1_idx, 'bongo_hi', b_step + 10, vol=0.55, pan=-0.35)
        play_phase_drum(p1_idx, 'bongo_lo', b_step + 14, vol=0.60, pan=0.35)
    elif bar < 11:
        # Full funk groove: Punchy kick, snappy snare + rim, continuous shaker, agogos
        play_phase_drum(p1_idx, 'kick', b_step + 0, vol=0.92, pan=0.0)
        play_phase_drum(p1_idx, 'kick', b_step + 6, vol=0.80, pan=0.0)
        play_phase_drum(p1_idx, 'snare', b_step + 4, vol=0.88, pan=-0.1)
        play_phase_drum(p1_idx, 'kick', b_step + 8, vol=0.88, pan=0.0)
        play_phase_drum(p1_idx, 'snare', b_step + 12, vol=0.88, pan=-0.1)
        play_phase_drum(p1_idx, 'snare_rim', b_step + 15, vol=0.50, pan=0.2) # ghost rim
        for s in range(0, 16, 2):
            play_phase_drum(p1_idx, 'shaker', b_step + s, vol=0.40, pan=0.3)
        play_phase_drum(p1_idx, 'bongo_hi', b_step + 2, vol=0.58, pan=-0.35)
        play_phase_drum(p1_idx, 'bongo_lo', b_step + 6, vol=0.62, pan=0.35)
        play_phase_drum(p1_idx, 'agogo_hi', b_step + 10, vol=0.55, pan=-0.25)
    else:
        # Bar 11: Big-band style drum roll fill leading right into 0:28 explosion!
        play_phase_drum(p1_idx, 'kick', b_step + 0, vol=0.95, pan=0.0)
        play_phase_drum(p1_idx, 'snare', b_step + 4, vol=0.85, pan=-0.1)
        play_phase_drum(p1_idx, 'kick', b_step + 8, vol=0.95, pan=0.0)
        for s in range(8, 16):
            play_phase_drum(p1_idx, 'snare', b_step + s, vol=0.72 + (s - 8) * 0.038, pan=-0.1)
        play_phase_drum(p1_idx, 'crash', b_step + 14, vol=0.75, pan=-0.2) # prep crash

    # --- Rhodes Funky Offbeat Comping ---
    if 4 <= bar < 11:
        for off in [2, 6, 10, 14]:
            for en in rhodes_funk_voicings.get(ch, rhodes_funk_voicings['C']):
                play_phase_note(p1_idx, 'hurry_ep', en, b_step + off, step_len=1.5, vol=0.50, pan=-0.25, release_ms=25.0, decay_rate=2.5)

    # --- Warm String Bed ---
    if 8 <= bar < 11:
        str_notes = {'C': ['E4', 'G4', 'C5'], 'F': ['C4', 'F4', 'A4'], 'G': ['D4', 'G4', 'B4']}
        for sn in str_notes.get(ch, ['E4', 'G4', 'C5']):
            play_phase_note(p1_idx, 'strings', sn, b_step + 0, step_len=14.0, vol=0.45, pan=0.3, release_ms=50.0)

# Bars 0 - 3: The EXACT 0:00 Electric Piano Arpeggio!
for s, n, d in make_000_arpeggio(octave=4, mode='classic'):
    play_phase_note(p1_idx, 'hurry_ep', n, 0 * 16 + s, step_len=d, vol=0.75, pan=-0.2, release_ms=25.0, decay_rate=2.0)

# Bars 4 - 7: 0:00 Arpeggio on Hurry Lead synth + Rhodes in sweet harmony!
for s, n, d in make_000_arpeggio(octave=5, mode='classic'):
    play_phase_note(p1_idx, 'hurry_lead', n, 4 * 16 + s, step_len=d, vol=0.88, pan=0.2, release_ms=25.0)
    play_phase_note(p1_idx, 'hurry_ep', n, 4 * 16 + s, step_len=d, vol=0.60, pan=-0.2, release_ms=25.0, decay_rate=2.0)

# Bars 8 - 11: 0:00 Arpeggio TUTTI (Hurry Lead + Brass + Fiery Guitar)!
for s, n, d in make_000_arpeggio(octave=5, mode='classic'):
    play_phase_note(p1_idx, 'hurry_lead', n, 8 * 16 + s, step_len=d, vol=0.92, pan=0.2, release_ms=25.0)
    play_phase_note(p1_idx, 'brass', n, 8 * 16 + s, step_len=d, vol=0.85, pan=-0.2, release_ms=25.0)
    play_phase_note(p1_idx, 'fiery_gtr', n, 8 * 16 + s, step_len=d, vol=0.75, pan=0.35, release_ms=25.0)


# ==============================================================================
# PHASE 2: "IT'S PIZZA TIME!" FAST ESCAPE SPRINT (150 BPM, 36 bars, 0:28 -> 1:25.56s)
# High-octane funk breakbeat, punchy slap bass, funky Rhodes 9th chords,
# big-band brass punches, and the 0:00 arpeggio melody driving the escape!
# ==============================================================================
print("Composing Phase 2: It's Pizza Time! Sprint (150 BPM)...")
p2_idx = 1

# Instant explosive downbeat at 0:28 (Crash + Brass Punch! NO DAOW, NO SIREN!)
play_phase_drum(p2_idx, 'crash', 0, vol=1.0, pan=-0.2)
play_phase_note(p2_idx, 'brass', 'C5', 0, step_len=4.0, vol=0.90, pan=-0.2, release_ms=35.0)

p2_chords = [
    # Bars 0 - 7 (Pizza Time Funk Progression: C -> Bb -> Ab -> G)
    'C', 'Bb', 'Ab', 'G',  'C', 'Bb', 'Ab', 'G',
    # Bars 8 - 15 (Classic Progression: C -> F -> G -> C)
    'C', 'F',  'G',  'C',  'C', 'F',  'G',  'C',
    # Bars 16 - 23 (Tension Build: C -> Bb -> Ab -> G with Rock Guitar)
    'C', 'Bb', 'Ab', 'G',  'C', 'Bb', 'Ab', 'G',
    # Bars 24 - 35 (Grand Tutti Climax of Phase 2)
    'C', 'F',  'G',  'C',  'C', 'Bb', 'Ab', 'G',
    'Ab', 'Bb', 'C', 'G'
]

for bar in range(36):
    b_step = bar * 16
    ch = p2_chords[bar]
    is_fill = (bar % 8 == 7) or (bar == 35)

    # --- Pure "It's Pizza Time!" Breakbeat Drum Engine (150 BPM) ---
    play_phase_drum(p2_idx, 'kick', b_step + 0, vol=1.0, pan=0.0)
    play_phase_drum(p2_idx, 'kick', b_step + 3, vol=0.85, pan=0.0)
    play_phase_drum(p2_idx, 'kick', b_step + 6, vol=0.88, pan=0.0)
    play_phase_drum(p2_idx, 'kick', b_step + 8, vol=0.95, pan=0.0)
    play_phase_drum(p2_idx, 'kick', b_step + 10, vol=0.85, pan=0.0)
    play_phase_drum(p2_idx, 'kick', b_step + 14, vol=0.82, pan=0.0)

    # Snappy acoustic snare on 2 and 4 + Layered handclap
    play_phase_drum(p2_idx, 'snare', b_step + 4, vol=0.98, pan=-0.1)
    play_phase_drum(p2_idx, 'clap', b_step + 4, vol=0.75, pan=0.1)
    play_phase_drum(p2_idx, 'snare', b_step + 12, vol=1.00, pan=-0.1)
    play_phase_drum(p2_idx, 'clap', b_step + 12, vol=0.78, pan=0.1)

    # Funk ghost snares:
    play_phase_drum(p2_idx, 'snare', b_step + 7, vol=0.58, pan=-0.1)
    play_phase_drum(p2_idx, 'snare', b_step + 11, vol=0.60, pan=-0.1)
    play_phase_drum(p2_idx, 'snare', b_step + 15, vol=0.62, pan=-0.1)

    # Continuous sizzle shaker:
    for s in range(16):
        play_phase_drum(p2_idx, 'shaker', b_step + s, vol=0.48 if s % 4 == 2 else 0.32, pan=0.4)

    # Latin funk percussion (Bongos & Agogos):
    play_phase_drum(p2_idx, 'bongo_hi', b_step + 2, vol=0.65, pan=-0.35)
    play_phase_drum(p2_idx, 'bongo_lo', b_step + 6, vol=0.70, pan=0.35)
    play_phase_drum(p2_idx, 'agogo_hi', b_step + 10, vol=0.60, pan=-0.3)

    # Crash cymbals on section entrances:
    if bar in [0, 8, 16, 24]:
        play_phase_drum(p2_idx, 'crash', b_step + 0, vol=0.92, pan=-0.2)

    # Snare fill bars:
    if is_fill:
        for s in range(8, 16):
            play_phase_drum(p2_idx, 'snare', b_step + s, vol=0.82 + (s - 8) * 0.03, pan=-0.1)
        play_phase_drum(p2_idx, 'crash', b_step + 12, vol=0.85, pan=0.2)

    # --- PUNCHY & LOUD DEOW BASS SLAP (vol=1.12) ---
    for off, bn, d in deow_pizza_time.get(ch, deow_pizza_time['C']):
        play_phase_note(p2_idx, 'deow_bass', bn, b_step + off, step_len=d, vol=1.12, pan=0.0, attack_ms=1.0, release_ms=12.0)

    # --- Funky Rhodes 9th/13th Stabs on Offbeats (Pizza Time style) ---
    for off in [2, 6, 10, 14]:
        for en in rhodes_funk_voicings.get(ch, rhodes_funk_voicings['C']):
            play_phase_note(p2_idx, 'hurry_ep', en, b_step + off, step_len=1.5, vol=0.52, pan=-0.25, release_ms=25.0, decay_rate=2.5)

    # --- Big-Band Brass Section Accents (Stabs on beat 1 and syncopations) ---
    if bar % 4 == 0:
        play_phase_note(p2_idx, 'brass', 'C5', b_step + 0, step_len=2.5, vol=0.82, pan=-0.2, release_ms=25.0)
    elif bar % 4 == 2:
        play_phase_note(p2_idx, 'brass', 'G5', b_step + 6, step_len=2.5, vol=0.82, pan=-0.2, release_ms=25.0)

    # --- Rock Guitar Chugging on Bars 16 - 35 ---
    if bar >= 16:
        root_map = {'C': 'C3', 'Bb': 'Bb2', 'Ab': 'Ab2', 'G': 'G2', 'F': 'F2'}
        fifth_map = {'C': 'G3', 'Bb': 'F3', 'Ab': 'Eb3', 'G': 'D3', 'F': 'C3'}
        rn = root_map.get(ch, 'C3')
        fn = fifth_map.get(ch, 'G3')
        for b_off in [0, 6, 8, 14]:
            play_phase_note(p2_idx, 'toxic_gtr', rn, b_step + b_off, step_len=1.8, vol=0.72, pan=-0.45, release_ms=25.0)
            play_phase_note(p2_idx, 'toxic_gtr', fn, b_step + b_off, step_len=1.8, vol=0.72, pan=-0.45, release_ms=25.0)

# --- LEAD MELODY ACROSS PHASE 2 (0:00 Arpeggio in Pizza Time Swagger) ---
# Bars 0 - 7 (0:28 ~ 0:39): Fast 0:00 Arpeggio bursts in on Hurry Lead with slap groove!
for s, n, d in make_000_arpeggio(octave=5, mode='tension'):
    play_phase_note(p2_idx, 'hurry_lead', n, 0 * 16 + s, step_len=d, vol=0.94, pan=0.2, release_ms=20.0)
for s, n, d in make_000_arpeggio(octave=5, mode='tension'):
    play_phase_note(p2_idx, 'hurry_lead', n, 4 * 16 + s, step_len=d, vol=0.94, pan=0.2, release_ms=20.0)

# Bars 8 - 15 (0:39 ~ 0:50): Big-Band Brass + Lead Octaves playing 0:00 Arpeggio!
for s, n, d in make_000_arpeggio(octave=5, mode='classic'):
    play_phase_note(p2_idx, 'brass', n, 8 * 16 + s, step_len=d, vol=0.92, pan=-0.2, release_ms=25.0)
    play_phase_note(p2_idx, 'hurry_lead', n, 8 * 16 + s, step_len=d, vol=0.90, pan=0.2, release_ms=20.0)
for s, n, d in make_000_arpeggio(octave=5, mode='classic'):
    play_phase_note(p2_idx, 'brass', n, 12 * 16 + s, step_len=d, vol=0.92, pan=-0.2, release_ms=25.0)
    play_phase_note(p2_idx, 'hurry_lead', n, 12 * 16 + s, step_len=d, vol=0.90, pan=0.2, release_ms=20.0)

# Bars 16 - 23 (0:50 ~ 1:01): High Screaming Octave 6 0:00 Arpeggio + Rock Guitar!
for s, n, d in make_000_arpeggio(octave=6, mode='tension'):
    play_phase_note(p2_idx, 'brass', n, 16 * 16 + s, step_len=d, vol=0.90, pan=-0.2, release_ms=25.0)
    play_phase_note(p2_idx, 'hurry_lead', n, 16 * 16 + s, step_len=d, vol=0.90, pan=0.2, release_ms=20.0)
for s, n, d in make_000_arpeggio(octave=6, mode='tension'):
    play_phase_note(p2_idx, 'brass', n, 20 * 16 + s, step_len=d, vol=0.90, pan=-0.2, release_ms=25.0)
    play_phase_note(p2_idx, 'hurry_lead', n, 20 * 16 + s, step_len=d, vol=0.90, pan=0.2, release_ms=20.0)

# Bars 24 - 35 (1:01 ~ 1:25.56): Full Grand Tutti Climax (Brass, Guitars, Lead, Rhodes)!
for s, n, d in make_000_arpeggio(octave=5, mode='classic'):
    play_phase_note(p2_idx, 'brass', n, 24 * 16 + s, step_len=d, vol=0.96, pan=-0.2, release_ms=25.0)
    play_phase_note(p2_idx, 'hurry_lead', n, 24 * 16 + s, step_len=d, vol=0.94, pan=0.2, release_ms=20.0)
    play_phase_note(p2_idx, 'fiery_gtr', n, 24 * 16 + s, step_len=d, vol=0.85, pan=0.4, release_ms=25.0)
for s, n, d in make_000_arpeggio(octave=5, mode='tension'):
    play_phase_note(p2_idx, 'brass', n, 28 * 16 + s, step_len=d, vol=0.96, pan=-0.2, release_ms=25.0)
    play_phase_note(p2_idx, 'hurry_lead', n, 28 * 16 + s, step_len=d, vol=0.94, pan=0.2, release_ms=20.0)
    play_phase_note(p2_idx, 'fiery_gtr', n, 28 * 16 + s, step_len=d, vol=0.85, pan=0.4, release_ms=25.0)


# ==============================================================================
# PHASE 3: "LAP 2" HYPER PANIC SPRINT! (182 BPM, 36 bars, 1:25.56 -> 2:13.03s)
# Thrash-funk double-time drums, hyper slap bass, screaming big-band brass,
# and high-speed 0:00 arpeggio cascades (NO SIRENS, NO DAOW!)
# ==============================================================================
print("Composing Phase 3: Lap 2 Hyper Panic! (182 BPM)...")
p3_idx = 2

play_phase_drum(p3_idx, 'crash', 0, vol=1.0, pan=-0.2)
play_phase_note(p3_idx, 'brass', 'C6', 0, step_len=4.0, vol=0.95, pan=-0.2, release_ms=30.0)

for bar in range(36):
    b_step = bar * 16
    ch = ['C', 'Bb', 'Ab', 'G', 'C', 'Bb', 'Ab', 'G'][bar % 8]
    
    # Double-time Pizza Time escape thrash drums:
    play_phase_drum(p3_idx, 'kick', b_step + 0, vol=1.0, pan=0.0)
    play_phase_drum(p3_idx, 'kick', b_step + 4, vol=0.90, pan=0.0)
    play_phase_drum(p3_idx, 'kick', b_step + 8, vol=1.0, pan=0.0)
    play_phase_drum(p3_idx, 'kick', b_step + 12, vol=0.90, pan=0.0)
    
    play_phase_drum(p3_idx, 'snare', b_step + 2, vol=0.94, pan=-0.1)
    play_phase_drum(p3_idx, 'clap', b_step + 2, vol=0.70, pan=0.1)
    play_phase_drum(p3_idx, 'snare', b_step + 6, vol=0.94, pan=-0.1)
    play_phase_drum(p3_idx, 'snare', b_step + 10, vol=1.00, pan=-0.1)
    play_phase_drum(p3_idx, 'clap', b_step + 10, vol=0.74, pan=0.1)
    play_phase_drum(p3_idx, 'snare', b_step + 14, vol=1.00, pan=-0.1)

    if bar % 2 == 0:
        play_phase_drum(p3_idx, 'crash', b_step + 0, vol=0.94, pan=-0.2)

    for s in range(16):
        play_phase_drum(p3_idx, 'shaker', b_step + s, vol=0.45, pan=0.35)

    # Machine-gun 16th-note Deow Bass hyper slap:
    r_note = {'C': 'C2', 'Bb': 'Bb1', 'Ab': 'Ab1', 'G': 'G1'}[ch]
    oct_note = {'C': 'C3', 'Bb': 'Bb2', 'Ab': 'Ab2', 'G': 'G2'}[ch]
    for s_sub in range(0, 16, 2):
        play_phase_note(p3_idx, 'deow_bass', r_note, b_step + s_sub, step_len=0.9, vol=1.05, pan=0.0, release_ms=10.0)
        play_phase_note(p3_idx, 'deow_bass', oct_note, b_step + s_sub + 1, step_len=0.8, vol=0.96, pan=0.0, release_ms=10.0)

    # Screaming Toxic Guitar power chords
    for beat in [0, 4, 8, 12]:
        play_phase_note(p3_idx, 'toxic_gtr', 'C3', b_step + beat, step_len=1.5, vol=0.75, pan=-0.45, release_ms=18.0)
        play_phase_note(p3_idx, 'toxic_gtr', 'G3', b_step + beat, step_len=1.5, vol=0.75, pan=-0.45, release_ms=18.0)

    # Gated synth arpeggio accents:
    for s_sub in range(16):
        deg = [0, 3, 6, 9, 12, 9, 6, 3][s_sub % 8]
        play_phase_note(p3_idx, 'boss_gate', 60 + deg, b_step + s_sub, step_len=0.9, vol=0.60, pan=-0.3 if s_sub % 2 == 0 else 0.3, release_ms=12.0)

# Lead melody across Phase 3 (Bars 0 - 23): Rapid 0:00 Arpeggio in High Brass + Lead!
for cycle in range(3):
    base_bar = cycle * 8
    octave = 5 if cycle < 2 else 6
    for s, n, d in make_000_arpeggio(octave=octave, mode='tension'):
        play_phase_note(p3_idx, 'hurry_lead', n, (base_bar + 0)*16 + s, step_len=d, vol=0.96, pan=0.2, release_ms=20.0)
        play_phase_note(p3_idx, 'brass', n, (base_bar + 0)*16 + s, step_len=d, vol=0.90, pan=-0.2, release_ms=20.0)
    for s, n, d in make_000_arpeggio(octave=octave, mode='tension'):
        play_phase_note(p3_idx, 'hurry_lead', n, (base_bar + 4)*16 + s, step_len=d, vol=0.98, pan=0.2, release_ms=20.0)
        play_phase_note(p3_idx, 'brass', n, (base_bar + 4)*16 + s, step_len=d, vol=0.92, pan=-0.2, release_ms=20.0)

# Bars 24 - 35: Grand Boiling Point Chromatic Ascension to high C7!
print("Phase 3 Climax: Massive chromatic tension build-up...")
climax_chromatic = [
    'C5', 'C#5', 'D5', 'D#5', 'E5', 'F5', 'F#5', 'G5',
    'G#5', 'A5', 'A#5', 'B5', 'C6', 'C#6', 'D6', 'D#6',
    'E6', 'F6', 'F#6', 'G6', 'G#6', 'A6', 'A#6', 'B6',
    'C7', 'C#7', 'D7', 'D#7', 'E7', 'F7', 'F#7', 'G7'
]
for idx, cn in enumerate(climax_chromatic):
    step_pos = 28 * 16 + (idx * 2)
    if step_pos < 36 * 16:
        play_phase_note(p3_idx, 'hurry_lead', cn, step_pos, step_len=1.5, vol=0.96, pan=0.25, release_ms=20.0)
        play_phase_note(p3_idx, 'brass', cn, step_pos, step_len=1.5, vol=0.92, pan=-0.25, release_ms=20.0)
        play_phase_note(p3_idx, 'fiery_gtr', cn, step_pos, step_len=1.5, vol=0.88, pan=0.4, release_ms=20.0)
        play_phase_drum(p3_idx, 'snare', step_pos, vol=0.72 + (idx / float(len(climax_chromatic))) * 0.28, pan=-0.1)


# ==============================================================================
# PHASE 4: BIG-BAND SLOWDOWN (88 BPM, 6.5 bars, 2:13.03s -> 2:30.76s)
# Massive half-time funk stomp, deep sub boss bass, heavy slap fills,
# majestic big-band brass playing 0:00 arpeggio, clean turnaround loop
# ==============================================================================
print("Composing Phase 4: Big-Band Half-Time Slowdown (88 BPM)...")
p4_idx = 3

play_phase_drum(p4_idx, 'crash', 0, vol=1.0, pan=0.0)
play_phase_note(p4_idx, 'brass', 'C5', 0, step_len=6.0, vol=0.95, pan=-0.2, release_ms=45.0)

p4_chords = ['C', 'F', 'G', 'C', 'C', 'C', 'C']

for bar in range(int(phase_info[p4_idx]['bars'])):
    b_step = bar * 16
    ch = p4_chords[min(bar, len(p4_chords)-1)]
    
    # Heavy half-time funk stomping drums:
    play_phase_drum(p4_idx, 'kick', b_step + 0, vol=1.0, pan=0.0)
    play_phase_drum(p4_idx, 'snare', b_step + 8, vol=0.98, pan=-0.1)
    play_phase_drum(p4_idx, 'clap', b_step + 8, vol=0.85, pan=0.1)

    # Sub Boss Bass + Fast-grooving Deow Bass:
    r_map = {'C': 'C1', 'F': 'F0', 'G': 'G0'}
    bn = r_map.get(ch, 'C1')
    oct_n = {'C': 'C2', 'F': 'F1', 'G': 'G1'}.get(ch, 'C2')
    play_phase_note(p4_idx, 'boss_bass', bn, b_step + 0, step_len=7.0, vol=1.0, pan=0.0, release_ms=60.0)
    play_phase_note(p4_idx, 'boss_bass', bn, b_step + 8, step_len=6.0, vol=0.95, pan=0.0, release_ms=60.0)
    
    for off, pn, d in [(0, bn, 1.2), (2, oct_n, 0.9), (3, oct_n, 0.8), (6, oct_n, 1.0), (8, bn, 1.2), (10, oct_n, 0.9), (11, oct_n, 0.8), (14, oct_n, 1.0)]:
        play_phase_note(p4_idx, 'deow_bass', pn, b_step + off, step_len=d, vol=0.98, pan=0.0, release_ms=12.0)

    # Colossal slow Brass & Guitar stabs:
    chord_voicing = {
        'C': ['E4', 'G4', 'C5', 'E5'],
        'F': ['C4', 'F4', 'A4', 'C5'],
        'G': ['D4', 'G4', 'B4', 'D5']
    }
    for vn in chord_voicing.get(ch, chord_voicing['C']):
        play_phase_note(p4_idx, 'brass', vn, b_step + 0, step_len=6.0, vol=0.88, pan=-0.2, release_ms=50.0)
        play_phase_note(p4_idx, 'toxic_gtr', vn, b_step + 0, step_len=6.0, vol=0.82, pan=-0.4, release_ms=50.0)
        play_phase_note(p4_idx, 'strings', vn, b_step + 0, step_len=14.0, vol=0.55, pan=0.3, release_ms=60.0)

# Slow, majestic 0:00 Arpeggio on Phase 4 (Bars 0 - 3):
for s, n, d in make_000_arpeggio(octave=4, mode='classic'):
    play_phase_note(p4_idx, 'hurry_lead', n, s, step_len=d * 1.5, vol=0.92, pan=0.2, release_ms=40.0)
    play_phase_note(p4_idx, 'brass', n, s, step_len=d * 1.5, vol=0.90, pan=-0.2, release_ms=40.0)
    play_phase_note(p4_idx, 'fiery_gtr', n, s, step_len=d * 1.5, vol=0.86, pan=0.35, release_ms=40.0)

# Final 2 bars of Phase 4 (Cadence & Turnaround Loop):
final_bar_step = 5 * 16
print("Final cadence & seamless loop resolution...")
for off, n in [
    (0, 'C6'), (2, 'B5'), (4, 'A5'), (6, 'G5'),
    (8, 'E5'), (10, 'D5'), (12, 'C5'), (14, 'G4')
]:
    play_phase_note(p4_idx, 'hurry_lead', n, final_bar_step + off, step_len=1.5, vol=0.88, pan=0.2, release_ms=25.0)
    play_phase_note(p4_idx, 'deow_bass', n, final_bar_step + off, step_len=1.5, vol=0.92, pan=0.0, release_ms=20.0)

bar6_step = 6 * 16
play_phase_drum(p4_idx, 'snare', bar6_step + 0, vol=0.88, pan=-0.1)
play_phase_drum(p4_idx, 'snare', bar6_step + 2, vol=0.92, pan=-0.1)
play_phase_drum(p4_idx, 'snare', bar6_step + 4, vol=0.96, pan=-0.1)
play_phase_drum(p4_idx, 'snare', bar6_step + 6, vol=1.00, pan=-0.1)
play_phase_drum(p4_idx, 'crash', bar6_step + 6, vol=0.90, pan=0.0)

print("All musical sections and continuous clock arranged!")

# ------------------------------------------------------------------------------
# 5. SPATIAL REVERB & DELAY SEND (GBA Stereo Space)
# ------------------------------------------------------------------------------
print("Applying GBA stereo spatial echo & delay...")
delay_samples = int(0.24 * SAMPLE_RATE)
delay_feedback = 0.20

for i in range(delay_samples, TOTAL_SAMPLES):
    left_buf[i]  += right_buf[i - delay_samples] * delay_feedback
    right_buf[i] += left_buf[i - delay_samples]  * (delay_feedback * 0.75)

# ------------------------------------------------------------------------------
# 6. NORMALIZATION & 16-BIT WAV EXPORT
# ------------------------------------------------------------------------------
print("Normalizing audio...")
peak = 0.0
for i in range(TOTAL_SAMPLES):
    al = abs(left_buf[i])
    ar = abs(right_buf[i])
    if al > peak: peak = al
    if ar > peak: peak = ar

print(f"Peak amplitude before normalization: {peak:.4f}")

norm_factor = 0.92 / peak if peak > 0.001 else 1.0

os.makedirs('music', exist_ok=True)
out_wav_path = 'music/mu_escape.wav'

print("Packing 16-bit PCM WAV data...")
out_pcm = bytearray(TOTAL_SAMPLES * 4)

for i in range(TOTAL_SAMPLES):
    l_val = max(-1.0, min(1.0, left_buf[i] * norm_factor))
    r_val = max(-1.0, min(1.0, right_buf[i] * norm_factor))
    
    l_int = int(l_val * 32767.0)
    r_int = int(r_val * 32767.0)
    
    struct.pack_into('<hh', out_pcm, i * 4, l_int, r_int)

with wave.open(out_wav_path, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SAMPLE_RATE)
    w.writeframes(out_pcm)

print(f"Exported: {out_wav_path} ({len(out_pcm)} bytes)")

for target_name in ['music/mu_pizzatime.wav', 'music/mu_breakingnews.wav']:
    shutil.copyfile(out_wav_path, target_name)
    print(f"Copied to: {target_name}")

t_elapsed = time.time() - t_start
print(f"=== Pizza Time Style Escape Track successfully generated in {t_elapsed:.2f}s ===")
