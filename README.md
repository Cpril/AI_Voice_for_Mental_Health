# AI Voice for Mental Health

A senior-project prototype for supportive AI conversations in two modes:

| Mode | Participants | Experience |
| --- | --- | --- |
| **Condition 1 · Solo** | One participant and the AI | A private conversation for reflection and support. |
| **Condition 2 · Two-person** | Two participants and a shared AI facilitator | A shared room where participants take turns and the AI helps facilitate the conversation. |

The current project focuses on **solo versus two-person interaction**, rather than reproducing the earlier study protocols. Voice uses GPT-Live; text chat is also available. The AI is a support companion, not a licensed therapist.

**Status:** Solo functionality has received preliminary manual testing. Automated tests cover both modes using mocked media/provider responses. **Two-person conversations across two physical devices still need end-to-end verification**, including audio routing, microphone permissions, reconnection, and shared controls. Passing tests does not establish that two-device voice works reliably.

## Run locally

Requires **Node.js 20.6 or later** and a browser with microphone/WebRTC support. The app uses built-in Node modules; no dependency installation is required.

1. Open a terminal in this project folder.
2. Create or edit `.env` with the settings below. An existing `.env` can be reused; keep your saved key.
3. Start the server:

   ```powershell
   npm start
   ```

4. Open [http://127.0.0.1:8787](http://127.0.0.1:8787), select a mode, and create a room.
5. Open the participant link and acknowledge the prototype instructions. Solo starts after A joins; two-person mode waits for both A and B.

```dotenv
OPENAI_API_KEY=your-api-key-here
CHAT_MODE=openai
API_MODEL=gpt-4.1-2025-04-14
LIVE_MODEL=gpt-live-1
LIVE_VOICE=marin
PORT=8787
HOST=127.0.0.1
```

`npm start` loads `.env`. Existing shell environment variables take precedence. Restart the server after configuration changes; create a new room to apply updated voice prompts.

- `CHAT_MODE=openai` enables AI text replies. `CHAT_MODE=demo` uses scripted text replies.
- **Voice always makes API calls**, regardless of `CHAT_MODE`, and requires a key with access to the configured voice model. Closing summaries for voice also use the text model.
- `HOST=127.0.0.1` allows connections from this computer only. Set `HOST=0.0.0.0` for local-network testing.
- Keep `.env` private. It is excluded by `.gitignore`; never put the key in browser files or participant links.

## Voice conversation flow

When a key is configured, room setup defaults to voice. After the room becomes active, voice connects automatically and requests browser microphone permission. **The microphone starts muted.** If the browser blocks connection or permission, use **Reconnect voice** and check the site permissions.

1. Listen to the introduction. The AI explains its role and how to decline a question.
2. Select **Start my speaking turn** and speak. The microphone meter shows local sound; incoming words appear in the live transcript.
3. Select **Microphone off · review**. Wait for the transcript to settle, then correct it if necessary.
4. Select **Send to AI** to submit the reviewed transcript and request a reply, or **Discard transcript** to remove the draft.
5. Continue at your own pace. The conversation history includes submitted participant messages and spoken AI replies.

Voice mode has one transcript review box; there is no separate typed-message box. Text mode uses a conventional message box and Send button.

### Topic changes

There are no Ready or Skip buttons. Say something like **“I don't want to answer that; let's talk about something else”**, then review and send the transcript as usual.

The controller recognizes common refusal/topic-change phrases and chooses another question. GPT-Live is also instructed to respect indirect refusals. Ordinary replies are generated naturally, with at most one follow-up or new question; the AI is not restricted to reading a fixed question list.

### Microphone feedback and controls

- The level meter confirms sound on this device; a received transcript provides evidence of provider transcription.
- After three seconds without detected sound, the page displays **“I can't hear you.”** Separate notices distinguish missing transcripts from delayed AI replies. These notices do not stop recording.
- Review mutes immediately. Hiding the tab also mutes and attempts to finish the turn for review. Leaving closes local media and sends a best-effort disconnect. Returning does not resume recording.
- **Disconnect voice** stays off until manually reconnected. **Pause** suspends the shared session; resume restores the session and attempts automatic voice connection with microphones muted.
- Room state is polled, normally every 1.5 seconds, so changes on the other device are not instantaneous.

### Stop and summary

Select **Stop session** to end audio and prepare a discussion summary below the conversation. In two-person mode, stopping ends the shared session and both participants can read the summary.

Summaries use **submitted participant messages only**, excluding unsent or discarded drafts. They preserve speaker attribution and should not invent diagnoses or conclusions. If the summary API fails, the session stays stopped and displays a clearly labeled recap of submitted messages. Repeated stop requests reuse the existing summary. The summary is included in the room's JSON export.

## Two-person / two-device setup — verification pending

A hosts the GPT-Live connection and must keep their tab open. B connects through a separate WebRTC peer connection. The intended routing lets both participants hear each other and the AI while sharing a single AI session. Use headphones and take turns; a speaking turn remains locked during transcript review.

For **same-network text testing**:

1. Set `HOST=0.0.0.0` and restart with `npm start`.
2. The terminal prints local-network addresses. Both devices must be on the same trusted Wi-Fi; allow Node through Windows Firewall on private networks if needed.
3. Open the computer's network address, such as `http://192.168.1.20:8787`, on the computer **before creating the room**, so participant links use that address.
4. Open participant A on the computer and participant B on the second device.

`localhost` or `127.0.0.1` on a phone refers to the phone, not the computer.

For **two-device voice**, microphone access requires a trusted **HTTPS** origin on the devices, or localhost on the device running the browser. A plain HTTP network address is suitable for text testing but may block microphones, even on the host computer. HTTPS hosting/tunneling is not configured by this app. Partner audio currently uses direct WebRTC with no STUN/TURN relay; arbitrary remote networks are not supported reliably.

**TODO: verify the complete two-device voice flow.** 

## Prompts and project structure

| File / folder | Purpose |
| --- | --- |
| `server.mjs` | HTTP server, room/token management, participant state, text AI calls, stop summaries, and exports. |
| `conversation.mjs` | Shared `SUPPORT_SYSTEM_PROMPT`, introduction, conversational policy, refusal detection, and alternate topics. |
| `voice-server.mjs` | GPT-Live session creation, voice instructions, partner signaling, turns, and transcript/message handling. |
| `public/` | Browser interface, voice client, microphone feedback, styling, and controls. |
| `study.mjs` | Original phase/question definitions still used for initial prompts and internal topic labels; also retains legacy protocol sequences. |
| `tests/` | Automated session, conversation, browser-flow, and media-control tests. |
| `study_design/study_design.md` | Study-design notes. |
| `protocol.md`, `measures.md`, `validation.md`, `VOICE.md` | Existing research/technical notes; portions describe the earlier replication structure and need updating. |

Edit **`SUPPORT_SYSTEM_PROMPT` in `conversation.mjs`** to change the current solo/duo AI persona. Both voice and text use it through `supportInstructions()`, with participant context and application controls appended. Closing summaries use separate task-specific instructions.

`study.mjs` supplies the initial question. The `TOPICS` list in `conversation.mjs` supplies alternative questions when the controller detects a refusal; it advances through that list in order. GPT-Live may generate other questions in ordinary conversation. New rooms do not automatically walk through the full legacy phase sequence, so topic coverage is not currently standardized.

## Data and limitations

Rooms, messages, transcripts, and summaries live in server memory until deletion or server restart. The room-creation view can export JSON or delete the room; downloaded exports remain separate copies. Participant and room-management links grant access and should remain private.

The app does not save raw audio. Audio is sent to OpenAI while a microphone is on; in two-person mode the other participant also hears it. Correcting or discarding a transcript cannot retract audio already heard or processed. API calls use `store: false`, which is not a guarantee of zero provider retention. Exports include transcript fragments and approved messages, but not API keys or partner SDP.

The prototype has no durable storage, account-based access, or production deployment configuration. Use fictional details during development.

## Unit test

```powershell
npm test
```

Tests cover solo/duo joining, topic changes, shared prompt usage, automatic voice connection, microphone cleanup/muting, transcript streaming, summary generation/fallback, authentication, exports, and legacy protocol behavior. Media and provider integrations are mocked. A real text API request and configured model access were checked during development; that does not verify a complete voice session or two-device audio.

## TODO

- [ ] **Verify two-person voice on two physical devices** 
- [ ] Verify solo voice and feedback consistently across target browsers, including permission denial, transcription delays, and AI response failures.
- [ ] AI should have knowledge about mental health, psychology, socielogy, and thinking regarding that. 
- [ ] Outline an experiment procedure, consent information.
- [ ] Data handling (storage/deletion/any plans)
- [ ] UI fixes (there's some unnessansary or displaced buttons, text boxes, and broken links)
