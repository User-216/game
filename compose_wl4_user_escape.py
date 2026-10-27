import math
import struct
import wave
import random
import os
import shutil
import time
import sys

sys.stdout.reconfigure(encoding='utf-8')

t_start = time.time()

SAMPLE_RATE = 44100
BPM_BASE = 80.0
SECONDS_PER_BEAT = 60.0 / BPM_BASE  # 0.75s
PHRASE_DUR = 8 * SECONDS_PER_BEAT   # 6.0s (Block 1 + Block 2)
NUM_BASE_PHRASES = 35               # 35 * 6.0s = 210.0s base audio
BASE_TOTAL_SAMPLES = int(NUM_BASE_PHRASES * PHRASE_DUR * SAMPLE_RATE)

# ------------------------------------------------------------------------------
# FULL DRAMATIC SPEED & PITCH TIMELINE:
# Stage 1 (0.0s ~ 30.0s)   : 80.0 BPM normal tempo & original pitch (1.00x)
# Stage 2 (30.0s ~ 45.0s)  : Faster ramp to 113.1 BPM (1.414x) & +6.00 semitones
# Stage 3 (45.0s ~ 118.0s) : Steady fast drive (113.1 BPM, +6.00 semitones)
# Stage 4 (118.0s ~ 124.0s): 1:58 RAPID SURGE to 164.0 BPM (2.05x) & +12.43 semitones!
# Stage 5 (124.0s ~ 128.0s): Peak hyper speed blast at 164.0 BPM!
# Stage 6 (128.0s ~ 144.0s): 2:08 EVEN SLOWER DECELERATION down to 40 BPM (0.50x) & -12.00 semitones!
# Stage 7 (144.0s ~ 147.5s): 3.5 SECONDS COMPLETE SILENCE (no sound at all) before ending!
# ------------------------------------------------------------------------------
RAMP1_START_SEC = 30.0
RAMP1_END_SEC   = 45.0
V1_MAX          = 1.41421356  # +6.00 semitones, 113.1 BPM

RAMP2_START_SEC = 118.0  # Exactly 1:58!
RAMP2_PEAK_SEC  = 124.0  # Surges to 2.05x in 6 seconds!
V2_MAX          = 2.05   # +12.43 semitones, 164.0 BPM (Hyper Speed!)

SLOWDOWN_START_SEC = 128.0 # Exactly 2:08!
MUSIC_END_SEC      = 144.0 # Music ends at 2:24 (16s of dramatic slow-down)
V_SLOW             = 0.50  # Even slower! 40.0 BPM (0.50x) & -12.00 semitones (1 full octave drop)
SILENCE_SEC        = 3.5   # Complete silence (no sound) for 3.5 seconds
TARGET_TOTAL_DUR   = MUSIC_END_SEC + SILENCE_SEC # 147.5s (~2m 27.5s)

print(f"=== Composing Wario Land 4 Escape Track (2:08 Deep Deceleration & Ending Silence) ===")
print(f"Base Audio: {NUM_BASE_PHRASES * PHRASE_DUR:.1f}s | Sample Rate: {SAMPLE_RATE} Hz")

# ------------------------------------------------------------------------------
# 1. LOAD WARIO LAND 4 SAMPLES
# ------------------------------------------------------------------------------
def load_wav(path):
    with wave.open(path, 'rb') as w:
        sr = w.getframerate()
        frames = w.readframes(w.getnframes())
        raw = [s / 32768.0 for s in struct.unpack(f'<{len(frames)//2}h', frames)]
        return raw, sr

sample_configs = {
    'hurry_lead': ('wl4_samples/hurry_lead.wav', 76.3, 638, 4091),
    'toxic_gtr':  ('wl4_samples/toxic_gtr.wav',  59.3, 530, 1527),
    'fiery_gtr':  ('wl4_samples/fiery_gtr.wav',  52.3, 498, 1098),
    'boss_bass':  ('wl4_samples/boss_bass.wav',  36.0, 0, 0),
    'deow_bass':  ('wl4_samples/deow_bass.wav',  60.0, 0, 0),
    'hurry_ep':   ('wl4_samples/hurry_ep.wav',   60.0, 0, 0),
    'brass':      ('wl4_samples/brass.wav',      72.0, 0, 0),
    'chant':      ('wl4_samples/chant.wav',      72.0, 0, 0),
    'clock_tick': ('wl4_samples/clock_tick.wav', 72.0, 0, 0),
    'kick':       ('wl4_samples/kick.wav',       36.0, 0, 0),
    'snare':      ('wl4_samples/snare.wav',      38.0, 0, 0),
    'crash':      ('wl4_samples/crash.wav',      49.0, 0, 0),
    'shaker':     ('wl4_samples/shaker.wav',     42.0, 0, 0),
    'bongo_hi':   ('wl4_samples/bongo_hi.wav',   60.0, 0, 0),
    'bongo_lo':   ('wl4_samples/bongo_lo.wav',   53.0, 0, 0),
    'agogo_hi':   ('wl4_samples/agogo_hi.wav',   67.0, 0, 0),
    'agogo_lo':   ('wl4_samples/agogo_lo.wav',   60.0, 0, 0),
}

samples = {}
for name, (path, root, ls, le) in sample_configs.items():
    raw, sr = load_wav(path)
    samples[name] = {
        'data': raw,
        'sr': sr,
        'root': root,
        'ls': ls,
        'le': le,
        'len': len(raw)
    }

print("All WL4 samples loaded.")

# Allocate stereo mixing buffers for base audio
base_left = [0.0] * BASE_TOTAL_SAMPLES
base_right = [0.0] * BASE_TOTAL_SAMPLES

def pan_gains(pan):
    angle = (pan + 1.0) * (math.pi / 4.0)
    return math.cos(angle), math.sin(angle)

def play_sample(inst_name, start_time_sec, midi_pitch=None, dur_sec=None, vol=1.0, pan=0.0,
                attack_ms=3.0, release_ms=30.0, decay_rate=0.0, vib_depth=0.0, vib_rate=6.2, vib_delay_s=0.04):
    s_info = samples[inst_name]
    raw = s_info['data']
    root = s_info['root']
    s_sr = s_info['sr']
    ls = s_info['ls']
    le = s_info['le']
    s_len = s_info['len']

    if midi_pitch is None:
        midi_pitch = root

    start_idx = int(start_time_sec * SAMPLE_RATE)
    if start_idx >= BASE_TOTAL_SAMPLES:
        return

    has_loop = (le > ls and le <= s_len)
    base_step = (2.0 ** ((midi_pitch - root) / 12.0)) * (s_sr / float(SAMPLE_RATE))

    if dur_sec is None:
        if has_loop:
            dur_sec = 0.5
        else:
            dur_sec = (s_len / base_step) / float(SAMPLE_RATE)

    dur_samples = int(dur_sec * SAMPLE_RATE)
    att_samples = max(1, int((attack_ms / 1000.0) * SAMPLE_RATE))
    rel_samples = int((release_ms / 1000.0) * SAMPLE_RATE)
    total_samples_to_render = dur_samples + rel_samples

    gain_l, gain_r = pan_gains(pan)
    gain_l *= vol
    gain_r *= vol

    pos = 0.0
    for i in range(total_samples_to_render):
        target_idx = start_idx + i
        if target_idx >= BASE_TOTAL_SAMPLES:
            break

        t = i / float(SAMPLE_RATE)

        # Dynamic pitch with vibrato
        cur_pitch = midi_pitch
        if vib_depth > 0.0 and t > vib_delay_s:
            vib_mod = min(1.0, (t - vib_delay_s) * 3.5) * vib_depth
            cur_pitch += vib_mod * math.sin(2.0 * math.pi * vib_rate * t)

        step_size = (2.0 ** ((cur_pitch - root) / 12.0)) * (s_sr / float(SAMPLE_RATE))

        if has_loop:
            if pos >= le:
                pos = ls + ((pos - ls) % (le - ls))
            idx0 = int(pos)
            idx1 = idx0 + 1 if idx0 + 1 < s_len else ls
            frac = pos - idx0
            val = (1.0 - frac) * raw[idx0] + frac * raw[idx1]
        else:
            idx0 = int(pos)
            if idx0 >= s_len - 1:
                break
            frac = pos - idx0
            val = (1.0 - frac) * raw[idx0] + frac * raw[idx0 + 1]

        # ADSR Envelope
        if i < att_samples:
            env = i / float(att_samples)
        elif i < dur_samples:
            env = 1.0
        else:
            rel_i = i - dur_samples
            env = max(0.0, 1.0 - (rel_i / float(rel_samples)))

        if decay_rate > 0.0:
            env *= math.exp(-decay_rate * t)

        base_left[target_idx] += val * env * gain_l
        base_right[target_idx] += val * env * gain_r
        pos += step_size

def play_drum(drum_name, start_time_sec, vol=1.0, pan=0.0):
    play_sample(drum_name, start_time_sec, vol=vol, pan=pan, attack_ms=0.5, release_ms=10.0)

# ------------------------------------------------------------------------------
# 2. USER'S EXACT SCRATCH MELODY BLOCKS
# ------------------------------------------------------------------------------
SCRATCH_BLOCK1 = [
    (59, 0.25, False),  # B3
    (67, 0.25, False),  # G4
    (60, 0.25, False),  # C4
    (62, 0.25, False),  # D4
    (64, 0.25, False),  # E4
    (0,  0.25, False),  # rest
    (62, 0.25, False),  # D4
    (60, 0.25, False),  # C4
    (59, 0.25, False),  # B3
    (0,  0.50, False),  # rest
    (67, 0.55, True),   # G4 with rich Vibrato!
    (64, 0.20, False),  # E4
    (62, 0.20, False),  # D4
    (0,  0.05, False),  # rest
    (62, 0.20, True),   # D4 with Vibrato!
    (0,  0.05, False),  # rest
]

SCRATCH_BLOCK2 = [
    (59, 0.25, False),  # B3
    (67, 0.25, False),  # G4
    (60, 0.25, False),  # C4
    (62, 0.25, False),  # D4
    (64, 0.25, False),  # E4
    (0,  0.25, False),  # rest
    (62, 0.25, False),  # D4
    (60, 0.25, False),  # C4
    (59, 0.25, False),  # B3
    (0,  0.25, False),  # rest
    (60, 0.25, False),  # C4
    (0,  0.25, False),  # rest
    (62, 0.25, False),  # D4
    (0,  0.25, False),  # rest
    (64, 0.25, False),  # E4
    (64, 0.25, True),   # E4 with Vibrato!
]

CHORD_DATA = [
    # Block 1 (beats 0..3)
    (36, [48, 52, 55]),  # Beat 0: C2 / C3-E3-G3
    (40, [48, 52, 55]),  # Beat 1: E2 / C3-E3-G3
    (35, [47, 50, 55]),  # Beat 2: B1 / B2-D3-G3
    (38, [50, 54, 57]),  # Beat 3: D2 / D3-F#3-A3
    # Block 2 (beats 4..7)
    (36, [48, 52, 55]),  # Beat 4: C2 / C3-E3-G3
    (40, [48, 52, 55]),  # Beat 5: E2 / C3-E3-G3
    (38, [48, 52, 55]),  # Beat 6: D2 / C3-E3-G3 -> D
    (40, [47, 52, 55]),  # Beat 7: E2 / B2-E3-G3
]

# ------------------------------------------------------------------------------
# 3. RENDER 33 BASE PHRASES ACROSS 198 SECONDS
# ------------------------------------------------------------------------------
print("Arranging musical sections across 33 phrases...")

for p_idx in range(NUM_BASE_PHRASES):
    p_start = p_idx * PHRASE_DUR
    has_intro_clock = (p_idx == 0)
    has_lead = (p_idx >= 1)
    has_high_lead = (p_idx in [3, 4, 7, 8, 9, 11, 12, 14, 15, 18, 19, 21, 22] or p_idx in range(25, 29))
    has_brass_melody = (p_idx in [2, 3, 6, 8, 10, 11, 13, 14, 17, 18, 20, 21] or p_idx >= 25)
    has_guitar_riff = (p_idx >= 2)
    has_guitar_solo = (p_idx in [5, 6, 9, 10, 12, 13, 15, 16, 19, 20, 22, 23] or p_idx in range(25, 29))
    has_full_drums = (p_idx >= 1 and p_idx not in [16, 17])
    has_breakdown = (p_idx in [16, 17])
    has_perc = (p_idx in [2, 3, 4, 7, 8, 9, 11, 12, 14, 15, 18, 19, 21, 22] or p_idx >= 25)
    has_chant = (p_idx in [0, 4, 7, 8, 11, 15, 17, 20, 22, 25, 28, 30])

    # 1. Intro Clock & Chant
    if has_intro_clock:
        for tick in range(8):
            t_tick = p_start + tick * (SECONDS_PER_BEAT / 2.0)
            play_sample('clock_tick', t_tick, vol=0.8, pan=0.1)
        play_sample('chant', p_start + 4.5, vol=1.0, pan=0.0)
        play_drum('snare', p_start + 5.25, vol=0.8, pan=-0.1)
        play_drum('snare', p_start + 5.625, vol=0.9, pan=0.1)
        play_drum('snare', p_start + 5.8125, vol=1.0, pan=0.0)

    # 2. Vocal Chant on key moments (Phrase 25 = 1:58 surge, Phrase 28 = 2:08 slow down!)
    if has_chant and p_idx > 0:
        if p_idx == 25: # EXACT 1:58 TRANSITION!
            play_sample('chant', p_start + 0.0, vol=1.15, pan=0.0)
            play_sample('chant', p_start + 3.0, vol=1.0, pan=0.2)
        elif p_idx == 28: # EXACT 2:08 DECELERATION TRIGGER!
            play_sample('chant', p_start + 0.0, vol=1.1, pan=-0.1)
        else:
            play_sample('chant', p_start + 5.25, vol=0.95, pan=0.0)

    # 3. Crash Cymbals
    if p_idx in [1, 3, 5, 7, 8, 11, 14, 18, 21, 25, 28, 30, 32]:
        play_drum('crash', p_start + 0.0, vol=1.1 if p_idx in [25, 28] else 0.95, pan=-0.2)
    if p_idx in [4, 9, 12, 15, 20, 25, 27, 31]:
        play_drum('crash', p_start + 3.0, vol=0.9, pan=0.2)

    # 4. Drums & Percussion
    if has_full_drums:
        for b in range(8):
            t_beat = p_start + b * SECONDS_PER_BEAT
            play_drum('kick', t_beat + 0.0, vol=1.05, pan=0.0)
            if b % 2 == 1:
                play_drum('snare', t_beat + 0.0, vol=1.15, pan=-0.05)
            # 8th note hats/shakers
            play_drum('shaker', t_beat + 0.0, vol=0.55, pan=-0.3)
            play_drum('shaker', t_beat + SECONDS_PER_BEAT * 0.5, vol=0.65, pan=0.3)

            # Double-time kicks in hyper-speed section (p_idx 25..27)
            if b in [0, 2, 4, 6] or (25 <= p_idx <= 27):
                play_drum('kick', t_beat + SECONDS_PER_BEAT * 0.75, vol=0.85, pan=0.0)
            if (25 <= p_idx <= 27) and b % 2 == 0:
                play_drum('snare', t_beat + SECONDS_PER_BEAT * 0.5, vol=0.75, pan=0.1)

            # Percussion
            if has_perc:
                if b % 2 == 0:
                    play_sample('agogo_hi', t_beat + SECONDS_PER_BEAT * 0.25, vol=0.6, pan=0.35)
                    play_sample('bongo_hi', t_beat + SECONDS_PER_BEAT * 0.5, vol=0.55, pan=-0.35)
                else:
                    play_sample('agogo_lo', t_beat + SECONDS_PER_BEAT * 0.75, vol=0.6, pan=0.35)
                    play_sample('bongo_lo', t_beat + SECONDS_PER_BEAT * 0.25, vol=0.55, pan=-0.35)
    elif has_breakdown:
        for b in range(8):
            t_beat = p_start + b * SECONDS_PER_BEAT
            play_sample('clock_tick', t_beat + 0.0, vol=0.85, pan=-0.2)
            play_sample('clock_tick', t_beat + SECONDS_PER_BEAT * 0.5, vol=0.85, pan=0.2)
            if b >= 4:
                play_drum('snare', t_beat + 0.0, vol=0.6 + (b-4)*0.15, pan=0.0)
                play_drum('snare', t_beat + SECONDS_PER_BEAT * 0.5, vol=0.7 + (b-4)*0.15, pan=0.0)

    # 5. Bassline & Chords
    for b in range(8):
        t_beat = p_start + b * SECONDS_PER_BEAT
        bass_root, chord_notes = CHORD_DATA[b]

        if p_idx >= 1:
            play_sample('boss_bass', t_beat + 0.0, midi_pitch=bass_root, dur_sec=0.45, vol=0.85, pan=0.0, release_ms=40.0)
            play_sample('deow_bass', t_beat + 0.0, midi_pitch=bass_root, dur_sec=0.22, vol=0.8, pan=0.0, release_ms=25.0)
            if b in [0, 2, 4, 6] or (25 <= p_idx <= 27):
                play_sample('boss_bass', t_beat + SECONDS_PER_BEAT * 0.75, midi_pitch=bass_root, dur_sec=0.25, vol=0.75, pan=0.0, release_ms=30.0)

        if has_guitar_riff:
            for cn in chord_notes:
                play_sample('toxic_gtr', t_beat + 0.0, midi_pitch=cn, dur_sec=0.35, vol=0.65, pan=-0.4, release_ms=35.0, decay_rate=0.4)
                play_sample('hurry_ep', t_beat + 0.0, midi_pitch=cn, dur_sec=0.5, vol=0.5, pan=0.4, release_ms=50.0)

        if has_guitar_solo and b in [2, 6]:
            play_sample('fiery_gtr', t_beat + SECONDS_PER_BEAT * 0.5, midi_pitch=bass_root + 24, dur_sec=0.4, vol=0.75, pan=0.35, release_ms=35.0, decay_rate=0.3)

    # 6. MAIN MELODY (The User's Scratch Blocks!)
    if has_lead:
        cur_t = p_start
        for b_num, block in enumerate([SCRATCH_BLOCK1, SCRATCH_BLOCK2]):
            for note, beats, vib in block:
                dur_s = beats * SECONDS_PER_BEAT
                if note > 0:
                    v_depth = 0.45 if vib else 0.0

                    # Primary Lead: hurry_lead at user pitch (MIDI 59..67)
                    play_sample('hurry_lead', cur_t, midi_pitch=note, dur_sec=dur_s * 0.92,
                                vol=0.9, pan=0.1, attack_ms=3.0, release_ms=35.0,
                                vib_depth=v_depth, vib_rate=6.2)

                    # Octave higher lead for intensity in hyper speed section
                    if has_high_lead:
                        play_sample('hurry_lead', cur_t, midi_pitch=note + 12, dur_sec=dur_s * 0.9,
                                    vol=0.8, pan=0.2, attack_ms=3.0, release_ms=35.0,
                                    vib_depth=v_depth, vib_rate=6.8)

                    # Brass harmony
                    if has_brass_melody:
                        play_sample('brass', cur_t, midi_pitch=note, dur_sec=min(0.4, dur_s * 0.95),
                                    vol=0.72, pan=-0.2, attack_ms=5.0, release_ms=30.0)

                    # Fiery guitar doubling on vibrato notes
                    if vib and has_guitar_solo:
                        play_sample('fiery_gtr', cur_t, midi_pitch=note + 12, dur_sec=dur_s * 1.1,
                                    vol=0.8, pan=-0.3, release_ms=50.0, vib_depth=v_depth, vib_rate=6.8)

                cur_t += dur_s

# Stereo Delay on base mix
print("Applying stereo reverb / delay...")
delay_samp = int(0.13 * SAMPLE_RATE)
for i in range(BASE_TOTAL_SAMPLES - delay_samp):
    base_left[i + delay_samp] += base_right[i] * 0.16
    base_right[i + delay_samp] += base_left[i] * 0.14

# ------------------------------------------------------------------------------
# 4. SPEED & PITCH RAMP ENGINE (Includes 2:08 Deep Slow-Down & Ending Silence)
# ------------------------------------------------------------------------------
print("Applying speed & pitch timeline (30s ramp -> 50s steady -> 1:58 surge -> 2:08 DEEP SLOWDOWN -> SILENCE)...")

out_left = []
out_right = []

t_out = 0.0
t_orig = 0.0
dt = 1.0 / SAMPLE_RATE

# 1. Render active music with dynamic speed & pitch warping
while t_out < MUSIC_END_SEC and t_orig < BASE_TOTAL_SAMPLES - 4:
    if t_out < RAMP1_START_SEC:
        v = 1.0
    elif t_out < RAMP1_END_SEC:
        p = (t_out - RAMP1_START_SEC) / (RAMP1_END_SEC - RAMP1_START_SEC)
        v = 1.0 + p * (V1_MAX - 1.0)
    elif t_out < RAMP2_START_SEC:
        v = V1_MAX
    elif t_out < RAMP2_PEAK_SEC:
        p = (t_out - RAMP2_START_SEC) / (RAMP2_PEAK_SEC - RAMP2_START_SEC)
        v = V1_MAX + p * (V2_MAX - V1_MAX)
    elif t_out < SLOWDOWN_START_SEC:
        # Hold peak hyper speed (164 BPM) until 2:08 (128.0s)!
        v = V2_MAX
    else:
        # AT 2:08 (128.0s) AND BEYOND: EVEN SLOWER & DRAMATIC PITCH DROP DOWN TO 0.50x (-12 semitones)!
        p = min(1.0, (t_out - SLOWDOWN_START_SEC) / (MUSIC_END_SEC - SLOWDOWN_START_SEC))
        v = V2_MAX - p * (V2_MAX - V_SLOW)

    # 4-point Hermite cubic interpolation
    idx0 = int(t_orig)
    frac = t_orig - idx0

    # Left channel
    y0_l = base_left[idx0]
    y1_l = base_left[idx0 + 1]
    ym1_l = base_left[idx0 - 1] if idx0 > 0 else y0_l
    y2_l = base_left[idx0 + 2] if idx0 + 2 < BASE_TOTAL_SAMPLES else y1_l
    c0_l = y0_l
    c1_l = 0.5 * (y1_l - ym1_l)
    c2_l = ym1_l - 2.5 * y0_l + 2.0 * y1_l - 0.5 * y2_l
    c3_l = 0.5 * (y2_l - ym1_l) + 1.5 * (y0_l - y1_l)
    samp_l = ((c3_l * frac + c2_l) * frac + c1_l) * frac + c0_l

    # Right channel
    y0_r = base_right[idx0]
    y1_r = base_right[idx0 + 1]
    ym1_r = base_right[idx0 - 1] if idx0 > 0 else y0_r
    y2_r = base_right[idx0 + 2] if idx0 + 2 < BASE_TOTAL_SAMPLES else y1_r
    c0_r = y0_r
    c1_r = 0.5 * (y1_r - ym1_r)
    c2_r = ym1_r - 2.5 * y0_r + 2.0 * y1_r - 0.5 * y2_r
    c3_r = 0.5 * (y2_r - ym1_r) + 1.5 * (y0_r - y1_r)
    samp_r = ((c3_r * frac + c2_r) * frac + c1_r) * frac + c0_r

    # Smooth fade out in the last 0.8s before silence to prevent clicks
    FADE_OUT_DUR = 0.8
    if t_out > (MUSIC_END_SEC - FADE_OUT_DUR):
        fade_p = (MUSIC_END_SEC - t_out) / FADE_OUT_DUR
        fade_gain = 0.5 * (1.0 - math.cos(math.pi * fade_p))
        samp_l *= fade_gain
        samp_r *= fade_gain

    out_left.append(samp_l)
    out_right.append(samp_r)

    t_orig += v
    t_out += dt

music_render_dur = len(out_left) / SAMPLE_RATE
print(f"Music audio rendering complete: {music_render_dur:.2f}s.")

# 2. Append complete dead silence (0.0) for SILENCE_SEC
silence_samples = int(SILENCE_SEC * SAMPLE_RATE)
print(f"Appending {SILENCE_SEC:.1f}s ({silence_samples} samples) of absolute silence...")
out_left.extend([0.0] * silence_samples)
out_right.extend([0.0] * silence_samples)

FINAL_DURATION = len(out_left) / SAMPLE_RATE
FINAL_TOTAL_SAMPLES = len(out_left)

print(f"Timeline complete: Final Duration = {FINAL_DURATION:.2f}s ({int(FINAL_DURATION//60)}m {int(FINAL_DURATION%60)}s)")
print(f"Speed breakdown:")
print(f"  Stage 1: 0.0s ~ 30.0s: 80.0 BPM (1.00x) @ original pitch")
print(f"  Stage 2: 30.0s ~ 45.0s: FASTER ramp to {80.0 * V1_MAX:.1f} BPM ({V1_MAX:.3f}x) & {12.0*math.log2(V1_MAX):+.2f} semitones")
print(f"  Stage 3: 45.0s ~ 118.0s (1:58): Steady at {80.0 * V1_MAX:.1f} BPM")
print(f"  Stage 4: 1:58 ~ 2:04: RAPID SURGE to {80.0 * V2_MAX:.1f} BPM ({V2_MAX:.3f}x) & {12.0*math.log2(V2_MAX):+.2f} semitones!")
print(f"  Stage 5: 2:04 ~ 2:08: PEAK HYPER SPEED BLAST!")
print(f"  Stage 6: 2:08 ~ {int(MUSIC_END_SEC//60)}:{int(MUSIC_END_SEC%60):02d}: DEEP SLOWDOWN to {80.0 * V_SLOW:.1f} BPM ({V_SLOW:.2f}x) & {12.0*math.log2(V_SLOW):+.2f} semitones!")
print(f"  Stage 7: {int(MUSIC_END_SEC//60)}:{int(MUSIC_END_SEC%60):02d} ~ {int(FINAL_DURATION//60)}:{int(FINAL_DURATION%60):02d}: DEAD SILENCE (no sound) for {SILENCE_SEC:.1f}s before ending!")

# ------------------------------------------------------------------------------
# 5. MASTERING: NORMALIZATION & WARM LIMITING
# ------------------------------------------------------------------------------
max_val = max(max(abs(x) for x in out_left), max(abs(x) for x in out_right), 0.001)
print(f"Mastering: peak level before limiter = {max_val:.3f}")
gain = 0.93 / max_val

output_paths = [
    'music/mu_escape.wav',
    'music/mu_pizzatime.wav',
    'music/mu_breakingnews.wav'
]

for out_path in output_paths:
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with wave.open(out_path, 'wb') as wav:
        wav.setnchannels(2)
        wav.setsampwidth(2)
        wav.setframerate(SAMPLE_RATE)
        frames = bytearray()
        for i in range(FINAL_TOTAL_SAMPLES):
            l = max(-0.99, min(0.99, math.tanh(out_left[i] * gain * 1.06)))
            r = max(-0.99, min(0.99, math.tanh(out_right[i] * gain * 1.06)))
            frames.extend(struct.pack('<hh', int(l * 32767.0), int(r * 32767.0)))
        wav.writeframes(frames)
    file_mb = os.path.getsize(out_path) / (1024 * 1024)
    print(f"Successfully generated: {out_path} ({FINAL_DURATION:.1f}s, {file_mb:.2f} MB)")

print(f"=== Complete in {time.time() - t_start:.2f}s! ===")
