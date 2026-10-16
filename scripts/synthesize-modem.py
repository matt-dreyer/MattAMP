"""Original, shortened dial-up handshake homage. No sampled recordings or network access."""
from pathlib import Path
import math
import random
import struct
import wave

rate = 32000
seconds = 6.4
rng = random.Random(56000)
samples = []
previous_noise = 0
for i in range(int(rate * seconds)):
    t = i / rate
    sine = lambda hz: math.sin(2 * math.pi * hz * t)
    if t < .45:
        value = .19 * (sine(350) + sine(440))
    elif t < 1.2:
        # A few DTMF keypresses, with short gaps between digits.
        key = min(4, int((t - .45) / .15))
        low, high = [(697, 1209), (770, 1336), (852, 1477), (941, 1336), (697, 1477)][key]
        phase = (t - .45) % .15
        value = .20 * (sine(low) + sine(high)) if phase < .10 else 0
    elif t < 2.25:
        # Answer tone and periodic phase reversals.
        phase = math.pi * int((t - 1.2) / .45)
        value = .29 * math.sin(2 * math.pi * 2100 * t + phase) * (1 + .12 * sine(15))
    elif t < 3.1:
        value = .25 * math.sin(2 * math.pi * 1650 * t + 4 * sine(19)) + .10 * sine(2250)
    elif t < 3.8:
        hz = 1200 if int(t * 24) % 2 else 2400
        value = .25 * sine(hz) + .07 * sine(1800)
    elif t < 5.65:
        # A band-limited multicarrier training burst, with a restrained noise layer.
        noise = rng.uniform(-1, 1)
        high = noise - previous_noise
        previous_noise = noise
        value = sum(.065 * math.sin(2 * math.pi * hz * t + 2 * sine(7 + j * 3)) for j, hz in enumerate([900, 1380, 1810, 2240, 2670])) + .055 * high
        value *= .7 + .3 * math.sin(2 * math.pi * 8 * t) ** 2
    else:
        value = .16 * sine(1800) + .08 * sine(2400)
    # Soften every section boundary and the tail: familiar racket, no sharp clicks.
    boundaries = [0, .45, 1.2, 2.25, 3.1, 3.8, 5.65, seconds]
    envelope = min(1, min(abs(t - edge) for edge in boundaries) / .012)
    envelope *= min(1, (seconds - t) / .24)
    samples.append(struct.pack('<h', round(max(-.7, min(.7, value * envelope)) * 32767)))
path = Path(__file__).resolve().parents[1] / 'assets/tab-sounds/modem.wav'
with wave.open(str(path), 'wb') as output:
    output.setnchannels(1)
    output.setsampwidth(2)
    output.setframerate(rate)
    output.writeframes(b''.join(samples))
print(f'Wrote {seconds}s original modem cue: {path.name}')
