import math
import struct
import wave
import random
import os
import shutil

SAMPLE_RATE = 44100
BPM = 80.0
SECONDS_PER_BEAT = 60.0 / BPM  # 0.75s
BAR_DUR = 4.0 * SECONDS_PER_BEAT  # 3.0s
TOTAL_DUR = 7.5  # 2 bars of 3.0s + 1.5s ring-out tail
TOTAL_SAMPLES = int(TOTAL_DUR * SAMPLE_RATE)

print(f"=== Synthesizing Wario Land 4 boss_gate ===")
print(f"BPM: {BPM}, Total duration: {TOTAL_DUR}s ({TOTAL_SAMPLES} samples)")

# 1. Load WL4 Samples
def load_wav(path):
    with wave.open(path, 'rb') as w:
        sr = w.getframerate()
        frames = w.readframes(w.getnframes())
        raw = [s / 32768.0 for s in struct.unpack(f'<{len(frames)//2}h', frames)]
        return raw, sr

sample_configs = {
    'toxic_gtr': ('wl4_samples/toxic_gtr.wav', 59.3, 530, 1527),
    'fiery_gtr': ('wl4_samples/fiery_gtr.wav', 52.3, 498, 1098),
    'boss_bass': ('wl4_samples/boss_bass.wav', 36.0, 0, 0),
    'deow_bass': ('wl4_samples/deow_bass.wav', 60.0, 0, 0),
    'brass':     ('wl4_samples/brass.wav',     72.0, 0, 0),
    'kick':      ('wl4_samples/kick.wav',      36.0, 0, 0),
    'snare':     ('wl4_samples/snare.wav',     38.0, 0, 0),
    'crash':     ('wl4_samples/crash.wav',     49.0, 0, 0),
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

# Stereo buffers
left_buf = [0.0] * TOTAL_SAMPLES
right_buf = [0.0] * TOTAL_SAMPLES

def pan_gains(pan):
    angle = (pan + 1.0) * (math.pi / 4.0)
    return math.cos(angle), math.sin(angle)

def play_sample(inst_name, start_time_sec, midi_pitch=None, dur_sec=None, vol=1.0, pan=0.0,
                attack_ms=3.0, release_ms=30.0, decay_rate=0.0):
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
    if start_idx >= TOTAL_SAMPLES:
        return

    step_size = (2.0 ** ((midi_pitch - root) / 12.0)) * (s_sr / float(SAMPLE_RATE))
    has_loop = (le > ls and le <= s_len)

    if dur_sec is None:
        if has_loop:
            dur_sec = 0.5
        else:
            dur_sec = (s_len / step_size) / float(SAMPLE_RATE)

    dur_samples = int(dur_sec * SAMPLE_RATE)
    att_samples = max(1, int((attack_ms / 1000.0) * SAMPLE_RATE))
    rel_samples = int((release_ms / 1000.0) * SAMPLE_RATE)
    total_note_samples = dur_samples + rel_samples

    gain_l, gain_r = pan_gains(pan)
    gain_l *= vol
    gain_r *= vol

    pos = 0.0
    for i in range(total_note_samples):
        target_idx = start_idx + i
        if target_idx >= TOTAL_SAMPLES:
            break

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

        # Envelope
        if i < att_samples:
            env = i / float(att_samples)
        elif i < dur_samples:
            env = 1.0
        else:
            rel_i = i - dur_samples
            env = max(0.0, 1.0 - (rel_i / float(rel_samples)))

        if decay_rate > 0.0:
            env *= math.exp(-decay_rate * (i / float(SAMPLE_RATE)))

        left_buf[target_idx] += val * env * gain_l
        right_buf[target_idx] += val * env * gain_r
        pos += step_size

def play_drum(drum_name, start_time_sec, vol=1.0, pan=0.0):
    play_sample(drum_name, start_time_sec, midi_pitch=samples[drum_name]['root'], dur_sec=None,
                vol=vol, pan=pan, attack_ms=0.5, release_ms=10.0)

# Exact Scratch sequence definition for 1 bar (4.0 beats = 3.0 seconds at 80 BPM):
# (type, midi, duration_beats)
BAR_PHRASE = [
    # Beat 1 (0.0 to 1.0 beat)
    ('note', 50, 0.25),  # 0.00
    ('note', 50, 0.25),  # 0.25
    ('rest',  0, 0.25),  # 0.50
    ('note', 50, 0.25),  # 0.75
    # Beat 2 (1.0 to 2.0 beat)
    ('rest',  0, 0.50),  # 1.00
    ('note', 48, 0.25),  # 1.50
    ('rest',  0, 0.25),  # 1.75
    # Beat 3 (2.0 to 3.0 beat)
    ('note', 50, 0.25),  # 2.00
    ('note', 50, 0.25),  # 2.25
    ('rest',  0, 0.25),  # 2.50
    ('note', 53, 0.25),  # 2.75
    # Beat 4 (3.0 to 4.0 beat)
    ('rest',  0, 0.50),  # 3.00
    ('note', 55, 0.50),  # 3.50 (rings across the rest of the beat!)
]

# Helper to play full power chord + bass + brass for a note
def play_riff_hit(t_sec, midi_note, dur_sec, is_final=False):
    # Staccato / punchy duration for riff notes, or long sustain for final note
    play_dur = dur_sec if not is_final else (dur_sec + 1.2)
    rel_ms = 40.0 if not is_final else 120.0
    decay = 0.8 if not is_final else 0.5

    # 1. Toxic Guitar: Power chord (Root + 5th)
    root = midi_note
    fifth = midi_note + 7
    octave = midi_note + 12
    play_sample('toxic_gtr', t_sec, midi_pitch=root, dur_sec=play_dur, vol=0.85, pan=-0.35, release_ms=rel_ms, decay_rate=decay)
    play_sample('toxic_gtr', t_sec, midi_pitch=fifth, dur_sec=play_dur, vol=0.75, pan=-0.25, release_ms=rel_ms, decay_rate=decay)

    # 2. Fiery Guitar: Layered bite & punch
    play_sample('fiery_gtr', t_sec, midi_pitch=root, dur_sec=play_dur, vol=0.65, pan=0.35, release_ms=rel_ms, decay_rate=decay)
    play_sample('fiery_gtr', t_sec, midi_pitch=octave, dur_sec=play_dur * 0.8, vol=0.5, pan=0.25, release_ms=rel_ms, decay_rate=decay)

    # 3. WL4 Boss Bass: Heavy sub foundation (one octave lower)
    bass_note = midi_note - 12
    play_sample('boss_bass', t_sec, midi_pitch=bass_note, dur_sec=play_dur, vol=0.95, pan=0.0, release_ms=rel_ms * 1.5, decay_rate=0.4)
    # Deow bass for snappy initial slap transient
    play_sample('deow_bass', t_sec, midi_pitch=bass_note, dur_sec=min(0.2, play_dur), vol=0.7, pan=0.05, release_ms=25.0)

    # 4. WL4 Brass stabs: Accents on the syncopated hits
    if midi_note in [48, 53, 55]:
        play_sample('brass', t_sec, midi_pitch=midi_note + 12, dur_sec=min(0.35, play_dur), vol=0.7, pan=0.15, release_ms=30.0)
        play_sample('brass', t_sec, midi_pitch=midi_note, dur_sec=min(0.35, play_dur), vol=0.6, pan=-0.15, release_ms=30.0)

# Build the track across 2 bars (Part 1 and Part 2)
for bar_idx in range(2):
    bar_start_t = bar_idx * BAR_DUR
    cur_beat = 0.0

    # Drum crashes
    if bar_idx == 0:
        play_drum('crash', bar_start_t + 0.0, vol=0.85, pan=-0.2)
    elif bar_idx == 1:
        play_drum('crash', bar_start_t + 0.0, vol=0.75, pan=0.2)

    for item_idx, (kind, note, beats) in enumerate(BAR_PHRASE):
        note_t = bar_start_t + (cur_beat * SECONDS_PER_BEAT)
        dur_s = beats * SECONDS_PER_BEAT

        if kind == 'note':
            is_final = (bar_idx == 1 and item_idx == len(BAR_PHRASE) - 1)
            play_riff_hit(note_t, note, dur_s, is_final=is_final)

            # Punchy kick drum locking with every guitar note
            play_drum('kick', note_t, vol=1.0, pan=0.0)

            # Snare on resolution beats (C3, F3, and final G3)
            if note in [48, 53]:
                play_drum('snare', note_t, vol=0.9, pan=-0.1)
            elif note == 55:
                play_drum('snare', note_t, vol=1.1, pan=-0.05)
                # Final huge crash cymbal on the climax!
                if is_final:
                    play_drum('crash', note_t, vol=1.0, pan=0.0)

        cur_beat += beats

# Simple stereo reverb / delay echo for richness
echo_delay_samples = int(0.14 * SAMPLE_RATE)
echo_gain = 0.18
for i in range(TOTAL_SAMPLES - echo_delay_samples):
    left_buf[i + echo_delay_samples] += right_buf[i] * echo_gain
    right_buf[i + echo_delay_samples] += left_buf[i] * (echo_gain * 0.8)

# Mastering: Peak normalisation + warm soft clipping
max_peak = max(max(abs(x) for x in left_buf), max(abs(x) for x in right_buf), 0.001)
print(f"Mastering: peak level before compression = {max_peak:.3f}")
master_gain = 0.92 / max_peak

destinations = ['wl4_samples/boss_gate.wav', 'sound/boss_gate.wav']
for dest in destinations:
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    with wave.open(dest, 'wb') as wav:
        wav.setnchannels(2)
        wav.setsampwidth(2)
        wav.setframerate(SAMPLE_RATE)
        frames = bytearray()
        for i in range(TOTAL_SAMPLES):
            l = max(-0.99, min(0.99, math.tanh(left_buf[i] * master_gain * 1.05)))
            r = max(-0.99, min(0.99, math.tanh(right_buf[i] * master_gain * 1.05)))
            frames.extend(struct.pack('<hh', int(l * 32767.0), int(r * 32767.0)))
        wav.writeframes(frames)
    print(f"Rendered: {dest} ({TOTAL_DUR}s)")

print("=== Successfully generated Wario Land 4 boss_gate ===")
