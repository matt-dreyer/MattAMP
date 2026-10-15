# MattAMP tab voices

Short synthetic stock-voice clips generated for MattAMP on 2026-10-14 with
[edge-tts](https://github.com/rany2/edge-tts) and Microsoft Edge's speech service.
No celebrity recording, voice sample, or voice clone was used.

| File | Text | Stock voice | Rate | Pitch |
| --- | --- | --- | --- | --- |
| hell-yeah.mp3 | HELL YEAH! | en-US-EricNeural | -20% | -24Hz |
| send-it.mp3 | Send it! | en-US-AriaNeural | +12% | +10Hz |
| meh.mp3 | Meh. | en-US-ChristopherNeural | -18% | -10Hz |
| yeah.mp3 | Yeah! | en-US-GuyNeural | -40% | -8Hz |

Leading/trailing silence was trimmed with FFmpeg. The radio and SkiCams clips were additionally
stretched with `atempo=0.72` (28% slower without changing pitch). All clips were normalized to -18 LUFS / -2 dBTP,
with a short fade-in and 80ms tail, then encoded as 24kHz mono 64kbps MP3.
The Game clip uses `atempo=0.88`, a 65Hz high-pass, +4dB at 150Hz, +2dB at
2.3kHz, 3:1 compression, gentle tanh saturation, and a quiet 65ms slapback before
the same loudness normalization. This gives it a heavier action-hero delivery
without raising its playback level.

They are bundled media: no speech service or Python package is used at runtime.
Service-generated output is not covered by edge-tts's code license.
