#!/usr/bin/env python3
"""Original coupler-inspired cue plus eSpeak NG speech. No modem/song recording."""
import math, random, struct, subprocess, tempfile, wave
from pathlib import Path
RATE = 32000
rng = random.Random(300)
samples = []
def tone(seconds, frequencies, amplitude=.13):
    n = round(seconds * RATE)
    for i in range(n):
        envelope = min(1, i / 160, (n-i) / 320)
        samples.append(amplitude * envelope * sum(math.sin(2*math.pi*f*i/RATE) for f in frequencies) / max(1,len(frequencies)))
def silence(seconds): samples.extend([0.] * round(seconds*RATE))
# Handset click, dial tone, then a sparse FSK-like exchange. A homage, not Bell 103 emulation.
tone(.035,[170,340],.2);silence(.09);tone(.4,[350,440],.1);silence(.12)
tone(.22,[2225],.10);silence(.15);tone(.20,[1270],.10)
for _ in range(16): tone(.025,[rng.choice([1070,1270,2025,2225])],.09)
silence(.16)
with tempfile.TemporaryDirectory() as tmp:
    speech=Path(tmp)/'speech.wav'
    subprocess.run(['espeak-ng','-v','en-us','-s','128','-p','24','-a','130','-w',str(speech),"Matt amp ready. Let's get serial."],check=True)
    with wave.open(str(speech)) as source:
        assert source.getnchannels()==1 and source.getsampwidth()==2
        rate=source.getframerate(); raw=source.readframes(source.getnframes())
    values=struct.unpack('<'+'h'*(len(raw)//2),raw)
    for i in range(round(len(values)*RATE/rate)):
        pos=i*rate/RATE; lo=int(pos); hi=min(lo+1,len(values)-1)
        samples.append(.65*((1-(pos-lo))*values[lo]+(pos-lo)*values[hi])/32768)
out=Path(__file__).resolve().parents[1]/'assets/tab-sounds/apple2.wav'
with wave.open(str(out),'wb') as target:
    target.setnchannels(1);target.setsampwidth(2);target.setframerate(RATE)
    target.writeframes(b''.join(struct.pack('<h',round(max(-1,min(1,x))*32767)) for x in samples))
print(f'{out.name}: {len(samples)/RATE:.2f}s')
