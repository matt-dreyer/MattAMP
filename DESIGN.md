# Approved MattAMP design

Preserve the approved MattAMP layout and interactions described below. The implementation in `src/` is the durable design reference.

Shell #232b34, titlebar #303b46, inset #111b23, edge #536271, foreground #e1e8ed, secondary #a8b9c7, accent #9ccab0, warning #dfb574. System font, 12–14px controls; monospace only for measurements. Compact native desktop controls. No bright panels. The user-requested optional live background is the exception to avoiding looping decoration: slow, low-contrast blue-green particle flow, water waves or a sparse drifting starfield behind the app controls. The radio station card uses a 62% opaque inset tint so ambient motion can show through while its text and artwork stay fully opaque. Preserve readability and pointer access; keep provider and video surfaces unchanged. Hide and stop the effect when off, hidden, in bug mode or under reduced motion.

Sidecar: media left, telemetry right. Stack: media above telemetry. DI.FM/Podcasts switch in the media panel. Full, compact and 56px bug states. Bug uses the audio-lines mark with a network dot, click to restore. Real YouTube embed retains native controls and visible viewport. Backend states drive play/error/availability labels.
