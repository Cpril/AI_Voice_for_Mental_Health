# Verification — October 6, 2026

`node --test tests/*.test.mjs`: 6 tests passed, 0 failed.

Automated coverage: all PS/DS/BP phase sequences, two-person Ready/Skip gating, completion, researcher-only export, token authentication, demo acknowledgment, stale-phase writes, pause/resume, stop, deletion, readiness invalidation after new discussion, mocked DS Driver instructions, Analyzer context feedback, model/settings, BP no-provider behavior, key exclusion from exports, and recovery after provider failure.

Browser verification: created a PS room, joined A/B in separate tabs, sent fictional messages from each, verified shared conversation display, and advanced from rapport to autonomy disclosure only after both Ready actions. Layout inspected and captured in `preview.png`. Researcher view left open with local server running.

Not verified: real paid OpenAI requests, live model output fidelity, remote participation, full questionnaires/scoring, participant research consent, Telegram equivalence, or efficacy. The protocol and fidelity register track these separately. No real participant data was used.

## GPT Live voice extension — October 7, 2026

`node --test tests/*.test.mjs`: 15 tests passed, 0 failed. Voice coverage includes mocked Live SDP exchange, speaker locking, private draft review, transcript corrections and redaction, event deduplication, signaling isolation, pause during startup, microphone cleanup, cancellation during permission requests, and shared audio routing without Guide feedback.

Browser verification: selected Voice · GPT-Live, created a PS room, joined both participants using fictional-data acknowledgments, and inspected participant voice controls and text fallback. Screenshot: voice-preview.png. No microphone permission was requested and no participant audio was transmitted.

Real provider verification: authenticated GET of the gpt-live-1 model returned HTTP 200. This confirms model access, but does not verify a real Live WebRTC handshake, microphone conversation, playback, or model adherence. Those still require a live trial.
