# GPT-Live voice extension

## Configuration

Node.js 20+, a browser with WebRTC/microphone support, and localhost or HTTPS. Set OPENAI_API_KEY on the server through your existing environment or secret manager. No dependency installation is needed. Start with node server.mjs.

Optional settings: LIVE_MODEL (default gpt-live-1), LIVE_VOICE (default marin), API_MODEL (existing Analyzer, default gpt-4.1-2025-04-14). Text mode still follows CHAT_MODE. Voice is a paid API path regardless of CHAT_MODE. Model access must be available on the configured API account.

Choose Voice when creating the room. A hosts the single GPT-Live call; B connects through a separate peer audio link. If either disconnects, both should reconnect. Microphone access is requested only after Connect voice. A must keep the tab open. Both partners use headphones to avoid physical speaker feedback. Text fallback remains available.

## Audio architecture

A's browser mixes A and B microphone tracks into one WebRTC track sent to GPT-Live. Live output goes to A's speakers and into the audio return to B together with A's microphone. The guide's audio is not mixed into the Live input. B hears A and Guide; A hears B and Guide. The server brokers partner SDP signals but never stores raw audio.

The microphone is off until the speaker obtains the room's exclusive speaking turn. Finish switches it off immediately. The turn remains locked while the participant reviews the draft, preventing simultaneous attribution to another speaker. This is application turn attribution, not biometric speaker recognition. It cannot identify an additional person speaking into the same microphone.

## Live API contract

The authenticated backend POSTs a JSON session/transport request to https://api.openai.com/v1/live/sessions and returns only the SDP answer/session ID to A. The startup session contains the condition/phase policy, bounded recent approved history, configured voice, and store:false. The API key stays on the server. Data-channel permissions restrict the application to context/commentary and input-mute controls. Phase advancement still occurs in the application after both participants Ready or Skip.

Live instructions are fixed at startup; phase changes are appended as context/instructions. Approved or corrected text is appended as silent context. The model is instructed to stay silent during partner disclosure and speak on guide requests/application prompts. Prompt adherence and exact spoken wording still need a live-condition audit; API acknowledgment does not prove exact speech delivery. BP voice remains a modality extension requiring separate validation.

Input/output transcript delta events are accumulated in delivery order; Live does not supply final-turn markers for them. A forwards reported fragments to the authenticated room. Input drafts are shown only to the current speaker until shared; both partners already heard the audio. Wait for the draft to settle, then correct it before sharing. Input outside a speaking turn is ignored. Fragment event IDs are deduplicated. Exports label their provenance as browser_forwarded_live, not independently verified server transcripts.

## Data and controls

Exports record modality, Live model/voice, speaker turn IDs, timestamped transcript fragments, and user-approved text/corrections. They do not include API credentials or partner SDP. No raw audio or provider recording is saved by this app; store:false does not eliminate all provider processing/retention. Discard removes that draft's input text from local transcript-fragment records, retaining redacted metadata; it cannot retract audio already heard or processed by OpenAI. Corrections change the shared research record and later context, not what was previously heard.

Local pause/stop/disconnect stop tracks and close peer connections. The other browser reacts at its next state poll, normally within 1.5 seconds. Page exit immediately closes local media; the partner connection must reconnect if lost. No unattended microphone auto-resume is implemented. Provider failures preserve the study phase and offer reconnect/retry.

## Replication implications and limits

Record modality separately from condition. Keep model/voice fixed across PS/DS/BP voice arms. Voice introduces a different model, spoken delivery, turn-taking, and transcript uncertainty. Do not pool text and voice as equivalent observations in the original replication analysis. Randomize modality separately if studying its effect; voluntary modality selection is not randomized.

The prototype is still loopback-only. Partner WebRTC uses direct local candidates and no STUN/TURN relay; arbitrary remote-network participation requires a reviewed HTTPS deployment and relay configuration. Full consent, instruments, source wording, and research procedures remain as documented in the fidelity register.

## Official references

- [Create a Live WebRTC session](https://developers.openai.com/api/reference/resources/live/methods/create)
- [Live client/server event contract](https://developers.openai.com/api/reference/resources/live/primary-websocket)
- [GPT-Live prompting](https://developers.openai.com/api/docs/guides/live-prompting)

This intentionally uses the dedicated GPT-Live endpoint rather than Realtime session/update event shapes.
