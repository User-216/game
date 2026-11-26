import wave
import struct
import math
import shutil
import os

src_path = r'C:\Users\user\.gemini\antigravity\brain\1423abf8-00af-42ad-bfee-df778a52c5bb\.user_uploaded\uploaded_media_1795688034805.wav'

with wave.open(src_path, 'rb') as w:
    n_in = w.getnframes()
    sr_in = w.getframerate()
    ch_in = w.getnchannels()
    raw = w.readframes(n_in)
    samples_in = [struct.unpack_from('<h', raw, i * 2 * ch_in)[0] / 32768.0 for i in range(n_in)]

print(f"Loaded source taunt: {len(samples_in)} samples, {sr_in} Hz, duration = {len(samples_in)/sr_in:.3f}s")

# High-quality Hermite cubic resampling to 44100 Hz
sr_out = 44100
dur_sec = len(samples_in) / sr_in
n_out = int(dur_sec * sr_out)

out_l = [0.0] * n_out
out_r = [0.0] * n_out
ratio = sr_in / sr_out

for i in range(n_out):
    src_pos = i * ratio
    idx = int(src_pos)
    frac = src_pos - idx
    
    p0 = samples_in[max(0, idx - 1)]
    p1 = samples_in[min(len(samples_in) - 1, idx)]
    p2 = samples_in[min(len(samples_in) - 1, idx + 1)]
    p3 = samples_in[min(len(samples_in) - 1, idx + 2)]
    
    c0 = p1
    c1 = 0.5 * (p2 - p0)
    c2 = p0 - 2.5 * p1 + 2.0 * p2 - 0.5 * p3
    c3 = 0.5 * (p3 - p0) + 1.5 * (p1 - p2)
    
    val = ((c3 * frac + c2) * frac + c1) * frac + c0
    
    # Clean stereo field
    out_l[i] = val
    out_r[i] = val

# Peak normalize to 0.92
peak = max(max(abs(l), abs(r)) for l, r in zip(out_l, out_r))
scale = 0.92 / peak if peak > 0 else 1.0

# 16-bit PCM Stereo
out_bytes_stereo = bytearray()
for l, r in zip(out_l, out_r):
    vl = max(-32768, min(32767, int(l * scale * 32767)))
    vr = max(-32768, min(32767, int(r * scale * 32767)))
    out_bytes_stereo.extend(struct.pack('<hh', vl, vr))

def save_wav(path, is_stereo=True):
    with wave.open(path, 'wb') as w:
        w.setnchannels(2 if is_stereo else 1)
        w.setsampwidth(2)
        w.setframerate(sr_out)
        w.writeframes(out_bytes_stereo)
    sz = os.path.getsize(path)
    print(f"Saved {path} ({n_out / sr_out:.3f}s, peak={peak:.2f} -> {scale*peak:.2f}, {sz} bytes)")

# Backup original taunt if not backed up
if not os.path.exists('sound/taunt_original_backup.wav') and os.path.exists('sound/taunt.wav'):
    shutil.copyfile('sound/taunt.wav', 'sound/taunt_original_backup.wav')
    print("Backed up original taunt to sound/taunt_original_backup.wav")

save_wav('sound/taunt.wav')
save_wav('sound/taunt_user_chosen.wav')
save_wav('sound/taunt_bacon.wav')

print("All taunt files successfully updated with user uploaded sound!")
