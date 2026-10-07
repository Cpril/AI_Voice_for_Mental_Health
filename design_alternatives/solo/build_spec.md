# Build specification — proposed prototype

No provider integration or production service is implemented in this folder yet.

## Components and boundaries

1. Browser client: microphone permission, explicit recording indicator, submit/stop, playback interruption, editable transcript, pause/skip/continue controls, and final record review.
2. Speech input: transcribe a submitted audio segment; show editable text before interpretation when uncertain. Record transcription corrections separately from emotional reflection.
3. Server controller: enforce assigned condition, permitted states, turn limits, and session stop. Never rely on a single general model prompt to maintain experimental separation.
4. Response generation: receive only the permitted phase instructions, approved transcript, and minimal context. BP can use fixed prompts without generation beyond essential transcription clarification.
5. Context record: maintain user statements with source turn IDs; label generated interpretations and retain only approved versions in a final record. Summaries must not become unverified facts on later turns.
6. Speech output: use a single configured synthetic voice across arms. Record provider, model, voice, prompt version, settings, and release/version information where available.
7. Research export: pseudonymous, consent-aware event and survey records. Keep identity and consent linkage outside conversational exports.

Freeze model/voice/prompt versions for a study batch. If a provider change makes freezing impossible, document the change and affected sessions. API keys belong on the server and must never appear in browser code or participant exports. Choose provider retention settings and disclose actual processing; local deletion alone does not prove provider deletion.

## Minimal event structure

Every event: `schema_version`, `session_id`, `participant_id`, `condition`, `event_id`, `timestamp_utc`, `phase`, `event_type`, `prompt_version`.

Examples of event types: `session_started`, `phase_entered`, `transcript_approved`, `transcript_corrected`, `response_delivered`, `phase_skipped`, `summary_corrected`, `summary_approved`, `technical_failure`, `session_stopped`, `session_completed`.

Content payloads, where consent permits: approved text, source turn IDs, origin (`user` or `ai_suggestion`), approval status. Technical payloads: latency milliseconds, segment duration, model/voice identifiers, error category. Keep audio separate and default to no durable raw-audio storage unless explicitly justified and consented; distinguish transient processing from retention.

Survey records: participant/session ID, timepoint, item ID, numeric response or null, survey version, collection timestamp. Allocation records: assignment unit, condition, allocation schedule version, assignment timestamp; store concealment information outside the participant-facing client.

## Acceptance criteria before a participant pilot

- BP never introduces personalized support or preparation; DS never rehearses communication; CP makes preparation optional. Inspect representative model outputs for leakage.
- Skip and stop work from every state, including during recording and speech playback. Stopping cancels pending generation and prevents subsequent collection.
- Misheard words can be corrected before they influence generated responses. No accidental open microphone survives a pause or navigation away.
- A rejected interpretation is excluded from future context and final output; final statements can be traced to approved source turns.
- No plan is sent externally. The user can discard the record and finish without saving.
- Consent-based retention and deletion work across primary stores, exports, and any configured backups according to the approved policy.
- Session interruption, denied microphone access, network failure, and provider timeout have recoverable behavior and recorded deviations.
- Trial exports preserve missing survey values and arm assignment without exposing names, keys, or unconsented raw content.

Use synthetic scenarios for these checks before introducing real participant data. A pilot can evaluate usability and arm separation; it cannot establish mental-health efficacy.
